importer io
importer importlib
importer shutil
importer sys
depuis pathlib importer Path

soit RACINE = Path(__file__).parent.parent
soit SOURCE_ML = RACINE / "src" / "main.ml"
soit MODULE_ML = RACINE / "src" / "automate_elementaire.ml"
soit DOSSIER_PUBLIC = RACINE / "public"
soit SORTIE_WAT = DOSSIER_PUBLIC / "cellcosmos.wat"
soit SORTIE_WASM = DOSSIER_PUBLIC / "cellcosmos.wasm"


déf ajouter_depot_multilingual_au_chemin():
    soit candidats = [RACINE.parent / "multilingual", Path.home() / "Documents" / "Research" / "Workspace" / "multilingual"]
    pour candidat dans candidats:
        si (candidat / "multilingualprogramming" / "__init__.py").exists():
            si non (str(candidat) dans sys.path):
                sys.path.insert(0, str(candidat))
            retour


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
    retour texte_wat, octets_wasm


déf construire_bundle():
    soit source_main = SOURCE_ML.read_text(encoding="utf-8")
    soit source_module = MODULE_ML.read_text(encoding="utf-8")
    soit lignes = []
    pour ligne dans source_main.splitlines():
        si ligne.strip().startswith("importer automate_elementaire"):
            continuer
        lignes.append(ligne)
    soit bundle = ["# Bundle WASM genere automatiquement", source_module.strip(), "", "\n".join(lignes).strip(), ""]
    retour "\n".join(bundle).strip() + "\n"


déf main():
    si sys.stdout.encoding et non (sys.stdout.encoding.lower() dans ("utf-8", "utf8")):
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

    DOSSIER_PUBLIC.mkdir(parents=Vrai, exist_ok=Vrai)
    soit source = construire_bundle()
    soit texte_wat, octets_wasm = generer_wat_et_wasm(source)
    SORTIE_WAT.write_text(texte_wat, encoding="utf-8")
    SORTIE_WASM.write_bytes(octets_wasm)

    shutil.copy(SOURCE_ML, DOSSIER_PUBLIC / "main.ml")
    shutil.copy(MODULE_ML, DOSSIER_PUBLIC / "automate_elementaire.ml")
    afficher(f"WAT ecrit: {SORTIE_WAT.relative_to(RACINE)}")
    afficher(f"WASM ecrit: {SORTIE_WASM.relative_to(RACINE)}")
