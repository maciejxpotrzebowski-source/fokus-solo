# Fokus.html – dlaczego baza się nie podłącza i jak to naprawić

> **Przed testami zrób kopię `fokus-db.json`.** W obecnym kodzie jest ścieżka, w której przycisk „Zezwól na edycję pliku” może nadpisać plik pustą bazą (opis w punkcie B3).

---

## 1. Podsumowanie

Pliki JavaScript nie mają błędów składni (sprawdzone `node --check`). Problem leży w **logice połączenia**:

1. Aplikacja ogłasza „Połączono”, **zanim** dostanie zgodę na zapis. Pierwszy zapis kończy się błędem, więc status od razu wraca na żółty „(wznów)”. Wygląda to tak, jakby nic się nie podłączyło.
2. Zapisy idą równolegle: każdy znak w notatkach i każde kliknięcie zakładki zapisuje cały plik. Kolidujące zapisy kończą się błędem, a **każdy błąd zapisu jest traktowany jak brak uprawnień**.
3. Nie ma blokady edycji: bez bazy wszystko działa w pamięci i znika po odświeżeniu.
4. Logika „scalania” pamięci z plikiem oraz zapis bez wcześniejszego odczytu mogą **nadpisać dane**.

---

## 2. Najpierw sprawdź środowisko (5 minut)

Te rzeczy mogą zablokować połączenie nawet przy poprawnym kodzie:

