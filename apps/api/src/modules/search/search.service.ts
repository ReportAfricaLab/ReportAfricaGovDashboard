import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportEntity, UserEntity } from '../../database/entities';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(ReportEntity) private readonly reportRepo: Repository<ReportEntity>,
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
  ) {}

  async searchReports(query: string, country?: string, category?: string, page = 1, limit = 20) {
    const qb = this.reportRepo.createQueryBuilder('report')
      .leftJoinAndSelect('report.author', 'author')
      .where('(report.title ILIKE :q OR report.description ILIKE :q)', { q: `%${query}%` });

    if (country) qb.andWhere('report.country = :country', { country });
    if (category) qb.andWhere('report.category = :category', { category });

    const [results, total] = await qb
      .orderBy('report.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { results, total, page, totalPages: Math.ceil(total / limit) };
  }

  async searchUsers(query: string, page = 1, limit = 20) {
    const [results, total] = await this.userRepo.findAndCount({
      where: [
        { username: query ? undefined : undefined },
      ],
      order: { trustScore: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Use query builder for ILIKE
    const qb = this.userRepo.createQueryBuilder('user')
      .where('(user.username ILIKE :q OR user.displayName ILIKE :q)', { q: `%${query}%` })
      .orderBy('user.trustScore', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [users, count] = await qb.getManyAndCount();
    return { results: users, total: count, page };
  }

  async getTrending(country: string, hours = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.reportRepo
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.author', 'author')
      .where('report.country = :country', { country })
      .andWhere('report.createdAt > :since', { since })
      .orderBy('report.upvotes + report.commentCount + report.viewCount', 'DESC')
      .take(20)
      .getMany();
  }

  async getSuggestions(query: string, country?: string) {
    const reports = await this.reportRepo
      .createQueryBuilder('report')
      .select('report.title')
      .where('report.title ILIKE :q', { q: `%${query}%` })
      .andWhere(country ? 'report.country = :country' : '1=1', { country })
      .orderBy('report.createdAt', 'DESC')
      .take(5)
      .getMany();

    return reports.map((r) => r.title);
  }
}
