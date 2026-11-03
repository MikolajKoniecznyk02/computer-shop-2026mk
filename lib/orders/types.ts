export type OrderStatusCode = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export const STATUS_LABELS: Record<OrderStatusCode, string> = {
    PENDING: 'Oczekuje na realizację',
    PAID: 'Opłacone',
    SHIPPED: 'Wysłane',
    DELIVERED: 'Dostarczone',
    CANCELLED: 'Anulowane',
};

export type OrderLineView = {
    position: number;
    productId: number | null; // null, gdy produkt usunięto z katalogu
    code: string; // snapshot
    name: string; // snapshot
    quantity: number;
    unitPrice: number; // grosze, snapshot
    lineTotal: number; // grosze
};

export type OrderSummaryView = {
    number: string;
    status: OrderStatusCode;
    createdAt: string; // ISO
    total: number; // grosze
    itemCount: number;
};

export type OrderDetailView = OrderSummaryView & { lines: OrderLineView[] };