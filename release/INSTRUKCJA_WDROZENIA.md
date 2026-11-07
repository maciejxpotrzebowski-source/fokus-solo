# FOKUS SOLO v4.2 — INSTRUKCJA WDROŻENIA I OPIS ZMIAN (CHANGELOG)

> **Wersja:** 4.2-bento-solo  
> **Plik Produkcyjny:** [`Fokus.html`](./Fokus.html)  
> **Środowisko:** Google Chrome (Windows / macOS) · Architektura Local-First (Single-File)

---

## 1. Co się zmieniło względem poprzednich wersji? (Pełny Changelog)

Wersja 4.2 wprowadza kluczowe rozszerzenia funkcjonalne i ergonomiczne, eliminując ograniczenia wersji 3.0 oraz wczesnych prototypów, przy zachowaniu 100% zgodności wstecznej z Twoją dotychczasową bazą `fokus-db.json`:

### 1.1. Nowa Zakładka: „Kalendarz & Zasoby Czasu”
* **Blokowy Tygodniowy Kalendarz Bento:** Zamiast przytłaczającej siatki godzinowej, przejrzyste karty dni (Poniedziałek – Piątek) oraz blok weekendowy z sumarycznym bilansem obciążenia.
* **Wpływ spotkań na budżet ALPEN:** System zakłada maksymalny budżet głębokiego skupienia na poziomie **300 minut (5 godzin)** dziennie. Każde dodane spotkanie automatycznie pomniejsza dostępny bufor skupienia na kafelku 02:
  $$\text{Dostępne Skupienie} = \max(0, \, 300\text{ min} - \text{minuty spotkań})$$
* **Obsługa urlopów:** Możliwość dodawania jedno- lub wielodniowych urlopów wypoczynkowych (`🌴 Urlop`), które zerują budżet danego dnia do $0\text{ h}$.
* **Tygodniowy Tracker Mocy Przerobowych:** Boczna karta zliczająca łączny czas spotkań i czas skupienia w skali całego tygodnia wraz ze wskaźnikiem przeciążenia.

### 1.2. Inteligentny Algorytm Pilności Dni Roboczych (SLA & Reguła MAX)
* **Eliminacja „Pułapki Poniedziałku”:** Poprzednie wersje liczyły surowe dni kalendarzowe, przez co zadanie na poniedziałek w piątek miało 3 dni zapasu i status `HIGH`. **W wersji 4.2 system liczy wyłącznie DNI ROBOCZE ($D_{\text{biz}}$)**:
  * Zadanie na poniedziałek już **w piątek rano uzyskuje najwyższy priorytet ASAP** ($D_{\text{biz}} = 1$)!
* **Wbudowany kalendarz polskich świąt państwowych:** System automatycznie rozpoznaje wszystkie święta stałe (1 i 6 stycznia, 1 i 3 maja, 15 sierpnia, 1 i 11 listopada, 25-26 grudnia) oraz wylicza ruchomą Wielkanoc, Poniedziałek Wielkanocny i Boże Ciało za pomocą astronomicznego algorytmu Gaussa/Meeusa.
* **Integracja z Twoimi urlopami:** Jeśli zaplanujesz urlop w piątek, piątek zostaje wykluczony z dni roboczych — zadanie na poniedziałek awansuje do **ASAP już w czwartek rano**.

### 1.3. Profesjonalne Nazewnictwo: Zakładka „Eisenhower”
* Zastąpiono techniczną i szkolną nazwę „Macierz 2x2” profesjonalną nazwą **„Eisenhower”**.
* Karty zadań w kwadrantach prezentują precyzyjny licznik dni roboczych do terminu: `(1d rob.)`, `(Dziś)`, `(2d po)` lub `(3d rob.)`.

### 1.4. Nowa Zakładka: „Instrukcja” (Baza Wiedzy Bento)
* Dedykowane kompendium wiedzy operacyjnej i metodycznej dostępne w prawym górnym rogu pod przyciskiem `📖 Instrukcja` (skrót klawiszowy: `7`).
* Opis **6 Strażników Metodyk** (Ivy Lee, Eat That Frog, ALPEN, Eisenhower, Pomodoro Overtime, Dupochron).
* Ściąga z **Rytuału Dnia Analityka** (krok po kroku od 08:00 do 15:30).
* Zestawienie skrótów klawiszowych, wyszukiwarki ukrytych aliasów (`szef`, `gp`, `tk`) oraz instrukcja podpięcia pliku `fokus-db.json` do **Power BI Desktop**.

