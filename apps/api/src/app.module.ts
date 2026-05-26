import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { TrustModule } from './modules/trust/trust.module';
import { VerificationModule } from './modules/verification/verification.module';
import { DonationsModule } from './modules/donations/donations.module';
import { MediaLicensingModule } from './modules/media-licensing/media-licensing.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST', 'localhost'),
        port: config.get<number>('DATABASE_PORT', 5432),
        username: config.get('DATABASE_USER', 'postgres'),
        password: config.get('DATABASE_PASSWORD', ''),
        database: config.get('DATABASE_NAME', 'reportafrica'),
        autoLoadEntities: true,
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
    }),
    AuthModule,
    UsersModule,
    ReportsModule,
    ModerationModule,
    TrustModule,
    VerificationModule,
    DonationsModule,
    MediaLicensingModule,
    AnalyticsModule,
  ],
})
export class AppModule {}
