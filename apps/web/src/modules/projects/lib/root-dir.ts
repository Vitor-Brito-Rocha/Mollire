// Same rules as the API's ROOT_DIR_PATTERN / normalizeRootDir: the server is the
// authority, this only lets the forms react before a request is made.

const ROOT_DIR_PATTERN = /^$|^(?!\.{1,2}(\/|$))[\w.-]+(\/(?!\.{1,2}(\/|$))[\w.-]+)*$/;

// "./apps/web/", "/apps/web" and "apps/web" are one folder; "." means the root.
export function normalizeRootDir(value: string): string {
  const trimmed = value.trim().replace(/^(\.?\/)+/, "").replace(/\/+$/, "");
  return trimmed === "." ? "" : trimmed;
}

export const isValidRootDir = (normalized: string) => ROOT_DIR_PATTERN.test(normalized) && normalized.length <= 200;

export const isSupportedRepositoryUrl = (url: string) => /^https:\/\/(github\.com|gitlab\.com)\/[^/]+\/[^/]/.test(url);
