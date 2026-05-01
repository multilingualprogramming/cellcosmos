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

#### Morphose entre règles

- **Transition fluide**: Morphing continu entre deux règles (source et cible)
- **Intensité configurable**: Contrôle du taux de transition (0–1000)
- **Transition par motif**: Transformation progressive bit par bit de chaque motif d'entrée

#### Rendu visuel avancé

- **Formes de cellules**: Rectangle, cercle, ellipse, triangle
- **Textures**: Solide, points, hachures croisées, dégradé radial, bruit procédural
- **Dégradés de couleurs**: Palette globale multiples arrêts de couleur + dégradés par point d'origine
- **Modes de fusion**: Normal (source-over), Écran, Multiplier, Superposer, Éclaircir, Assombrir, Différence, Esquiver
- **Opacité des couches**: Contrôle fine de la transparence (0.0–1.0)
- **Thèmes**: 8 thèmes préchargés (Cosmos, Nature, Espace, Feu, Océan, Aurore, Lave, Fantôme) avec mode clair/sombre et persistance localStorage

#### Paramètres d'évolution

- **Semis initiaux**: Haut, centre, bas, aléatoire, points personnalisés
  - Édition interactive des points sur le canevas (clic, glisser, clic-droit pour supprimer)
  - Opérations de symétrie (miroir horizontal, vertical, radial, tuile 2×2)
  - Support de couches multiples avec règles, dégradés et paramètres avancés associés par point
  - Configuration par point: probabilité, champ stochastique, frontière circulaire, direction de lecture, morphose et propagation
  - Configuration aléatoire avec contrôle du nombre et de la graine
