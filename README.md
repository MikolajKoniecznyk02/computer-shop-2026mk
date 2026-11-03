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

## Lab 09 – uwierzytelnianie i koszyk

### Wersje i konfiguracja
better-auth 1.7.7, @better-auth/prisma-adapter 1.7.14, auth (CLI) 1.7.7 (dokładnie w lockfile). Node 24, Next.js 16.3.8, Prisma 7.x, PostgreSQL 17.
GitHub OAuth App: homepage http://localhost:3000, callback http://localhost:3000/api/auth/callback/github, scope user:email.
Zmienne: BETTER_AUTH_SECRET, BETTER_AUTH_URL, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, DATABASE_URL (patrz .env.example).
Sesje w PostgreSQL, session.cookieCache wyłączone (unieważnienie sesji w bazie działa od razu).
CSRF i sprawdzanie pochodzenia: włączone (disableCSRFCheck / disableOriginCheck nie są używane).

### Migracje
auth_cart: Session, Account, Verification (User z Lab 08 rozszerzony o relacje), CartItem -> Product: Restrict. CHECK quantity BETWEEN 1 AND 99 (migracja `cart` z Lab 08).
Generowanie pomocnicze: npx --no-install auth generate --config auth.ts --adapter prisma --output auth.prisma (plik usunięty po scaleniu). Migracje stosuje Prisma CLI.

### Kontrakt operacji (lib/cart/access.ts)
getMyCart, addProduct(productId), setQuantity(itemId, quantity), removeItem(itemId). Żadna nie przyjmuje właściciela, ceny ani sumy.
Właściciel ustalany w jednym miejscu: currentUserId() w lib/cart/access.ts (session.user.id z auth.api.getSession z nagłówków żądania).

### Polityka ilości
1..99 i nie więcej niż aktualny stan. Zero, ujemne, ułamki -> błąd. Koszyk nie rezerwuje towaru i nie zmienia Product.amount.
addProduct atomowy: UPDATE ... WHERE quantity < min(99, stan) + obsługa wyścigu przy tworzeniu pozycji (P2002 -> ponów).
Po spadku stanu pozycja jest oznaczona i można ją zmniejszyć lub usunąć. Suma liczona na serwerze w groszach z aktualnych cen.

### Wyniki testów A/B
(wklej: próba podmiany itemId, wynik, stan bazy przed i po; brak sesji; sesja usunięta w bazie)

### Rozszerzenie: sesje na wielu urządzeniach
signOut vs revokeOtherSessions vs revokeSessions, wynik testów i pokazu w dwóch profilach, wpływ cache sesji (sekcja 6.4).

### Źródła
(dokumentacja Better Auth 1.7.7: Next.js, Prisma adapter, GitHub, CLI; Next.js: Authentication, use server, revalidatePath; Prisma 7: relacje, transakcje)

### Ograniczenia
Brak checkoutu (przycisk nieaktywny), brak rezerwacji stanu, brak paginacji, tylko GitHub, brak limitu żądań (rate limit), layout czyta sesję więc strony są dynamiczne,
awaria bazy w nagłówku daje komunikat zamiast błędu całej strony, produkcyjny URL OAuth w Lab 10.