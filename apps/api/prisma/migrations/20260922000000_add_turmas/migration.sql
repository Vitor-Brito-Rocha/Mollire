-- CreateEnum
CREATE TYPE "TurmaRole" AS ENUM ('PROFESSOR', 'ALUNO');

-- CreateEnum
CREATE TYPE "TurmaGroupMode" AS ENUM ('NONE', 'GROUPS');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "turma_id" TEXT,
ADD COLUMN     "turma_group_id" TEXT,
ADD COLUMN     "grade" DOUBLE PRECISION,
ADD COLUMN     "graded_at" TIMESTAMP(3),
ADD COLUMN     "graded_by" TEXT;

-- CreateTable
CREATE TABLE "turmas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "capacity" INTEGER,
    "group_mode" "TurmaGroupMode" NOT NULL DEFAULT 'NONE',
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turma_groups" (
    "id" TEXT NOT NULL,
    "turma_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "max_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "turma_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turma_members" (
    "id" TEXT NOT NULL,
    "turma_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "TurmaRole" NOT NULL DEFAULT 'ALUNO',
    "group_id" TEXT,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "turma_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "projects_turma_id_idx" ON "projects"("turma_id");

-- CreateIndex
CREATE INDEX "projects_turma_group_id_idx" ON "projects"("turma_group_id");

-- CreateIndex
CREATE UNIQUE INDEX "turmas_code_key" ON "turmas"("code");

-- CreateIndex
CREATE INDEX "turmas_owner_id_idx" ON "turmas"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "turmas_owner_id_name_key" ON "turmas"("owner_id", "name");

-- CreateIndex
CREATE INDEX "turma_groups_turma_id_idx" ON "turma_groups"("turma_id");

-- CreateIndex
CREATE UNIQUE INDEX "turma_groups_turma_id_name_key" ON "turma_groups"("turma_id", "name");

-- CreateIndex
CREATE INDEX "turma_members_turma_id_idx" ON "turma_members"("turma_id");

-- CreateIndex
CREATE INDEX "turma_members_group_id_idx" ON "turma_members"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "turma_members_turma_id_user_id_key" ON "turma_members"("turma_id", "user_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_turma_group_id_fkey" FOREIGN KEY ("turma_group_id") REFERENCES "turma_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turmas" ADD CONSTRAINT "turmas_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_groups" ADD CONSTRAINT "turma_groups_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_members" ADD CONSTRAINT "turma_members_turma_id_fkey" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_members" ADD CONSTRAINT "turma_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turma_members" ADD CONSTRAINT "turma_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "turma_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
