# FOKUS SOLO v4.3 — INSTRUKCJA WDROŻENIA I OPIS ZMIAN (CHANGELOG)

> **Wersja:** 4.3-bento-widescreen  
> **Plik Produkcyjny:** [`Fokus.html`](./Fokus.html)  
> **Środowisko:** Google Chrome (Windows / macOS) · Architektura Local-First (Single-File)

---

## 1. Co się zmieniło względem poprzednich wersji? (Pełny Changelog)

### 1.1. Wersja 4.3 (Modernizacja UI/UX pod ekrany 16:9)
* **Wykorzystanie Panoramicznego Ekranu 16:9 (Fluid Widescreen):**
  Zastąpiono sztywne ograniczenie szerokości `1260px` dynamicznym kontenerem roboczym `max-w-[1800px]`, eliminując puste szare marginesy boczne na monitorach panoramicznych.
* **Dashboard 100vh bez przewijania strony (No-Scroll Viewport):**
  Zablokowano wysokość głównego pulpitu roboczego na ekranach $\ge 1024\text{px}$ (`lg:h-screen lg:overflow-hidden`). Cały pulpit analityka mieści się w jednym oknie bez przewijania paska strony.
* **Niezależny scroll kart Bento (`overflow-y-auto`):**
  Długie checklisty, notatki robocze oraz kolejki zadań przewijają się niezależnie wewnątrz swoich kafelków z minimalistycznym paskiem w stylu macOS, nie poruszając nagłówka ani pozostałych elementów ekranu.
* **Centralny, wyróżniony przycisk `+ Nowe zadanie`:**
  Przeniesiono najważniejszą akcję operacyjną z peryferii prawego rogu do strefy centralnej tuż obok pigułki nawigacyjnej, z wyraźnym kontrastem i skrótem `[ N ]`.
* **Wyrazisty logotyp Fokus Solo:**
  Powiększone logo z nowoczesną ikoną i czytelną typografią.
* **Kompaktowa lista rozwijana Pomodoro (Select):**
  Zastąpiono 5 oddzielnych przycisków rozpychających panel jedną elegancką listą rozwijaną `[ ⏱ 25 min ▾ ]` z presetami 15, 25, 45, 60, 90 minut oraz czasem własnym.
* **Czysty minimalizm i usunięcie szumu:**
  Usunięto laboratoryjne numeratory (`01 ·`, `02 ·`, `03 ·`) oraz dublujące się podpisy (`Metoda Ivy Lee...`, `Zadania zablokowane przez innych`).
* **Zakotwiczona dolna belka akcji (Sticky Action Bar):**
  Przyciski `✓ Ukończ zadanie`, `⏳ Czekam na...` oraz `Odłóż` są stale zakotwiczone w stopce karty aktywnego zadania — zawsze pod ręką niezależnie od długości kroków milowych.
* **Pełne imię i nazwisko osoby blokującej:**
  W kafelku „Czekam na odpowiedź” wyświetlane jest czytelne, pełne imię i nazwisko (np. *Tomek Kowalski*) zamiast suchych dwuliterowych inicjałów.

---

### 1.2. Wersja 4.2 (Kalendarz, Dni Robocze, Eisenhower, Instrukcja)
* **Nowa Zakładka „Kalendarz & Zasoby Czasu”:** Tygodniowy kalendarz blokowy Bento, odliczanie spotkań od budżetu ALPEN 5h oraz obsługa urlopów.
* **Inteligentny Algorytm Pilności Dni Roboczych ($D_{\text{biz}}$):** Eliminacja „pułapki poniedziałku” (zadanie na poniedziałek ma status ASAP już w piątek rano), wbudowany kalendarz polskich świąt państwowych i uwzględnianie urlopów.
* **Profesjonalne Nazewnictwo „Eisenhower”:** Zastąpienie nazwy „Macierz 2x2” standardem Eisenhowera z filtrami zleceniodawcy i kategorii.
* **Nowa Zakładka „Instrukcja”:** Baza wiedzy Bento z opisem 6 Strażników Metodyk i rytuałem dnia analityka.

