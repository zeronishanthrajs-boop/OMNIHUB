"use client";

import { useEffect, useMemo, useState } from "react";
import type { CartLine, Product } from "@/frontend/types/store";
import {
  addLineToCart,
  cartUpdateEvent,
  clearCart,
  readCartLines,
  removeLineFromCart,
  updateLineQuantity
} from "@/frontend/utils/cartStorage";

interface CartSummaryLine extends CartLine {
  product: Product | null;
  lineTotal: number;
}

export function useCart(products: Product[]) {
  const [lines, setLines] = useState<CartLine[]>(() => readCartLines());

  useEffect(() => {
    const sync = () => setLines(readCartLines());
    window.addEventListener(cartUpdateEvent, sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener(cartUpdateEvent, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const lineItems = useMemo<CartSummaryLine[]>(
    () =>
      lines.map((line) => {
        const product = products.find((item) => item.id === line.productId) ?? null;
        return {
          ...line,
          product,
          lineTotal: product ? product.price * line.quantity : 0
        };
      }),
    [lines, products]
  );

  const subtotal = lineItems.reduce((sum, line) => sum + line.lineTotal, 0);
  const itemCount = lineItems.reduce((sum, line) => sum + line.quantity, 0);

  return {
    lines,
    lineItems,
    subtotal,
    itemCount,
    addToCart: addLineToCart,
    removeFromCart: removeLineFromCart,
    updateQuantity: updateLineQuantity,
    clearCart
  };
}
