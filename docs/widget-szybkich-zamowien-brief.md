# Widget szybkich zamówień – Brief projektu v0.5 (MVP + Roadmap + User Stories + Decyzje)

**Elevator pitch:** Widżet na stronie głównej, który pozwala instalatorowi w kilka minut skompletować koszyk kilkunastu–kilkudziesięciu pozycji (klawiatura, głos, zdjęcie listy), przypiąć zamówienie do „Inwestycji” i otrzymać przejrzyste podsumowanie kosztów przed/po rabacie.

---

## 1) Dlaczego / Cel
- **Problem użytkownika:** kompletowanie dużych koszyków online jest wolne i męczące; instalator woli podjechać do hurtowni i „podyktować” listę.
- **Cel biznesowy:** skrócić czas złożenia zamówienia wielopozycyjnego i zbliżyć doświadczenie online do zakupów stacjonarnych (a docelowo – je przewyższyć).
- **Efekt dla sklepu:** wyższa konwersja, mniejszy wskaźnik porzuceń, lojalność instalatorów.

## 2) Dla kogo (persony)
- **Instalator/elektryk/automatyk/UR** – pracuje „na inwestycjach”, zamawia 10–50+ pozycji, nosi rabat, potrzebuje dwóch poziomów cen (przed/po rabacie) do rozliczeń z klientem.
- **Właściciel sklepu** – chce uprościć i przyspieszyć zamówienia wielopozycyjne; standaryzować rozliczenia „na inwestycje”.

## 3) Zakres (produktowy, bez technikaliów)
### 3.1 In scope – **MVP**
- Widżet dwupanelowy na stronie głównej:
  - **Lewa kolumna:** wyszukiwanie (klawiatura + obsługa głosowa + wczytanie zdjęcia listy), lista dopasowań z wyraźnym wskazaniem „najlepszego trafienia” i % dopasowania.
  - **Prawa kolumna:** koszyk roboczy z pozycjami, ilościami, cenami (przed/po rabacie) i sumą.
- **Obsługa głosowa v0** – podstawowe komendy (dodawanie, zmiana ilości, następny/dalej, usuń, pokaż koszt, zakończ, „zatwierdź”).
- **Import listy ze zdjęcia** (notatki odręczne/drukowane) → propozycje pozycji + ilości z możliwością korekty; w trybie zdjęcia domyślnie przyjmujemy „najlepsze dopasowanie”.
- **Inwestycje (projekty/adresy)** – założenie/wybór z listy; przypinanie zamówień; w koncie: podsumowania kosztów **przed/po rabacie** na inwestycję.
- **Ceny i rabaty** – prezentacja dwóch poziomów cen w koszyku/podsumowaniach (klarowne etykiety i objaśnienia).
- **Dostawy i ETA** – prezentacja estymowanego czasu dostawy **per pozycja**; możliwość zaproponowania **podziału zamówienia** na 2 dostawy gdy czasy różne.

### 3.2 Rozszerzenia (propozycje dodane do projektu)
- **Zamienniki i zestawy**: szybkie alternatywy (np. rozdzielnia ↔ kompatybilne aparaty); proste reguły kompletacji.
- **Szablony list zakupowych** per inwestycja i **zamówienia cykliczne**.
- **Import CSV/Excel** oraz **parser e‑mail/screenshot** (na później: integracje z ERP/BL).
- **Walidacja jednostek/przekrojów** (ostrzeżenia przy niezgodnościach; m/mb/szt., 1,5 vs 2,5 mm²).
- **Tryb offline – odrzucono** (decyzja: brak; nie buforujemy lokalnie).
- **Historia cen / ostatnie zakupy**.
- **Skan kodów/etykiet** (EAN/producenta) z auto‑rozpoznaniem.
- **Kalkulator materiałowy** (np. przeliczniki kabli; w iteracji późniejszej).
- **Logi audytowe** (kto edytował koszyk w zespole) – na później; brak ról w MVP.
- **A11y, mobile ergonomia** (duże hit‑targety, focus, klawiatura numeryczna na mobile).

### 3.3 Poza zakresem (teraz)
- Stany w czasie rzeczywistym i zaawansowane ETA (możliwe w integracji z ERP/BL).
- Wielojęzyczność wewnątrz wtyczki (języki obsłuży WPML na poziomie sklepu).
- Generowanie ofert **PDF** dla klienta końcowego – **w zakresie** (decyzja poniżej) – ale brand neutral.

