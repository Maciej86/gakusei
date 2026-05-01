# Nauka Słów — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dodanie trybu quizowego „Nauka Słów" (hiragana → 4 odpowiedzi PL) oraz automatycznego przechodzenia do następnego słowa po 3s w trybie hiragany.

**Architecture:** Jedna strona HTML z dwoma ukrytymi panelami przełączanymi zakładkami. Istniejący kod hiragany jest modyfikowany minimalnie (usunięcie przycisku, dodanie auto-advance). Logika słów to osobny blok funkcji w app.js.

**Tech Stack:** Vanilla JS (ES6), HTML5, CSS3 — bez frameworków, bez bundlera.

---

## Mapa plików

| Plik | Rola zmian |
|------|-----------|
| `index.html` | Usunięcie `#nextBtn`; dodanie `<nav>` z zakładkami; dodanie sekcji `#mode-words` z gridem 4 odpowiedzi |
| `app.js` | Usunięcie logiki `nextBtn`; dodanie auto-advance (3s) po poprawnej odpowiedzi w trybie hiragany; dodanie obsługi zakładek; dodanie `loadWordQuiz()`, `handleWordAnswer()` |
| `style.css` | Style dla `.mode-nav`, `.mode-nav__tab`, `.word-choices`, `.choice-btn` i stanów `.is-correct`/`.is-wrong` |

---

## Task 1: Usunięcie przycisku „Następne słowo" i auto-advance w trybie hiragany

**Files:**
- Modify: `index.html`
- Modify: `app.js`

- [ ] **Krok 1: Usuń przycisk z HTML**

W `index.html` usuń linię:
```html
<button class="btn btn--next"   id="nextBtn"  disabled>Następne słowo →</button>
```

- [ ] **Krok 2: Usuń referencje do nextBtn z app.js**

Usuń linię deklaracji:
```js
const nextBtn        = $('nextBtn');
```

Usuń oba miejsca użycia:
```js
nextBtn.addEventListener('click', loadWord);
```
oraz (w `loadWord`):
```js
nextBtn.disabled = true;
```
oraz (w `checkAnswer`):
```js
nextBtn.disabled = false;
```

- [ ] **Krok 3: Dodaj zmienną dla timera i auto-advance po poprawnej odpowiedzi**

Na początku bloku stanu aplikacji (przy innych `let`) dodaj:
```js
let autoAdvanceTimer = null;
```

W `checkAnswer`, w bloku `if (correct)`, po linii `feedbackLine.textContent = getCorrectMessage();` dodaj:
```js
autoAdvanceTimer = setTimeout(loadWord, 3000);
```

- [ ] **Krok 4: Wyczyść timer w loadWord**

Na początku funkcji `loadWord`, przed `const prev = currentWord;` dodaj:
```js
clearTimeout(autoAdvanceTimer);
```

- [ ] **Krok 5: Weryfikacja w przeglądarce**

Otwórz `index.html`, wpisz poprawną odpowiedź, kliknij Sprawdź — po 3 sekundach powinno załadować się następne słowo bez klikania. Przycisk „Następne słowo" nie powinien istnieć.

- [ ] **Krok 6: Commit**

```bash
git add index.html app.js
git commit -m "feat: auto-advance after correct answer in hiragana mode, remove next button"
```

---

## Task 2: Nawigacja zakładkowa (HTML + CSS)

**Files:**
- Modify: `index.html`
- Modify: `style.css`

- [ ] **Krok 1: Dodaj nav do HTML**

Bezpośrednio po `</header>` (przed `<main class="main">`) wstaw:
```html
<nav class="mode-nav" role="tablist" aria-label="Tryb nauki">
  <button class="mode-nav__tab active" data-mode="hiragana" role="tab" aria-selected="true">Hiragana</button>
  <button class="mode-nav__tab" data-mode="words" role="tab" aria-selected="false">Słowa</button>
</nav>
```

- [ ] **Krok 2: Opakuj istniejący quiz-card w panel hiragany**

Opakuj `<div class="quiz-card" id="quizCard">` i `</div>` końcowy (razem z hint-card) w:
```html
<div id="mode-hiragana" class="mode-panel">
  <!-- istniejąca zawartość main -->
</div>
```

Cała zawartość `<main>` powinna wyglądać tak:
```html
<main class="main">
  <div id="mode-hiragana" class="mode-panel">
    <div class="quiz-card" id="quizCard">
      <!-- … istniejąca zawartość … -->
    </div>
    <div class="hint-card" id="hintCard" hidden>
      <p class="hint-card__label">Poprawna odpowiedź</p>
      <p class="hint-card__answer" id="hintAnswer"></p>
    </div>
  </div>

  <div id="mode-words" class="mode-panel hidden">
    <!-- wypełnione w Task 3 -->
  </div>
</main>
```

