import Image from "next/image";
import { notFound } from "next/navigation";
import { StoreShell } from "@/frontend/components/layout/StoreShell";
import { AddToCartButton } from "@/frontend/components/store/AddToCartButton";
import { ProductCard } from "@/frontend/components/store/ProductCard";
import {
  getProductBySlug,
  getProductReviews,
  getRelatedProducts
} from "@/frontend/services/mockProducts";
import { getSiteConfig } from "@/frontend/services/storefront.service";
import { formatCurrency } from "@/frontend/utils/format";

interface ProductDetailRouteProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ store?: string }>;
}

export default async function ProductDetailRoute({ params, searchParams }: ProductDetailRouteProps) {
  const routeParams = await params;
  const queryParams = await searchParams;
  const product = getProductBySlug(routeParams.slug);
  const storeSlug = typeof queryParams.store === "string" ? queryParams.store : undefined;
  const config = getSiteConfig(storeSlug);

  if (!product) {
    notFound();
  }

  const reviews = config.featureFlags.userReviews ? getProductReviews(product.id) : [];
  const related = getRelatedProducts(product);

  return (
    <StoreShell config={config} storeSlug={storeSlug}>
      <div className="space-y-8">
        <section className="grid gap-6 rounded-[var(--mc-radius)] border border-[var(--mc-border)] bg-white p-5 shadow-soft lg:grid-cols-2">
          <div className="space-y-3">
            <div className="relative h-80 overflow-hidden rounded-[var(--mc-radius)] border border-[var(--mc-border)] sm:h-96">
              <Image
                src={product.images[0]}
                alt={product.title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {product.images.map((image) => (
                <div
                  key={image}
                  className="relative h-24 overflow-hidden rounded-xl border border-[var(--mc-border)]"
                >
                  <Image src={image} alt={product.title} fill className="object-cover" sizes="160px" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mc-text-muted)]">
              {product.category}
            </p>
            <h1 className="text-3xl font-semibold text-[var(--mc-text)]">{product.title}</h1>
            <p className="text-base text-[var(--mc-text-muted)]">{product.description}</p>
            <p className="text-2xl font-semibold text-[var(--mc-text)]">
              {formatCurrency(product.price, config.ecommerce.currency)}
            </p>
            <p className="text-sm text-[var(--mc-text-muted)]">{product.inventory} units available</p>
            {config.featureFlags.productVariants ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <select className="h-10 rounded-full border border-[var(--mc-border)] px-4 text-sm text-[var(--mc-text)]">
                  <option>Standard</option>
                  <option>Pro</option>
                </select>
                <select className="h-10 rounded-full border border-[var(--mc-border)] px-4 text-sm text-[var(--mc-text)]">
                  <option>Default Color</option>
                  <option>Black</option>
                  <option>Silver</option>
                </select>
              </div>
            ) : null}
            <AddToCartButton productId={product.id} />
          </div>
        </section>

        {config.featureFlags.userReviews ? (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[var(--mc-text)]">Reviews</h2>
            {reviews.length === 0 ? (
              <p className="rounded-[var(--mc-radius)] border border-[var(--mc-border)] bg-white p-4 text-sm text-[var(--mc-text-muted)]">
                No reviews yet.
              </p>
            ) : (
              reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-[var(--mc-radius)] border border-[var(--mc-border)] bg-white p-4 shadow-soft"
                >
                  <p className="text-sm font-semibold text-[var(--mc-text)]">
                    {review.author} • {review.rating}/5
                  </p>
                  <p className="mt-2 text-sm text-[var(--mc-text-muted)]">{review.comment}</p>
                </article>
              ))
            )}
          </section>
        ) : null}

        {related.length > 0 ? (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-[var(--mc-text)]">You may also like</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard
                  key={item.id}
                  product={item}
                  currency={config.ecommerce.currency}
                  storeSlug={storeSlug}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </StoreShell>
  );
}
