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
        .replace("pour ", "for ")
        .replace(" ou ", " or ")
        .replace(" et ", " and ")
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


def test_sortie_motif_matches_expected_rule_bits():
    ns = _load_namespace()
    sortie_motif = ns["sortie_motif"]

    expected = {
        0: 0,
        1: 1,
        2: 0,
        3: 1,
        4: 1,
        5: 0,
        6: 1,
        7: 0,
    }

    for motif, bit in expected.items():
        assert sortie_motif(90, motif) == bit


def test_note_regle_returns_stable_note_ids():
    ns = _load_namespace()
    note_regle = ns["note_regle"]

    assert note_regle(30) == 1
    assert note_regle(90) == 2
    assert note_regle(110) == 3
    assert note_regle(150) == 4
    assert note_regle(184) == 5
    assert note_regle(254) == 6
    assert note_regle(73) == 0


def test_etiquette_note_regle_returns_multilingual_labels():
    ns = _load_namespace()
    etiquette_note_regle = ns["etiquette_note_regle"]

    assert etiquette_note_regle(30) == "Chaos pseudo aleatoire"
    assert etiquette_note_regle(90) == "Triangle de Sierpinski"
    assert etiquette_note_regle(73) == ""


def test_composante_interpolee_rounds_like_ui_gradient():
    ns = _load_namespace()
    composante_interpolee = ns["composante_interpolee"]

    assert composante_interpolee(0, 255, 0) == 0
    assert composante_interpolee(0, 255, 500) == 128
    assert composante_interpolee(0, 255, 1000) == 255


def test_progression_morphosee_scales_distance_by_intensity():
    ns = _load_namespace()
    progression_morphosee = ns["progression_morphosee"]

    assert progression_morphosee(0, 10, 1000) == 0
    assert progression_morphosee(5, 10, 1000) == 500
    assert progression_morphosee(10, 10, 600) == 600


def test_regle_morphee_reveals_target_bits_progressively():
    ns = _load_namespace()
    regle_morphee = ns["regle_morphee"]

    assert regle_morphee(0, 255, 0) == 0
    assert regle_morphee(0, 255, 125) == 1
    assert regle_morphee(0, 255, 500) == 15
    assert regle_morphee(0, 255, 1000) == 255


def test_cellule_morphosee_uses_morphed_rule():
    ns = _load_namespace()
    cellule_morphosee = ns["cellule_morphosee"]

    assert cellule_morphosee(0, 255, 0, 1, 0, 1) == 0
    assert cellule_morphosee(0, 255, 1000, 1, 0, 1) == 1