## 4) Kluczowe scenariusze (happy path)
1. **Szybkie wyszukiwanie i dodawanie:** wpis/komenda głosowa → najlepsze dopasowanie (+%) → „**dodaj**/„**zatwierdź**” → pozycja trafia do koszyka.
2. **Lista ze zdjęcia:** wgrywam zdjęcie notatki → propozycje pozycji + ilości (domyślnie najlepsze dopasowania) → korekta → „**dodaj wszystko**”.
3. **Praca na inwestycje:** wybieram/zakładam inwestycję (np. „Filomatów 2B”) → zamówienia przypinają się do projektu → w koncie widzę łączny koszt **przed/po rabacie**.
4. **Kontynuacja:** „**następny/dalej**” czyści pole i czeka na kolejną nazwę; na mobile dostępna szybka klawiatura numeryczna.

## 5) Komendy głosowe v0 (propozycja)
- **Dodawanie:** „dodaj”, „[nazwa], [ilość], dodaj/zatwierdź”.
- **Nawigacja:** „następny”, „dalej”, „wróć”, „wyczyść”.
- **Edycja:** „zmień ilość [pozycja] na [ilość]”, „usuń [pozycja]”.
- **Podsumowania:** „pokaż koszt”, „zakończ”.

## 6) UX i ergonomia (zasady)
- **Mobile-first (75–95% ruchu)**; jedna ręka; duże przyciski; focus zarządzany.
- **Tryb hałasu:** feedback wizualny komend; opcjonalne potwierdzenia.
- **Bez zaskoczeń:** jawne ceny przed/po rabacie; jasne podsumowania inwestycji.

## 7) Miary sukcesu (KPI – patrz wartości w §19)

## 8) Roadmapa (MVP → iteracje)
- **Etap 0 – Discovery & Słownik**: skróty/synonimy, jednostki; prototyp makiety; zasady cen; testy u 3–5 instalatorów.
- **Etap 1 – MVP (bez BL)**: dwupanel; wyszukiwarka; głos v0 z **push‑to‑talk**; zdjęcie listy + **overlay wskazówek**; inwestycje; ceny przed/po (w UI), **oferta PDF/CSV tylko brutto**; **ETA/split wg reguł Woo** + **porównanie koszt vs czas**; **cutoff D+1 = 17:00**; **odbiór osobisty** (14:00–20:00 następnego dnia); **domyślny adres per inwestycja**; **link do koszyka (edycja) z datą ważności**; **budżet inwestycji + alerty**; **wskaźnik jakości rozpoznania (~62%)**; **tryb hałasu = obowiązkowe „zatwierdź”**; **Panel „Słownik i skróty”** (edycja + propozycje) + **auto‑nauka z ręczną akceptacją**; **raport fraz bez trafień (miesięczny)**.
- **Etap 2 – Iteracja 1 (BL read‑only)**: statusy/ETA z BL w widoku inwestycji; mapowanie tagów [INV]; **SMS/WhatsApp** potwierdzenia/statusy; ulepszenia UX mobilnego; raport inwestycji (oś czasu) + eksporty.
- **Etap 3 – Iteracja 2 (opcjonalnie)**: multi‑magazyn, zamienniki z BL, zaawansowany split, A11y+

## 9) Epiki i User Stories (z kryteriami akceptacji)
*(zaktualizowane – dopisano nowe US dla linków, budżetu, cutoff, pickup i panelu słownika; patrz niżej)*

**E9. Integracje (Iteracja 1 – read‑only z BL)**
- **US12:** Jako instalator chcę w widoku inwestycji widzieć **ETA i/lub status wysyłki** pozycji wzięte z BL.
  - **Kryteria:** zamówienia z widżetu posiadają tag/komentarz `[INV] Nazwa/Adres`; system pokazuje status/ETA per pozycja po stronie konta użytkownika.
- **US13:** Jako właściciel chcę, aby widżet **nie ingerował** w proces fakturowania/wysyłki w BL.
  - **Kryteria:** brak zmian w politykach fakturowania; integracja wyłącznie odczytuje statusy/ETA i pokazuje je w panelu inwestycji. (z kryteriami akceptacji)
