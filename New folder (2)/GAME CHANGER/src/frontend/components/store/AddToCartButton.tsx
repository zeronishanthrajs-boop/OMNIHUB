"use client";

import { useState } from "react";
import { addLineToCart } from "@/frontend/utils/cartStorage";

interface AddToCartButtonProps {
  productId: string;
}

export function AddToCartButton({ productId }: AddToCartButtonProps) {
  const [added, setAdded] = useState(false);

  const onAdd = () => {
    addLineToCart(productId, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  };

  return (
    <button
      type="button"
      onClick={onAdd}
      className="h-12 rounded-full px-6 text-sm font-semibold text-white transition hover:opacity-90"
      style={{ backgroundColor: "var(--mc-primary)" }}
    >
      {added ? "Added" : "Add to cart"}
    </button>
  );
}
