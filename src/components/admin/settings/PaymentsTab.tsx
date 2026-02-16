import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Link } from "lucide-react";
import { quickPaymentOptions, type SettingsFormData, type CustomPayment } from "./types";

interface PaymentsTabProps {
  formData: SettingsFormData;
  setFormData: React.Dispatch<React.SetStateAction<SettingsFormData>>;
}

export function PaymentsTab({ formData, setFormData }: PaymentsTabProps) {
  const [newPaymentName, setNewPaymentName] = useState("");

  const togglePayment = (payment: string) => {
    setFormData((prev) => ({
      ...prev,
      accepted_payments: prev.accepted_payments.includes(payment)
        ? prev.accepted_payments.filter((p) => p !== payment)
        : [...prev.accepted_payments, payment],
    }));
  };

  const addCustomPayment = () => {
    if (!newPaymentName.trim()) return;
    const newPayment: CustomPayment = { id: Date.now().toString(), name: newPaymentName.trim() };
    setFormData((prev) => ({
      ...prev,
      custom_payments: [...prev.custom_payments, newPayment],
      accepted_payments: [...prev.accepted_payments, newPaymentName.trim()],
    }));
    setNewPaymentName("");
  };

  const removeCustomPayment = (id: string) => {
    const payment = formData.custom_payments.find((p) => p.id === id);
    if (payment) {
      setFormData((prev) => ({
        ...prev,
        custom_payments: prev.custom_payments.filter((p) => p.id !== id),
        accepted_payments: prev.accepted_payments.filter((p) => p !== payment.name),
      }));
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Pagamentos Rápidos</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Selecione as formas de pagamento aceitas</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="grid gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-3">
            {quickPaymentOptions.map((payment) => (
              <div
                key={payment.id}
                onClick={() => togglePayment(payment.name)}
                className={`p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  formData.accepted_payments.includes(payment.name)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-lg sm:text-2xl">{payment.icon}</span>
                  <span className="font-medium text-xs sm:text-sm flex-1 line-clamp-1">{payment.name}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Personalizadas</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Adicione formas de pagamento customizadas</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
          <div className="flex gap-2">
            <Input value={newPaymentName} onChange={(e) => setNewPaymentName(e.target.value)} placeholder="Ex: Boleto, PicPay..." onKeyDown={(e) => e.key === "Enter" && addCustomPayment()} className="h-10 text-sm" />
            <Button onClick={addCustomPayment} size="icon" className="shrink-0 h-10 w-10"><Plus className="w-4 h-4" /></Button>
          </div>

          {formData.custom_payments.length > 0 && (
            <div className="space-y-2">
              {formData.custom_payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <span className="font-medium text-sm">{payment.name}</span>
                  <Button variant="ghost" size="icon" onClick={() => removeCustomPayment(payment.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Ativas:</h4>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {formData.accepted_payments.map((payment) => (
                <Badge key={payment} variant="secondary" className="text-xs">{payment}</Badge>
              ))}
              {formData.accepted_payments.length === 0 && (
                <span className="text-xs text-muted-foreground">Nenhuma selecionada</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Link className="w-4 h-4 sm:w-5 sm:h-5" />
            Link de Checkout
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Link de pagamento externo (opcional)</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3">
          <div className="space-y-2">
            <Label htmlFor="checkout_link" className="text-sm">Link de Pagamento</Label>
            <Input id="checkout_link" type="url" value={formData.checkout_link} onChange={(e) => setFormData({ ...formData, checkout_link: e.target.value })} placeholder="https://seulink.com/pagamento" className="h-10 text-sm" />
            <p className="text-xs text-muted-foreground">PagSeguro, Mercado Pago, PicPay, etc.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
