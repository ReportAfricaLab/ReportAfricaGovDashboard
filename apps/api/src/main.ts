import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as helmet from 'helmet';
const cookieParser = require('cookie-parser');
import { DataSource } from 'typeorm';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { SanitizeInterceptor } from './common/interceptors/sanitize.interceptor';
import { initSentry, SentryExceptionFilter } from './common/sentry';

async function bootstrap() {
  initSentry();

  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create(AppModule, {
    logger: isProduction ? ['error', 'warn', 'log'] : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Cookie parser (for httpOnly refresh token)
  app.use(cookieParser());

  // Security headers
  app.use(helmet.default({
    contentSecurityPolicy: false, // CSP handled by Vercel/Nginx for frontend
    crossOriginEmbedderPolicy: false,
    hsts: { maxAge: 31536000, includeSubDomains: true },
    frameguard: { action: 'deny' },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }));

  app.setGlobalPrefix('api/v1');

  // CORS — strict in production, permissive in dev
  app.enableCors({
    origin: isProduction
      ? ['https://reportafrica.africa', /\.reportafrica\.africa$/, 'https://reportafrica.com', /\.reportafrica\.com$/, 'https://reportafrica-web.vercel.app', /\.vercel\.app$/, 'https://34-242-14-140.nip.io']
      : ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 3600,
  });

  // Input validation & sanitization
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  // Body size limit (10MB for media metadata, actual uploads go to S3)
  const expressApp = app.getHttpAdapter().getInstance();
  const bodyParser = require('express').json;
  expressApp.use(bodyParser({ limit: '10mb' }));

  // Logging & error tracking
  app.useGlobalInterceptors(new LoggingInterceptor(), new SanitizeInterceptor());
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryExceptionFilter(httpAdapterHost.httpAdapter));

  const port = process.env.PORT || 3001;
  const logger = new Logger('Bootstrap');

  // Redis adapter for Socket.IO (required for PM2 cluster mode)
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = Number(process.env.REDIS_PORT) || 6379;
  try {
    const pubClient = new Redis({ host: redisHost, port: redisPort });
    const subClient = pubClient.duplicate();
    const redisIoAdapter = new IoAdapter(app);
    (redisIoAdapter as any).createIOServer = function (port: number, options?: any) {
      const server = IoAdapter.prototype.createIOServer.call(this, port, options);
      server.adapter(createAdapter(pubClient, subClient));
      return server;
    };
    app.useWebSocketAdapter(redisIoAdapter);
    logger.log(`Socket.IO Redis adapter connected (${redisHost}:${redisPort})`);
  } catch (err) {
    logger.warn('Redis adapter setup failed: ' + (err as any).message);
  }

  await app.listen(port);

  logger.log(`ReportAfrica API running on port ${port} [${process.env.NODE_ENV || 'development'}]`);

  // Run pending migrations for columns that were added to entities but not synced in production
  if (isProduction) {
    try {
      const ds = app.get(DataSource);
      await ds.query(`
        ALTER TABLE livestreams ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR DEFAULT NULL;
        ALTER TABLE livestreams ADD COLUMN IF NOT EXISTS recording_url VARCHAR DEFAULT NULL;
        ALTER TABLE livestreams ADD COLUMN IF NOT EXISTS election_id VARCHAR DEFAULT NULL;
        ALTER TABLE livestreams ADD COLUMN IF NOT EXISTS election_name VARCHAR DEFAULT NULL;
        ALTER TABLE livestreams ADD COLUMN IF NOT EXISTS election_state VARCHAR DEFAULT NULL;
        ALTER TABLE livestreams ADD COLUMN IF NOT EXISTS election_polling_unit VARCHAR DEFAULT NULL;
        ALTER TABLE reports ALTER COLUMN author_id DROP NOT NULL;
        ALTER TABLE reports ADD COLUMN IF NOT EXISTS content_hash VARCHAR DEFAULT NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR DEFAULT 'free';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires TIMESTAMP DEFAULT NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_certified BOOLEAN DEFAULT FALSE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR DEFAULT NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL;
        ALTER TABLE reports ADD COLUMN IF NOT EXISTS is_breaking BOOLEAN DEFAULT FALSE;
        ALTER TABLE reports ADD COLUMN IF NOT EXISTS event_type VARCHAR DEFAULT NULL;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS report_id UUID DEFAULT NULL;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS reporter_id UUID DEFAULT NULL;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS beneficiary_amount DECIMAL(12,2) DEFAULT NULL;
        ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS agreed_to_platform_fee BOOLEAN DEFAULT FALSE;
        UPDATE courses SET usd_price=5 WHERE sort_order=1 AND usd_price!=5;
        UPDATE courses SET usd_price=6 WHERE sort_order=2 AND usd_price!=6;
        UPDATE courses SET usd_price=8 WHERE sort_order=3 AND usd_price!=8;
        UPDATE courses SET usd_price=9 WHERE sort_order=4 AND usd_price!=9;
        UPDATE courses SET usd_price=13, sort_order=6 WHERE sort_order=5 AND title LIKE '%Live%';
        INSERT INTO courses (id, title, icon, usd_price, description, is_published, sort_order) SELECT gen_random_uuid(), 'Multimedia Storytelling & News Writing', 'W', 10, 'Learn professional news writing, interviewing, storytelling, headline creation, and audience engagement.', true, 5 WHERE NOT EXISTS (SELECT 1 FROM courses WHERE sort_order=5 AND title LIKE '%Multimedia%');
        CREATE TABLE IF NOT EXISTS modules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
          title VARCHAR NOT NULL,
          description TEXT DEFAULT '',
          sort_order INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW()
        );
        ALTER TABLE lessons ADD COLUMN IF NOT EXISTS module_id UUID DEFAULT NULL;
        ALTER TABLE lessons ADD COLUMN IF NOT EXISTS type VARCHAR DEFAULT 'video';
        ALTER TABLE lessons ADD COLUMN IF NOT EXISTS content TEXT DEFAULT NULL;
        ALTER TABLE lessons ADD COLUMN IF NOT EXISTS pdf_url VARCHAR DEFAULT NULL;
        CREATE TABLE IF NOT EXISTS quizzes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
          title VARCHAR DEFAULT 'Quiz',
          passing_score INT DEFAULT 70,
          max_attempts INT DEFAULT 3,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS quiz_questions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
          question_text TEXT NOT NULL,
          options JSONB DEFAULT '[]',
          correct_option_index INT NOT NULL,
          sort_order INT DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS quiz_attempts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id),
          quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
          score INT NOT NULL,
          passed BOOLEAN DEFAULT FALSE,
          answers JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
        CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON quiz_attempts(quiz_id);
        CREATE TABLE IF NOT EXISTS badges (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id),
          badge_type VARCHAR NOT NULL,
          course_id UUID DEFAULT NULL,
          title VARCHAR,
          icon VARCHAR,
          earned_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_badges_user ON badges(user_id);
        CREATE TABLE IF NOT EXISTS challenges (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          business_id UUID NOT NULL,
          creator_id UUID REFERENCES users(id),
          title VARCHAR NOT NULL,
          description TEXT NOT NULL,
          product_name VARCHAR NOT NULL,
          product_image_url VARCHAR DEFAULT NULL,
          pot_amount DECIMAL(12,2) NOT NULL,
          currency VARCHAR(3) NOT NULL,
          country VARCHAR(2) NOT NULL,
          deadline TIMESTAMP NOT NULL,
          status VARCHAR DEFAULT 'pending_payment',
          payment_reference VARCHAR DEFAULT NULL,
          entry_count INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_challenges_country ON challenges(country);
        CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
        CREATE TABLE IF NOT EXISTS challenge_entries (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
          reporter_id UUID REFERENCES users(id),
          report_id UUID NOT NULL,
          view_count INT DEFAULT 0,
          rank INT DEFAULT NULL,
          payout_amount DECIMAL(12,2) DEFAULT 0,
          paid_out BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_challenge_entries_challenge ON challenge_entries(challenge_id);
        CREATE INDEX IF NOT EXISTS idx_challenge_entries_reporter ON challenge_entries(reporter_id);
        CREATE TABLE IF NOT EXISTS business_responses (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
          report_id UUID NOT NULL,
          text TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_business_responses_report ON business_responses(report_id);
        CREATE INDEX IF NOT EXISTS idx_business_responses_business ON business_responses(business_id);
        CREATE TABLE IF NOT EXISTS trips (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id),
          shared_with_user_id UUID REFERENCES users(id),
          start_lat DECIMAL(10,7) NOT NULL,
          start_lng DECIMAL(10,7) NOT NULL,
          current_lat DECIMAL(10,7) NOT NULL,
          current_lng DECIMAL(10,7) NOT NULL,
          destination VARCHAR DEFAULT NULL,
          is_active BOOLEAN DEFAULT TRUE,
          started_at TIMESTAMP DEFAULT NOW(),
          ended_at TIMESTAMP DEFAULT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_trips_user ON trips(user_id);
        CREATE INDEX IF NOT EXISTS idx_trips_shared ON trips(shared_with_user_id);
        CREATE INDEX IF NOT EXISTS idx_trips_active ON trips(is_active);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR DEFAULT 'active';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS gov_jurisdiction_country VARCHAR DEFAULT NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS gov_jurisdiction_state VARCHAR DEFAULT NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS gov_trial_start TIMESTAMP DEFAULT NULL;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS gov_trial_end TIMESTAMP DEFAULT NULL;
        ALTER TABLE election_reports ADD COLUMN IF NOT EXISTS verification_status VARCHAR DEFAULT 'unverified';
        ALTER TABLE election_reports ADD COLUMN IF NOT EXISTS over_voting_flag BOOLEAN DEFAULT FALSE;
        ALTER TABLE election_reports ADD COLUMN IF NOT EXISTS result_hash VARCHAR DEFAULT NULL;
        ALTER TABLE election_reports ADD COLUMN IF NOT EXISTS prev_hash VARCHAR DEFAULT NULL;
        ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_headline VARCHAR DEFAULT NULL;
        ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_moderation_score INT DEFAULT NULL;
        ALTER TABLE reports ADD COLUMN IF NOT EXISTS ai_flags VARCHAR DEFAULT NULL;
        CREATE TABLE IF NOT EXISTS notification_preferences (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID UNIQUE REFERENCES users(id),
          min_severity VARCHAR DEFAULT 'low',
          categories JSONB DEFAULT '[]',
          quiet_hours_start INT DEFAULT 23,
          quiet_hours_end INT DEFAULT 6,
          max_per_hour INT DEFAULT 5,
          last_sent_count INT DEFAULT 0,
          last_sent_hour VARCHAR DEFAULT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_notif_prefs_user ON notification_preferences(user_id);
        CREATE TABLE IF NOT EXISTS observers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          org_name VARCHAR DEFAULT NULL,
          country VARCHAR(2) NOT NULL,
          tier VARCHAR DEFAULT 'individual',
          accreditation_url VARCHAR DEFAULT NULL,
          status VARCHAR DEFAULT 'observer_pending',
          seats INT DEFAULT 1,
          paid_at TIMESTAMP DEFAULT NULL,
          expires_at TIMESTAMP DEFAULT NULL,
          paystack_reference VARCHAR DEFAULT NULL,
          invited_by UUID DEFAULT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_observers_user ON observers(user_id);
        CREATE INDEX IF NOT EXISTS idx_observers_country ON observers(country);
        CREATE INDEX IF NOT EXISTS idx_observers_status ON observers(status);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS gov_proof_url VARCHAR DEFAULT NULL;
      `);
      logger.log('Startup migration: livestreams columns verified');
    } catch (err) {
      logger.warn('Startup migration warning: ' + (err as any).message);
    }
  }
}
bootstrap();
