const MAX_ID = 2147483647;

/** Zwraca id albo null. Sprawdza CAŁY tekst: cyfry dziesiętne, bez znaku i bez zer wiodących. */
export function parseProductId(raw: string): number | null {
    if (!/^[1-9][0-9]*$/.test(raw)) return null; // odrzuca abc, 12abc, 0, -1, 01, "", " 1"
    const n = Number(raw);
    if (!Number.isSafeInteger(n) || n > MAX_ID) return null; // 2147483648, 99999999999999999999
    return n;
}