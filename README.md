# FOKUS SOLO (Soft Bento Edition) — Założenia Projektu, Instrukcja Obsługi i Przewodnik Rozwoju w Antigravity

**Wersja architektury:** 4.0 (Single-Player Local-First · Soft Bento Apple UI)  
**Środowisko uruchomieniowe:** Google Chrome / Microsoft Edge (Zero-Admin IT)  
**Magazyn danych:** Lokalny `LocalStorage` + bezpośredni zapis pliku `fokus-db.json` w folderze Microsoft OneDrive (`File System Access API`)

---

## 1. Wizja i Założenia Główne Projektu

**FOKUS SOLO** to osobisty, bezserwerowy system zarządzania zadaniami, czasem skupienia, historią zmian priorytetów („Dupochron”) oraz analityką pracy (BI). Został zaprojektowany specjalnie dla realiów pracy analityka/specjalisty w środowisku korporacyjnym, w którym nakładają się na siebie cztery strumienie pracy:
1. **Zadania cykliczne (SOP)** – comiesięczne i cotygodniowe raporty, kontrole baz danych ERP, zamknięcia okresu.
2. **Zadania bieżące (Ad-hoc / RFQ)** – analizy ofert, wyceny, zapytania od kupców i innych działów.
3. **Projekty strategiczne (Deep Work)** – długofalowe modele kosztowe, optymalizacje, wdrożenia narzędzi i regulacji (np. PPWR, EUDR).
4. **Pożary operacyjne (ASAP)** – nagłe wrzutki zarządcze i pilne awarie procesowe.

### Dlaczego aplikacja działa w ten sposób? (4 Filary Architektoniczne)
* **100% Zero-Admin IT i Bezpieczeństwo Korporacyjne:** Aplikacja nie wymaga uprawnień administratora Windows, nie instaluje plików `.exe` i nie wysyła żadnych poufnych danych firmy do zewnętrznych chmur. Działa w autoryzowanej przeglądarce Chrome, a baza danych leży w jednym pliku `fokus-db.json` na służbowym dysku OneDrive.
* **Radykalny minimalizm wizualny (Soft Bento Apple UI):** Brak przytłaczających tabel, bocznych pasków nawigacyjnych i krzykliwych odznak. Ekran podzielony jest na zaokrąglone, jasne lub ciemne kafelki Bento z dużą ilością wolnej przestrzeni.
* **Czystość danych dzięki Słownikom z Ukrytymi Aliasami:** Wprowadzając zadania w pośpiechu, możesz wpisać ksywkę, inicjały lub stanowisko (np. `gp`, `szef`, `prezes`), a system automatycznie przypisze kanoniczny rekord osoby (`Grzegorz`). Dzięki temu wykresy i raporty kwartalne nigdy nie mają zduplikowanych nazwisk.
* **Wbudowany „Dupochron” (Audit Log):** Każda zmiana terminu, pilności lub wstrzymanie zadania (`Czekam na...`) pozwala jednym kliknięciem zapisać, **na czyją prośbę** i **z jakiego powodu** nastąpiło przesunięcie.

---

## 2. Anatomia Zadania i Logika Systemowa

### 2.1. Kontrakt Wejściowy (Model 5 Pytań)
Każde zadanie w systemie odpowiada na 5 pytań:
1. **CO?** – Zwięzły tytuł określający rezultat końcowy oraz **Kategoria** ze słownika (np. `#ERP / Dane BC`, `#Zakupy / RFQ`).
2. **DLA KOGO?** – Zleceniodawca wybierany ze **Słownika Osób** (z wyszukiwaniem po ukrytych aliasach i opcją dodania nowej osoby w locie).
3. **JAK PILNE?** – Połączenie ręcznego tagu tekstowego (`ASAP`, `Wysoka`, `Standard`, `Last`) z opcjonalną datą **Deadline (`dueDate`)**.
4. **JAK WAŻNE?** – Waga biznesowa (`Krytyczne`, `Ważne`, `Standardowe`, `Niskie`).
5. **KROKI I KONTEKST** – Interaktywna checklista kroków milowych (z gotowymi szablonami SOP) oraz **jedno wspólne pole tekstowe** na opis, ścieżki do plików, linki i bieżące notatki robocze.

### 2.2. Algorytm Efektywnej Pilności (Reguła `MAX`)
System eliminuje problem zadań strategicznych, o których przypominamy sobie w dniu terminu. Każdemu poziomowi pilności przypisana jest waga od $1$ do $4$:
* `LAST` $= 1$, `NORMAL` (Standard) $= 2$, `HIGH` (Wysoka) $= 3$, `ASAP` $= 4$.

Jeżeli zadanie posiada datę `dueDate`, system wylicza liczbę dni pozostałych do terminu ($\Delta d = \text{dueDate} - \text{Dziś}$) i określa pilność wynikającą z kalendarza:
$$U_{\text{data}}(\Delta d) = \begin{cases} 4 \text{ (ASAP)} & \text{gdy } \Delta d \le 0 \text{ (dziś lub po terminie)} \\ 3 \text{ (HIGH)} & \text{gdy } 1 \le \Delta d \le 3 \text{ dni} \\ 2 \text{ (NORMAL)} & \text{gdy } 4 \le \Delta d \le 10 \text{ dni} \\ 1 \text{ (LAST)} & \text{gdy } \Delta d > 10 \text{ dni} \end{cases}$$

