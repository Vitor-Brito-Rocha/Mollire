/*
  Warnings:

  - A unique constraint covering the columns `[project_id,visitor_id,path,date]` on the table `project_views` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "project_views_project_id_visitor_id_date_key";

-- AlterTable
ALTER TABLE "project_views" ADD COLUMN     "path" TEXT NOT NULL DEFAULT '/';

-- CreateIndex
CREATE UNIQUE INDEX "project_views_project_id_visitor_id_path_date_key" ON "project_views"("project_id", "visitor_id", "path", "date");
