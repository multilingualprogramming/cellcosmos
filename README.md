## Cellcosmos

Cellcosmos est un explorateur interactif d'automates cellulaires élémentaires écrit en multilingual (syntaxe française) et compilé en WebAssembly.

### Objectif

Le projet démontre qu'un programme scientifique et visuel complexe peut être:

- Défini dans des sources multilingual françaises simples et lisibles
- Compilé en WASM pour utilisation directe dans le navigateur
- Déployé comme site statique sans serveur applicatif
- Enrichi avec des interactions Web audio et du rendu canvas avancé

### Fonctionnalités

#### Explorateur fondamental

- **Règles**: Explore les 256 règles élémentaires (Wolfram, 1983)
- **Contrôles**: Slider, entrée numérique, presets notables (30, 90, 110, 150, 184, 254)
- **Diagramme de règle**: Visualisation des 8 motifs d'entrée et leurs sorties
- **Galerie**: Aperçu préchargé des 256 règles compilées

#### Rendu visuel avancé

- **Formes de cellules**: Rectangle, cercle, ellipse, triangle
- **Textures**: Solide, points, hachures croisées, dégradé radial, bruit procédural
- **Dégradés de couleurs**: Palette globale multiples arrêts de couleur + dégradés par point d'origine
- **Modes de fusion**: Normal (source-over), Écran, Multiplier, Superposer, Éclaircir, Assombrir, Différence, Esquiver
- **Opacité des couches**: Contrôle fine de la transparence (0.0–1.0)
- **Thèmes**: Mode clair et sombre avec persistance localStorage

#### Paramètres d'évolution

- **Semis initiaux**: Haut, centre, bas, aléatoire, points personnalisés, couches multiples
- **Probabilité**: Transitions avec chance configurable (0.0–1.0)
- **Direction**: Évolution LTR (gauche→droite) ou RTL (droite→gauche)
- **Frontière**: Bord circulaire ou tronqué

#### Son ambiant

- **Drone continu**: Fréquence fondamentale dérivée du numéro de règle (110–~3520 Hz)
- **Timbre**: Classe Wolfram → forme d'onde (sinusoïde, triangle, dent de scie, carré)
- **Filtre dynamique**: Fréquence de coupure modulée par la densité de cellules vivantes (200–3200 Hz)
- **Reverb**: Délai avec boucle de rétroaction simulant une ambiance spatieuse

#### Musique générative (séquenceur)

- **Matériau source**: Les colonnes de la grille de l'automate deviennent des notes musicales
- **Tempo**: Dérivé du taux d'évolution (60–180 BPM)
- **Gammes**: Mappées à partir de la classe Wolfram
  - Classe 1 → Pentatonique (5 notes, reposant)
  - Classe 2 → Diatonique (7 notes, mélodieux)
  - Classe 3 → Chromatique (12 notes, riche)
  - Classe 4 → Ton entier (6 notes, suspendu)
- **Octave**: Déterminé par la longueur de course maximale de cellules vivantes
- **Stéréo**: Panning dérivé du centre de gravité du motif
- **Articulation**: Durée des notes fonction de la densité de cellules

### Architecture

Le projet distingue trois niveaux:

#### 1. Source canonique (`src/automate_elementaire_canonique.ml`)

Implémentation complète et bien documentée en multilingual:

- Lecture de configuration (JSON)
- Construction de grille et évolution bidirectionnelle
- Semis multicouches avec probabilités
- Analyse des motifs (symétrie, densité, transitions, centre de gravité)
- Synthèse sonore et configuration musicale
- Validation esthétique

#### 2. Module WASM (`src/automate_elementaire_wasm.ml`)

Sous-ensemble compilé en WebAssembly, exposant:

- **Primitives de transition**: `cellule_suivante`, `classe_wolfram`, `sortie_motif`
- **Données**: `note_regle`, `etiquette_note_regle`
- **Codes énumérés**: Formes, textures, modes de fusion
- **Audio (drone)**: Paramètres dérivés du numéro de règle seul
- **Musique générative**: Mappages de statistiques de grille vers paramètres musicaux

#### 3. Frontend statique (`public/ui.js`, `public/index.html`, `public/style.css`)

