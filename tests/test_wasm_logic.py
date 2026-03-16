import unicodedata
from pathlib import Path


def _load_namespace():
    source = Path("src/automate_elementaire_wasm.ml").read_text(encoding="utf-8")
    source = unicodedata.normalize("NFC", source)
    translated = (
        source.replace("déf", "def")
        .replace("dÃ©f", "def")
        .replace("Vrai", "True")
        .replace("Faux", "False")
        .replace("sinonsi", "elif")
        .replace("sinon", "else")
        .replace("retour", "return")
        .replace("soit ", "")
        .replace("si ", "if ")
        .replace(" dans ", " in ")
        .replace("importer", "import")
    )
    namespace = {}
    exec(translated, namespace)
    return namespace


def test_cellule_suivante_matches_ci_smoke_cases():
    ns = _load_namespace()
    cellule_suivante = ns["cellule_suivante"]

    checks = [
        (90, 1, 0, 1, 0),
        (90, 1, 0, 0, 1),
        (30, 1, 1, 1, 0),
        (30, 0, 1, 0, 1),
    ]

    for rule, left, center, right, expected in checks:
        assert cellule_suivante(rule, left, center, right) == expected


def test_classe_wolfram_matches_ci_smoke_cases():
    ns = _load_namespace()
    classe_wolfram = ns["classe_wolfram"]

    checks = [
        (30, 3),
        (110, 4),
        (255, 1),
        (73, 2),
    ]

    for rule, expected in checks:
        assert classe_wolfram(rule) == expected
