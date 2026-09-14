"use client";

import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/frontend/types/store";
import {
  readWishlistIds,
  toggleWishlistId,
  wishlistUpdateEvent
} from "@/frontend/utils/wishlistStorage";

export function useWishlist(products: Product[] = []) {
  const [savedIds, setSavedIds] = useState<string[]>(() => readWishlistIds());

  useEffect(() => {
    const sync = () => setSavedIds(readWishlistIds());
    window.addEventListener(wishlistUpdateEvent, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(wishlistUpdateEvent, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const isSaved = (productId: string) => savedIds.includes(productId);

  const items = useMemo(() => {
    if (!products || products.length === 0) return [];
    return savedIds
      .map((id) => products.find((item) => item.id === id))
      .filter((item): item is Product => !!item);
  }, [savedIds, products]);

  return {
    savedIds,
    items,
    toggleWishlist: toggleWishlistId,
    isSaved
  };
}
