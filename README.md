# FOKUS SOLO (Soft Bento Edition) — Wersja 4.2

[![Testy Jednostkowe](https://img.shields.io/badge/Testy-32%2F32%20Pass-emerald)](./docs/TESTS.md)
[![Wersja](https://img.shields.io/badge/Wersja-4.2--bento--solo-blue)](./release/INSTRUKCJA_WDROZENIA.md)
[![Architektura](https://img.shields.io/badge/Architektura-Local--First%20%C2%B7%20Zero--Admin%20IT-purple)](./docs/SPECYFIKACJA_TECHNICZNA.md)

Minimalistyczny, analityczny system zarządzania zadaniami, czasem skupienia, historią zmian priorytetów („Dupochron”) oraz zasobami kalendarza w stylistyce Apple Soft Bento.

---

## 📁 Uporządkowana Struktura Projektu

Folder projektu został zorganizowany w przejrzysty, modułowy sposób bez luźnych plików roboczych:

```
Fokus/
├── release/                        # 🚀 AKTUALNA WERSJA PRODUKCYJNA
│   ├── Fokus.html                  # Gotowa aplikacja produkcyjna (pojedynczy plik HTML)
│   └── INSTRUKCJA_WDROZENIA.md     # Pełny opis zmian (Changelog v4.2) oraz instrukcja wdrożenia
│
├── docs/                           # 📚 DOKUMENTACJA TECHNICZNA I TESTOWA
│   ├── SPECYFIKACJA_TECHNICZNA.md  # Pełna specyfikacja modelu danych, widoków i algorytmów
│   └── TESTS.md                    # Dokumentacja 32 testów jednostkowych i integracyjnych
│
├── tests/                          # 🧪 ZAUTOMATYZOWANY PAKIET TESTÓW (npm test)
│   ├── fokus-engine.test.mjs       # Testy reguły MAX, dni roboczych, ALPEN, Pomodoro i Ivy Lee
│   └── fokus-migration.test.mjs    # Testy wstecznej kompatybilności i bezpiecznych migracji
│
├── AGENTS.md                       # 📜 KONSTYTUCJA PROJEKTU dla asystentów AI w Antigravity
├── package.json                    # Konfiguracja środowiska testowego Node.js
└── .gitignore                      # Ochrona przed commitowaniem danych użytkownika (fokus-db.json)
```

---

## ⚡ Szybki Start (Uruchomienie Produkcyjne)

1. Przejdź do folderu **[`release/`](./release/)**.
2. Kliknij dwukrotnie w plik **[`release/Fokus.html`](./release/Fokus.html)** (otworzy się w przeglądarce Google Chrome lub Edge).
3. Dodaj zakładkę do paska (`Ctrl + D` na Windowsie / `Cmd + D` na Macu).
4. *(Opcjonalnie)* Kliknij w prawym górnym rogu przycisk **OneDrive**, aby podpiąć automatyczny zapis do pliku `fokus-db.json` w chmurze firmowej.

Szczegółowy opis nowości w wersji 4.2 oraz instrukcję bezpiecznej aktualizacji znajdziesz w pliku:  
👉 **[`release/INSTRUKCJA_WDROZENIA.md`](./release/INSTRUKCJA_WDROZENIA.md)**

---

## 🧠 6 Filarów Metodycznych FOKUS SOLO

1. **Reguła Ivy Lee (Maksymalnie 6 zadań w Mój Dzień):** Ograniczenie liczby zadań do 6 eliminuje zjawisko *Attention Residue* i zmusza do selekcji najważniejszych celów.
2. **Eat That Frog (Dzisiejsza Żaba):** W Kafelku 01 prezentowane jest w pełnym skupieniu wyłącznie zadanie #1 — najważniejsza i najtrudniejsza analiza dnia.
3. **Metoda ALPEN 60/40 & Kalendarz Zasobów:** System rezerwuje 300 minut (5 godzin) na zadania, zostawiając 40% dnia na spotkania i nieprzewidziane zakłócenia. Spotkania dodane w zakładce **Kalendarz** automatycznie pomniejszają dostępny budżet skupienia.
4. **Macierz Eisenhowera & SLA Dni Roboczych:** Wyliczanie pilności uwzględnia wyłącznie dni robocze, weekendy, polskie święta państwowe oraz Twoje urlopy. Zadanie z terminem na poniedziałek awansuje do statusu **ASAP już w piątek rano**!
5. **Stoper Pomodoro z Trybem Overtime:** Wybicie `00:00` nie przerywa pracy brutalnym dzwonkiem, lecz przełącza licznik w zielony tryb *Flow State*, zliczając łączny rzeczywisty czas pracy.
6. **Niemodyfikowalny Dupochron (Audit Log):** Pierwotny termin zadania (`originalDueDate`) nigdy nie jest nadpisywany. Każde przesunięcie terminu wymusza wskazanie wnioskodawcy i przyczyny w trwałym dzienniku zdarzeń.

---

## 🧪 Uruchomienie Testów Jednostkowych

W terminalu w głównym folderze projektu wpisz:

```bash
npm test
```

Wynik: **32/32 testy zielone (100% pass, czas wykonania ~40 ms)**.
Dokumentacja testów: [`docs/TESTS.md`](./docs/TESTS.md).
