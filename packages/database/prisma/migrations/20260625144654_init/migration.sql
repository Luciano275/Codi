-- CreateEnum
CREATE TYPE "CmsUserSource" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'TEACHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('THEORY', 'PRACTICE', 'CHALLENGE', 'EXAM');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'COMPILING', 'EVALUATING', 'ACCEPTED', 'WRONG_ANSWER', 'RUNTIME_ERROR', 'TIME_LIMIT_EXCEEDED', 'MEMORY_LIMIT_EXCEEDED', 'COMPILATION_ERROR');

-- CreateEnum
CREATE TYPE "LeagueName" AS ENUM ('BRONCE', 'PLATA', 'ORO', 'PLATINO', 'DIAMANTE', 'LEGENDARIO');

-- CreateTable
CREATE TABLE "codi_user" (
    "id" TEXT NOT NULL,
    "cmsUserId" INTEGER NOT NULL,
    "cmsSource" "CmsUserSource" NOT NULL,
    "passwordHash" TEXT,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "xp" INTEGER NOT NULL DEFAULT 0,
    "gems" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codi_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codi_course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "region" TEXT NOT NULL,
    "xpReward" INTEGER NOT NULL DEFAULT 100,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codi_course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codi_module" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codi_module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codi_lesson" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "LessonType" NOT NULL,
    "content" JSONB,
    "xpReward" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codi_lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codi_problem" (
    "id" TEXT NOT NULL,
    "cmsTaskId" INTEGER NOT NULL,
    "cmsTaskName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'EASY',
    "xpReward" INTEGER NOT NULL DEFAULT 50,
    "lessonId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codi_problem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codi_submission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'python',
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "score" DOUBLE PRECISION,
    "cmsSubmissionId" INTEGER,
    "cmsResults" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "evaluatedAt" TIMESTAMP(3),

    CONSTRAINT "codi_submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codi_achievement" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT,
    "xpReward" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "codi_achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codi_user_achievement" (
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codi_user_achievement_pkey" PRIMARY KEY ("userId","achievementId")
);

-- CreateTable
CREATE TABLE "codi_league" (
    "id" TEXT NOT NULL,
    "name" "LeagueName" NOT NULL,
    "minXp" INTEGER NOT NULL DEFAULT 0,
    "maxXp" INTEGER,
    "order" INTEGER NOT NULL,

    CONSTRAINT "codi_league_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codi_weekly_ranking" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER,
    "leagueId" TEXT NOT NULL,

    CONSTRAINT "codi_weekly_ranking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codi_daily_mission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "target" INTEGER NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "xpReward" INTEGER NOT NULL DEFAULT 50,
    "claimed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "codi_daily_mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codi_exam" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "courseId" TEXT,
    "duration" INTEGER NOT NULL,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "xpReward" INTEGER NOT NULL DEFAULT 200,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "codi_exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codi_exam_problem" (
    "examId" TEXT NOT NULL,
    "problemId" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 100,
    "order" INTEGER NOT NULL,

    CONSTRAINT "codi_exam_problem_pkey" PRIMARY KEY ("examId","problemId")
);

-- CreateTable
CREATE TABLE "codi_exam_attempt" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endAt" TIMESTAMP(3),
    "score" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codi_exam_attempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codi_exam_answer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "examProblemId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "score" DOUBLE PRECISION,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codi_exam_answer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "codi_notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "codi_notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "codi_user_username_key" ON "codi_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "codi_user_cmsUserId_cmsSource_key" ON "codi_user"("cmsUserId", "cmsSource");

-- CreateIndex
CREATE UNIQUE INDEX "codi_course_slug_key" ON "codi_course"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "codi_problem_cmsTaskId_key" ON "codi_problem"("cmsTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "codi_submission_cmsSubmissionId_key" ON "codi_submission"("cmsSubmissionId");

-- CreateIndex
CREATE UNIQUE INDEX "codi_achievement_code_key" ON "codi_achievement"("code");

-- CreateIndex
CREATE UNIQUE INDEX "codi_league_name_key" ON "codi_league"("name");

-- CreateIndex
CREATE UNIQUE INDEX "codi_weekly_ranking_userId_weekStart_key" ON "codi_weekly_ranking"("userId", "weekStart");

-- CreateIndex
CREATE UNIQUE INDEX "codi_daily_mission_userId_date_type_key" ON "codi_daily_mission"("userId", "date", "type");

-- AddForeignKey
ALTER TABLE "codi_module" ADD CONSTRAINT "codi_module_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "codi_course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codi_lesson" ADD CONSTRAINT "codi_lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "codi_module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codi_problem" ADD CONSTRAINT "codi_problem_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "codi_lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codi_submission" ADD CONSTRAINT "codi_submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "codi_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codi_submission" ADD CONSTRAINT "codi_submission_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "codi_problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codi_user_achievement" ADD CONSTRAINT "codi_user_achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "codi_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codi_user_achievement" ADD CONSTRAINT "codi_user_achievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "codi_achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codi_weekly_ranking" ADD CONSTRAINT "codi_weekly_ranking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "codi_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codi_weekly_ranking" ADD CONSTRAINT "codi_weekly_ranking_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "codi_league"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codi_daily_mission" ADD CONSTRAINT "codi_daily_mission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "codi_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codi_exam_problem" ADD CONSTRAINT "codi_exam_problem_examId_fkey" FOREIGN KEY ("examId") REFERENCES "codi_exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codi_exam_problem" ADD CONSTRAINT "codi_exam_problem_problemId_fkey" FOREIGN KEY ("problemId") REFERENCES "codi_problem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codi_exam_attempt" ADD CONSTRAINT "codi_exam_attempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "codi_exam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codi_exam_attempt" ADD CONSTRAINT "codi_exam_attempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "codi_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codi_exam_answer" ADD CONSTRAINT "codi_exam_answer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "codi_exam_attempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "codi_notification" ADD CONSTRAINT "codi_notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "codi_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
