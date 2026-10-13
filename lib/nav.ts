export type AriaCurrent = 'page' | 'true' | undefined;

/**
 * 'page'  – link prowadzi dokładnie do bieżącej strony,
 * 'true'  – bieżąca strona leży wewnątrz sekcji, na którą wskazuje link,
 * undefined – brak relacji. Dopasowanie po granicy segmentu: /product-list-old to NIE jest sekcja /product-list.
 */
export function getAriaCurrent(href: string, pathname: string): AriaCurrent {
    if (pathname === href) return 'page';
    if (href !== '/' && pathname.startsWith(href + '/')) return 'true';
    return undefined;
}