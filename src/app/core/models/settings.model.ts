/** GET /api/store/settings — config pública (header, footer, flags de checkout). */
export interface StoreSettings {
  storeName: string;
  whatsapp: string | null; // número de la tienda (se usa en el checkout)
  email: string | null;
  address: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  bannerText: string | null;
  logoUrl: string | null;
  bannerImageUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  currency: string | null; // ej. "PEN"
  currencySymbol: string | null; // ej. "S/"
  pricesIncludeTax: boolean;
  allowPickup: boolean; // ¿ofrece retiro en tienda?
  allowDelivery: boolean; // ¿ofrece delivery?
  acceptCash: boolean; // ¿acepta efectivo?
  acceptBankTransfer: boolean; // ¿acepta transferencia?
  businessHours: string | null;
  maintenanceMode: boolean; // si true, el checkout responde 503
}
