import { useState, useEffect } from "react";
import { useMyStore, useUpdateStore, OpeningHour } from "@/hooks/useStore";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, MapPin, Clock, CreditCard, Save, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import {
  THEME_PRESETS,
  type StoreThemePresetId,
  parseThemeColorField,
  serializeThemeConfig,
  applyThemeToDocument,
} from "@/lib/storeTheme";
import { InfoTab } from "@/components/admin/settings/InfoTab";
import { LocationTab } from "@/components/admin/settings/LocationTab";
import { HoursTab } from "@/components/admin/settings/HoursTab";
import { PaymentsTab } from "@/components/admin/settings/PaymentsTab";
import { WhatsAppTab } from "@/components/admin/settings/WhatsAppTab";
import { defaultOpeningHours, type SettingsFormData, type CustomPayment } from "@/components/admin/settings/types";

export default function Settings() {
  const { data: store, isLoading } = useMyStore();
  const updateStore = useUpdateStore();

  const [formData, setFormData] = useState<SettingsFormData>({
    name: "",
    slug: "",
    description: "",
    logo_url: "",
    cover_image_url: "",
    address: "",
    google_maps_url: "",
    phone: "",
    whatsapp: "",
    whatsapp_message: "",
    instagram: "",
    delivery_fee: "0",
    min_order: "0",
    estimated_time: "30-45 min",
    is_open: true,
    theme_color: "#f97316",
    accepted_payments: [],
    opening_hours: defaultOpeningHours,
    rating: "4.8",
    review_count: "0",
    checkout_link: "",
    custom_payments: [],
    help_button_enabled: true,
    help_button_message: "",
  });

  const [themePreset, setThemePreset] = useState<StoreThemePresetId>("pizzaria");
  const [themeAccent, setThemeAccent] = useState("#22c55e");
  const [themeFontHeading, setThemeFontHeading] = useState("Plus Jakarta Sans");
  const [themeFontBody, setThemeFontBody] = useState("Plus Jakarta Sans");
  const [useCustomHeadingFont, setUseCustomHeadingFont] = useState(false);
  const [useCustomBodyFont, setUseCustomBodyFont] = useState(false);
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [pickupEnabled, setPickupEnabled] = useState(true);

  useEffect(() => {
    if (store) {
      const themeParsed = parseThemeColorField(store.theme_color);
      const config = themeParsed.config;
      const legacyHex = themeParsed.legacyHex;
      const presetFromConfig = (config?.preset as StoreThemePresetId | undefined) || "pizzaria";
      const presetDefaults = THEME_PRESETS[presetFromConfig];
      const primaryColor = config?.primary || presetDefaults.primary || legacyHex || "#f97316";

      const openingHoursFromDb = (store.opening_hours as OpeningHour[] | null | undefined) || [];

      setFormData({
        name: store.name || "",
        slug: store.slug || "",
        description: store.description || "",
        logo_url: store.logo_url || "",
        cover_image_url: store.cover_image_url || "",
        address: store.address || "",
        google_maps_url: store.google_maps_url || "",
        phone: store.phone || "",
        whatsapp: store.whatsapp || "",
        whatsapp_message: store.whatsapp_message || "",
        instagram: store.instagram || "",
        delivery_fee: store.delivery_fee?.toString() || "0",
        min_order: store.min_order?.toString() || "0",
        estimated_time: store.estimated_time || "30-45 min",
        is_open: store.is_open ?? true,
        theme_color: primaryColor,
        accepted_payments: store.accepted_payments || [],
        opening_hours: openingHoursFromDb.length > 0 ? openingHoursFromDb : defaultOpeningHours,
        rating: store.rating?.toString() || "4.8",
        review_count: store.review_count?.toString() || "0",
        checkout_link: store.checkout_link || "",
        custom_payments: (store.custom_payments as CustomPayment[]) || [],
        help_button_enabled: store.help_button_enabled ?? true,
        help_button_message: store.help_button_message || "",
      });

      setThemePreset(presetFromConfig);
      setThemeAccent(config?.accent || presetDefaults.accent || "#22c55e");
      setThemeFontHeading(config?.fontHeading || presetDefaults.fontHeading || "Plus Jakarta Sans");
      setThemeFontBody(config?.fontBody || presetDefaults.fontBody || "Plus Jakarta Sans");
      setDeliveryEnabled(config?.deliveryEnabled ?? true);
      setPickupEnabled(config?.pickupEnabled ?? true);
      setUseCustomHeadingFont(false);
      setUseCustomBodyFont(false);
    }
  }, [store]);

  // Live theme preview
  useEffect(() => {
    const presetDefaults = THEME_PRESETS[themePreset];
    const themeField = serializeThemeConfig({
      v: 1,
      preset: themePreset,
      primary: formData.theme_color || presetDefaults.primary,
      accent: themeAccent || presetDefaults.accent,
      fontHeading: themeFontHeading || presetDefaults.fontHeading,
      fontBody: themeFontBody || presetDefaults.fontBody,
      deliveryEnabled,
      pickupEnabled,
    });
    return applyThemeToDocument({ themeColorField: themeField, fallbackPrimaryHex: presetDefaults.primary });
  }, [themePreset, formData.theme_color, themeAccent, themeFontHeading, themeFontBody, deliveryEnabled, pickupEnabled]);

  const handleSave = async () => {
    const invalidDay = formData.opening_hours.find((h) => h.isOpen && !h.hours.trim());
    if (invalidDay) {
      toast.error(`Defina o horário de ${invalidDay.day} ou marque como fechado.`);
      return;
    }
    if (!store?.id) {
      toast.error("Não foi possível identificar a loja para salvar as configurações.");
      return;
    }
    if (!deliveryEnabled && !pickupEnabled) {
      toast.error("Ative pelo menos uma opção: Entrega ou Retirada.");
      return;
    }

    await updateStore.mutateAsync({
      id: store.id,
      name: formData.name,
      slug: formData.slug,
      description: formData.description || null,
      logo_url: formData.logo_url || null,
      cover_image_url: formData.cover_image_url || null,
      address: formData.address || null,
      google_maps_url: formData.google_maps_url || null,
      phone: formData.phone || null,
      whatsapp: formData.whatsapp || null,
      whatsapp_message: formData.whatsapp_message || null,
      instagram: formData.instagram || null,
      delivery_fee: parseFloat(formData.delivery_fee) || 0,
      min_order: parseFloat(formData.min_order) || 0,
      estimated_time: formData.estimated_time,
      is_open: formData.is_open,
      theme_color: serializeThemeConfig({
        v: 1,
        preset: themePreset,
        primary: formData.theme_color,
        accent: themeAccent,
        fontHeading: themeFontHeading,
        fontBody: themeFontBody,
        deliveryEnabled,
        pickupEnabled,
      }),
      accepted_payments: formData.accepted_payments,
      opening_hours: formData.opening_hours,
      rating: parseFloat(formData.rating) || 4.8,
      review_count: parseInt(formData.review_count) || 0,
      checkout_link: formData.checkout_link || null,
      custom_payments: formData.custom_payments,
      help_button_enabled: formData.help_button_enabled,
      help_button_message: formData.help_button_message || null,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 sm:h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-slide-up">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-primary/5 via-card to-secondary/30 border border-primary/10 shadow-soft">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl gradient-primary text-white shadow-medium">
              <Store className="w-5 h-5" />
            </span>
            Configurações
          </h1>
          <p className="text-sm text-muted-foreground pl-12">
            Personalize sua vitrine e atraia mais clientes
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={updateStore.isPending}
          className="w-full sm:w-auto gradient-primary hover:opacity-90 transition-all duration-300 shadow-medium hover:shadow-strong hover:-translate-y-0.5"
        >
          {updateStore.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Alterações
        </Button>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="w-full h-auto p-1.5 flex overflow-x-auto no-scrollbar bg-secondary/50 backdrop-blur-sm rounded-xl border border-border/50">
          <TabsTrigger value="info" className="flex-1 min-w-fit gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-soft data-[state=active]:text-primary transition-all duration-200">
            <Store className="w-4 h-4" />
            <span className="hidden xs:inline">Informações</span>
          </TabsTrigger>
          <TabsTrigger value="location" className="flex-1 min-w-fit gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-soft data-[state=active]:text-primary transition-all duration-200">
            <MapPin className="w-4 h-4" />
            <span className="hidden xs:inline">Localização</span>
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex-1 min-w-fit gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-soft data-[state=active]:text-primary transition-all duration-200">
            <Clock className="w-4 h-4" />
            <span className="hidden xs:inline">Horários</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex-1 min-w-fit gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-soft data-[state=active]:text-primary transition-all duration-200">
            <CreditCard className="w-4 h-4" />
            <span className="hidden xs:inline">Pagamentos</span>
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex-1 min-w-fit gap-1.5 px-3 sm:px-4 py-2.5 text-xs sm:text-sm rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-soft data-[state=active]:text-primary transition-all duration-200">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden xs:inline">WhatsApp</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="animate-slide-up">
          <InfoTab
            formData={formData}
            setFormData={setFormData}
            themePreset={themePreset}
            setThemePreset={setThemePreset}
            themeAccent={themeAccent}
            setThemeAccent={setThemeAccent}
            themeFontHeading={themeFontHeading}
            setThemeFontHeading={setThemeFontHeading}
            themeFontBody={themeFontBody}
            setThemeFontBody={setThemeFontBody}
            useCustomHeadingFont={useCustomHeadingFont}
            setUseCustomHeadingFont={setUseCustomHeadingFont}
            useCustomBodyFont={useCustomBodyFont}
            setUseCustomBodyFont={setUseCustomBodyFont}
          />
        </TabsContent>

        <TabsContent value="location">
          <LocationTab
            formData={formData}
            setFormData={setFormData}
            deliveryEnabled={deliveryEnabled}
            setDeliveryEnabled={setDeliveryEnabled}
            pickupEnabled={pickupEnabled}
            setPickupEnabled={setPickupEnabled}
          />
        </TabsContent>

        <TabsContent value="hours">
          <HoursTab formData={formData} setFormData={setFormData} />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsTab formData={formData} setFormData={setFormData} />
        </TabsContent>

        <TabsContent value="whatsapp">
          <WhatsAppTab formData={formData} setFormData={setFormData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
