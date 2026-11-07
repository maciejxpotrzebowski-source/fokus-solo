# KONSTYTUCJA PROJEKTU „FOKUS SOLO” — Dobre Praktyki Programistyczne, Organizacyjne i Strażnicy Metodyk

> **Wskazówka dla środowiska Antigravity:**  
> Możesz zapisać ten plik w głównym katalogu repozytorium jako `AGENTS.md`, `CLAUDE.md` lub `.cursorrules`. Dzięki temu asystent AI w Antigravity przy każdym kolejnym zadaniu programistycznym będzie automatycznie przestrzegał poniższych reguł architektonicznych, wizualnych i metodycznych.

---

## 1. Strażnicy Metodyk Zarządzania Zadaniami (Czego NIE WOLNO psuć przy rozbudowie)

System **FOKUS SOLO** nie jest zwykłą listą „to-do”. Jego skuteczność wynika z rygorystycznego wdrożenia potwierdzonych naukowo technik produktywności. Podczas dodawania nowych funkcji w przyszłości **bezwzględnie obowiązują następujące ograniczenia**:

### 1.1. Reguła Ivy Lee + „Eat That Frog” (Kafelek 01 i 02)
* **Zasada:** Lista `Mój Dzień` może zawierać **maksymalnie 6 aktywnych zadań** jednocześnie (`myDayTasks.length <= 6`).
* **Zakaz:** Nigdy nie znoś limitu 6 zadań na widoku `Mój Dzień`. Aby dodać 7. zadanie na dzisiaj, użytkownik musi najpierw ukończyć, odłożyć lub przełączyć w stan `WAITING_FOR` jedno z obecnych zadań.
* **Zasada Jednego Skupienia:** W Kafelku `01 · Teraz robię` wyświetlane jest w pełnym rozwinięciu **wyłącznie jedno zadanie** (domyślnie pozycja `#1 — Dzisiejsza Żaba`). Pozostałe zadania w Kafelku `02` są zwinięte do pojedynczego wiersza, aby nie wywoływać zjawiska *Attention Residue* (osadu uwagi).

### 1.2. Metoda ALPEN (Budżet Czasu 60/40)
* **Zasada:** Człowiek nie jest w stanie pracować analitycznie w pełnym skupieniu przez $8\text{ godzin}$ dziennie. System zakłada maksymalny budżet czystej pracy na poziomie **$300\text{ minut}$ ($5\text{ godzin}$)** dziennie, zostawiając pozostałe $40\%$ dnia na spotkania, maile i nieprzewidziane zakłócenia.
* **Wymóg w kodzie:** Pasek budżetu dnia w Kafelku `02` zawsze liczy sumę `estimatedMinutes` zadań z listy `Mój Dzień` względem progu $300\text{ min}$:
  * $\le 240\text{ min}$: kolor neutralny (`#1D1D1F` / biały),
  * $241 - 300\text{ min}$: kolor ostrzegawczy bursztynowy (`amber-400`),
  * $> 300\text{ min}$: kolor alarmowy czerwony (`rose-500`).

### 1.3. Macierz Eisenhowera i Algorytm Pilności `MAX` (Mere Urgency Effect)
* **Zasada:** Oś Pilności (`Urgency`) i Oś Ważności (`Importance`) są od siebie całkowicie niezależne.
* **Wymóg w kodzie:** Efektywna pilność zadania jest zawsze wyliczana czystą funkcją matematyczną:
  $$U_{\text{eff}} = \max\left(U_{\text{tag}}, \, U_{\text{data}}(\text{dueDate})\right)$$
* **Zakaz:** Nie wolno wprowadzać „ręcznego przypisywania kwadrantu Eisenhowera” w oderwaniu od parametrów zadania. Jeśli zadanie ma zmienić kwadrant, musi zmienić się jego `dueDate`, `urgencyTag` lub `importance` (co z kolei zostawia ślad w historii `auditLog`).

### 1.4. Efekt Goal-Gradient (Płaska Checklista Kroków Milowych)
* **Zasada:** Rozbicie dużego zadania na 3–5 drobnych kroków milowych z widocznym paskiem postępu ($\%$) przyspiesza realizację zadania.
* **Zakaz:** **Nigdy nie wprowadzaj zagnieżdżonych podzadań** (podzadań wewnątrz kroków milowych). Checklista ma zawsze dokładnie 1 płaski poziom (`milestones: Array<{ id, title, isDone }>`).

