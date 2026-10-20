//Klucz sortowania nazwy.
export function computeNameSortKey(name: string): string {
    return name.trim().normalize('NFC').toLowerCase();
}

//Porównanie bajtów UTF-8.
export function compareUtf8(a: string, b: string): number {
    return Buffer.compare(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}