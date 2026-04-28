const COLOR_THEMES = [
  {
    id: "cosmos",
    label: "Cosmos",
    bgColor: [8, 17, 31],
    gradientColors: [[255, 157, 77], [255, 209, 102], [83, 176, 255]],
  },
  {
    id: "nature",
    label: "Nature",
    bgColor: [5, 18, 10],
    gradientColors: [[0, 200, 80], [180, 240, 60], [30, 120, 40]],
  },
  {
    id: "espace",
    label: "Espace",
    bgColor: [2, 2, 18],
    gradientColors: [[120, 60, 220], [60, 180, 255], [255, 255, 255]],
  },
  {
    id: "feu",
    label: "Feu",
    bgColor: [10, 3, 0],
    gradientColors: [[255, 60, 0], [255, 180, 0], [255, 240, 160]],
  },
  {
    id: "ocean",
    label: "Océan",
    bgColor: [3, 10, 22],
    gradientColors: [[0, 60, 180], [0, 180, 200], [150, 240, 255]],
  },
  {
    id: "aurore",
    label: "Aurore",
    bgColor: [2, 8, 18],
    gradientColors: [[0, 240, 160], [180, 60, 255], [60, 200, 255]],
  },
  {
    id: "lave",
    label: "Lave",
    bgColor: [10, 2, 2],
    gradientColors: [[200, 0, 50], [255, 80, 0], [255, 220, 100]],
  },
  {
    id: "fantome",
    label: "Fantôme",
    bgColor: [5, 5, 10],
    gradientColors: [[60, 60, 100], [200, 200, 255], [255, 255, 255]],
  },
];

const DEFAULTS = {
  rule: 90,
  cellSize: 3,
  bgColor: [8, 17, 31],
  gradientColors: [[255, 157, 77], [255, 209, 102], [83, 176, 255]],
  palettesPoints: {},
  reglesPoints: {},
  optionsPoints: {},
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
  propagationMode: "both",
  propagationAngle: 90,
  blendMode: "source-over",
  layerOpacity: 1.0,
  texture: "solid",
  progressionTemporelle: 1,
  vitesseAnimation: 1.2,
  pauseSurCollision: false,
  morphingActive: false,
  morphTargetRule: 110,
  morphIntensity: 0,
  explorerTool: "inspect",
  explorerEventType: "pulse",
  explorerEventRadius: 12,
  explorerEventStrength: 0.8,
  labShapeType: "circle",
  labGeometryMode: "inside",
  labShapeX: 150,
  labShapeY: 90,
  labShapeWidth: 48,
  labShapeHeight: 30,
  labShapeInner: 12,
  labFieldBrush: 14,
  labFieldStrength: 0.8,
  labFieldMode: "paint",
  labEventType: "pulse",
  labEventRadius: 14,
  labEventStrength: 0.8,
  labShowMask: true,
  labShowField: true,
  labShowEvents: true,
};

const DEFAULT_MATTER_LAB_RULE = 30;

