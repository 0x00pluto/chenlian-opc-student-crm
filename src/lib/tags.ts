export function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

export function stringifyTags(tags: string[]): string {
  return JSON.stringify(tags);
}
