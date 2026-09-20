-- DropForeignKey
ALTER TABLE "deployments" DROP CONSTRAINT "deployments_project_id_fkey";

-- AddForeignKey
ALTER TABLE "deployments" ADD CONSTRAINT "deployments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
