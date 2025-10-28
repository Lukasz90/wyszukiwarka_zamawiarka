# Dinlogic AI Order Widget — instrukcja instalacji i użytkowania

## Wymagania wstępne
- WordPress 6.2 lub nowszy
- WooCommerce 7.0 lub nowszy
- PHP w wersji 7.4 lub nowszej (rekomendowane 8.1+)
- Aktywna pamięć podręczna obiektowa (opcjonalnie, dla lepszej wydajności)

## Instalacja
1. **Pobierz paczkę wtyczki** – spakuj katalog `dinlogic-ai-order-widget` do archiwum `.zip` albo użyj gotowego release.
2. **Zaloguj się do WordPressa** jako administrator.
3. Przejdź do `Wtyczki → Dodaj nową → Wyślij wtyczkę na serwer`.
4. Wskaż archiwum `.zip` i kliknij `Zainstaluj teraz`, następnie `Aktywuj`.
5. Po aktywacji pojawi się nowa pozycja menu `WooCommerce → AI Zamówienia`.

> **Alternatywa developerska:** skopiuj katalog wtyczki do `wp-content/plugins/` i uruchom `composer install && npm install` (jeśli potrzebne są zależności developerskie), a następnie aktywuj w panelu.

## Konfiguracja podstawowa
1. Wejdź w `WooCommerce → AI Zamówienia`.
2. W zakładce **Dostawcy** wybierz tryb rozpoznawania mowy i OCR:
   - Przeglądarka (Web Speech API / Tesseract.js) – brak dodatkowych kluczy.
   - Whisper / serwerowy OCR – uzupełnij adres endpointu i klucz API.
3. W sekcji **Family Registry** wklej/edytuj zawartość `families.yaml`.
   - Użyj przycisku walidacji, aby upewnić się, że składnia jest poprawna.
   - Możesz importować/eksportować definicję w formacie YAML lub JSON.
4. W zakładce **Mapowanie atrybutów WooCommerce** przypisz atrybuty produktów (`pa_*`) do definicji rodzin.
5. W sekcji **Zachowanie koszyka** wybierz reakcję po dodaniu pozycji (przejście do koszyka lub powiadomienie toast).
6. Zapisz ustawienia.

## Dodawanie widgetu na stronę
- **Shortcode:** umieść `[ai_order_widget]` w treści strony lub wpisu.
- **Gutenberg:** dodaj blok „Dinlogic AI Order Widget” i ustaw preferowane opcje wyświetlania.
- Widget wykorzystuje enqueueowane zasoby z katalogu `public/build`. Jeśli rozwijasz front-end, uruchom `npm run build` (lub `npm run dev` w trybie watch) w katalogu `public/`.

## Korzystanie z widgetu
Widget udostępnia trzy zakładki:

### 1. Szukaj
- Wpisz nazwę, SKU, MPN lub frazę. Wyniki odświeżają się po 300 ms od ostatniego znaku.
- Każdy wynik pokazuje miniaturę, cenę, dostępność i kluczowe atrybuty.
- Wybierz warianty (jeśli wymagane) i kliknij `Dodaj do koszyka` bez przeładowania strony.

### 2. Głos
- Kliknij ikonę mikrofonu, aby rozpocząć nasłuch. Widzisz aktualny stan (nasłuch / przetwarzanie).
- Po zakończeniu nagrania edytuj transkrypt i potwierdź wysłanie do parsera.
- Widget zaprezentuje kandydatów z sugerowanymi produktami; wybierz `Dodaj wszystko`, aby masowo dodać do koszyka.

### 3. Zdjęcie
- Przeciągnij plik lub wykonaj zdjęcie aparatem.
- Sprawdź podgląd tekstu z OCR, wprowadź poprawki, a następnie pozwól parserowi dopasować produkty.
- Z listy kandydatów wybierz `Dodaj wszystko` lub pojedyncze pozycje.

## Logi i diagnostyka
- Włącz logowanie w panelu ustawień, aby zbierać informacje o błędach STT/OCR oraz nieudanych dopasowaniach.
- Logi są przechowywane przez konfigurowalną liczbę dni; możesz je pobrać w formacie CSV.

## Aktualizacja indeksu wyszukiwania
- Indeks produktów budowany jest automatycznie i odświeżany przez WP-Cron (co 15 minut) lub przy zmianach w katalogu.
- Jeśli potrzebujesz ręcznego odświeżenia, użyj przycisku „Przebuduj indeks” w panelu ustawień.

## Typowe problemy
| Problem | Rozwiązanie |
| --- | --- |
| Brak wyników w wyszukiwarce | Sprawdź, czy produkty mają wypełnione SKU/MPN oraz czy indeks został przebudowany. |
| Błąd nonce przy dodawaniu do koszyka | Upewnij się, że użytkownik jest zalogowany lub odśwież stronę z poprawnym nonce WordPressa. |
| Parser wymaga brakujących atrybutów | Uzupełnij brakujące pola w interfejsie wariantów albo zaktualizuj `families.yaml`. |
| OCR zwraca zniekształcony tekst | Spróbuj użyć wyraźniejszego zdjęcia lub przełącz się na serwerowy tryb OCR. |

## Dalsze kroki dla zespołu
- Dodaj testy jednostkowe (PHPUnit, Vitest/Jest) i e2e (Cypress) zgodnie z wymaganiami projektu.
- Rozważ integrację z zewnętrznym silnikiem wyszukiwania (Meilisearch/Elasticsearch), jeśli standardowy indeks okaże się niewystarczający.

---
W razie pytań skontaktuj się z zespołem Dinlogic lub zajrzyj do dokumentacji w katalogu `inc/` oraz `public/src/`.
