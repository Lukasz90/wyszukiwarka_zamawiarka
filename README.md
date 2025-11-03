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

## Debugowanie wyszukiwania

W celu diagnozowania problemów z wyszukiwaniem możesz:

- tymczasowo włączyć logowanie: `wp option update dinlogic_aiw_logging_enabled 1` (logi trafią do standardowego dziennika PHP),
- dodać parametr `debug=1` do zapytania REST, np. `/wp-json/aiw/v1/search?q=przewód&debug=1`; dodatkowe dane debugowe otrzymają wyłącznie administratorzy (`manage_options`).

Aby wyłączyć logi po zakończeniu analizy, wykonaj `wp option update dinlogic_aiw_logging_enabled 0`.
