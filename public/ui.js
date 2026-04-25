const DEFAULTS = {
  rule: 90,
  cellSize: 3,
  bgColor: [8, 17, 31],
  gradientColors: [[255, 157, 77], [255, 209, 102], [83, 176, 255]],
  palettesPoints: {},
  reglesPoints: {},
  shape: "rect",
  initialMode: "top",
  pointsInitiaux: "",
  initialCount: 5,
  seed: 42,
  circular: false,
  probability: 1,
  champProbabiliteActif: false,
  probabiliteHaut: 1,
  probabiliteBas: 1,
  direction: "ltr",
  blendMode: "source-over",
  layerOpacity: 1.0,
  texture: "solid",
  progressionTemporelle: 1,
  vitesseAnimation: 1.2,
  pauseSurCollision: false,
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
  frequenceFondamentale(ruleNumber) {
    return 110 * Math.pow(2, ruleNumber / 64);
  },
  formeOndeSynthese(ruleNumber) {
    const waveforms = ["sine", "triangle", "sawtooth", "square"];
    const wolfClass = this.wolframClass(ruleNumber);
    return waveforms[Math.max(0, Math.min(3, wolfClass - 1))];
  },
  desaccordSecondaire(ruleNumber) {
    return (ruleNumber % 12) * 100;
  },
  probabiliteLigne(probabiliteBaseSur1000, champActif, probabiliteHautSur1000, probabiliteBasSur1000, ligne, totalLignes) {
    if (champActif === 0 || totalLignes <= 1) return probabiliteBaseSur1000;
    const progression = ligne / (totalLignes - 1);
    const modulation = probabiliteHautSur1000 + ((probabiliteBasSur1000 - probabiliteHautSur1000) * progression);
    return clamp((probabiliteBaseSur1000 * modulation) / 1000, 0, 1000);
  },
  ligneVisible(progressionSur1000, ligneOrigine, ligneCourante, totalLignes) {
    if (totalLignes <= 1) return 1;
    const distance = Math.abs(ligneCourante - ligneOrigine);
    const distanceMax = Math.floor((progressionSur1000 * (totalLignes - 1)) / 1000);
    return distance <= distanceMax ? 1 : 0;
  },
  miroirHorizontalColonne(colonne, largeur) {
    return (largeur - 1) - colonne;
  },
  miroirVerticalLigne(ligne, hauteur) {
    return (hauteur - 1) - ligne;
  },
  coordonneeTuilee(coordonnee, decalage, maximum) {
    return clamp(coordonnee + decalage, 0, maximum);
  },
};

let state = structuredClone(DEFAULTS);
let wasm = null;
let wasmAvailable = false;
const textDecoder = new TextDecoder();
let galleryLoaded = false;
let galleryLoading = null;
const patternCache = new Map();
let dernieresCouches = null;
let pointActif = "";
const animationEtat = { actif: false, sens: 1, dernierTemps: 0 };
const editeurPoints = { actif: false, cle: "", decalageX: 0, decalageY: 0 };

function createDotsPattern(size, color, ctx) {
  const canvas = new OffscreenCanvas(size, size);
  const c = canvas.getContext("2d");
  c.fillStyle = color;
  c.beginPath();
  c.arc(size / 2, size / 2, size / 6, 0, Math.PI * 2);
  c.fill();
  return ctx.createPattern(canvas, "repeat");
}

function createCrosshatchPattern(size, color, ctx) {
  const canvas = new OffscreenCanvas(size, size);
  const c = canvas.getContext("2d");
  c.strokeStyle = color;
  c.lineWidth = Math.max(1, size / 8);
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(size, size);
  c.stroke();
  c.beginPath();
  c.moveTo(size, 0);
  c.lineTo(0, size);
  c.stroke();
  return ctx.createPattern(canvas, "repeat");
}

function createNoisePattern(size, color, ctx) {
  const canvas = new OffscreenCanvas(size, size);
  const c = canvas.getContext("2d");
  const imageData = c.createImageData(size, size);
  const data = imageData.data;
  const rng = mulberry32(color.charCodeAt(0) || 42);
  const matches = color.match(/\d+/g);
  const [r, g, b] = matches ? matches.map(Number) : [255, 255, 255];
  for (let i = 0; i < data.length; i += 4) {
    const noise = rng();
    data[i] = Math.round(r * (0.5 + noise * 0.5));
    data[i + 1] = Math.round(g * (0.5 + noise * 0.5));
    data[i + 2] = Math.round(b * (0.5 + noise * 0.5));
    data[i + 3] = 255;
  }
  c.putImageData(imageData, 0, 0);
  return ctx.createPattern(canvas, "repeat");
}

function getTexturePattern(size, color, textureName, ctx) {
  const cacheKey = `${size}-${color}-${textureName}`;
  if (patternCache.has(cacheKey)) {
    return patternCache.get(cacheKey);
  }
  let pattern = null;
  if (textureName === "dots") {
    pattern = createDotsPattern(size, color, ctx);
  } else if (textureName === "crosshatch") {
    pattern = createCrosshatchPattern(size, color, ctx);
  } else if (textureName === "noise") {
    pattern = createNoisePattern(size, color, ctx);
  }
  if (pattern) {
    patternCache.set(cacheKey, pattern);
  }
  return pattern;
}

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