### 1.5. Nowoczesny i Czysty Układ Nawigacji (No Sidebars)
* **Główny Segmented Control (5 widoków operacyjnych):**
  `[ Mój Dzień | Eisenhower | Kalendarz | Czekam na | Raporty ]`
* **Narzędzia i Pomoc w prawym rogu:**
  `⚙️ Słowniki` · `📖 Instrukcja` · `OneDrive` · `+ Zadanie (N)` · `🌙 Motyw`
* **Skróty Klawiszowe:** Klawisze od `1` do `7` błyskawicznie przełączają wszystkie zakładki bez użycia myszy.

---

## 2. Instrukcja Wdrożenia / Aktualizacji (Krok po Kroku)

Przejście na wersję 4.2 jest w pełni bezpieczne i nie wymaga instalacji żadnych serwerów ani bibliotek. Aplikacja zachowuje 100% zgodności z Twoimi dotychczasowymi danymi.

### Krok 1: Kopia Zapasowa (Zalecane przed każdą aktualizacją)
1. Otwórz swoją dotychczasową wersję aplikacji w przeglądarce Chrome.
2. Kliknij w prawym górnym rogu przycisk **OneDrive**.
3. Kliknij przycisk **„💾 Pobierz kopię dzienną (fokus-backup-YYYY-MM-DD.json)”** lub **„⬇ Pobierz fokus-db.json”**.
4. Zapisz plik na dysku komputera lub w bezpiecznym folderze.

### Krok 2: Umieszczenie Nowego Pliku na Komputerze Służbowym
1. Skopiuj plik [`release/Fokus.html`](./Fokus.html) na swój komputer służbowy (np. na Pulpit, do folderu dokumentów lub do folderu synchronizowanego z OneDrive).
2. Możesz zmienić nazwę pliku na dowolną (np. `Fokus.html` lub `Fokus_Solo.html`).

### Krok 3: Uruchomienie w Przeglądarce Google Chrome
1. Kliknij dwukrotnie w plik `Fokus.html` (otworzy się w domyślnej przeglądarce Google Chrome).
2. Dodaj stronę do zakładek za pomocą skrótu **`Ctrl + D`** (Windows) lub **`Cmd + D`** (macOS).
3. **Automatyczna migracja danych:**
   * Ponieważ aplikacja korzysta z bezpiecznego magazynu `LocalStorage` pod tym samym adresem, wszystkie Twoje zadania, osoby, szablony SOP oraz historia czasu **zostaną automatycznie wczytane**.
   * Aplikacja automatycznie uzupełni schemat o nową strukturę `calendarEvents`, nie modyfikując ani nie kasując żadnych Twoich wcześniejszych wpisów.

### Krok 4: Ponowne Podpięcie Folderu OneDrive (Jeśli używasz)
1. Kliknij przycisk **OneDrive** w prawym górnym rogu paska.
2. Kliknij **„Podepnij folder roboczy OneDrive”**.
3. W oknie systemowym wskaż folder, w którym znajduje się Twój plik `fokus-db.json`.
4. Wyraź zgodę na uprawnienia do zapisu plików (`Zezwól na edycję plików`).
5. Dioda przy przycisku zmieni kolor na zielony (`OneDrive ●`).

### Krok 5: Czyszczenie Pamięci Podręcznej (Gdyby przeglądarka pamiętała stary wygląd)
Jeśli podmieniłeś plik o tej samej nazwie w tej samej ścieżce, wymuś odświeżenie bez pamięci podręcznej:
* **Windows / Linux:** `Ctrl + F5` lub `Ctrl + Shift + R`
* **macOS:** `Cmd + Shift + R`

---

## 3. Podsumowanie Wymagań Technicznych

| Element | Wymaganie |
| :--- | :--- |
| **Przeglądarka** | Google Chrome (wersja 86+ ze wsparciem dla File System Access API) |
| **Zależności / Serwery** | **Brak** (0 serwerów, 0 npm w runtime, czysty HTML/CSS/JS) |
| **Zapis Danych** | Warstwa 1: Synchroniczny `LocalStorage` (0 ms opóźnienia) <br> Warstwa 2: Plik `fokus-db.json` w OneDrive przez przeglądarkę |
| **Kopia Zapasowa** | Automatyczna rotacja dzienna z zachowaniem bezpiecznej nazwy datowanej |
