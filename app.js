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

const ALL_WORDS = [...newWords, ...reviewSoon, ...reviewLater];

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

    if (mode === 'words') loadWordQuiz();
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