**Efektywna pilność zadania ($U_{\text{eff}}$)** to zawsze wyższa z wartości:
$$U_{\text{eff}} = \max\left(U_{\text{tag}}, \, U_{\text{data}}(\Delta d)\right)$$

Jeśli $U_{\text{data}} > U_{\text{tag}}$, przy zadaniu pojawia się dyskretna adnotacja `(podbite terminem)` i zadanie automatycznie przechodzi do pilnej kolumny w Macierzy Eisenhowera.

---

## 3. Instrukcja Obsługi (Codzienny Workflow Użytkownika)

### Krok 1: Pierwsze uruchomienie i podpięcie folderu OneDrive
1. Otwórz plik `Fokus_Solo_Chrome.html` w przeglądarce Google Chrome (możesz dodać go do paska zakładek `Ctrl+D`).
2. Kliknij w prawym górnym rogu przycisk **`OneDrive`** $\rightarrow$ **`📁 Wybierz folder OneDrive (Auto-Zapis Chrome)`**.
3. Wskaż dowolny folder na swoim dysku OneDrive (np. `OneDrive - Firma/Fokus`). Od tej chwili każda zmiana w aplikacji automatycznie nadpisuje tam plik `fokus-db.json`.
   *(Uwaga: jeśli polityka IT w danej sieci blokuje bezpośredni dostęp przeglądarki do katalogów, możesz w tym samym okienku używać przycisków `⬇ Pobierz fokus-db.json` oraz `⬆ Wczytaj z pliku JSON`).*

### Krok 2: Poranne planowanie dnia (08:00 – 08:15)
1. Przejdź do zakładki **`Macierz 2x2`**. Zobaczysz wszystkie swoje zadania automatycznie ułożone w 4 kwadrantach Eisenhowera.
2. Wybierz maksymalnie **6 zadań** na dzisiaj, klikając przy nich przycisk **`+ Dziś`** (zgodnie z metodą Ivy Lee system pilnuje limitu 6 pozycji).
3. Wróć do zakładki **`Mój Dzień`**:
   * W **Kafelku 02 (Kolejka na dziś)** sprawdź **Pasek Budżetu Dnia (ALPEN 5h)**. Suma estymacji wybranych zadań nie powinna przekraczać $5\text{ godzin}$ ($300\text{ minut}$), aby zachować $40\%$ bufora na spotkania, maile i nagłe telefony.
   * Najważniejsze i najtrudniejsze zadanie analityczne ustaw na pozycji **#1** przyciskiem **`↑ #1`** – staje się ono Twoją **„Dzisiejszą Żabą”** i ładuje się do głównego lewego kafelka.
   * Rzuć okiem na **Kafelek 03 (Czekam na odpowiedź)** – zobaczysz tam zadania zablokowane przez inne osoby wraz z licznikiem dni (np. `3 dni`). Wyślij im krótkie przypomnienie na Teams.

### Krok 3: Głęboka praca ze stoperem Pomodoro Overtime
1. W **Kafelku 01 (Teraz robię)** wybierz długość sesji (`15m`, `25m`, `45m`, `60m` lub wpisz własną liczbę minut w polu `min`) i kliknij **`Start`**.
2. W trakcie pracy odhaczaj kolejne kroki milowe i dopisuj bieżące ustalenia we wspólnym polu **Kontekst i Notatki robocze** (zapisują się automatycznie podczas pisania).
3. **Co dzieje się po wybiciu `00:00`?** Rozlega się łagodny dźwięk, ale stoper **nie przerywa Twojej pracy**. Zegar zmienia kolor na zielony i zaczyna liczyć czas nadliczbowy w górę (`+00:01`, `+00:02`... tryb **Overtime**). Gdy dokończysz myśl lub formułę w Excelu, kliknij **`Zakończ i zapisz`** – w statystykach zapisze się pełny rzeczywisty czas (np. $25\text{ min} + 8\text{ min} = 33\text{ min}$).
4. **Zapomniałeś włączyć stoper?** Kliknij przycisk **`+ Z palca`** obok zegara, wpisz liczbę minut oraz datę – sesja zostanie dopisana do raportów i historii zadania.

### Krok 4: Obsługa zmian terminów i blokad („Dupochron”)
1. **Gdy szef lub zleceniodawca każe przesunąć termin na rzecz innej wrzutki:**
   * Kliknij datę terminu (`Termin: ... ↺`) w Kafelku 01 lub w Macierzy 2x2.
   * Otworzy się okienko **Dupochronu**. Wybierz nową datę, w polu osoby wpisz alias (np. `gp` lub `szef`), kliknij pigułkę powodu (np. `Wrzutka wyższego priorytetu`) i dopisz krótkie zdanie komentarza.
   * Zmiana zapisze się na osi czasu zadania (**zakładka `Historia zmian` wewnątrz Kafelka 01**) oraz w tabeli przesunięć w zakładce **Raporty BI**.
