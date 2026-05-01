'use strict';

/* =========================================================
   Dane klawiatury hiragany
   ========================================================= */
const KB_SEION = [
  ['あ','い','う','え','お'],
  ['か','き','く','け','こ'],
  ['さ','し','す','せ','そ'],
  ['た','ち','つ','て','と'],
  ['な','に','ぬ','ね','の'],
  ['は','ひ','ふ','へ','ほ'],
  ['ま','み','む','め','も'],
  ['や','' ,'ゆ','' ,'よ'],
  ['ら','り','る','れ','ろ'],
  ['わ','' ,'' ,'' ,'を'],
  ['ん','' ,'' ,'' ,'' ],
];

const KB_DAKUTEN = [
  ['が','ぎ','ぐ','げ','ご'],
  ['ざ','じ','ず','ぜ','ぞ'],
  ['だ','ぢ','づ','で','ど'],
  ['ば','び','ぶ','べ','ぼ'],
  ['ぱ','ぴ','ぷ','ぺ','ぽ'],
];

const KB_SMALL = [
  ['ぁ','ぃ','ぅ','ぇ','ぉ'],
  ['ゃ','' ,'ゅ','' ,'ょ'],
  ['っ','ゎ','' ,'' ,'' ],
];

/* =========================================================
   Stan aplikacji
   ========================================================= */
const AUTO_ADVANCE_DELAY = 1000;

let currentWord   = null;
let currentMode   = 'pl'; // 'pl' | 'romaji'
let currentInput  = '';
let isChecked     = false;
let isWrong       = false;
let scoreCorrect  = 0;
let scoreTotal    = 0;
let wordCount     = 0;
let autoAdvanceTimer = null;
let wqWordCount   = 0;
let wqCurrentWord = null;
let wqTimer       = null;
let wqAnimTimer   = null;
let cqPool        = [];
let cqCurrent     = null;
let cqCount       = 0;
let cqTimer       = null;

/* =========================================================
   Elementy DOM
   ========================================================= */
const $ = id => document.getElementById(id);

const wordText       = $('wordText');
const modeBadge      = $('modeBadge');
const wordCounter    = $('wordCounter');
const answerBox      = $('answerBox');
const answerText     = $('answerText');
const answerPlaceholder = $('answerPlaceholder');
const backspaceBtn   = $('backspaceBtn');
const feedbackLine   = $('feedbackLine');
const checkBtn       = $('checkBtn');
const hintBtn        = $('hintBtn');
const clearBtn       = $('clearBtn');
const hintCard       = $('hintCard');
const hintAnswer     = $('hintAnswer');
const scoreCorrectEl    = $('scoreCorrect');
const scoreTotalEl      = $('scoreTotal');
const wordTranslation   = $('wordTranslation');
const wqWordText  = $('wq-wordText');
const wqCounter   = $('wq-counter');
const wqChoices   = [...document.querySelectorAll('.choice-btn')];

const cqRomaji      = $('cq-romaji');
const cqCounter     = $('cq-counter');
const cqChoices     = [...document.querySelectorAll('.char-btn')];
const charsSetup    = $('chars-setup');
const charsQuiz          = $('chars-quiz');
const charsStartBtn      = $('chars-start-btn');
const cqChangeBtn        = $('cq-change-btn');
const charsSelector      = $('chars-selector');
const charsSelectedCount = $('chars-selected-count');
const charsAccordion = $('charsAccordion');

const ALL_WORDS = [...newWords, ...reviewSoon, ...reviewLater];

function buildDictTable(words, containerId) {
  const container = $(containerId);
  container.innerHTML = `
    <div class="dict-row dict-row--header">
      <div class="dict-table__header">Polski</div>
      <div class="dict-table__header">Romaji</div>
      <div class="dict-table__header">Hiragana</div>
    </div>
    ${words.map(w => `
      <div class="dict-row">
        <div class="dict-table__cell">${w.pl}</div>
        <div class="dict-table__cell">${w.romaji}</div>
        <div class="dict-table__cell dict-table__cell--jp">${w.hiragana}</div>
      </div>
    `).join('')}
  `;
}

