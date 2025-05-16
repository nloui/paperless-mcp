export const headersToObject = (headers: any): Record<string, string> => {
  if (!headers) return {};
  if (typeof headers.forEach === "function") {
    const obj: Record<string, string> = {};
    headers.forEach((value: string, key: string) => {
      obj[key] = value;
    });
    return obj;
  }
  return headers;
};