### 1.5. Stoper Pomodoro z Trybem „Overtime” (Ochrona Stanu Flow)
* **Zasada:** W pracy analitycznej (Excel, SQL, ERP) przerwanie pracy w momencie wybicia `00:00` niszczy stan głębokiego skupienia i generuje błędy.
* **Wymóg w kodzie:** Po zejściu licznika do `00:00` aplikacja wydaje pojedynczy, nienatarczywy sygnał dźwiękowy (`Web Audio API`), przełącza flagę `isOvertime = true` i liczy czas w górę (`+00:01`, `+00:02`...) w kolorze zielonym (`emerald-500`), dopóki użytkownik sam nie kliknie `Zakończ i zapisz`. Do bazy zapisywany jest łączny czas (`plannedMinutes + overtimeMinutes`).

### 1.6. Niemodyfikowalny „Dupochron” (Append-Only Audit Log)
* **Zasada:** Historia zmian zadania (`auditLog[]`) stanowi dowód organizacyjny pokazujący, dlaczego i na czyją prośbę przesunięto termin realizacji.
* **Wymóg w kodzie:**
  1. Pole `originalDueDate` jest zapisywane w momencie utworzenia zadania (lub pierwszego nadania daty) i **nigdy nie jest nadpisywane** podczas późniejszych przesunięć terminu `dueDate`.
  2. Tablica `auditLog[]` działa w trybie **Append-Only** (tylko dodawanie nowych wpisów na początek tablicy `unshift()`). W kodzie nie może istnieć funkcja usuwająca ani fałszująca wcześniejsze wpisy o zmianie terminu.

---

## 2. Strażnicy Design Systemu „Soft Bento (Apple UI)”

Aby aplikacja nigdy nie stała się wizualnie przytłaczająca, każda nowa funkcja lub modal dodawany w Antigravity musi przestrzegać 5 reguł wizualnych:

1. **Zero Pasków Bocznych (No Sidebars):** Nawigacja odbywa się wyłącznie za pomocą wyśrodkowanego przełącznika pigułkowego (`Segmented Control`) w górnym pasku. Nie dodajemy lewego menu ani wysuwanych szuflad bocznych (Drawerów).
2. **Geometria Kart Bento:** Wszystkie główne kontenery używają klasy `.bento-card` (`border-radius: 24px`, `padding: 28px`, brak grubych ramek, miękki rozproszony cień). Odstęp między kartami w siatce wynosi zawsze `gap-6` (`24px`).
3. **Ścisła Paleta Kolorów (Light & Dark):**
   * **Tryb Jasny:** Tło strony `#F5F5F7` (ciepły szary Apple), karty `#FFFFFF`, pola formularzy wewnątrz kart `#F5F5F7`, tekst główny `#1D1D1F`.
   * **Tryb Ciemny:** Tło strony `#000000`, karty `#1C1C1E`, elementy wewnętrzne `#2C2C2E`, tekst główny `#F5F5F7`.
4. **Zakaz Kolorowych Etykiet i Banerów:** Pilność zadania jest sygnalizowana **wyłącznie kropką o średnicy `6px`** (`w-1.5 h-1.5 rounded-full`):
   * `ASAP` $\rightarrow$ `bg-rose-500`,
   * `HIGH` $\rightarrow$ `bg-amber-400`,
   * `NORMAL` $\rightarrow$ `bg-blue-400/70`,
   * `LAST` $\rightarrow$ `bg-zinc-300 dark:bg-zinc-600`.
5. **Typografia:** Interfejs używa fontu bezszeryfowego (`Inter` / `SF Pro`), natomiast wszystkie liczby, daty, zegary, procenty i statystyki w raportach używają fontu stałoszerokościowego (`font-mono` — `JetBrains Mono` / `SF Mono`), co gwarantuje idealne wyrównanie kolumn liczbowych.

---

## 3. Dobre Praktyki Programistyczne i Czystość Danych

### 3.1. Kanoniczne Referencje Słownikowe (Zero Duplikatów Tekstowych)
* W obiektach zadań (`TaskItem`), sesji (`TimeSessionLog`) oraz logów historii (`AuditLogEntry`) **nigdy nie zapisujemy imienia osoby ani nazwy kategorii jako zwykłego tekstu**.
* Zawsze zapisujemy identyfikator referencyjny: `requesterPersonId`, `waitingForPersonId`, `initiatedByPersonId`, `categoryId`.
* Wyszukiwarka w formularzach przeszukuje jednocześnie `canonicalName`, `roleOrDept` oraz tablicę `aliases[]`, ale po wyborze wiąże zadanie z unikalnym `id` osoby. Pozwala to w przyszłości zmienić nazwę osoby lub scalić dwa rekordy w jednym miejscu ze skutkiem dla wszystkich historycznych raportów.

