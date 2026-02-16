import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingBag } from "lucide-react";
import { createElement } from "react";

/**
 * Generates a pleasant, warm notification chime using Web Audio API.
 * A 3-note ascending arpeggio with soft attack — sounds professional & friendly.
 */
function playOrderChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;

    // 3-note ascending chord: C5, E5, G5 (major triad = happiness/trust)
    const notes = [523.25, 659.25, 783.99];
    const noteDuration = 0.18;
    const noteGap = 0.12;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Soft sine wave for warmth
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      // Low-pass filter for smoothness
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(2000, now);

      // Envelope: soft attack, gentle decay
      const startTime = now + i * (noteDuration + noteGap);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3 - i * 0.05, startTime + 0.04); // soft attack
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration + 0.3); // gentle decay

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + noteDuration + 0.4);
    });

    // Final shimmer note (octave higher, very quiet)
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = "sine";
    shimmer.frequency.setValueAtTime(1046.5, now); // C6
    const shimmerStart = now + notes.length * (noteDuration + noteGap);
    shimmerGain.gain.setValueAtTime(0, shimmerStart);
    shimmerGain.gain.linearRampToValueAtTime(0.12, shimmerStart + 0.05);
    shimmerGain.gain.exponentialRampToValueAtTime(0.001, shimmerStart + 0.8);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    shimmer.start(shimmerStart);
    shimmer.stop(shimmerStart + 0.9);

    // Cleanup
    setTimeout(() => ctx.close(), 3000);
  } catch (e) {
    console.warn("Could not play notification sound:", e);
  }
}

interface UseOrderNotificationsOptions {
  storeId: string | undefined;
  enabled?: boolean;
}

export function useOrderNotifications({ storeId, enabled = true }: UseOrderNotificationsOptions) {
  const [newOrderCount, setNewOrderCount] = useState(0);
  const lastNotifiedRef = useRef<string | null>(null);
  const isFirstLoadRef = useRef(true);

  const showNotification = useCallback((customerName: string, total: number, orderId: string) => {
    // Avoid duplicate notifications
    if (lastNotifiedRef.current === orderId) return;
    lastNotifiedRef.current = orderId;

    setNewOrderCount(prev => prev + 1);

    // Play chime
    playOrderChime();

    // Visual notification
    toast.success(
      `🎉 Novo pedido de ${customerName || "Cliente"}!`,
      {
        description: `R$ ${total.toFixed(2).replace(".", ",")} — Clique para ver`,
        duration: 8000,
        position: "top-center",
        action: {
          label: "Ver Pedidos",
          onClick: () => {
            window.location.href = "/admin/orders";
          },
        },
        style: {
          background: "hsl(var(--card))",
          border: "2px solid hsl(var(--accent))",
          boxShadow: "0 0 30px hsl(var(--accent) / 0.3)",
        },
      }
    );

    // Browser notification (if permitted)
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(`🛒 Novo Pedido - ${customerName || "Cliente"}`, {
        body: `R$ ${total.toFixed(2).replace(".", ",")}`,
        icon: "/favicon.ico",
        tag: `order-${orderId}`,
      });
    }
  }, []);

  // Request browser notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Subscribe to real-time order inserts
  useEffect(() => {
    if (!storeId || !enabled) return;

    // Mark subscription start time — only notify for orders created AFTER this moment
    const subscriptionStartTime = new Date().toISOString();

    const channel = supabase
      .channel(`orders-realtime-${storeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `store_id=eq.${storeId}`,
        },
        (payload) => {
          const order = payload.new as any;
          
          // Only notify for orders created after we subscribed
          if (order.created_at && order.created_at < subscriptionStartTime) return;

          showNotification(
            order.customer_name || "Cliente",
            Number(order.total) || 0,
            order.id
          );
        }
      )
      .subscribe((status) => {
        console.log("[OrderNotifications] Subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, enabled, showNotification]);

  const clearNewOrderCount = useCallback(() => setNewOrderCount(0), []);

  return { newOrderCount, clearNewOrderCount };
}
