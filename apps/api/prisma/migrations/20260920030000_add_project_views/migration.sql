CREATE TABLE "project_views" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "visitor_id" TEXT NOT NULL,
    "country" TEXT,
    "date" DATE NOT NULL,

    CONSTRAINT "project_views_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_views_project_id_visitor_id_date_key" ON "project_views"("project_id", "visitor_id", "date");
CREATE INDEX "project_views_project_id_date_idx" ON "project_views"("project_id", "date");

ALTER TABLE "project_views" ADD CONSTRAINT "project_views_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
