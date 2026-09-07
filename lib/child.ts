export const ACTIVE_CHILD_COOKIE = "active_child";
export const ALL_CHILDREN_VALUE = "all";

export function isChildId(value: string | undefined | null): value is string {
  return Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value));
}
