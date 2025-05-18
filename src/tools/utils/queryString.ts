export function buildQueryString(args: Record<string, any>): string {
  const query = new URLSearchParams();
  for (const key in args) {
    if (args[key] !== undefined && args[key] !== null) {
      query.set(key, args[key].toString());
    }
  }
  return query.toString();
}
