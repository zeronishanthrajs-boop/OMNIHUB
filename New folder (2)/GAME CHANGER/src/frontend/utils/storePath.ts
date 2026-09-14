export function scopedPath(storeSlug: string | undefined, path: string): string {
  const scoped = storeSlug && storeSlug !== "default";
  if (!scoped) {
    return path;
  }

  if (path === "/") {
    return `/${storeSlug}`;
  }

  return `/${storeSlug}${path}`;
}
