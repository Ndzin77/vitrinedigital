import { OpeningHour } from "@/hooks/useStore";

export interface CustomPayment {
  id: string;
  name: string;
  description?: string;
}

export interface SettingsFormData {
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  cover_image_url: string;
  address: string;
  google_maps_url: string;
  phone: string;
  whatsapp: string;
  whatsapp_message: string;
  instagram: string;
  delivery_fee: string;
  min_order: string;
  estimated_time: string;
  is_open: boolean;
  theme_color: string;
  accepted_payments: string[];
  opening_hours: OpeningHour[];
  rating: string;
  review_count: string;
  checkout_link: string;
  custom_payments: CustomPayment[];
  help_button_enabled: boolean;
  help_button_message: string;
}

export const defaultOpeningHours: OpeningHour[] = [
  { day: "Segunda", hours: "08:00 - 18:00", isOpen: true },
  { day: "Terça", hours: "08:00 - 18:00", isOpen: true },
  { day: "Quarta", hours: "08:00 - 18:00", isOpen: true },
  { day: "Quinta", hours: "08:00 - 18:00", isOpen: true },
  { day: "Sexta", hours: "08:00 - 18:00", isOpen: true },
  { day: "Sábado", hours: "08:00 - 14:00", isOpen: true },
  { day: "Domingo", hours: "", isOpen: false },
];

export const quickPaymentOptions = [
  { id: "pix", name: "Pix", icon: "💳" },
  { id: "credito", name: "Cartão de Crédito", icon: "💳" },
  { id: "debito", name: "Cartão de Débito", icon: "💳" },
  { id: "dinheiro", name: "Dinheiro", icon: "💵" },
  { id: "vale_refeicao", name: "Vale Refeição", icon: "🎫" },
  { id: "vale_alimentacao", name: "Vale Alimentação", icon: "🎫" },
];
