import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OpeningHour } from "@/hooks/useStore";
import type { SettingsFormData } from "./types";

interface HoursTabProps {
  formData: SettingsFormData;
  setFormData: React.Dispatch<React.SetStateAction<SettingsFormData>>;
}

const hasMultipleIntervals = (raw: string): boolean => raw.includes('/');

const parseSimpleRange = (raw: string): { open: string; close: string } | null => {
  const match = raw.trim().match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/);
  if (!match) return null;
  return { open: match[1], close: match[2] };
};

const formatSimpleRange = (open: string, close: string) => {
  if (!open && !close) return "";
  if (!open || !close) return "";
  return `${open} - ${close}`;
};

export function HoursTab({ formData, setFormData }: HoursTabProps) {
  const [advancedHoursDays, setAdvancedHoursDays] = useState<Record<string, boolean>>(() => {
    const advanced: Record<string, boolean> = {};
    formData.opening_hours.forEach((h) => {
      if (h.hours && hasMultipleIntervals(h.hours)) {
        advanced[h.day] = true;
      }
    });
    return advanced;
  });

  const updateSimpleTime = (index: number, part: "open" | "close", value: string) => {
    setFormData((prev) => {
      const current = prev.opening_hours[index];
      const parsed = parseSimpleRange(current.hours);
      const open = part === "open" ? value : parsed?.open || "";
      const close = part === "close" ? value : parsed?.close || "";
      const nextHours = formatSimpleRange(open, close) || current.hours;
      return {
        ...prev,
        opening_hours: prev.opening_hours.map((h, i) => (i === index ? { ...h, hours: nextHours } : h)),
      };
    });
  };

  const updateOpeningHour = (index: number, field: keyof OpeningHour, value: string | boolean) => {
    setFormData((prev) => {
      const next = prev.opening_hours.map((hour, i) => {
        if (i !== index) return hour;
        const updated = { ...hour, [field]: value } as OpeningHour;
        if (field === "isOpen" && value === false) return { ...updated, hours: "" };
        return updated;
      });
      return { ...prev, opening_hours: next };
    });
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg">Horários de Funcionamento</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Configure os horários por dia (modo simples) ou personalize com intervalos
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-2 sm:space-y-3">
        {formData.opening_hours.map((hour, index) => (
          (() => {
            const isAdvanced = advancedHoursDays[hour.day] || false;
            const simple = !isAdvanced ? parseSimpleRange(hour.hours) : null;

            return (
              <div
                key={hour.day}
                className={`p-3 rounded-xl border transition-all ${
                  hour.isOpen
                    ? "border-primary/20 bg-primary/5"
                    : "border-border bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-3 mb-2 sm:mb-0">
                  <Switch
                    checked={hour.isOpen}
                    onCheckedChange={(checked) => updateOpeningHour(index, "isOpen", checked)}
                  />
                  <span className={`text-sm font-medium w-20 ${hour.isOpen ? "text-foreground" : "text-muted-foreground"}`}>
                    {hour.day}
                  </span>

                  {!hour.isOpen ? (
                    <span className="text-xs text-muted-foreground italic">Fechado</span>
                  ) : (
                    <div className="flex-1">
                      {/* Simple mode */}
                      {!isAdvanced && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Input type="time" value={simple?.open || ""} onChange={(e) => updateSimpleTime(index, "open", e.target.value)} className="h-9 text-sm flex-1 sm:w-[120px] sm:flex-none" />
                            <span className="text-xs text-muted-foreground shrink-0">até</span>
                            <Input type="time" value={simple?.close || ""} onChange={(e) => updateSimpleTime(index, "close", e.target.value)} className="h-9 text-sm flex-1 sm:w-[120px] sm:flex-none" />
                          </div>
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            {simple ? `(${hour.hours})` : "(preencha)"}
                          </span>
                          <Button type="button" variant="ghost" size="sm" className="h-9 shrink-0" onClick={() => setAdvancedHoursDays((prev) => ({ ...prev, [hour.day]: true }))}>
                            Intervalos
                          </Button>
                        </div>
                      )}

                      {/* Advanced mode */}
                      {isAdvanced && (() => {
                        const parseTimeLenient = (raw: string): { open: string; close: string } => {
                          const times = raw.match(/\d{2}:\d{2}/g) || [];
                          return { open: times[0] || "", close: times[1] || "" };
                        };
                        const parseIntervals = (raw: string) => {
                          const parts = raw.split("/").map(p => p.trim());
                          const slot1 = parseTimeLenient(parts[0] || "");
                          const slot2 = parseTimeLenient(parts[1] || "");
                          return { slot1, slot2 };
                        };
                        const { slot1, slot2 } = parseIntervals(hour.hours);

                        const rebuildHours = (s1: { open: string; close: string }, s2: { open: string; close: string }) => {
                          const slot1Str = s1.open && s1.close ? `${s1.open} - ${s1.close}` : s1.open ? `${s1.open} - ` : "";
                          const slot2Str = s2.open && s2.close ? `${s2.open} - ${s2.close}` : s2.open ? `${s2.open} - ` : "";
                          const parts = [slot1Str, slot2Str].filter(s => s && s.trim() !== "-");
                          return parts.join(" / ");
                        };

                        const handleSlotChange = (slot: 1 | 2, part: "open" | "close", value: string) => {
                          const current = parseIntervals(hour.hours);
                          const s1 = { ...current.slot1 };
                          const s2 = { ...current.slot2 };
                          if (slot === 1) s1[part] = value;
                          else s2[part] = value;
                          updateOpeningHour(index, "hours", rebuildHours(s1, s2));
                        };

                        return (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-medium text-primary">Modo Intervalos</span>
                              <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setAdvancedHoursDays((prev) => ({ ...prev, [hour.day]: false }))}>
                                Modo simples
                              </Button>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-muted-foreground">1º Período (manhã)</span>
                              <div className="flex items-center gap-2">
                                <Input type="time" key={`${hour.day}-s1o-${slot1.open}`} defaultValue={slot1.open} onChange={(e) => handleSlotChange(1, "open", e.target.value)} className="h-9 text-sm flex-1" />
                                <span className="text-xs text-muted-foreground shrink-0">até</span>
                                <Input type="time" key={`${hour.day}-s1c-${slot1.close}`} defaultValue={slot1.close} onChange={(e) => handleSlotChange(1, "close", e.target.value)} className="h-9 text-sm flex-1" />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-xs text-muted-foreground">2º Período (tarde/noite)</span>
                              <div className="flex items-center gap-2">
                                <Input type="time" key={`${hour.day}-s2o-${slot2.open}`} defaultValue={slot2.open} onChange={(e) => handleSlotChange(2, "open", e.target.value)} className="h-9 text-sm flex-1" />
                                <span className="text-xs text-muted-foreground shrink-0">até</span>
                                <Input type="time" key={`${hour.day}-s2c-${slot2.close}`} defaultValue={slot2.close} onChange={(e) => handleSlotChange(2, "close", e.target.value)} className="h-9 text-sm flex-1" />
                              </div>
                            </div>
                            {hour.hours && (
                              <div className="text-xs text-primary bg-primary/10 rounded-lg px-3 py-2">
                                Resultado: <strong>{hour.hours}</strong>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            );
          })()
        ))}
        <p className="text-xs text-muted-foreground pt-2">
          💡 Dica: use "Intervalos" para almoço/pausas. O Storefront exibe exatamente o texto salvo.
        </p>
      </CardContent>
    </Card>
  );
}
