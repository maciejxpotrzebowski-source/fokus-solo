# FOKUS SOLO v4.4 — INSTRUKCJA WDROŻENIA I OPIS ZMIAN (CHANGELOG)

> **Wersja:** 4.4-local-first-clean  
> **Plik Produkcyjny:** [`Fokus.html`](./Fokus.html)  
> **Domyślna baza danych:** `fokus-db.json` (w tym samym folderze co aplikacja)  
> **Środowisko:** Google Chrome (Windows produkcja / macOS dom) · Architektura Local-First (Single-File HTML)

---

## 1. Co się zmieniło w wersji 4.4? (Kluczowe zmiany pod produkcję)

### 1.1. Czysty start bez sztucznych zadań testowych (Clean Slate)
* Całkowicie wyczyszczono z kodu testowe / przykładowe zadania, wpisy kalendarza i logi czasu (`tasks: []`, `timeLogs: []`, `calendarEvents: []`, `selectedTaskId: null`).
* Aplikacja uruchamia się z czystą kartką, gotowa do wprowadzenia realnych danych analityka od pierwszego dnia.
* Słowniki startowe zawierają wzorcowe kategorie (`cat_erp`, `cat_rfq`, `cat_raporty`, `cat_ppwr`, `cat_wlasne`) oraz szablony procedur cyklicznych SOP.

### 1.2. Sztywna nazwa bazy `fokus-db.json` i usunięcie modułu OneDrive
* Usunięto moduł, modal oraz etykiety OneDrive na rzecz bezpośredniej integracji z lokalnym plikiem **`fokus-db.json`** w folderze roboczym aplikacji.
* W prawym górnym rogu znajduje się czytelna pastylka statusu pliku:
  * 🟢 **`fokus-db.json: Połączony`** — każda zmiana (zadanie, czas Pomodoro, notatka) natychmiast zapisuje się bezpośrednio w pliku na dysku.
  * 🟡 **`Odblokuj fokus-db.json`** — folder jest zapamiętany w Chrome, wystarczy jedno kliknięcie, aby odnowić uprawnienie przeglądarki.
  * ⚪ **`Połącz fokus-db.json`** — pierwsze uruchomienie: wskaż folder z aplikacją.

### 1.3. Rozdzielenie danych zadań od pamięci podręcznej przeglądarki (`localStorage`)
* **Koniec z dublowaniem zadań w przeglądarce:** Wszystkie zadania, checklisty, historia Dupochronu, rejestr osób i sesje czasu są zapisywane **wyłącznie w pliku `fokus-db.json`**.
* Pamięć podręczna przeglądarki (`localStorage` pod kluczem `fokus_solo_prefs`) przechowuje wyłącznie **indywidualne preferencje UI użytkownika**:
  * Wybrany motyw (Jasny / Ciemny),
  * Ostatnio aktywny widok (`Mój Dzień`, `Eisenhower`, `Kalendarz` itd.),
  * Filtry macierzy (np. ostatnio wybrany zleceniodawca, kategoria),
  * Zakładka aktywnego zadania (Kroki vs Historia).

### 1.4. Trwałe zapamiętywanie folderu w IndexedDB
* Uchwyt do folderu aplikacji jest bezpiecznie zapamiętywany w lokalnej bazie `IndexedDB` przeglądarki Chrome.
* Dzięki temu nie musisz wskazywać folderu od nowa za każdym razem — Chrome pamięta ścieżkę do pliku `fokus-db.json`.

### 1.5. Panoramiczny interfejs 16:9 (No-Scroll Viewport)
* Szerokość dopasowana do panoramicznych monitorów (`max-w-[1800px]`), brak pustych szarych marginesów.
* Pulpit roboczy mieści się na jednym ekranie (`100vh`), z niezależnym wewnętrznym scrollem list zadań i notatek.
* Centralny, wyróżniony przycisk **`+ Nowe zadanie [N]`**.
* Kompaktowa lista rozwijana presetów stopera Pomodoro (`15m, 25m, 45m, 60m, 90m` + własny).

---

## 2. Instrukcja Wdrożenia Krok po Kroku (Windows i macOS)

Aplikacja jest w 100% samodzielnym plikiem HTML — nie wymaga instalowania środowiska Node.js, serwerów ani żadnych skryptów `.bat` / `.command`.