### 3.2. Bezpieczne Migracje Schematu (`Schema Versioning & Fallbacks`)
Ponieważ baza danych użytkownika spoczywa w lokalnym pliku `fokus-db.json`, każda rozbudowa modelu danych w przyszłości musi być **w $100\%$ wstecznie kompatybilna**:
* Przy wczytywaniu pliku JSON lub `LocalStorage` zawsze łączymy wczytany obiekt z domyślną strukturą (`{ ...DEFAULT_DB, ...imported }`).
* Każde nowe pole dodawane w przyszłości do zadania (np. `task.customField`) musi być opcjonalne (`customField?: string`) i posiadać bezpieczną wartość domyślną podczas renderowania (`task.customField || ''`).
* Nigdy nie zmieniamy nazw istniejących kluczy w pliku `fokus-db.json` (np. `tasks`, `people`, `categories`, `timeLogs`, `auditLog`).

### 3.3. Odporność Zapisu Local-First (Dual-Layer Persistence)
* Każda funkcja modyfikująca stan aplikacji kończy się wywołaniem `saveDatabase()`.
* `saveDatabase()` najpierw wykonuje synchroniczny, natychmiastowy zapis do `localStorage` (gwarancja $0\text{ ms}$ utraty danych przy zamknięciu karty), a następnie asynchronicznie zapisuje sformatowany JSON (`JSON.stringify(db, null, 2)`) do pliku `fokus-db.json` przez `File System Access API`, jeśli folder OneDrive jest podpięty.

---

## 4. Przygotowanie pod Ewentualną Rozbudowę (Clean Boundaries bez YAGNI Bloatu)

Zgodnie z założeniem: **na ten moment aplikacja jest w $100\%$ narzędziem jednoosobowym (Solo) i nie budujemy żadnych zbędnych ekranów logowania czy serwerów**. Jednocześnie kod jest ułożony tak, aby w przypadku zainteresowania narzędziem w firmie (np. chęć wdrożenia u innych analityków lub agregacji raportów przez przełożonego) rozbudowa była prosta i nie wymagała przepisywania systemu:

| Obszar Architektury | Jak piszemy kod dzisiaj (Wersja Solo) | Jak ułatwi to ewentualną rozbudowę w przyszłości? |
| :--- | :--- | :--- |
| **Unikalne identyfikatory (`id`)** | Wszystkie zadania, osoby, sesje i logi mają unikalne prefiksowane identyfikatory czasowe (`tsk_...`, `ses_...`, `log_...`, `per_...`). | Jeśli 3 analityków w dziale zacznie używać aplikacji i zechcą połączyć swoje pliki `fokus-db.json` w jednym wspólnym raporcie Power BI dla dyrektora, **żadne ID nigdy się nie zderzą**. |
| **Izolacja warstwy zapisu (`saveDatabase` / `loadDatabase`)** | Cały odczyt i zapis danych przechodzi wyłącznie przez dwie funkcje w jednym miejscu kodu, a reszta aplikacji operuje na obiekcie `db` w pamięci. | Gdyby w przyszłości pojawiła się potrzeba podpięcia bazy SQL / SharePoint List / REST API zamiast pliku lokalnego, wystarczy podmienić wnętrze funkcji `saveDatabase()` i `loadDatabase()` bez dotykania widoków UI i logiki biznesowej. |
| **Czyste funkcje domenowe (`computeEffectiveUrgency`)** | Wyliczanie pilności, filtrowanie okresów raportowych i agregacja godzin BI są oddzielone od kodu HTML. | Logikę analityczną można bezpośrednio przenieść do osobnego pakietu TypeScript, Web Workera lub skryptu raportowego Node.js. |
| **Samowystarczalny eksport (`fokus-db.json` i `CSV`)** | Plik `fokus-db.json` ma płaskie, czytelne tablice `tasks[]` oraz `timeLogs[]`. | Plik może zostać w każdej chwili podpięty bezpośrednio do **Power BI Desktop** (`Pobierz dane -> JSON`) w celu połączenia wyników z danymi z systemu ERP (Business Central / SAP). |

---

## 5. Zautomatyzowany Pakiet Testów Jednostkowych i Integralności (`npm test`)

