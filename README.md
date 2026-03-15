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
python -m pip install -r requirements-build.txt
python scripts/compile_wasm.py
```

Pour tester explicitement une copie locale du depot `multilingual` au lieu de la version epinglee :

```powershell
$env:MULTILINGUAL_DEV_PATH="..\multilingual"
python scripts/compile_wasm.py
```

Le build genere :

- `public/cellcosmos.wasm`
- `public/cellcosmos.wat`
- `public/main.ml`
- `public/automate_elementaire_canonique.ml`
- `public/automate_elementaire_wasm.ml`

### Deployment

Le workflow [deploy.yml](/c:/Users/john.samuel/Documents/Research/Workspace/cellcosmos/.github/workflows/deploy.yml) compile le source francais vers WASM avec la version epinglee dans `requirements-build.txt`, verifie les exports attendus, puis deploye `public/` sur GitHub Pages.

Un workflow planifie surveille aussi la compatibilite avec la version epinglee, la derniere version publiee et la branche `main` du depot amont `johnsamuelwrites/multilingual`.

### Architecture

Le projet distingue maintenant deux niveaux :

- la source canonique, qui capture l'objectif complet du projet original : lecture de configuration, generation par lots, semis multicouches, couleurs, formes et evolution probabiliste
- le module WASM-compatible, plus compact, utilise par l'interface statique pour calculer rapidement les transitions dans le navigateur

### Note sur les fichiers Python

Les anciens fichiers Python applicatifs ont ete supprimes. Il ne reste plus de fichier `.py` versionne dans le depot.
