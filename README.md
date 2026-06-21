# SciCalc — Scientific Calculator

A modern, professional scientific calculator built with **vanilla HTML, CSS, and
JavaScript** — no frameworks, no build step. Open `index.html` and go.

## Features

### Operations & functions
- Arithmetic: `+`, `−`, `×`, `÷`, power `^`, percent `%`
- Roots: square root `√`, cube root `∛`
- Logs: `log` (base‑10), `ln` (natural)
- Trig: `sin`, `cos`, `tan` and inverses `sin⁻¹`, `cos⁻¹`, `tan⁻¹`
- `|x|` absolute value, `x!` factorial, parentheses, decimals
- Constants: `π`, `e`
- Scientific notation (`EE`, e.g. `1.5E3`)
- Random number generator (`RND`)
- **DEG / RAD** angle-mode toggle
- Memory: `MC`, `MR`, `M+`, `M−`

### App features
- Full **keyboard support** (digits, operators, `Enter`, `Backspace`, `Esc`)
- **History panel** persisted to `localStorage` (click an entry to reuse it)
- **Copy result** button
- Live preview of the result as you type
- Robust **error handling** for invalid expressions
- Auto-scrolling display for long calculations
- `C` (clear entry), `AC` (all clear), and backspace
- **Theme switcher** (dark / light), **sound toggle**, all preferences saved

## Safe evaluation (no `eval`)

Expressions are **never** passed to `eval()` or `Function()`. Instead the app
ships a hand-written **tokenizer + recursive-descent parser** (`script.js`),
which:

- supports correct operator precedence and right-associative `^`,
- handles implicit multiplication (`2π`, `2(3)`),
- validates domains (e.g. `sqrt(-1)`, `1/0`) and reports clear errors,
- cannot execute arbitrary code, eliminating injection risk.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Markup & accessible structure |
| `styles.css` | Theming (CSS variables), glassmorphism UI, animations, responsive layout |
| `script.js`  | Safe parser, UI controller, state, persistence |

## Run

```bash
# Just open it
open index.html        # macOS
xdg-open index.html    # Linux

# …or serve locally
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `0–9 . ( ) + - * / ^ % !` | Insert |
| `Enter` / `=` | Evaluate |
| `Backspace` | Delete last token |
| `Esc` / `Delete` | All clear |
