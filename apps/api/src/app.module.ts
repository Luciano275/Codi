import { Module } from '@nestjs/common';
import { PrismaModule } from '@codi/database';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'path';
import { config } from '@codi/config';
import { AuthModule } from './auth/auth.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { CoursesModule } from './courses/courses.module';
import { RankingModule } from './ranking/ranking.module';
import { AdminModule } from './admin/admin.module';
import { PlaygroundModule } from './playground/playground.module';
import { ProblemsModule } from './problems/problems.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(process.cwd(), '../../.env'),
      load: [() => config]
    }),
    PrismaModule,
    AuthModule,
    SubmissionsModule,
    CoursesModule,
    RankingModule,
    AdminModule,
    PlaygroundModule,
    ProblemsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
