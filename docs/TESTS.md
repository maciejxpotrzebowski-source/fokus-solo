# Zautomatyzowany Pakiet Testów Projektu „FOKUS SOLO” (Wersja 4.2)

W projekcie wdrożono zautomatyzowany pakiet 32 testów jednostkowych i integracyjnych, uruchamiany natywnie przez silnik Node.js (bez zewnętrznych bibliotek i bez instalowania ciężkich zależności `node_modules`).

## 1. Jak uruchomić testy?

W terminalu w katalogu głównym projektu wpisz:

```bash
npm test
```

lub bezpośrednio:

```bash
node --test tests/*.test.mjs
```

---

## 2. Zakres i Pokrycie Testów

Pakiet testów podzielony jest na dwa pliki:

### `tests/fokus-engine.test.mjs` (Logika biznesowa i Strażnicy Metodyk)
1. **Algorytm Efektywnej Pilności (Reguła MAX & Dni Robocze / Święta):**
   - Weryfikacja wag: `LAST` = 1, `NORMAL` = 2, `HIGH` = 3, `ASAP` = 4.
   - W piątek zadanie z terminem na poniedziałek awansuje do statusu `ASAP` ($D_{\text{biz}} = 1$) z flagą `boostedByDate = true`.
   - W czwartek zadanie na poniedziałek awansuje do `ASAP`, jeśli użytkownik ma zaplanowany urlop w piątek.
   - W piątek zadanie na wtorek otrzymuje status `HIGH` ($D_{\text{biz}} = 2$).
   - Zadanie przeterminowane ($\Delta d \le 0$) automatycznie otrzymuje `ASAP`.
   - Wbudowana astronomiczna kalkulacja polskich świąt (Wielkanoc, Poniedziałek Wielkanocny, Boże Ciało metodą Gaussa/Meeusa).
2. **Reguła Ivy Lee (Maksymalnie 6 zadań w Mój Dzień):**
   - Pozwala dodać do 6 zadań na listę `Mój Dzień`.
   - Rygorystycznie blokuje dodanie 7. zadania (zarówno z poziomu widoku Eisenhowera, jak i modala nowego zadania czy odblokowania z `Czekam na`).
3. **Metoda ALPEN (Budżet 300 min / 5h z bilansowaniem Kalendarza):**
   - $\le 240\text{ min}$: styl neutralny (`#1D1D1F` / biały).
   - $241 - 300\text{ min}$: ostrzeżenie bursztynowe (`amber-400`).
   - $> 300\text{ min}$: alarm czerwony (`rose-500`).
   - Spotkania z Kalendarza zmniejszają dostępny budżet skupienia (`focusCapacity = 300 - meetingMinutes`).
   - Urlop lub dzień wolny zeruje budżet skupienia danego dnia do $0\text{ h}$ (`isDayOff: true`).
4. **Stoper Pomodoro z Trybem Overtime:**
   - Presety: `15m`, `25m`, `45m`, `60m`, `90m`.
   - Wybicie `00:00` nie zatrzymuje stopera — liczy czas w górę (`+00:01...`).
   - Łączny czas sesji do statystyk to $planned + overtime$.
5. **Niemodyfikowalny „Dupochron” (Audit Log):**
   - `originalDueDate` jest nienadpisywalny — po wielokrotnych przesunięciach terminu pierwotna data pozostaje nienaruszona.
   - Dziennik `auditLog[]` działa w trybie **Append-Only** (`unshift()`).
6. **Słowniki z ukrytymi aliasami:**
   - Wyszukiwanie po skrótach (np. `gp`, `szef`, `prezes`, `tk`) odnajduje kanoniczny rekord osoby.
   - Zadania przechowują wyłącznie `personId` (zero tekstu wolnego).
7. **Zadania Cykliczne (SOP Recurrence):**
   - `WEEKLY` (+7 dni), `MONTHLY` (+1 miesiąc), `QUARTERLY` (+3 miesiące).
   - Obliczenia odporne na przesunięcia stref czasowych UTC.
8. **Integralność struktury `Fokus.html`:**
   - Obecność 5 zakładek operacyjnych w `Segmented Control` (`Mój Dzień`, `Eisenhower`, `Kalendarz`, `Czekam na`, `Raporty`).
   - Dedykowane przyciski narzędziowe po prawej: `⚙️ Słowniki` oraz `📖 Instrukcja`.
   - Modal kalendarza `calendarEventModal` oraz widoki Bento `renderCalendarBento` i `renderGuideBento`.
   - Pełny zestaw presetów Pomodoro [15, 25, 45, 60, 90].
   - Obecność kategorii `cat_wlasne` w słowniku.
   - Sekcja Szablonów Procedur (SOP).
   - Mechanizm kopii zapasowych dziennych.

### `tests/fokus-migration.test.mjs` (Migracje schematu i Local-First)
1. **Kompatybilność wsteczna z bazami v3.0.0:**
   - Mapowanie `peopleDictionary` na `people`.
   - Mapowanie `timeSessions` na `timeLogs`.
   - Mapowanie `checklist` na `milestones`.
   - Mapowanie `contextNotes` na `notesAndContext`.
2. **Normalizacja obiektu `waitingFor`:**
   - Automatyczna konwersja starych płaskich pól (`waitingForPersonId`, `waitingForReason`, `waitingSince`) do struktury zagnieżdżonej `waitingFor: { personId, reason, sinceISO }` i vice versa.
3. **Automatyczne uzupełnianie brakujących pól domyślnych:**
   - Dopisanie brakującej kategorii `cat_wlasne`.
   - Inicjalizacja domyślnych szablonów SOP (`sopTemplates`).
   - Inicjalizacja nowej tablicy `calendarEvents` przy imporcie starszych wersji.

---

## 3. Testowanie Wizualne w Headless Chrome

Aby upewnić się, że plik produkcyjny `release/Fokus.html` ładuje się i renderuje w przeglądarce Chrome bez błędów konsoli JavaScript, można wykonać polecenie:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --dump-dom --disable-gpu "file://$(pwd)/release/Fokus.html" > /dev/null
```

Polecenie kończy się kodem `0`, potwierdzając bezbłędne sparsowanie i wykonanie skryptu inicjalizującego `renderApp()`.
