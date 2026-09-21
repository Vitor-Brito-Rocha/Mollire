-- root_dir: folder of the repository where install + build run ('' = repo root).
-- output_dir is now relative to it.
ALTER TABLE "projects" ADD COLUMN "root_dir" TEXT NOT NULL DEFAULT '';

-- `npm install` is now run by the platform before every build, so build_command
-- holds only the build itself. Strip the prefix from what was stored so existing
-- projects don't install twice.
ALTER TABLE "projects" ALTER COLUMN "build_command" SET DEFAULT 'npm run build';

UPDATE "projects"
SET "build_command" = regexp_replace("build_command", '^\s*npm\s+(install|ci|i)\s*(&&|;)\s*', '', 'i');

UPDATE "projects"
SET "build_command" = 'npm run build'
WHERE btrim("build_command") = '' OR "build_command" ~* '^\s*npm\s+(install|ci|i)\s*$';
