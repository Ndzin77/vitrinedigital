import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Product, StoreInfo } from "@/types/store";
import { MobileProductCard } from "./MobileProductCard";
import { FeaturedCarousel } from "./FeaturedCarousel";


interface ProductOption {
  name: string;
  required: boolean;
  enabled?: boolean;
  max_select: number;
  min_select: number;
  choices: {
    name: string;
    price_modifier: number;
    image_url?: string;
    enabled?: boolean;
  }[];
}

interface ProductWithOptions extends Product {
  hasOptions?: boolean;
  options?: ProductOption[];
  minQuantity?: number;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface MobileProductGridProps {
  products: ProductWithOptions[];
  categories: Category[];
  activeCategory: string;
  store?: StoreInfo;
  unavailableWhatsappEnabled?: boolean;
  onCategoryChange?: (categoryId: string) => void;
  scrollToCategory?: string | null;
  onScrollComplete?: () => void;
  searchQuery?: string;
}

export function MobileProductGrid({ 
  products, 
  categories, 
  activeCategory,
  store,
  unavailableWhatsappEnabled = true,
  onCategoryChange,
  scrollToCategory,
  onScrollComplete,
  searchQuery = "",
}: MobileProductGridProps) {
  const sectionRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isScrollingToRef = useRef(false);

  // Featured products for the carousel
  const featuredProducts = useMemo(() => 
    products.filter(p => p.featured && p.available), 
    [products]
  );

  // All real categories (excluding "featured")
  const realCategories = useMemo(() => 
    categories.filter(c => c.id !== "featured"),
    [categories]
  );

  // Products grouped by category
  const productsByCategory = useMemo(() => {
    return realCategories.map(cat => ({
      category: cat,
      products: products.filter(p => p.category === cat.id),
    })).filter(g => g.products.length > 0);
  }, [products, realCategories]);

  // Search-filtered
  const searchFilteredByCategory = useMemo(() => {
    if (!searchQuery.trim()) return productsByCategory;
    const q = searchQuery.toLowerCase().trim();
    return productsByCategory
      .map(g => ({
        ...g,
        products: g.products.filter(p =>
          p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
        ),
      }))
      .filter(g => g.products.length > 0);
  }, [productsByCategory, searchQuery]);

  // Scroll-based active category detection
  useEffect(() => {
    const handleScroll = () => {
      if (isScrollingToRef.current) return;

      const viewportCenter = window.innerHeight * 0.35;
      let closestCategory: string | null = null;
      let closestDistance = Infinity;

      sectionRefs.current.forEach((el, categoryId) => {
        const rect = el.getBoundingClientRect();
        // Check if section is at least partially visible
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          const distance = Math.abs(rect.top - viewportCenter);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestCategory = categoryId;
          }
        }
      });

      if (closestCategory && closestCategory !== activeCategory) {
        onCategoryChange?.(closestCategory);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeCategory, onCategoryChange]);

  // When category is clicked from the nav (user click only), scroll to that section
  useEffect(() => {
    if (!scrollToCategory) return;

    if (scrollToCategory === "featured") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      onScrollComplete?.();
      return;
    }

    const el = sectionRefs.current.get(scrollToCategory);
    if (!el) {
      onScrollComplete?.();
      return;
    }

    isScrollingToRef.current = true;
    el.scrollIntoView({ behavior: "smooth", block: "start" });

    const timeout = setTimeout(() => {
      isScrollingToRef.current = false;
      onScrollComplete?.();
    }, 800);

    return () => clearTimeout(timeout);
  }, [scrollToCategory, onScrollComplete]);

  const setSectionRef = useCallback((categoryId: string, el: HTMLDivElement | null) => {
    if (el) {
      sectionRefs.current.set(categoryId, el);
    } else {
      sectionRefs.current.delete(categoryId);
    }
  }, []);

  return (
    <div className="container py-4 sm:py-6 space-y-6">

      {/* Featured Carousel - horizontal scroll with peek hint */}
      {featuredProducts.length > 0 && !searchQuery.trim() && (
        <FeaturedCarousel
          products={featuredProducts as ProductWithOptions[]}
          store={store}
          unavailableWhatsappEnabled={unavailableWhatsappEnabled}
        />
      )}

      {/* All Categories - Vertical Layout */}
      {searchFilteredByCategory.length > 0 ? (
        <div className="space-y-8">
          {searchFilteredByCategory.map(({ category, products: catProducts }, groupIdx) => (
            <div
              key={category.id}
              ref={(el) => setSectionRef(category.id, el)}
              data-category-section={category.id}
              className="scroll-mt-20 space-y-4 animate-fade-in"
              style={{ animationDelay: `${groupIdx * 80}ms` }}
            >
              {/* Category Header */}
              <div className="flex items-center gap-3 px-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl gradient-primary flex items-center justify-center text-lg sm:text-xl shadow-soft">
                  {category.icon}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground font-display tracking-tight">
                    {category.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {catProducts.length} {catProducts.length === 1 ? "item" : "itens"}
                  </p>
                </div>
              </div>

              {/* Products - Horizontal Scroll */}
              <div className="relative -mx-4 px-4">
                <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-3">
                  {catProducts.map((product, idx) => (
                    <div
                      key={product.id}
                      id={`product-${product.id}`}
                      className="snap-start shrink-0 w-[55vw] sm:w-[42vw] md:w-[32vw] lg:w-[24vw] animate-slide-up"
                      style={{ animationDelay: `${Math.min(idx * 50, 250)}ms` }}
                    >
                      <MobileProductCard
                        product={product}
                        hasOptions={product.hasOptions}
                        options={product.options}
                        minQuantity={product.minQuantity}
                        store={store}
                        unavailableWhatsappEnabled={unavailableWhatsappEnabled}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : searchQuery.trim() ? (
        <div className="text-center py-12 animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <span className="text-3xl">🔍</span>
          </div>
          <p className="text-muted-foreground font-medium text-sm">
            Nenhum produto encontrado para "{searchQuery}"
          </p>
          <p className="mt-3 text-sm text-primary font-semibold">
            Tente outro termo
          </p>
        </div>
      ) : null}
    </div>
  );
}