*(pozostają jak w v0.2/v0.3, z dopiskiem o % dopasowania i „zatwierdź”)*

## 10) Definition of Done (produktowo – MVP)
- Dwupanelowy widżet: klawiatura, **push‑to‑talk** (głos v0), import zdjęcia listy z **overlay wskazówek**.
- Dodawanie pozycji z autowyborem najlepszego dopasowania (pokazujemy **% dopasowania**) i szybką korektą ilości.
- **Próg pewności autowstawienia:** > **62%**; poniżej – zawsze potwierdzenie; **remis** rozstrzyga **cena**.
- **Tryb hałasu:** wymagane „**zatwierdź**” po rozpoznaniu.
- Inwestycje: utworzenie/wybór, przypięcie zamówienia, w koncie – podsumowanie kosztów przed/po rabacie (UI).
- **Oferta PDF/CSV** „przed rabatem” dla klienta końcowego – **tylko brutto**, brand neutral, **ważność 14 dni**, **stopka prawna**.
- **ETA per pozycja** i propozycja podziału dostaw – **wg reguł Woo**; prezentacja **koszt vs czas**; **cutoff D+1 = 17:00**; **odbiór osobisty 14:00–20:00 (D+1)**; **domyślny adres per inwestycja**.
- **Link do koszyka (edycja)** z datą ważności; **budżet inwestycji + alerty**.
- **Panel „Słownik i skróty”** + **auto‑nauka (z ręczną akceptacją)**; **miesięczny raport fraz bez trafień**.
- **Integracje BL w MVP:** brak API; przekazanie tagu/komentarza inwestycji do BL przez konektor Woo↔BL.
- Czytelne komunikaty niejednoznaczności; krótkie how‑to + prywatność; przycisk **„Usuń natychmiast”** dla uploadów w trybie debug.

---

## 11) **Decyzje produktowe** (2025‑11‑03)
- **Próg pewności** autowstawienia: **>62%**; przy remisie wygrywa **cena**; **czarna lista** zamienników: **brak**.
- **Sumowania netto/brutto w UI** – **TAK**; **kalkulator marży** – **NIE**; **oferta PDF** dla klienta końcowego – **tylko brutto**.
- **Zaokrąglenia**: brak specjalnych zaokrągleń (standard 0,01 zł).
- **Split vs koszt**: pokazywać porównanie („dziś +X zł vs za Y dni 0 zł”).
- **Cutoff D+1**: **17:00** dni robocze.
- **Odbiór osobisty**: **14:00–20:00 następnego dnia**.
- **Ważność oferty**: **14 dni**; **stopka prawna** – **TAK**.
- **Tryb akustyczny/hałas**: obowiązkowe „zatwierdź”. **Wskaźnik jakości**: ok. **62%**.
- **Retencja debug**: **7 dni** + przycisk **„Usuń natychmiast”**.
- **Auto‑nauka synonimów**: **TAK** (z akceptacją ręczną). **Raport „no‑hits”**: **miesięczny**.
- **Link współdzielony**: **edycja** + **data wygaśnięcia**.
- **Budżet inwestycji**: **limit + alert** (opcjonalny per inwestycja).
- **Analityka**: mierzymy zdarzenia (czas do 1. pozycji, użycia głos/zdjęcie, % dopasowań >62%, akceptacje splitu, generacje ofert); **baseline pre‑launch: NIE**.
- **Preferencje rankingu**: w **opcjach użytkownika** wybór priorytetu: **marka / cena / dostępność (ETA)**.
- **Integracje:** Wariant A w MVP; Iteracja 1 – BL read‑only (statusy/ETA), **SMS/WhatsApp**.

---

## 12) **Asortyment startowy – MVP** (propozycja)
> Zestaw szybkorotujących, „instalatorskich” pozycji dla szybkich zamówień. Docelowo marka‑agnostycznie, poniżej przykładowe serie producentów obecnych w PL.

### A. Przewody i osprzęt kablowy
- **Przewody instalacyjne:** YDYp 3×1,5; 3×2,5; 5×2,5; YDY 3×1,5; 3×2,5; **OMY** 2×0,75; 3×0,75; **LgY** (linka) 1,5/2,5/4 mm²; **NYY‑J** 3×1,5/3×2,5.
- **Osprzęt kablowy:** dławiki M16/M20/M25; opaski zaciskowe; znaczniki/oznaczniki; przepusty; końcówki/tulejki 0,5–16 mm²; złączki żelowe do łączeń w wilgoci.

