CREATE TABLE "project_env_vars" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_env_vars_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "project_env_vars_project_id_key_key" ON "project_env_vars"("project_id", "key");

CREATE INDEX "project_env_vars_project_id_idx" ON "project_env_vars"("project_id");

ALTER TABLE "project_env_vars" ADD CONSTRAINT "project_env_vars_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
