import type { Product, ProductType } from './schema';

export type SortKey = 'name' | 'date';
export type Availability = 'available' | 'unavailable';

export type ProductQuery = {
    sort?: SortKey;            // name: A→Z, date: od najnowszych
    availability?: Availability;
    type?: ProductType;
};

export function queryProducts(products: readonly Product[], q: ProductQuery = {}): Product[] {
    let result = [...products]; // kopia, wejście nie jest mutowane

    if (q.type) result = result.filter((p) => p.type === q.type);
    if (q.availability === 'available') result = result.filter((p) => p.amount > 0);
    if (q.availability === 'unavailable') result = result.filter((p) => p.amount === 0);

    const sort = q.sort ?? 'name';
    result.sort((a, b) => {
        const primary =
            sort === 'name'
                ? a.name.localeCompare(b.name, 'pl')
                : b.date.localeCompare(a.date); // ISO UTC sortuje się leksykograficznie
        return primary !== 0 ? primary : a.id - b.id; // remis: rosnąco po id
    });
    return result; // pusty wynik = pusta tablica, bez wyjątku
}