| Sprawdź | Jak | Co musi być |
|---|---|---|
| Przeglądarka | – | Chrome lub Edge (Firefox i Safari nie mają tego API) |
| Sposób otwarcia | Pasek adresu | `file:///C:/...Fokus.html` – **nie** podgląd z Outlooka, Teams ani SharePointa (tam okna wyboru pliku są zablokowane) |
| Obsługa API | F12 → Console: `'showOpenFilePicker' in window` | `true` |
| Polityki firmowe | `edge://policy` lub `chrome://policy` | Brak `FileSystemWriteBlockedForUrls` i `FileSystemReadBlockedForUrls`, a `DefaultFileSystemWriteGuardSetting` różne od `2` |
| Lokalizacja pliku | – | Zwykły podfolder, np. `Dokumenty\Fokus\`. Chrome nie pozwala wskazać folderów systemowych ani samego katalogu domowego |
| Błędy | F12 → Console, potem kliknij „Wskaż plik” | Zapisz pełną treść błędu (np. `NotAllowedError`, `SecurityError`, `NoModificationAllowedError`) |

Jeśli w politykach jest blokada zapisu, kod nic nie poradzi – potrzebny będzie wyjątek od IT.

---

## 3. Znalezione błędy w kodzie

### B1. Status „Połączono” jest ustawiany przed uzyskaniem zgody na zapis
`selectDbFile()` (ok. linii 4397):
- `showOpenFilePicker()` daje **tylko odczyt**,
- potem kod robi kilka operacji `await` (IndexedDB, odczyt pliku) i **dopiero wtedy** woła `requestPermission({mode:'readwrite'})`. Do tego czasu „aktywacja użytkownika” po kliknięciu zwykle już wygasa, więc Chrome odrzuca prośbę (`SecurityError`),
- błąd jest wyciszony (`console.warn`), a mimo to wcześniej wywołano `updateDbStatusUI('CONNECTED')` i pokazano komunikat „Pomyślnie połączono”,
- następny zapis (`createWritable`) nie ma uprawnień, więc status przechodzi na `NEEDS_PERMISSION` (żółta kropka).

### B2. Każdy błąd zapisu jest traktowany jako „brak uprawnień”, a zapisy nie są kolejkowane
- `saveDatabase()` jest wołane przy **każdym znaku** w notatkach (`updateTaskNotes`), przy zmianie zakładki (`switchView`), motywu, wybranego zadania, zakładki karty i okresu raportu.
- Kilka `createWritable()` na tym samym pliku naraz potrafi skończyć się błędem (`NoModificationAllowedError` / `InvalidStateError`).
- `writeDatabaseToFile()` i `writeDatabaseToDisk()` w `catch` zawsze wołają `updateDbStatusUI('NEEDS_PERMISSION')`, więc chwilowa kolizja „rozłącza” bazę.

### B3. KRYTYCZNE: zapis bez wcześniejszego odczytu, czyli ryzyko nadpisania pliku pustą bazą
Scenariusz po ponownym uruchomieniu przeglądarki:
1. `initDatabasePersistence()` odczytuje zapamiętany uchwyt i próbuje `readDatabaseFromFile()`. Bez uprawnień odczyt się nie udaje, więc w pamięci zostaje `DEFAULT_DB` (0 zadań).
2. Klikasz „Zezwól na edycję pliku”, więc `renewDbPermission()` dostaje zgodę i **od razu woła `writeDatabaseToFile()`**, nie odczytując pliku.
3. W efekcie plik zostaje nadpisany pustą bazą.

Folder działa tak samo (`writeDatabaseToDisk()`).

### B4. Uszkodzony lub błędny plik i tak jest „podłączany”
`readDatabaseFromFile()` przy błędnym JSON-ie zwraca `false`, ale `selectDbFile()` ignoruje wynik, ogłasza połączenie, a przy pierwszym zapisie nadpisuje wskazany plik. Wystarczy przez pomyłkę wskazać inny plik `.json`.

### B5. Niebezpieczne „scalanie” pamięci z plikiem
W `readDatabaseFromFile()` i `loadOrCreateDatabaseOnDisk()`:
- jeśli plik ma 0 zadań, a pamięć ma zadania, to zadania z pamięci trafiają do pliku (można w ten sposób „przenieść” dane do złego pliku),
- jeśli plik ma zadania, to praca wykonana w pamięci znika bez ostrzeżenia.

Po wprowadzeniu blokady edycji to scalanie w ogóle nie jest potrzebne. **Źródłem prawdy ma być wyłącznie plik.**

### B6. Brak blokady edycji
Wszystkie akcje (nowe zadanie, kroki, notatki, kalendarz, słowniki, Pomodoro) zmieniają `db` w pamięci niezależnie od połączenia. `saveDatabase()` pokazuje tylko komunikat.

### B7. Start z zapamiętanym plikiem
Gdy uprawnienie wygasło, modal się nie otwiera, bo jest pokazywany tylko przy pierwszym uruchomieniu. Widać jedynie żółtą kropkę, więc użytkownik nie wie, że trzeba kliknąć.

### B8. Nie da się utworzyć nowej bazy w trybie „plik”
`showOpenFilePicker()` wskazuje tylko istniejące pliki. Jeśli `fokus-db.json` jeszcze nie istnieje, tryb „plik” nie ma jak wystartować.

---

## 4. Naprawa krok po kroku

Kolejność ma znaczenie. Nazwy funkcji pasują do Twojego kodu.

### Krok 1. Usuń stare funkcje
Usuń w całości (zastąpią je funkcje z kolejnych kroków):
`readDatabaseFromFile`, `writeDatabaseToFile`, `loadOrCreateDatabaseOnDisk`, `writeDatabaseToDisk`, `renewDbPermission`, `selectDbFile`, `selectDbDirectory`, `initDatabasePersistence`, `openDbFileModal`, `requestDbFilePermission`, `connectDatabaseDirectory` oraz aliasy OneDrive (`openOneDriveModal`, `closeOneDriveModal`, `connectOneDriveDirectory`, `writeToOneDriveFolder`).

Zostaw: funkcje IndexedDB (`getHandleDB`, `get/setStored...Handle`), `ensureDailyBackup`, `closeDbFileModal`, `downloadDailyBackup`, `exportDatabaseJson`.

### Krok 2. Stan połączenia i strażnik edycji
Zamień `let dbConnectionState = 'NEEDS_PERMISSION';` na:

```js
// 'DISCONNECTED' | 'NEEDS_PERMISSION' | 'CONNECTED' | 'ERROR'
let dbConnectionState = 'DISCONNECTED';
let lastSavedAt = null;

function isDbWritable() {
  return dbConnectionState === 'CONNECTED';
}

