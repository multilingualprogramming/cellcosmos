## Cellcosmos

Cellcosmos est un explorateur d'automates cellulaires elementaires ecrit avec `multilingualprogramming` en francais et compile en WebAssembly.

### Objectif

Le projet a pour but de montrer qu'un programme scientifique et visuel peut etre :

- defini dans des sources multilingual francaises simples
- compile en WASM pour un usage direct dans le navigateur
- deploye comme site statique sans serveur applicatif

L'application permet d'explorer les 256 regles elementaires, de modifier leur rendu visuel, et d'observer immediatement les motifs generes.

### Structure

- `src/automate_elementaire_canonique.ml`: source canonique complete de l'automate
- `src/automate_elementaire_wasm.ml`: sous-ensemble WASM-compatible pour le site
- `src/main.ml`: point d'entree du bundle WASM
- `scripts/compile_wasm.ml`: pipeline de build en source multilingual
- `public/`: site statique deploye sur GitHub Pages

### Build local

```bash
python -m pip install "multilingualprogramming[wasm]"
python -c "from multilingualprogramming import ProgramExecutor; from multilingualprogramming.codegen.runtime_builtins import RuntimeBuiltins; from pathlib import Path; script=Path('scripts/compile_wasm.ml'); code=ProgramExecutor(language='fr').transpile(script.read_text(encoding='utf-8')); ns=RuntimeBuiltins('fr').namespace(); ns.update({'__name__':'__compile_wasm_ml__','__file__':str(script)}); exec(code, ns); ns['main']()"
```

Le build genere :

- `public/cellcosmos.wasm`
- `public/cellcosmos.wat`
- `public/main.ml`
- `public/automate_elementaire_canonique.ml`
- `public/automate_elementaire_wasm.ml`

### Deployment

Le workflow [deploy.yml](/c:/Users/john.samuel/Documents/Research/Workspace/cellcosmos/.github/workflows/deploy.yml) compile le source francais vers WASM, verifie les exports attendus, puis deploye `public/` sur GitHub Pages.

### Architecture

Le projet distingue maintenant deux niveaux :

- la source canonique, qui capture l'objectif complet du projet original : lecture de configuration, generation par lots, semis multicouches, couleurs, formes et evolution probabiliste
- le module WASM-compatible, plus compact, utilise par l'interface statique pour calculer rapidement les transitions dans le navigateur

### Note sur les fichiers Python

Les anciens fichiers Python applicatifs ont ete supprimes. Il ne reste plus de fichier `.py` versionne dans le depot.
