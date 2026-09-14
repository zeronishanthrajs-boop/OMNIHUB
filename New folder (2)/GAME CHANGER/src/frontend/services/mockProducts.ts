import type { Product, ProductReview } from "@/frontend/types/store";

export const mockProducts: Product[] = [
  {
    id: "p1",
    slug: "nova-wireless-headphones",
    title: "Nova Wireless Headphones",
    price: 129.99,
    category: "Audio",
    images: [
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80"
    ],
    description: "Adaptive noise control with 40-hour battery life.",
    featured: true,
    rating: 4.8,
    inventory: 23
  },
  {
    id: "p2",
    slug: "aero-4k-monitor",
    title: "Aero 4K Monitor",
    price: 349.0,
    category: "Displays",
    images: [
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1585792180666-f7347c490ee2?auto=format&fit=crop&w=900&q=80"
    ],
    description: "27-inch true-color display with ultra-thin bezels.",
    featured: true,
    rating: 4.7,
    inventory: 11
  },
  {
    id: "p3",
    slug: "flux-mechanical-keyboard",
    title: "Flux Mechanical Keyboard",
    price: 109.5,
    category: "Peripherals",
    images: [
      "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=900&q=80"
    ],
    description: "Hot-swappable tactile board with low-profile frame.",
    featured: true,
    rating: 4.6,
    inventory: 42
  },
  {
    id: "p4",
    slug: "pulse-gaming-mouse",
    title: "Pulse Gaming Mouse",
    price: 59.99,
    category: "Gaming",
    images: [
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=900&q=80"
    ],
    description: "Ultra-lightweight shell with low-latency sensor.",
    featured: false,
    rating: 4.5,
    inventory: 65
  },
  {
    id: "p5",
    slug: "zen-smartwatch-s2",
    title: "Zen Smartwatch S2",
    price: 199.0,
    category: "Wearables",
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80"
    ],
    description: "Wellness tracking and all-day ambient display.",
    featured: false,
    rating: 4.4,
    inventory: 34
  },
  {
    id: "p6",
    slug: "cloud-speaker-mini",
    title: "Cloud Speaker Mini",
    price: 89.0,
    category: "Audio",
    images: [
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80"
    ],
    description: "Compact smart speaker with room-filling sound.",
    featured: true,
    rating: 4.3,
    inventory: 58
  },
  {
    id: "p7",
    slug: "lumen-desk-lamp",
    title: "Lumen Desk Lamp",
    price: 79.99,
    category: "Furniture",
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80"
    ],
    description: "Dimmable Scandinavian lamp with warm color tuning.",
    featured: false,
    rating: 4.2,
    inventory: 19
  },
  {
    id: "p8",
    slug: "linen-lounge-chair",
    title: "Linen Lounge Chair",
    price: 269.0,
    category: "Furniture",
    images: [
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1582582429416-8d7a948f4f75?auto=format&fit=crop&w=900&q=80"
    ],
    description: "Soft fabric seat with natural oak frame.",
    featured: true,
    rating: 4.7,
    inventory: 7
  },
  {
    id: "p9",
    slug: "sprint-running-shoes",
    title: "Sprint Running Shoes",
    price: 119.0,
    category: "Fashion",
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80"
    ],
    description: "Breathable knit upper with responsive cushioning.",
    featured: false,
    rating: 4.6,
    inventory: 39
  },
  {
    id: "p10",
    slug: "mira-crossbody-bag",
    title: "Mira Crossbody Bag",
    price: 89.0,
    category: "Fashion",
    images: [
      "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=900&q=80"
    ],
    description: "Minimal vegan leather bag for daily carry.",
    featured: false,
    rating: 4.1,
    inventory: 29
  },
  {
    id: "p11",
    slug: "core-gaming-chair",
    title: "Core Gaming Chair",
    price: 229.0,
    category: "Gaming",
    images: [
      "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=900&q=80"
    ],
    description: "Ergonomic support for long-session comfort.",
    featured: true,
    rating: 4.5,
    inventory: 16
  },
  {
    id: "p12",
    slug: "archiv-laptop-stand",
    title: "Archiv Laptop Stand",
    price: 49.0,
    category: "Peripherals",
    images: [
      "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=900&q=80"
    ],
    description: "Aluminum stand that improves posture and airflow.",
    featured: false,
    rating: 4.3,
    inventory: 78
  }
];

const reviewsByProduct: Record<string, ProductReview[]> = {
  p1: [
    { id: "r1", author: "Ayesha", rating: 5, comment: "Clear sound and super light fit." },
    { id: "r2", author: "Rohan", rating: 4, comment: "Noise canceling works great in travel." }
  ],
  p2: [{ id: "r3", author: "Nina", rating: 5, comment: "Color accuracy is excellent." }],
  p11: [{ id: "r4", author: "Karan", rating: 4, comment: "Comfortable even after 8 hours." }]
};

export function getProducts(): Product[] {
  return mockProducts;
}

export function getFeaturedProducts(limit = 6): Product[] {
  return mockProducts.filter((product) => product.featured).slice(0, limit);
}

export function getProductBySlug(slug: string): Product | null {
  return mockProducts.find((product) => product.slug === slug) ?? null;
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return mockProducts
    .filter((item) => item.id !== product.id && item.category === product.category)
    .slice(0, limit);
}

export function getProductReviews(productId: string): ProductReview[] {
  return reviewsByProduct[productId] ?? [];
}

export function getCategories(): string[] {
  const values = new Set(mockProducts.map((item) => item.category));
  return Array.from(values);
}