### B. Aparatura modułowa (DIN)
- **Wyłączniki nadprądowe (MCB):** krzywe B/C; 1P/3P; popularne prądy (B10/B16/B20, C16/C20). Serie: Schneider **Acti9 iC60**, Hager **MBN**, ABB **S201/S203**, Legrand **TX3**.
- **RCD/RCBO:** 30 mA, 25/40/63 A; typ AC/A. Serie: Schneider **Acti9**, Hager **CD/AD**, ABB **F200**.
- **Ochrona przepięciowa (SPD typ 2)** – podstawowe warianty 1‑faz/3‑faz.

### C. Osprzęt łączeniowy i rozdzielczy
- **Rozdzielnice** natynkowe/podtynkowe: 8–48 modułów (np. Hager, Schneider, Legrand).
- **Puszki instalacyjne**: fi60/68 (KI‑68), puszki odgałęźne IP54.
- **Szyny DIN TS35**, listwy N/PE, mostki, zaślepki modułowe.

### D. Złączki i połączenia
- **WAGO 221/222** (2/3/5‑tor), listwy zaciskowe, złączki listwowe; **Phoenix TOPJOB S** – startowe przekroje.
- **Tulejki kablowe** izolowane/nieizolowane (0,5–16 mm²), oczkowe widełkowe popularnych rozmiarów.

### E. Automatyka / sterowanie (lite)
- **Styczniki** (np. Schneider **LC1D**, Eaton **DILM**) – cewki 230V/24V; 9–25 A.
- **Przekaźniki interfejsowe** + podstawy (Finder **40/55**; Relpol R15) oraz **przekaźniki czasowe**.
- **SSR** 25/40 A (1‑faz) z radiatorami.
- **Zasilacze 24V DC** (Mean Well **HDR/DR/DRP** 2–10 A).
- **Czujniki indukcyjne** M8/M12 PNP NO (kabel i M12), przewody M8/M12.

### F. Prowadzenie okablowania
- **Peszle** 16/20/25, rury sztywne, korytka kablowe 40×60/60×60, kanały natynkowe.

> Uwaga: listę można zawęzić do ~150–250 SKU na start, skupiając się na przekrojach/prądach „defaultowych”.

---

## 13) **Skróty i synonimy – lista startowa (50+)**
*(warianty zapisu, literówki; kropki/łączniki/spacje dowolne; × = x = * )*
- **YDYp**: "ydyp", "y d y p", "ydy p", "ydy płaski", "3x1.5 ydyp", "3×1,5 ydyp"
- **YDY**: "ydy", "y d y", "ydy okrągły"
- **OMY**: "omy", "o m y", "linka omy", "omy 3x0.75"
- **LgY (linka)**: "lgy", "lg y", "linka 2,5"
- **NYY‑J**: "nyy", "nyy j"
- **Przekroje**: "3x1.5", "3×1,5", "3*1.5", "3g1,5", "5x2.5", "5×2,5", "1x10"
- **Jednostki**: "m", "mb", "metr", "metry"
- **MCB**: "S303 B16", "s303-b16", "s303b16", "S301 B16", "B16", "es b16", "esb16"
- **Krzywe**: "B10", "B16", "C16", "C20"
- **RCD**: "różnicówka 40/30", "rcd 30ma 40a", "30mA 40A", "40A/30mA", "typ A"
- **RCBO**: "rcbo b16 30ma", "es+różnicówka"
- **SPD**: "ochrona przepięciowa", "przepięciówka T2"
- **WAGO**: "wago 221", "221-412", "wago 222", "wago dźwigniowe", "szybkozłączki"
- **Puszki**: "puszka fi60", "ki-68", "ki68", "podtynk 68"
- **Rozdzielnia**: "rozdzielnia 24m", "24 moduły", "rn 24m"
- **Szyna DIN**: "szyna din 35", "ts35", "listwa n pe"
- **Tulejki**: "tulejka 2,5", "tulejki 6mm2"
- **Stycznik**: "stycznik 9A", "lc1d09", "dilm12"
- **Przekaźnik**: "finder 40.52", "przekaznik 55.34", "r15"
- **SSR**: "ssr 25a", "przekaźnik półprzewodnikowy"
- **Zasilacz**: "meanwell 24v 5a", "hdr-60-24", "dr-120-24"
- **Czujnik**: "indukcyjny m12 pnp no", "czujnik m8 pnp"
- **Peszel**: "peszel 20", "rl20", "peszel ø20"
- **Korytko**: "korytko 40x60", "kanał 40x60"