// Wywołuj na początku każdej akcji, która zmienia dane
function requireDb() {
  if (isDbWritable()) return true;
  showToast('🔒 Najpierw podłącz plik bazy danych');
  openDbFileModal();
  return false;
}

function freshDb() {
  return normalizeDatabase(JSON.parse(JSON.stringify(DEFAULT_DB)));
}
```

### Krok 3. Kolejka zapisów z opóźnieniem (debounce)
Zastąp całą funkcję `saveDatabase()`:

```js
let saveTimer = null;
let saveChain = Promise.resolve();

function saveDatabase() {
  if (!isDbWritable()) {
    console.warn('Zapis pominięty – baza nie jest podłączona');
    return false;
  }
  setSaveIndicator('Zapisywanie…');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(queueFlush, 400); // wiele zmian w krótkim czasie = 1 zapis
  return true;
}

// Zapisy wykonują się zawsze po kolei, nigdy równolegle
function queueFlush() {
  saveTimer = null;
  saveChain = saveChain.then(async () => {
    if (!isDbWritable()) return;
    const ok = await writeDbNow();
    setSaveIndicator(ok
      ? 'Zapisano ' + lastSavedAt.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
      : 'Błąd zapisu');
  });
  return saveChain;
}

async function writeDbNow() {
  const json = JSON.stringify(db, null, 2);
  try {
    let target = fileHandle;
    if (!target && directoryHandle) {
      target = await directoryHandle.getFileHandle('fokus-db.json', { create: true });
    }
    if (!target) return false;

    const w = await target.createWritable();
    try {
      await w.write(json);
      await w.close();
    } catch (e) {
      try { await w.abort(); } catch (_) {}
      throw e;
    }
    if (directoryHandle) await ensureDailyBackup();
    lastSavedAt = new Date();
    return true;
  } catch (e) {
    console.error('Zapis bazy nieudany:', e);
    // Tylko błędy uprawnień oznaczają utratę połączenia
    if (e.name === 'NotAllowedError' || e.name === 'SecurityError') {
      updateDbStatusUI('NEEDS_PERMISSION');
      openDbFileModal();
    } else {
      showToast('⚠️ Błąd zapisu (' + e.name + ') – ponowię przy następnej zmianie');
    }
    return false;
  }
}

function setSaveIndicator(text) {
  const el = document.getElementById('dbSaveInfo');
  if (el) el.textContent = text;
}

// Nie trać ostatniej zmiany przy przełączeniu karty lub zamknięciu
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && saveTimer) {
    clearTimeout(saveTimer);
    queueFlush();
  }
});
window.addEventListener('beforeunload', (e) => {
  if (saveTimer) { e.preventDefault(); e.returnValue = ''; }
});
```

W przycisku statusu bazy w nagłówku (`#dbFileStatusBtn`) dodaj po `dbFileLabel`:
```html
<span id="dbSaveInfo" class="hidden lg:inline text-[10px] text-zinc-400"></span>
```

### Krok 4. Odczyt z walidacją, bez scalania

```js
function parseDbText(text) {
  if (!text || !text.trim()) return { empty: true };
  let parsed;
  try { parsed = JSON.parse(text); }
  catch (e) { return { error: 'Plik nie jest poprawnym JSON-em' }; }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed) || !Array.isArray(parsed.tasks)) {
    return { error: 'To nie jest baza Fokus (brak tablicy "tasks")' };
  }
  return { data: normalizeDatabase(parsed) };
}

// Wczytuje bazę z aktualnego uchwytu. Plik = jedyne źródło prawdy.
async function loadFromCurrentHandle() {
  try {
    let fh = fileHandle;
    if (!fh && directoryHandle) {
      try {
        fh = await directoryHandle.getFileHandle('fokus-db.json');
      } catch (e) {
        if (e.name === 'NotFoundError') { db = freshDb(); return true; } // nowy folder = nowa baza
        throw e;
      }
    }
    if (!fh) return false;
    const res = parseDbText(await (await fh.getFile()).text());
    if (res.error) { showToast('❌ ' + res.error); return false; }
    db = res.empty ? freshDb() : res.data;
    loadUiPreferences();
    return true;
  } catch (e) {
    console.error('Odczyt bazy nieudany:', e);
    showToast('Nie można odczytać pliku (' + e.name + ')');
    return false;
  }
}

async function ensureWritePermission(handle) {
  const opts = { mode: 'readwrite' };
  try {
    if ((await handle.queryPermission(opts)) === 'granted') return true;
    return (await handle.requestPermission(opts)) === 'granted';
  } catch (e) {
    // Najczęściej: brak aktywacji użytkownika -> pokażemy przycisk „Zezwól na zapis”
    console.warn('Zgoda na zapis wymaga kliknięcia:', e);
    return false;
  }
}
```

