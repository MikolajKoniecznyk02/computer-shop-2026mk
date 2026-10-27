import type { ProductType } from './schema';

export const TYPE_LABELS: Record<ProductType, string> = {
    cpu: 'Procesor',
    gpu: 'Karta graficzna',
    ram: 'Pamięć RAM',
    disk: 'Dysk',
};

const priceFormat = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' });
//cena w groszach -> cena w złotych z symbolem waluty
export const formatPrice = (grosze: number) => priceFormat.format(grosze / 100);

// stała strefa UTC, żeby serwer i przeglądarka pokazywały to samo
const dateFormat = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'long', timeZone: 'UTC' });
export const formatDate = (iso: string) => dateFormat.format(new Date(iso));