---

## 2. Instrukcja Wdrożenia / Aktualizacji (Krok po Kroku)

Przejście na wersję 4.2 jest w pełni bezpieczne i nie wymaga instalacji żadnych serwerów ani bibliotek. Aplikacja zachowuje 100% zgodności z Twoimi dotychczasowymi danymi.

### Krok 1: Kopia Zapasowa (Zalecane przed każdą aktualizacją)
1. Otwórz swoją dotychczasową wersję aplikacji w przeglądarce Chrome.
2. Kliknij w prawym górnym rogu przycisk **OneDrive**.
3. Kliknij przycisk **„💾 Pobierz kopię dzienną (fokus-backup-YYYY-MM-DD.json)”** lub **„⬇ Pobierz fokus-db.json”**.
4. Zapisz plik na dysku komputera lub w bezpiecznym folderze.

### Krok 2: Umieszczenie Nowego Pliku na Komputerze Służbowym
1. Skopiuj plik [`release/Fokus.html`](./Fokus.html) na swój komputer służbowy (np. na Pulpit, do folderu dokumentów lub do folderu synchronizowanego z OneDrive).
2. Możesz zmienić nazwę pliku na dowolną (np. `Fokus.html` lub `Fokus_Solo.html`).

### Krok 3: Uruchomienie w Przeglądarce Google Chrome
1. Kliknij dwukrotnie w plik `Fokus.html` (otworzy się w domyślnej przeglądarce Google Chrome).
2. Dodaj stronę do zakładek za pomocą skrótu **`Ctrl + D`** (Windows) lub **`Cmd + D`** (macOS).
3. **Automatyczna migracja danych:**
   * Ponieważ aplikacja korzysta z bezpiecznego magazynu `LocalStorage` pod tym samym adresem, wszystkie Twoje zadania, osoby, szablony SOP oraz historia czasu **zostaną automatycznie wczytane**.
   * Aplikacja automatycznie uzupełni schemat o nową strukturę `calendarEvents`, nie modyfikując ani nie kasując żadnych Twoich wcześniejszych wpisów.

### Krok 4: Ponowne Podpięcie Folderu OneDrive (Jeśli używasz)
1. Kliknij przycisk **OneDrive** w prawym górnym rogu paska.
2. Kliknij **„Podepnij folder roboczy OneDrive”**.
3. W oknie systemowym wskaż folder, w którym znajduje się Twój plik `fokus-db.json`.
4. Wyraź zgodę na uprawnienia do zapisu plików (`Zezwól na edycję plików`).
5. Dioda przy przycisku zmieni kolor na zielony (`OneDrive ●`).

### Krok 5: Czyszczenie Pamięci Podręcznej (Gdyby przeglądarka pamiętała stary wygląd)
Jeśli podmieniłeś plik o tej samej nazwie w tej samej ścieżce, wymuś odświeżenie bez pamięci podręcznej:
* **Windows / Linux:** `Ctrl + F5` lub `Ctrl + Shift + R`
* **macOS:** `Cmd + Shift + R`

---

## 3. Podsumowanie Wymagań Technicznych

| Element | Wymaganie |
| :--- | :--- |
| **Przeglądarka** | Google Chrome (wersja 86+ ze wsparciem dla File System Access API) |
| **Zależności / Serwery** | **Brak** (0 serwerów, 0 npm w runtime, czysty HTML/CSS/JS) |
| **Zapis Danych** | Warstwa 1: Synchroniczny `LocalStorage` (0 ms opóźnienia) <br> Warstwa 2: Plik `fokus-db.json` w OneDrive przez przeglądarkę |
| **Kopia Zapasowa** | Automatyczna rotacja dzienna z zachowaniem bezpiecznej nazwy datowanej |
