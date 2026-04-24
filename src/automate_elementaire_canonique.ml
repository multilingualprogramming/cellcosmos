importer json
importer random


# Source canonique du projet.
# Ce module decrit l'automate elementaire complet :
# - lecture de config JSON
# - plages de regles
# - etats initiaux centre / sommet / base / aleatoire / personnalise / couches
# - evolution bidirectionnelle ou orientee selon le point d'origine
# - probabilite de transition
# - bord circulaire
# - generation de degrades de couleurs


déf parse_config(filepath):
    avec open(filepath, "r", encoding="utf-8") comme fichier:
        soit config = json.load(fichier)

    soit rows = config.get("rows", 100)
    soit cols = config.get("cols", 300)
    soit cell_size = config.get("cell_size", 5)
    soit shape = config.get("shape", "rect").lower()
    soit color1 = tuple(config.get("color1", [0, 0, 0]))
    soit colors2 = config.get("color2", [[255, 255, 255]])
    soit color_list = [tuple(c) pour c dans colors2]

    soit rules = set()
    pour rule_entry dans config.get("rules", []):
        si isinstance(rule_entry, int):
            rules.add(rule_entry)
        sinonsi isinstance(rule_entry, str):
            si "-" dans rule_entry:
                soit start, end = map(int, rule_entry.split("-"))
                rules.update(range(start, end + 1))
            sinon:
                rules.add(int(rule_entry))

    soit initial = config.get("initial", {"mode": "top"})
    soit probability = config.get("probability", 1.0)
    soit direction = config.get("direction", "ltr")
    soit circular = str(config.get("circular", "false")).lower() == "true"

    retour {
        "rows": rows,
        "cols": cols,
        "rules": sorted(rules),
        "color1": color1,
        "color_list": color_list,
        "cell_size": cell_size,
        "shape": shape,
        "initial": initial,
        "circular": circular,
        "probability": probability,
        "direction": direction,
    }


déf construire_grille(rows, cols):
    retour [[0] * cols pour _ dans range(rows)]


déf obtenir_origine_y_par_defaut(mode, rows):
    si mode == "top":
        retour 0
    si mode == "bottom":
        retour rows - 1
    retour rows // 2


