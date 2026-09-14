"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductCard } from "@/frontend/components/store/ProductCard";
import type { SiteConfig } from "@/frontend/types/site-config";
import type { Product } from "@/frontend/types/store";
import { scopedPath } from "@/frontend/utils/storePath";

interface ProductListingPageProps {
  config: SiteConfig;
  products: Product[];
  storeSlug?: string;
}

export function ProductListingPage({ config, products, storeSlug }: ProductListingPageProps) {
  const showAdvancedSearch = config.featureFlags.advancedSearch;
  const categories = useMemo(() => ["All", ...new Set(products.map((item) => item.category))], [products]);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState(config.pages.products.defaultSort);
  const [viewMode, setViewMode] = useState(config.pages.products.defaultViewMode);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProducts = useMemo(() => {
    const bySearch = products.filter((product) =>
      `${product.title} ${product.category}`.toLowerCase().includes(searchText.toLowerCase())
    );

    if (selectedCategory === "All") {
      return bySearch;
    }

    return bySearch.filter((product) => product.category === selectedCategory);
  }, [products, searchText, selectedCategory]);

  const sortedProducts = useMemo(() => {
    const copy = [...filteredProducts];
    switch (sortBy) {
      case "price-asc":
        copy.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        copy.sort((a, b) => b.price - a.price);
        break;
      case "rating-desc":
        copy.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        copy.sort((a, b) => b.id.localeCompare(a.id));
        break;
      default:
        copy.sort((a, b) => Number(b.featured) - Number(a.featured));
        break;
    }

    return copy;
  }, [filteredProducts, sortBy]);

  const productsPerPage = config.pages.products.productsPerPage;
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / productsPerPage));
  const activePage = Math.min(currentPage, totalPages);

  const pagedProducts = sortedProducts.slice(
    (activePage - 1) * productsPerPage,
    activePage * productsPerPage
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[calc(var(--mc-radius)+4px)] border border-[var(--mc-border)] bg-white p-5 shadow-soft sm:p-6">
        <div className={`grid gap-3 ${showAdvancedSearch ? "lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto]" : "lg:grid-cols-[1fr_auto]"}`}>
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search products"
            className="h-11 rounded-full border border-[var(--mc-border)] px-4 text-sm text-[var(--mc-text)] outline-none ring-offset-2 focus:ring-2 focus:ring-[var(--mc-primary)]"
          />

          {showAdvancedSearch ? (
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="h-11 rounded-full border border-[var(--mc-border)] px-4 text-sm text-[var(--mc-text)] outline-none ring-offset-2 focus:ring-2 focus:ring-[var(--mc-primary)]"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          ) : null}

          {showAdvancedSearch ? (
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
              className="h-11 rounded-full border border-[var(--mc-border)] px-4 text-sm text-[var(--mc-text)] outline-none ring-offset-2 focus:ring-2 focus:ring-[var(--mc-primary)]"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Rating</option>
              <option value="newest">Newest</option>
            </select>
          ) : null}

          <div className="inline-flex h-11 rounded-full border border-[var(--mc-border)] p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded-full px-4 text-xs font-semibold ${
                viewMode === "grid" ? "bg-[var(--mc-secondary)] text-[var(--mc-text)]" : "text-[var(--mc-text-muted)]"
              }`}
            >
              Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded-full px-4 text-xs font-semibold ${
                viewMode === "list" ? "bg-[var(--mc-secondary)] text-[var(--mc-text)]" : "text-[var(--mc-text-muted)]"
              }`}
            >
              List
            </button>
          </div>
        </div>
      </section>

      <section
        className={
          viewMode === "grid" ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3" : "grid grid-cols-1 gap-4"
        }
      >
        {pagedProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            currency={config.ecommerce.currency}
            viewMode={viewMode}
            storeSlug={storeSlug}
          />
        ))}
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-[var(--mc-radius)] border border-[var(--mc-border)] bg-white p-4 shadow-soft">
        <p className="text-sm text-[var(--mc-text-muted)]">
          Page {activePage} of {totalPages}
        </p>
        <div className="inline-flex gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage((value) => Math.max(1, Math.min(totalPages, value - 1)))}
            className="h-10 rounded-full border border-[var(--mc-border)] px-4 text-xs font-semibold text-[var(--mc-text)] disabled:opacity-40"
            disabled={activePage === 1}
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage((value) => Math.max(1, Math.min(totalPages, value + 1)))}
            className="h-10 rounded-full border border-[var(--mc-border)] px-4 text-xs font-semibold text-[var(--mc-text)] disabled:opacity-40"
            disabled={activePage === totalPages}
          >
            Next
          </button>
        </div>
      </section>

      {config.featureFlags.mobileCartShortcut ? (
        <Link
          href={scopedPath(storeSlug, "/cart")}
          className="fixed bottom-4 left-1/2 z-30 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-full px-5 py-3 text-center text-sm font-semibold text-white shadow-lg md:hidden"
          style={{ backgroundColor: "var(--mc-primary)" }}
        >
          Open Cart
        </Link>
      ) : null}
    </div>
  );
}