/* =========================================================
   Budowanie klawiatury
   ========================================================= */
function buildKeyboard(rows, containerId) {
  const grid = $(containerId);
  rows.forEach(row => {
    row.forEach(char => {
      const btn = document.createElement('button');
      if (char === '') {
        btn.className = 'kana-key kana-key--empty';
        btn.setAttribute('aria-hidden', 'true');
      } else {
        btn.className = 'kana-key';
        btn.textContent = char;
        btn.setAttribute('aria-label', char);
        btn.addEventListener('click', () => handleKanaInput(char));
      }
      grid.appendChild(btn);
    });
  });
}

/* =========================================================
   Obsługa wejścia
   ========================================================= */
function resetWrongState() {
  isChecked = false;
  isWrong   = false;
  answerBox.classList.remove('is-wrong');
  feedbackLine.className   = 'feedback-line';
  feedbackLine.textContent = '';
}

function handleKanaInput(char) {
  if (isChecked && !isWrong) return;
  if (isWrong) resetWrongState();
  currentInput += char;
  refreshAnswerDisplay();
}

function deleteLastChar() {
  if ((isChecked && !isWrong) || currentInput.length === 0) return;
  if (isWrong) resetWrongState();
  currentInput = [...currentInput].slice(0, -1).join('');
  refreshAnswerDisplay();
}

function clearInput() {
  if (isChecked && !isWrong) return;
  if (isWrong) resetWrongState();
  currentInput = '';
  refreshAnswerDisplay();
  answerBox.classList.remove('is-correct', 'is-wrong');
}

function refreshAnswerDisplay() {
  answerText.textContent = currentInput;
  if (currentInput === '') {
    answerPlaceholder.classList.remove('hidden');
  } else {
    answerPlaceholder.classList.add('hidden');
  }
}

/* =========================================================
   Ładowanie nowego słowa
   ========================================================= */
function pickRandomWord() {
  const r = Math.random();
  const pool = r < 0.5 ? newWords : r < 0.8 ? reviewSoon : reviewLater;
  return pool[Math.floor(Math.random() * pool.length)];
}

function loadWordQuiz() {
  clearTimeout(wqTimer);

  const prev = wqCurrentWord;
  let word = pickRandomWord();
  if (ALL_WORDS.length > 1) {
    while (word === prev) word = pickRandomWord();
  }
  wqCurrentWord = word;
  wqWordCount++;

  wqCounter.textContent = `Słowo #${wqWordCount}`;

  clearTimeout(wqAnimTimer);
  wqWordText.classList.add('is-animating');
  wqAnimTimer = setTimeout(() => {
    wqWordText.textContent = word.hiragana;
    wqWordText.classList.remove('is-animating');
    wqWordText.classList.add('word-in');
    setTimeout(() => wqWordText.classList.remove('word-in'), 400);
  }, 200);

  const wrongPool = ALL_WORDS.filter(w => w !== word)
    .sort(() => Math.random() - 0.5);
  const wrongs = wrongPool.slice(0, Math.min(3, wrongPool.length));

  const options = [word, ...wrongs].sort(() => Math.random() - 0.5);

  wqChoices.forEach((btn, i) => {
    btn.textContent = options[i].pl;
    btn.className = 'choice-btn';
    btn.disabled = false;
    btn.dataset.correct = options[i] === word ? 'true' : 'false';
  });
}

function handleWordAnswer(btn) {
  wqChoices.forEach(b => { b.disabled = true; });

  scoreTotal++;
  scoreTotalEl.textContent = scoreTotal;

  if (btn.dataset.correct === 'true') {
    btn.classList.add('is-correct');
    scoreCorrect++;
    scoreCorrectEl.textContent = scoreCorrect;
  } else {
    btn.classList.add('is-wrong');
    wqChoices.find(b => b.dataset.correct === 'true').classList.add('is-correct');
  }

  wqTimer = setTimeout(loadWordQuiz, AUTO_ADVANCE_DELAY);
}