Interface dynamique et moteur de rendu:

- Analyse de grille en JavaScript (vitesse d'évolution, symétrie, centre de gravité)
- Moteur audio Web utilisant OscillatorNode, BiquadFilterNode, DelayNode, StereoPannerNode
- Rendu canvas 2D avec textures, dégradés, motifs cachés
- Compositing avec `OffscreenCanvas` et modes de fusion CSS
- Sérialisation d'état via URL (query parameters)
- Gestion de thème via CSS custom properties et localStorage

### Compilation et build

#### Prérequis

```bash
pip install -r requirements-build.txt
```

#### Build local

```bash
python -m multilingualprogramming scripts/compile_wasm.ml
```

Depuis la racine du dépôt. Cela génère:

- `public/cellcosmos.wasm` — binaire WebAssembly
- `public/cellcosmos.wat` — texte WebAssembly (pour inspection)
- `public/main.ml`, `public/automate_elementaire_*.ml` — copies des sources

#### Développement avec une branche locale de `multilingual`

```powershell
$env:MULTILINGUAL_DEV_PATH="..\multilingual"
python -m multilingualprogramming scripts/compile_wasm.ml
```

### Déploiement

Le workflow GitHub Actions [`deploy.yml`](.github/workflows/deploy.yml) automatise:

1. Compilation du source français vers WASM (avec version épinglée dans `requirements-build.txt`)
2. Vérification des exports WASM attendus
3. Déploiement de `public/` sur GitHub Pages

Un workflow planifié vérifie aussi la compatibilité amont (`multilingual:main`).

### Exports WASM

La validation des exports (dans `ui.js:validateWasmExports`) teste:

**Primitives CA**:
- `cellule_suivante(rule, left, center, right)` → 0 ou 1
- `classe_wolfram(rule)` → 1, 2, 3, ou 4
- `sortie_motif(rule, pattern_index)` → 0 ou 1

**Métadonnées**:
- `note_regle(rule)` → 0–6 (ID de règle notable)
- `etiquette_note_regle(rule)` → chaîne étiquette

**Énumérés**:
- `forme_code_*()` → 0–3 (rect, circle, ellipse, triangle)
- `texture_code_*()` → 0–4 (solide, points, hachures, dégradé, bruit)
- `fusion_code_*()` → 0–7 (8 modes de fusion)

**Audio (drone)**:
- `frequence_fondamentale(rule)` → Hz
- `forme_onde_synthese(rule)` → 1–4 (code forme d'onde)
- `desaccord_oscillateur_secondaire(rule)` → cents
- `calcul_densite_densites_cellulaires(total, vivantes)` → 0.0–1.0
- `frequence_cutoff_filtre_sonore(densite, base_freq)` → Hz
- `temps_delai_reverb(rule)` → secondes

**Musique générative**:
- `tempo_depuis_vitesse(vitesse_sur_1000)` → BPM
- `gamme_depuis_classe(classe)` → 0–3 (code gamme)
- `reverb_depuis_symetrie(symetrie_sur_1000)` → 0–1000
- `pan_depuis_centre(centre_sur_1000)` → -500 à +500
- `octave_depuis_course(course_max, colonnes)` → 3–5
- `note_depuis_colonne(col, largeur, gamme_len)` → indice gamme
- `duree_note_depuis_densite(densite_sur_1000)` → ms

### Utilisation

1. Ouvrir `public/index.html` via un serveur HTTP local (`python -m http.server`, `npx serve`, etc.)
2. Ajuster la règle, les paramètres de rendu, et l'état initial
3. Cliquer sur « ▶ Son » pour activer le drone ambiant
4. Cliquer sur « ▶ Séquenceur » pour activer la musique générative
5. Partager un lien encodant tous les paramètres via « Copier le lien »

### Ressources

- **Règles Wolfram**: [A New Kind of Science](https://www.wolframalpha.com/input/?i=wolfram+rule+30)
- **Automates cellulaires**: [Wikipedia - Elementary CA](https://en.wikipedia.org/wiki/Elementary_cellular_automaton)
- **Multilingual Programming**: [Dépôt principal](https://github.com/multilingualprogramming/multilingual)
- **Web Audio API**: [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
