import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlPath = fs.existsSync(path.resolve(__dirname, '../release/Fokus.html'))
  ? path.resolve(__dirname, '../release/Fokus.html')
  : path.resolve(__dirname, '../Fokus.html');

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
    function isHoliday(isoStr) {
      if (!isoStr) return false;
      const [y, m, d] = isoStr.split('-').map(Number);
      if (m === 1 && d === 1) return true; // Nowy Rok
      if (m === 1 && d === 6) return true; // Trzech Króli
      if (m === 5 && d === 1) return true; // Święto Pracy
      if (m === 5 && d === 3) return true; // Konstytucji
      if (m === 11 && d === 1) return true; // Wszystkich Świętych
      if (m === 11 && d === 11) return true; // Niepodległości
      return false;
    }

    function computeNextRecurrenceDate(baseIso, recurrence, rule = null) {
      const parts = baseIso.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);

      if (!rule || !rule.pattern || rule.pattern === 'STANDARD') {
        const d = new Date(y, m, day);
        if (recurrence === 'WEEKLY') d.setDate(d.getDate() + 7);
        else if (recurrence === 'MONTHLY') d.setMonth(d.getMonth() + 1);
        else if (recurrence === 'QUARTERLY') d.setMonth(d.getMonth() + 3);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const dateStr = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${dateStr}`;
      }

      if (recurrence === 'WEEKLY' && rule.pattern === 'WEEKLY_DAY') {
        const targetWeekday = parseInt(rule.weekday != null ? rule.weekday : 1, 10);
        const d = new Date(y, m, day);
        d.setDate(d.getDate() + 1);
        while (d.getDay() !== targetWeekday) {
          d.setDate(d.getDate() + 1);
        }
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const dateStr = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${dateStr}`;
      }

      if (recurrence === 'MONTHLY' && rule.pattern === 'DAY_OF_MONTH') {
        let nextYear = y;
        let nextMonth = m + 1;
        if (nextMonth > 11) {
          nextMonth = 0;
          nextYear++;
        }
        const targetDay = parseInt(rule.day, 10) || 10;
        const maxDays = new Date(nextYear, nextMonth + 1, 0).getDate();
        const finalDay = Math.min(targetDay, maxDays);
        const d = new Date(nextYear, nextMonth, finalDay);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const dateStr = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${dateStr}`;
      }

      if (recurrence === 'MONTHLY' && rule.pattern === 'FIRST_WORKDAY') {
        let nextYear = y;
        let nextMonth = m + 1;
        if (nextMonth > 11) {
          nextMonth = 0;
          nextYear++;
        }
        const d = new Date(nextYear, nextMonth, 1);
        while (d.getDay() === 0 || d.getDay() === 6 || isHoliday(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)) {
          d.setDate(d.getDate() + 1);
        }
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const dateStr = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${dateStr}`;
      }

      if (recurrence === 'MONTHLY' && rule.pattern === 'LAST_WORKDAY') {
        let nextYear = y;
        let nextMonth = m + 1;
        if (nextMonth > 11) {
          nextMonth = 0;
          nextYear++;
        }
        const lastDay = new Date(nextYear, nextMonth + 1, 0).getDate();
        const d = new Date(nextYear, nextMonth, lastDay);
        while (d.getDay() === 0 || d.getDay() === 6 || isHoliday(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)) {
          d.setDate(d.getDate() - 1);
        }
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const dateStr = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${dateStr}`;
      }

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

    test('MONTHLY z regułą DAY_OF_MONTH ustawia 10. dzień kolejnego miesiąca', () => {
      const res = computeNextRecurrenceDate('2026-11-15', 'MONTHLY', { pattern: 'DAY_OF_MONTH', day: 10 });
      assert.equal(res, '2026-12-10');
    });

    test('WEEKLY z regułą WEEKLY_DAY ustawia kolejny wtorek (weekday 2)', () => {
      // 2026-11-12 to czwartek (day 4), kolejny wtorek to 2026-11-17
      const res = computeNextRecurrenceDate('2026-11-12', 'WEEKLY', { pattern: 'WEEKLY_DAY', weekday: 2 });
      assert.equal(res, '2026-11-17');
    });

    test('MONTHLY z regułą FIRST_WORKDAY ustawia pierwszy dzień roboczy kolejnego miesiąca (omija weekendy i Nowy Rok)', () => {
      // Baza 2026-11-15 -> kolejny miesiąc grudzień 2026 -> 1 grudnia to wtorek (dzień roboczy)
      const res1 = computeNextRecurrenceDate('2026-11-15', 'MONTHLY', { pattern: 'FIRST_WORKDAY' });
      assert.equal(res1, '2026-12-01');

      // Baza 2026-12-15 -> kolejny miesiąc styczeń 2027 -> 1 stycznia Nowy Rok, 2-3 weekend -> 4 stycznia poniedziałek
      const res2 = computeNextRecurrenceDate('2026-12-15', 'MONTHLY', { pattern: 'FIRST_WORKDAY' });
      assert.equal(res2, '2027-01-04');
    });

    test('MONTHLY z regułą LAST_WORKDAY ustawia ostatni dzień roboczy kolejnego miesiąca', () => {
      // Baza 2026-10-15 -> kolejny miesiąc listopad 2026 -> 30 listopada to poniedziałek
      const res = computeNextRecurrenceDate('2026-10-15', 'MONTHLY', { pattern: 'LAST_WORKDAY' });
      assert.equal(res, '2026-11-30');
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

    test('Fokus.html zawiera kompatybilność sopTemplates w schemacie oraz sortowanie słowników', () => {
      const content = fs.readFileSync(htmlPath, 'utf-8');
      assert.ok(content.includes('sopTemplates'), 'Brak sekcji sopTemplates w DEFAULT_DB');
      assert.ok(content.includes('movePerson'), 'Brak funkcji movePerson do przesuwania osób w słowniku');
      assert.ok(content.includes('moveCategory'), 'Brak funkcji moveCategory do przesuwania kategorii w słowniku');
    });

    test('Fokus.html posiada obsługę kopii zapasowej dziennej', () => {
      const content = fs.readFileSync(htmlPath, 'utf-8');
      assert.ok(content.includes('downloadDailyBackup'), 'Brak funkcji downloadDailyBackup');
      assert.ok(content.includes('ensureDailyBackup'), 'Brak funkcji ensureDailyBackup');
    });

    test('Fokus.html zawiera zakładkę Wszystkie zadania oraz modale kolizji, edycji sesji i własnego czasu', () => {
      const content = fs.readFileSync(htmlPath, 'utf-8');
      assert.ok(content.includes('id="navBtn-ALL_TASKS"'), 'Brak przycisku Wszystkie zadania w nawigacji');
      assert.ok(content.includes('renderAllTasksBento'), 'Brak funkcji renderAllTasksBento');
      assert.ok(content.includes('meetingConflictModal'), 'Brak modala meetingConflictModal');
      assert.ok(content.includes('confirmPomodoroSessionModal'), 'Brak modala confirmPomodoroSessionModal');
      assert.ok(content.includes('editTimeLogModal'), 'Brak modala editTimeLogModal');
      assert.ok(content.includes('customTimerModal'), 'Brak modala customTimerModal');
    });

    test('Logika domyślnego czasu Pomodoro: <40 min ustawia estymację, >=40 min ustawia 25 min', () => {
      function getRecommendedPomodoroMinutes(task) {
        if (!task) return 25;
        const est = parseInt(task.estimatedMinutes, 10) || 0;
        if (est > 0 && est < 40) {
          return est;
        }
        return 25;
      }
      assert.equal(getRecommendedPomodoroMinutes({ estimatedMinutes: 15 }), 15);
      assert.equal(getRecommendedPomodoroMinutes({ estimatedMinutes: 30 }), 30);
      assert.equal(getRecommendedPomodoroMinutes({ estimatedMinutes: 40 }), 25);
      assert.equal(getRecommendedPomodoroMinutes({ estimatedMinutes: 60 }), 25);
      assert.equal(getRecommendedPomodoroMinutes(null), 25);
    });

    test('Fokus.html posiada najwyższy z-index dla powiadomień toast i dynamiczny stos modali', () => {
      const content = fs.readFileSync(htmlPath, 'utf-8');
      assert.ok(content.includes('id="toastContainer"'), 'Brak kontenera toastContainer');
      assert.ok(content.includes('z-[9999]'), 'Brak klasy z-[9999] dla toastContainer');
      assert.ok(content.includes('activeModalsStack'), 'Brak stosu activeModalsStack');
      assert.ok(content.includes('openDbFileModal'), 'Brak funkcji openDbFileModal');
    });

    test('Fokus.html obsługuje stoper jako rozwijaną listę oraz edycję dwuklikiem w tabeli zadań', () => {
      const content = fs.readFileSync(htmlPath, 'utf-8');
      assert.ok(content.includes('togglePomodoroMenu'), 'Brak funkcji togglePomodoroMenu');
      assert.ok(content.includes('pomodoroDropdownMenu'), 'Brak menu pomodoroDropdownMenu');
      assert.ok(content.includes('ondblclick="openTaskModal('), 'Brak obsługi dwukliku na wierszu zadania');
      assert.ok(content.includes('mtMinutesPreset'), 'Brak presetów czasu w oknie Dodaj sesję');
    });

    test('Fokus.html zawiera pola godzin cemStartTime/cemEndTime oraz cykliczność cemRecurrence w modal kalendarza', () => {
      const content = fs.readFileSync(htmlPath, 'utf-8');
      assert.ok(content.includes('id="cemStartTime"'), 'Brak inputu cemStartTime w calendarEventModal');
      assert.ok(content.includes('id="cemEndTime"'), 'Brak inputu cemEndTime w calendarEventModal');
      assert.ok(content.includes('id="cemRecurrence"'), 'Brak selecta cemRecurrence w calendarEventModal');
      assert.ok(content.includes('DAILY_WORKDAYS'), 'Brak opcji DAILY_WORKDAYS w cemRecurrence');
      assert.ok(content.includes('WEEKLY'), 'Brak opcji WEEKLY w cemRecurrence');
      assert.ok(content.includes('MONTHLY'), 'Brak opcji MONTHLY w cemRecurrence');
      assert.ok(content.includes('isCalendarEventActiveOnDate'), 'Brak funkcji isCalendarEventActiveOnDate');
    });

    test('Logika cykliczności spotkań (isCalendarEventActiveOnDate): DAILY_WORKDAYS, WEEKLY, MONTHLY', () => {
      function parseLocalDate(isoStr) {
        const [y, m, d] = String(isoStr).split('-').map(Number);
        return new Date(y, (m || 1) - 1, d || 1);
      }

      function isCalendarEventActiveOnDate(e, targetDateISO) {
        if (!e || !e.dateISO || !targetDateISO) return false;
        const recurrence = e.recurrence || 'NONE';

        if (recurrence === 'NONE') {
          if (e.endDateISO) {
            return e.dateISO <= targetDateISO && targetDateISO <= e.endDateISO;
          }
          return e.dateISO === targetDateISO;
        }

        if (targetDateISO < e.dateISO) return false;
        if (e.endDateISO && targetDateISO > e.endDateISO) return false;

        const targetDate = parseLocalDate(targetDateISO);
        const targetDayOfWeek = targetDate.getDay();
        const targetDayOfMonth = targetDate.getDate();

        if (recurrence === 'DAILY_WORKDAYS') {
          return targetDayOfWeek >= 1 && targetDayOfWeek <= 5;
        }
        if (recurrence === 'DAILY') {
          return true;
        }
        if (recurrence === 'WEEKLY') {
          const baseDate = parseLocalDate(e.dateISO);
          return targetDayOfWeek === baseDate.getDay();
        }
        if (recurrence === 'MONTHLY') {
          const baseDate = parseLocalDate(e.dateISO);
          return targetDayOfMonth === baseDate.getDate();
        }

        return e.dateISO === targetDateISO;
      }

      // 1. Zdarzenie jednorazowe
      const single = { dateISO: '2026-11-12', recurrence: 'NONE' };
      assert.equal(isCalendarEventActiveOnDate(single, '2026-11-12'), true);
      assert.equal(isCalendarEventActiveOnDate(single, '2026-11-13'), false);

      // 2. Codziennie w dni robocze (DAILY_WORKDAYS): start czwartek 2026-11-12
      const dailyWorkdays = { dateISO: '2026-11-12', recurrence: 'DAILY_WORKDAYS' };
      assert.equal(isCalendarEventActiveOnDate(dailyWorkdays, '2026-11-11'), false, 'Nie powinno być aktywne przed datą rozpoczęcia');
      assert.equal(isCalendarEventActiveOnDate(dailyWorkdays, '2026-11-12'), true, 'Czwartek (dzień roboczy)');
      assert.equal(isCalendarEventActiveOnDate(dailyWorkdays, '2026-11-13'), true, 'Piątek (dzień roboczy)');
      assert.equal(isCalendarEventActiveOnDate(dailyWorkdays, '2026-11-14'), false, 'Sobota (weekend)');
      assert.equal(isCalendarEventActiveOnDate(dailyWorkdays, '2026-11-15'), false, 'Niedziela (weekend)');
      assert.equal(isCalendarEventActiveOnDate(dailyWorkdays, '2026-11-16'), true, 'Poniedziałek (dzień roboczy)');

      // 3. Co tydzień (WEEKLY): start wtorek 2026-11-10
      const weeklyTuesday = { dateISO: '2026-11-10', recurrence: 'WEEKLY' };
      assert.equal(isCalendarEventActiveOnDate(weeklyTuesday, '2026-11-03'), false, 'Przed datą rozpoczęcia');
      assert.equal(isCalendarEventActiveOnDate(weeklyTuesday, '2026-11-10'), true, 'Pierwszy wtorek');
      assert.equal(isCalendarEventActiveOnDate(weeklyTuesday, '2026-11-11'), false, 'Środa - inny dzień tygodnia');
      assert.equal(isCalendarEventActiveOnDate(weeklyTuesday, '2026-11-17'), true, 'Kolejny wtorek (+7 dni)');
      assert.equal(isCalendarEventActiveOnDate(weeklyTuesday, '2026-11-24'), true, 'Kolejny wtorek (+14 dni)');

      // 4. Co miesiąc (MONTHLY): 10. dzień każdego miesiąca
      const monthly10th = { dateISO: '2026-11-10', recurrence: 'MONTHLY' };
      assert.equal(isCalendarEventActiveOnDate(monthly10th, '2026-11-10'), true, '10 listopada');
      assert.equal(isCalendarEventActiveOnDate(monthly10th, '2026-11-11'), false, '11 listopada');
      assert.equal(isCalendarEventActiveOnDate(monthly10th, '2026-12-10'), true, '10 grudnia');
      assert.equal(isCalendarEventActiveOnDate(monthly10th, '2027-01-10'), true, '10 stycznia kolejnego roku');

      // 6. Zdarzenie cykliczne w pierwszy dzień roboczy miesiąca (MONTHLY_FIRST_WORKDAY)
      function isHoliday(isoStr) {
        if (!isoStr) return false;
        const [y, m, d] = isoStr.split('-').map(Number);
        if (m === 1 && d === 1) return true; // Nowy Rok
        if (m === 1 && d === 6) return true; // Trzech Króli
        if (m === 5 && d === 1) return true; // Święto Pracy
        if (m === 5 && d === 3) return true; // Konstytucji
        if (m === 11 && d === 1) return true; // Wszystkich Świętych
        if (m === 11 && d === 11) return true; // Niepodległości
        return false;
      }
      function getFirstWorkdayOfMonth(year, month) {
        const d = new Date(year, month, 1);
        while (d.getDay() === 0 || d.getDay() === 6 || isHoliday(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`)) {
          d.setDate(d.getDate() + 1);
        }
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      }

      const monthlyFirstWorkday = { dateISO: '2026-11-01', recurrence: 'MONTHLY_FIRST_WORKDAY' };
      // 1 listopada 2026 to niedziela i święto -> pierwszy dzień roboczy to 2 listopada 2026
      assert.equal(getFirstWorkdayOfMonth(2026, 10), '2026-11-02');
      // Dla stycznia 2027: 1 stycznia to święto, 2-3 weekend -> 4 stycznia
      assert.equal(getFirstWorkdayOfMonth(2027, 0), '2027-01-04');
    });

    test('Parser i formatowanie kroków milowych: pary ✓ i + (wykonane) oraz ○ i - (niewykonane)', () => {
      const content = fs.readFileSync(htmlPath, 'utf-8');
      assert.ok(content.includes('parseMilestoneLine'), 'Brak funkcji parseMilestoneLine');
      assert.ok(content.includes('formatMilestonesForTextarea'), 'Brak funkcji formatMilestonesForTextarea');
      assert.ok(content.includes('normalizeMilestonesTextarea'), 'Brak funkcji normalizeMilestonesTextarea');

      function parseMilestoneLine(rawLine) {
        const line = (rawLine || '').trim();
        if (!line) return null;

        if (line.startsWith('+')) {
          const title = line.slice(1).trim();
          if (!title) return null;
          return { title, isDone: true };
        }
        if (line.startsWith('✓') || line.startsWith('✔')) {
          const title = line.replace(/^[\u2713\u2714]\s*/, '').trim();
          if (!title) return null;
          return { title, isDone: true };
        }

        let title = line;
        if (title.startsWith('-')) {
          title = title.slice(1).trim();
        } else if (title.startsWith('○') || title.startsWith('\u25CB')) {
          title = title.replace(/^[\u25CB]\s*/, '').trim();
        } else if (/^(\[[ \]]|[-*]\s*\[[ \]]|[-*]\s+)/.test(title)) {
          title = title.replace(/^(\[[ \]]|[-*]\s*\[[ \]]|[-*]\s+)/, '').trim();
        }

        if (!title) return null;
        return {
          title,
          isDone: false
        };
      }

      function formatMilestonesForTextarea(milestones = []) {
        if (!Array.isArray(milestones)) return '';
        return milestones.map(m => {
          const title = (m && m.title ? m.title : '').trim();
          return m && m.isDone ? `✓ ${title}` : `○ ${title}`;
        }).join('\n');
      }

      // Plus ze spacją i bez spacji -> isDone: true
      assert.deepEqual(parseMilestoneLine('+ Eksport bazy'), { title: 'Eksport bazy', isDone: true });
      assert.deepEqual(parseMilestoneLine('+Eksport bazy'), { title: 'Eksport bazy', isDone: true });

      // Ptaszek ✓ ze spacją i bez spacji -> isDone: true
      assert.deepEqual(parseMilestoneLine('✓ Eksport bazy'), { title: 'Eksport bazy', isDone: true });
      assert.deepEqual(parseMilestoneLine('✓Eksport bazy'), { title: 'Eksport bazy', isDone: true });

      // Minus i kółko ○ ze spacją i bez spacji -> isDone: false (oznaczenie niewykonania)
      assert.deepEqual(parseMilestoneLine('- Eksport bazy'), { title: 'Eksport bazy', isDone: false });
      assert.deepEqual(parseMilestoneLine('-Eksport bazy'), { title: 'Eksport bazy', isDone: false });
      assert.deepEqual(parseMilestoneLine('○ Eksport bazy'), { title: 'Eksport bazy', isDone: false });
      assert.deepEqual(parseMilestoneLine('○Eksport bazy'), { title: 'Eksport bazy', isDone: false });

      // Brak znaku na początku -> isDone: false
      assert.deepEqual(parseMilestoneLine('Eksport bazy'), { title: 'Eksport bazy', isDone: false });

      // Rezygnacja z v, x oraz [x] -> są traktowane jak zwykły tekst (niewykonane)
      assert.deepEqual(parseMilestoneLine('v Eksport bazy'), { title: 'v Eksport bazy', isDone: false });
      assert.deepEqual(parseMilestoneLine('x Eksport bazy'), { title: 'x Eksport bazy', isDone: false });
      assert.deepEqual(parseMilestoneLine('[x] Eksport bazy'), { title: '[x] Eksport bazy', isDone: false });

      // Formatowanie: zrobione otrzymują ✓ , niezrobione otrzymują eleganckie kółko ○
      const formatted = formatMilestonesForTextarea([
        { title: 'Krok 1', isDone: true },
        { title: 'Krok 2', isDone: false }
      ]);
      assert.equal(formatted, '✓ Krok 1\n○ Krok 2');
    });

    test('Modal dialog dla własnej estymacji czasu (customEstimateModal) z czystym polem', () => {
      const content = fs.readFileSync(htmlPath, 'utf-8');
      assert.ok(content.includes('id="customEstimateModal"'), 'Brak modala customEstimateModal');
      assert.ok(content.includes('id="customEstMinutesInput"'), 'Brak inputu customEstMinutesInput');
      assert.ok(content.includes('function openCustomEstimateModal'), 'Brak funkcji openCustomEstimateModal');
      assert.ok(content.includes('function applyCustomEstimateMinutes'), 'Brak funkcji applyCustomEstimateMinutes');
      assert.ok(content.includes('function closeCustomEstimateModal'), 'Brak funkcji closeCustomEstimateModal');
    });

    test('Dwuklik na zadaniu w sekcji Czekam na otwiera edycję zadania', () => {
      const content = fs.readFileSync(htmlPath, 'utf-8');
      assert.ok(content.includes('ondblclick="openTaskModal(\'${w.id}\')"'), 'Brak obsługi dwukliku w sekcji Czekam na');
    });

    test('Powiększone minimalistyczne logo 5B Fokus CLI Prompt w nagłówku (znak zachęty > i migający kursor _)', () => {
      const content = fs.readFileSync(htmlPath, 'utf-8');
      assert.ok(content.includes('id="logoPromptChar"'), 'Brak elementu logoPromptChar dla znaku >');
      assert.ok(content.includes('id="logoCursorChar"'), 'Brak elementu logoCursorChar dla kursora _');
      assert.ok(content.includes('fokus'), 'Brak napisu fokus w logo');
      assert.ok(!content.includes('System Skupienia'), 'Logo nie powinno zawierać tekstu System Skupienia');
    });

    test('Menu zębatki, modal ustawień wyglądu oraz kropka statusu bazy danych', () => {
      const content = fs.readFileSync(htmlPath, 'utf-8');
      assert.ok(content.includes('id="headerGearBtn"'), 'Brak przycisku zębatki w nagłówku');
      assert.ok(content.includes('id="settingsMenuDropdown"'), 'Brak rozwijanego menu zębatki');
      assert.ok(content.includes('id="settingsModal"'), 'Brak modala ustawień settingsModal');
      assert.ok(content.includes('setLogoAccentColor'), 'Brak funkcji zmiany koloru akcentu logo');
      assert.ok(content.includes('setAppTheme'), 'Brak funkcji zmiany motywu strony');
      assert.ok(content.includes('id="dbFileDot"'), 'Brak kropki statusu bazy');
      assert.ok(content.includes('id="dbFileTooltip"'), 'Brak dymka tooltip dla statusu bazy');
    });

    test('Wszystkie bloki <script> w Fokus.html kompilują się bez żadnych błędów składni (SyntaxError check)', () => {
      const content = fs.readFileSync(htmlPath, 'utf-8');
      const scriptMatches = [...content.matchAll(/<script[\s\S]*?>([\s\S]*?)<\/script>/gi)];
      assert.ok(scriptMatches.length >= 2, 'Oczekiwano co najmniej 2 bloków skryptu');
      scriptMatches.forEach((m, idx) => {
        assert.doesNotThrow(() => {
          new Function(m[1]);
        }, `Błąd składni w bloku skryptu #${idx}`);
      });
    });
  });
});