function loadWord() {
  clearTimeout(autoAdvanceTimer);
  const prev = currentWord;
  let next = pickRandomWord();
  if (ALL_WORDS.length > 1) {
    while (next === prev) next = pickRandomWord();
  }

  currentWord  = next;
  currentMode  = Math.random() < 0.5 ? 'pl' : 'romaji';
  currentInput = '';
  isChecked    = false;
  isWrong      = false;
  wordCount++;

  // Animacja zmiany słowa
  wordText.classList.add('is-animating');
  setTimeout(() => {
    wordText.textContent = currentMode === 'pl' ? currentWord.pl : currentWord.romaji;
    wordText.className   = 'prompt-word__text' + (currentMode === 'romaji' ? ' is-jp' : '');
    wordText.classList.add('word-in');
    setTimeout(() => wordText.classList.remove('word-in'), 400);
  }, 200);

  modeBadge.textContent = currentMode === 'pl' ? 'Polski → Hiragana' : 'Romaji → Hiragana';
  wordCounter.textContent = `Słowo #${wordCount}`;

  // Reset pola odpowiedzi
  answerBox.classList.remove('is-correct', 'is-wrong');
  feedbackLine.className = 'feedback-line';
  feedbackLine.textContent = '';

  hintCard.hidden  = true;
  wordTranslation.classList.add('hidden');

  refreshAnswerDisplay();
}

/* =========================================================
   Sprawdzanie odpowiedzi
   ========================================================= */
function checkAnswer() {
  if (isChecked) return;
  if (currentInput.trim() === '') {
    feedbackLine.className   = 'feedback-line is-wrong';
    feedbackLine.textContent = 'Wpisz odpowiedź, zanim sprawdzisz!';
    return;
  }

  isChecked = true;
  scoreTotal++;
  scoreTotalEl.textContent = scoreTotal;

  const correct = currentInput.trim() === currentWord.hiragana;

  if (correct) {
    isWrong = false;
    scoreCorrect++;
    scoreCorrectEl.textContent = scoreCorrect;
    answerBox.classList.add('is-correct');
    feedbackLine.className   = 'feedback-line is-correct';
    feedbackLine.textContent = getCorrectMessage();
    const other = currentWord.pl;
    wordTranslation.textContent = `(${other})`;
    wordTranslation.classList.remove('hidden');
    autoAdvanceTimer = setTimeout(loadWord, AUTO_ADVANCE_DELAY);
  } else {
    isWrong = true;
    answerBox.classList.add('is-wrong');
    feedbackLine.className   = 'feedback-line is-wrong';
    feedbackLine.textContent = 'Niepoprawnie – sprawdź poprawny zapis poniżej.';
    hintAnswer.textContent = currentWord.hiragana;
    hintCard.hidden = false;
  }

}

function getCorrectMessage() {
  const msgs = [
    'Świetnie! Tak trzymać!',
    'Doskonale! Brawo!',
    'Poprawnie! Znakomita robota!',
    'Właśnie tak! Pięknie!',
    '正解！ Idealnie!',
  ];
  return msgs[Math.floor(Math.random() * msgs.length)];
}

/* =========================================================
   Przełączanie zakładek klawiatury
   ========================================================= */
document.querySelectorAll('.kb-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.kb-tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');

    const name = tab.dataset.tab;
    document.querySelectorAll('.kb-grid').forEach(g => g.classList.add('kb-grid--hidden'));
    $(`kb-${name}`).classList.remove('kb-grid--hidden');
  });
});

/* =========================================================
   Zdarzenia przycisków
   ========================================================= */
checkBtn.addEventListener('click', checkAnswer);
hintBtn.addEventListener('click', () => {
  hintAnswer.textContent = currentWord.hiragana;
  hintCard.hidden = false;
});
clearBtn.addEventListener('click', clearInput);
backspaceBtn.addEventListener('click', deleteLastChar);

wqChoices.forEach(btn => btn.addEventListener('click', () => handleWordAnswer(btn)));

/* =========================================================
   Tryb: Znaki
   ========================================================= */
const KANA_LS_KEY = 'charsSelection';

