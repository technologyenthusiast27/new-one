/* ============================================================
   Scientific Calculator — script.js
   ------------------------------------------------------------
   Highlights:
   - SAFE expression evaluation: a hand-written tokenizer +
     recursive-descent parser. NO eval() / Function() is used,
     so arbitrary code injection is impossible.
   - Features: trig (+inverse), logs, roots, powers, factorial,
     percent, constants (pi, e), scientific notation, abs,
     random, memory (MC/MR/M+/M-), DEG/RAD, history (localStorage),
     keyboard support, copy, themes, sound.
   ============================================================ */

"use strict";

/* ============================================================
   1. SAFE EXPRESSION PARSER
   ============================================================
   Grammar (lowest → highest precedence):

     expression := addition
     addition   := multiplication (('+'|'-') multiplication)*
     multiplication := unary (('*'|'/') unary | implicit-mult)*
     unary      := ('+'|'-') unary | power
     power      := scinot ('^' unary)?              // right assoc
     scinot     := postfix ('E' ('+'|'-')? digits)? // ×10ˣ
     postfix    := primary ('!' | '%')*
     primary    := number | constant
                 | funcName '(' expression ')'
                 | '(' expression ')'
   ============================================================ */

/** Angle mode shared with the trig functions ("deg" or "rad"). */
let angleMode = "deg";

const CONSTANTS = {
  pi: Math.PI,
  e: Math.E,
};

/** Convert to radians if we are in degree mode. */
const toRad = (x) => (angleMode === "deg" ? (x * Math.PI) / 180 : x);
/** Convert a radian result back to degrees if in degree mode. */
const fromRad = (x) => (angleMode === "deg" ? (x * 180) / Math.PI : x);

/** Factorial supporting non-negative integers (and via gamma-free guard). */
function factorial(n) {
  if (n < 0 || !Number.isInteger(n)) {
    throw new Error("Factorial needs a non-negative integer");
  }
  if (n > 170) throw new Error("Factorial too large"); // overflow → Infinity
  let acc = 1;
  for (let i = 2; i <= n; i++) acc *= i;
  return acc;
}

/** Supported single-argument functions. */
const FUNCTIONS = {
  sin:  (x) => Math.sin(toRad(x)),
  cos:  (x) => Math.cos(toRad(x)),
  tan:  (x) => Math.tan(toRad(x)),
  asin: (x) => fromRad(Math.asin(x)),
  acos: (x) => fromRad(Math.acos(x)),
  atan: (x) => fromRad(Math.atan(x)),
  log:  (x) => Math.log10(x),
  ln:   (x) => Math.log(x),
  sqrt: (x) => Math.sqrt(x),
  cbrt: (x) => Math.cbrt(x),
  abs:  (x) => Math.abs(x),
};

/* ---------- Tokenizer ---------- */

const TokenType = {
  NUMBER: "NUMBER",
  IDENT: "IDENT", // function or constant name
  OP: "OP",       // + - * / ^ ! %
  LPAREN: "LPAREN",
  RPAREN: "RPAREN",
  SCI: "SCI",     // E (scientific notation)
};

