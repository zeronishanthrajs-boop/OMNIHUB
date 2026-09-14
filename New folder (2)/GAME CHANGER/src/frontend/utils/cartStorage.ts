import type { CartLine } from "@/frontend/types/store";

const CART_STORAGE_KEY = "morphcart:cart";
const CART_EVENT_NAME = "morphcart:cart-updated";

function sanitizeLines(lines: unknown): CartLine[] {
  if (!Array.isArray(lines)) {
    return [];
  }

  return lines
    .filter(
      (line): line is CartLine =>
        typeof line === "object" &&
        line !== null &&
        typeof (line as CartLine).productId === "string" &&
        typeof (line as CartLine).quantity === "number"
    )
    .map((line) => ({
      productId: line.productId,
      quantity: Math.max(1, Math.floor(line.quantity))
    }));
}

export function readCartLines(): CartLine[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return sanitizeLines(JSON.parse(raw));
  } catch {
    return [];
  }
}

function emitCartUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CART_EVENT_NAME));
  }
}

export function writeCartLines(lines: CartLine[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(sanitizeLines(lines)));
  emitCartUpdate();
}

export function addLineToCart(productId: string, quantity = 1) {
  const lines = readCartLines();
  const existing = lines.find((line) => line.productId === productId);

  if (existing) {
    existing.quantity += Math.max(1, Math.floor(quantity));
    writeCartLines(lines);
    return;
  }

  writeCartLines([...lines, { productId, quantity: Math.max(1, Math.floor(quantity)) }]);
}

export function removeLineFromCart(productId: string) {
  const next = readCartLines().filter((line) => line.productId !== productId);
  writeCartLines(next);
}

export function updateLineQuantity(productId: string, quantity: number) {
  if (quantity <= 0) {
    removeLineFromCart(productId);
    return;
  }

  const next = readCartLines().map((line) =>
    line.productId === productId ? { ...line, quantity: Math.floor(quantity) } : line
  );
  writeCartLines(next);
}

export function clearCart() {
  writeCartLines([]);
}

export const cartUpdateEvent = CART_EVENT_NAME;
