-- CreateTable
CREATE TABLE "site_checks" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "site_checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "site_checks_project_id_checked_at_idx" ON "site_checks"("project_id", "checked_at");

-- AddForeignKey
ALTER TABLE "site_checks" ADD CONSTRAINT "site_checks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

