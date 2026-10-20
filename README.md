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

## Rozszerzenie: Read-only API
`GET /api/products?type=cpu|gpu|ram|disk&sort=name|date&availability=available|unavailable`
- 200 + tablica produktów (również pusta `[]` dla poprawnego zapytania bez wyników),
- 400 + `{ error, details }` dla błędnej wartości parametru,
- 500 + ogólny komunikat przy awarii repozytorium (szczegóły tylko w logu serwera).
Route Handler i strona /product-list korzystają z tego samego modułu `lib/products/repository.ts`;
strona nie wykonuje żądania HTTP do własnego API.
Ograniczenia: brak paginacji, brak uwierzytelniania, nieznane parametry są ignorowane.



## Lab 07 – trasy dynamiczne i filtry

### Trasy i kontrakt URL
- `/product-list` – katalog; `/product-list/<id>` – szczegóły (id: 1–2147483647, bez zer wiodących).
- Parametry: `type` (all|cpu|gpu|ram|disk), `stock` (all|available|unavailable), `sort` (name|newest). Domyślnie all/all/name.
- Błędna, pusta lub powtórzona wartość → wartość domyślna + komunikat; nieznane nazwy parametrów ignorowane.
- Przykłady: `/product-list?type=gpu&stock=available&sort=newest`, `/product-list/8`, `/product-list?type=cpu&stock=unavailable` (pusty wynik).
- Remisy w obu sortowaniach: id rosnąco. `name`: klucz nazw i porównanie jak w Lab 06; `newest`: data malejąco.
- Zmiana danych: generator – co 8. produkt ma amount 0 (tylko disk), aby istniała kombinacja bez wyników.

### Wersje, wyniki sprawdzeń
(Node, npm, Next.js; lint - bez błędów; testy - bez błędów N; build - bez błędów;)

### Rozszerzenie: generateStaticParams
Zbiór: id 1–10; dynamicParams = true (uzasadnienie); fragment wyniku buildu;

dynamiczny render
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /about
├ ƒ /api/products
├ ○ /basket
├ ○ /order-history
├ ƒ /product-list
└ ƒ /product-list/[id]

statyczny prerender
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /about
├ ƒ /api/products
├ ○ /basket
├ ○ /order-history
├ ƒ /product-list
└   /product-list/[id]
  ├ ● /product-list/10
  ├ ● /product-list/8
  ├ ● /product-list/1
  └ ● [+7 more paths]

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand

### Źródła
Dynamic Segments
page/searchParams
notFound
generateMetadata
next/form
usePathname
generateStaticParams

### Ograniczenia
Dane tylko do odczytu z JSON, cache w pamięci procesu, brak paginacji, formularz wymaga kliknięcia „Zastosuj”, brak walidacji id po stronie klienta (nie jest potrzebna), prerenderowane strony nie widzą zmian danych bez buildu.