const fallbackDomain = {
  transition(ruleNumber, left, center, right) {
    const index = left * 4 + center * 2 + right;
    return Math.floor(ruleNumber / (2 ** index)) % 2;
  },
  patternOutput(ruleNumber, patternIndex) {
    return Math.floor(ruleNumber / (2 ** patternIndex)) % 2;
  },
  patternCode(left, center, right) {
    return left * 4 + center * 2 + right;
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
  progressionMorphosee(distance, distanceMax, intensiteSur1000) {
    const intensite = clamp(intensiteSur1000, 0, 1000);
    if (distanceMax <= 0) return intensite;
    const progressionLocale = Math.floor((Math.min(Math.abs(distance), distanceMax) * 1000) / distanceMax);
    return Math.floor((progressionLocale * intensite) / 1000);
  },
  ruleMorphee(ruleSource, ruleTarget, progressScaled) {
    const progression = clamp(progressScaled, 0, 1000);
    let rule = 0;
    for (let motif = 0; motif < 8; motif += 1) {
      const threshold = Math.floor(((motif + 1) * 1000) / 8);
      const sourceBit = Math.floor(ruleSource / (2 ** motif)) % 2;
      const targetBit = Math.floor(ruleTarget / (2 ** motif)) % 2;
      const bit = progression >= threshold ? targetBit : sourceBit;
      rule += bit * (2 ** motif);
    }
    return rule;
  },
  celluleMorphosee(ruleSource, ruleTarget, progressScaled, left, center, right) {
    const rule = this.ruleMorphee(ruleSource, ruleTarget, progressScaled);
    return this.transition(rule, left, center, right);
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
  laboratoireFormeContient(shapeCode, x, y, centerX, centerY, sizeA, sizeB, innerRadius) {
    if (shapeCode === 4) {
      return x === centerX && y === centerY ? 1 : 0;
    }
    if (shapeCode === 1) {
      return Math.abs(x - centerX) <= sizeA && Math.abs(y - centerY) <= sizeB ? 1 : 0;
    }
    const dx = x - centerX;
    const dy = y - centerY;
    const distanceSquared = dx * dx + dy * dy;
    if (shapeCode === 2) {
      return distanceSquared <= sizeA * sizeA ? 1 : 0;
    }
    if (shapeCode === 3) {
      const outer = Math.max(sizeA, innerRadius);
      return distanceSquared >= innerRadius * innerRadius && distanceSquared <= outer * outer ? 1 : 0;
    }
    return 0;
  },
  laboratoireModeAutorise(modeCode, contains) {
    if (modeCode === 0) return 1;
    if (modeCode === 1) return contains === 1 ? 1 : 0;
    if (modeCode === 2 || modeCode === 3) return contains === 1 ? 0 : 1;
    return 1;
  },
  laboratoireIntensiteRadiale(x, y, centerX, centerY, radius) {
    if (radius <= 0) return x === centerX && y === centerY ? 1000 : 0;
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > radius) return 0;
    return clamp(Math.round((1 - distance / radius) * 1000), 0, 1000);
  },
  laboratoireProbabiliteModifiee(baseProbability, fieldValue) {
    return clamp(Math.round((baseProbability * clamp(fieldValue, 0, 2000)) / 1000), 0, 1000);
  },
  laboratoireCelluleEvenement(initialValue, eventCode, intensity, threshold) {
    if (intensity < threshold) return initialValue;
    if (eventCode === 1) return 1;
    if (eventCode === 2) return 0;
    if (eventCode === 3) return initialValue === 1 ? 0 : 1;
    return initialValue;
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
const explorerLab = {
  frozenCols: 0,
  frozenRows: 0,
  frozenData: new Int16Array(0),
  events: [],
  painting: false,
  selection: null,
  lastRender: null,
};
const matterLab = {
  fieldCols: 0,
  fieldRows: 0,
  fieldData: new Uint16Array(0),
  frozenCols: 0,
  frozenRows: 0,
  frozenData: new Int16Array(0),
  events: [],
  primaryGeometry: null,
  barriers: [],
  lastRender: null,
  activeTab: "geometry",
  painting: false,
  defaultRuleApplied: false,
};

function createDotsPattern(size, color, ctx) {
  const canvas = createScratchCanvas(size, size);
  const c = canvas.getContext("2d");
  c.fillStyle = color;
  c.beginPath();
  c.arc(size / 2, size / 2, size / 6, 0, Math.PI * 2);
  c.fill();
  return ctx.createPattern(canvas, "repeat");
}

function createCrosshatchPattern(size, color, ctx) {
  const canvas = createScratchCanvas(size, size);
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
  const canvas = createScratchCanvas(size, size);
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

function normaliserHexSaisie(value) {
  const brut = String(value || "").trim().replace(/^#/, "");
  if (!brut) return "";
  if (!/^[0-9a-fA-F]+$/.test(brut)) return null;
  if (brut.length === 3) {
    return `#${brut.split("").map((char) => char + char).join("").toUpperCase()}`;
  }
  if (brut.length === 6) return `#${brut.toUpperCase()}`;
  return null;
}

function rgbToHex([r, g, b]) {
  return [r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function rgbToHexColor(rgb) {
  return `#${rgbToHex(rgb).toUpperCase()}`;
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

function assetUrl(path) {
  const script = document.querySelector('script[src$="ui.js"]');
  return new URL(path, script?.src || location.href);
}

function createScratchCanvas(width, height) {
  if (typeof OffscreenCanvas === "function") {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
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
    const response = await fetch(assetUrl("cellcosmos.wasm"));
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
    window.cellcosmosWasm = instance.exports;
    wasmAvailable = true;
    if (validateWasmExports(instance.exports)) {
      status.textContent = "Moteur WASM charg\u00e9 depuis les sources Multilingual.";
    } else {
      wasm = null;
      window.cellcosmosWasm = null;
      wasmAvailable = false;
      status.textContent = "Moteur WASM invalide, repli sur le moteur JavaScript.";
      console.warn("Exports WASM incompatibles avec l'interface Cellcosmos; repli JavaScript actif.");
    }
  } catch (error) {
    wasm = null;
    window.cellcosmosWasm = null;
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

    if (typeof exports.laboratoire_forme_contient === "function") {
      if (Number(exports.laboratoire_forme_contient(4, 10, 12, 10, 12, 0, 0, 0)) !== 1) {
        return false;
      }
      if (Number(exports.laboratoire_forme_contient(4, 10, 11, 10, 12, 0, 0, 0)) !== 0) {
        return false;
      }
      if (Number(exports.laboratoire_forme_contient(4, 9, 12, 10, 12, 0, 0, 0)) !== 0) {
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
      if (!Number.isFinite(freq) || freq < 100 || freq > 2000) {
        return false;
      }
    }

    if (typeof exports.forme_onde_synthese === "function") {
      const waveform = Number(exports.forme_onde_synthese(30));
      if (!Number.isFinite(waveform) || waveform < 1 || waveform > 4) {
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
      if (!Number.isFinite(tempo) || tempo < 60 || tempo > 180) {
        return false;
      }
    }

    if (typeof exports.gamme_depuis_classe === "function") {
      const gamme = Number(exports.gamme_depuis_classe(2));
      if (!Number.isFinite(gamme) || gamme < 0 || gamme > 3) {
        return false;
      }
    }

    if (typeof exports.octave_depuis_course === "function") {
      const octave = Number(exports.octave_depuis_course(10, 100));
      if (!Number.isFinite(octave) || octave < 3 || octave > 5) {
        return false;
      }
    }

    if (typeof exports.probabilite_ligne === "function") {
      const probabilite = Number(exports.probabilite_ligne(1000, 1, 1000, 500, 10, 100));
      if (!Number.isFinite(probabilite) || probabilite < 0 || probabilite > 1000) {
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

function patternCode(left, center, right) {
  if (wasmAvailable && wasm && typeof wasm.code_motif === "function") {
    try {
      return Number(wasm.code_motif(left, center, right));
    } catch (error) {
      disableWasmRuntime(error);
    }
  }
  return fallbackDomain.patternCode(left, center, right);
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

function progressionMorphosee(distance, distanceMax, intensiteSur1000) {
  if (wasmAvailable && wasm && typeof wasm.progression_morphosee === "function") {
    try {
      return Number(wasm.progression_morphosee(distance, distanceMax, intensiteSur1000));
    } catch (error) {
      disableWasmRuntime(error);
    }
  }
  return fallbackDomain.progressionMorphosee(distance, distanceMax, intensiteSur1000);
}

function ruleMorphee(ruleSource, ruleTarget, progressScaled) {
  if (wasmAvailable && wasm && typeof wasm.regle_morphee === "function") {
    try {
      return Number(wasm.regle_morphee(ruleSource, ruleTarget, progressScaled));
    } catch (error) {
      disableWasmRuntime(error);
    }
  }
  return fallbackDomain.ruleMorphee(ruleSource, ruleTarget, progressScaled);
}

function celluleMorphosee(ruleSource, ruleTarget, progressScaled, left, center, right) {
  if (wasmAvailable && wasm && typeof wasm.cellule_morphosee === "function") {
    try {
      return Number(wasm.cellule_morphosee(ruleSource, ruleTarget, progressScaled, left, center, right));
    } catch (error) {
      disableWasmRuntime(error);
    }
  }
  return fallbackDomain.celluleMorphosee(ruleSource, ruleTarget, progressScaled, left, center, right);
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

function laboratoireFormeContient(shapeCode, x, y, centerX, centerY, sizeA, sizeB, innerRadius) {
  if (wasmAvailable && wasm && typeof wasm.laboratoire_forme_contient === "function") {
    try {
      return Number(wasm.laboratoire_forme_contient(shapeCode, x, y, centerX, centerY, sizeA, sizeB, innerRadius));
    } catch (error) {
      disableWasmRuntime(error);
    }
  }
  return fallbackDomain.laboratoireFormeContient(shapeCode, x, y, centerX, centerY, sizeA, sizeB, innerRadius);
}

function laboratoireModeAutorise(modeCode, contains) {
  if (wasmAvailable && wasm && typeof wasm.laboratoire_mode_autorise === "function") {
    try {
      return Number(wasm.laboratoire_mode_autorise(modeCode, contains));
    } catch (error) {
      disableWasmRuntime(error);
    }
  }
  return fallbackDomain.laboratoireModeAutorise(modeCode, contains);
}

function laboratoireIntensiteRadiale(x, y, centerX, centerY, radius) {
  if (wasmAvailable && wasm && typeof wasm.laboratoire_intensite_radiale === "function") {
    try {
      return Number(wasm.laboratoire_intensite_radiale(x, y, centerX, centerY, radius));
    } catch (error) {
      disableWasmRuntime(error);
    }
  }
  return fallbackDomain.laboratoireIntensiteRadiale(x, y, centerX, centerY, radius);
}

function laboratoireProbabiliteModifiee(baseProbability, fieldValue) {
  if (wasmAvailable && wasm && typeof wasm.laboratoire_probabilite_modifiee === "function") {
    try {
      return Number(wasm.laboratoire_probabilite_modifiee(baseProbability, fieldValue));
    } catch (error) {
      disableWasmRuntime(error);
    }
  }
  return fallbackDomain.laboratoireProbabiliteModifiee(baseProbability, fieldValue);
}

function laboratoireCelluleEvenement(initialValue, eventCode, intensity, threshold) {
  if (wasmAvailable && wasm && typeof wasm.laboratoire_cellule_evenement === "function") {
    try {
      return Number(wasm.laboratoire_cellule_evenement(initialValue, eventCode, intensity, threshold));
    } catch (error) {
      disableWasmRuntime(error);
    }
  }
  return fallbackDomain.laboratoireCelluleEvenement(initialValue, eventCode, intensity, threshold);
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
  window.cellcosmosWasm = null;
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
  canvas.classList.toggle("edition-points", state.explorerTool === "points" && state.initialMode === "custom");
  canvas.classList.toggle("inspect-mode", state.explorerTool === "inspect");
  canvas.classList.toggle("perturb-mode", state.explorerTool === "perturb");
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
  return obtenirProbabiliteLigneAvecOptions(ligne, totalLignes, state);
}

function obtenirProbabiliteLigneAvecOptions(ligne, totalLignes, options) {
  const probabiliteSur1000 = probabiliteLigne(
    Math.round((options.probability ?? state.probability) * 1000),
    options.champProbabiliteActif ? 1 : 0,
    Math.round((options.probabiliteHaut ?? state.probabiliteHaut) * 1000),
    Math.round((options.probabiliteBas ?? state.probabiliteBas) * 1000),
    ligne,
    totalLignes,
  );
  return clamp(probabiliteSur1000 / 1000, 0, 1);
}

function obtenirProgressionMorphosee(rowIndex, originRow, totalRows, intensite = state.morphIntensity) {
  if (intensite <= 0) return 0;
  return progressionMorphosee(
    Math.abs(rowIndex - originRow),
    Math.max(1, totalRows - 1),
    Math.round(clamp(intensite, 0, 1) * 1000),
  );
}

function obtenirRegleEffective(ruleNumber, rowIndex, originRow, totalRows, options = state) {
  if (!options.morphingActive) return ruleNumber;
  const progression = obtenirProgressionMorphosee(rowIndex, originRow, totalRows, options.morphIntensity ?? state.morphIntensity);
  if (progression <= 0) return ruleNumber;
  return ruleMorphee(ruleNumber, options.morphTargetRule ?? state.morphTargetRule, progression);
}

function extraireVoisinage(row, index) {
  const size = row.length;
  const left = index > 0 ? row[index - 1] : state.circular ? row[size - 1] : 0;
  const center = row[index];
  const right = index < size - 1 ? row[index + 1] : state.circular ? row[0] : 0;
  return { left, center, right };
}

function optionsGlobalesEvolution() {
  return {
    circular: state.circular,
    probability: state.probability,
    champProbabiliteActif: state.champProbabiliteActif,
    probabiliteHaut: state.probabiliteHaut,
    probabiliteBas: state.probabiliteBas,
    direction: state.direction,
    propagationMode: state.propagationMode,
    propagationAngle: state.propagationAngle,
    morphingActive: state.morphingActive,
    morphTargetRule: state.morphTargetRule,
    morphIntensity: state.morphIntensity,
  };
}

function normaliserOptionsEvolution(options = {}) {
  const globales = optionsGlobalesEvolution();
  return {
    ...globales,
    ...options,
    circular: Boolean(options.circular ?? globales.circular),
    probability: clamp(Number.parseFloat(options.probability ?? globales.probability) || 0, 0, 1),
    champProbabiliteActif: Boolean(options.champProbabiliteActif ?? globales.champProbabiliteActif),
    probabiliteHaut: clamp(Number.parseFloat(options.probabiliteHaut ?? globales.probabiliteHaut) || 0, 0, 1),
    probabiliteBas: clamp(Number.parseFloat(options.probabiliteBas ?? globales.probabiliteBas) || 0, 0, 1),
    direction: options.direction === "rtl" ? "rtl" : "ltr",
    propagationMode: ["both", "down", "up", "right", "left", "angle"].includes(options.propagationMode) ? options.propagationMode : globales.propagationMode,
    propagationAngle: clamp(Number.parseFloat(options.propagationAngle ?? globales.propagationAngle) || 0, 0, 359),
    morphingActive: Boolean(options.morphingActive ?? globales.morphingActive),
    morphTargetRule: clamp(Number.parseInt(options.morphTargetRule ?? globales.morphTargetRule, 10) || 0, 0, 255),
    morphIntensity: clamp(Number.parseFloat(options.morphIntensity ?? globales.morphIntensity) || 0, 0, 1),
  };
}

function getNextGenerationAvecOptions(current, ruleNumber, rowSeed, rowIndex, totalRows, originRow, options) {
  const nextGen = [];
  const random = mulberry32(rowSeed);
  const size = current.length;
  const direction = options.direction === "rtl" ? "rtl" : "ltr";
  const indices = direction === "ltr" ? [...Array(size).keys()] : [...Array(size).keys()].reverse();
  const probabiliteCourante = obtenirProbabiliteLigneAvecOptions(rowIndex, totalRows, options);
  const regleEffective = obtenirRegleEffective(ruleNumber, rowIndex, originRow, totalRows, options);

  for (const i of indices) {
    if (random() > probabiliteCourante) {
      nextGen.push(0);
      continue;
    }
    let left;
    let center;
    let right;
    if (direction === "ltr") {
      left = i > 0 ? current[i - 1] : options.circular ? current[size - 1] : 0;
      center = current[i];
      right = i < size - 1 ? current[i + 1] : options.circular ? current[0] : 0;
    } else {
      right = i > 0 ? current[i - 1] : options.circular ? current[size - 1] : 0;
      center = current[i];
      left = i < size - 1 ? current[i + 1] : options.circular ? current[0] : 0;
    }
    nextGen.push(transition(regleEffective, left, center, right));
  }
  return direction === "ltr" ? nextGen : nextGen.reverse();
}

function projeterEvolutionAngle(ruleNumber, rows, cols, x, y, baseSeed, options) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  const largeurLocale = Math.max(cols, rows) * 2 + 1;
  const centreLocal = Math.floor(largeurLocale / 2);
  let courant = Array(largeurLocale).fill(0);
  courant[centreLocal] = 1;
  const radians = (options.propagationAngle * Math.PI) / 180;
  const axeX = Math.cos(radians);
  const axeY = Math.sin(radians);
  const perpendiculaireX = -axeY;
  const perpendiculaireY = axeX;
  const pasMax = Math.ceil(Math.sqrt(cols * cols + rows * rows)) + largeurLocale;

  for (let pas = 0; pas <= pasMax; pas += 1) {
    courant.forEach((value, index) => {
      if (value !== 1) return;
      const lateral = index - centreLocal;
      const cibleX = Math.round(x + axeX * pas + perpendiculaireX * lateral);
      const cibleY = Math.round(y + axeY * pas + perpendiculaireY * lateral);
      if (cibleX >= 0 && cibleX < cols && cibleY >= 0 && cibleY < rows) {
        grid[cibleY][cibleX] = 1;
      }
    });
    courant = getNextGenerationAvecOptions(courant, ruleNumber, obtenirGraineLigne(baseSeed, pas, pas + 1), pas + 1, pasMax + 1, 0, options);
  }

  return grid;
}

function evoluerDepuisPosition(ruleNumber, rows, cols, position, baseSeed, options = optionsGlobalesEvolution()) {
  const optionsEvolution = normaliserOptionsEvolution(options);
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  const x = clamp(position.x ?? Math.floor(cols / 2), 0, cols - 1);
  const origine = clamp(position.y ?? obtenirOrigineYParDefaut(rows), 0, rows - 1);
  grid[origine][x] = 1;

  if (optionsEvolution.propagationMode === "right" || optionsEvolution.propagationMode === "left" || optionsEvolution.propagationMode === "angle") {
    const angle = optionsEvolution.propagationMode === "right" ? 0 : optionsEvolution.propagationMode === "left" ? 180 : optionsEvolution.propagationAngle;
    return projeterEvolutionAngle(ruleNumber, rows, cols, x, origine, baseSeed, { ...optionsEvolution, propagationAngle: angle });
  }

  if (optionsEvolution.propagationMode === "both" || optionsEvolution.propagationMode === "down") {
    for (let row = origine + 1; row < rows; row += 1) {
      grid[row] = getNextGenerationAvecOptions(grid[row - 1], ruleNumber, obtenirGraineLigne(baseSeed, row - 1, row), row, rows, origine, optionsEvolution);
    }
  }
  if (optionsEvolution.propagationMode === "both" || optionsEvolution.propagationMode === "up") {
    for (let row = origine - 1; row >= 0; row -= 1) {
      grid[row] = getNextGenerationAvecOptions(grid[row + 1], ruleNumber, obtenirGraineLigne(baseSeed, row + 1, row), row, rows, origine, optionsEvolution);
    }
  }

  return grid;
}

function synchroniserInterfaceModeInitial() {
  const optionsAleatoires = document.getElementById("random-opts");
  const optionsPersonnalisees = document.getElementById("custom-opts");
  if (optionsAleatoires) optionsAleatoires.hidden = state.initialMode !== "random";
  if (optionsPersonnalisees) optionsPersonnalisees.hidden = state.initialMode !== "custom";
}

function synchroniserOutilsExplorateur() {
  const panel = document.getElementById("explorer-perturbation-panel");
  if (panel) panel.hidden = state.explorerTool !== "perturb";
  document.querySelectorAll('input[name="explorer-tool"]').forEach((input) => {
    input.checked = input.value === state.explorerTool;
  });
  synchroniserCanvasEdition();
}

function synchroniserPalettesPoints() {
  const points = obtenirPointsActifsPersonnalises();
  const palettes = {};
  const regles = {};
  const options = {};
  points.forEach((point) => {
    const cle = obtenirClePoint(point);
    palettes[cle] = state.palettesPoints[cle] ? clonerCouleurs(state.palettesPoints[cle]) : clonerCouleurs(state.gradientColors);
    regles[cle] = clamp(Number.parseInt(state.reglesPoints[cle] ?? state.rule, 10) || state.rule, 0, 255);
    options[cle] = normaliserOptionsEvolution(state.optionsPoints[cle] || {});
  });
  state.palettesPoints = palettes;
  state.reglesPoints = regles;
  state.optionsPoints = options;
  if (pointActif && !palettes[pointActif]) pointActif = "";
}

function obtenirCouleursPoint(point) {
  const couleurs = state.palettesPoints[obtenirClePoint(point)];
  return couleurs && couleurs.length ? couleurs : state.gradientColors;
}

function obtenirReglePoint(point) {
  return clamp(Number.parseInt(state.reglesPoints[obtenirClePoint(point)] ?? state.rule, 10) || state.rule, 0, 255);
}

function obtenirOptionsPoint(point) {
  return normaliserOptionsEvolution(state.optionsPoints[obtenirClePoint(point)] || {});
}

function appliquerPointsPersonnalises(points, paletteMap = state.palettesPoints, ruleMap = state.reglesPoints, pointSelection = pointActif, optionsMap = state.optionsPoints) {
  state.pointsInitiaux = serialiserPoints(points);
  state.palettesPoints = { ...paletteMap };
  state.reglesPoints = { ...ruleMap };
  state.optionsPoints = { ...optionsMap };
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
  const nouvellesOptions = {};
  const vus = new Set();

  const ajouterPoint = (ancienPoint, nouveauPoint) => {
    const cleNouvelle = obtenirClePoint(nouveauPoint);
    if (vus.has(cleNouvelle)) return;
    vus.add(cleNouvelle);
    nouveauPoints.push(nouveauPoint);
    const ancienneCle = obtenirClePoint(ancienPoint);
    nouvellesPalettes[cleNouvelle] = clonerCouleurs(state.palettesPoints[ancienneCle] || state.gradientColors);
    nouvellesRegles[cleNouvelle] = obtenirReglePoint(ancienPoint);
    nouvellesOptions[cleNouvelle] = { ...obtenirOptionsPoint(ancienPoint) };
  };

  points.forEach((point) => {
    transformer(point).forEach((resultat) => ajouterPoint(point, resultat));
  });

  appliquerPointsPersonnalises(nouveauPoints, nouvellesPalettes, nouvellesRegles, pointActif, nouvellesOptions);
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
      automate: evoluerDepuisPosition(ruleNumber, rows, cols, position, baseSeed, optionsGlobalesEvolution()),
      couleurs: state.gradientColors,
    }];
  }
  return positions.map((position, index) => ({
    position,
    regle: state.initialMode === "custom" ? obtenirReglePoint(position) : ruleNumber,
    automate: evoluerDepuisPosition(
      state.initialMode === "custom" ? obtenirReglePoint(position) : ruleNumber,
      rows,
      cols,
      position,
      baseSeed + index,
      state.initialMode === "custom" ? obtenirOptionsPoint(position) : optionsGlobalesEvolution(),
    ),
    couleurs: state.initialMode === "custom" ? obtenirCouleursPoint(position) : state.gradientColors,
  }));
}

const EXPLORER_EVENT_CODES = { none: 0, pulse: 1, erase: 2, invert: 3, freeze: 4, mutate: 5 };

function indexExplorer(x, y, cols) {
  return (y * cols) + x;
}

function assurerBuffersExplorer(rows, cols) {
  const fieldChanged = explorerLab.frozenRows !== rows || explorerLab.frozenCols !== cols;
  if (fieldChanged) {
    explorerLab.frozenRows = rows;
    explorerLab.frozenCols = cols;
    explorerLab.frozenData = new Int16Array(rows * cols);
    explorerLab.frozenData.fill(-1);
    explorerLab.events = [];
    explorerLab.lastRender = null;
  }
  if (explorerLab.selection) {
    explorerLab.selection = {
      x: clamp(explorerLab.selection.x, 0, cols - 1),
      y: clamp(explorerLab.selection.y, 0, rows - 1),
    };
  }
}

function reinitialiserExplorerLab() {
  explorerLab.frozenRows = 0;
  explorerLab.frozenCols = 0;
  explorerLab.frozenData = new Int16Array(0);
  explorerLab.events = [];
  explorerLab.painting = false;
  explorerLab.selection = null;
  explorerLab.lastRender = null;
}

function trouverOrigineProche(rowIndex, origines) {
  if (!origines.length) return Math.floor(rowIndex);
  return origines.reduce((meilleure, origine) => (
    Math.abs(origine - rowIndex) < Math.abs(meilleure - rowIndex) ? origine : meilleure
  ), origines[0]);
}

function fusionnerCouchesVisibles(couches, rows, cols) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  const counts = Array.from({ length: rows }, () => Array(cols).fill(0));
  couches.forEach((couche) => {
    couche.automate.forEach((row, rowIndex) => {
      if (!estLigneVisiblePourCouche(couche, rowIndex, rows)) return;
      row.forEach((value, colIndex) => {
        if (value !== 1) return;
        grid[rowIndex][colIndex] = 1;
        counts[rowIndex][colIndex] += 1;
      });
    });
  });
  return { grid, counts };
}

function compterPerturbationsExplorer(x, y) {
  let total = 0;
  explorerLab.events.forEach((event) => {
    if (laboratoireIntensiteRadiale(x, y, event.x, event.y, event.radius) > 0) total += 1;
  });
  if (explorerLab.frozenData.length === explorerLab.frozenRows * explorerLab.frozenCols && explorerLab.frozenCols > 0) {
    if (explorerLab.frozenData[indexExplorer(x, y, explorerLab.frozenCols)] >= 0) total += 1;
  }
  return total;
}

function appliquerPerturbationsExplorer(baseGrid, rows, cols, origines) {
  const grid = baseGrid.map((row) => row.slice());
  const threshold = 250;

  explorerLab.events.forEach((event) => {
    const minX = clamp(event.x - event.radius, 0, cols - 1);
    const maxX = clamp(event.x + event.radius, 0, cols - 1);
    const minY = clamp(event.y - event.radius, 0, rows - 1);
    const maxY = clamp(event.y + event.radius, 0, rows - 1);

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const radial = laboratoireIntensiteRadiale(x, y, event.x, event.y, event.radius);
        if (radial === 0) continue;
        const intensity = Math.round(radial * event.strength);
        if (event.type === "mutate") {
          if (intensity < threshold) continue;
          const originRow = trouverOrigineProche(y, origines);
          const sourceRow = y === originRow ? originRow : clamp(y + (y > originRow ? -1 : 1), 0, rows - 1);
          const voisinage = extraireVoisinage(grid[sourceRow], x);
          const progression = clamp(
            obtenirProgressionMorphosee(y, originRow, rows) + Math.round((1000 - obtenirProgressionMorphosee(y, originRow, rows)) * event.strength),
            0,
            1000,
          );
          grid[y][x] = celluleMorphosee(state.rule, state.morphTargetRule, progression, voisinage.left, voisinage.center, voisinage.right);
          continue;
        }
        const eventCode = EXPLORER_EVENT_CODES[event.type] ?? EXPLORER_EVENT_CODES.none;
        grid[y][x] = laboratoireCelluleEvenement(grid[y][x], eventCode, intensity, threshold);
      }
    }
  });

  if (explorerLab.frozenData.length === rows * cols) {
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const frozenValue = explorerLab.frozenData[indexExplorer(x, y, cols)];
        if (frozenValue >= 0) grid[y][x] = frozenValue;
      }
    }
  }

  return grid;
}

function dessinerDifferencesExplorer(ctx, baseGrid, finalGrid, rows, cols, cellSize) {
  const gradient = generateGradient(state.gradientColors, rows);
  for (let y = 0; y < rows; y += 1) {
    const color = `rgb(${gradient[y].join(",")})`;
    for (let x = 0; x < cols; x += 1) {
      if (baseGrid[y][x] === finalGrid[y][x]) continue;
      if (finalGrid[y][x] === 0) {
        ctx.fillStyle = `rgb(${state.bgColor.join(",")})`;
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      } else {
        drawCell(ctx, x * cellSize, y * cellSize, cellSize, color);
      }
    }
  }
}

function dessinerPerturbationsExplorer(ctx, cellSize) {
  ctx.save();
  explorerLab.events.forEach((event) => {
    ctx.strokeStyle = event.type === "erase"
      ? "rgba(255, 107, 107, 0.78)"
      : event.type === "invert"
        ? "rgba(255, 209, 102, 0.82)"
        : event.type === "mutate"
          ? "rgba(123, 47, 255, 0.82)"
          : "rgba(102, 227, 255, 0.82)";
    ctx.lineWidth = Math.max(1.5, cellSize * 0.35);
    ctx.setLineDash(event.type === "freeze" || event.type === "mutate" ? [cellSize, cellSize] : []);
    ctx.beginPath();
    ctx.arc(event.x * cellSize, event.y * cellSize, event.radius * cellSize, 0, Math.PI * 2);
    ctx.stroke();
  });
  if (explorerLab.frozenData.some((value) => value >= 0)) {
    ctx.fillStyle = "rgba(195, 230, 255, 0.14)";
    for (let y = 0; y < explorerLab.frozenRows; y += 1) {
      for (let x = 0; x < explorerLab.frozenCols; x += 1) {
        if (explorerLab.frozenData[indexExplorer(x, y, explorerLab.frozenCols)] >= 0) {
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }
  }
  ctx.restore();
}

function analyserCelluleMicroscope(selection) {
  const rendu = explorerLab.lastRender;
  if (!selection || !rendu) return null;
  const x = clamp(selection.x, 0, rendu.cols - 1);
  const y = clamp(selection.y, 0, rendu.rows - 1);
  const originRow = trouverOrigineProche(y, rendu.origines);
  const sourceRow = y === originRow ? originRow : clamp(y + (y > originRow ? -1 : 1), 0, rendu.rows - 1);
  const voisinage = extraireVoisinage(rendu.baseGrid[sourceRow], x);
  const morphProgress = obtenirProgressionMorphosee(y, originRow, rendu.rows);
  const effectiveRule = obtenirRegleEffective(state.rule, y, originRow, rendu.rows);
  return {
    x,
    y,
    sourceRow,
    originRow,
    finalState: rendu.finalGrid[y][x],
    baseState: rendu.baseGrid[y][x],
    pattern: `${voisinage.left}${voisinage.center}${voisinage.right}`,
    patternIndex: patternCode(voisinage.left, voisinage.center, voisinage.right),
    effectiveRule,
    morphProgress,
    probability: obtenirProbabiliteLigne(y, rendu.rows),
    perturbations: compterPerturbationsExplorer(x, y),
  };
}

function mettreAJourMicroscope() {
  const panel = document.getElementById("microscope-panel");
  if (!panel) return;
  if (state.explorerTool !== "inspect") {
    panel.hidden = true;
    return;
  }
  const analyse = analyserCelluleMicroscope(explorerLab.selection);
  panel.hidden = !analyse;
  if (!analyse) return;
  document.getElementById("microscope-pos").textContent = `x${analyse.x} y${analyse.y}`;
  document.getElementById("microscope-state").textContent = String(analyse.finalState);
  document.getElementById("microscope-base-state").textContent = String(analyse.baseState);
  document.getElementById("microscope-pattern").textContent = analyse.pattern;
  document.getElementById("microscope-rule").textContent = String(analyse.effectiveRule);
  document.getElementById("microscope-morph").textContent = `${Math.round(analyse.morphProgress / 10)}%`;
  document.getElementById("microscope-prob").textContent = `${Math.round(analyse.probability * 100)}%`;
  document.getElementById("microscope-origin").textContent = String(analyse.originRow);
  document.getElementById("microscope-events").textContent = String(analyse.perturbations);
}

function dessinerSelectionMicroscope(ctx, cellSize) {
  if (state.explorerTool !== "inspect") return;
  const analyse = analyserCelluleMicroscope(explorerLab.selection);
  if (!analyse) return;
  ctx.save();
  ctx.strokeStyle = "rgba(255, 209, 102, 0.95)";
  ctx.lineWidth = Math.max(1.5, cellSize * 0.35);
  ctx.strokeRect(analyse.x * cellSize, analyse.y * cellSize, cellSize, cellSize);
  ctx.strokeStyle = "rgba(102, 227, 255, 0.75)";
  ctx.setLineDash([cellSize * 0.8, cellSize * 0.6]);
  for (let offset = -1; offset <= 1; offset += 1) {
    const col = clamp(analyse.x + offset, 0, explorerLab.lastRender.cols - 1);
    ctx.strokeRect(col * cellSize, analyse.sourceRow * cellSize, cellSize, cellSize);
  }
  ctx.restore();
}

function declencherPerturbationExplorer(x, y, rows, cols) {
  assurerBuffersExplorer(rows, cols);
  const event = {
    type: state.explorerEventType,
    x,
    y,
    radius: Math.max(1, Math.round(state.explorerEventRadius)),
    strength: clamp(state.explorerEventStrength, 0.1, 1),
  };
  if (event.type === "freeze") {
    const snapshot = explorerLab.lastRender?.finalGrid;
    if (!snapshot) return;
    const minX = clamp(x - event.radius, 0, cols - 1);
    const maxX = clamp(x + event.radius, 0, cols - 1);
    const minY = clamp(y - event.radius, 0, rows - 1);
    const maxY = clamp(y + event.radius, 0, rows - 1);
    for (let row = minY; row <= maxY; row += 1) {
      for (let col = minX; col <= maxX; col += 1) {
        const radial = laboratoireIntensiteRadiale(col, row, x, y, event.radius);
        if (Math.round(radial * event.strength) < 250) continue;
        explorerLab.frozenData[indexExplorer(col, row, cols)] = snapshot[row][col];
      }
    }
    return;
  }
  explorerLab.events.push(event);
  if (explorerLab.events.length > 24) explorerLab.events.shift();
}

function getNextGeneration(current, ruleNumber, rowSeed, rowIndex = 0, totalRows = 1, originRow = rowIndex) {
  return getNextGenerationAvecOptions(current, ruleNumber, rowSeed, rowIndex, totalRows, originRow, normaliserOptionsEvolution());
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
  assurerBuffersExplorer(rows, cols);

  // Fill background
  ctx.fillStyle = `rgb(${state.bgColor.join(",")})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const couches = construireCouchesAutomate(ruleNumber, rows, cols);
  dernieresCouches = couches;
  const canvasWidth = cols * cellSize;
  const canvasHeight = rows * cellSize;
  const { grid: baseGrid, counts } = fusionnerCouchesVisibles(couches, rows, cols);
  const collisions = new Set();
  const origines = couches.map((couche) => couche.position.y);

  couches.forEach((couche) => {
    // Create offscreen canvas for this layer
    const offscreen = createScratchCanvas(canvasWidth, canvasHeight);
    const offscreenCtx = offscreen.getContext("2d");

    const gradient = generateGradient(couche.couleurs, rows);
    couche.automate.forEach((row, rowIndex) => {
      if (!estLigneVisiblePourCouche(couche, rowIndex, rows)) return;
      const color = `rgb(${gradient[rowIndex].join(",")})`;
      row.forEach((value, colIndex) => {
        if (value !== 1) return;
        if (counts[rowIndex][colIndex] > 1) collisions.add(`${colIndex}:${rowIndex}`);
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

  const finalGrid = appliquerPerturbationsExplorer(baseGrid, rows, cols, origines);
  explorerLab.lastRender = {
    rows,
    cols,
    baseGrid,
    finalGrid,
    origines,
    collisions,
  };
  dessinerDifferencesExplorer(ctx, baseGrid, finalGrid, rows, cols, cellSize);
  dessinerPerturbationsExplorer(ctx, cellSize);
  dessinerSelectionMicroscope(ctx, cellSize);
  mettreAJourMicroscope();

  if (state.pauseSurCollision && animationEtat.actif && collisions.size > 0) {
    arreterAnimation();
  }
}

function updateRuleInfo() {
  const cls = wolframClass(state.rule);
  const noteLabel = ruleNoteLabel(state.rule);
  const note = noteLabel ? ` - ${noteLabel}` : "";
  document.getElementById("rule-class").textContent = `Classe ${cls}${note}`;
  const labRuleClass = document.getElementById("lab-rule-class");
  if (labRuleClass) labRuleClass.textContent = `Classe ${cls}${note}`;
}

function syncRuleControls() {
  document.getElementById("rule-slider").value = String(state.rule);
  document.getElementById("rule-number").value = String(state.rule);
  document.getElementById("rule-display").textContent = String(state.rule);
  const labSlider = document.getElementById("lab-rule-slider");
  const labDisplay = document.getElementById("lab-rule-display");
  const labNumber = document.getElementById("lab-rule-number");
  if (labSlider) labSlider.value = String(state.rule);
  if (labDisplay) labDisplay.textContent = String(state.rule);
  if (labNumber) labNumber.value = String(state.rule);
  updateRuleInfo();
}

function romanWolframClass(cls) {
  return ["I", "II", "III", "IV"][Math.max(0, Math.min(3, cls - 1))] || String(cls);
}

function calculerDensiteCouches(couches) {
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
  return totalCells > 0 ? liveCells / totalCells : 0;
}

function calculerDensiteGrille(grid) {
  let totalCells = 0;
  let liveCells = 0;
  grid.forEach((row) => {
    row.forEach((cell) => {
      totalCells += 1;
      if (cell === 1) liveCells += 1;
    });
  });
  return totalCells > 0 ? liveCells / totalCells : 0;
}

function updateCanvasHud(rows, cols, density) {
  const cls = wolframClass(state.rule);
  const hudRule = document.getElementById("hud-rule");
  const hudClass = document.getElementById("hud-class");
  const hudDensity = document.getElementById("hud-density");
  const hudGrid = document.getElementById("hud-grid");
  if (hudRule) hudRule.textContent = String(state.rule);
  if (hudClass) hudClass.textContent = romanWolframClass(cls);
  if (hudDensity) hudDensity.textContent = `${Math.round(density * 100)}%`;
  if (hudGrid) hudGrid.textContent = `${cols} x ${rows}`;
}

function updateAnalyticsPanel(grid) {
  if (!grid || grid.length === 0) return;

  metricsHistory.record(grid);
  const metrics = metricsHistory.getAverages();

  const updates = [
    { id: "metrics-entropy-bar", id_val: "metrics-entropy-value", value: metrics.entropy, type: "entropy" },
    { id: "metrics-compactness-bar", id_val: "metrics-compactness-value", value: metrics.compactness, type: "compactness" },
    { id: "metrics-fragmentation-bar", id_val: "metrics-fragmentation-value", value: metrics.fragmentation, type: "neutral" },
    { id: "metrics-symmetry-bar", id_val: "metrics-symmetry-value", value: metrics.symmetry, type: "neutral" },
    { id: "metrics-growth-bar", id_val: "metrics-growth-value", value: (metrics.growthRate + 1) / 2, type: "growth" },
  ];

  updates.forEach(({ id, id_val, value, type }) => {
    const bar = document.getElementById(id);
    const val = document.getElementById(id_val);
    if (bar && val) {
      const percentage = Math.max(0, Math.min(100, value * 100));
      bar.style.width = `${percentage}%`;
      bar.style.backgroundColor = getMetricsColor(value, type);
      val.textContent = value.toFixed(2);
    }
  });

  const classification = classifyDynamics(metrics);
  const classEl = document.getElementById("metrics-classification");
  if (classEl) {
    classEl.textContent = classification;
  }
}

function renderRuleDiagram() {
  document.querySelectorAll(".rule-diagram").forEach((container) => {
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
  });
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
    po: JSON.stringify(state.optionsPoints),
    count: state.initialCount,
    seed: state.seed,
    circ: state.circular ? "1" : "0",
    prob: state.probability.toFixed(2),
    pfa: state.champProbabiliteActif ? "1" : "0",
    pht: state.probabiliteHaut.toFixed(2),
    pbs: state.probabiliteBas.toFixed(2),
    dir: state.direction,
    prop: state.propagationMode,
    ang: Math.round(state.propagationAngle),
    bm: state.blendMode,
    lo: state.layerOpacity.toFixed(2),
    tx: state.texture,
    tl: state.progressionTemporelle.toFixed(3),
    as: state.vitesseAnimation.toFixed(1),
    pc: state.pauseSurCollision ? "1" : "0",
    me: state.morphingActive ? "1" : "0",
    mt: state.morphTargetRule,
    mi: state.morphIntensity.toFixed(2),
    et: state.explorerTool,
    ee: state.explorerEventType,
    er: state.explorerEventRadius,
    es: state.explorerEventStrength.toFixed(2),
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
  if (params.has("po")) {
    try {
      state.optionsPoints = JSON.parse(params.get("po"));
    } catch (error) {
      state.optionsPoints = {};
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
  if (params.has("prop")) state.propagationMode = params.get("prop");
  if (params.has("ang")) state.propagationAngle = clamp(Number.parseFloat(params.get("ang")) || 0, 0, 359);
  if (params.has("bm")) state.blendMode = params.get("bm");
  if (params.has("lo")) state.layerOpacity = clamp(Number.parseFloat(params.get("lo")), 0, 1);
  if (params.has("tx")) state.texture = params.get("tx");
  if (params.has("tl")) state.progressionTemporelle = clamp(Number.parseFloat(params.get("tl")) || 0, 0, 1);
  if (params.has("as")) state.vitesseAnimation = clamp(Number.parseFloat(params.get("as")) || 1.2, 0.1, 6);
  if (params.has("pc")) state.pauseSurCollision = params.get("pc") === "1";
  if (params.has("me")) state.morphingActive = params.get("me") === "1";
  if (params.has("mt")) state.morphTargetRule = clamp(Number.parseInt(params.get("mt"), 10) || state.morphTargetRule, 0, 255);
  if (params.has("mi")) state.morphIntensity = clamp(Number.parseFloat(params.get("mi")) || 0, 0, 1);
  if (params.has("et")) state.explorerTool = params.get("et");
  if (params.has("ee")) state.explorerEventType = params.get("ee");
  if (params.has("er")) state.explorerEventRadius = clamp(Number.parseInt(params.get("er"), 10) || state.explorerEventRadius, 1, 40);
  if (params.has("es")) state.explorerEventStrength = clamp(Number.parseFloat(params.get("es")) || state.explorerEventStrength, 0.1, 1);
}

function renderMainView() {
  const explorerPanel = document.getElementById("explorer-panel");
  if (explorerPanel && !explorerPanel.hidden) {
    const canvas = document.getElementById("main-canvas");
    const { rows, cols } = obtenirDimensionsRendu();
    renderToCanvas(canvas, state.rule, rows, cols, state.cellSize);
    const density = explorerLab.lastRender ? calculerDensiteGrille(explorerLab.lastRender.finalGrid) : (dernieresCouches ? calculerDensiteCouches(dernieresCouches) : 0);
    updateCanvasHud(rows, cols, density);

    if (explorerLab.lastRender) {
      updateAnalyticsPanel(explorerLab.lastRender.finalGrid);
    }

    if (audioEngine.active) {
      const cls = wolframClass(state.rule);
      audioEngine.update(state.rule, cls, density);
    }

    if (sequenceur.active && dernieresCouches) {
      sequenceur.refresh(dernieresCouches, state.rule);
    }
  }
  renderMatterLabView();
}

const LAB_SHAPE_CODES = { none: 0, rect: 1, circle: 2, ring: 3, cell: 4 };
const LAB_MODE_CODES = { none: 0, inside: 1, outside: 2, barrier: 3 };
const LAB_EVENT_CODES = { none: 0, pulse: 1, erase: 2, invert: 3, freeze: 4 };

function obtenirDimensionsMatterLab() {
  const canvas = document.getElementById("lab-canvas");
  const width = canvas?.parentElement?.clientWidth || 900;
  return {
    rows: Math.max(1, Math.floor((width * 0.6) / state.cellSize)),
    cols: Math.max(1, Math.floor(width / state.cellSize)),
  };
}

function indexMatterLab(x, y, cols) {
  return (y * cols) + x;
}

function assurerBuffersMatterLab(rows, cols) {
  const fieldChanged = matterLab.fieldRows !== rows || matterLab.fieldCols !== cols;
  if (fieldChanged) {
    matterLab.fieldRows = rows;
    matterLab.fieldCols = cols;
    matterLab.fieldData = new Uint16Array(rows * cols);
    matterLab.fieldData.fill(1000);
    matterLab.frozenRows = rows;
    matterLab.frozenCols = cols;
    matterLab.frozenData = new Int16Array(rows * cols);
    matterLab.frozenData.fill(-1);
    matterLab.events = [];
    matterLab.primaryGeometry = null;
    matterLab.barriers = [];
  }
  state.labShapeX = clamp(state.labShapeX, 0, cols - 1);
  state.labShapeY = clamp(state.labShapeY, 0, rows - 1);
  state.labShapeInner = clamp(state.labShapeInner, 0, state.labShapeWidth);
}

function reinitialiserMatterLab() {
  matterLab.fieldRows = 0;
  matterLab.fieldCols = 0;
  matterLab.fieldData = new Uint16Array(0);
  matterLab.frozenRows = 0;
  matterLab.frozenCols = 0;
  matterLab.frozenData = new Int16Array(0);
  matterLab.events = [];
  matterLab.primaryGeometry = null;
  matterLab.barriers = [];
  matterLab.lastRender = null;
  matterLab.defaultRuleApplied = false;
}

function obtenirChampMatterLab(x, y, cols) {
  return matterLab.fieldData[indexMatterLab(x, y, cols)] ?? 1000;
}

function moyenneChampMatterLab() {
  if (!matterLab.fieldData.length) return 1000;
  let total = 0;
  matterLab.fieldData.forEach((value) => {
    total += value;
  });
  return total / matterLab.fieldData.length;
}

function nomGeometrieMatterLab(shapeCode) {
  if (shapeCode === LAB_SHAPE_CODES.rect) return "Rectangle";
  if (shapeCode === LAB_SHAPE_CODES.ring) return "Anneau";
  if (shapeCode === LAB_SHAPE_CODES.cell) return "Cellule";
  return "Cercle";
}

function nomModeGeometrieMatterLab(modeCode) {
  if (modeCode === LAB_MODE_CODES.outside) return "outside";
  if (modeCode === LAB_MODE_CODES.barrier) return "barrier";
  return "inside";
}

function synchroniserControleModeCelluleMatterLab() {
  const cellMode = state.labShapeType === "cell";
  if (cellMode) state.labGeometryMode = "barrier";
  document.querySelectorAll('input[name="lab-geometry-mode"]').forEach((input) => {
    const locked = cellMode && input.value !== "barrier";
    input.disabled = locked;
    input.closest("label")?.classList.toggle("is-disabled", locked);
    input.checked = input.value === state.labGeometryMode;
  });
}

function normaliserGeometrieMatterLab(geometry, rows, cols) {
  if (!geometry) return null;
  const centerX = clamp(geometry.centerX, 0, cols - 1);
  const centerY = clamp(geometry.centerY, 0, rows - 1);
  if (geometry.shapeCode === LAB_SHAPE_CODES.rect) {
    return {
      ...geometry,
      centerX,
      centerY,
      sizeA: Math.max(1, Math.floor(geometry.sizeA)),
      sizeB: Math.max(1, Math.floor(geometry.sizeB)),
      innerRadius: 0,
    };
  }
  if (geometry.shapeCode === LAB_SHAPE_CODES.ring) {
    const sizeA = Math.max(2, Math.floor(geometry.sizeA));
    return {
      ...geometry,
      centerX,
      centerY,
      sizeA,
      sizeB: sizeA,
      innerRadius: clamp(Math.floor(geometry.innerRadius), 0, sizeA - 1),
    };
  }
  if (geometry.shapeCode === LAB_SHAPE_CODES.cell) {
    return {
      ...geometry,
      centerX,
      centerY,
      sizeA: 0,
      sizeB: 0,
      innerRadius: 0,
    };
  }
  return {
    ...geometry,
    centerX,
    centerY,
    sizeA: Math.max(2, Math.floor(geometry.sizeA)),
    sizeB: Math.max(2, Math.floor(geometry.sizeB)),
    innerRadius: 0,
  };
}

function construireGeometrieMatterLab(shapeType, modeName, centerX, centerY, rows, cols) {
  if (shapeType === "rect") {
    return normaliserGeometrieMatterLab({
      shapeCode: LAB_SHAPE_CODES.rect,
      modeCode: LAB_MODE_CODES[modeName] ?? LAB_MODE_CODES.inside,
      centerX,
      centerY,
      sizeA: state.labShapeWidth / 2,
      sizeB: state.labShapeHeight / 2,
      innerRadius: 0,
    }, rows, cols);
  }
  if (shapeType === "ring") {
    return normaliserGeometrieMatterLab({
      shapeCode: LAB_SHAPE_CODES.ring,
      modeCode: LAB_MODE_CODES[modeName] ?? LAB_MODE_CODES.inside,
      centerX,
      centerY,
      sizeA: state.labShapeWidth,
      sizeB: state.labShapeWidth,
      innerRadius: state.labShapeInner,
    }, rows, cols);
  }
  if (shapeType === "cell") {
    return normaliserGeometrieMatterLab({
      shapeCode: LAB_SHAPE_CODES.cell,
      modeCode: LAB_MODE_CODES.barrier,
      centerX,
      centerY,
      sizeA: 0,
      sizeB: 0,
      innerRadius: 0,
    }, rows, cols);
  }
  return normaliserGeometrieMatterLab({
    shapeCode: LAB_SHAPE_CODES.circle,
    modeCode: LAB_MODE_CODES[modeName] ?? LAB_MODE_CODES.inside,
    centerX,
    centerY,
    sizeA: state.labShapeWidth,
    sizeB: state.labShapeHeight,
    innerRadius: 0,
  }, rows, cols);
}

function synchroniserGeometriePrimaireMatterLab(rows, cols) {
  if (!matterLab.primaryGeometry || state.labGeometryMode === "barrier") return;
  matterLab.primaryGeometry = construireGeometrieMatterLab(
    state.labShapeType,
    state.labGeometryMode,
    matterLab.primaryGeometry.centerX,
    matterLab.primaryGeometry.centerY,
    rows,
    cols,
  );
}

function configurationGeometrieMatterLab(rows, cols) {
  return normaliserGeometrieMatterLab(matterLab.primaryGeometry, rows, cols);
}

function configurationsBarrieresMatterLab(rows, cols) {
  return matterLab.barriers
    .map((geometry) => normaliserGeometrieMatterLab(geometry, rows, cols))
    .filter(Boolean);
}

function geometrieAutoriseCelluleMatterLab(geometry, x, y) {
  const contains = laboratoireFormeContient(
    geometry.shapeCode,
    x,
    y,
    geometry.centerX,
    geometry.centerY,
    geometry.sizeA,
    geometry.sizeB,
    geometry.innerRadius,
  );
  return laboratoireModeAutorise(geometry.modeCode, contains) === 1;
}

function celluleAutoriseeMatterLab(x, y, rows, cols) {
  const geometry = configurationGeometrieMatterLab(rows, cols);
  if (geometry && !geometrieAutoriseCelluleMatterLab(geometry, x, y)) return false;
  return configurationsBarrieresMatterLab(rows, cols).every((barrier) => geometrieAutoriseCelluleMatterLab(barrier, x, y));
}

function probabiliteMatterLab(x, y, totalRows, cols) {
  const baseProbability = Math.round(obtenirProbabiliteLigne(y, totalRows) * 1000);
  const fieldProbability = laboratoireProbabiliteModifiee(baseProbability, obtenirChampMatterLab(x, y, cols));
  return clamp(fieldProbability / 1000, 0, 1);
}

function getNextGenerationMatterLab(current, ruleNumber, rowSeed, rowIndex, totalRows) {
  const nextGen = [];
  const random = mulberry32(rowSeed);
  const size = current.length;
  const indices = state.direction === "ltr" ? [...Array(size).keys()] : [...Array(size).keys()].reverse();

  for (const i of indices) {
    if (!celluleAutoriseeMatterLab(i, rowIndex, totalRows, size)) {
      nextGen.push(0);
      continue;
    }

    if (random() > probabiliteMatterLab(i, rowIndex, totalRows, size)) {
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

function evoluerDepuisPositionMatterLab(ruleNumber, rows, cols, position, baseSeed) {
  const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  const x = clamp(position.x ?? Math.floor(cols / 2), 0, cols - 1);
  const origin = clamp(position.y ?? Math.floor(rows / 2), 0, rows - 1);
  if (celluleAutoriseeMatterLab(x, origin, rows, cols)) {
    grid[origin][x] = 1;
  }

  for (let row = origin + 1; row < rows; row += 1) {
    grid[row] = getNextGenerationMatterLab(grid[row - 1], ruleNumber, obtenirGraineLigne(baseSeed, row - 1, row), row, rows);
  }
  for (let row = origin - 1; row >= 0; row -= 1) {
    grid[row] = getNextGenerationMatterLab(grid[row + 1], ruleNumber, obtenirGraineLigne(baseSeed, row + 1, row), row, rows);
  }

  return grid;
}

function construireGrilleMatterLab(ruleNumber, rows, cols) {
  const positions = normaliserPositionsInitiales(cols, rows);
  const baseSeed = Number.parseInt(state.seed || 0, 10);
  const output = Array.from({ length: rows }, () => Array(cols).fill(0));
  positions.forEach((position, index) => {
    const grid = evoluerDepuisPositionMatterLab(ruleNumber, rows, cols, position, baseSeed + index);
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (grid[row][col] === 1) output[row][col] = 1;
      }
    }
  });
  return output;
}

function appliquerEvenementsMatterLab(baseGrid, rows, cols) {
  const grid = baseGrid.map((row) => row.slice());
  const threshold = 250;
  matterLab.events.forEach((event) => {
    const eventCode = LAB_EVENT_CODES[event.type] ?? LAB_EVENT_CODES.none;
    const minX = clamp(event.x - event.radius, 0, cols - 1);
    const maxX = clamp(event.x + event.radius, 0, cols - 1);
    const minY = clamp(event.y - event.radius, 0, rows - 1);
    const maxY = clamp(event.y + event.radius, 0, rows - 1);
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const radial = laboratoireIntensiteRadiale(x, y, event.x, event.y, event.radius);
        if (radial === 0) continue;
        const intensity = Math.round(radial * event.strength);
        grid[y][x] = laboratoireCelluleEvenement(grid[y][x], eventCode, intensity, threshold);
      }
    }
  });

  if (matterLab.frozenData.length === rows * cols) {
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const frozenValue = matterLab.frozenData[indexMatterLab(x, y, cols)];
        if (frozenValue >= 0) grid[y][x] = frozenValue;
      }
    }
  }
  return grid;
}

function dessinerChampMatterLab(ctx, rows, cols, cellSize) {
  if (!state.labShowField || !matterLab.fieldData.length) return;
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const value = obtenirChampMatterLab(x, y, cols);
      const delta = value - 1000;
      if (Math.abs(delta) < 40) continue;
      const alpha = Math.min(Math.abs(delta) / 1400, 0.28);
      ctx.fillStyle = delta > 0 ? `rgba(102, 227, 255, ${alpha})` : `rgba(255, 157, 77, ${alpha})`;
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }
}

function dessinerGeometrieMatterLab(ctx, geometry, cellSize) {
  if (!state.labShowMask || !geometry) return;
  ctx.save();
  ctx.strokeStyle = geometry.modeCode === LAB_MODE_CODES.barrier ? "rgba(255, 157, 77, 0.92)" : "rgba(102, 227, 255, 0.92)";
  ctx.lineWidth = Math.max(1.5, cellSize * 0.5);
  ctx.setLineDash([cellSize * 1.5, cellSize]);
  if (geometry.shapeCode === LAB_SHAPE_CODES.rect) {
    ctx.strokeRect(
      (geometry.centerX - geometry.sizeA) * cellSize,
      (geometry.centerY - geometry.sizeB) * cellSize,
      geometry.sizeA * 2 * cellSize,
      geometry.sizeB * 2 * cellSize,
    );
  } else if (geometry.shapeCode === LAB_SHAPE_CODES.cell) {
    ctx.strokeRect(
      geometry.centerX * cellSize,
      geometry.centerY * cellSize,
      cellSize,
      cellSize,
    );
  } else {
    ctx.beginPath();
    ctx.arc(geometry.centerX * cellSize, geometry.centerY * cellSize, geometry.sizeA * cellSize, 0, Math.PI * 2);
    ctx.stroke();
    if (geometry.shapeCode === LAB_SHAPE_CODES.ring && geometry.innerRadius > 0) {
      ctx.beginPath();
      ctx.arc(geometry.centerX * cellSize, geometry.centerY * cellSize, geometry.innerRadius * cellSize, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function dessinerEvenementsMatterLab(ctx, cellSize) {
  if (!state.labShowEvents) return;
  ctx.save();
  matterLab.events.forEach((event) => {
    ctx.strokeStyle = event.type === "erase"
      ? "rgba(255, 107, 107, 0.82)"
      : event.type === "invert"
        ? "rgba(255, 209, 102, 0.82)"
        : "rgba(102, 227, 255, 0.82)";
    ctx.lineWidth = Math.max(1.5, cellSize * 0.4);
    ctx.setLineDash(event.type === "invert" ? [cellSize, cellSize] : []);
    ctx.beginPath();
    ctx.arc(event.x * cellSize, event.y * cellSize, event.radius * cellSize, 0, Math.PI * 2);
    ctx.stroke();
  });
  if (matterLab.frozenData.some((value) => value >= 0)) {
    ctx.fillStyle = "rgba(195, 230, 255, 0.18)";
    for (let y = 0; y < matterLab.frozenRows; y += 1) {
      for (let x = 0; x < matterLab.frozenCols; x += 1) {
        if (matterLab.frozenData[indexMatterLab(x, y, matterLab.frozenCols)] >= 0) {
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }
  }
  ctx.restore();
}

function mettreAJourHudMatterLab(grid, rows, cols) {
  let liveCells = 0;
  grid.forEach((row) => row.forEach((value) => {
    if (value === 1) liveCells += 1;
  }));
  const density = rows * cols > 0 ? Math.round((liveCells / (rows * cols)) * 100) : 0;
  const averageField = Math.round(moyenneChampMatterLab() / 10);
  const ruleDisplay = document.getElementById("lab-rule-display");
  const hudRule = document.getElementById("lab-hud-rule");
  const hudDensity = document.getElementById("lab-hud-density");
  const hudField = document.getElementById("lab-hud-field");
  const hudEvents = document.getElementById("lab-hud-events");
  const status = document.getElementById("lab-geometry-status");
  const geometry = configurationGeometrieMatterLab(rows, cols);
  const barriers = configurationsBarrieresMatterLab(rows, cols);
  if (ruleDisplay) ruleDisplay.textContent = String(state.rule);
  if (hudRule) hudRule.textContent = String(state.rule);
  if (hudDensity) hudDensity.textContent = `${density}%`;
  if (hudField) hudField.textContent = `${averageField}%`;
  if (hudEvents) hudEvents.textContent = String(matterLab.events.length + (matterLab.frozenData.some((value) => value >= 0) ? 1 : 0));
  if (status) {
    if (!geometry && barriers.length === 0) status.textContent = "Aucune geometrie";
    else if (!geometry) status.textContent = `${barriers.length} barriere${barriers.length > 1 ? "s" : ""}`;
    else if (barriers.length === 0) status.textContent = `${nomGeometrieMatterLab(geometry.shapeCode)} ${nomModeGeometrieMatterLab(geometry.modeCode)}`;
    else status.textContent = `${nomGeometrieMatterLab(geometry.shapeCode)} + ${barriers.length} barriere${barriers.length > 1 ? "s" : ""}`;
  }
}

function renderMatterLabView() {
  const panel = document.getElementById("matterlab-panel");
  const canvas = document.getElementById("lab-canvas");
  if (!panel || panel.hidden || !canvas) return;

  const { rows, cols } = obtenirDimensionsMatterLab();
  assurerBuffersMatterLab(rows, cols);
  const baseGrid = construireGrilleMatterLab(state.rule, rows, cols);
  const finalGrid = appliquerEvenementsMatterLab(baseGrid, rows, cols);
  matterLab.lastRender = { rows, cols, grid: finalGrid.map((row) => row.slice()) };

  canvas.width = cols * state.cellSize;
  canvas.height = rows * state.cellSize;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = `rgb(${state.bgColor.join(",")})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  dessinerChampMatterLab(ctx, rows, cols, state.cellSize);

  const gradient = generateGradient(state.gradientColors, rows);
  finalGrid.forEach((row, rowIndex) => {
    const color = `rgb(${gradient[rowIndex].join(",")})`;
    row.forEach((value, colIndex) => {
      if (value !== 1) return;
      drawCell(ctx, colIndex * state.cellSize, rowIndex * state.cellSize, state.cellSize, color);
    });
  });

  const geometry = configurationGeometrieMatterLab(rows, cols);
  const barriers = configurationsBarrieresMatterLab(rows, cols);
  dessinerGeometrieMatterLab(ctx, geometry, state.cellSize);
  barriers.forEach((barrier) => dessinerGeometrieMatterLab(ctx, barrier, state.cellSize));
  dessinerEvenementsMatterLab(ctx, state.cellSize);
  mettreAJourHudMatterLab(finalGrid, rows, cols);
}

function creerEditeurCouleur(color, onChange, options = {}) {
  const { removable = false, onRemove = null, compact = false } = options;
  const editor = document.createElement("div");
  editor.className = `color-editor${compact ? " compact" : ""}`;

  const swatch = document.createElement("span");
  swatch.className = "color-swatch";
  const appliquerCouleur = (hexColor) => {
    swatch.style.background = hexColor;
  };
  const couleurInitiale = rgbToHexColor(color);
  appliquerCouleur(couleurInitiale);
  editor.appendChild(swatch);

  const picker = document.createElement("input");
  picker.type = "color";
  picker.value = couleurInitiale;
  picker.id = options.id || "";
  picker.addEventListener("input", () => {
    const rgb = hexToRgb(picker.value);
    appliquerCouleur(picker.value);
    hexInput.value = rgbToHexColor(rgb);
    hexInput.classList.remove("invalid");
    hint.textContent = "";
    hint.classList.remove("error");
    onChange(rgb);
  });
  editor.appendChild(picker);

  const fields = document.createElement("div");
  fields.className = "color-fields";
  const hexInput = document.createElement("input");
  hexInput.type = "text";
  hexInput.className = "color-hex-input";
  hexInput.inputMode = "text";
  hexInput.autocapitalize = "characters";
  hexInput.spellcheck = false;
  hexInput.maxLength = 7;
  hexInput.placeholder = "#RRGGBB";
  hexInput.value = couleurInitiale;

  const hint = document.createElement("div");
  hint.className = "color-hex-hint";

  const appliquerHexValide = (value) => {
    const normalise = normaliserHexSaisie(value);
    if (!normalise) return false;
    const rgb = hexToRgb(normalise);
    picker.value = normalise;
    hexInput.value = normalise;
    hexInput.classList.remove("invalid");
    hint.textContent = "";
    hint.classList.remove("error");
    appliquerCouleur(normalise);
    onChange(rgb);
    return true;
  };

  hexInput.addEventListener("input", () => {
    const normalise = normaliserHexSaisie(hexInput.value);
    if (!hexInput.value.trim()) {
      hexInput.classList.add("invalid");
      hint.textContent = "Hex invalide";
      hint.classList.add("error");
      return;
    }
    if (!normalise) {
      hexInput.classList.add("invalid");
      hint.textContent = "Hex invalide";
      hint.classList.add("error");
      return;
    }
    appliquerHexValide(normalise);
  });
  hexInput.addEventListener("blur", () => {
    if (!appliquerHexValide(hexInput.value)) {
      hexInput.value = picker.value.toUpperCase();
      hexInput.classList.remove("invalid");
      hint.textContent = "";
      hint.classList.remove("error");
    }
  });

  fields.appendChild(hexInput);
  fields.appendChild(hint);
  editor.appendChild(fields);

  if (removable) {
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "ghost-btn";
    remove.textContent = "x";
    remove.addEventListener("click", () => {
      if (onRemove) onRemove();
    });
    editor.appendChild(remove);
  }

  return editor;
}

function renderColorStops(container, colors, onChange) {
  container.innerHTML = "";
  colors.forEach((color, index) => {
    const row = document.createElement("div");
    row.className = "color-stop";
    row.appendChild(creerEditeurCouleur(color, (nextColor) => {
      onChange(index, nextColor);
    }, {
      removable: colors.length > 1,
      onRemove: () => onChange(index, null),
      compact: true,
    }));
    container.appendChild(row);
  });
}

function renderBackgroundColorControl() {
  const container = document.getElementById("bg-color-row");
  if (!container) return;
  container.innerHTML = "";
  container.appendChild(creerEditeurCouleur(state.bgColor, (nextColor) => {
    state.bgColor = nextColor;
    scheduleRender();
  }, { id: "bg-color" }));
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

function applyColorTheme(themeId) {
  const theme = COLOR_THEMES.find(t => t.id === themeId);
  if (!theme) return;

  state.bgColor = [...theme.bgColor];
  state.gradientColors = clonerCouleurs(theme.gradientColors);

  renderBackgroundColorControl();
  renderGradientPickers();
  renderColorThemes();
  scheduleRender();
}

function renderColorThemes() {
  const container = document.getElementById("color-themes-grid");
  if (!container) return;

  container.innerHTML = "";
  COLOR_THEMES.forEach((theme) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-swatch";
    if (
      state.bgColor[0] === theme.bgColor[0]
      && state.bgColor[1] === theme.bgColor[1]
      && state.bgColor[2] === theme.bgColor[2]
      && state.gradientColors.length === theme.gradientColors.length
      && state.gradientColors.every((c, i) => c[0] === theme.gradientColors[i][0] && c[1] === theme.gradientColors[i][1] && c[2] === theme.gradientColors[i][2])
    ) {
      button.classList.add("active");
    }

    const strip = document.createElement("div");
    strip.className = "theme-swatch-strip";
    strip.style.background = `linear-gradient(90deg, ${theme.gradientColors.map(c => `rgb(${c.join(",")})`).join(", ")})`;

    const label = document.createElement("div");
    label.className = "theme-swatch-label";
    label.textContent = theme.label;

    button.appendChild(strip);
    button.appendChild(label);
    button.addEventListener("click", () => applyColorTheme(theme.id));

    container.appendChild(button);
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
    const options = obtenirOptionsPoint(point);
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

    const opts = document.createElement("div");
    opts.className = "point-options-grid";

    const mettreAJourOption = (nom, valeur) => {
      state.optionsPoints[cle] = normaliserOptionsEvolution({ ...obtenirOptionsPoint(point), [nom]: valeur });
      scheduleRender();
      renderPalettesPoints();
    };

    const ajouterNombre = (label, nom, valeur, min, max, step = "0.01") => {
      const row = document.createElement("label");
      row.className = "point-option";
      row.innerHTML = `<span class="muted">${label}</span>`;
      const input = document.createElement("input");
      input.type = "number";
      input.min = String(min);
      input.max = String(max);
      input.step = step;
      input.value = String(valeur);
      input.addEventListener("change", (event) => mettreAJourOption(nom, Number.parseFloat(event.target.value)));
      row.appendChild(input);
      opts.appendChild(row);
    };

    const ajouterSelect = (label, nom, valeur, choix) => {
      const row = document.createElement("label");
      row.className = "point-option";
      row.innerHTML = `<span class="muted">${label}</span>`;
      const select = document.createElement("select");
      choix.forEach(([value, text]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        if (value === valeur) option.selected = true;
        select.appendChild(option);
      });
      select.addEventListener("change", (event) => mettreAJourOption(nom, event.target.value));
      row.appendChild(select);
      opts.appendChild(row);
    };

    const ajouterCheckbox = (label, nom, valeur) => {
      const row = document.createElement("label");
      row.className = "checkbox-row point-option-check";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = Boolean(valeur);
      input.addEventListener("change", () => mettreAJourOption(nom, input.checked));
      row.appendChild(input);
      row.append(label);
      opts.appendChild(row);
    };

    ajouterNombre("Prob.", "probability", options.probability, 0, 1);
    ajouterCheckbox("Champ stochastique", "champProbabiliteActif", options.champProbabiliteActif);
    ajouterNombre("Prob. haut", "probabiliteHaut", options.probabiliteHaut, 0, 1);
    ajouterNombre("Prob. bas", "probabiliteBas", options.probabiliteBas, 0, 1);
    ajouterSelect("Lecture", "direction", options.direction, [["ltr", "LTR"], ["rtl", "RTL"]]);
    ajouterSelect("Propagation", "propagationMode", options.propagationMode, [
      ["both", "Haut + bas"],
      ["down", "Bas"],
      ["up", "Haut"],
      ["right", "Droite"],
      ["left", "Gauche"],
      ["angle", "Angle"],
    ]);
    ajouterNombre("Angle", "propagationAngle", Math.round(options.propagationAngle), 0, 359, "1");
    ajouterCheckbox("Frontiere circulaire", "circular", options.circular);
    ajouterCheckbox("Morphose", "morphingActive", options.morphingActive);
    ajouterNombre("Regle cible", "morphTargetRule", options.morphTargetRule, 0, 255, "1");
    ajouterNombre("Intensite morph.", "morphIntensity", options.morphIntensity, 0, 1);
    card.appendChild(opts);

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
    syncButton.textContent = "Globaux";
    syncButton.addEventListener("click", () => {
      state.reglesPoints[cle] = state.rule;
      state.optionsPoints[cle] = normaliserOptionsEvolution(optionsGlobalesEvolution());
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

function appliquerEditionPoints(points, palettes, regles, selection = pointActif, options = state.optionsPoints) {
  activerModePoints();
  appliquerPointsPersonnalises(points, palettes, regles, selection, options);
  renderPalettesPoints();
  scheduleRender();
}

function bindCanvasEditor() {
  const canvas = document.getElementById("main-canvas");
  if (!canvas) return;

  canvas.addEventListener("contextmenu", (event) => {
    if (state.explorerTool !== "points" || state.initialMode !== "custom") return;
    event.preventDefault();
    const cible = obtenirCoordonneesCelluleDepuisEvenement(event);
    const points = obtenirPointsActifsPersonnalises();
    let proche = trouverPointLePlusProche(points, cible);
    if (!proche) return;
    const palettes = { ...state.palettesPoints };
    const regles = { ...state.reglesPoints };
    const options = { ...state.optionsPoints };
    const cle = obtenirClePoint(proche.point);
    delete palettes[cle];
    delete regles[cle];
    delete options[cle];
    points.splice(proche.index, 1);
    appliquerEditionPoints(points, palettes, regles, "", options);
  });

  canvas.addEventListener("pointerdown", (event) => {
    const cible = obtenirCoordonneesCelluleDepuisEvenement(event);
    synchroniserCanvasEdition();

    if (state.explorerTool === "inspect") {
      explorerLab.selection = { x: cible.x, y: cible.y };
      scheduleRender();
      return;
    }

    if (state.explorerTool === "perturb") {
      explorerLab.painting = true;
      canvas.setPointerCapture(event.pointerId);
      declencherPerturbationExplorer(cible.x, cible.y, cible.rows, cible.cols);
      explorerLab.selection = { x: cible.x, y: cible.y };
      scheduleRender();
      return;
    }

    let points = obtenirPointsActifsPersonnalises();
    let palettes = { ...state.palettesPoints };
    let regles = { ...state.reglesPoints };
    let options = { ...state.optionsPoints };
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
      options[cleCopie] = { ...obtenirOptionsPoint(proche.point) };
      pointActif = cleCopie;
      appliquerEditionPoints(points, palettes, regles, cleCopie, options);
      return;
    }

    if (!proche) {
      const nouveauPoint = { x: cible.x, y: cible.y };
      const cle = obtenirClePoint(nouveauPoint);
      points = [...points, nouveauPoint];
      palettes[cle] = clonerCouleurs(state.gradientColors);
      regles[cle] = state.rule;
      options[cle] = normaliserOptionsEvolution();
      pointActif = cle;
      appliquerEditionPoints(points, palettes, regles, cle, options);
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
    const cible = obtenirCoordonneesCelluleDepuisEvenement(event);
    if (state.explorerTool === "inspect") {
      explorerLab.selection = { x: cible.x, y: cible.y };
      scheduleRender();
      return;
    }
    if (state.explorerTool === "perturb") {
      if (!explorerLab.painting) return;
      declencherPerturbationExplorer(cible.x, cible.y, cible.rows, cible.cols);
      explorerLab.selection = { x: cible.x, y: cible.y };
      scheduleRender();
      return;
    }
    if (!editeurPoints.actif) return;
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
    const options = { ...state.optionsPoints };
    palettes[cleNouvelle] = palettes[cleAncienne] ? clonerCouleurs(palettes[cleAncienne]) : clonerCouleurs(state.gradientColors);
    regles[cleNouvelle] = regles[cleAncienne] ?? state.rule;
    options[cleNouvelle] = options[cleAncienne] || normaliserOptionsEvolution();
    delete palettes[cleAncienne];
    delete regles[cleAncienne];
    delete options[cleAncienne];
    points[index] = nouveauPoint;
    editeurPoints.cle = cleNouvelle;
    pointActif = cleNouvelle;
    appliquerEditionPoints(points, palettes, regles, cleNouvelle, options);
  });

  const terminerEdition = (event) => {
    explorerLab.painting = false;
    if (editeurPoints.actif) editeurPoints.actif = false;
    if (event?.pointerId != null && canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  };

  canvas.addEventListener("pointerup", terminerEdition);
  canvas.addEventListener("pointerleave", terminerEdition);
}

function synchroniserValeurMatterLab(inputId, displayId, formatter = (value) => value) {
  const input = document.getElementById(inputId);
  const display = document.getElementById(displayId);
  if (input && display) display.textContent = formatter(input.value);
}

function obtenirCoordonneesMatterLabDepuisEvenement(event) {
  const canvas = document.getElementById("lab-canvas");
  const rect = canvas.getBoundingClientRect();
  const { cols, rows } = obtenirDimensionsMatterLab();
  return {
    x: clamp(Math.floor(((event.clientX - rect.left) / rect.width) * cols), 0, cols - 1),
    y: clamp(Math.floor(((event.clientY - rect.top) / rect.height) * rows), 0, rows - 1),
    cols,
    rows,
  };
}

function peindreChampMatterLab(x, y, rows, cols) {
  assurerBuffersMatterLab(rows, cols);
  const radius = Math.max(1, Math.round(state.labFieldBrush));
  const amplitude = Math.round(state.labFieldStrength * 1000);
  const direction = state.labFieldMode === "erase" ? -1 : 1;
  const minX = clamp(x - radius, 0, cols - 1);
  const maxX = clamp(x + radius, 0, cols - 1);
  const minY = clamp(y - radius, 0, rows - 1);
  const maxY = clamp(y + radius, 0, rows - 1);
  for (let row = minY; row <= maxY; row += 1) {
    for (let col = minX; col <= maxX; col += 1) {
      const radial = laboratoireIntensiteRadiale(col, row, x, y, radius);
      if (radial === 0) continue;
      const index = indexMatterLab(col, row, cols);
      const delta = Math.round((amplitude * radial) / 1000) * direction;
      matterLab.fieldData[index] = clamp(matterLab.fieldData[index] + delta, 0, 2000);
    }
  }
}

function declencherEvenementMatterLab(x, y, rows, cols) {
  assurerBuffersMatterLab(rows, cols);
  const event = {
    type: state.labEventType,
    x,
    y,
    radius: Math.max(1, Math.round(state.labEventRadius)),
    strength: clamp(state.labEventStrength, 0.1, 1),
  };
  if (event.type === "freeze") {
    const snapshot = matterLab.lastRender?.grid;
    if (!snapshot) return;
    const minX = clamp(x - event.radius, 0, cols - 1);
    const maxX = clamp(x + event.radius, 0, cols - 1);
    const minY = clamp(y - event.radius, 0, rows - 1);
    const maxY = clamp(y + event.radius, 0, rows - 1);
    for (let row = minY; row <= maxY; row += 1) {
      for (let col = minX; col <= maxX; col += 1) {
        const radial = laboratoireIntensiteRadiale(col, row, x, y, event.radius);
        if (Math.round(radial * event.strength) < 250) continue;
        matterLab.frozenData[indexMatterLab(col, row, cols)] = snapshot[row][col];
      }
    }
    return;
  }
  matterLab.events.push(event);
  if (matterLab.events.length > 24) matterLab.events.shift();
}

function bindMatterLabCanvas() {
  const canvas = document.getElementById("lab-canvas");
  if (!canvas) return;

  const agir = (event) => {
    const cible = obtenirCoordonneesMatterLabDepuisEvenement(event);
    if (matterLab.activeTab === "geometry") {
      state.labShapeX = cible.x;
      state.labShapeY = cible.y;
      const geometry = construireGeometrieMatterLab(state.labShapeType, state.labGeometryMode, cible.x, cible.y, cible.rows, cible.cols);
      if (state.labGeometryMode === "barrier") {
        matterLab.barriers.push({ ...geometry, modeCode: LAB_MODE_CODES.barrier });
      } else {
        matterLab.primaryGeometry = geometry;
      }
    } else if (matterLab.activeTab === "field") {
      peindreChampMatterLab(cible.x, cible.y, cible.rows, cible.cols);
    } else if (matterLab.activeTab === "event") {
      declencherEvenementMatterLab(cible.x, cible.y, cible.rows, cible.cols);
    }
    scheduleRender();
  };

  canvas.addEventListener("pointerdown", (event) => {
    matterLab.painting = true;
    canvas.setPointerCapture(event.pointerId);
    agir(event);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!matterLab.painting) return;
    if (matterLab.activeTab !== "field") return;
    agir(event);
  });

  const terminer = (event) => {
    matterLab.painting = false;
    if (event?.pointerId != null && canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
  };
  canvas.addEventListener("pointerup", terminer);
  canvas.addEventListener("pointerleave", terminer);
}

function initMatterLabTabs() {
  const buttons = document.querySelectorAll(".lab-tab-btn");
  const panels = document.querySelectorAll(".lab-tab-panel");
  const switchTab = (tabName) => {
    matterLab.activeTab = tabName;
    buttons.forEach((button) => button.classList.toggle("active", button.dataset.labTab === tabName));
    panels.forEach((panel) => panel.classList.toggle("active", panel.dataset.labTab === tabName));
  };
  buttons.forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.labTab));
  });
  switchTab(matterLab.activeTab);
}

function switchTab(tab) {
  const explorer = tab === "explorer";
  const matterLabTab = tab === "lab";
  const gallery = tab === "gallery";
  const source = tab === "source";
  const urlHasRule = new URLSearchParams(location.search).has("rule");
  const shouldUseLabDefaultRule = matterLabTab && !matterLab.defaultRuleApplied && state.rule === DEFAULTS.rule && !urlHasRule;
  if (shouldUseLabDefaultRule) {
    state.rule = DEFAULT_MATTER_LAB_RULE;
    matterLab.defaultRuleApplied = true;
    syncRuleControls();
    renderRuleDiagram();
  }
  document.getElementById("explorer-panel").hidden = !explorer;
  document.getElementById("matterlab-panel").hidden = !matterLabTab;
  document.getElementById("gallery-panel").hidden = !gallery;
  document.getElementById("source-panel").hidden = !source;
  document.getElementById("tab-explorer").classList.toggle("active", explorer);
  document.getElementById("tab-lab").classList.toggle("active", matterLabTab);
  document.getElementById("tab-gallery").classList.toggle("active", gallery);
  document.getElementById("tab-source").classList.toggle("active", source);
  if (gallery) loadGalleryFragment();
  if (matterLabTab) renderMatterLabView();
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
  galleryLoading = fetch(assetUrl("gallery-fragment.html"))
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
  const bioBg = [2, 5, 9];

  let bgColor = darkBg;
  if (theme === "light") bgColor = lightBg;
  else if (theme === "bio") bgColor = bioBg;

  state.bgColor = bgColor;

  const btn = document.getElementById("btn-theme");
  if (btn) {
    if (theme === "light") btn.textContent = "🌙";
    else if (theme === "bio") btn.textContent = "⚗";
    else btn.textContent = "☀";
  }

  renderBackgroundColorControl();
}

function cycleTheme() {
  const currentTheme = document.documentElement.dataset.theme || "dark";
  const themeOrder = ["dark", "bio", "light"];
  const currentIndex = themeOrder.indexOf(currentTheme);
  const nextIndex = (currentIndex + 1) % themeOrder.length;
  applyTheme(themeOrder[nextIndex]);
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
    cycleTheme();
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

  renderBackgroundColorControl();

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

  document.querySelectorAll('input[name="propagation"]').forEach((input) => {
    if (input.value === state.propagationMode) input.checked = true;
    input.addEventListener("change", () => {
      state.propagationMode = input.value;
      scheduleRender();
    });
  });
  const propagationAngle = document.getElementById("propagation-angle");
  if (propagationAngle) {
    propagationAngle.value = String(Math.round(state.propagationAngle));
    propagationAngle.addEventListener("change", (event) => {
      state.propagationAngle = clamp(Number.parseFloat(event.target.value) || 0, 0, 359);
      event.target.value = String(Math.round(state.propagationAngle));
      scheduleRender();
    });
  }

  const morphEnabled = document.getElementById("morph-enabled");
  const morphTargetSlider = document.getElementById("morph-target-slider");
  const morphTargetNumber = document.getElementById("morph-target-number");
  const morphIntensity = document.getElementById("morph-intensity");
  const morphIntensityDisplay = document.getElementById("morph-intensity-display");
  if (morphEnabled) morphEnabled.checked = state.morphingActive;
  if (morphTargetSlider) morphTargetSlider.value = String(state.morphTargetRule);
  if (morphTargetNumber) morphTargetNumber.value = String(state.morphTargetRule);
  if (morphIntensity) morphIntensity.value = String(state.morphIntensity);
  if (morphIntensityDisplay) morphIntensityDisplay.textContent = `${Math.round(state.morphIntensity * 100)}%`;
  morphEnabled?.addEventListener("change", () => {
    state.morphingActive = morphEnabled.checked;
    scheduleRender();
  });
  morphTargetSlider?.addEventListener("input", (event) => {
    state.morphTargetRule = clamp(Number.parseInt(event.target.value, 10) || 0, 0, 255);
    if (morphTargetNumber) morphTargetNumber.value = String(state.morphTargetRule);
    scheduleRender();
  });
  morphTargetNumber?.addEventListener("change", (event) => {
    state.morphTargetRule = clamp(Number.parseInt(event.target.value, 10) || 0, 0, 255);
    if (morphTargetSlider) morphTargetSlider.value = String(state.morphTargetRule);
    event.target.value = String(state.morphTargetRule);
    scheduleRender();
  });
  morphIntensity?.addEventListener("input", (event) => {
    state.morphIntensity = clamp(Number.parseFloat(event.target.value) || 0, 0, 1);
    if (morphIntensityDisplay) morphIntensityDisplay.textContent = `${Math.round(state.morphIntensity * 100)}%`;
    scheduleRender();
  });

  document.querySelectorAll('input[name="explorer-tool"]').forEach((input) => {
    if (input.value === state.explorerTool) input.checked = true;
    input.addEventListener("change", () => {
      state.explorerTool = input.value;
      synchroniserOutilsExplorateur();
      scheduleRender();
    });
  });
  document.querySelectorAll('input[name="explorer-event-type"]').forEach((input) => {
    if (input.value === state.explorerEventType) input.checked = true;
    input.addEventListener("change", () => {
      state.explorerEventType = input.value;
    });
  });
  const explorerEventRadius = document.getElementById("explorer-event-radius");
  const explorerEventRadiusDisplay = document.getElementById("explorer-event-radius-display");
  const explorerEventStrength = document.getElementById("explorer-event-strength");
  const explorerEventStrengthDisplay = document.getElementById("explorer-event-strength-display");
  if (explorerEventRadius) explorerEventRadius.value = String(state.explorerEventRadius);
  if (explorerEventRadiusDisplay) explorerEventRadiusDisplay.textContent = String(state.explorerEventRadius);
  if (explorerEventStrength) explorerEventStrength.value = String(state.explorerEventStrength);
  if (explorerEventStrengthDisplay) explorerEventStrengthDisplay.textContent = state.explorerEventStrength.toFixed(2);
  explorerEventRadius?.addEventListener("input", (event) => {
    state.explorerEventRadius = clamp(Number.parseInt(event.target.value, 10) || 1, 1, 40);
    if (explorerEventRadiusDisplay) explorerEventRadiusDisplay.textContent = String(state.explorerEventRadius);
  });
  explorerEventStrength?.addEventListener("input", (event) => {
    state.explorerEventStrength = clamp(Number.parseFloat(event.target.value) || 0.1, 0.1, 1);
    if (explorerEventStrengthDisplay) explorerEventStrengthDisplay.textContent = state.explorerEventStrength.toFixed(2);
  });
  document.getElementById("btn-clear-explorer-events")?.addEventListener("click", () => {
    if (explorerLab.frozenData.length) explorerLab.frozenData.fill(-1);
    explorerLab.events = [];
    scheduleRender();
  });
  synchroniserOutilsExplorateur();

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
    reinitialiserExplorerLab();
    reinitialiserMatterLab();
    history.replaceState(null, "", location.pathname);
    location.reload();
  });

  document.getElementById("tab-explorer").addEventListener("click", () => switchTab("explorer"));
  document.getElementById("tab-lab").addEventListener("click", () => switchTab("lab"));
  document.getElementById("tab-gallery").addEventListener("click", () => switchTab("gallery"));
  document.getElementById("tab-source").addEventListener("click", () => switchTab("source"));

  const labRuleSlider = document.getElementById("lab-rule-slider");
  if (labRuleSlider) {
    labRuleSlider.value = String(state.rule);
    labRuleSlider.addEventListener("input", (event) => {
      state.rule = Number.parseInt(event.target.value, 10);
      syncRuleControls();
      renderRuleDiagram();
      scheduleRender();
    });
  }
  document.getElementById("lab-rule-number")?.addEventListener("change", (event) => {
    state.rule = clamp(Number.parseInt(event.target.value, 10) || 0, 0, 255);
    syncRuleControls();
    renderRuleDiagram();
    scheduleRender();
  });
  document.getElementById("lab-btn-prev")?.addEventListener("click", () => {
    state.rule = (state.rule - 1 + 256) % 256;
    syncRuleControls();
    renderRuleDiagram();
    scheduleRender();
  });
  document.getElementById("lab-btn-next")?.addEventListener("click", () => {
    state.rule = (state.rule + 1) % 256;
    syncRuleControls();
    renderRuleDiagram();
    scheduleRender();
  });

  const bindLabRange = (inputId, displayId, stateKey, parser = Number.parseInt, formatter = (value) => value) => {
    const input = document.getElementById(inputId);
    const display = document.getElementById(displayId);
    if (!input || !display) return;
    input.value = String(state[stateKey]);
    display.textContent = formatter(input.value);
    input.addEventListener("input", (event) => {
      state[stateKey] = parser(event.target.value);
      display.textContent = formatter(event.target.value);
      const { rows, cols } = obtenirDimensionsMatterLab();
      synchroniserGeometriePrimaireMatterLab(rows, cols);
      scheduleRender();
    });
  };

  bindLabRange("lab-shape-width", "lab-shape-width-display", "labShapeWidth");
  bindLabRange("lab-shape-height", "lab-shape-height-display", "labShapeHeight");
  bindLabRange("lab-shape-inner", "lab-shape-inner-display", "labShapeInner");
  bindLabRange("lab-field-brush", "lab-field-brush-display", "labFieldBrush");
  bindLabRange("lab-field-strength", "lab-field-strength-display", "labFieldStrength", Number.parseFloat, (value) => Number.parseFloat(value).toFixed(2));
  bindLabRange("lab-event-radius", "lab-event-radius-display", "labEventRadius");
  bindLabRange("lab-event-strength", "lab-event-strength-display", "labEventStrength", Number.parseFloat, (value) => Number.parseFloat(value).toFixed(2));

  document.querySelectorAll('input[name="lab-shape"]').forEach((input) => {
    if (input.value === state.labShapeType) input.checked = true;
    input.addEventListener("change", () => {
      state.labShapeType = input.value;
      synchroniserControleModeCelluleMatterLab();
      const { rows, cols } = obtenirDimensionsMatterLab();
      synchroniserGeometriePrimaireMatterLab(rows, cols);
      scheduleRender();
    });
  });
  document.querySelectorAll('input[name="lab-geometry-mode"]').forEach((input) => {
    if (input.value === state.labGeometryMode) input.checked = true;
    input.addEventListener("change", () => {
      if (state.labShapeType === "cell" && input.value !== "barrier") {
        synchroniserControleModeCelluleMatterLab();
        return;
      }
      state.labGeometryMode = input.value;
      const { rows, cols } = obtenirDimensionsMatterLab();
      synchroniserGeometriePrimaireMatterLab(rows, cols);
      scheduleRender();
    });
  });
  synchroniserControleModeCelluleMatterLab();
  document.querySelectorAll('input[name="lab-field-mode"]').forEach((input) => {
    if (input.value === state.labFieldMode) input.checked = true;
    input.addEventListener("change", () => {
      state.labFieldMode = input.value;
    });
  });
  document.querySelectorAll('input[name="lab-event-type"]').forEach((input) => {
    if (input.value === state.labEventType) input.checked = true;
    input.addEventListener("change", () => {
      state.labEventType = input.value;
    });
  });

  const bindLabCheck = (id, stateKey, rerender = true) => {
    const input = document.getElementById(id);
    if (!input) return;
    input.checked = Boolean(state[stateKey]);
    input.addEventListener("change", () => {
      state[stateKey] = input.checked;
      if (rerender) scheduleRender();
    });
  };
  bindLabCheck("lab-show-mask", "labShowMask");
  bindLabCheck("lab-show-field", "labShowField");
  bindLabCheck("lab-show-events", "labShowEvents");

  document.getElementById("lab-btn-random")?.addEventListener("click", () => {
    state.rule = Math.floor(Math.random() * 256);
    syncRuleControls();
    renderRuleDiagram();
    scheduleRender();
  });
  document.getElementById("lab-presets")?.addEventListener("change", (event) => {
    if (!event.target.value) return;
    state.rule = Number.parseInt(event.target.value, 10);
    event.target.value = "";
    syncRuleControls();
    renderRuleDiagram();
    scheduleRender();
  });
  document.getElementById("lab-btn-clear-field")?.addEventListener("click", () => {
    if (matterLab.fieldData.length) matterLab.fieldData.fill(1000);
    scheduleRender();
  });
  document.getElementById("lab-btn-clear-events")?.addEventListener("click", () => {
    matterLab.events = [];
    if (matterLab.frozenData.length) matterLab.frozenData.fill(-1);
    scheduleRender();
  });
  document.getElementById("lab-btn-clear-geometry")?.addEventListener("click", () => {
    matterLab.primaryGeometry = null;
    matterLab.barriers = [];
    scheduleRender();
  });
  document.getElementById("lab-btn-reset")?.addEventListener("click", () => {
    reinitialiserMatterLab();
    scheduleRender();
  });
  document.getElementById("lab-btn-download")?.addEventListener("click", () => {
    renderMatterLabView();
    const link = document.createElement("a");
    link.href = document.getElementById("lab-canvas").toDataURL("image/png");
    link.download = `matter-lab-regle-${state.rule}.png`;
    link.click();
  });

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

    if (tabName === "points") {
      state.explorerTool = "points";
      synchroniserOutilsExplorateur();
    } else if (state.explorerTool === "points") {
      state.explorerTool = "inspect";
      synchroniserOutilsExplorateur();
    }

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

/* ════════════════════════════════════════════════════════════════════════════
   FUTURISTIC FEATURES: Particle System, Ripple Effects, Command Palette
   ════════════════════════════════════════════════════════════════════════════ */

function initParticles() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const particleCount = 80;

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.6 + 0.2,
      twinkle: Math.random() > 0.7,
      twinkleSpeed: Math.random() * 0.05 + 0.02,
      twinklePhase: Math.random() * Math.PI * 2,
    });
  }

  const animateParticles = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      let opacity = p.opacity;
      if (p.twinkle) {
        p.twinklePhase += p.twinkleSpeed;
        opacity = p.opacity * (0.5 + 0.5 * Math.sin(p.twinklePhase));
      }

      ctx.fillStyle = `rgba(102, 227, 255, ${opacity})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(animateParticles);
  };

  animateParticles();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

function attachRippleEffects() {
  const buttons = document.querySelectorAll('button, .tab, .sidebar-tab-btn');

  buttons.forEach(btn => {
    btn.addEventListener('pointerdown', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement('span');
      ripple.classList.add('ripple');
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';

      btn.appendChild(ripple);

      ripple.addEventListener('animationend', () => {
        ripple.remove();
      });
    });
  });
}

function initCommandPalette() {
  const paletteEl = document.getElementById('cmd-palette');
  const inputEl = document.getElementById('cmd-input');
  const resultsEl = document.getElementById('cmd-results');
  const openBtn = document.getElementById('btn-cmd-palette');

  if (!paletteEl || !inputEl || !resultsEl || !openBtn) return;

  const presetNames = {
    30: 'Chaos pseudo-aléatoire',
    57: 'Asymétrie',
    90: 'Triangle de Sierpinski',
    110: 'Calcul universel',
    150: 'XOR avec auto-référence',
    184: 'Modèle de trafic',
    225: 'Bandes',
    254: 'Frontières seulement',
  };

  const openPalette = () => {
    paletteEl.hidden = false;
    inputEl.focus();
    inputEl.value = '';
    renderResults('');
  };

  const closePalette = () => {
    paletteEl.hidden = true;
    inputEl.value = '';
    resultsEl.innerHTML = '';
  };

  const renderResults = (query) => {
    const q = query.toLowerCase().trim();
    const results = [];

    for (let i = 0; i <= 255; i++) {
      const name = presetNames[i] || `Règle ${i}`;
      if (q === '' || i.toString().includes(q) || name.toLowerCase().includes(q)) {
        results.push({ rule: i, name });
      }
    }

    resultsEl.innerHTML = results
      .slice(0, 12)
      .map((r, idx) => `
        <div class="cmd-result-item" data-rule="${r.rule}" data-idx="${idx}">
          <span class="cmd-result-icon">◆</span>
          <span><strong>Règle ${r.rule}</strong> ${r.name}</span>
        </div>
      `)
      .join('');

    const items = resultsEl.querySelectorAll('.cmd-result-item');
    items.forEach((item, idx) => {
      item.addEventListener('click', () => selectResult(item));
      if (idx === 0) item.classList.add('selected');
    });
  };

  const selectResult = (item) => {
    const rule = Number.parseInt(item.getAttribute('data-rule'), 10);
    state.rule = rule;
    syncRuleControls();
    renderRuleDiagram();
    renderMainView();
    closePalette();
  };

  inputEl.addEventListener('input', (e) => {
    renderResults(e.target.value);
  });

  inputEl.addEventListener('keydown', (e) => {
    const items = resultsEl.querySelectorAll('.cmd-result-item');
    const selected = resultsEl.querySelector('.cmd-result-item.selected');
    const selectedIdx = selected ? parseInt(selected.getAttribute('data-idx'), 10) : -1;

    if (e.key === 'Escape') {
      closePalette();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = Math.min(selectedIdx + 1, items.length - 1);
      items.forEach((item, idx) => item.classList.toggle('selected', idx === nextIdx));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = Math.max(selectedIdx - 1, 0);
      items.forEach((item, idx) => item.classList.toggle('selected', idx === prevIdx));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selected) selectResult(selected);
    }
  });

  openBtn.addEventListener('click', openPalette);

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      if (paletteEl.hidden) openPalette();
      else closePalette();
    }
  });

  document.addEventListener('click', (e) => {
    if (!paletteEl.contains(e.target) && e.target !== openBtn) {
      closePalette();
    }
  });
}

function initFullscreenToggle() {
  const btn = document.getElementById('btn-fullscreen');
  if (!btn) return;

  const toggleFullscreen = () => {
    document.body.classList.toggle('fullscreen-mode');
  };

  btn.addEventListener('click', toggleFullscreen);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') {
      const activeElement = document.activeElement;
      const isInput = activeElement?.tagName === 'INPUT' ||
                      activeElement?.tagName === 'TEXTAREA' ||
                      activeElement?.tagName === 'SELECT';
      if (!isInput) {
        e.preventDefault();
        toggleFullscreen();
      }
    }
  });
}

async function init() {
  initTheme();
  loadFromURL();
  initSidebarTabs();
  initMatterLabTabs();
  bindControls();
  bindCanvasEditor();
  bindMatterLabCanvas();
  bindGallery();
  renderColorThemes();
  renderGradientPickers();
  renderPalettesPoints();
  syncRuleControls();
  renderRuleDiagram();
  renderMainView();
  await loadWasm();
  renderRuleDiagram();
  scheduleRender();

  // Futuristic enhancements
  initParticles();
  attachRippleEffects();
  initCommandPalette();
  initFullscreenToggle();
}

init();
