-- CreateTable
CREATE TABLE "quest_completions" (
    "user_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quest_completions_pkey" PRIMARY KEY ("user_id","code")
);

-- AddForeignKey
ALTER TABLE "quest_completions" ADD CONSTRAINT "quest_completions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
