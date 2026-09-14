export interface ProductReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  category: string;
  images: string[];
  description: string;
  featured: boolean;
  rating: number;
  inventory: number;
}

export interface CartLine {
  productId: string;
  quantity: number;
}