- [ ] **Krok 3: Dodaj style nawigacji do style.css**

Na końcu pliku (przed lub po ostatnim bloku) dodaj:
```css
/* =========================================================
   Nawigacja trybów
   ========================================================= */
.mode-nav {
  display: flex;
  justify-content: center;
  gap: 0;
  border-bottom: 2px solid var(--border, rgba(255,255,255,.1));
  margin-bottom: 0;
}

.mode-nav__tab {
  background: none;
  border: none;
  padding: 12px 32px;
  font-family: var(--font-body, sans-serif);
  font-size: 15px;
  font-weight: 500;
  color: var(--text-2, #888);
  cursor: pointer;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  transition: color .2s, border-color .2s;
}

.mode-nav__tab:hover { color: var(--text-1, #fff); }

.mode-nav__tab.active {
  color: var(--text-1, #fff);
  border-bottom-color: var(--accent, #e85d5d);
}

/* =========================================================
   Panele trybów
   ========================================================= */
.mode-panel.hidden { display: none; }
```

- [ ] **Krok 4: Weryfikacja**

Otwórz przeglądarkę — powinna pojawić się nawigacja z zakładkami „Hiragana" i „Słowa". Zakładka Hiragana jest aktywna, panel hiragany widoczny.

- [ ] **Krok 5: Commit**

```bash
git add index.html style.css
git commit -m "feat: add mode navigation tabs (hiragana / words)"
```

---

## Task 3: HTML panelu „Nauka Słów"

**Files:**
- Modify: `index.html`

- [ ] **Krok 1: Wypełnij sekcję #mode-words**

Zastąp komentarz `<!-- wypełnione w Task 3 -->` w `#mode-words`:
```html
<div class="quiz-card">

  <div class="quiz-card__top">
    <span class="word-counter" id="wq-counter"></span>
  </div>

  <section class="prompt-section">
    <p class="section-label">Co znaczy to słowo?</p>
    <div class="prompt-word" id="wq-promptWord">
      <span class="prompt-word__text is-jp" id="wq-wordText"></span>
    </div>
  </section>

  <section class="word-choices" id="wq-choices">
    <button class="choice-btn" data-index="0"></button>
    <button class="choice-btn" data-index="1"></button>
    <button class="choice-btn" data-index="2"></button>
    <button class="choice-btn" data-index="3"></button>
  </section>

</div>
```

- [ ] **Krok 2: Weryfikacja**

Struktura HTML istnieje (niewidoczna — panel jest hidden). Sprawdź w DevTools że elementy `#wq-wordText` i `.choice-btn` × 4 są w DOM.

- [ ] **Krok 3: Commit**

```bash
git add index.html
git commit -m "feat: add words quiz HTML panel"
```

---

## Task 4: Style panelu słów

**Files:**
- Modify: `style.css`

- [ ] **Krok 1: Dodaj style do style.css**

Na końcu pliku dodaj:
```css
/* =========================================================
   Tryb: Nauka Słów
   ========================================================= */
.word-choices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 8px 0 4px;
}

.choice-btn {
  padding: 16px 12px;
  border-radius: 12px;
  border: 2px solid var(--border, rgba(255,255,255,.12));
  background: var(--surface, rgba(255,255,255,.05));
  color: var(--text-1, #fff);
  font-family: var(--font-body, sans-serif);
  font-size: clamp(14px, 2.2vw, 17px);
  font-weight: 400;
  cursor: pointer;
  transition: background .15s, border-color .15s, transform .1s;
  text-align: center;
  line-height: 1.35;
}

.choice-btn:hover:not(:disabled) {
  background: var(--surface-hover, rgba(255,255,255,.1));
  border-color: var(--accent, #e85d5d);
}

.choice-btn:disabled { cursor: default; opacity: .7; }

.choice-btn.is-correct {
  background: rgba(52, 199, 89, .18);
  border-color: #34c759;
  color: #34c759;
  font-weight: 600;
  opacity: 1;
}

.choice-btn.is-wrong {
  background: rgba(255, 59, 48, .18);
  border-color: #ff3b30;
  color: #ff3b30;
  opacity: 1;
}
```

- [ ] **Krok 2: Weryfikacja**

Tymczasowo w DevTools usuń klasę `hidden` z `#mode-words` — powinny być widoczne 4 przyciski w układzie 2×2 z odpowiednim stylem.

