import { Category } from "@/types/store";
import { useRef, useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Search, X, Sparkles } from "lucide-react";

interface CategoryNavProps {
  categories: Category[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}

export function CategoryNav({
  categories,
  activeCategory,
  onCategoryChange,
  searchQuery = "",
  onSearchChange,
}: CategoryNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const ref = scrollRef.current;
    ref?.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      ref?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [categories]);

  // Auto-scroll the active button into view when it changes
  useEffect(() => {
    const activeButton = scrollRef.current?.querySelector(`[data-category="${activeCategory}"]`);
    if (activeButton) {
      activeButton.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeCategory]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 200;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    onCategoryChange(categoryId);
  };

  const toggleSearch = useCallback(() => {
    if (searchExpanded) {
      onSearchChange?.("");
      setSearchExpanded(false);
    } else {
      setSearchExpanded(true);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [searchExpanded, onSearchChange]);

  const handleClearSearch = () => {
    onSearchChange?.("");
    setSearchExpanded(false);
  };

  return (
    <div className="sticky top-0 z-30">
      {/* Glass morphism background */}
      <div className="absolute inset-0 bg-background/90 backdrop-blur-2xl border-b border-border/30" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      <div className="container relative">
        {/* Search bar row - expandable */}
        <div className={`overflow-hidden transition-all duration-300 ease-out ${
          searchExpanded ? "max-h-16 opacity-100 pt-3 pb-1" : "max-h-0 opacity-0"
        }`}>
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="O que você procura?"
                className="w-full h-11 pl-10 pr-10 rounded-xl bg-secondary/80 border border-border/50 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 focus:bg-card transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Categories + search toggle row */}
        <div className="flex items-center gap-2 py-3">
          {/* Search toggle button */}
          <button
            onClick={toggleSearch}
            className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-90 ${
              searchExpanded || searchQuery
                ? "gradient-primary text-primary-foreground shadow-glow"
                : "bg-card border border-border/50 text-muted-foreground shadow-soft hover:text-primary hover:border-primary/30"
            }`}
            aria-label="Pesquisar"
          >
            {searchExpanded ? (
              <X className="w-5 h-5" />
            ) : searchQuery ? (
              <Sparkles className="w-5 h-5" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>

          {/* Categories scroll */}
          <div className="relative flex-1 min-w-0">
            {/* Scroll arrows */}
            {showLeftArrow && (
              <button
                onClick={() => scroll("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-full bg-gradient-to-r from-background/90 to-transparent flex items-center justify-start"
              >
                <div className="w-8 h-8 rounded-full bg-card shadow-soft border border-border/50 flex items-center justify-center hover:scale-110 transition-all group">
                  <ChevronLeft className="w-4 h-4 text-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>
            )}
            {showRightArrow && (
              <button
                onClick={() => scroll("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-full bg-gradient-to-l from-background/90 to-transparent flex items-center justify-end"
              >
                <div className="w-8 h-8 rounded-full bg-card shadow-soft border border-border/50 flex items-center justify-center hover:scale-110 transition-all group">
                  <ChevronRight className="w-4 h-4 text-foreground group-hover:text-primary transition-colors" />
                </div>
              </button>
            )}

            <div
              ref={scrollRef}
              className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5 scroll-smooth"
            >
              {categories.map((category, idx) => {
                const isActive = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    data-category={category.id}
                    onClick={() => handleCategoryClick(category.id)}
                    className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all duration-300 text-sm font-bold shrink-0 ${
                      isActive
                        ? "gradient-primary text-primary-foreground shadow-glow scale-[1.02]"
                        : "bg-card text-foreground border border-border/50 shadow-soft hover:shadow-medium hover:-translate-y-0.5 hover:border-primary/30"
                    }`}
                  >
                    {/* Active glow ring */}
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl bg-primary/30 blur-xl -z-10 animate-pulse" />
                    )}
                    
                    {/* Icon */}
                    {category.icon_url ? (
                      <img src={category.icon_url} alt="" className={`w-5 h-5 rounded-md object-cover transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                    ) : (
                      <span className={`text-lg transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                        {category.icon}
                      </span>
                    )}
                    <span className="tracking-tight">{category.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
