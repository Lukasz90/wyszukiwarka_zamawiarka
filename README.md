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

## FAQ: Jak używać wtyczki?

**Jak zainstalować wtyczkę?**

1. W panelu WordPress przejdź do `Wtyczki → Dodaj nową`.
2. Kliknij „Wyślij wtyczkę na serwer” i wskaż paczkę ZIP wygenerowaną z katalogu `dinlogic-ai-order-widget`.
3. Po przesłaniu kliknij „Aktywuj”.

**Jak dodać widżet na stronie głównej?**

1. Przejdź do `Wygląd → Widgety` lub edytora blokowego strony głównej.
2. Dodaj blok „Dinlogic AI Order Widget” w wybranym miejscu.
3. Zapisz zmiany – widżet pojawi się w interfejsie sklepu.

**Jak działa szybkie wyszukiwanie?**

- Wpisz nazwę produktu lub jego fragment w polu wyszukiwania widżetu.
- Najlepsze dopasowania są oznaczone procentem trafienia i można je dodać do koszyka jednym kliknięciem.
- Aby rozszerzyć wyniki, możesz skorzystać z komend głosowych lub wczytać zdjęcie listy zakupowej.

**W jaki sposób korzystać z inwestycji i budżetów?**

1. Po otwarciu widżetu wybierz istniejącą inwestycję lub utwórz nową, podając jej nazwę/adres.
2. Dodawane pozycje zostaną automatycznie przypisane do inwestycji, a widżet pokaże koszty przed i po rabacie.
3. Jeżeli ustawiono limit budżetu, system poinformuje o zbliżaniu się do progu.

**Jak wygenerować ofertę dla klienta końcowego?**

1. Po skompletowaniu koszyka kliknij przycisk generowania oferty PDF/CSV.
2. Uzupełnij dane klienta i zatwierdź.
3. Plik będzie zawierał ceny brutto sprzed rabatu, zgodnie z decyzjami produktowymi.

**Jak włączyć obsługę głosową?**

- Użytkownik musi nadać przeglądarce uprawnienie do mikrofonu.
- Po kliknięciu przycisku push-to-talk wypowiedz komendę (np. „dodaj przewód 3x1,5, ilość pięć”).
- Widżet zweryfikuje rozpoznanie – w trybie hałasu wymagane jest potwierdzenie „zatwierdź”.

**Czy można importować listę zakupów ze zdjęcia?**

- Tak. Użyj przycisku „Dodaj z zdjęcia” i prześlij fotografię notatki.
- Widżet zaproponuje dopasowania produktów oraz ilości; możesz je poprawić przed dodaniem wszystkiego do koszyka.

## Debugowanie wyszukiwania

W celu diagnozowania problemów z wyszukiwaniem możesz:

- tymczasowo włączyć logowanie: `wp option update dinlogic_aiw_logging_enabled 1` (logi trafią do standardowego dziennika PHP),
- dodać parametr `debug=1` do zapytania REST, np. `/wp-json/aiw/v1/search?q=przewód&debug=1`; dodatkowe dane debugowe otrzymają wyłącznie administratorzy (`manage_options`).

Aby wyłączyć logi po zakończeniu analizy, wykonaj `wp option update dinlogic_aiw_logging_enabled 0`.
