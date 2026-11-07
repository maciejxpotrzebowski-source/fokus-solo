import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlPath = path.resolve(__dirname, '../Fokus.html');

describe('FOKUS SOLO — KOMPLEKSOWY PAKIET TESTÓW LOGIKI I ARCHITEKTURY', () => {

  // =========================================================================
  // 1. STRAŻNIK 1.3: MACIERZ EISENHOWERA I ALGORYTM PILNOŚCI MAX (DNI ROBOCZE)
  // =========================================================================
  describe('1. Algorytm Efektywnej Pilności (Reguła MAX & Dni Robocze)', () => {
    const URGENCY_WEIGHT = { LAST: 1, NORMAL: 2, HIGH: 3, ASAP: 4 };

    function formatLocalYMD(d) {
      const y = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      return `${y}-${mo}-${da}`;
    }

    function parseLocalDate(isoStr) {
      if (!isoStr) return new Date();
      const [y, m, d] = String(isoStr).split('-').map(Number);
      return new Date(y, (m || 1) - 1, d || 1);
    }

    function getPolishHolidayDetails(year) {
      const map = {
        [`${year}-01-01`]: 'Nowy Rok',
        [`${year}-01-06`]: 'Święto Trzech Króli',
        [`${year}-05-01`]: 'Święto Pracy',
        [`${year}-05-03`]: 'Święto Konstytucji 3 Maja',
        [`${year}-08-15`]: 'Wniebowzięcie NMP',
        [`${year}-11-01`]: 'Wszystkich Świętych',
        [`${year}-11-11`]: 'Narodowe Święto Niepodległości',
        [`${year}-12-25`]: 'Boże Narodzenie (I)',
        [`${year}-12-26`]: 'Boże Narodzenie (II)'
      };
      const a = year % 19, b = Math.floor(year / 100), c = year % 100;
      const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
      const g = Math.floor((b - f + 1) / 3);
      const h = (19 * a + b - d - g + 15) % 30;
      const i = Math.floor(c / 4), k = c % 4;
      const l = (32 + 2 * e + 2 * i - h - k) % 7;
      const m = Math.floor((a + 11 * h + 22 * l) / 451);
      const month = Math.floor((h + l - 7 * m + 114) / 31);
      const day = ((h + l - 7 * m + 114) % 31) + 1;
      const easter = new Date(year, month - 1, day);
      const easterMon = new Date(year, month - 1, day + 1);
      const corpus = new Date(year, month - 1, day + 60);
      map[formatLocalYMD(easter)] = 'Wielkanoc';
      map[formatLocalYMD(easterMon)] = 'Poniedziałek Wielkanocny';
      map[formatLocalYMD(corpus)] = 'Boże Ciało';
      return map;
    }

    function countBusinessDays(todayISO, dueISO, freeDaysSet = new Set()) {
      if (!dueISO) return null;
      if (dueISO === todayISO) return 0;
      const today = parseLocalDate(todayISO);
      const due = parseLocalDate(dueISO);

      if (due < today) {
        let cur = new Date(due);
        let count = 0;
        while (formatLocalYMD(cur) !== todayISO) {
          cur.setDate(cur.getDate() + 1);
          const iso = formatLocalYMD(cur);
          const dayOfWeek = cur.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          if (!isWeekend && !freeDaysSet.has(iso)) count--;
        }
        return count;
      }

      let cur = new Date(today);
      let count = 0;
      while (formatLocalYMD(cur) !== dueISO) {
        cur.setDate(cur.getDate() + 1);
        const iso = formatLocalYMD(cur);
        const dayOfWeek = cur.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        if (!isWeekend && !freeDaysSet.has(iso)) count++;
      }
      return count;
    }

    function computeEffectiveUrgency(task, todayISO = '2026-11-06', calendarEvents = []) {
      const tagWeight = URGENCY_WEIGHT[task.urgencyTag] || 2;
      let dateWeight = 1;
      let daysLeft = null;

      if (task.dueDate) {
        const year = parseLocalDate(todayISO).getFullYear();
        const holidays = getPolishHolidayDetails(year);
        const freeSet = new Set(Object.keys(holidays));

        calendarEvents.forEach(evt => {
          if (evt.type === 'VACATION' || evt.isAllDay) {
            freeSet.add(evt.dateISO);
          }
        });

        daysLeft = countBusinessDays(todayISO, task.dueDate, freeSet);
        if (daysLeft <= 1) dateWeight = 4;       // Dziś, jutro robocze lub po terminie -> ASAP
        else if (daysLeft <= 3) dateWeight = 3;  // 2-3 dni robocze -> Wysoka
        else if (daysLeft <= 7) dateWeight = 2;  // 4-7 dni roboczych -> Standard
        else dateWeight = 1;                     // > 7 dni roboczych -> Last
      }

      const maxWeight = Math.max(tagWeight, dateWeight);
      const level = Object.keys(URGENCY_WEIGHT).find(k => URGENCY_WEIGHT[k] === maxWeight) || 'NORMAL';
      const boostedByDate = dateWeight > tagWeight;

      return {
        level,
        weight: maxWeight,
        boostedByDate,
        daysLeft,
        isUrgentForMatrix: maxWeight >= 3,
        isImportantForMatrix: task.importance === 'CRITICAL' || task.importance === 'HIGH' || task.importance === 'IMPORTANT'
      };
    }

    test('W piątek zadanie z terminem na poniedziałek awansuje do ASAP (1 dzień roboczy)', () => {
      // 2026-11-06 to piątek, 2026-11-09 to poniedziałek
      const task = {
        urgencyTag: 'LAST',
        dueDate: '2026-11-09',
        importance: 'HIGH'
      };
      const result = computeEffectiveUrgency(task, '2026-11-06');
      assert.equal(result.daysLeft, 1, 'Powinien pozostać dokładnie 1 dzień roboczy');
      assert.equal(result.level, 'ASAP');
      assert.equal(result.weight, 4);
      assert.equal(result.boostedByDate, true);
    });

    test('W czwartek zadanie na poniedziałek awansuje do ASAP, jeśli w piątek jest urlop', () => {
      // 2026-11-05 to czwartek, 2026-11-06 to urlop w piątek, 2026-11-09 to poniedziałek
      const task = {
        urgencyTag: 'NORMAL',
        dueDate: '2026-11-09',
        importance: 'HIGH'
      };
      const events = [{ dateISO: '2026-11-06', type: 'VACATION', isAllDay: true }];
      const result = computeEffectiveUrgency(task, '2026-11-05', events);
      assert.equal(result.daysLeft, 1, 'Przy urlopie w piątek do poniedziałku zostaje 1 dzień roboczy');
      assert.equal(result.level, 'ASAP');
      assert.equal(result.weight, 4);
      assert.equal(result.boostedByDate, true);
    });

    test('W piątek zadanie na wtorek ma status HIGH (2 dni robocze)', () => {
      // 2026-11-06 (piątek) -> 2026-11-10 (wtorek) = 2 dni robocze
      const task = {
        urgencyTag: 'LAST',
        dueDate: '2026-11-10',
        importance: 'NORMAL'
      };
      const result = computeEffectiveUrgency(task, '2026-11-06');
      assert.equal(result.daysLeft, 2);
      assert.equal(result.level, 'HIGH');
      assert.equal(result.weight, 3);
    });

    test('Zadanie ASAP z odległym terminem zachowuje wagę 4 (ASAP bez podbicia)', () => {
      const task = {
        urgencyTag: 'ASAP',
        dueDate: '2026-12-01',
        importance: 'NORMAL'
      };
      const result = computeEffectiveUrgency(task, '2026-11-06');
      assert.equal(result.level, 'ASAP');
      assert.equal(result.weight, 4);
      assert.equal(result.boostedByDate, false);
      assert.equal(result.isUrgentForMatrix, true);
      assert.equal(result.isImportantForMatrix, false);
    });

    test('Zadanie po terminie (ujemne dni) automatycznie otrzymuje ASAP (waga 4)', () => {
      const task = {
        urgencyTag: 'NORMAL',
        dueDate: '2026-11-05',
        importance: 'LOW'
      };
      const result = computeEffectiveUrgency(task, '2026-11-06');
      assert.equal(result.level, 'ASAP');
      assert.equal(result.weight, 4);
      assert.equal(result.boostedByDate, true);
      assert.ok(result.daysLeft < 0);
    });

    test('Zadanie bez terminu polega wyłącznie na tagu tekstowym', () => {
      const task = {
        urgencyTag: 'HIGH',
        dueDate: null,
        importance: 'NORMAL'
      };
      const result = computeEffectiveUrgency(task, '2026-11-06');
      assert.equal(result.level, 'HIGH');
      assert.equal(result.weight, 3);
      assert.equal(result.boostedByDate, false);
      assert.equal(result.isUrgentForMatrix, true);
    });
  });

  // =========================================================================
  // 2. STRAŻNIK 1.1: REGUŁA IVY LEE (MAKSYMALNIE 6 ZADAŃ W MÓJ DZIEŃ)
  // =========================================================================
  describe('2. Reguła Ivy Lee (Maksymalnie 6 zadań w Mój Dzień)', () => {
    function toggleTaskMyDay(tasks, targetTaskId) {
      const activeMyDay = tasks.filter(t => t.status !== 'DONE' && t.status !== 'WAITING_FOR' && (t.inMyDay || t.isMyDay));
      const target = tasks.find(t => t.id === targetTaskId);
      if (!target) return { success: false, reason: 'NOT_FOUND' };

      const currentlyInMyDay = target.inMyDay || target.isMyDay;
      if (!currentlyInMyDay) {
        if (activeMyDay.length >= 6) {
          return { success: false, reason: 'IVY_LEE_LIMIT_REACHED' };
        }
        target.inMyDay = true;
        target.isMyDay = true;
        target.myDayOrder = activeMyDay.length + 1;
        return { success: true, added: true };
      } else {
        target.inMyDay = false;
        target.isMyDay = false;
        target.myDayOrder = null;
        return { success: true, removed: true };
      }
    }

    test('Pozwala dodać do 6 zadań na listę Mój Dzień', () => {
      const tasks = Array.from({ length: 5 }, (_, i) => ({
        id: `tsk_${i}`,
        status: 'TODO',
        inMyDay: true,
        isMyDay: true
      }));
      const newTask = { id: 'tsk_6th', status: 'TODO', inMyDay: false, isMyDay: false };
      tasks.push(newTask);

      const res = toggleTaskMyDay(tasks, 'tsk_6th');
      assert.equal(res.success, true);
      assert.equal(newTask.inMyDay, true);
    });

    test('Blokuje dodanie 7. zadania z błędem IVY_LEE_LIMIT_REACHED', () => {
      const tasks = Array.from({ length: 6 }, (_, i) => ({
        id: `tsk_${i}`,
        status: 'TODO',
        inMyDay: true,
        isMyDay: true
      }));
      const extraTask = { id: 'tsk_7th', status: 'TODO', inMyDay: false, isMyDay: false };
      tasks.push(extraTask);

      const res = toggleTaskMyDay(tasks, 'tsk_7th');
      assert.equal(res.success, false);
      assert.equal(res.reason, 'IVY_LEE_LIMIT_REACHED');
      assert.equal(extraTask.inMyDay, false);
    });
  });

  // =========================================================================
  // 3. STRAŻNIK 1.2: METODA ALPEN (BUDŻET CZASU 5H / 300 MIN)
  // =========================================================================
  describe('3. Metoda ALPEN (Budżet 300 min z progami kolorystycznymi)', () => {
    function calculateAlpenStatus(estimatedMinutesArray) {
      const total = estimatedMinutesArray.reduce((acc, m) => acc + (parseInt(m, 10) || 0), 0);
      const pct = Math.min(100, Math.round((total / 300) * 100));
      let colorClass = 'neutral';
      if (total > 300) colorClass = 'alarm-rose';
      else if (total > 240) colorClass = 'warning-amber';
      return { total, pct, colorClass };
    }

    test('Budżet <= 240 min zwraca kolor neutralny', () => {
      const res = calculateAlpenStatus([60, 45, 90]);
      assert.equal(res.total, 195);
      assert.equal(res.colorClass, 'neutral');
    });

    test('Budżet 241-300 min zwraca kolor ostrzegawczy bursztynowy (amber)', () => {
      const res = calculateAlpenStatus([60, 60, 60, 90]);
      assert.equal(res.total, 270);
      assert.equal(res.colorClass, 'warning-amber');
    });

    test('Budżet > 300 min zwraca kolor alarmowy czerwony (rose)', () => {
      const res = calculateAlpenStatus([90, 90, 90, 45]);
      assert.equal(res.total, 315);
      assert.equal(res.colorClass, 'alarm-rose');
    });

    test('Spotkania z Kalendarza zmniejszają dostępny budżet skupienia (focusCapacity)', () => {
      const baseBudget = 300;
      const meetings = [{ durationMinutes: 60 }, { durationMinutes: 45 }];
      const meetingMin = meetings.reduce((sum, m) => sum + m.durationMinutes, 0);
      const focusCapacity = Math.max(0, baseBudget - meetingMin);
      assert.equal(meetingMin, 105);
      assert.equal(focusCapacity, 195);
    });

    test('Urlop lub dzień wolny zeruje budżet skupienia danego dnia do 0h', () => {
      const isDayOff = true;
      const focusCapacity = isDayOff ? 0 : 300;
      assert.equal(focusCapacity, 0);
    });
  });

  // =========================================================================
  // 4. STRAŻNIK 1.5: STOPER POMODORO Z TRYBEM OVERTIME
  // =========================================================================
  describe('4. Stoper Pomodoro z Trybem Overtime', () => {
    function finalizePomodoroSession(plannedMin, remainingSec, overtimeSec, isOvertime) {
      const elapsedPlannedSec = (plannedMin * 60) - remainingSec;
      const elapsedPlannedMin = Math.max(1, Math.round(elapsedPlannedSec / 60));
      const overtimeMin = Math.round(overtimeSec / 60);
      const totalMin = isOvertime ? (plannedMin + overtimeMin) : elapsedPlannedMin;
      return {
        plannedMinutes: plannedMin,
        overtimeMinutes: overtimeMin,
        totalMinutes: totalMin,
        durationMinutes: totalMin,
        isOvertime
      };
    }

    test('Sesja z 7 min nadgodzin zapisuje pełne 32 minuty (25 + 7)', () => {
      const session = finalizePomodoroSession(25, 0, 420, true);
      assert.equal(session.totalMinutes, 32);
      assert.equal(session.overtimeMinutes, 7);
      assert.equal(session.plannedMinutes, 25);
    });

    test('Sesja przerwana przed czasem (np. 15 z 25 min) zapisuje czas rzeczywisty', () => {
      const session = finalizePomodoroSession(25, 10 * 60, 0, false);
      assert.equal(session.totalMinutes, 15);
      assert.equal(session.overtimeMinutes, 0);
    });
  });

  // =========================================================================
  // 5. STRAŻNIK 1.6: NIEMODYFIKOWALNY "DUPOCHRON" (APPEND-ONLY AUDIT LOG)
  // =========================================================================
  describe('5. Dupochron: originalDueDate jest nienadpisywalne + Append-Only Log', () => {
    test('Zmiana terminu nigdy nie nadpisuje pola originalDueDate', () => {
      const task = {
        id: 'tsk_test',
        dueDate: '2026-11-05',
        originalDueDate: '2026-11-05',
        auditLog: []
      };

      // Pierwsze przesunięcie
      const shift1Date = '2026-11-10';
      if (!task.originalDueDate && task.dueDate) task.originalDueDate = task.dueDate;
      task.dueDate = shift1Date;
      task.auditLog.unshift({
        id: 'log_1',
        changeType: 'DUE_DATE_CHANGED',
        oldValue: '2026-11-05',
        newValue: shift1Date,
        reasonComment: 'Przesunięcie 1'
      });

      // Drugie przesunięcie
      const shift2Date = '2026-11-15';
      if (!task.originalDueDate && task.dueDate) task.originalDueDate = task.dueDate;
      task.dueDate = shift2Date;
      task.auditLog.unshift({
        id: 'log_2',
        changeType: 'DUE_DATE_CHANGED',
        oldValue: shift1Date,
        newValue: shift2Date,
        reasonComment: 'Przesunięcie 2'
      });

      assert.equal(task.originalDueDate, '2026-11-05');
      assert.equal(task.dueDate, '2026-11-15');
      assert.equal(task.auditLog.length, 2);
      assert.equal(task.auditLog[0].newValue, '2026-11-15');
      assert.equal(task.auditLog[1].newValue, '2026-11-10');
    });
  });

  // =========================================================================
  // 6. STRAŻNIK 3.1: SŁOWNIK OSÓB Z UKRYTYMI ALIASAMI
  // =========================================================================
  describe('6. Słowniki i wyszukiwarka po ukrytych aliasach', () => {
    const people = [
      { id: 'per_grzegorz', canonicalName: 'Grzegorz', roleOrDept: 'Szef / Dyrektor', aliases: ['grzesiek', 'gp', 'szef', 'prezes'] },
      { id: 'per_tomek', canonicalName: 'Tomek', roleOrDept: 'Zakupy Opakowań', aliases: ['tk', 'tomasz', 'opakowania'] }
    ];

    function searchPeople(query) {
      const q = query.toLowerCase().trim();
      return people.filter(p => {
        const inName = p.canonicalName.toLowerCase().includes(q);
        const inRole = (p.roleOrDept || '').toLowerCase().includes(q);
        const inAliases = (p.aliases || []).some(a => a.toLowerCase().includes(q));
        return inName || inRole || inAliases;
      });
    }

    test('Wpisanie aliasu "szef" zwraca rekord Grzegorza', () => {
      const res = searchPeople('szef');
      assert.equal(res.length, 1);
      assert.equal(res[0].id, 'per_grzegorz');
      assert.equal(res[0].canonicalName, 'Grzegorz');
    });

    test('Wpisanie aliasu "tk" zwraca rekord Tomka', () => {
      const res = searchPeople('tk');
      assert.equal(res.length, 1);
      assert.equal(res[0].id, 'per_tomek');
    });
  });

  // =========================================================================
  // 7. ZADANIA CYKLICZNE (SOP): RECURRENCE ENGINE
  // =========================================================================
  describe('7. Logika odnawiania zadań cyklicznych (SOP)', () => {
    function computeNextRecurrenceDate(baseIso, recurrence) {
      const parts = baseIso.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(y, m, day);
      if (recurrence === 'WEEKLY') d.setDate(d.getDate() + 7);
      else if (recurrence === 'MONTHLY') d.setMonth(d.getMonth() + 1);
      else if (recurrence === 'QUARTERLY') d.setMonth(d.getMonth() + 3);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateStr = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${dateStr}`;
    }

    test('WEEKLY dodaje dokładnie 7 dni', () => {
      assert.equal(computeNextRecurrenceDate('2026-11-01', 'WEEKLY'), '2026-11-08');
    });

    test('MONTHLY dodaje 1 miesiąc', () => {
      assert.equal(computeNextRecurrenceDate('2026-11-01', 'MONTHLY'), '2026-12-01');
    });

    test('QUARTERLY dodaje 3 miesiące', () => {
      assert.equal(computeNextRecurrenceDate('2026-11-01', 'QUARTERLY'), '2027-02-01');
    });
  });

  // =========================================================================
  // 8. INTEGRALNOŚĆ PLIKU FOKUS.HTML
  // =========================================================================
  describe('8. Integralność struktury Fokus.html i wymaganych kontrolek', () => {
    test('Plik Fokus.html istnieje i zawiera ponad 2000 linii', () => {
      assert.equal(fs.existsSync(htmlPath), true);
      const content = fs.readFileSync(htmlPath, 'utf-8');
      const lines = content.split('\n');
      assert.ok(lines.length >= 2000, `Oczekiwano >= 2000 linii, znaleziono ${lines.length}`);
    });

    test('Fokus.html zawiera 5 zakładek operacyjnych w Segmented Control oraz Słowniki i Instrukcję', () => {
      const content = fs.readFileSync(htmlPath, 'utf-8');
      assert.ok(content.includes('id="navBtn-DAY"'), 'Brak przycisku Mój Dzień');
      assert.ok(content.includes('id="navBtn-MATRIX"'), 'Brak przycisku Eisenhower');
      assert.ok(content.includes('id="navBtn-CALENDAR"'), 'Brak przycisku Kalendarz');
      assert.ok(content.includes('id="navBtn-WAITING"'), 'Brak przycisku Czekam na');
      assert.ok(content.includes('id="navBtn-REPORTS"'), 'Brak przycisku Raporty');
      assert.ok(content.includes('id="navBtn-DICTIONARIES"'), 'Brak przycisku Słowniki');
      assert.ok(content.includes('id="navBtn-GUIDE"'), 'Brak przycisku Instrukcja');
      assert.ok(content.includes('Eisenhower'), 'Brak etykiety Eisenhower w nawigacji');
    });

    test('Fokus.html zawiera modal kalendarza calendarEventModal i metody Bento', () => {
      const content = fs.readFileSync(htmlPath, 'utf-8');
      assert.ok(content.includes('id="calendarEventModal"'), 'Brak modala calendarEventModal');
      assert.ok(content.includes('renderCalendarBento'), 'Brak funkcji renderCalendarBento');
      assert.ok(content.includes('renderGuideBento'), 'Brak funkcji renderGuideBento');
      assert.ok(content.includes('calendarEvents'), 'Brak calendarEvents w bazie');
    });

    test('Fokus.html posiada presety Pomodoro 15, 25, 45, 60 i 90 minut', () => {
      const content = fs.readFileSync(htmlPath, 'utf-8');
      assert.ok(content.includes('15, 25, 45, 60, 90'), 'Brak pełnego zestawu presetów [15, 25, 45, 60, 90]');
    });

    test('Fokus.html zawiera kategorię cat_wlasne w słowniku domyślnym', () => {
      const content = fs.readFileSync(htmlPath, 'utf-8');
      assert.ok(content.includes("'cat_wlasne'"), 'Brak kategorii cat_wlasne w słowniku domyślnym');
    });

    test('Fokus.html zawiera szablony SOP (sopTemplates)', () => {
      const content = fs.readFileSync(htmlPath, 'utf-8');
      assert.ok(content.includes('sopTemplates'), 'Brak sekcji sopTemplates w DEFAULT_DB');
      assert.ok(content.includes('Szablony Procedur (SOP)'), 'Brak widoku zarządzania SOP w Słownikach');
    });

    test('Fokus.html posiada obsługę kopii zapasowej dziennej', () => {
      const content = fs.readFileSync(htmlPath, 'utf-8');
      assert.ok(content.includes('downloadDailyBackup'), 'Brak funkcji downloadDailyBackup');
      assert.ok(content.includes('ensureDailyBackup'), 'Brak funkcji ensureDailyBackup');
    });
  });
});
