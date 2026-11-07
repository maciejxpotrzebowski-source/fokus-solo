import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('MIGRACJE SCHEMATU I BEZPIECZEŃSTWO DANYCH (LOCAL-FIRST)', () => {
  const DEFAULT_DB = {
    schemaVersion: '4.1-bento-solo',
    theme: 'LIGHT',
    activeView: 'DAY',
    selectedTaskId: 'tsk_1',
    card1Tab: 'STEPS',
    reportPeriod: 'MONTH',
    lastBackupDate: null,
    people: [
      { id: 'per_grzegorz', canonicalName: 'Grzegorz', roleOrDept: 'Szef / Dyrektor', aliases: ['gp', 'szef'], active: true },
      { id: 'per_wlasne', canonicalName: 'Praca własna', roleOrDept: 'Rozwój', aliases: ['wlasne'], active: true }
    ],
    categories: [
      { id: 'cat_erp', name: 'ERP / Dane BC', colorHex: '#3B82F6' },
      { id: 'cat_wlasne', name: 'Praca własna / Organizacja', colorHex: '#64748B' }
    ],
    sopTemplates: [
      { id: 'sop_rfq', name: 'RFQ', steps: ['Krok 1', 'Krok 2'] }
    ],
    calendarEvents: [],
    tasks: [],
    timeLogs: []
  };

  function normalizeTask(t) {
    if (!t) return t;
    if (!t.id) t.id = 'tsk_' + Date.now();
    if (!t.personId && t.requesterPersonId) t.personId = t.requesterPersonId;
    if (!t.requesterPersonId && t.personId) t.requesterPersonId = t.personId;
    if (t.contextNotes === undefined && t.notesAndContext !== undefined) t.contextNotes = t.notesAndContext;
    if (t.notesAndContext === undefined && t.contextNotes !== undefined) t.notesAndContext = t.contextNotes;
    if (!t.checklist && t.milestones) t.checklist = t.milestones;
    if (!t.milestones && t.checklist) t.milestones = t.checklist;
    if (!t.milestones) t.milestones = [];
    if (!t.checklist) t.checklist = t.milestones;
    if (!t.auditLog) t.auditLog = [];
    if (t.inMyDay !== undefined) t.isMyDay = !!t.inMyDay;
    if (t.isMyDay !== undefined) t.inMyDay = !!t.isMyDay;
    if (t.originalDueDate === undefined) t.originalDueDate = t.dueDate || null;
    if (!t.createdAtISO && t.createdAt) t.createdAtISO = t.createdAt;
    if (!t.createdAt && t.createdAtISO) t.createdAt = t.createdAtISO;
    if (!t.completedAtISO && t.completedAt) t.completedAtISO = t.completedAt;
    if (!t.completedAt && t.completedAtISO) t.completedAt = t.completedAtISO;

    if (t.waitingFor && typeof t.waitingFor === 'object') {
      t.waitingForPersonId = t.waitingFor.personId || t.waitingForPersonId || null;
      t.waitingForReason = t.waitingFor.reason || t.waitingForReason || '';
      t.waitingSince = t.waitingFor.sinceISO || t.waitingSince || '';
    } else if (t.waitingForPersonId || t.waitingForReason || t.waitingSince) {
      t.waitingFor = {
        personId: t.waitingForPersonId || '',
        reason: t.waitingForReason || '',
        sinceISO: t.waitingSince || ''
      };
    }
    return t;
  }

  function normalizeDatabase(parsed) {
    const data = { ...DEFAULT_DB, ...parsed };
    if (parsed.peopleDictionary && !parsed.people) {
      data.people = parsed.peopleDictionary;
    }
    if (parsed.categoryDictionary && !parsed.categories) {
      data.categories = parsed.categoryDictionary;
    }
    if (parsed.timeSessions && !parsed.timeLogs) {
      data.timeLogs = parsed.timeSessions;
    }
    if (!data.people) data.people = DEFAULT_DB.people;
    if (!data.categories) data.categories = DEFAULT_DB.categories;
    if (!data.timeLogs) data.timeLogs = DEFAULT_DB.timeLogs;
    if (!data.sopTemplates || !Array.isArray(data.sopTemplates) || data.sopTemplates.length === 0) {
      data.sopTemplates = DEFAULT_DB.sopTemplates;
    }
    if (!data.categories.some(c => c.id === 'cat_wlasne')) {
      data.categories.push({ id: 'cat_wlasne', name: 'Praca własna / Organizacja', colorHex: '#64748B' });
    }
    if (!data.calendarEvents || !Array.isArray(data.calendarEvents)) {
      data.calendarEvents = DEFAULT_DB.calendarEvents || [];
    }
    data.tasks = (data.tasks || []).map(normalizeTask);
    data.peopleDictionary = data.people;
    data.categoryDictionary = data.categories;
    data.timeSessions = data.timeLogs;
    return data;
  }

  test('Import bazy v3 z kluczami peopleDictionary i timeSessions mapuje się na people i timeLogs', () => {
    const legacyDb = {
      schemaVersion: '3.0.0-chrome-solo',
      peopleDictionary: [{ id: 'per_legacy', canonicalName: 'Jan Kowalski', aliases: ['jk'] }],
      categoryDictionary: [{ id: 'cat_legacy', name: 'Stara kategoria', colorHex: '#123456' }],
      timeSessions: [{ id: 'ses_1', taskId: 'tsk_1', totalMinutes: 45 }],
      tasks: [
        {
          id: 'tsk_1',
          title: 'Stare zadanie',
          personId: 'per_legacy',
          contextNotes: 'Notatka robocza',
          checklist: [{ id: 'c1', title: 'Krok 1', isDone: true }],
          waitingFor: { personId: 'per_legacy', reason: 'Czekam na akcept', sinceISO: '2026-11-01' }
        }
      ]
    };

    const normalized = normalizeDatabase(legacyDb);
    assert.equal(normalized.people.length, 1);
    assert.equal(normalized.people[0].id, 'per_legacy');
    assert.equal(normalized.timeLogs.length, 1);
    assert.equal(normalized.timeSessions.length, 1);

    const task = normalized.tasks[0];
    assert.equal(task.requesterPersonId, 'per_legacy');
    assert.equal(task.notesAndContext, 'Notatka robocza');
    assert.equal(task.milestones.length, 1);
    assert.equal(task.waitingForPersonId, 'per_legacy');
    assert.equal(task.waitingForReason, 'Czekam na akcept');
  });

  test('Import bazy ze starymi płaskimi polami waitingForPersonId tworzy obiekt waitingFor', () => {
    const flatTaskDb = {
      tasks: [
        {
          id: 'tsk_flat',
          title: 'Płaskie zadanie',
          requesterPersonId: 'per_grzegorz',
          waitingForPersonId: 'per_grzegorz',
          waitingForReason: 'Brak danych ERP',
          waitingSince: '2026-11-02T10:00:00Z'
        }
      ]
    };

    const normalized = normalizeDatabase(flatTaskDb);
    const task = normalized.tasks[0];
    assert.ok(task.waitingFor);
    assert.equal(task.waitingFor.personId, 'per_grzegorz');
    assert.equal(task.waitingFor.reason, 'Brak danych ERP');
    assert.equal(task.waitingFor.sinceISO, '2026-11-02T10:00:00Z');
  });

  test('Brakująca kategoria cat_wlasne zostaje automatycznie uzupełniona', () => {
    const dbWithoutWlasne = {
      categories: [{ id: 'cat_erp', name: 'ERP', colorHex: '#000' }]
    };
    const normalized = normalizeDatabase(dbWithoutWlasne);
    assert.ok(normalized.categories.some(c => c.id === 'cat_wlasne'));
  });

  test('Brakująca tablica calendarEvents zostaje zainicjalizowana przy migracji schematu', () => {
    const dbWithoutCalendar = {
      schemaVersion: '4.1-bento-solo',
      tasks: []
    };
    const normalized = normalizeDatabase(dbWithoutCalendar);
    assert.ok(Array.isArray(normalized.calendarEvents));
  });
});