---

## 14) **ETA i dostawy – zasady w projekcie**
- **ETA (Estimated Time of Arrival)** prezentowane **per pozycja** (np. D+1, D+2);
- Jeśli w koszyku są pozycje o różnych ETA → widżet proponuje **podział na 2 dostawy** albo **czekanie** na najdłuższy termin; użytkownik wybiera.

## 15) **Oferty dla klienta końcowego**
- Generujemy **PDF/CSV** z pozycjami i cenami **przed rabatem**, danymi inwestycji/klienta, **bez brandingu sklepu** (brand neutral).

## 16) **Polityka prywatności, RODO i logowanie danych (propozycja)**
- **Zdjęcia list i nagrania głosowe**: przetwarzane wyłącznie do utworzenia koszyka; **domyślnie niearchiwizowane**.
- **Okres przechowywania**: oryginały kasowane **po 24 h** (domyślnie); opcjonalny tryb „debug” (za zgodą) do **7 dni**.
- **Miejsce przetwarzania**: serwery w **UE**; brak udostępniania podmiotom trzecim poza niezbędnymi procesorami.
- **Dane pochodne** (tekst z OCR/ASR): mogą zostać zachowane jako **metadane zamówienia** (ślad audytowy); użytkownik może żądać usunięcia.
- **Panel prywatności** w widżecie: informacja, zgody, przycisk „usuń moje dane pomocnicze”.

## 17) **KPI – wartości docelowe (propozycja)**
- **Czas złożenia koszyka 20 pozycji**: ≤ **4 min** (baseline do zbadania). 
- **% sesji z użyciem widżetu**: ≥ **30%** do 90 dni od wdrożenia.
- **% zamówień >10 pozycji z widżetu**: ≥ **40%** po 90 dniach.
- **Użycie zdjęcia listy**: ≥ **10%** sesji widżetu; **obsługa głosowa**: ≥ **20%** sesji mobilnych.
- **Porzucenia w ścieżce dodawania**: spadek o **25%** vs baseline.
- **Satysfakcja (CSAT)**: ≥ **4,5/5** (ankieta po zamówieniu). 
- **NPS** (Net Promoter Score – odsetek promotorów minus krytyków): **≥ +40** po 90 dniach.

## 18) **UI/Branding – decyzje**
- **Desktop/tablet:** układ **dwupanelowy (Commander‑like)**, wysoki kontrast.
- **Mobile:** układ **stacked** (wyszukiwarka u góry, koszyk pod spodem) + **przyklejony pasek szybkiego dodawania** i klawiatura numeryczna.
- Spójne etykiety cen: **„przed rabatem”** vs **„po rabacie”** z tooltipami.

## 19) **Scenariusze „Import ze zdjęcia” – doprecyzowanie**
- **A) Notatki odręczne/druk** – TAK (MVP): OCR + mapowanie do produktów.
- **B) Skany zamówień z hurtowni/PDF** – TAK (iteracja): OCR + parsowanie tabel.
- **C) Zdjęcia etykiet/kodów** – TAK (iteracja): rozpoznanie kodu EAN/producenta.
- **D) Zdjęcia tabliczek znamionowych** – NA PÓŹNIEJ (opcjonalnie – mapowanie po parametrach).

## 20) **Otwarte tematy (do decyzji)**
1. **Integracje**: czy w MVP łączymy z **BaseLinker/ERP** (stany, faktury, ETA), czy plan na Iterację 1/2?
2. **Priorytet marek/serii**: które linie promować w pierwszej kolejności (pod SEO i dostępność)?
3. **Kalkulator materiałowy**: czy wchodzi do Iteracji 2, czy osobny moduł później?

---

## 21) Słownik pojęć (skrót)
- **ETA** – przewidywany czas dostawy danej pozycji; **D+1** = następny dzień roboczy.
- **NPS** – Net Promoter Score (promotorzy − krytycy, skala −100 do +100).
