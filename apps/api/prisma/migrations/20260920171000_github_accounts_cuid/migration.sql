-- Recreate github_accounts with TEXT cuid primary key
ALTER TABLE "github_accounts" DROP CONSTRAINT "github_accounts_pkey";
ALTER TABLE "github_accounts" ALTER COLUMN "id" TYPE TEXT USING gen_random_uuid()::TEXT;
ALTER TABLE "github_accounts" ADD CONSTRAINT "github_accounts_pkey" PRIMARY KEY ("id");
