const WISHLIST_STORAGE_KEY = "morphcart:wishlist";
const WISHLIST_EVENT_NAME = "morphcart:wishlist-updated";

function sanitizeIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) {
    return [];
  }
  return ids.filter((id): id is string => typeof id === "string");
}

export function readWishlistIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return sanitizeIds(JSON.parse(raw));
  } catch {
    return [];
  }
}

function emitWishlistUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(WISHLIST_EVENT_NAME));
  }
}

export function writeWishlistIds(ids: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(sanitizeIds(ids)));
  emitWishlistUpdate();
}

export function toggleWishlistId(productId: string) {
  const ids = readWishlistIds();
  const index = ids.indexOf(productId);

  if (index >= 0) {
    // Remove if exists
    writeWishlistIds(ids.filter((id) => id !== productId));
  } else {
    // Add if missing
    writeWishlistIds([...ids, productId]);
  }
}

export const wishlistUpdateEvent = WISHLIST_EVENT_NAME;