const KANA_GROUPS = [
  { key: 'seion',   label: '清音 · Hiragana', data: KANA_SEION },
  { key: 'dakuten', label: '濁音 · Dakuten',  data: KANA_DAKUTEN },
];

function buildCharsSelector(savedSet) {
  charsSelector.innerHTML = '';
  KANA_GROUPS.forEach(group => {
    const section = document.createElement('div');
    section.className = 'kana-group';

    const header = document.createElement('div');
    header.className = 'kana-group__header';

    const title = document.createElement('span');
    title.className = 'kana-group__title';
    title.textContent = group.label;

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'kana-group__toggle';

    const grid = document.createElement('div');
    grid.className = 'kana-select-grid';

    group.data.forEach(kana => {
      const btn = document.createElement('button');
      btn.className = 'kana-sel-btn' + (savedSet.has(kana.h) ? ' selected' : '');
      btn.dataset.h = kana.h;
      btn.innerHTML = `<span class="kana-sel-btn__h">${kana.h}</span><span class="kana-sel-btn__r">${kana.r}</span>`;
      btn.addEventListener('click', () => {
        btn.classList.toggle('selected');
        updateCharsCount();
      });
      grid.appendChild(btn);
    });

    const allSelected = () => group.data.every(k => savedSet.has(k.h) ||
      grid.querySelector(`[data-h="${k.h}"]`)?.classList.contains('selected'));

    toggleBtn.textContent = 'Zaznacz wszystkie';
    toggleBtn.addEventListener('click', () => {
      const btns = [...grid.querySelectorAll('.kana-sel-btn')];
      const anyUnselected = btns.some(b => !b.classList.contains('selected'));
      btns.forEach(b => b.classList.toggle('selected', anyUnselected));
      toggleBtn.textContent = anyUnselected ? 'Odznacz wszystkie' : 'Zaznacz wszystkie';
      updateCharsCount();
    });

    header.appendChild(title);
    header.appendChild(toggleBtn);
    section.appendChild(header);
    section.appendChild(grid);
    charsSelector.appendChild(section);
  });
  updateCharsCount();
}

function getSelectedKana() {
  return [...charsSelector.querySelectorAll('.kana-sel-btn.selected')]
    .map(btn => {
      const h = btn.dataset.h;
      return KANA_SEION.find(k => k.h === h) || KANA_DAKUTEN.find(k => k.h === h);
    })
    .filter(Boolean);
}

function updateCharsCount() {
  const count = charsSelector.querySelectorAll('.kana-sel-btn.selected').length;
  charsSelectedCount.textContent = `Wybrano: ${count}`;
  charsStartBtn.disabled = count < 2;
}

function getSavedPool() {
  try {
    const saved = localStorage.getItem(KANA_LS_KEY);
    if (!saved) return null;
    const arr = JSON.parse(saved);
    if (!Array.isArray(arr) || arr.length < 2) return null;
    const set = new Set(arr);
    const pool = [...KANA_SEION, ...KANA_DAKUTEN].filter(k => set.has(k.h));
    return pool.length >= 2 ? pool : null;
  } catch (_) { return null; }
}

function openCharsSetup() {
  const savedSet = new Set((getSavedPool() || []).map(k => k.h));
  buildCharsSelector(savedSet);
  charsSetup.classList.remove('hidden');
  charsQuiz.classList.add('hidden');
}

function startCharsQuiz(pool) {
  localStorage.setItem(KANA_LS_KEY, JSON.stringify(pool.map(k => k.h)));
  cqPool    = pool;
  cqCount   = 0;
  cqCurrent = null;
  charsSetup.classList.add('hidden');
  charsQuiz.classList.remove('hidden');
  loadCharQuiz();
}

