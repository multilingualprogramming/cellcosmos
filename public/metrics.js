/**
 * Life Signatures: Bio-inspired complexity metrics for cellular automata
 */

function calculateEntropy(grid) {
  if (!grid || grid.length === 0) return 0;

  let totalCells = 0;
  let liveCells = 0;

  grid.forEach(row => {
    row.forEach(cell => {
      totalCells += 1;
      if (cell === 1) liveCells += 1;
    });
  });

  if (totalCells === 0) return 0;

  const p = liveCells / totalCells;
  const q = 1 - p;

  if (p === 0 || p === 1) return 0;

  return -(p * Math.log2(p) + q * Math.log2(q));
}

function calculateCompactness(grid) {
  if (!grid || grid.length === 0) return 0;

  const rows = grid.length;
  const cols = grid[0].length;

  let liveCells = 0;
  let perimeter = 0;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] === 1) {
        liveCells += 1;

        const neighbors = [
          [y - 1, x], [y + 1, x],
          [y, x - 1], [y, x + 1]
        ];

        neighbors.forEach(([ny, nx]) => {
          if (ny < 0 || ny >= rows || nx < 0 || nx >= cols || grid[ny][nx] === 0) {
            perimeter += 1;
          }
        });
      }
    }
  }

  if (liveCells === 0) return 0;

  const minPerimeter = 2 * Math.sqrt(Math.PI * liveCells);
  const compactness = minPerimeter / Math.max(1, perimeter);

  return Math.min(1, compactness);
}

function calculateFragmentation(grid) {
  if (!grid || grid.length === 0) return 0;

  const rows = grid.length;
  const cols = grid[0].length;
  const visited = Array(rows).fill(null).map(() => Array(cols).fill(false));

  let clusters = 0;
  let liveCells = 0;

  function dfs(y, x) {
    if (y < 0 || y >= rows || x < 0 || x >= cols || visited[y][x] || grid[y][x] === 0) {
      return;
    }
    visited[y][x] = true;

    dfs(y - 1, x);
    dfs(y + 1, x);
    dfs(y, x - 1);
    dfs(y, x + 1);
  }

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (grid[y][x] === 1) {
        liveCells += 1;
        if (!visited[y][x]) {
          clusters += 1;
          dfs(y, x);
        }
      }
    }
  }

  if (liveCells === 0) return 0;

  const normalizedFragmentation = clusters / Math.sqrt(liveCells);
  return Math.min(1, normalizedFragmentation / 5);
}

function calculateGrowthRate(previousGrid, currentGrid) {
  if (!previousGrid || !currentGrid || previousGrid.length === 0) return 0;

  let previousLive = 0;
  let currentLive = 0;

  previousGrid.forEach(row => {
    row.forEach(cell => {
      if (cell === 1) previousLive += 1;
    });
  });

  currentGrid.forEach(row => {
    row.forEach(cell => {
      if (cell === 1) currentLive += 1;
    });
  });

  if (previousLive === 0) return currentLive > 0 ? 1 : 0;

  const rate = (currentLive - previousLive) / previousLive;
  return Math.max(-1, Math.min(1, rate));
}

function calculateSymmetry(grid) {
  if (!grid || grid.length === 0) return 0;

  const rows = grid.length;
  const cols = grid[0].length;

  let horizontalMatches = 0;
  let verticalMatches = 0;
  let total = 0;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < Math.ceil(cols / 2); x++) {
      const left = grid[y][x];
      const right = grid[y][cols - 1 - x];
      if (left === right) horizontalMatches += 1;
      total += 1;
    }
  }

  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < Math.ceil(rows / 2); y++) {
      const top = grid[y][x];
      const bottom = grid[rows - 1 - y][x];
      if (top === bottom) verticalMatches += 1;
      total += 1;
    }
  }

  return (horizontalMatches + verticalMatches) / (2 * total);
}

const metricsHistory = {
  entropy: [],
  compactness: [],
  fragmentation: [],
  symmetry: [],
  growthRate: [],
  previousGrid: null,
  maxHistoryLength: 60,

  record(grid) {
    const entropy = calculateEntropy(grid);
    const compactness = calculateCompactness(grid);
    const fragmentation = calculateFragmentation(grid);
    const symmetry = calculateSymmetry(grid);
    const growthRate = calculateGrowthRate(this.previousGrid, grid);

    this.entropy.push(entropy);
    this.compactness.push(compactness);
    this.fragmentation.push(fragmentation);
    this.symmetry.push(symmetry);
    this.growthRate.push(growthRate);

    this.previousGrid = grid.map(row => [...row]);

    if (this.entropy.length > this.maxHistoryLength) {
      this.entropy.shift();
      this.compactness.shift();
      this.fragmentation.shift();
      this.symmetry.shift();
      this.growthRate.shift();
    }
  },

  getAverages() {
    const avg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    return {
      entropy: avg(this.entropy),
      compactness: avg(this.compactness),
      fragmentation: avg(this.fragmentation),
      symmetry: avg(this.symmetry),
      growthRate: avg(this.growthRate),
    };
  },

  reset() {
    this.entropy = [];
    this.compactness = [];
    this.fragmentation = [];
    this.symmetry = [];
    this.growthRate = [];
    this.previousGrid = null;
  }
};

function classifyDynamics(metrics) {
  const { entropy, compactness, fragmentation, symmetry, growthRate } = metrics;

  const score = {
    stability: (1 - entropy) * (1 - Math.abs(growthRate)) * 0.5 + compactness * 0.5,
    chaos: entropy * (1 - compactness),
    organization: compactness * symmetry * (1 - fragmentation),
    dispersion: fragmentation * entropy,
    growth: Math.abs(growthRate)
  };

  const maxScore = Math.max(...Object.values(score));
  const classification = Object.keys(score).find(k => score[k] === maxScore);

  const classNames = {
    stability: "Stable",
    chaos: "Chaotique",
    organization: "Organisé",
    dispersion: "Dispersé",
    growth: "Croissance"
  };

  return classNames[classification] || "Complexe";
}

function getMetricsColor(value, type = "neutral") {
  if (type === "entropy") {
    if (value < 0.3) return "#83b0ff";
    if (value < 0.7) return "#ffd166";
    return "#ff6b6b";
  }
  if (type === "compactness") {
    if (value > 0.6) return "#83b0ff";
    if (value > 0.3) return "#ffd166";
    return "#ff6b6b";
  }
  if (type === "growth") {
    if (value > 0.1) return "#51b347";
    if (value < -0.1) return "#ff6b6b";
    return "#ffd166";
  }
  return "#888";
}
