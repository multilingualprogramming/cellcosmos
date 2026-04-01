const DEFAULTS = {
  rule: 90,
  cellSize: 3,
  bgColor: [8, 17, 31],
  gradientColors: [[255, 157, 77], [255, 209, 102], [83, 176, 255]],
  shape: "rect",
  initialMode: "center",
  initialCount: 5,
  seed: 42,
  circular: false,
  probability: 1,
  direction: "ltr",
};

const fallbackDomain = {
  transition(ruleNumber, left, center, right) {
    const index = left * 4 + center * 2 + right;
    return Math.floor(ruleNumber / (2 ** index)) % 2;
  },
  patternOutput(ruleNumber, patternIndex) {
    return Math.floor(ruleNumber / (2 ** patternIndex)) % 2;
  },
  wolframClass(ruleNumber) {
    if ([0, 8, 32, 40, 64, 72, 96, 104, 128, 136, 160, 168, 192, 200, 224, 232, 248, 255].includes(ruleNumber)) return 1;
    if ([18, 22, 30, 45, 60, 90, 105, 122, 126, 150].includes(ruleNumber)) return 3;
    if ([54, 106, 110, 137, 193].includes(ruleNumber)) return 4;
    return 2;
  },
  noteLabel(ruleNumber) {
    if (ruleNumber === 30) return "Chaos pseudo al\u00e9atoire";
    if (ruleNumber === 90) return "Triangle de Sierpinski";
    if (ruleNumber === 110) return "Calcul universel";
    if (ruleNumber === 150) return "XOR avec auto-r\u00e9f\u00e9rence";
    if (ruleNumber === 184) return "Mod\u00e8le de trafic";
    if (ruleNumber === 254) return "Fronti\u00e8res seulement";
    return "";
  },
  interpolateComponent(start, end, progressScaled) {
    return Math.round(start + (end - start) * (progressScaled / 1000));
  },
};

let state = structuredClone(DEFAULTS);
let wasm = null;
let wasmAvailable = false;
const textDecoder = new TextDecoder();
let galleryLoaded = false;
let galleryLoading = null;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

function hexToRgb(hex) {
  let value = hex.replace("#", "");
  if (value.length === 3) value = value.split("").map((char) => char + char).join("");
  const numeric = Number.parseInt(value, 16);
  return [(numeric >> 16) & 255, (numeric >> 8) & 255, numeric & 255];
}

