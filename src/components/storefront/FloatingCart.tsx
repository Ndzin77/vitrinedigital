import { useCart } from "@/hooks/useCart";
import { ShoppingBag, ArrowRight, Zap } from "lucide-react";
import { useEffect, useState } from "react";

export function FloatingCart() {
  const { totalItems, subtotal, setIsOpen } = useCart();
  const [justUpdated, setJustUpdated] = useState(false);
  const [prevItems, setPrevItems] = useState(totalItems);

  // Micro-interaction: pulse when items change
  useEffect(() => {
    if (totalItems !== prevItems && totalItems > 0) {
      setJustUpdated(true);
      const timer = setTimeout(() => setJustUpdated(false), 600);
      setPrevItems(totalItems);
      return () => clearTimeout(timer);
    }
    setPrevItems(totalItems);
  }, [totalItems, prevItems]);

  if (totalItems === 0) return null;

  return (
    <button
      onClick={() => setIsOpen(true)}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 z-50 group"
    >
      {/* Outer glow ring — urgency */}
      <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-accent via-primary to-accent opacity-60 blur-xl animate-pulse" />
      
      <div className={`relative flex items-center gap-4 gradient-accent text-accent-foreground pl-5 pr-6 py-4 rounded-full shadow-elevation transition-all duration-300 hover:scale-[1.03] animate-slide-up border border-white/20 ${
        justUpdated ? "scale-[1.08]" : ""
      }`}>
        {/* Shimmer effect */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
        </div>
        
        {/* Pulsing urgency ring */}
        <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping opacity-30" />
        
        {/* Cart icon with badge */}
        <div className="relative">
          <ShoppingBag className="w-6 h-6" />
          <span className={`absolute -top-2.5 -right-2.5 w-6 h-6 bg-white text-accent text-xs font-black rounded-full flex items-center justify-center shadow-medium border-2 border-accent/20 ${
            justUpdated ? "animate-bounce scale-125" : "animate-bounce-subtle"
          }`}>
            {totalItems}
          </span>
        </div>
        
        {/* Content with urgency */}
        <div className="text-left">
          <div className="text-xs opacity-90 font-semibold uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Finalizar pedido
          </div>
          <div className="text-xl font-black tracking-tight">
            R$ {subtotal.toFixed(2).replace(".", ",")}
          </div>
        </div>
        
        {/* Arrow */}
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </button>
  );
}
