# Design: Nauka Słów — tryb quizowy

**Data:** 2026-05-01  
**Projekt:** japan (Nauka Hiragany)

---

## Cel

Dodanie drugiego trybu nauki — „Nauka Słów" — obok istniejącego trybu pisania hiragany. Użytkownik widzi słowo w hiraganie i wybiera jedno z 4 tłumaczeń na polski.

---

## Architektura

Podejście: **jedna strona, dwie ukryte sekcje** (brak nowych plików HTML, brak routera).

- `index.html` — dodanie menu zakładkowego oraz sekcji `#mode-words`
- `app.js` — dodanie logiki trybu słów jako osobny blok funkcji
- `style.css` — style dla menu i przycisków odpowiedzi
- `words.js` — bez zmian

Istniejąca logika hiragany (`#mode-hiragana`) pozostaje niezmieniona.

---

## Menu nawigacyjne

- Dwie zakładki pod nagłówkiem: **Hiragana** i **Słowa**
- Styl spójny z istniejącymi `.kb-tab` (border-bottom highlight, bez przeładowania strony)
- Przełączenie zakładki:
  - ukrywa aktualny panel (`hidden`)
  - pokazuje wybrany panel
  - resetuje stan aktywnego trybu (zatrzymuje ewentualny timer)

---

## Tryb „Nauka Słów"

### Wyświetlanie pytania

- Słowo w hiraganie wyświetlone dużym tekstem (`font-family: var(--font-jp)`)
- Ten sam styl animacji wejścia co w trybie hiragany (`word-in`)
- Brak dodatkowych wskazówek — tylko hiragana

### Cztery odpowiedzi

- Układ 2×2 (grid)
- 1 poprawna odpowiedź (polskie tłumaczenie aktualnego słowa)
- 3 losowe błędne odpowiedzi z pozostałych słów w połączonej puli (`newWords + reviewSoon + reviewLater`), bez powtórzeń i bez kolizji z poprawną
- Kolejność 4 przycisków losowana przy każdym pytaniu

### Feedback po kliknięciu

- Klik zablokowany na pozostałe 3 przyciski natychmiast
- Błędna odpowiedź → przycisk czerwony (`is-wrong`)
- Poprawna odpowiedź → przycisk zielony (`is-correct`) — zawsze, niezależnie czy użytkownik kliknął ją czy nie
- Po **3 sekundach** → animacja wyjścia i załadowanie nowego słowa

### Losowanie słów

- Używa istniejącej funkcji `pickRandomWord()` (wagi: 50% newWords, 30% reviewSoon, 20% reviewLater)
- Unika powtórzenia tego samego słowa z rzędu

---

## Obsługa edge case'ów

- Jeśli pula słów ma mniej niż 4 pozycje — uzupełnij odpowiedzi losowymi duplikatami lub ogranicz do dostępnej liczby (unlikely przy obecnej bazie)
- Przełączenie zakładki w trakcie odliczania → `clearTimeout` aktywnego timera

---

## Zmiany w plikach

| Plik | Zmiana |
|------|--------|
| `index.html` | Dodanie `<nav>` z zakładkami + sekcja `#mode-words` z gridem odpowiedzi |
| `app.js` | Funkcje: `initWordsMode`, `loadWordQuiz`, `handleWordAnswer` + obsługa zakładek |
| `style.css` | `.mode-nav`, `.mode-nav__tab`, `.word-choices`, `.choice-btn`, `.choice-btn.is-correct`, `.choice-btn.is-wrong` |