function rgbToHex([r, g, b]) {
  return [r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function rgbToHexColor(rgb) {
  return `#${rgbToHex(rgb)}`;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let n = Math.imul(t ^ (t >>> 15), t | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

function interpolateColor(a, b, t) {
  const progressScaled = Math.round(t * 1000);
  return a.map((value, index) => interpolateComponent(value, b[index], progressScaled));
}

function generateGradient(colors, steps) {
  if (steps <= 0) return [];
  if (colors.length < 2) return Array.from({ length: steps }, () => colors[0]);
  const segments = colors.length - 1;
  const stepsPerSegment = steps / segments;
  return Array.from({ length: steps }, (_, index) => {
    const segment = Math.min(Math.floor(index / stepsPerSegment), segments - 1);
    const localT = (index - segment * stepsPerSegment) / stepsPerSegment;
    return interpolateColor(colors[segment], colors[segment + 1], localT);
  });
}

async function loadWasm() {
  const status = document.getElementById("wasm-status");
  try {
    const response = await fetch("cellcosmos.wasm");
    if (!response.ok) {
      throw new Error(`Fichier WASM indisponible (${response.status}).`);
    }
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength < 8) {
      throw new Error("Fichier WASM vide ou incomplet.");
    }
    const module = await WebAssembly.compile(bytes);
    const importObject = buildWasmImportObject(module);
    const instance = await WebAssembly.instantiate(module, importObject);
    wasm = instance.exports;
    wasmAvailable = true;
    if (validateWasmExports(instance.exports)) {
      status.textContent = "Moteur WASM charg\u00e9 depuis les sources Multilingual.";
    } else {
      status.textContent = "Moteur WASM charge partiellement, avec repli JavaScript selon les fonctions disponibles.";
      console.warn("Exports WASM partiellement compatibles avec l'interface Cellcosmos.");
    }
  } catch (error) {
    wasm = null;
    wasmAvailable = false;
    status.textContent = "WASM incompatible ici, repli sur le moteur JavaScript.";
    console.error(error);
  }
}

function buildWasmImportObject(module) {
  const importObject = {};

  for (const entry of WebAssembly.Module.imports(module)) {
    if (!importObject[entry.module]) {
      importObject[entry.module] = {};
    }

    if (entry.kind === "function") {
      importObject[entry.module][entry.name] = () => 0;
    } else if (entry.kind === "memory") {
      importObject[entry.module][entry.name] = new WebAssembly.Memory({ initial: 16 });
    } else if (entry.kind === "table") {
      importObject[entry.module][entry.name] = new WebAssembly.Table({ initial: 0, element: "anyfunc" });
    } else if (entry.kind === "global") {
      importObject[entry.module][entry.name] = new WebAssembly.Global({ value: "i32", mutable: true }, 0);
    }
  }

  if (!importObject.env) {
    importObject.env = {};
  }

  return importObject;
}

function validateWasmExports(exports) {
  if (
    !exports
    || typeof exports.cellule_suivante !== "function"
    || typeof exports.classe_wolfram !== "function"
  ) {
    return false;
  }

  try {
    const transitionChecks = [
      [90, 1, 0, 1, 0],
      [90, 1, 0, 0, 1],
      [30, 1, 1, 1, 0],
      [30, 0, 1, 0, 1],
    ];
    for (const [rule, left, center, right, expected] of transitionChecks) {
      if (Number(exports.cellule_suivante(rule, left, center, right)) !== expected) {
        return false;
      }
    }

    const classChecks = [
      [30, 3],
      [110, 4],
      [255, 1],
      [73, 2],
    ];
    for (const [rule, expected] of classChecks) {
      if (Number(exports.classe_wolfram(rule)) !== expected) {
        return false;
      }
    }

    if (typeof exports.note_regle === "function") {
      const noteChecks = [
        [30, 1],
        [90, 2],
        [73, 0],
      ];
      for (const [rule, expected] of noteChecks) {
        if (Number(exports.note_regle(rule)) !== expected) {
          return false;
        }
      }
    }

    if (hasWasmStringSupport(exports) && typeof exports.etiquette_note_regle === "function") {
      const labelPtr = Number(exports.etiquette_note_regle(90));
      const labelLength = Number(exports.__ml_str_len());
      const labelBytes = new Uint8Array(exports.memory.buffer, labelPtr, labelLength);
      const label = textDecoder.decode(labelBytes.slice());
      exports.__ml_reset();
      if (label !== "Triangle de Sierpinski") {
        return false;
      }
    }

    if (typeof exports.sortie_motif === "function") {
      if (Number(exports.sortie_motif(90, 4)) !== 1) {
        return false;
      }
    }
  } catch (error) {
    console.error(error);
    return false;
  }

  return true;
}

function hasWasmStringSupport(exports) {
  return (
    exports
    && typeof exports.__ml_str_len === "function"
    && typeof exports.__ml_reset === "function"
    && exports.memory instanceof WebAssembly.Memory
  );
}

function transition(ruleNumber, left, center, right) {
  if (wasmAvailable && wasm && typeof wasm.cellule_suivante === "function") {
    try {
      return Number(wasm.cellule_suivante(ruleNumber, left, center, right));
    } catch (error) {
      disableWasmRuntime(error);
    }
  }
  return fallbackDomain.transition(ruleNumber, left, center, right);
}

function patternOutput(ruleNumber, patternIndex) {
  if (wasmAvailable && wasm && typeof wasm.sortie_motif === "function") {
    try {
      return Number(wasm.sortie_motif(ruleNumber, patternIndex));
    } catch (error) {
      disableWasmRuntime(error);
    }
  }
  return fallbackDomain.patternOutput(ruleNumber, patternIndex);
}

function wolframClass(ruleNumber) {
  if (wasmAvailable && wasm && typeof wasm.classe_wolfram === "function") {
    try {
      return Number(wasm.classe_wolfram(ruleNumber));
    } catch (error) {
      disableWasmRuntime(error);
    }
  }
  return fallbackDomain.wolframClass(ruleNumber);
}

function ruleNoteLabel(ruleNumber) {
  if (
    wasmAvailable
    && wasm
    && typeof wasm.etiquette_note_regle === "function"
    && hasWasmStringSupport(wasm)
  ) {
    try {
      return callWasmString(wasm.etiquette_note_regle, ruleNumber);
    } catch (error) {
      disableWasmRuntime(error);
    }
  }
  return fallbackDomain.noteLabel(ruleNumber);
}

function interpolateComponent(start, end, progressScaled) {
  return fallbackDomain.interpolateComponent(start, end, progressScaled);
}

function callWasmString(fn, ...args) {
  const ptr = Number(fn(...args));
  const length = Number(wasm.__ml_str_len());
  const bytes = new Uint8Array(wasm.memory.buffer, ptr, length);
  const value = textDecoder.decode(bytes.slice());
  wasm.__ml_reset();
  return value;
}

function disableWasmRuntime(error) {
  wasm = null;
  wasmAvailable = false;
  const status = document.getElementById("wasm-status");
  if (status) {
    status.textContent = "Moteur WASM indisponible, repli sur le moteur JavaScript.";
  }
  console.error(error);
}

function applyInitialState(grid, cols, rows) {
  let originY = Math.floor(rows / 2);
  if (state.initialMode === "center") {
    grid[originY][Math.floor(cols / 2)] = 1;
    return originY;
  }
  const count = clamp(Number.parseInt(state.initialCount || 1, 10), 1, cols);
  const random = mulberry32(Number.parseInt(state.seed || 0, 10));
  const used = new Set();
  while (used.size < count) used.add(Math.floor(random() * cols));
  used.forEach((index) => {
    grid[originY][index] = 1;
  });
  return originY;
}

function getNextGeneration(current, ruleNumber, rowSeed) {
  const nextGen = [];
  const random = mulberry32(rowSeed);
  const size = current.length;
  const indices = state.direction === "ltr" ? [...Array(size).keys()] : [...Array(size).keys()].reverse();

  for (const i of indices) {
    if (random() > state.probability) {
      nextGen.push(0);
      continue;
    }
    let left;
    let center;
    let right;
    if (state.direction === "ltr") {
      left = i > 0 ? current[i - 1] : state.circular ? current[size - 1] : 0;
      center = current[i];
      right = i < size - 1 ? current[i + 1] : state.circular ? current[0] : 0;
    } else {
      right = i > 0 ? current[i - 1] : state.circular ? current[size - 1] : 0;
      center = current[i];
      left = i < size - 1 ? current[i + 1] : state.circular ? current[0] : 0;
    }
    nextGen.push(transition(ruleNumber, left, center, right));
  }
  return state.direction === "ltr" ? nextGen : nextGen.reverse();
}

function evolveAutomaton(ruleNumber, rows, cols) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  const origin = applyInitialState(grid, cols, rows);
  const baseSeed = Number.parseInt(state.seed || 0, 10);
  for (let row = origin + 1; row < rows; row += 1) {
    grid[row] = getNextGeneration(grid[row - 1], ruleNumber, baseSeed + row + 1);
  }
  for (let row = origin - 1; row >= 0; row -= 1) {
    grid[row] = getNextGeneration(grid[row + 1], ruleNumber, baseSeed + rows + row + 1);
  }
  return grid;
}

function drawCell(ctx, x, y, size, color) {
  ctx.fillStyle = color;
  if (state.shape === "circle") {
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (state.shape === "ellipse") {
    ctx.beginPath();
    ctx.ellipse(x + size / 2, y + size / 2, size / 2, size / 3, 0, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (state.shape === "triangle") {
    ctx.beginPath();
    ctx.moveTo(x + size / 2, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x + size, y + size);
    ctx.closePath();
    ctx.fill();
    return;
  }
  ctx.fillRect(x, y, size, size);
}

function renderToCanvas(canvas, ruleNumber, rows, cols, cellSize) {
  const ctx = canvas.getContext("2d");
  canvas.width = cols * cellSize;
  canvas.height = rows * cellSize;
  ctx.fillStyle = `rgb(${state.bgColor.join(",")})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const automaton = evolveAutomaton(ruleNumber, rows, cols);
  const gradient = generateGradient(state.gradientColors, rows);
  automaton.forEach((row, rowIndex) => {
    const color = `rgb(${gradient[rowIndex].join(",")})`;
    row.forEach((value, colIndex) => {
      if (value !== 1) return;
      drawCell(ctx, colIndex * cellSize, rowIndex * cellSize, cellSize, color);
    });
  });
}

function updateRuleInfo() {
  const cls = wolframClass(state.rule);
  const noteLabel = ruleNoteLabel(state.rule);
  const note = noteLabel ? ` - ${noteLabel}` : "";
  document.getElementById("rule-class").textContent = `Classe ${cls}${note}`;
}

function syncRuleControls() {
  document.getElementById("rule-slider").value = String(state.rule);
  document.getElementById("rule-number").value = String(state.rule);
  document.getElementById("rule-display").textContent = String(state.rule);
  updateRuleInfo();
}

function renderRuleDiagram() {
  const container = document.getElementById("rule-diagram");
  container.innerHTML = "";
  for (let i = 7; i >= 0; i -= 1) {
    const pattern = `${(i >> 2) & 1}${(i >> 1) & 1}${i & 1}`;
    const output = patternOutput(state.rule, i);
    const block = document.createElement("div");
    block.className = "pattern-block";
    block.innerHTML = `<div class="pattern-label">${pattern}</div><div class="neighborhood"></div><div class="diagram-cell output-cell ${output === 1 ? "alive" : "dead"}"></div>`;
    const neighborhood = block.querySelector(".neighborhood");
    [...pattern].forEach((bit) => {
      const cell = document.createElement("div");
      cell.className = `diagram-cell ${bit === "1" ? "alive" : "dead"}`;
      neighborhood.appendChild(cell);
    });
    block.querySelector(".output-cell").addEventListener("click", () => {
      state.rule = clamp(state.rule ^ (1 << i), 0, 255);
      syncRuleControls();
      renderRuleDiagram();
      scheduleRender();
    });
    container.appendChild(block);
  }
}

function buildShareURL() {
  const params = new URLSearchParams({
    rule: state.rule,
    cs: state.cellSize,
    bg: rgbToHex(state.bgColor),
    colors: state.gradientColors.map(rgbToHex).join(","),
    shape: state.shape,
    init: state.initialMode,
    count: state.initialCount,
    seed: state.seed,
    circ: state.circular ? "1" : "0",
    prob: state.probability.toFixed(2),
    dir: state.direction,
  });
  return `${location.origin}${location.pathname}?${params}`;
}

function loadFromURL() {
  const params = new URLSearchParams(location.search);
  if (params.has("rule")) state.rule = clamp(Number.parseInt(params.get("rule"), 10), 0, 255);
  if (params.has("cs")) state.cellSize = clamp(Number.parseInt(params.get("cs"), 10), 1, 10);
  if (params.has("bg")) state.bgColor = hexToRgb(params.get("bg"));
  if (params.has("colors")) state.gradientColors = params.get("colors").split(",").map(hexToRgb);
  if (params.has("shape")) state.shape = params.get("shape");
  if (params.has("init")) state.initialMode = params.get("init");
  if (params.has("count")) state.initialCount = Number.parseInt(params.get("count"), 10);
  if (params.has("seed")) state.seed = Number.parseInt(params.get("seed"), 10);
  if (params.has("circ")) state.circular = params.get("circ") === "1";
  if (params.has("prob")) state.probability = Number.parseFloat(params.get("prob"));
  if (params.has("dir")) state.direction = params.get("dir");
}

function renderMainView() {
  const canvas = document.getElementById("main-canvas");
  const width = canvas.parentElement.clientWidth;
  const rows = Math.max(1, Math.floor((width * 0.6) / state.cellSize));
  const cols = Math.max(1, Math.floor(width / state.cellSize));
  renderToCanvas(canvas, state.rule, rows, cols, state.cellSize);
}

function renderGradientPickers() {
  const container = document.getElementById("gradient-colors");
  container.innerHTML = "";
  state.gradientColors.forEach((color, index) => {
    const row = document.createElement("div");
    row.className = "color-stop";
    const picker = document.createElement("input");
    picker.type = "color";
    picker.value = rgbToHexColor(color);
    picker.addEventListener("input", () => {
      state.gradientColors[index] = hexToRgb(picker.value);
      scheduleRender();
    });
    row.appendChild(picker);
    if (state.gradientColors.length > 1) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "ghost-btn";
      remove.textContent = "x";
      remove.addEventListener("click", () => {
        state.gradientColors.splice(index, 1);
        renderGradientPickers();
        scheduleRender();
      });
      row.appendChild(remove);
    }
    container.appendChild(row);
  });
}

function switchTab(tab) {
  const explorer = tab === "explorer";
  const gallery = tab === "gallery";
  const source = tab === "source";
  document.getElementById("explorer-panel").hidden = !explorer;
  document.getElementById("gallery-panel").hidden = !gallery;
  document.getElementById("source-panel").hidden = !source;
  document.getElementById("tab-explorer").classList.toggle("active", explorer);
  document.getElementById("tab-gallery").classList.toggle("active", gallery);
  document.getElementById("tab-source").classList.toggle("active", source);
  if (gallery) loadGalleryFragment();
}

const scheduleRender = debounce(() => {
  renderMainView();
}, 100);

function selectGalleryRule(rule) {
  state.rule = clamp(rule, 0, 255);
  syncRuleControls();
  renderRuleDiagram();
  switchTab("explorer");
  scheduleRender();
}

function bindGallery() {
  const grid = document.getElementById("gallery-grid");
  grid.addEventListener("click", (event) => {
    const item = event.target.closest(".gallery-item");
    if (!item) return;
    selectGalleryRule(Number.parseInt(item.dataset.rule, 10) || 0);
  });
  grid.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const item = event.target.closest(".gallery-item");
    if (!item) return;
    event.preventDefault();
    selectGalleryRule(Number.parseInt(item.dataset.rule, 10) || 0);
  });
}

async function loadGalleryFragment() {
  if (galleryLoaded) return;
  if (galleryLoading) return galleryLoading;
  const grid = document.getElementById("gallery-grid");
  grid.innerHTML = '<p class="muted">Chargement de la galerie...</p>';
  galleryLoading = fetch("gallery-fragment.html")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Fragment galerie indisponible (${response.status}).`);
      }
      return response.text();
    })
    .then((markup) => {
      grid.innerHTML = markup;
      galleryLoaded = true;
    })
    .catch((error) => {
      grid.innerHTML = '<p class="muted">Impossible de charger la galerie statique.</p>';
      console.error(error);
    })
    .finally(() => {
      galleryLoading = null;
    });
  return galleryLoading;
}

function bindControls() {
  const presets = document.getElementById("presets");

  document.getElementById("rule-slider").addEventListener("input", (event) => {
    state.rule = Number.parseInt(event.target.value, 10);
    syncRuleControls();
    renderRuleDiagram();
    scheduleRender();
  });
  document.getElementById("rule-number").addEventListener("change", (event) => {
    state.rule = clamp(Number.parseInt(event.target.value, 10) || 0, 0, 255);
    syncRuleControls();
    renderRuleDiagram();
    scheduleRender();
  });
  document.getElementById("btn-prev").addEventListener("click", () => {
    state.rule = (state.rule - 1 + 256) % 256;
    syncRuleControls();
    renderRuleDiagram();
    scheduleRender();
  });
  document.getElementById("btn-next").addEventListener("click", () => {
    state.rule = (state.rule + 1) % 256;
    syncRuleControls();
    renderRuleDiagram();
    scheduleRender();
  });
  document.getElementById("btn-random").addEventListener("click", () => {
    state.rule = Math.floor(Math.random() * 256);
    syncRuleControls();
    renderRuleDiagram();
    scheduleRender();
  });
  presets.addEventListener("change", (event) => {
    if (!event.target.value) return;
    state.rule = Number.parseInt(event.target.value, 10);
    event.target.value = "";
    syncRuleControls();
    renderRuleDiagram();
    scheduleRender();
  });

  const cellSize = document.getElementById("cell-size");
  const cellSizeDisplay = document.getElementById("cell-size-display");
  cellSize.value = String(state.cellSize);
  cellSizeDisplay.textContent = String(state.cellSize);
  cellSize.addEventListener("input", (event) => {
    state.cellSize = Number.parseInt(event.target.value, 10);
    cellSizeDisplay.textContent = String(state.cellSize);
    scheduleRender();
  });

  document.querySelectorAll('input[name="shape"]').forEach((input) => {
    if (input.value === state.shape) input.checked = true;
    input.addEventListener("change", () => {
      state.shape = input.value;
      scheduleRender();
    });
  });

  document.querySelectorAll('input[name="init-mode"]').forEach((input) => {
    if (input.value === state.initialMode) input.checked = true;
    input.addEventListener("change", () => {
      state.initialMode = input.value;
      document.getElementById("random-opts").hidden = input.value !== "random";
      scheduleRender();
    });
  });

  const initCount = document.getElementById("init-count");
  const initSeed = document.getElementById("init-seed");
  initCount.value = String(state.initialCount);
  initSeed.value = String(state.seed);
  initCount.addEventListener("change", (event) => {
    state.initialCount = Number.parseInt(event.target.value, 10) || 1;
    scheduleRender();
  });
  initSeed.addEventListener("change", (event) => {
    state.seed = Number.parseInt(event.target.value, 10) || 0;
    scheduleRender();
  });
  document.getElementById("random-opts").hidden = state.initialMode !== "random";

  const bgColor = document.getElementById("bg-color");
  bgColor.value = rgbToHexColor(state.bgColor);
  bgColor.addEventListener("input", (event) => {
    state.bgColor = hexToRgb(event.target.value);
    scheduleRender();
  });

  document.getElementById("btn-add-color").addEventListener("click", () => {
    state.gradientColors.push([255, 255, 255]);
    renderGradientPickers();
    scheduleRender();
  });

  const circular = document.getElementById("circular");
  circular.checked = state.circular;
  circular.addEventListener("change", () => {
    state.circular = circular.checked;
    scheduleRender();
  });

  const probability = document.getElementById("probability");
  const probabilityDisplay = document.getElementById("prob-display");
  probability.value = String(state.probability);
  probabilityDisplay.textContent = state.probability.toFixed(2);
  probability.addEventListener("input", (event) => {
    state.probability = clamp(Number.parseFloat(event.target.value) || 0, 0, 1);
    probabilityDisplay.textContent = state.probability.toFixed(2);
    scheduleRender();
  });

  document.querySelectorAll('input[name="direction"]').forEach((input) => {
    if (input.value === state.direction) input.checked = true;
    input.addEventListener("change", () => {
      state.direction = input.value;
      scheduleRender();
    });
  });

  document.getElementById("btn-download").addEventListener("click", () => {
    const link = document.createElement("a");
    link.href = document.getElementById("main-canvas").toDataURL("image/png");
    link.download = `r\u00e8gle-${state.rule}.png`;
    link.click();
  });
  document.getElementById("btn-share").addEventListener("click", async () => {
    const button = document.getElementById("btn-share");
    const original = button.textContent;
    await navigator.clipboard.writeText(buildShareURL());
    button.textContent = "Lien copi\u00e9";
    setTimeout(() => {
      button.textContent = original;
    }, 1200);
  });
  document.getElementById("btn-reset").addEventListener("click", () => {
    state = structuredClone(DEFAULTS);
    history.replaceState(null, "", location.pathname);
    location.reload();
  });

  document.getElementById("tab-explorer").addEventListener("click", () => switchTab("explorer"));
  document.getElementById("tab-gallery").addEventListener("click", () => switchTab("gallery"));
  document.getElementById("tab-source").addEventListener("click", () => switchTab("source"));

  document.addEventListener("keydown", (event) => {
    if (["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;
    if (event.key === "ArrowLeft") state.rule = (state.rule - 1 + 256) % 256;
    else if (event.key === "ArrowRight") state.rule = (state.rule + 1) % 256;
    else if (event.key.toLowerCase() === "r") state.rule = Math.floor(Math.random() * 256);
    else return;
    syncRuleControls();
    renderRuleDiagram();
    scheduleRender();
  });

  window.addEventListener("resize", scheduleRender);
}

async function init() {
  loadFromURL();
  bindControls();
  bindGallery();
  renderGradientPickers();
  syncRuleControls();
  renderRuleDiagram();
  renderMainView();
  await loadWasm();
  renderRuleDiagram();
  scheduleRender();
}

init();