function tokenize(input) {
  const tokens = [];
  let i = 0;
  const isDigit = (c) => c >= "0" && c <= "9";
  const isAlpha = (c) => (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");

  while (i < input.length) {
    const c = input[i];

    // Whitespace
    if (c === " " || c === "\t") { i++; continue; }

    // Numbers: digits with optional single decimal point
    if (isDigit(c) || (c === "." && isDigit(input[i + 1]))) {
      let num = "";
      let dotSeen = false;
      while (i < input.length && (isDigit(input[i]) || input[i] === ".")) {
        if (input[i] === ".") {
          if (dotSeen) throw new Error("Malformed number");
          dotSeen = true;
        }
        num += input[i++];
      }
      tokens.push({ type: TokenType.NUMBER, value: parseFloat(num) });
      continue;
    }

    // Scientific notation marker (uppercase E only; lowercase e = Euler)
    if (c === "E") {
      tokens.push({ type: TokenType.SCI });
      i++;
      continue;
    }

    // Identifiers (function names / constants)
    if (isAlpha(c)) {
      let name = "";
      while (i < input.length && (isAlpha(input[i]) || isDigit(input[i]))) {
        name += input[i++];
      }
      tokens.push({ type: TokenType.IDENT, value: name });
      continue;
    }

    // Operators & parentheses
    if ("+-*/^!%".includes(c)) { tokens.push({ type: TokenType.OP, value: c }); i++; continue; }
    if (c === "(") { tokens.push({ type: TokenType.LPAREN }); i++; continue; }
    if (c === ")") { tokens.push({ type: TokenType.RPAREN }); i++; continue; }

    throw new Error(`Unexpected character: "${c}"`);
  }

  return tokens;
}

/* ---------- Recursive-descent parser / evaluator ---------- */

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek() { return this.tokens[this.pos]; }
  next() { return this.tokens[this.pos++]; }
  expect(type) {
    const t = this.next();
    if (!t || t.type !== type) throw new Error("Mismatched parentheses or syntax");
    return t;
  }

  /** Entry point. */
  parse() {
    const value = this.parseAddition();
    if (this.pos < this.tokens.length) throw new Error("Unexpected trailing input");
    return value;
  }

  parseAddition() {
    let left = this.parseMultiplication();
    while (this.peek() && this.peek().type === TokenType.OP &&
           (this.peek().value === "+" || this.peek().value === "-")) {
      const op = this.next().value;
      const right = this.parseMultiplication();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  parseMultiplication() {
    let left = this.parseUnary();
    while (this.peek()) {
      const t = this.peek();
      if (t.type === TokenType.OP && (t.value === "*" || t.value === "/")) {
        const op = this.next().value;
        const right = this.parseUnary();
        if (op === "/" && right === 0) throw new Error("Division by zero");
        left = op === "*" ? left * right : left / right;
      } else if (
        // Implicit multiplication: 2(3), 2pi, (1)(2), 3sin(...)
        t.type === TokenType.NUMBER ||
        t.type === TokenType.IDENT ||
        t.type === TokenType.LPAREN
      ) {
        const right = this.parseUnary();
        left = left * right;
      } else {
        break;
      }
    }
    return left;
  }

  parseUnary() {
    const t = this.peek();
    if (t && t.type === TokenType.OP && (t.value === "+" || t.value === "-")) {
      const op = this.next().value;
      const val = this.parseUnary();
      return op === "-" ? -val : val;
    }
    return this.parsePower();
  }

  parsePower() {
    const base = this.parseSciNotation();
    if (this.peek() && this.peek().type === TokenType.OP && this.peek().value === "^") {
      this.next();
      const exponent = this.parseUnary(); // right-associative
      return Math.pow(base, exponent);
    }
    return base;
  }

  parseSciNotation() {
    let value = this.parsePostfix();
    if (this.peek() && this.peek().type === TokenType.SCI) {
      this.next();
      // Optional sign then a plain number exponent
      let sign = 1;
      if (this.peek() && this.peek().type === TokenType.OP &&
          (this.peek().value === "+" || this.peek().value === "-")) {
        if (this.next().value === "-") sign = -1;
      }
      const exp = this.expect(TokenType.NUMBER).value;
      value = value * Math.pow(10, sign * exp);
    }
    return value;
  }

  parsePostfix() {
    let value = this.parsePrimary();
    while (this.peek() && this.peek().type === TokenType.OP &&
           (this.peek().value === "!" || this.peek().value === "%")) {
      const op = this.next().value;
      value = op === "!" ? factorial(value) : value / 100;
    }
    return value;
  }

  parsePrimary() {
    const t = this.next();
    if (!t) throw new Error("Unexpected end of expression");

    if (t.type === TokenType.NUMBER) return t.value;

    if (t.type === TokenType.LPAREN) {
      const value = this.parseAddition();
      this.expect(TokenType.RPAREN);
      return value;
    }

    if (t.type === TokenType.IDENT) {
      const name = t.value;
      // Constant?
      if (name in CONSTANTS && !(this.peek() && this.peek().type === TokenType.LPAREN)) {
        return CONSTANTS[name];
      }
      // Function call?
      if (name in FUNCTIONS) {
        this.expect(TokenType.LPAREN);
        const arg = this.parseAddition();
        this.expect(TokenType.RPAREN);
        const result = FUNCTIONS[name](arg);
        if (Number.isNaN(result)) throw new Error(`${name}: out of domain`);
        return result;
      }
      // A constant that was followed by "(" (e.g. "pi(2)") → constant * (…)
      if (name in CONSTANTS) return CONSTANTS[name];
      throw new Error(`Unknown name: "${name}"`);
    }

    throw new Error("Unexpected token");
  }
}

/**
 * Evaluate a raw expression string safely.
 * @returns {number}
 * @throws {Error} on any invalid input
 */
function evaluate(expr) {
  if (!expr || !expr.trim()) throw new Error("Empty expression");
  const tokens = tokenize(expr);
  const result = new Parser(tokens).parse();
  if (!Number.isFinite(result)) throw new Error("Result is not finite");
  return result;
}

/* ============================================================
   2. NUMBER FORMATTING
   ============================================================ */

/** Format a number for display, trimming float noise. */
function formatNumber(n) {
  if (n === 0) return "0";
  const abs = Math.abs(n);
  // Use exponential for very large / very small magnitudes
  if (abs >= 1e15 || abs < 1e-9) {
    return n.toExponential(8).replace(/\.?0+e/, "e");
  }
  // Round to 12 significant digits, then strip trailing zeros
  let s = parseFloat(n.toPrecision(12)).toString();
  return s;
}

/* ============================================================
   3. CALCULATOR UI CONTROLLER
   ============================================================ */

const App = (() => {
  // ---- DOM references ----
  const $ = (sel) => document.querySelector(sel);
  const exprEl   = $("#expression");
  const resultEl = $("#result");
  const angleStatusEl = $("#angle-status");
  const memoryIndicatorEl = $("#memory-indicator");
  const historyPanel = $("#history-panel");
  const historyList  = $("#history-list");
  const historyEmpty = $("#history-empty");
  const toastEl = $("#toast");

  // ---- State ----
  let expression = "";   // raw expression string (machine form)
  let memory = 0;
  let soundOn = true;
  let history = [];
  let lastResult = "0";

  const LS = {
    HISTORY: "scicalc.history",
    THEME: "scicalc.theme",
    SOUND: "scicalc.sound",
    ANGLE: "scicalc.angle",
    MEMORY: "scicalc.memory",
  };

  // Map machine tokens → pretty display symbols
  const DISPLAY_MAP = {
    "*": " × ", "/": " ÷ ", "+": " + ", "-": " − ",
    "pi": "π", "sqrt(": "√(", "cbrt(": "∛(", "*10^": "E",
  };

  /* ---------- Display ---------- */

  function prettify(raw) {
    return raw
      .replace(/\*/g, " × ")
      .replace(/\//g, " ÷ ")
      .replace(/\+/g, " + ")
      .replace(/(?<![eE0-9.])-/g, " − ") // keep unary/sci minus tight-ish
      .replace(/pi/g, "π")
      .replace(/sqrt\(/g, "√(")
      .replace(/cbrt\(/g, "∛(")
      .replace(/asin\(/g, "sin⁻¹(")
      .replace(/acos\(/g, "cos⁻¹(")
      .replace(/atan\(/g, "tan⁻¹(")
      .replace(/abs\(/g, "|");
  }

  function render(liveResult) {
    exprEl.textContent = prettify(expression);
    if (liveResult !== undefined) {
      resultEl.textContent = liveResult;
      resultEl.classList.remove("error");
    }
    // Auto-scroll the long display to the right (newest input)
    exprEl.scrollLeft = exprEl.scrollWidth;
    resultEl.scrollLeft = resultEl.scrollWidth;
  }

  /** Try a live preview evaluation as the user types (non-fatal). */
  function livePreview() {
    if (!expression.trim()) { render("0"); return; }
    try {
      const value = evaluate(expression);
      render(formatNumber(value));
    } catch {
      // While typing, an incomplete expression is normal → show last good
      render(undefined);
    }
  }

  /* ---------- Sound ---------- */

  let audioCtx = null;
  function playClick() {
    if (!soundOn) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = 600;
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.08);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch { /* audio not available — ignore */ }
  }

  /* ---------- Toast ---------- */

  let toastTimer = null;
  function toast(msg, isError = false) {
    toastEl.textContent = msg;
    toastEl.classList.toggle("error", isError);
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 1800);
  }

  /* ---------- Core actions ---------- */

  function insert(str) {
    expression += str;
    livePreview();
  }

  function backspace() {
    // Remove a whole function token if the tail matches one
    const funcMatch = expression.match(/(asin\(|acos\(|atan\(|sqrt\(|cbrt\(|sin\(|cos\(|tan\(|log\(|ln\(|abs\(|pi)$/);
    if (funcMatch) {
      expression = expression.slice(0, -funcMatch[0].length);
    } else {
      expression = expression.slice(0, -1);
    }
    livePreview();
  }

  function clearEntry() {
    // Clear: drop the last number/operator chunk
    expression = expression.replace(/[^+\-*/^(]*$/, "");
    livePreview();
  }

  function allClear() {
    expression = "";
    resultEl.classList.remove("error");
    render("0");
  }

  function equals() {
    if (!expression.trim()) return;
    try {
      const value = evaluate(expression);
      const formatted = formatNumber(value);
      lastResult = formatted;
      addHistory(prettify(expression), formatted);
      resultEl.textContent = formatted;
      resultEl.classList.remove("error");
      exprEl.textContent = prettify(expression);
      // Continue from result
      expression = String(value);
    } catch (err) {
      resultEl.textContent = "Error";
      resultEl.classList.add("error");
      toast(err.message || "Invalid expression", true);
    }
  }

  /* ---------- Memory ---------- */

  function updateMemoryIndicator() {
    memoryIndicatorEl.textContent = memory !== 0 ? "M" : "";
  }

  function currentValueForMemory() {
    try { return evaluate(expression || lastResult); }
    catch { return parseFloat(lastResult) || 0; }
  }

  const memoryClear  = () => { memory = 0; persist(); updateMemoryIndicator(); toast("Memory cleared"); };
  const memoryRecall = () => { insert(formatNumber(memory)); toast("Memory recalled"); };
  const memoryPlus   = () => { memory += currentValueForMemory(); persist(); updateMemoryIndicator(); toast("Added to memory"); };
  const memoryMinus  = () => { memory -= currentValueForMemory(); persist(); updateMemoryIndicator(); toast("Subtracted from memory"); };

  /* ---------- History ---------- */

  function addHistory(expr, res) {
    history.unshift({ expr, res, t: Date.now() });
    if (history.length > 50) history.pop();
    persist();
    renderHistory();
  }

  function renderHistory() {
    historyList.innerHTML = "";
    historyEmpty.style.display = history.length ? "none" : "block";
    for (const item of history) {
      const li = document.createElement("li");
      li.className = "history-item";
      li.innerHTML = `<div class="h-expr"></div><div class="h-res"></div>`;
      li.querySelector(".h-expr").textContent = item.expr;
      li.querySelector(".h-res").textContent = "= " + item.res;
      // Click to reuse the result
      li.addEventListener("click", () => {
        insert(item.res);
        toast("Inserted from history");
      });
      historyList.appendChild(li);
    }
  }

  function clearHistory() {
    history = [];
    persist();
    renderHistory();
    toast("History cleared");
  }

  /* ---------- Persistence ---------- */

  function persist() {
    try {
      localStorage.setItem(LS.HISTORY, JSON.stringify(history));
      localStorage.setItem(LS.MEMORY, String(memory));
    } catch { /* storage may be unavailable (private mode) */ }
  }

  function loadState() {
    try {
      history = JSON.parse(localStorage.getItem(LS.HISTORY) || "[]");
      memory = parseFloat(localStorage.getItem(LS.MEMORY)) || 0;

      const theme = localStorage.getItem(LS.THEME) || "dark";
      document.documentElement.setAttribute("data-theme", theme);
      $("#theme-toggle").textContent = theme === "dark" ? "🌙" : "☀️";

      soundOn = localStorage.getItem(LS.SOUND) !== "off";
      updateSoundButton();

      angleMode = localStorage.getItem(LS.ANGLE) || "deg";
      updateAngleUI();
    } catch { /* ignore corrupt storage */ }
    renderHistory();
    updateMemoryIndicator();
  }

  /* ---------- Toggles ---------- */

  function updateAngleUI() {
    const label = angleMode === "deg" ? "DEG" : "RAD";
    $("#angle-toggle").textContent = label;
    angleStatusEl.textContent = label;
  }

  function toggleAngle() {
    angleMode = angleMode === "deg" ? "rad" : "deg";
    localStorage.setItem(LS.ANGLE, angleMode);
    updateAngleUI();
    livePreview();
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    const nextTheme = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nextTheme);
    $("#theme-toggle").textContent = nextTheme === "dark" ? "🌙" : "☀️";
    localStorage.setItem(LS.THEME, nextTheme);
  }

  function updateSoundButton() {
    const btn = $("#sound-toggle");
    btn.textContent = soundOn ? "🔊" : "🔇";
    btn.setAttribute("aria-pressed", String(soundOn));
  }

  function toggleSound() {
    soundOn = !soundOn;
    localStorage.setItem(LS.SOUND, soundOn ? "on" : "off");
    updateSoundButton();
  }

  function toggleHistory() {
    historyPanel.hidden = !historyPanel.hidden;
    $("#history-toggle").classList.toggle("active", !historyPanel.hidden);
  }

  /* ---------- Copy ---------- */

  async function copyResult() {
    const text = resultEl.textContent;
    try {
      await navigator.clipboard.writeText(text);
      toast("Copied: " + text);
    } catch {
      // Fallback for browsers without clipboard API
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); toast("Copied: " + text); }
      catch { toast("Copy failed", true); }
      document.body.removeChild(ta);
    }
  }

  /* ---------- Random ---------- */
  const randomNumber = () => { insert(formatNumber(Math.random())); };

  /* ---------- Action dispatch ---------- */

  const ACTIONS = {
    "all-clear": allClear,
    "clear": clearEntry,
    "backspace": backspace,
    "equals": equals,
    "mc": memoryClear,
    "mr": memoryRecall,
    "m-plus": memoryPlus,
    "m-minus": memoryMinus,
    "copy": copyResult,
    "rand": randomNumber,
  };

  function handleButton(btn) {
    // Visual ripple
    btn.classList.add("pressed");
    setTimeout(() => btn.classList.remove("pressed"), 360);
    playClick();

    const action = btn.dataset.action;
    const ins = btn.dataset.insert;
    if (action && ACTIONS[action]) ACTIONS[action]();
    else if (ins !== undefined) insert(ins);
  }

  /* ---------- Keyboard support ---------- */

  function handleKey(e) {
    const k = e.key;
    // Direct character inserts
    if (/^[0-9.+\-*/^()%!]$/.test(k)) { insert(k); flash(`[data-insert="${cssEscape(k)}"]`); e.preventDefault(); return; }

    switch (k) {
      case "Enter": case "=": equals(); flash('[data-action="equals"]'); e.preventDefault(); break;
      case "Backspace": backspace(); flash('[data-action="backspace"]'); e.preventDefault(); break;
      case "Delete": allClear(); flash('[data-action="all-clear"]'); break;
      case "Escape": allClear(); flash('[data-action="all-clear"]'); break;
      case "c": case "C": clearEntry(); break;
      default: break;
    }
  }

  // Safely build an attribute selector value
  function cssEscape(s) { return s.replace(/["\\]/g, "\\$&"); }

  function flash(selector) {
    const btn = document.querySelector(selector);
    if (btn) { btn.classList.add("pressed"); setTimeout(() => btn.classList.remove("pressed"), 200); playClick(); }
  }

  /* ---------- Init / wiring ---------- */

  function init() {
    loadState();
    render("0");

    // Delegate all keypad button clicks
    document.querySelector(".keypad").addEventListener("click", (e) => {
      const btn = e.target.closest("button.btn");
      if (btn) handleButton(btn);
    });

    // Top-bar toggles
    $("#angle-toggle").addEventListener("click", toggleAngle);
    $("#theme-toggle").addEventListener("click", toggleTheme);
    $("#sound-toggle").addEventListener("click", toggleSound);
    $("#history-toggle").addEventListener("click", toggleHistory);
    $("#clear-history").addEventListener("click", clearHistory);

    // Keyboard
    document.addEventListener("keydown", handleKey);
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", App.init);