2. **Gdy utkniesz, bo ktoś nie przysłał danych:**
   * Kliknij na dole Kafelka 01 przycisk **`⏳ Czekam na kogoś...`**.
   * Wskaż osobę blokującą ze słownika i wpisz, czego brakuje. Zadanie natychmiast zwolni miejsce na liście „Mój Dzień” i przejdzie do Kafelka 03.

### Krok 5: Analiza wyników i eksport raportów
1. W zakładce **`Raporty BI`** wybierz interesujący Cię okres (`Dziś`, `Ten Tydzień`, `Ten Miesiąc`, `Ten Kwartał`, `Wszystkie`).
2. Przeanalizuj wykresy: **Dla kogo pracowałem?** (udział godzinowy poszczególnych osób), **Na co poszedł czas?** (podział na kategorie) oraz **Rejestr Przesunięć Terminów (Dupochron)**.
3. Kliknij **`⬇ Pobierz CSV (Excel)`**, aby jednym kliknięciem wyeksportować tabelę zadań i czasów z polskimi znakami prosto do Excela.

---

## 4. Jak Rozwijać Projekt w Środowisku Antigravity?

Obecna wersja aplikacji jest zawarta w pojedynczym pliku `Fokus_Solo_Chrome.html`, co jest najwygodniejsze do bezpośredniego uruchamiania na służbowym komputerze. W miarę rozwoju projektu w **Antigravity** możesz pracować na dwa sposoby:

### Wariant A: Rozwój bezpośredni (Single-File Prototype)
Pracujesz bezpośrednio nad plikiem `Fokus_Solo_Chrome.html` w Antigravity. 
* **Zaleta:** Zero budowania (`npm run build`), po każdej zmianie po prostu odświeżasz kartę w Chrome (`F5`).
* **Jak promptować Antigravity:** Zawsze wskazuj w prompcie sekcję komentarza w kodzie (np. `// WIDOK 3: "RAPORTY BI"`) oraz dołączaj plik `08_Konstytucja_Projektu_i_Dobre_Praktyki.md` jako kontekst.

### Wariant B: Profesjonalna modularyzacja z kompilacją do 1 pliku (`Vite + TypeScript + vite-plugin-singlefile`)
Gdy będziesz chciał rozbić kod na osobne moduły TypeScript w Antigravity, zachowując na końcu **pojedynczy plik wynikowy `.html`** (aby nadal działał na służbowym laptopie bez serwera):

1. **Docelowa struktura katalogów w Antigravity:**
   ```text
   fokus-solo/
   ├── AGENTS.md                          # Skopiowany plik 08_Konstytucja_Projektu_i_Dobre_Praktyki.md
   ├── index.html                         # Punkt wejścia aplikacji
   ├── package.json                       # Vite + TypeScript + Tailwind + vite-plugin-singlefile
   ├── vite.config.ts                     # Konfiguracja bundlowania do 1 pliku HTML
   └── src/
       ├── types/
       │   └── database.ts                # Interfejsy TypeScript (TaskItem, PersonEntry, TimeSessionLog, AuditLogEntry)
       ├── core/
       │   ├── urgencyEngine.ts           # Czysta funkcja computeEffectiveUrgency (Reguła MAX)
       │   ├── recurrenceEngine.ts        # Logika odnawiania zadań cyklicznych SOP
       │   ├── pomodoroTimer.ts           # Maszyna stanowa stopera Pomodoro + Overtime
       │   └── auditLogger.ts             # Tworzenie niemutowalnych wpisów Dupochronu
       ├── storage/
       │   └── storageAdapter.ts          # Warstwa zapisu (LocalStorage + Chrome File System Access API)
       ├── components/
       │   ├── HeaderSegmentedNav.ts      # Górny pasek z Segmented Control
       │   ├── MyDayBentoView.ts          # Widok 3 kafelków (01 Teraz robię, 02 Kolejka ALPEN, 03 Czekam na)
       │   ├── MatrixBentoView.ts         # Widok Macierzy Eisenhowera 2x2
       │   ├── ReportsBiView.ts           # Widok analityki, wykresów i eksportu CSV
       │   ├── DictionariesView.ts        # Zarządzanie osobami (aliasy) i kategoriami
       │   └── modals/                    # Modale: Zadanie, Dupochron, Czas z palca, OneDrive
       └── main.ts                        # Inicjalizacja i obsługa skrótów klawiszowych
   ```
2. **Kluczowa zaleta `vite-plugin-singlefile`:** Podczas pracy w Antigravity masz pełne podpowiadanie typów TypeScript, małe i czytelne pliki po 100–150 linii kodu oraz testy jednostkowe dla algorytmu pilności, a po wpisaniu `npm run build` w folderze `dist/index.html` otrzymujesz jeden gotowy plik HTML, który wrzucasz na służbowy OneDrive.