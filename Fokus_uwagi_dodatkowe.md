# Fokus.html – uwagi dodatkowe (poza połączeniem z bazą)

Kolejność: najpierw błędy widoczne w użyciu, potem uproszczenia kodu, na końcu wygląd.

---

## 1. Błędy funkcjonalne

**1.1 Wyszukiwarka w „Eisenhower” i „Czekam na” gubi kursor po każdym znaku.**
`oninput="matrixFilter.search = this.value; renderApp();"` przebudowuje cały widok razem z polem wyszukiwania, więc pole traci fokus.
*Poprawka:* po `renderApp()` przywróć fokus i pozycję kursora albo przerysowuj tylko listę zadań, a nie pasek filtrów.

**1.2 Pomodoro zaniża czas, gdy karta jest w tle.**
Stoper odejmuje po 1 sekundzie w `setInterval`. Chrome spowalnia timery w nieaktywnych kartach, więc przy pracy w Excelu licznik „stoi”.
*Poprawka:* zapamiętaj `startedAt = Date.now()` i licz czas jako różnicę znaczników czasu.
Przy okazji:
- `startedAt` w logu sesji to obecnie moment **zakończenia**, a nie startu,
- przełączenie stopera na inne zadanie kasuje naliczony czas bez zapisu,
- odświeżenie strony gubi trwającą sesję. Warto trzymać stan stopera w `localStorage`.

**1.3 Apostrof w nazwie osoby psuje dodawanie.**
`createPersonInline('${prefix}', '${escapeHtml(...)}')`: `escapeHtml` nie zamienia `'`, więc nazwa typu „D'Angelo” łamie `onclick`. Ten sam schemat (tekst wstawiany do `onclick`) jest w kilku miejscach.
*Poprawka:* przekazuj wartości przez `data-*` lub dodaj do `escapeHtml` zamianę `'` na `&#39;`.

**1.4 `milestones` i `checklist` rozjeżdżają się po przeładowaniu.**
Po wczytaniu z pliku to dwie osobne tablice. Odhaczanie kroków zmienia tylko `milestones`, a w pliku zostaje nieaktualna `checklist`. Rozwiązanie w punkcie 2.1.

**1.5 Usuwanie bez potwierdzenia i bez śladu.**
Usunięcie zadania kasuje jego „nienaruszalną” historię (audit log), a sesje czasu zostają osierocone („Zadanie usunięte”). Osoby i kategorie znikają mimo przypisanych zadań.
*Poprawka:* zamiast usuwać, zmieniaj status na `ARCHIVED` i blokuj usunięcie osoby lub kategorii, która ma zadania.

**1.6 Okresy w raportach mają mylące nazwy.**
„Ten tydzień / miesiąc / kwartał” to w kodzie ostatnie 7 / 30 / 90 dni. Zmień etykiety na „Ostatnie 7 dni” itd. albo licz okresy kalendarzowe.

**1.7 Instrukcja obiecuje więcej, niż robi aplikacja.**
- „Każde przesunięcie wymusza podanie powodu”, a jest przycisk „Pomiń powód”, a termin można zmienić w formularzu edycji bez powodu.
- „Enter = szybki zapis w formularzu” nie jest zaimplementowany.
- Tekst `$100\%$` wyświetli się dosłownie (to składnia LaTeX). Wystarczy „100%”.

**1.8 Brak ochrony przed zmianą pliku „z zewnątrz”.**
Jeśli plik leży w OneDrive i zmieni się na innym komputerze, aplikacja nadpisze go bez ostrzeżenia.
*Poprawka:* zapamiętaj `file.lastModified` przy odczycie i przed zapisem sprawdź, czy się nie zmienił. Jeśli tak, pokaż ostrzeżenie.

**1.9 Kopia dzienna działa tylko w trybie „folder”.**
W trybie „plik” plik `backups/` nigdy nie powstaje. To kolejny argument za uproszczeniem z punktu 2.2.

---

## 2. Co można uprościć

**2.1 Jedna nazwa na jedno pole.**
Każda wartość jest zapisywana podwójnie:

| Zostaw | Usuń |
|---|---|
| `people` | `peopleDictionary` |
| `categories` | `categoryDictionary` |
| `timeLogs` | `timeSessions` |
| `milestones` | `checklist` |
| `inMyDay` | `isMyDay` |
| `notes` | `notesAndContext`, `contextNotes` |
| `personId` | `requesterPersonId` |
| `createdAt` / `completedAt` | `...ISO` |
| `date`, `startedAt`, `minutes` | `dateISO`, `startedAtISO`, `totalMinutes`/`durationMinutes`, `plannedMinutes`/`targetMinutes` |
| `waitingFor {personId, reason, since}` | `waitingForPersonId`, `waitingForReason`, `waitingSince` |