- **Probabilité**: Transitions avec chance configurable (0.0–1.0)
- **Probabilité modulée**: Variation de la probabilité du haut vers le bas selon la ligne
- **Direction de lecture**: Interprétation du voisinage Wolfram en LTR (gauche→droite) ou RTL (droite→gauche)
- **Propagation**: Croissance depuis chaque origine vers le haut, le bas, les deux directions, la gauche, la droite ou un angle précis
- **Frontière**: Bord circulaire ou tronqué
- **Visibilité progressive**: Expansion contrôlée du domaine vivant depuis un point d'origine
- **Timeline temporelle**: Sélection de la génération à afficher (0–100% de l'évolution)
- **Vitesse d'animation**: Contrôle de la vitesse de lecture (0.1–6.0×)
- **Pause sur collision**: Arrêt automatique lors de détection de collisions

#### Son ambiant

- **Drone continu**: Fréquence fondamentale dérivée du numéro de règle (110–~3520 Hz)
- **Timbre**: Classe Wolfram → forme d'onde (sinusoïde, triangle, dent de scie, carré)
- **Filtre dynamique**: Fréquence de coupure modulée par la densité de cellules vivantes (200–3200 Hz)
- **Désaccord secondaire**: Modulation de hauteur supplémentaire basée sur la règle
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
- **Reverb basée sur la symétrie**: Modulation de la réverbération basée sur la symétrie du motif

#### Outils d'exploration et perturbation

**Modes d'exploration**:
- **Inspect**: Analyse détaillée d'une cellule sélectionnée
- **Points**: Édition interactive des points initiaux sur la grille
- **Perturb**: Perturbation en temps réel avec impulsions énergétiques

**Microscope (inspection cellulaire)**:
- État final et source: Visualisation de la transformation
- Motif: Affichage du voisinage (gauche, centre, droite)
- Règle effective: Sortie calculée selon la règle actuelle
- Morphose: Valeur de transition si morphing activé
- Probabilité: Chance de transition appliquée
- Origine: Localisation et distance du point de germination
- Perturbations: Historique des modifications apportées

**Perturbations spatiales**:
- **Type d'événement**: Impulsion (pulse) configurée
- **Rayon d'effet**: Propagation spatiale (0–50 pixels)
- **Force**: Intensité de modification (0.1–1.0)
- **Application interactive**: Clic/drag sur le canvas pour déclencher des perturbations

#### Métriques et analytique (Life Signatures)

- **Entropie**: Mesure du désordre (0 = déterministe, 1 = chaotique)
- **Compacité**: Mesure de la densité et cohésion des structures
- **Fragmentation**: Détection du nombre de clusters distincts
- **Taux de croissance**: Évolution du nombre de cellules vivantes
- **Symétrie**: Analyse des symétries horizontales et verticales
- **Classification dynamique**: 
  - Stable: Peu de changement, compact
  - Chaotique: Haute entropie, peu de structure
  - Organisé: Compacité et symétrie élevées
  - Dispersé: Haut fragmentation
  - Croissance: Modification rapide
- **Historique**: Suivi des métriques sur les 60 dernières générations
- **Couleurs de diagnostic**: Code couleur pour évaluer rapidement la santé de chaque métrique

#### Matter Lab (Laboratoire de matière)

- **Formes géométriques**: Rectangle, cercle, anneau (support de plusieurs types de géométries)
- **Modes de géométrie**: 
  - Inside: Cellules affectées à l'intérieur de la forme
  - Outside: Cellules affectées à l'extérieur de la forme
- **Paramètres de forme**:
  - Largeur et hauteur configurables
  - Rayon intérieur (pour les anneaux)
- **Champs de force**: Peinture et effets de champ directement dans la grille
  - Taille du pinceau (brush) configurable
  - Force de modification (0.1–1.0)
  - Modes de champ et peinture
- **Événements spatiaux**: Impulsions et perturbations locales
  - Rayon d'effet (2–50 pixels)
  - Force de l'impulsion (0.1–1.0)
  - Type d'événement configurable
- **Visualisation et contrôle**:
  - Affichage/masquage du masque géométrique
  - Affichage/masquage du champ de force
  - Affichage/masquage des événements
  - HUD avec densité, champ, et compteur d'événements
- **Opérations de nettoyage**:
  - Effacer le champ
  - Effacer les événements
  - Réinitialiser le laboratoire complet
- **Export**: Téléchargement PNG de la visualisation actuelle
- **Sélection aléatoire**: Bouton pour générer une règle aléatoire

#### Interface organisée

- **Onglets principaux**: Explorateur, Matter Lab, Galerie, Sources
- **Onglets de la barre latérale**:
  - Affichage: Taille, formes, textures, couleurs
  - Points: Configuration des points initiaux et couches
  - Rendu: Modes de fusion, opacité, dégradés
  - Avancé: Probabilité, direction, morphose, exploration spatiale
  - Analytique: Métriques et analyse du comportement
- **Palette de commandes**: Accès rapide aux fonctions principales (Ctrl+K)
- **HUD du rendu**: Affichage en temps réel des paramètres visuels et métriques
- **Partage de configuration**: Encodage d'état complet via URL query parameters
- **Contrôles de visualisation**:
  - Bouton thème (mode clair/sombre)
  - Plein écran (F)
  - Copie de lien (partage de configuration)
- **Galerie préchargée**: Aperçu visuel de toutes les 256 règles disponibles
- **Accès aux sources**: Liens vers le code source et ressources externes

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
- **Propagation et options de point**: codes de propagation, normalisation d'angle et repli de probabilité par point
- **Audio (drone)**: Paramètres dérivés du numéro de règle seul
- **Musique générative**: Mappages de statistiques de grille vers paramètres musicaux

#### 3. Frontend statique

**Interface principal** (`public/ui.js`, `public/index.html`, `public/style.css`):
- Analyse de grille en JavaScript (vitesse d'évolution, symétrie, centre de gravité)
- Moteur audio Web utilisant OscillatorNode, BiquadFilterNode, DelayNode, StereoPannerNode
- Rendu canvas 2D avec textures, dégradés, motifs cachés
- Compositing avec `OffscreenCanvas` et modes de fusion CSS
- Sérialisation d'état via URL (query parameters)
- Gestion de thème via CSS custom properties et localStorage
- Modes d'interaction: inspection, édition de points, perturbation
- Édition fine des points: règle, palette, probabilité, stochasticité, morphose et propagation par origine
- Microscope cellulaire pour analyse détaillée

**Métriques et analytique** (`public/metrics.js`):
- Parcours des grilles dans le navigateur, avec formules canoniques déléguées au WASM quand disponible
- Calcul d'entropie (désordre binaire)
- Analyse de compacité (densité et cohésion)
- Détection de fragmentation (nombre de clusters)
- Suivi du taux de croissance (évolution des cellules vivantes)
- Mesure de symétrie (horizontale et verticale)
- Classification dynamique (5 catégories de comportement)
- Historique glissant (60 générations)
- Visualisation en temps réel avec code couleur

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
- `propagation_code(mode)` → 0–5 (both, down, up, right, left, angle)
- `propagation_angle_normalise(angle)` → angle normalisé dans 0–359
- `option_probabilite_point(globale, point)` → probabilité effective avec repli global

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

**Life Signatures**:
- `metrique_entropie_depuis_comptage(total, vivantes)` → 0.0-1.0
- `metrique_compacite_depuis_mesures(vivantes, perimetre)` → 0.0-1.0
- `metrique_fragmentation_depuis_mesures(groupes, vivantes)` → 0.0-1.0
- `metrique_croissance_depuis_comptages(precedentes, courantes)` → -1.0-1.0
- `metrique_symetrie_depuis_correspondances(horizontales, verticales, total)` → score de symetrie
- `metrique_classe_dynamique(entropie, compacite, fragmentation, symetrie, croissance)` → 1-5

### Utilisation

1. Ouvrir `public/index.html` via un serveur HTTP local (`python -m http.server`, `npx serve`, etc.)
2. Ajuster la règle, les paramètres de rendu, et l'état initial
3. Dans l'onglet Points, activer les points personnalisés pour régler chaque origine indépendamment
4. Dans l'onglet Avancé, choisir la direction de lecture et la propagation globale
5. Cliquer sur « ▶ Son » pour activer le drone ambiant
6. Cliquer sur « ▶ Séquenceur » pour activer la musique générative
7. Partager un lien encodant tous les paramètres via « Copier le lien »

### Ressources

- **Règles Wolfram**: [A New Kind of Science](https://www.wolframalpha.com/input/?i=wolfram+rule+30)
- **Automates cellulaires**: [Wikipedia - Elementary CA](https://en.wikipedia.org/wiki/Elementary_cellular_automaton)
- **Multilingual Programming**: [Dépôt principal](https://github.com/multilingualprogramming/multilingual)
- **Web Audio API**: [MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)

## Architecture et Création
- John Samuel