const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ORDER_NUMBER = /^ZAM-[0-9]{4}-[0-9]{4}$/;

export function parseRequestKey(raw: unknown): string | null {
    return typeof raw === 'string' && UUID.test(raw) ? raw : null;
}

export function parseOrderNumber(raw: unknown): string | null {
    return typeof raw === 'string' && ORDER_NUMBER.test(raw) ? raw : null;
}