- [ ] **Krok 3: Commit**

```bash
git add style.css
git commit -m "feat: add word choices CSS styles"
```

---

## Task 5: Logika JS — tryb słów + przełączanie zakładek

**Files:**
- Modify: `app.js`

- [ ] **Krok 1: Dodaj referencje DOM dla trybu słów**

Po bloku referencji DOM (po linii `const wordTranslation = ...`) dodaj:
```js
const wqWordText  = $('wq-wordText');
const wqCounter   = $('wq-counter');
const wqChoices   = [...document.querySelectorAll('.choice-btn')];
```

- [ ] **Krok 2: Dodaj zmienną stanu i pełną pulę słów**

W bloku stanu aplikacji (przy innych `let`) dodaj:
```js
let wqWordCount    = 0;
let wqCurrentWord  = null;
let wqTimer        = null;
```

Po deklaracjach stanu dodaj stałą puli:
```js
const ALL_WORDS = [...newWords, ...reviewSoon, ...reviewLater];
```

- [ ] **Krok 3: Dodaj funkcję loadWordQuiz**

Po funkcji `pickRandomWord` dodaj:
```js
function loadWordQuiz() {
  clearTimeout(wqTimer);

  const prev = wqCurrentWord;
  let word;
  do {
    word = pickRandomWord();
  } while (word === prev);
  wqCurrentWord = word;
  wqWordCount++;

  wqCounter.textContent = `Słowo #${wqWordCount}`;

  wqWordText.classList.add('is-animating');
  setTimeout(() => {
    wqWordText.textContent = word.hiragana;
    wqWordText.classList.remove('is-animating');
    wqWordText.classList.add('word-in');
    setTimeout(() => wqWordText.classList.remove('word-in'), 400);
  }, 200);

  const wrongPool = ALL_WORDS.filter(w => w !== word);
  const wrongs = [];
  while (wrongs.length < 3) {
    const pick = wrongPool[Math.floor(Math.random() * wrongPool.length)];
    if (!wrongs.includes(pick)) wrongs.push(pick);
  }

  const options = [word, ...wrongs].sort(() => Math.random() - 0.5);

  wqChoices.forEach((btn, i) => {
    btn.textContent = options[i].pl;
    btn.className = 'choice-btn';
    btn.disabled = false;
    btn.dataset.correct = options[i] === word ? 'true' : 'false';
  });
}
```

- [ ] **Krok 4: Dodaj funkcję handleWordAnswer**

Po `loadWordQuiz` dodaj:
```js
function handleWordAnswer(btn) {
  wqChoices.forEach(b => { b.disabled = true; });

  if (btn.dataset.correct === 'true') {
    btn.classList.add('is-correct');
  } else {
    btn.classList.add('is-wrong');
    wqChoices.find(b => b.dataset.correct === 'true').classList.add('is-correct');
  }

  wqTimer = setTimeout(loadWordQuiz, 3000);
}
```

- [ ] **Krok 5: Podepnij handleWordAnswer do przycisków**

Po inicjalizacji klawiatury (po linii `buildKeyboard(KB_SMALL, 'kb-small');`) dodaj:
```js
wqChoices.forEach(btn => btn.addEventListener('click', () => handleWordAnswer(btn)));
```

- [ ] **Krok 6: Dodaj obsługę zakładek**

Po linii z `wqChoices.forEach(...)` dodaj:
```js
document.querySelectorAll('.mode-nav__tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.mode-nav__tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');

    const mode = tab.dataset.mode;
    document.querySelectorAll('.mode-panel').forEach(p => p.classList.add('hidden'));
    document.getElementById(`mode-${mode}`).classList.remove('hidden');

    clearTimeout(autoAdvanceTimer);
    clearTimeout(wqTimer);

    if (mode === 'words') loadWordQuiz();
  });
});
```

- [ ] **Krok 7: Weryfikacja w przeglądarce**

1. Otwórz stronę — zakładka Hiragana aktywna, quiz działa, po poprawnej odpowiedzi auto-advance po 3s.
2. Kliknij zakładkę „Słowa" — pojawia się hiragana + 4 przyciski z polskimi tłumaczeniami.
3. Kliknij poprawną odpowiedź — zielona, po 3s nowe słowo.
4. Kliknij błędną odpowiedź — czerwona + poprawna zielona, po 3s nowe słowo.
5. Przełącz zakładkę w trakcie odliczania — timer się resetuje.

- [ ] **Krok 8: Commit**

```bash
git add app.js
git commit -m "feat: add words quiz mode with 4-choice answers and tab switching"
```