function loadCharQuiz() {
  clearTimeout(cqTimer);
  const prev = cqCurrent;
  let next = cqPool[Math.floor(Math.random() * cqPool.length)];
  if (cqPool.length > 1) {
    while (next === prev) next = cqPool[Math.floor(Math.random() * cqPool.length)];
  }
  cqCurrent = next;
  cqCount++;
  cqCounter.textContent = `Znak #${cqCount}`;

  cqRomaji.classList.add('is-animating');
  setTimeout(() => {
    cqRomaji.textContent = next.r;
    cqRomaji.classList.remove('is-animating');
    cqRomaji.classList.add('word-in');
    setTimeout(() => cqRomaji.classList.remove('word-in'), 400);
  }, 200);

  const wrongPool = cqPool.filter(k => k !== next).sort(() => Math.random() - 0.5);
  const wrongs    = wrongPool.slice(0, Math.min(7, wrongPool.length));
  const options   = [next, ...wrongs].sort(() => Math.random() - 0.5);

  cqChoices.forEach((btn, i) => {
    btn.textContent = options[i] ? options[i].h : '';
    btn.className   = 'char-btn';
    btn.disabled    = !options[i];
    btn.dataset.correct = options[i] === next ? 'true' : 'false';
  });
}

function handleCharAnswer(btn) {
  cqChoices.forEach(b => { b.disabled = true; });

  scoreTotal++;
  scoreTotalEl.textContent = scoreTotal;

  if (btn.dataset.correct === 'true') {
    btn.classList.add('is-correct');
    scoreCorrect++;
    scoreCorrectEl.textContent = scoreCorrect;
  } else {
    btn.classList.add('is-wrong');
    cqChoices.find(b => b.dataset.correct === 'true').classList.add('is-correct');
  }

  cqTimer = setTimeout(loadCharQuiz, AUTO_ADVANCE_DELAY);
}

function initCharsMode() {
  const pool = getSavedPool();

  if (pool) {
    cqPool    = pool;
    cqCount   = 0;
    cqCurrent = null;

    charsSetup.classList.add('hidden');
    charsQuiz.classList.remove('hidden');

    charsAccordion.classList.remove('is-open');
    cqChangeBtn.textContent = 'Zmień znaki ↩';

    loadCharQuiz();
  } else {
    openCharsSetup();

    // 🔥 KLUCZOWE: otwórz selector
    charsAccordion.classList.add('is-open');
    cqChangeBtn.textContent = 'Ukryj znaki ↩';
  }
}

charsStartBtn.addEventListener('click', () => {
  const pool = getSelectedKana();

  if (pool.length >= 2) {
    startCharsQuiz(pool);

    charsAccordion.classList.remove('is-open');
    cqChangeBtn.textContent = 'Zmień znaki ↩';
  }
});

cqChangeBtn.addEventListener('click', () => {
  clearTimeout(cqTimer);
  openCharsSetup();
  const isOpen = charsAccordion.classList.toggle('is-open');
  cqChangeBtn.textContent = isOpen ? 'Ukryj znaki ↩' : 'Zmień znaki ↩';
});

cqChoices.forEach(btn => btn.addEventListener('click', () => handleCharAnswer(btn)));

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
    clearTimeout(wqAnimTimer);
    clearTimeout(cqTimer);

    if (mode === 'words') loadWordQuiz();
    if (mode === 'chars') initCharsMode();
    if (mode === 'dict') {
      buildDictTable(newWords,    'dict-newWords');
      buildDictTable(reviewSoon,  'dict-reviewSoon');
      buildDictTable(reviewLater, 'dict-reviewLater');
    }
  });
});

/* =========================================================
   Skróty klawiszowe
   ========================================================= */
document.addEventListener('keydown', e => {
  const activePanel = document.querySelector('.mode-panel:not(.hidden)');
  if (!activePanel || activePanel.id !== 'mode-hiragana') return;
  if (e.key === 'Backspace') {
    e.preventDefault();
    deleteLastChar();
  }
  if (e.key === 'Enter') {
    e.preventDefault();
    if (!isChecked) {
      checkAnswer();
    } else {
      loadWord();
    }
  }
  if ((e.key === 'Delete' || e.key === 'Escape') && !isChecked) {
    clearInput();
  }
});

/* =========================================================
   Inicjalizacja
   ========================================================= */
buildKeyboard(KB_SEION,   'kb-seion');
buildKeyboard(KB_DAKUTEN, 'kb-dakuten');
buildKeyboard(KB_SMALL,   'kb-small');
loadWord();
