# Dinlogic AI Order Widget

Repozytorium zawiera wtyczkę WordPress/WooCommerce „Dinlogic AI Order Widget”. Wtyczka zapewnia widżet do szybkiego kompletowania zamówień z wykorzystaniem wyszukiwania, głosu oraz OCR.

## Dokumentacja produktu

- [Widget szybkich zamówień – Brief projektu v0.5](docs/widget-szybkich-zamowien-brief.md)

## Struktura repozytorium

- `dinlogic-ai-order-widget/` – kod źródłowy wtyczki.
- `docs/` – dokumentacja produktu oraz materiały analityczne.

## Budowanie zasobów frontendu

W katalogu `dinlogic-ai-order-widget/` dostępna jest konfiguracja narzędzi (`package.json`, `tsconfig.json`, `scripts/build.mjs`).

```
cd dinlogic-ai-order-widget
npm install
npm run build
```

Polecenie `npm run build` wygeneruje pliki w katalogu `public/build/`. Repozytorium zawiera również gotowe, zbudowane pliki, dzięki czemu wtyczkę można testować bez wcześniejszej kompilacji.

## Rozwój

Projekt jest w fazie aktywnego rozwoju. W briefie produktu znajdują się wymagania MVP, roadmapa oraz decyzje produktowe, które należy uwzględniać podczas implementacji kolejnych funkcji.
