CREATE TYPE "ActivityType" AS ENUM (
  'DEPLOY_TRIGGERED',
  'DEPLOY_SUCCESS',
  'DEPLOY_FAILED',
  'MEMBER_ADDED',
  'MEMBER_REMOVED',
  'STAR_RECEIVED',
  'COMMENT_ADDED',
  'VISIBILITY_CHANGED'
);

CREATE TABLE "project_activities" (
  "id"         TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "type"       "ActivityType" NOT NULL,
  "actor_id"   TEXT,
  "payload"    JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "project_activities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "project_activities_project_id_created_at_idx"
  ON "project_activities"("project_id", "created_at");

ALTER TABLE "project_activities"
  ADD CONSTRAINT "project_activities_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
