-- AlterTable
ALTER TABLE "deployments" ADD COLUMN     "is_rollback" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "achievements" (
    "user_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "achievements_pkey" PRIMARY KEY ("user_id","code")
);

-- AddForeignKey
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

