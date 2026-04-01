importer io
importer importlib
importer os
importer shutil
importer sys
importer random
depuis pathlib importer Path
importer html

déf trouver_racine():
    soit candidats = [Path.cwd().resolve(), Path.cwd().resolve().parent]
    pour candidat dans candidats:
        si (candidat / "src" / "main.ml").exists() et (candidat / "scripts" / "compile_wasm.ml").exists():
            retour candidat
    lever RuntimeError("Impossible de trouver la racine du depot. Executez cette commande depuis la racine du projet.")


soit RACINE = trouver_racine()
soit SOURCE_ML = RACINE / "src" / "main.ml"
soit MODULE_WASM_ML = RACINE / "src" / "automate_elementaire_wasm.ml"
soit MODULE_CANONIQUE_ML = RACINE / "src" / "automate_elementaire_canonique.ml"
soit DOSSIER_PUBLIC = RACINE / "public"
soit SORTIE_WAT = DOSSIER_PUBLIC / "cellcosmos.wat"
soit SORTIE_WASM = DOSSIER_PUBLIC / "cellcosmos.wasm"
soit SORTIE_GALERIE = DOSSIER_PUBLIC / "gallery-fragment.html"
soit DOSSIER_VIGNETTES = DOSSIER_PUBLIC / "gallery"


déf ajouter_depot_multilingual_au_chemin():
    soit chemin_dev = os.environ.get("MULTILINGUAL_DEV_PATH", "").strip()
    si non chemin_dev:
        retour

    soit candidat = Path(chemin_dev).expanduser()
    si non candidat.is_absolute():
        candidat = (RACINE / candidat).resolve()
    si non (candidat / "multilingualprogramming" / "__init__.py").exists():
        lever RuntimeError(f"MULTILINGUAL_DEV_PATH ne pointe pas vers un depot multilingual valide: {candidat}")
    si non (str(candidat) dans sys.path):
        sys.path.insert(0, str(candidat))


déf charger_programme(source):
    ajouter_depot_multilingual_au_chemin()
    soit lexer_module = importlib.import_module("multilingualprogramming.lexer.lexer")
    soit parser_module = importlib.import_module("multilingualprogramming.parser.parser")
    soit Lexer = lexer_module.Lexer
    soit Parser = parser_module.Parser
    soit lexeur = Lexer(source, language="fr")
    soit jetons = lexeur.tokenize()
    soit analyseur = Parser(jetons, source_language=(lexeur.language ou "fr"))
    retour analyseur.parse()


déf generer_wat_et_wasm(source):
    ajouter_depot_multilingual_au_chemin()
    soit wat_generator_module = importlib.import_module("multilingualprogramming.codegen.wat_generator")
    soit WATCodeGenerator = wat_generator_module.WATCodeGenerator
    soit wasmtime = importlib.import_module("wasmtime")
    soit programme = charger_programme(source)
    soit texte_wat = WATCodeGenerator().generate(programme)
    soit octets_wasm = wasmtime.wat2wasm(texte_wat)
    retour [texte_wat, octets_wasm]


déf construire_bundle():
    soit source_main = SOURCE_ML.read_text(encoding="utf-8")
    soit source_module = MODULE_WASM_ML.read_text(encoding="utf-8")
    soit saut_ligne = chr(10)
    soit lignes = []
    pour ligne dans source_main.splitlines():
        si ligne.strip().startswith("importer automate_elementaire_wasm"):
            continuer
        lignes.append(ligne)
    soit bundle = ["# Bundle WASM genere automatiquement", source_module.strip(), "", saut_ligne.join(lignes).strip(), ""]
    retour saut_ligne.join(bundle).strip() + saut_ligne


déf classe_wolfram_locale(numero_regle):
    si numero_regle dans [0, 8, 32, 40, 64, 72, 96, 104, 128, 136, 160, 168, 192, 200, 224, 232, 248, 255]:
        retour 1
    si numero_regle dans [18, 22, 30, 45, 60, 90, 105, 122, 126, 150]:
        retour 3
    si numero_regle dans [54, 106, 110, 137, 193]:
        retour 4
    retour 2


