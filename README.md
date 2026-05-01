# 日本語の勉強 · Nauka Japońskiego

Aplikacja webowa do nauki japońskich znaków hiragany i słownictwa.

🔗 **[Otwórz aplikację](https://maciej86.github.io/gakusei/)**

---

## Tryby nauki

### ✍️ Pisownia
Ćwiczenie zapisywania słów w hiraganie. Aplikacja losuje słowo po polsku lub w romaji, a Ty składasz odpowiedź za pomocą klawiatury hiragany na ekranie. Po poprawnej odpowiedzi następne słowo ładuje się automatycznie po 3 sekundach.

### 🈶 Słowa
Quiz wielokrotnego wyboru. Wyświetlany jest znak w hiraganie, a Twoim zadaniem jest wybranie poprawnego tłumaczenia spośród czterech opcji. Błędna odpowiedź podświetla właściwą — kolejne słowo pojawia się automatycznie po 3 sekundach.

### 📖 Słownik
Podgląd wszystkich słów podzielonych na trzy kategorie: **Nowe słowa**, **Powtórz wkrótce** i **Powtórz później**. Każde słowo pokazane jest z tłumaczeniem polskim, zapisem romaji i hiraganą.

---

## Baza słów

Słowa podzielone są na trzy tablice w pliku `words.js`, które wpływają na częstotliwość losowania:

| Tablica | Częstotliwość |
|---------|--------------|
| `newWords` — nowe słowa | 50% |
| `reviewSoon` — do powtórzenia wkrótce | 30% |
| `reviewLater` — do powtórzenia później | 20% |

Każde słowo ma trzy pola:

```js
{ pl: "iść", romaji: "iku", hiragana: "いく" }
```

---

## Skróty klawiszowe

| Klawisz | Akcja |
|---------|-------|
| `Enter` | Sprawdź odpowiedź / następne słowo |
| `Backspace` | Usuń ostatni znak |
| `Delete` / `Escape` | Wyczyść pole odpowiedzi |

---

## Technologie

Czyste HTML, CSS i JavaScript — bez frameworków, bez bundlera, bez zależności.

---

## Struktura plików

```
index.html   — struktura strony
app.js       — logika aplikacji
style.css    — style
words.js     — baza słów
```
