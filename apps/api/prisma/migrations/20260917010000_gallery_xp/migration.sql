-- AlterTable
ALTER TABLE "users" ADD COLUMN "xp" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "projects"
  ADD COLUMN "is_public" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "thumbnail_url" TEXT,
  ADD COLUMN "published_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "project_stars" (
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_stars_pkey" PRIMARY KEY ("project_id","user_id")
);

-- AddForeignKey
ALTER TABLE "project_stars" ADD CONSTRAINT "project_stars_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_stars" ADD CONSTRAINT "project_stars_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