déf etiquette_note_regle_locale(numero_regle):
    si numero_regle == 30:
        retour "Chaos pseudo aleatoire"
    si numero_regle == 90:
        retour "Triangle de Sierpinski"
    si numero_regle == 110:
        retour "Calcul universel"
    si numero_regle == 150:
        retour "XOR avec auto-reference"
    si numero_regle == 184:
        retour "Modele de trafic"
    si numero_regle == 254:
        retour "Frontieres seulement"
    retour f"Classe {classe_wolfram_locale(numero_regle)}"


déf cellule_suivante_locale(numero_regle, gauche, centre, droite):
    soit indice = gauche * 4 + centre * 2 + droite
    retour (numero_regle // (2 ** indice)) % 2


déf prochaine_generation(courante, numero_regle, probabilite=1.0, circulaire=Faux, direction="ltr", graine=0):
    soit taille = len(courante)
    soit sortie = []
    soit generateur = random.Random(graine)
    soit indices = []
    si direction == "ltr":
        indices = range(taille)
    sinon:
        indices = reversed(range(taille))

    pour indice dans indices:
        si generateur.random() > probabilite:
            sortie.append(0)
            continuer
        soit gauche = 0
        soit centre = 0
        soit droite = 0
        si direction == "ltr":
            si indice > 0:
                gauche = courante[indice - 1]
            sinonsi circulaire:
                gauche = courante[-1]
            sinon:
                gauche = 0
            centre = courante[indice]
            si indice < taille - 1:
                droite = courante[indice + 1]
            sinonsi circulaire:
                droite = courante[0]
            sinon:
                droite = 0
        sinon:
            si indice > 0:
                droite = courante[indice - 1]
            sinonsi circulaire:
                droite = courante[-1]
            sinon:
                droite = 0
            centre = courante[indice]
            si indice < taille - 1:
                gauche = courante[indice + 1]
            sinonsi circulaire:
                gauche = courante[0]
            sinon:
                gauche = 0
        sortie.append(cellule_suivante_locale(numero_regle, gauche, centre, droite))

    si direction == "ltr":
        retour sortie
    retour sortie[::-1]


déf evoluer_automate_locale(numero_regle, rows, cols, seed=42):
    soit grille = [[0] * cols pour _ dans range(rows)]
    soit origine = rows // 2
    grille[origine][cols // 2] = 1

    pour row dans range(origine + 1, rows):
        grille[row] = prochaine_generation(grille[row - 1], numero_regle, 1.0, Faux, "ltr", seed + row + 1)

    pour row dans range(origine - 1, -1, -1):
        grille[row] = prochaine_generation(grille[row + 1], numero_regle, 1.0, Faux, "ltr", seed + rows + row + 1)

    retour grille


déf couleur_ligne(index, total):
    soit debut = (255, 157, 77)
    soit milieu = (255, 209, 102)
    soit fin = (83, 176, 255)
    soit local_t = 0
    soit rouge = 0
    soit vert = 0
    soit bleu = 0
    si total <= 1:
        retour debut
    soit progression = index / (total - 1)
    si progression <= 0.5:
        local_t = progression / 0.5
        rouge = round(debut[0] + (milieu[0] - debut[0]) * local_t)
        vert = round(debut[1] + (milieu[1] - debut[1]) * local_t)
        bleu = round(debut[2] + (milieu[2] - debut[2]) * local_t)
        retour (rouge, vert, bleu)
    local_t = (progression - 0.5) / 0.5
    rouge = round(milieu[0] + (fin[0] - milieu[0]) * local_t)
    vert = round(milieu[1] + (fin[1] - milieu[1]) * local_t)
    bleu = round(milieu[2] + (fin[2] - milieu[2]) * local_t)
    retour (rouge, vert, bleu)


déf generer_vignette_svg(numero_regle, rows=50, cols=50, taille_cellule=2):
    soit largeur = cols * taille_cellule
    soit hauteur = rows * taille_cellule
    soit lignes = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {largeur} {hauteur}" role="img" aria-label="Regle {numero_regle}">',
        f'<rect width="{largeur}" height="{hauteur}" fill="#08111f"/>',
    ]
    soit automate = evoluer_automate_locale(numero_regle, rows, cols)
    pour indice_ligne, ligne dans enumerate(automate):
        soit couleur = couleur_ligne(indice_ligne, rows)
        soit remplissage = f"rgb({couleur[0]},{couleur[1]},{couleur[2]})"
        pour indice_colonne, valeur dans enumerate(ligne):
            si valeur != 1:
                continuer
            soit position_x = indice_colonne * taille_cellule
            soit position_y = indice_ligne * taille_cellule
            lignes.append(f'<rect x="{position_x}" y="{position_y}" width="{taille_cellule}" height="{taille_cellule}" fill="{remplissage}"/>')
    lignes.append("</svg>")
    retour "".join(lignes)


déf nom_vignette(numero_regle):
    retour f"rule-{numero_regle:03d}.svg"


déf ecrire_vignettes_galerie():
    DOSSIER_VIGNETTES.mkdir(parents=Vrai, exist_ok=Vrai)
    pour numero_regle dans range(256):
        soit chemin = DOSSIER_VIGNETTES / nom_vignette(numero_regle)
        soit contenu = generer_vignette_svg(numero_regle) + "\n"
        chemin.write_text(contenu, encoding="utf-8")


déf generer_carte_galerie(numero_regle):
    soit etiquette = html.escape(etiquette_note_regle_locale(numero_regle))
    soit ouverture = f'<article class="gallery-item" data-rule="{numero_regle}" tabindex="0">'
    soit source_image = f'gallery/{nom_vignette(numero_regle)}'
    soit image = f'<img class="gallery-thumb" alt="Apercu de la regle {numero_regle}" src="{source_image}" loading="lazy" decoding="async"/>'
    soit legende = f'<div class="gallery-label"><strong>Regle {numero_regle}</strong><span>{etiquette}</span></div>'
    soit fermeture = "</article>"
    retour ouverture + image + legende + fermeture


déf generer_galerie_html():
    soit cartes = []
    pour numero_regle dans range(256):
        cartes.append(generer_carte_galerie(numero_regle))
    retour "\n".join(cartes)


déf ecrire_fragment_galerie():
    soit galerie = generer_galerie_html()
    SORTIE_GALERIE.write_text(galerie + "\n", encoding="utf-8")


déf main():
    si sys.stdout.encoding et non (sys.stdout.encoding.lower() dans ("utf-8", "utf8")):
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

    DOSSIER_PUBLIC.mkdir(parents=Vrai, exist_ok=Vrai)
    soit source = construire_bundle()
    soit artefacts = generer_wat_et_wasm(source)
    soit texte_wat = artefacts[0]
    soit octets_wasm = artefacts[1]
    SORTIE_WAT.write_text(texte_wat, encoding="utf-8")
    SORTIE_WASM.write_bytes(octets_wasm)

    shutil.copy(SOURCE_ML, DOSSIER_PUBLIC / "main.ml")
    shutil.copy(MODULE_WASM_ML, DOSSIER_PUBLIC / "automate_elementaire_wasm.ml")
    shutil.copy(MODULE_CANONIQUE_ML, DOSSIER_PUBLIC / "automate_elementaire_canonique.ml")
    ecrire_vignettes_galerie()
    ecrire_fragment_galerie()
    afficher(f"WAT ecrit: {SORTIE_WAT.relative_to(RACINE)}")
    afficher(f"WASM ecrit: {SORTIE_WASM.relative_to(RACINE)}")


main()