Jednorazowa migracja w `normalizeDatabase()` przeniesie stare pola. Potem znikną wszystkie konstrukcje typu `t.requesterPersonId || t.personId`, a plik bazy będzie wyraźnie mniejszy.

**2.2 Jeden tryb podłączenia.**
Rekomendacja: **folder**. Zgoda na zapis jest udzielana od razu przy wyborze, plik i `backups/` tworzą się same, nie trzeba osobnego „Utwórz nową bazę”. Jeśli wolisz wskazywać plik, zostaw tylko tryb pliku i dodaj do niego kopię zapasową.

**2.3 Stan widoku poza plikiem bazy.**
`theme`, `activeView`, `selectedTaskId`, `card1Tab`, `reportPeriod` trzymaj tylko w `localStorage` (preferencje już tam są). Plik bazy = wyłącznie dane.

**2.4 Martwy kod do usunięcia:**
- `applySopPreset`
- `STORAGE_KEY`
- aliasy OneDrive, `requestDbFilePermission`, `connectDatabaseDirectory`
- usuwanie starych kluczy `localStorage` w `initDatabasePersistence`

**2.5 Powtarzane klasy Tailwind.**
Ten sam ciąg klas przycisku lub pola powtarza się dziesiątki razy. Tailwind z CDN obsługuje `<style type="text/tailwindcss">` z `@apply`, więc możesz zdefiniować np. `.btn-primary`, `.btn-ghost`, `.field`, `.pill` i skrócić HTML.

**2.6 Jedna para funkcji do modali.**
Zamiast pięciu kopii `classList.remove('hidden'); classList.add('flex')` wystarczą `openModal(id)` i `closeModal(id)`.

**2.7 Identyfikatory.**
`'log_' + Date.now()` może się powtórzyć przy kilku wpisach w tej samej milisekundzie (kod obchodzi to przez `+1`, `+2`). Lepiej użyć `crypto.randomUUID()`.

**2.8 Zależność od internetu.**
Tailwind z CDN i Google Fonts wymagają sieci. Bez niej aplikacja traci cały wygląd. Tailwind CDN nie jest też przeznaczony do użytku produkcyjnego (pokazuje ostrzeżenie w konsoli). Opcjonalnie: wygeneruj raz plik CSS (Tailwind CLI) i wklej go do HTML, a jako czcionkę zostaw systemową (Segoe UI).

**2.9 `confirm()` / `prompt()`.**
Systemowe okienka odstają od reszty interfejsu. Wystarczy jeden mały, własny modal potwierdzenia.

---

## 3. Wygląd i czytelność

**3.1 Część klas nie działa.**
`shadow-2xs` i `backdrop-blur-xs` pochodzą z Tailwind v4, a `cdn.tailwindcss.com` ładuje v3. Przyciski nie mają przez to cienia, a tło modali nie jest rozmyte. Zamień na `shadow-sm` i `backdrop-blur-sm`.

**3.2 Kontrast i wielkość tekstu.**
Dużo tekstu `text-zinc-400` w rozmiarze 10–11 px na białym tle jest słabo czytelne. Proponowane minimum: `text-zinc-500` i 12 px dla treści, a 10–11 px tylko dla etykiet.

**3.3 Status bazy ma być oczywisty.**
Trzy stany w pigułce w nagłówku:
- 🟢 „fokus-db.json · zapisano 10:42”
- 🟡 „Kliknij, aby zezwolić na zapis”
- ⚪/🔴 „Brak bazy” lub „Błąd”

Do tego baner 🔒 z instrukcji naprawy.

**3.4 Kwadranty Eisenhowera.**
- Dodaj subtelny kolor akcentu: Q1 czerwony, Q2 niebieski, Q3 bursztynowy, Q4 szary. Ułatwi to szybkie skanowanie.
- Stała wysokość `calc(43vh-4rem)` na niższych ekranach daje bardzo krótkie listy. Lepiej użyć `min-h` z przewijaniem.

**3.5 Kalendarz.**
Pięć dużych kart dni jedna pod drugą wymaga długiego przewijania. Siatka tygodniowa (5 kolumn Pn–Pt) z podsumowaniem obok będzie czytelniejsza i zmieści się na jednym ekranie.

**3.6 Nagłówek.**
Pięć zakładek, przycisk zadania i cztery przyciski narzędzi zajmują dużo miejsca na laptopie 1366 px. „Słowniki” i „Instrukcję” można schować pod jedną ikoną „⋯”.

**3.7 Ikony.**
Mieszanka emoji (⚙️ 📖 🌙 🐸 🌴 💬 📌) wygląda różnie w zależności od systemu. Lepiej jeden zestaw ikon SVG (np. Lucide) albo ograniczenie emoji do 2–3 miejsc.

**3.8 Wewnętrzne nazwy w interfejsie.**
Napisy „Solo · Soft Bento” pod logo oraz „Kafelek 01” w instrukcji to nazwy robocze. Można je usunąć lub zamienić na opisowe.