### Krok 5. Jedna funkcja podłączania (plik albo folder)

```js
async function attachHandle({ file = null, dir = null }) {
  fileHandle = file;
  directoryHandle = dir;

  // 1. Odczyt i walidacja. Przy błędzie NIE podłączamy.
  if (!(await loadFromCurrentHandle())) {
    fileHandle = null;
    directoryHandle = null;
    updateDbStatusUI('DISCONNECTED');
    return;
  }
  await setStoredFileHandle(file);
  await setStoredDirectoryHandle(dir);
  renderApp(); // dane widoczne od razu (na razie tylko do odczytu)

  // 2. Uprawnienie do zapisu
  if (!(await ensureWritePermission(file || dir))) {
    updateDbStatusUI('NEEDS_PERMISSION'); // modal pokaże przycisk „Zezwól na zapis”
    openDbFileModal();
    return;
  }

  // 3. Zapis testowy. Dopiero sukces = CONNECTED.
  if (await writeDbNow()) {
    updateDbStatusUI('CONNECTED');
    closeDbFileModal();
    showToast('Połączono z ' + (file ? file.name : dir.name + '/fokus-db.json'));
  } else {
    updateDbStatusUI('ERROR');
  }
  renderApp();
}

async function selectDbFile() {
  if (!window.showOpenFilePicker) {
    showToast('Ta przeglądarka nie obsługuje wyboru pliku – użyj Chrome lub Edge');
    return;
  }
  try {
    const [handle] = await window.showOpenFilePicker({
      id: 'fokus-db',
      multiple: false,
      types: [{ description: 'Baza Fokus', accept: { 'application/json': ['.json'] } }]
    });
    await attachHandle({ file: handle });
  } catch (err) {
    if (err.name !== 'AbortError') showToast('Nie wybrano pliku: ' + err.message);
  }
}

async function selectDbDirectory() {
  if (!window.showDirectoryPicker) {
    showToast('Ta przeglądarka nie obsługuje wyboru folderu');
    return;
  }
  try {
    // mode:'readwrite' = zgoda na zapis od razu przy wyborze folderu
    const handle = await window.showDirectoryPicker({ id: 'fokus-db', mode: 'readwrite' });
    await attachHandle({ dir: handle });
  } catch (err) {
    if (err.name !== 'AbortError') showToast('Błąd wyboru folderu: ' + err.message);
  }
}

// Nowa, pusta baza (rozwiązuje B8)
async function createNewDbFile() {
  if (!window.showSaveFilePicker) { showToast('Przeglądarka nie obsługuje tworzenia plików'); return; }
  try {
    const handle = await window.showSaveFilePicker({
      id: 'fokus-db',
      suggestedName: 'fokus-db.json',
      types: [{ description: 'Baza Fokus', accept: { 'application/json': ['.json'] } }]
    });
    fileHandle = handle;
    directoryHandle = null;
    db = freshDb();
    loadUiPreferences();
    if (!(await writeDbNow())) { updateDbStatusUI('ERROR'); return; }
    await setStoredFileHandle(handle);
    await setStoredDirectoryHandle(null);
    updateDbStatusUI('CONNECTED');
    closeDbFileModal();
    renderApp();
    showToast('Utworzono nową bazę: ' + handle.name);
  } catch (err) {
    if (err.name !== 'AbortError') showToast('Nie utworzono pliku: ' + err.message);
  }
}
```