function clonerCouleurs(colors) {
  return colors.map((color) => [...color]);
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

function obtenirDimensionsRendu() {
  const canvas = document.getElementById("main-canvas");
  const width = canvas?.parentElement?.clientWidth || 900;
  return {
    rows: Math.max(1, Math.floor((width * 0.6) / state.cellSize)),
    cols: Math.max(1, Math.floor(width / state.cellSize)),
  };
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

    if (typeof exports.frequence_fondamentale === "function") {
      const freq = Number(exports.frequence_fondamentale(90));
      if (freq < 100 || freq > 2000) {
        return false;
      }
    }

    if (typeof exports.forme_onde_synthese === "function") {
      const waveform = Number(exports.forme_onde_synthese(30));
      if (waveform < 1 || waveform > 4) {
        return false;
      }
    }

    if (typeof exports.texture_code_solide === "function" && typeof exports.texture_code_bruit === "function") {
      if (Number(exports.texture_code_solide()) !== 0 || Number(exports.texture_code_bruit()) !== 4) {
        return false;
      }
    }

    if (typeof exports.tempo_depuis_vitesse === "function") {
      const tempo = Number(exports.tempo_depuis_vitesse(500));
      if (tempo < 60 || tempo > 180) {
        return false;
      }
    }

    if (typeof exports.gamme_depuis_classe === "function") {
      const gamme = Number(exports.gamme_depuis_classe(2));
      if (gamme < 0 || gamme > 3) {
        return false;
      }
    }

    if (typeof exports.octave_depuis_course === "function") {
      const octave = Number(exports.octave_depuis_course(10, 100));
      if (octave < 3 || octave > 5) {
        return false;
      }
    }

    if (typeof exports.probabilite_ligne === "function") {
      const probabilite = Number(exports.probabilite_ligne(1000, 1, 1000, 500, 10, 100));
      if (probabilite < 0 || probabilite > 1000) {
        return false;
      }
    }

    if (typeof exports.ligne_visible === "function") {
      if (Number(exports.ligne_visible(250, 10, 80, 100)) !== 0) {
        return false;
      }
    }

    if (typeof exports.miroir_horizontal_colonne === "function") {
      if (Number(exports.miroir_horizontal_colonne(3, 10)) !== 6) {
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

function probabiliteLigne(probabiliteBaseSur1000, champActif, probabiliteHautSur1000, probabiliteBasSur1000, ligne, totalLignes) {
  if (wasmAvailable && wasm && typeof wasm.probabilite_ligne === "function") {
    try {
      return Number(wasm.probabilite_ligne(probabiliteBaseSur1000, champActif, probabiliteHautSur1000, probabiliteBasSur1000, ligne, totalLignes));
    } catch (error) {
      disableWasmRuntime(error);
    }
  }
  return fallbackDomain.probabiliteLigne(probabiliteBaseSur1000, champActif, probabiliteHautSur1000, probabiliteBasSur1000, ligne, totalLignes);
}

function ligneVisible(progressionSur1000, ligneOrigine, ligneCourante, totalLignes) {
  if (wasmAvailable && wasm && typeof wasm.ligne_visible === "function") {
    try {
      return Number(wasm.ligne_visible(progressionSur1000, ligneOrigine, ligneCourante, totalLignes));
    } catch (error) {
      disableWasmRuntime(error);
    }
  }
  return fallbackDomain.ligneVisible(progressionSur1000, ligneOrigine, ligneCourante, totalLignes);
}

function miroirHorizontalColonne(colonne, largeur) {
  if (wasmAvailable && wasm && typeof wasm.miroir_horizontal_colonne === "function") {
    try {
      return Number(wasm.miroir_horizontal_colonne(colonne, largeur));
    } catch (error) {
      disableWasmRuntime(error);
    }
  }
  return fallbackDomain.miroirHorizontalColonne(colonne, largeur);
}

function miroirVerticalLigne(ligne, hauteur) {
  if (wasmAvailable && wasm && typeof wasm.miroir_vertical_ligne === "function") {
    try {
      return Number(wasm.miroir_vertical_ligne(ligne, hauteur));
    } catch (error) {
      disableWasmRuntime(error);
    }
  }
  return fallbackDomain.miroirVerticalLigne(ligne, hauteur);
}

function coordonneeTuilee(coordonnee, decalage, maximum) {
  if (wasmAvailable && wasm && typeof wasm.coordonnee_tuilee === "function") {
    try {
      return Number(wasm.coordonnee_tuilee(coordonnee, decalage, maximum));
    } catch (error) {
      disableWasmRuntime(error);
    }
  }
  return fallbackDomain.coordonneeTuilee(coordonnee, decalage, maximum);
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

function obtenirOrigineYParDefaut(rows) {
  if (state.initialMode === "top") return 0;
  if (state.initialMode === "bottom") return rows - 1;
  return Math.floor(rows / 2);
}

function analyserPointsInitiaux(raw, cols, rows, yParDefaut) {
  return String(raw || "")
    .split(/[\s,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [rawX, rawY] = entry.split(":");
      const x = clamp(Number.parseInt(rawX, 10), 0, cols - 1);
      const y = rawY == null ? yParDefaut : clamp(Number.parseInt(rawY, 10), 0, rows - 1);
      if (Number.isNaN(x) || Number.isNaN(y)) return null;
      return { x, y };
    })
    .filter(Boolean);
}

function obtenirClePoint(point) {
  return `${point.x}:${point.y}`;
}

function serialiserPoints(points) {
  return points.map((point) => `${point.x}:${point.y}`).join(", ");
}

function activerModePoints() {
  state.initialMode = "custom";
  const input = document.querySelector('input[name="init-mode"][value="custom"]');
  if (input) input.checked = true;
  synchroniserInterfaceModeInitial();
}

function obtenirPointsActifsPersonnalises() {
  const { rows, cols } = obtenirDimensionsRendu();
  return analyserPointsInitiaux(state.pointsInitiaux, cols, rows, obtenirOrigineYParDefaut(rows));
}

function synchroniserCanvasEdition() {
  const canvas = document.getElementById("main-canvas");
  if (!canvas) return;
  canvas.classList.toggle("edition-points", state.initialMode === "custom");
}

function normaliserPositionsInitiales(cols, rows) {
  const yParDefaut = obtenirOrigineYParDefaut(rows);
  if (state.initialMode === "random") {
    const count = clamp(Number.parseInt(state.initialCount || 1, 10), 1, cols);
    const random = mulberry32(Number.parseInt(state.seed || 0, 10));
    const used = new Set();
    while (used.size < count) used.add(Math.floor(random() * cols));
    return [...used].map((x) => ({ x, y: yParDefaut }));
  }
  const pointsPersonnalises = analyserPointsInitiaux(state.pointsInitiaux, cols, rows, yParDefaut);
  if (pointsPersonnalises.length) return pointsPersonnalises;
  return [{ x: Math.floor(cols / 2), y: yParDefaut }];
}

function applyInitialState(grid, cols, rows) {
  const positions = normaliserPositionsInitiales(cols, rows);
  const lignesOrigine = new Set();
  positions.forEach(({ x, y }) => {
    grid[y][x] = 1;
    lignesOrigine.add(y);
  });
  return [...lignesOrigine].sort((a, b) => a - b);
}

function obtenirGraineLigne(baseSeed, ligneSource, ligneCible) {
  return baseSeed + (ligneSource + 1) * 1009 + (ligneCible + 1) * 9176;
}

function obtenirProbabiliteLigne(ligne, totalLignes) {
  const probabiliteSur1000 = probabiliteLigne(
    Math.round(state.probability * 1000),
    state.champProbabiliteActif ? 1 : 0,
    Math.round(state.probabiliteHaut * 1000),
    Math.round(state.probabiliteBas * 1000),
    ligne,
    totalLignes,
  );
  return clamp(probabiliteSur1000 / 1000, 0, 1);
}

function evoluerDepuisPosition(ruleNumber, rows, cols, position, baseSeed) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  const x = clamp(position.x ?? Math.floor(cols / 2), 0, cols - 1);
  const origine = clamp(position.y ?? obtenirOrigineYParDefaut(rows), 0, rows - 1);
  grid[origine][x] = 1;

  for (let row = origine + 1; row < rows; row += 1) {
    grid[row] = getNextGeneration(grid[row - 1], ruleNumber, obtenirGraineLigne(baseSeed, row - 1, row), row, rows);
  }
  for (let row = origine - 1; row >= 0; row -= 1) {
    grid[row] = getNextGeneration(grid[row + 1], ruleNumber, obtenirGraineLigne(baseSeed, row + 1, row), row, rows);
  }

  return grid;
}

function synchroniserInterfaceModeInitial() {
  const optionsAleatoires = document.getElementById("random-opts");
  const optionsPersonnalisees = document.getElementById("custom-opts");
  if (optionsAleatoires) optionsAleatoires.hidden = state.initialMode !== "random";
  if (optionsPersonnalisees) optionsPersonnalisees.hidden = state.initialMode !== "custom";
}

function synchroniserPalettesPoints() {
  const points = obtenirPointsActifsPersonnalises();
  const palettes = {};
  const regles = {};
  points.forEach((point) => {
    const cle = obtenirClePoint(point);
    palettes[cle] = state.palettesPoints[cle] ? clonerCouleurs(state.palettesPoints[cle]) : clonerCouleurs(state.gradientColors);
    regles[cle] = clamp(Number.parseInt(state.reglesPoints[cle] ?? state.rule, 10) || state.rule, 0, 255);
  });
  state.palettesPoints = palettes;
  state.reglesPoints = regles;
  if (pointActif && !palettes[pointActif]) pointActif = "";
}

function obtenirCouleursPoint(point) {
  const couleurs = state.palettesPoints[obtenirClePoint(point)];
  return couleurs && couleurs.length ? couleurs : state.gradientColors;
}

function obtenirReglePoint(point) {
  return clamp(Number.parseInt(state.reglesPoints[obtenirClePoint(point)] ?? state.rule, 10) || state.rule, 0, 255);
}

function appliquerPointsPersonnalises(points, paletteMap = state.palettesPoints, ruleMap = state.reglesPoints, pointSelection = pointActif) {
  state.pointsInitiaux = serialiserPoints(points);
  state.palettesPoints = { ...paletteMap };
  state.reglesPoints = { ...ruleMap };
  pointActif = pointSelection;
  synchroniserPalettesPoints();
  const initPoints = document.getElementById("init-points");
  if (initPoints) initPoints.value = state.pointsInitiaux;
}

function transformerPointsPersonnalises(transformer) {
  const points = obtenirPointsActifsPersonnalises();
  if (points.length === 0) return;
  const nouveauPoints = [];
  const nouvellesPalettes = {};
  const nouvellesRegles = {};
  const vus = new Set();

  const ajouterPoint = (ancienPoint, nouveauPoint) => {
    const cleNouvelle = obtenirClePoint(nouveauPoint);
    if (vus.has(cleNouvelle)) return;
    vus.add(cleNouvelle);
    nouveauPoints.push(nouveauPoint);
    const ancienneCle = obtenirClePoint(ancienPoint);
    nouvellesPalettes[cleNouvelle] = clonerCouleurs(state.palettesPoints[ancienneCle] || state.gradientColors);
    nouvellesRegles[cleNouvelle] = obtenirReglePoint(ancienPoint);
  };

  points.forEach((point) => {
    transformer(point).forEach((resultat) => ajouterPoint(point, resultat));
  });

  appliquerPointsPersonnalises(nouveauPoints, nouvellesPalettes, nouvellesRegles, pointActif);
}

function appliquerSymetrie(type) {
  const { cols, rows } = obtenirDimensionsRendu();
  const maxX = cols - 1;
  const maxY = rows - 1;
  if (type === "miroir-h") {
    transformerPointsPersonnalises((point) => [point, { x: miroirHorizontalColonne(point.x, cols), y: point.y }]);
  } else if (type === "miroir-v") {
    transformerPointsPersonnalises((point) => [point, { x: point.x, y: miroirVerticalLigne(point.y, rows) }]);
  } else if (type === "radial") {
    transformerPointsPersonnalises((point) => [point, { x: miroirHorizontalColonne(point.x, cols), y: miroirVerticalLigne(point.y, rows) }]);
  } else if (type === "tuile") {
    const demiX = Math.max(1, Math.floor(cols / 2));
    const demiY = Math.max(1, Math.floor(rows / 2));
    transformerPointsPersonnalises((point) => [
      point,
      { x: coordonneeTuilee(point.x, demiX, maxX), y: point.y },
      { x: point.x, y: coordonneeTuilee(point.y, demiY, maxY) },
      { x: coordonneeTuilee(point.x, demiX, maxX), y: coordonneeTuilee(point.y, demiY, maxY) },
    ]);
  }
  renderPalettesPoints();
  scheduleRender();
}

function construireCouchesAutomate(ruleNumber, rows, cols) {
  const positions = normaliserPositionsInitiales(cols, rows);
  const baseSeed = Number.parseInt(state.seed || 0, 10);
  if (state.initialMode === "custom") synchroniserPalettesPoints();
  if (positions.length === 0) {
    const position = { x: Math.floor(cols / 2), y: obtenirOrigineYParDefaut(rows) };
    return [{
      position,
      regle: ruleNumber,
      automate: evoluerDepuisPosition(ruleNumber, rows, cols, position, baseSeed),
      couleurs: state.gradientColors,
    }];
  }
  return positions.map((position, index) => ({
    position,
    regle: state.initialMode === "custom" ? obtenirReglePoint(position) : ruleNumber,
    automate: evoluerDepuisPosition(state.initialMode === "custom" ? obtenirReglePoint(position) : ruleNumber, rows, cols, position, baseSeed + index),
    couleurs: state.initialMode === "custom" ? obtenirCouleursPoint(position) : state.gradientColors,
  }));
}

function getNextGeneration(current, ruleNumber, rowSeed, rowIndex = 0, totalRows = 1) {
  const nextGen = [];
  const random = mulberry32(rowSeed);
  const size = current.length;
  const indices = state.direction === "ltr" ? [...Array(size).keys()] : [...Array(size).keys()].reverse();
  const probabiliteCourante = obtenirProbabiliteLigne(rowIndex, totalRows);

  for (const i of indices) {
    if (random() > probabiliteCourante) {
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

function drawCell(ctx, x, y, size, color) {
  if (state.texture === "gradient") {
    const grad = ctx.createRadialGradient(x + size / 2, y + size / 2, 0, x + size / 2, y + size / 2, size / 2);
    grad.addColorStop(0, color);
    grad.addColorStop(1, color.replace(/\)$/, ", 0)"));
    ctx.fillStyle = grad;
  } else if (state.texture === "solid") {
    ctx.fillStyle = color;
  } else {
    const pattern = getTexturePattern(size, color, state.texture, ctx);
    if (pattern) {
      ctx.fillStyle = pattern;
    } else {
      ctx.fillStyle = color;
    }
  }

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

function estLigneVisiblePourCouche(couche, rowIndex, rows) {
  return ligneVisible(Math.round(state.progressionTemporelle * 1000), couche.position.y, rowIndex, rows) === 1;
}

function renderToCanvas(canvas, ruleNumber, rows, cols, cellSize) {
  const ctx = canvas.getContext("2d");
  canvas.width = cols * cellSize;
  canvas.height = rows * cellSize;

  // Fill background
  ctx.fillStyle = `rgb(${state.bgColor.join(",")})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const couches = construireCouchesAutomate(ruleNumber, rows, cols);
  dernieresCouches = couches;
  const canvasWidth = cols * cellSize;
  const canvasHeight = rows * cellSize;
  const collisions = new Set();
  const occupation = new Set();

  couches.forEach((couche) => {
    // Create offscreen canvas for this layer
    const offscreen = new OffscreenCanvas(canvasWidth, canvasHeight);
    const offscreenCtx = offscreen.getContext("2d");

    const gradient = generateGradient(couche.couleurs, rows);
    couche.automate.forEach((row, rowIndex) => {
      if (!estLigneVisiblePourCouche(couche, rowIndex, rows)) return;
      const color = `rgb(${gradient[rowIndex].join(",")})`;
      row.forEach((value, colIndex) => {
        if (value !== 1) return;
        const cleCellule = `${colIndex}:${rowIndex}`;
        if (occupation.has(cleCellule)) collisions.add(cleCellule);
        occupation.add(cleCellule);
        drawCell(offscreenCtx, colIndex * cellSize, rowIndex * cellSize, cellSize, color);
      });
    });

    // Composite layer onto main canvas with blend mode and opacity
    ctx.globalCompositeOperation = state.blendMode;
    ctx.globalAlpha = state.layerOpacity;
    ctx.drawImage(offscreen, 0, 0);
  });

  // Reset to default state
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1.0;

  if (state.pauseSurCollision && animationEtat.actif && collisions.size > 0) {
    arreterAnimation();
  }
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
    pts: state.pointsInitiaux,
    pp: JSON.stringify(state.palettesPoints),
    pr: JSON.stringify(state.reglesPoints),
    count: state.initialCount,
    seed: state.seed,
    circ: state.circular ? "1" : "0",
    prob: state.probability.toFixed(2),
    pfa: state.champProbabiliteActif ? "1" : "0",
    pht: state.probabiliteHaut.toFixed(2),
    pbs: state.probabiliteBas.toFixed(2),
    dir: state.direction,
    bm: state.blendMode,
    lo: state.layerOpacity.toFixed(2),
    tx: state.texture,
    tl: state.progressionTemporelle.toFixed(3),
    as: state.vitesseAnimation.toFixed(1),
    pc: state.pauseSurCollision ? "1" : "0",
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
  if (params.has("pts")) state.pointsInitiaux = params.get("pts");
  if (params.has("pp")) {
    try {
      state.palettesPoints = JSON.parse(params.get("pp"));
    } catch (error) {
      state.palettesPoints = {};
      console.error(error);
    }
  }
  if (params.has("pr")) {
    try {
      state.reglesPoints = JSON.parse(params.get("pr"));
    } catch (error) {
      state.reglesPoints = {};
      console.error(error);
    }
  }
  if (params.has("count")) state.initialCount = Number.parseInt(params.get("count"), 10);
  if (params.has("seed")) state.seed = Number.parseInt(params.get("seed"), 10);
  if (params.has("circ")) state.circular = params.get("circ") === "1";
  if (params.has("prob")) state.probability = Number.parseFloat(params.get("prob"));
  if (params.has("pfa")) state.champProbabiliteActif = params.get("pfa") === "1";
  if (params.has("pht")) state.probabiliteHaut = clamp(Number.parseFloat(params.get("pht")) || 0, 0, 1);
  if (params.has("pbs")) state.probabiliteBas = clamp(Number.parseFloat(params.get("pbs")) || 0, 0, 1);
  if (params.has("dir")) state.direction = params.get("dir");
  if (params.has("bm")) state.blendMode = params.get("bm");
  if (params.has("lo")) state.layerOpacity = clamp(Number.parseFloat(params.get("lo")), 0, 1);
  if (params.has("tx")) state.texture = params.get("tx");
  if (params.has("tl")) state.progressionTemporelle = clamp(Number.parseFloat(params.get("tl")) || 0, 0, 1);
  if (params.has("as")) state.vitesseAnimation = clamp(Number.parseFloat(params.get("as")) || 1.2, 0.1, 6);
  if (params.has("pc")) state.pauseSurCollision = params.get("pc") === "1";
}

function renderMainView() {
  const canvas = document.getElementById("main-canvas");
  const { rows, cols } = obtenirDimensionsRendu();
  renderToCanvas(canvas, state.rule, rows, cols, state.cellSize);

  // Calculate pattern density for audio
  if (audioEngine.active) {
    const couches = construireCouchesAutomate(state.rule, rows, cols);
    let totalCells = 0;
    let liveCells = 0;
    couches.forEach((couche) => {
      couche.automate.forEach((row) => {
        row.forEach((cell) => {
          totalCells++;
          if (cell === 1) liveCells++;
        });
      });
    });
    const density = totalCells > 0 ? liveCells / totalCells : 0;
    const cls = wolframClass(state.rule);
    audioEngine.update(state.rule, cls, density);
  }

  if (sequenceur.active && dernieresCouches) {
    sequenceur.refresh(dernieresCouches, state.rule);
  }
}

function renderColorStops(container, colors, onChange) {
  container.innerHTML = "";
  colors.forEach((color, index) => {
    const row = document.createElement("div");
    row.className = "color-stop";
    const picker = document.createElement("input");
    picker.type = "color";
    picker.value = rgbToHexColor(color);
    picker.addEventListener("input", () => {
      onChange(index, hexToRgb(picker.value));
    });
    row.appendChild(picker);
    if (colors.length > 1) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "ghost-btn";
      remove.textContent = "x";
      remove.addEventListener("click", () => {
        onChange(index, null);
      });
      row.appendChild(remove);
    }
    container.appendChild(row);
  });
}

function renderGradientPickers() {
  const container = document.getElementById("gradient-colors");
  renderColorStops(container, state.gradientColors, (index, color) => {
    if (color) state.gradientColors[index] = color;
    else state.gradientColors.splice(index, 1);
    renderGradientPickers();
    renderPalettesPoints();
    scheduleRender();
  });
}

function renderPalettesPoints() {
  const wrapper = document.getElementById("point-gradients");
  const container = document.getElementById("point-gradient-list");
  const points = obtenirPointsActifsPersonnalises();
  synchroniserPalettesPoints();
  wrapper.hidden = !(state.initialMode === "custom" && points.length > 0);
  container.innerHTML = "";
  if (wrapper.hidden) return;

  points.forEach((point) => {
    const cle = obtenirClePoint(point);
    const couleurs = state.palettesPoints[cle] || clonerCouleurs(state.gradientColors);
    const card = document.createElement("div");
    card.className = "point-gradient-card";
    if (cle === pointActif) card.classList.add("active");

    const head = document.createElement("div");
    head.className = "point-gradient-head";
    head.innerHTML = `<span class="point-gradient-title">Point ${cle}</span><span class="muted">${couleurs.length} couleur${couleurs.length > 1 ? "s" : ""}</span>`;
    card.appendChild(head);

    const meta = document.createElement("div");
    meta.className = "point-meta";
    meta.innerHTML = `<label class="muted" for="rule-point-${cle.replace(":", "-")}">Règle</label>`;
    const inputRule = document.createElement("input");
    inputRule.type = "number";
    inputRule.min = "0";
    inputRule.max = "255";
    inputRule.id = `rule-point-${cle.replace(":", "-")}`;
    inputRule.value = String(obtenirReglePoint(point));
    inputRule.addEventListener("change", (event) => {
      state.reglesPoints[cle] = clamp(Number.parseInt(event.target.value, 10) || state.rule, 0, 255);
      scheduleRender();
      renderPalettesPoints();
    });
    meta.appendChild(inputRule);
    card.appendChild(meta);

    const colors = document.createElement("div");
    colors.className = "stack compact";
    renderColorStops(colors, couleurs, (index, color) => {
      if (color) state.palettesPoints[cle][index] = color;
      else state.palettesPoints[cle].splice(index, 1);
      renderPalettesPoints();
      scheduleRender();
    });
    card.appendChild(colors);

    const actions = document.createElement("div");
    actions.className = "point-card-actions";
    const selectButton = document.createElement("button");
    selectButton.type = "button";
    selectButton.className = "ghost-btn";
    selectButton.textContent = cle === pointActif ? "Point actif" : "Activer";
    selectButton.addEventListener("click", () => {
      pointActif = cle;
      renderPalettesPoints();
    });
    actions.appendChild(selectButton);

    const syncButton = document.createElement("button");
    syncButton.type = "button";
    syncButton.className = "ghost-btn";
    syncButton.textContent = "Règle globale";
    syncButton.addEventListener("click", () => {
      state.reglesPoints[cle] = state.rule;
      renderPalettesPoints();
      scheduleRender();
    });
    actions.appendChild(syncButton);

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "ghost-btn";
    addButton.textContent = "+ Ajouter";
    addButton.addEventListener("click", () => {
      state.palettesPoints[cle].push([255, 255, 255]);
      renderPalettesPoints();
      scheduleRender();
    });
    actions.appendChild(addButton);
    card.appendChild(actions);
    container.appendChild(card);
  });
}

function obtenirCoordonneesCelluleDepuisEvenement(event) {
  const canvas = document.getElementById("main-canvas");
  const rect = canvas.getBoundingClientRect();
  const { cols, rows } = obtenirDimensionsRendu();
  const x = clamp(Math.floor(((event.clientX - rect.left) / rect.width) * cols), 0, cols - 1);
  const y = clamp(Math.floor(((event.clientY - rect.top) / rect.height) * rows), 0, rows - 1);
  return { x, y, cols, rows };
}

function trouverPointLePlusProche(points, cible, rayon = 3) {
  let meilleur = null;
  let meilleureDistance = Number.POSITIVE_INFINITY;
  points.forEach((point, index) => {
    const distance = Math.abs(point.x - cible.x) + Math.abs(point.y - cible.y);
    if (distance <= rayon && distance < meilleureDistance) {
      meilleur = { point, index };
      meilleureDistance = distance;
    }
  });
  return meilleur;
}

function dupliquerCouleursPoint(point) {
  return clonerCouleurs(state.palettesPoints[obtenirClePoint(point)] || state.gradientColors);
}

function appliquerEditionPoints(points, palettes, regles, selection = pointActif) {
  activerModePoints();
  appliquerPointsPersonnalises(points, palettes, regles, selection);
  renderPalettesPoints();
  scheduleRender();
}

function bindCanvasEditor() {
  const canvas = document.getElementById("main-canvas");
  if (!canvas) return;

  canvas.addEventListener("contextmenu", (event) => {
    if (state.initialMode !== "custom") return;
    event.preventDefault();
    const cible = obtenirCoordonneesCelluleDepuisEvenement(event);
    const points = obtenirPointsActifsPersonnalises();
    let proche = trouverPointLePlusProche(points, cible);
    if (!proche) return;
    const palettes = { ...state.palettesPoints };
    const regles = { ...state.reglesPoints };
    const cle = obtenirClePoint(proche.point);
    delete palettes[cle];
    delete regles[cle];
    points.splice(proche.index, 1);
    appliquerEditionPoints(points, palettes, regles, "");
  });

  canvas.addEventListener("pointerdown", (event) => {
    const cible = obtenirCoordonneesCelluleDepuisEvenement(event);
    let points = obtenirPointsActifsPersonnalises();
    let palettes = { ...state.palettesPoints };
    let regles = { ...state.reglesPoints };
    let proche = trouverPointLePlusProche(points, cible);
    activerModePoints();
    synchroniserCanvasEdition();

    if (event.shiftKey && proche) {
      const copie = { x: clamp(proche.point.x + 2, 0, cible.cols - 1), y: clamp(proche.point.y + 2, 0, cible.rows - 1) };
      const cleSource = obtenirClePoint(proche.point);
      const cleCopie = obtenirClePoint(copie);
      points = [...points, copie];
      palettes[cleCopie] = dupliquerCouleursPoint(proche.point);
      regles[cleCopie] = state.reglesPoints[cleSource] ?? state.rule;
      pointActif = cleCopie;
      appliquerEditionPoints(points, palettes, regles, cleCopie);
      return;
    }

    if (!proche) {
      const nouveauPoint = { x: cible.x, y: cible.y };
      const cle = obtenirClePoint(nouveauPoint);
      points = [...points, nouveauPoint];
      palettes[cle] = clonerCouleurs(state.gradientColors);
      regles[cle] = state.rule;
      pointActif = cle;
      appliquerEditionPoints(points, palettes, regles, cle);
      proche = { point: nouveauPoint, index: points.length - 1 };
    } else {
      pointActif = obtenirClePoint(proche.point);
      renderPalettesPoints();
    }

    const pointCourant = proche ? proche.point : { x: cible.x, y: cible.y };
    editeurPoints.actif = true;
    editeurPoints.cle = obtenirClePoint(pointCourant);
    editeurPoints.decalageX = cible.x - pointCourant.x;
    editeurPoints.decalageY = cible.y - pointCourant.y;
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!editeurPoints.actif) return;
    const cible = obtenirCoordonneesCelluleDepuisEvenement(event);
    const points = obtenirPointsActifsPersonnalises();
    const index = points.findIndex((point) => obtenirClePoint(point) === editeurPoints.cle);
    if (index < 0) return;
    const ancienPoint = points[index];
    const nouveauPoint = {
      x: clamp(cible.x - editeurPoints.decalageX, 0, cible.cols - 1),
      y: clamp(cible.y - editeurPoints.decalageY, 0, cible.rows - 1),
    };
    const cleAncienne = obtenirClePoint(ancienPoint);
    const cleNouvelle = obtenirClePoint(nouveauPoint);
    if (cleAncienne === cleNouvelle) return;
    const palettes = { ...state.palettesPoints };
    const regles = { ...state.reglesPoints };
    palettes[cleNouvelle] = palettes[cleAncienne] ? clonerCouleurs(palettes[cleAncienne]) : clonerCouleurs(state.gradientColors);
    regles[cleNouvelle] = regles[cleAncienne] ?? state.rule;
    delete palettes[cleAncienne];
    delete regles[cleAncienne];
    points[index] = nouveauPoint;
    editeurPoints.cle = cleNouvelle;
    pointActif = cleNouvelle;
    appliquerEditionPoints(points, palettes, regles, cleNouvelle);
  });

  const terminerEdition = (event) => {
    if (!editeurPoints.actif) return;
    editeurPoints.actif = false;
    if (event?.pointerId != null && canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  };

  canvas.addEventListener("pointerup", terminerEdition);
  canvas.addEventListener("pointerleave", terminerEdition);
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

function synchroniserInterfaceTemporelle() {
  const timeline = document.getElementById("timeline");
  const timelineDisplay = document.getElementById("timeline-display");
  if (timeline) timeline.value = String(Math.round(state.progressionTemporelle * 1000));
  if (timelineDisplay) timelineDisplay.textContent = `${Math.round(state.progressionTemporelle * 100)}%`;
}

function synchroniserChampProbabilite() {
  const bloc = document.getElementById("probability-field-opts");
  const topDisplay = document.getElementById("prob-top-display");
  const bottomDisplay = document.getElementById("prob-bottom-display");
  if (bloc) bloc.hidden = !state.champProbabiliteActif;
  if (topDisplay) topDisplay.textContent = state.probabiliteHaut.toFixed(2);
  if (bottomDisplay) bottomDisplay.textContent = state.probabiliteBas.toFixed(2);
}

function arreterAnimation() {
  animationEtat.actif = false;
  animationEtat.dernierTemps = 0;
}

function boucleAnimation(timestamp) {
  if (!animationEtat.actif) return;
  if (!animationEtat.dernierTemps) animationEtat.dernierTemps = timestamp;
  const delta = (timestamp - animationEtat.dernierTemps) / 1000;
  animationEtat.dernierTemps = timestamp;
  const { rows } = obtenirDimensionsRendu();
  const amplitude = Math.max(1, rows - 1);
  state.progressionTemporelle = clamp(
    state.progressionTemporelle + ((delta * state.vitesseAnimation * animationEtat.sens) / amplitude),
    0,
    1,
  );
  synchroniserInterfaceTemporelle();
  renderMainView();
  renderPalettesPoints();
  if (state.progressionTemporelle === 0 || state.progressionTemporelle === 1) {
    arreterAnimation();
    return;
  }
  requestAnimationFrame(boucleAnimation);
}

function demarrerAnimation(sens) {
  if (sens > 0 && state.progressionTemporelle >= 1) state.progressionTemporelle = 0;
  if (sens < 0 && state.progressionTemporelle <= 0) state.progressionTemporelle = 1;
  animationEtat.sens = sens;
  animationEtat.actif = true;
  animationEtat.dernierTemps = 0;
  synchroniserInterfaceTemporelle();
  requestAnimationFrame(boucleAnimation);
}

const scheduleRender = debounce(() => {
  renderMainView();
  renderPalettesPoints();
  synchroniserInterfaceTemporelle();
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

function initTheme() {
  let theme = localStorage.getItem("theme");
  if (!theme) {
    theme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  applyTheme(theme);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("theme", theme);

  const darkBg = [8, 17, 31];
  const lightBg = [244, 247, 250];
  state.bgColor = theme === "light" ? lightBg : darkBg;

  const btn = document.getElementById("btn-theme");
  if (btn) {
    btn.textContent = theme === "light" ? "🌙" : "☀";
  }

  const bgColorInput = document.getElementById("bg-color");
  if (bgColorInput) {
    bgColorInput.value = rgbToHexColor(state.bgColor);
  }
}

function analyserMotifMusical(couches) {
  const grille = couches.flatMap(c => c.automate);
  const lignes = grille.length;
  const colonnes = lignes > 0 ? grille[0].length : 0;
  if (lignes === 0 || colonnes === 0) return null;

  let transitions = 0;
  for (let r = 1; r < lignes; r++)
    for (let c = 0; c < colonnes; c++)
      if (grille[r][c] !== grille[r - 1][c]) transitions++;
  const vitesse = (lignes > 1) ? transitions / ((lignes - 1) * colonnes) : 0;

  let concordances = 0, totalSym = 0;
  for (let r = 0; r < lignes; r++)
    for (let c = 0; c < Math.floor(colonnes / 2); c++) {
      if (grille[r][c] === grille[r][colonnes - 1 - c]) concordances++;
      totalSym++;
    }
  const symetrie = totalSym > 0 ? concordances / totalSym : 1;

  let sommePonderee = 0, totalVivantes = 0;
  for (let r = 0; r < lignes; r++)
    for (let c = 0; c < colonnes; c++)
      if (grille[r][c] === 1) { sommePonderee += c; totalVivantes++; }
  const centreX = totalVivantes > 0 ? sommePonderee / totalVivantes / colonnes : 0.5;

  let courseMax = 0;
  for (let r = 0; r < lignes; r++) {
    let course = 0;
    for (let c = 0; c < colonnes; c++) {
      if (grille[r][c] === 1) { course++; if (course > courseMax) courseMax = course; }
      else course = 0;
    }
  }

  const densite = totalVivantes / (lignes * colonnes);

  return { vitesse, symetrie, centreX, courseMax, colonnes, densite };
}

function paramsMusicauxDepuisMotif(stats, ruleNumber) {
  const vitesse1000 = Math.round(stats.vitesse * 1000);
  const symetrie1000 = Math.round(stats.symetrie * 1000);
  const centre1000 = Math.round(stats.centreX * 1000);
  const densite1000 = Math.round(stats.densite * 1000);
  const cls = wasmAvailable && wasm && wasm.classe_wolfram
    ? wasm.classe_wolfram(ruleNumber)
    : fallbackDomain.wolframClass(ruleNumber);

  const bpm = wasmAvailable && wasm && wasm.tempo_depuis_vitesse
    ? wasm.tempo_depuis_vitesse(vitesse1000)
    : 60 + Math.floor(vitesse1000 * 120 / 1000);

  const gammeCode = wasmAvailable && wasm && wasm.gamme_depuis_classe
    ? wasm.gamme_depuis_classe(cls)
    : [0, 1, 2, 3][cls - 1] ?? 1;

  const reverbAmount = wasmAvailable && wasm && wasm.reverb_depuis_symetrie
    ? wasm.reverb_depuis_symetrie(symetrie1000) / 1000
    : stats.symetrie;

  const panRaw = wasmAvailable && wasm && wasm.pan_depuis_centre
    ? wasm.pan_depuis_centre(centre1000)
    : (centre1000 - 500);
  const pan = panRaw / 500;

  const octave = wasmAvailable && wasm && wasm.octave_depuis_course
    ? wasm.octave_depuis_course(stats.courseMax, stats.colonnes)
    : (stats.courseMax / stats.colonnes > 0.6 ? 5 : stats.courseMax / stats.colonnes > 0.3 ? 4 : 3);

  const dureeNote = wasmAvailable && wasm && wasm.duree_note_depuis_densite
    ? wasm.duree_note_depuis_densite(densite1000)
    : (stats.densite > 0.7 ? 80 : stats.densite > 0.4 ? 150 : 250);

  return { bpm, gammeCode, reverbAmount, pan, octave, dureeNote };
}

const GAMMES = {
  0: [0, 2, 4, 7, 9],
  1: [0, 2, 4, 5, 7, 9, 11],
  2: [0,1,2,3,4,5,6,7,8,9,10,11],
  3: [0, 2, 4, 6, 8, 10],
};

const GAMME_NOMS = ["Pentatonique", "Diatonique", "Chromatique", "Ton entier"];

const BASE_MIDI = 60;

function midiToHz(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const audioEngine = {
  ctx: null,
  osc: null,
  osc2: null,
  filter: null,
  gain: null,
  master: null,
  delay: null,
  feedback: null,
  active: false,

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.18;
    this.master.connect(this.ctx.destination);

    this.gain = this.ctx.createGain();
    this.gain.gain.value = 1;
    this.gain.connect(this.master);

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.value = 2000;
    this.filter.Q.value = 2;
    this.filter.connect(this.gain);

    this.delay = this.ctx.createDelay(1);
    this.delay.delayTime.value = 0.15;
    this.delay.connect(this.gain);

    this.feedback = this.ctx.createGain();
    this.feedback.gain.value = 0.25;
    this.feedback.connect(this.delay);
    this.delay.connect(this.feedback);

    this.createOscillators();
  },

  createOscillators() {
    if (this.osc) this.osc.stop();
    if (this.osc2) this.osc2.stop();

    this.osc = this.ctx.createOscillator();
    this.osc2 = this.ctx.createOscillator();

    this.osc.connect(this.filter);
    this.osc2.connect(this.filter);

    // Use WASM functions when available, fall back to JS
    const baseFreq = wasmAvailable && wasm && wasm.frequence_fondamentale
      ? wasm.frequence_fondamentale(state.rule)
      : fallbackDomain.frequenceFondamentale(state.rule);

    this.osc.frequency.value = baseFreq;
    this.osc2.frequency.value = baseFreq * 1.5;

    const waveform = wasmAvailable && wasm && wasm.forme_onde_synthese
      ? (() => {
          const codes = ["sine", "triangle", "sawtooth", "square"];
          const idx = Math.max(0, Math.min(3, Math.floor(wasm.forme_onde_synthese(state.rule)) - 1));
          return codes[idx] || "sine";
        })()
      : fallbackDomain.formeOndeSynthese(state.rule);

    this.osc.type = waveform;
    this.osc2.type = waveform;

    const detune = wasmAvailable && wasm && wasm.desaccord_oscillateur_secondaire
      ? wasm.desaccord_oscillateur_secondaire(state.rule)
      : fallbackDomain.desaccordSecondaire(state.rule);

    this.osc2.detune.value = detune;
    const gain2 = this.ctx.createGain();
    gain2.gain.value = 0.3;
    this.osc2.connect(gain2);
    gain2.connect(this.filter);

    this.osc.start();
    this.osc2.start();
  },

  start() {
    if (!this.ctx) this.init();
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    this.createOscillators();
    this.active = true;
  },

  stop() {
    if (this.osc) this.osc.stop();
    if (this.osc2) this.osc2.stop();
    if (this.ctx) this.ctx.suspend();
    this.active = false;
  },

  update(ruleNumber, wolframCls, density) {
    if (!this.active || !this.ctx) return;

    const baseFreq = wasmAvailable && wasm && wasm.frequence_fondamentale
      ? wasm.frequence_fondamentale(ruleNumber)
      : fallbackDomain.frequenceFondamentale(ruleNumber);

    if (this.osc) {
      this.osc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.05);
    }
    if (this.osc2) {
      this.osc2.frequency.setTargetAtTime(baseFreq * 1.5, this.ctx.currentTime, 0.05);
    }
    if (this.filter) {
      const cutoff = 200 + density * 3000;
      this.filter.frequency.setTargetAtTime(cutoff, this.ctx.currentTime, 0.1);
    }
  },
};

const sequenceur = {
  ctx: null,
  master: null,
  timer: null,
  active: false,
  rowIndex: 0,
  params: null,
  grille: null,

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.25;
    this.master.connect(this.ctx.destination);
  },

  jouerNote(freq, dureeMs, pan) {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    const panner = this.ctx.createStereoPanner();
    osc.type = "sine";
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0.3, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + dureeMs / 1000);
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    osc.connect(env);
    env.connect(panner);
    panner.connect(this.master);
    osc.start(t);
    osc.stop(t + dureeMs / 1000 + 0.05);
  },

  jouerRang(row, params) {
    if (!row || !params) return;
    const gamme = GAMMES[params.gammeCode] || GAMMES[1];
    const cols = row.length;
    const noteBase = (params.octave - 4) * 12 + BASE_MIDI;

    row.forEach((cell, col) => {
      if (cell !== 1) return;
      const degre = wasmAvailable && wasm && wasm.note_depuis_colonne
        ? wasm.note_depuis_colonne(col, cols, gamme.length)
        : Math.floor(col * gamme.length / cols) % gamme.length;
      const semitones = gamme[degre];
      const freq = midiToHz(noteBase + semitones);
      this.jouerNote(freq, params.dureeNote, params.pan);
    });
  },

  tick() {
    if (!this.active || !this.grille || !this.params) return;
    const lignes = this.grille.length;
    if (lignes === 0) return;
    this.rowIndex = this.rowIndex % lignes;
    this.jouerRang(this.grille[this.rowIndex], this.params);
    const seqRow = document.getElementById("seq-row");
    if (seqRow) seqRow.textContent = this.rowIndex + 1;
    this.rowIndex++;
  },

  start(couches, ruleNumber) {
    this.init();
    if (this.ctx.state === "suspended") this.ctx.resume();
    const stats = analyserMotifMusical(couches);
    if (!stats) return;
    this.params = paramsMusicauxDepuisMotif(stats, ruleNumber);
    this.grille = couches.flatMap(c => c.automate);
    this.rowIndex = 0;
    this.active = true;
    this.updateStatusUI();
    const intervalMs = Math.round(60000 / this.params.bpm);
    this.timer = setInterval(() => this.tick(), intervalMs);
  },

  stop() {
    this.active = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (this.ctx) this.ctx.suspend();
  },

  refresh(couches, ruleNumber) {
    if (!this.active) return;
    const stats = analyserMotifMusical(couches);
    if (!stats) return;
    this.params = paramsMusicauxDepuisMotif(stats, ruleNumber);
    this.grille = couches.flatMap(c => c.automate);
    const intervalMs = Math.round(60000 / this.params.bpm);
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), intervalMs);
    this.updateStatusUI();
  },

  updateStatusUI() {
    const status = document.getElementById("seq-status");
    const tempoEl = document.getElementById("seq-tempo");
    const gammeEl = document.getElementById("seq-gamme");
    if (status) status.hidden = false;
    if (tempoEl && this.params) tempoEl.textContent = this.params.bpm;
    if (gammeEl && this.params) gammeEl.textContent = GAMME_NOMS[this.params.gammeCode] ?? "—";
  },
};

function bindControls() {
  const presets = document.getElementById("presets");

  document.getElementById("btn-theme").addEventListener("click", () => {
    const currentTheme = document.documentElement.dataset.theme || "dark";
    const newTheme = currentTheme === "light" ? "dark" : "light";
    applyTheme(newTheme);
    scheduleRender();
  });

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

  document.querySelectorAll('input[name="texture"]').forEach((input) => {
    if (input.value === state.texture) input.checked = true;
    input.addEventListener("change", () => {
      state.texture = input.value;
      patternCache.clear();
      scheduleRender();
    });
  });

  document.querySelectorAll('input[name="init-mode"]').forEach((input) => {
    if (input.value === state.initialMode) input.checked = true;
    input.addEventListener("change", () => {
      state.initialMode = input.value;
      synchroniserInterfaceModeInitial();
      synchroniserCanvasEdition();
      renderPalettesPoints();
      scheduleRender();
    });
  });

  const initCount = document.getElementById("init-count");
  const initPoints = document.getElementById("init-points");
  const initSeed = document.getElementById("init-seed");
  initCount.value = String(state.initialCount);
  initPoints.value = state.pointsInitiaux;
  initSeed.value = String(state.seed);
  initCount.addEventListener("change", (event) => {
    state.initialCount = Number.parseInt(event.target.value, 10) || 1;
    scheduleRender();
  });
  initPoints.addEventListener("input", (event) => {
    state.pointsInitiaux = event.target.value;
    if (state.pointsInitiaux.trim()) {
      activerModePoints();
      synchroniserCanvasEdition();
    }
    renderPalettesPoints();
    scheduleRender();
  });
  initSeed.addEventListener("change", (event) => {
    state.seed = Number.parseInt(event.target.value, 10) || 0;
    scheduleRender();
  });
  synchroniserInterfaceModeInitial();
  synchroniserCanvasEdition();
  renderPalettesPoints();

  const bgColor = document.getElementById("bg-color");
  bgColor.value = rgbToHexColor(state.bgColor);
  bgColor.addEventListener("input", (event) => {
    state.bgColor = hexToRgb(event.target.value);
    scheduleRender();
  });

  document.getElementById("btn-add-color").addEventListener("click", () => {
    state.gradientColors.push([255, 255, 255]);
    renderGradientPickers();
    renderPalettesPoints();
    scheduleRender();
  });

  const blendMode = document.getElementById("blend-mode");
  blendMode.value = state.blendMode;
  blendMode.addEventListener("change", (event) => {
    state.blendMode = event.target.value;
    scheduleRender();
  });

  const layerOpacity = document.getElementById("layer-opacity");
  const opacityDisplay = document.getElementById("opacity-display");
  layerOpacity.value = String(state.layerOpacity);
  opacityDisplay.textContent = state.layerOpacity.toFixed(2);
  layerOpacity.addEventListener("input", (event) => {
    state.layerOpacity = clamp(Number.parseFloat(event.target.value) || 0, 0, 1);
    opacityDisplay.textContent = state.layerOpacity.toFixed(2);
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

  const probabilityFieldActive = document.getElementById("probability-field-active");
  const probabilityTop = document.getElementById("probability-top");
  const probabilityBottom = document.getElementById("probability-bottom");
  probabilityFieldActive.checked = state.champProbabiliteActif;
  probabilityTop.value = String(state.probabiliteHaut);
  probabilityBottom.value = String(state.probabiliteBas);
  synchroniserChampProbabilite();
  probabilityFieldActive.addEventListener("change", () => {
    state.champProbabiliteActif = probabilityFieldActive.checked;
    synchroniserChampProbabilite();
    scheduleRender();
  });
  probabilityTop.addEventListener("input", (event) => {
    state.probabiliteHaut = clamp(Number.parseFloat(event.target.value) || 0, 0, 1);
    synchroniserChampProbabilite();
    scheduleRender();
  });
  probabilityBottom.addEventListener("input", (event) => {
    state.probabiliteBas = clamp(Number.parseFloat(event.target.value) || 0, 0, 1);
    synchroniserChampProbabilite();
    scheduleRender();
  });

  document.querySelectorAll('input[name="direction"]').forEach((input) => {
    if (input.value === state.direction) input.checked = true;
    input.addEventListener("change", () => {
      state.direction = input.value;
      scheduleRender();
    });
  });

  const timeline = document.getElementById("timeline");
  const animationSpeed = document.getElementById("animation-speed");
  const animationSpeedDisplay = document.getElementById("animation-speed-display");
  const pauseCollision = document.getElementById("pause-collision");
  synchroniserInterfaceTemporelle();
  animationSpeed.value = String(state.vitesseAnimation);
  animationSpeedDisplay.textContent = `${state.vitesseAnimation.toFixed(1)}x`;
  pauseCollision.checked = state.pauseSurCollision;
  timeline.addEventListener("input", (event) => {
    arreterAnimation();
    state.progressionTemporelle = clamp((Number.parseInt(event.target.value, 10) || 0) / 1000, 0, 1);
    synchroniserInterfaceTemporelle();
    scheduleRender();
  });
  animationSpeed.addEventListener("input", (event) => {
    state.vitesseAnimation = clamp(Number.parseFloat(event.target.value) || 1.2, 0.1, 6);
    animationSpeedDisplay.textContent = `${state.vitesseAnimation.toFixed(1)}x`;
  });
  pauseCollision.addEventListener("change", () => {
    state.pauseSurCollision = pauseCollision.checked;
  });
  document.getElementById("btn-play-forward").addEventListener("click", () => demarrerAnimation(1));
  document.getElementById("btn-play-reverse").addEventListener("click", () => demarrerAnimation(-1));
  document.getElementById("btn-pause-animation").addEventListener("click", () => arreterAnimation());

  document.getElementById("btn-mirror-h").addEventListener("click", () => appliquerSymetrie("miroir-h"));
  document.getElementById("btn-mirror-v").addEventListener("click", () => appliquerSymetrie("miroir-v"));
  document.getElementById("btn-radial").addEventListener("click", () => appliquerSymetrie("radial"));
  document.getElementById("btn-tile").addEventListener("click", () => appliquerSymetrie("tuile"));

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

  document.getElementById("btn-sound").addEventListener("click", () => {
    const btn = document.getElementById("btn-sound");
    if (audioEngine.active) {
      audioEngine.stop();
      btn.textContent = "▶ Son";
    } else {
      audioEngine.start();
      btn.textContent = "⏹ Son";
    }
  });

  const btnSeq = document.getElementById("btn-sequencer");
  if (btnSeq) {
    btnSeq.addEventListener("click", () => {
      if (sequenceur.active) {
        sequenceur.stop();
        btnSeq.textContent = "▶ Séquenceur";
        const status = document.getElementById("seq-status");
        if (status) status.hidden = true;
      } else {
        const couches = dernieresCouches || construireCouchesAutomate(state.rule, ...obtenirDimensionsRendu());
        sequenceur.start(couches, state.rule);
        btnSeq.textContent = "⏹ Séquenceur";
      }
    });
  }

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

function initSidebarTabs() {
  const tabButtons = document.querySelectorAll('.sidebar-tab-btn');
  const tabPanels = document.querySelectorAll('.sidebar-tab-panel');
  const storageKey = 'sidebar-active-tab';

  const restoreTabState = () => {
    const savedTab = localStorage.getItem(storageKey) || 'affichage';
    switchToTab(savedTab);
  };

  const switchToTab = (tabName) => {
    tabButtons.forEach((btn) => btn.classList.remove('active'));
    tabPanels.forEach((panel) => panel.classList.remove('active'));

    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    const activePanel = document.querySelector(`.sidebar-tab-panel[data-tab="${tabName}"]`);

    if (activeBtn) activeBtn.classList.add('active');
    if (activePanel) activePanel.classList.add('active');

    localStorage.setItem(storageKey, tabName);
  };

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tabName = btn.getAttribute('data-tab');
      switchToTab(tabName);
    });
  });

  restoreTabState();
}

async function init() {
  initTheme();
  loadFromURL();
  initSidebarTabs();
  bindControls();
  bindCanvasEditor();
  bindGallery();
  renderGradientPickers();
  renderPalettesPoints();
  syncRuleControls();
  renderRuleDiagram();
  renderMainView();
  await loadWasm();
  renderRuleDiagram();
  scheduleRender();
}

init();
