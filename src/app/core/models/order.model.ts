/** Línea del carrito que se envía al checkout. */
export interface CheckoutItem {
  idVariant: number;
  quantity: number; // >= 1
}

/** Body de POST /store/orders. El servidor calcula precios/impuestos/total. */
export interface Checkout {
  customerName: string; // obligatorio, máx 100
  customerPhone: string; // obligatorio, máx 30
  customerEmail?: string; // email válido, máx 100
  customerAddress?: string; // máx 255
  paymentMethod?: PaymentMethod; // máx 20
  notes?: string; // máx 255
  items: CheckoutItem[]; // 1 a 100 líneas
}

export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CARD' | 'MIXED';

/** Respuesta 201 del checkout. */
export interface CheckoutResult {
  orderNumber: string; // ej. "ORD-LXK3-9F2A"
  publicToken: string; // token para el seguimiento (guárdalo)
  status: string; // "PN"
  total: number;
  whatsappUrl: string | null; // abre el chat con la tienda con el detalle
}

export interface OrderTrackingItem {
  productName: string;
  variantName: string | null;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  totalPrice: number;
}

export interface OrderStatusHistory {
  status: string;
  comment: string | null;
  createdAt: string;
}

/** GET /store/orders/:token — seguimiento (sin datos internos). */
export interface OrderTracking {
  orderNumber: string;
  status: string;
  customerName: string;
  subtotal: number;
  discount: number;
  taxTotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: string | null;
  whatsappUrl: string | null;
  createdAt: string; // ISO
  expiresAt: string | null; // ISO
  items: OrderTrackingItem[];
  statusHistory: OrderStatusHistory[];
}

export type OrderStatusCode =
  | 'QT'
  | 'PN'
  | 'CF'
  | 'PD'
  | 'PR'
  | 'RD'
  | 'DV'
  | 'CN'
  | 'EX';

/** Leyenda de estados del pedido (para el seguimiento). */
export const ORDER_STATUS: Record<
  string,
  { label: string; tone: 'pending' | 'active' | 'success' | 'danger' | 'muted' }
> = {
  QT: { label: 'Cotización', tone: 'muted' },
  PN: { label: 'Pendiente de pago', tone: 'pending' },
  CF: { label: 'Confirmada', tone: 'active' },
  PD: { label: 'Pagada', tone: 'success' },
  PR: { label: 'En preparación', tone: 'active' },
  RD: { label: 'Lista / entregada', tone: 'success' },
  DV: { label: 'Devuelta', tone: 'danger' },
  CN: { label: 'Cancelada', tone: 'danger' },
  EX: { label: 'Expirada', tone: 'muted' },
};

/** Métodos de pago con etiqueta legible (para el checkout). */
export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  CARD: 'Tarjeta',
  MIXED: 'Mixto',
};