### Krok 6. Wznowienie zgody: najpierw odczyt, potem zapis (rozwiązuje B3)

```js
async function renewDbPermission() {
  const h = fileHandle || directoryHandle;
  if (!h) { openDbFileModal(); return; }
  try {
    // Wywołane bezpośrednio z kliknięcia, więc aktywacja użytkownika jest aktualna
    if ((await h.requestPermission({ mode: 'readwrite' })) !== 'granted') {
      showToast('Nie udzielono zgody na zapis');
      return;
    }
    if (!(await loadFromCurrentHandle())) { updateDbStatusUI('ERROR'); return; } // NAJPIERW ODCZYT
    updateDbStatusUI('CONNECTED');
    closeDbFileModal();
    renderApp();
    showToast('Połączono ponownie z bazą');
  } catch (e) {
    console.error('Wznowienie uprawnień nieudane:', e);
    showToast('Nie udało się uzyskać uprawnień: ' + e.name);
  }
}
```

Po wznowieniu nie trzeba nic zapisywać, bo plik jest aktualny.

### Krok 7. Start aplikacji (rozwiązuje B7)

```js
async function initDatabasePersistence() {
  loadUiPreferences();
  const file = await getStoredFileHandle();
  const dir = file ? null : await getStoredDirectoryHandle();
  const h = file || dir;

  if (!h) {
    updateDbStatusUI('DISCONNECTED');
    renderApp();
    openDbFileModal();
    return;
  }

  fileHandle = file;
  directoryHandle = dir;
  let perm = 'prompt';
  try { perm = await h.queryPermission({ mode: 'readwrite' }); } catch (e) {}

  if (perm === 'granted' && (await loadFromCurrentHandle())) {
    updateDbStatusUI('CONNECTED');
    renderApp();
    return;
  }
  // Uprawnienie wygasło: NIC nie zapisujemy, czekamy na jedno kliknięcie „Zezwól”
  updateDbStatusUI('NEEDS_PERMISSION');
  renderApp();
  openDbFileModal();
}

function openDbFileModal() {
  renderDbModalContent();
  const m = document.getElementById('dbFileModal');
  if (m) { m.classList.remove('hidden'); m.classList.add('flex'); }
}
```

Wskazówka: w nowszych wersjach Chrome i Edge okno zgody może mieć opcję **„Zezwalaj przy każdej wizycie”**. Po jej wybraniu prośba o zgodę nie powinna wracać przy każdym uruchomieniu.

### Krok 8. Blokada edycji w interfejsie (rozwiązuje B6)

**a) CSS** – dodaj do `<style>`:
```css
body.db-locked #mainCanvas { pointer-events: none; opacity: .45; user-select: none; }
body.db-locked [data-requires-db] { pointer-events: none; opacity: .4; }
```

**b) Baner** – dodaj w HTML przed `toastContainer`:
```html
<div id="dbLockBanner" class="hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-40 items-center gap-3 px-4 py-2.5 rounded-full bg-amber-500 text-white text-xs font-medium shadow-lg">
  🔒 Tryb tylko do odczytu – brak połączenia z plikiem bazy
  <button onclick="openDbFileModal()" class="px-3 py-1 rounded-full bg-white/25 hover:bg-white/35">Podłącz</button>
</div>
```

**c) Atrybut** – dodaj `data-requires-db` do przycisku „+ Nowe zadanie” w nagłówku.

**d) W `updateDbStatusUI(state)`** – na samym początku funkcji:
```js
dbConnectionState = state;
const locked = state !== 'CONNECTED';
document.body.classList.toggle('db-locked', locked);
const banner = document.getElementById('dbLockBanner');
if (banner) { banner.classList.toggle('hidden', !locked); banner.classList.toggle('flex', locked); }
```
W tej samej funkcji obsłuż stan `'ERROR'` (czerwona kropka `bg-rose-500`, etykieta „błąd – kliknij”). Obecnie trafia on do gałęzi „(wznów)”.