déf normaliser_positions_initiales(initial, cols, rows):
    soit mode = initial.get("mode", "top")
    soit default_y = obtenir_origine_y_par_defaut(mode, rows)

    si mode == "random":
        soit count = initial.get("count", 1)
        soit origin_y = initial.get("y", default_y)
        soit xs = random.sample(range(cols), min(count, cols))
        retour [{"x": x, "y": origin_y} pour x dans xs]

    soit raw_positions = initial.get("positions", initial.get("points", []))
    si raw_positions:
        soit positions = []
        pour pos dans raw_positions:
            positions.append({
                "x": pos.get("x", cols // 2),
                "y": pos.get("y", default_y),
            })
        retour positions

    soit x = initial.get("x", cols // 2)
    soit y = initial.get("y", default_y)
    retour [{"x": x, "y": y}]


déf apply_initial_state(automaton, cols, rows, initial):
    soit positions = normaliser_positions_initiales(initial, cols, rows)
    soit origin_rows = set()

    pour pos dans positions:
        soit x = pos.get("x", cols // 2)
        soit y = pos.get("y", rows // 2)
        si 0 <= x < cols et 0 <= y < rows:
            automaton[y][x] = 1
            origin_rows.add(y)

    si non origin_rows:
        soit fallback_row = obtenir_origine_y_par_defaut(initial.get("mode", "top"), rows)
        automaton[fallback_row][cols // 2] = 1
        origin_rows.add(fallback_row)

    retour sorted(origin_rows)


déf fusionner_automates(automates, rows, cols):
    soit resultat = construire_grille(rows, cols)

    pour automaton dans automates:
        pour row dans range(rows):
            pour col dans range(cols):
                si automaton[row][col] == 1:
                    resultat[row][col] = 1

    retour resultat


déf get_rule_dict(rule_number):
    retour {f"{i:03b}": (rule_number >> i) & 1 pour i dans range(8)}


déf get_next_generation(current, rule_dict, circular=Faux, probability=1.0, direction="ltr"):
    soit next_gen = []
    soit size = len(current)
    soit indices = range(size) si direction == "ltr" sinon reversed(range(size))

    pour i dans indices:
        si random.random() > probability:
            continuer

        si direction == "ltr":
            soit left = current[i - 1] si i > 0 sinon (current[-1] si circular sinon 0)
            soit center = current[i]
            soit right = current[i + 1] si i < size - 1 sinon (current[0] si circular sinon 0)
        sinon:
            soit right = current[i - 1] si i > 0 sinon (current[-1] si circular sinon 0)
            soit center = current[i]
            soit left = current[i + 1] si i < size - 1 sinon (current[0] si circular sinon 0)

        soit key = f"{left}{center}{right}"
        next_gen.append(rule_dict[key])

    retour next_gen si direction == "ltr" sinon next_gen[::-1]


déf interpolate_color(c1, c2, t):
    retour tuple(int(c1[i] + (c2[i] - c1[i]) * t) pour i dans range(3))


déf generate_gradient(colors, steps):
    si len(colors) < 2:
        retour [colors[0]] * steps

    soit gradient = []
    soit segments = len(colors) - 1
    soit steps_per_segment = steps / segments

    pour i dans range(steps):
        soit segment = min(int(i / steps_per_segment), segments - 1)
        soit local_t = (i - segment * steps_per_segment) / steps_per_segment
        soit c1 = colors[segment]
        soit c2 = colors[segment + 1]
        gradient.append(interpolate_color(c1, c2, local_t))

    retour gradient


déf evoluer_automate(rule_number, rows, cols, initial, circular=Faux, probability=1.0, direction="ltr"):
    soit positions = normaliser_positions_initiales(initial, cols, rows)
    soit automates = []
    soit index_position = 0
    soit seed_base = initial.get("seed", 0)
    soit rule_dict = get_rule_dict(rule_number)

    pour position dans positions:
        soit automaton = construire_grille(rows, cols)
        soit x = position.get("x", cols // 2)
        soit origin_row = position.get("y", obtenir_origine_y_par_defaut(initial.get("mode", "top"), rows))

        si non (0 <= x < cols et 0 <= origin_row < rows):
            continuer

        automaton[origin_row][x] = 1

        soit random_state = random.getstate()
        random.seed(seed_base + index_position)

        pour row dans range(origin_row + 1, rows):
            automaton[row] = get_next_generation(automaton[row - 1], rule_dict, circular, probability, direction)

        pour row dans range(origin_row - 1, -1, -1):
            automaton[row] = get_next_generation(automaton[row + 1], rule_dict, circular, probability, direction)

        random.setstate(random_state)
        automates.append(automaton)
        index_position = index_position + 1

    si non automates:
        soit automaton = construire_grille(rows, cols)
        soit origin_row = obtenir_origine_y_par_defaut(initial.get("mode", "top"), rows)
        soit random_state = random.getstate()
        random.seed(seed_base)
        automaton[origin_row][cols // 2] = 1

        pour row dans range(origin_row + 1, rows):
            automaton[row] = get_next_generation(automaton[row - 1], rule_dict, circular, probability, direction)

        pour row dans range(origin_row - 1, -1, -1):
            automaton[row] = get_next_generation(automaton[row + 1], rule_dict, circular, probability, direction)

        random.setstate(random_state)
        automates.append(automaton)

    si len(automates) == 1:
        retour automates[0]

    retour fusionner_automates(automates, rows, cols)


déf evoluer_mode_couches(rule_number, rows, cols, initial, color_list, circular=Faux, probability=1.0, direction="ltr"):
    soit couches = initial.get("positions", [])
    soit resultats = []
    si len(color_list) != len(couches):
        retour []

    pour idx dans range(len(couches)):
        soit automaton = construire_grille(rows, cols)
        soit position = couches[idx]
        automaton = evoluer_automate(rule_number, rows, cols, position, circular, probability, direction)

        resultats.append({
            "automaton": automaton,
            "row_colors": [color_list[idx]] * rows,
        })

    retour resultats


déf decrire_generation(config):
    soit initial = config["initial"]
    soit mode = initial.get("mode", "top")
    si mode == "layers":
        retour "generation multicouche avec palette par couche"
    si mode == "custom":
        retour "generation avec cellules semees manuellement"
    si mode == "random":
        retour "generation probabiliste a partir d'un semis aleatoire"
    si mode == "bottom":
        retour "generation standard a partir de la bordure inferieure"
    si mode == "center":
        retour "generation standard a partir d'un centre unique"
    retour "generation standard a partir de la bordure superieure"


# Esthetique avancee : textures, fusion et synthese sonore

déf modes_texture():
    retour {
        "solide": 0,
        "points": 1,
        "hachures": 2,
        "gradient": 3,
        "bruit": 4,
    }


déf modes_fusion():
    retour {
        "normal": 0,
        "ecran": 1,
        "multiplier": 2,
        "superposer": 3,
        "eclaircir": 4,
        "assombrir": 5,
        "difference": 6,
        "esquiver": 7,
    }


# Synthese sonore : parametres derives de la regle et la densite du motif
déf synthese_sonore_config(numero_regle, densite_motif):
    soit classe = classe_wolfram(numero_regle)
    soit frequence = 110 * pow(2, numero_regle / 64)
    soit formes = {1: "sine", 2: "triangle", 3: "sawtooth", 4: "square"}

    retour {
        "frequence_fondamentale": frequence,
        "forme_onde": formes.get(classe, "sine"),
        "desaccord_secondaire": (numero_regle % 12) * 100,
        "gain_oscillateur_2": 0.3,
        "cutoff_filtre": 200 + densite_motif * 3000,
        "temps_delai": 0.1 + (numero_regle % 16) / 160,
        "feedback_delai": 0.25,
        "gain_maitre": 0.18,
    }


déf descriptions_texture_graphique():
    retour {
        "solide": "Remplissage uniforme, rendu classique",
        "points": "Petit point centre dans chaque cellule",
        "hachures": "Motif de hachures diagonales entrecroisees",
        "gradient": "Degrade radial du centre vers les bords",
        "bruit": "Remplissage avec bruit procedural seche",
    }


déf descriptions_mode_fusion():
    retour {
        "normal": "Superposition standard (source-over)",
        "ecran": "Mode clair, ideal pour les couleurs brillantes",
        "multiplier": "Assombrit les chevauchements",
        "superposer": "Contraste eleve",
        "eclaircir": "Garde les pixels les plus clairs",
        "assombrir": "Garde les pixels les plus sombres",
        "difference": "Inversion progressive",
        "esquiver": "Decoloration des couches foncees",
    }


déf valider_config_esthetique(config):
    soit texture = config.get("texture", "solide")
    soit fusion = config.get("fusion", "normal")
    soit opacite = config.get("opacite", 1.0)
    soit activer_son = config.get("activer_son", Faux)

    soit modes_tex = modes_texture()
    soit modes_fus = modes_fusion()

    si texture non dans modes_tex:
        retour {"valide": Faux, "erreur": f"Texture inconnue: {texture}"}

    si fusion non dans modes_fus:
        retour {"valide": Faux, "erreur": f"Mode de fusion inconnu: {fusion}"}

    si opacite < 0 ou opacite > 1:
        retour {"valide": Faux, "erreur": "Opacite doit etre entre 0 et 1"}

    retour {"valide": Vrai}