### Krok 1: Przygotowanie folderu aplikacji na dysku
1. Utwórz na dysku folder roboczy dla aplikacji (np. `C:\Fokus\` na Windows lub `~/Dokumenty/Fokus/` na macOS).
2. Skopiuj do tego folderu plik [`Fokus.html`](./Fokus.html).
3. *(Opcjonalnie)* Jeśli posiadasz już swój dotychczasowy plik `fokus-db.json`, wklej go do tego samego folderu obok `Fokus.html`. Jeśli go nie ma, aplikacja utworzy go automatycznie przy pierwszym połączeniu.

### Krok 2: Uruchomienie w Google Chrome
1. Kliknij dwukrotnie plik `Fokus.html`, aby otworzyć go w przeglądarce Google Chrome.
2. Dodaj stronę do paska zakładek:
   * **Windows:** `Ctrl + D`
   * **macOS:** `Cmd + D`

### Krok 3: Jednorazowe wskazanie folderu z plikiem `fokus-db.json`
1. Po otwarciu aplikacji na górze ekranu pojawi się bursztynowy pasek:  
   *„Wskaż folder z fokus-db.json — Aplikacja zapisuje zadania bezpośrednio w lokalnym pliku fokus-db.json”*.
2. Kliknij przycisk **`Wskaż folder aplikacji`** (lub kliknij pastylkę w prawym górnym rogu).
3. W oknie systemowym Chrome wskaż folder, w którym znajduje się `Fokus.html`.
4. Kliknij **„Wybierz folder”** i potwierdź uprawnienia do edycji plików: **„Wyświetlaj i edytuj pliki”**.
5. Wskaźnik w prawym górnym rogu natychmiast zaświeci się na zielono: **`● fokus-db.json: Połączony`**.

> **Wskazówka bezpieczeństwa Chrome:**  
> Po całkowitym zamknięciu i ponownym uruchomieniu przeglądarki Chrome może ze względów bezpieczeństwa poprosić o kliknięcie przycisku odnowienia uprawnień (*„Odblokuj fokus-db.json”*). Wystarczy jedno kliknięcie, aby kontynuować pracę z plikiem.

---

## 3. Struktura Plików w Folderze Roboczym

Po połączeniu folderu struktura plików wygląda następująco:

```text
📁 Fokus/
├── 📄 Fokus.html                <- Jednoelementowa aplikacja (otwierana w Chrome)
├── 📄 fokus-db.json             <- Główna pusta baza produkcyjna (Twoje realne zadania i słowniki)
├── 📄 fokus-db-demo.json        <- Baza demonstracyjna z przykładowymi danymi (do testów / podglądu)
└── 📁 backups/                  <- Automatyczne codzienne kopie zapasowe
    ├── 📄 fokus-2026-11-09.json
    └── 📄 fokus-2026-11-10.json
```

> **Jak wczytać bazę demonstracyjną?**
> Jeśli chcesz przetestować aplikację na przykładowych zadaniach analityka (RFQ, PPWR, Power BI, Pomodoro, kalendarz):
> 1. Otwórz aplikację `Fokus.html`.
> 2. Kliknij w pastylkę statusu pliku bazy w prawym górnym rogu.
> 3. Kliknij **„Wczytaj z pliku JSON”** i wskaż plik `fokus-db-demo.json`.
> *(Możesz też przed uruchomieniem po prostu zmienić nazwę pliku `fokus-db-demo.json` na `fokus-db.json`).*

---

## 4. Skróty Klawiszowe

| Skrót | Akcja |
| :---: | :--- |
| **`N`** | Dodaj nowe zadanie (otwiera modal z 5 pytaniami) |
| **`1`** | Przełącz na widok **Mój Dzień** |
| **`2`** | Przełącz na widok **Eisenhower** |
| **`3`** | Przełącz na widok **Kalendarz & Zasoby Czasu** |
| **`4`** | Przełącz na widok **Czekam na odpowiedź** |
| **`5`** | Przełącz na widok **Raporty i Eksport CSV** |
| **`6`** | Przełącz na widok **Słowniki (Osoby, Kategorie, SOP)** |
| **`7`** | Przełącz na widok **Instrukcja i Baza Wiedzy** |
| **`Esc`** | Zamknij aktywne okno modala |