**e) Strażnik w akcjach** – CSS blokuje kliknięcia, ale skróty klawiszowe i wywołania z modali nadal przejdą. Dodaj `if (!requireDb()) return;` jako **pierwszą linię** w:

`openTaskModal`, `saveTaskFromModal`, `deleteTaskFromModal`, `openDupochronModal`, `confirmDupochronModal`, `openManualTimeModal`, `saveManualTimeModal`, `openCalendarEventModal`, `saveCalendarEventModal`, `deleteCalendarEvent`, `completeTask`, `toggleTaskMyDay`, `promoteToFrog`, `toggleMilestone`, `addMilestone`, `deleteMilestone`, `updateTaskNotes`, `addManualAuditNote`, `unblockWaitingTask`, `pingWaitingTask`, `togglePomodoro`, `finishAndSavePomodoroSession`, `createPersonInline`, `addPersonFromDictionary`, `updatePersonName`, `updatePersonRole`, `updatePersonAliases`, `deletePerson`, `addCategoryFromDictionary`, `updateCategoryName`, `updateCategoryColor`, `deleteCategory`, `addSopTemplateFromDictionary`, `deleteSopTemplate`.

### Krok 9. Rozdziel preferencje widoku od bazy (część B2)
Te akcje nie zmieniają danych, więc nie powinny zapisywać pliku i muszą działać także bez bazy. W każdej z nich zamień `saveDatabase()` na `saveUiPreferences()`:
- `switchView`
- `toggleTheme`
- `setCard1Tab`
- `selectTaskForCard01`
- przyciski okresu w raportach (`onclick="db.reportPeriod='...'; saveDatabase(); renderApp();"`, ok. linii 1696)

### Krok 10. Import JSON tylko do podłączonej bazy
Na początku `importDatabaseJson(event)`:
```js
if (!requireDb()) { event.target.value = ''; return; }
```
W `reader.onload` zamień `await saveDatabase();` na:
```js
if (!confirm('Import zastąpi całą zawartość podłączonej bazy. Kontynuować?')) return;
db = normalizeDatabase(imported);
await queueFlush();
```
(usuń wcześniejszą linię `db = normalizeDatabase(imported);`, żeby nie występowała dwa razy).

### Krok 11. Modal bazy: dodaj przycisk „Utwórz nową bazę”
W `renderDbModalContent()`, w gałęzi „brak połączenia”, pod przyciskami „Wskaż plik” i „Wskaż folder” dodaj:
```html
<button onclick="createNewDbFile()" class="w-full py-2 text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline underline-offset-2">
  Nie mam jeszcze pliku – utwórz nową, pustą bazę
</button>
```
Popraw też tekst „w tym samym folderze, co Fokus.html”. Aplikacja nie zna swojego folderu, więc lepiej napisać: „Wskaż plik fokus-db.json lub folder, w którym ma być zapisywany”.

---

## 5. Test po zmianach

| # | Scenariusz | Oczekiwany wynik |
|---|---|---|
| 1 | Pierwsze uruchomienie, brak bazy | Modal otwarty, widoczny baner 🔒, „N” i „+ Nowe zadanie” nie działają |
| 2 | „Utwórz nową bazę” | Plik powstaje, zielona kropka, można dodać zadanie |
| 3 | Dodanie zadania i odświeżenie strony (F5) | Zadanie jest widoczne (wczytane z pliku) |
| 4 | Szybkie pisanie w notatkach | Kropka zostaje zielona, w nagłówku „Zapisywanie…” → „Zapisano HH:MM” |
| 5 | Zamknięcie i ponowne otwarcie przeglądarki | Modal z przyciskiem „Zezwól”. Po kliknięciu **zadania nadal są** (test B3) |
| 6 | Wskazanie dowolnego innego pliku `.json` | Komunikat „To nie jest baza Fokus”, plik nienaruszony |
| 7 | Wskazanie folderu bez `fokus-db.json` | Plik i podfolder `backups/` tworzą się automatycznie |
| 8 | Przełączanie zakładek i motywu bez bazy | Działa, nic nie jest zapisywane |
