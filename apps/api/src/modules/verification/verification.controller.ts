import { Controller, Post, Get, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsString, IsIn, IsOptional } from 'class-validator';
import { VerificationService } from './verification.service';

class VoteDto {
  @IsString()
  @IsIn(['confirm', 'dispute'])
  vote: 'confirm' | 'dispute';

  @IsString()
  @IsOptional()
  comment?: string;
}

@Controller('reports/:reportId/verify')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  vote(@Param('reportId') reportId: string, @Request() req: any, @Body() dto: VoteDto) {
    return this.verificationService.vote(reportId, req.user.id, dto.vote, dto.comment);
  }

  @Get()
  getStats(@Param('reportId') reportId: string) {
    return this.verificationService.getReportVerificationStats(reportId);
  }

  @Get('disputes')
  getDisputes(@Param('reportId') reportId: string) {
    return this.verificationService.getDisputeNotes(reportId);
  }
}
