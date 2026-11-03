import { MAX_QUANTITY } from './types';

const MAX_ID = 2147483647;

/** ID produktu lub pozycji: liczba całkowita 1..2147483647 (tekst: cyfry, bez zer wiodących i znaku). */
export function parseIntId(raw: unknown): number | null {
    if (typeof raw === 'number') {
        return Number.isSafeInteger(raw) && raw >= 1 && raw <= MAX_ID ? raw : null;
    }
    if (typeof raw === 'string' && /^[1-9][0-9]*$/.test(raw)) {
        const n = Number(raw);
        return Number.isSafeInteger(n) && n <= MAX_ID ? n : null;
    }
    return null;
}

/** Ilość: całkowita 1..99. Zero, wartości ujemne, ułamki i tekst nienumeryczny dają null. */
export function parseQuantity(raw: unknown): number | null {
    let n: number;
    if (typeof raw === 'number') n = raw;
    else if (typeof raw === 'string' && /^(0|[1-9][0-9]*)$/.test(raw)) n = Number(raw);
    else return null;
    return Number.isSafeInteger(n) && n >= 1 && n <= MAX_QUANTITY ? n : null;
}