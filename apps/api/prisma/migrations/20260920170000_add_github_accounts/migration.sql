-- CreateTable
CREATE TABLE "github_accounts" (
    "id" SERIAL NOT NULL,
    "installation_id" BIGINT NOT NULL,
    "account_login" TEXT NOT NULL,
    "account_id" BIGINT NOT NULL,
    "account_avatar_url" TEXT NOT NULL,
    "account_type" TEXT NOT NULL,
    "repository_selection" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "github_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "github_accounts_installation_id_key" ON "github_accounts"("installation_id");

-- CreateIndex
CREATE INDEX "github_accounts_user_id_idx" ON "github_accounts"("user_id");

-- AddForeignKey
ALTER TABLE "github_accounts" ADD CONSTRAINT "github_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "github_installation_id";
