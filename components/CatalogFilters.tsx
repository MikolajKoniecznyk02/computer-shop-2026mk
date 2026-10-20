import Form from 'next/form';
import Link from 'next/link';
import type { CatalogCriteria } from '@/lib/products/catalog-params';

const TYPE_OPTIONS = [
    ['all', 'Wszystkie'], ['cpu', 'Procesory'], ['gpu', 'Karty graficzne'],
    ['ram', 'Pamięci RAM'], ['disk', 'Dyski'],
] as const;
const STOCK_OPTIONS = [
    ['all', 'Wszystkie'], ['available', 'Dostępne'], ['unavailable', 'Niedostępne'],
] as const;
const SORT_OPTIONS = [['name', 'Nazwa A→Z'], ['newest', 'Najnowsze']] as const;

function Select({ id, name, label, value, options }: {
    id: string; name: string; label: string; value: string;
    options: readonly (readonly [string, string])[];
}) {
    return (
        <div className="field">
            <label htmlFor={id}>{label}</label>
            <select id={id} name={name} defaultValue={value}>
                {options.map(([v, text]) => <option key={v} value={v}>{text}</option>)}
            </select>
        </div>
    );
}

export default function CatalogFilters({ criteria }: { criteria: CatalogCriteria }) {
    return (
        <Form action="/product-list" className="filters" aria-label="Filtry katalogu">
            <Select id="f-type" name="type" label="Kategoria" value={criteria.type} options={TYPE_OPTIONS} />
            <Select id="f-stock" name="stock" label="Dostępność" value={criteria.stock} options={STOCK_OPTIONS} />
            <Select id="f-sort" name="sort" label="Sortowanie" value={criteria.sort} options={SORT_OPTIONS} />
            <div className="field actions">
                <button type="submit">Zastosuj</button>
                <Link href="/product-list">Wyczyść filtry</Link>
            </div>
        </Form>
    );
}