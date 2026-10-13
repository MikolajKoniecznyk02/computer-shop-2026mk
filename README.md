# Sklep komputerowy 2026 – Lab 06

## Wersje
Node.js 24.x (`node -v`), npm X.Y (`npm -v`), Next.js 16.3.8, TypeScript, ESLint, App Router, Turbopack (domyślny).

## Uruchomienie
npm ci · npm run lint · npm run test · npm run build · npm run start
Dane: `npm run generate:data` (ziarno 20261001), grafiki: `npm run generate:images`.

## Struktura
(krótki opis: app/, components/, lib/products/{schema,query,repository}.ts, data/, scripts/)

## Decyzje
- cena(price) w groszach, wyświetlane w zł przez Intl.NumberFormat.
- Sortowanie: nazwa  od A do Z, data malejąco; remis: id rosnąco. Brak produktu: null.
- Repozytorium asynchroniczne, import 'server-only'; tylko odczyt.
- Zagnieżdżony layout /product-list: nagłówek sekcji (użyty w Lab 07).

## Źródła i prawa do grafik
Dokumentacja: Next.js (Layouts and Pages, Server and Client Components, Error Handling, error.js, not-found.js).

## Wyniki sprawdzeń
(lint - 1 problem(nie użyty import) , test - 12 testów udanych, build udany, start udany)

## Odpowiedzi na pytania
(patrz niżej)

## Ograniczenia
JSON zamiast bazy, brak trwałości, cache w pamięci procesu, brak filtrów w URL, brak szczegółów produktu, brak paginacji (100 kart na jednej stronie).