import { useParams } from "react-router";

// Route params are typed `string | undefined`; a path like `projects/:slug`
// only matches with the segment present, so a missing one is a routing bug.
export function useRequiredParam(name: string): string {
  const value = useParams()[name];
  if (!value) throw new Error(`Missing route param "${name}"`);
  return value;
}