Projekt posiada kompletny pakiet 32 testów wbudowany w `node:test` (uruchamiany bez instalowania zewnętrznych bibliotek komendą `npm test` lub `node --test tests/*.test.mjs`). Pakiet weryfikuje:
1. **Algorytm Efektywnej Pilności (Reguła MAX & Dni Robocze / Święta):** podbicie przez zbliżający się termin w dniach roboczych ($D_{\text{biz}} \le 1 \rightarrow \text{ASAP}$, $2..3 \rightarrow \text{HIGH}$, $4..7 \rightarrow \text{NORMAL}$, $>7 \rightarrow \text{LAST}$), automatyczne podbicie do ASAP w piątek dla zadań poniedziałkowych oraz odseparowanie osi pilności od ważności w Macierzy Eisenhowera.
2. **Limit Ivy Lee:** gwarancja, że na liście `Mój Dzień` nigdy nie znajdzie się więcej niż 6 aktywnych zadań (zarówno przy dodawaniu z macierzy, z modala, jak i przy odblokowywaniu).
3. **Metoda ALPEN & Kalendarz Zasobów:** progi kolorystyczne sumy estymacji ($\le 240\text{ min}$ neutralny, $241-300\text{ min}$ bursztynowy, $> 300\text{ min}$ czerwony alarm) oraz pomniejszanie dostępnego skupienia przez spotkania i urlopy.
4. **Pomodoro Overtime:** poprawne zliczanie rzeczywistego czasu pracy ($planned + overtime = total$).
5. **Nienadpisywalność `originalDueDate` & Append-Only Audit Log:** dowód, że termin pierwotny nie ulega zatarciu.
6. **Wyszukiwarka aliasów słownikowych:** poprawne mapowanie skrótów i aliasów na kanoniczne `id` osoby.
7. **Cykliczność SOP:** bezpieczne wyliczanie kolejnego terminu bez błędów strefy czasowej (UTC shift).
8. **Integralność widoków i kontrolek v4.2:** obecność 5 głównych zakładek operacyjnych w Segmented Control (`Mój Dzień`, `Eisenhower`, `Kalendarz`, `Czekam na`, `Raporty`), przycisków narzędziowych (`⚙️ Słowniki`, `📖 Instrukcja`) oraz modala kalendarza `calendarEventModal`.
9. **Bezpieczne migracje schematu:** kompatybilność z kluczami v3 (`peopleDictionary`, `timeSessions`, `waitingFor` obiektowe vs płaskie) oraz automatyczna inicjalizacja `calendarEvents`.

---

## 6. Checklista dla Asystenta AI w Antigravity przed każdym Commitem

Przed zatwierdzeniem jakiejkolwiek zmiany w kodzie upewnij się, że:
- [ ] Uruchomiłeś `npm test` (lub `node --test tests/*.test.mjs`) i **wszystkie testy zakończyły się wynikiem zielonym (100% pass)**.
- [ ] Żaden widok nie wprowadził paska bocznego (Sidebar) ani nie złamał siatki zaokrąglonych kart `.bento-card` (`24px`).
- [ ] Wszystkie 5 zakładek operacyjnych w Segmented Control (`Mój Dzień`, `Eisenhower`, `Kalendarz`, `Czekam na`, `Raporty`) oraz narzędzia po prawej (`⚙️ Słowniki`, `📖 Instrukcja`) renderują się poprawnie.
- [ ] Wygląd został przetestowany zarówno w **Motywie Jasnym (`#F5F5F7`)**, jak i w **Motywie Ciemnym (`#000000` / `#1C1C1E`)**.
- [ ] Wyszukiwarka osób nadal obsługuje ukryte aliasy (`aliases[]`), a w zadaniach zapisywane jest wyłącznie `personId`.
- [ ] Zmiana daty `dueDate` nie nadpisuje historycznego pola `originalDueDate` i dopisuje zdarzenie do `auditLog[]`.
- [ ] Algorytm pilności uwzględnia dni robocze, weekendy, polskie święta państwowe oraz urlopy użytkownika.
- [ ] Spotkania w Kalendarzu prawidłowo pomniejszają dostępny budżet skupienia ALPEN (5h) na kafelku 02.
- [ ] Stoper Pomodoro po dojściu do `00:00` nie zatrzymuje się, lecz przechodzi w tryb `OVERTIME (+00:01...)`.
- [ ] Wszelkie operacje na datach używają lokalnych komponentów kalendarzowych (`getTodayISO()`, `addDaysISO()`, `formatLocalYMD()`), aby uniknąć przesunięć stref czasowych UTC.
- [ ] Struktura pliku `fokus-db.json` zachowuje pełną kompatybilność wsteczną z dotychczasowymi danymi użytkownika.