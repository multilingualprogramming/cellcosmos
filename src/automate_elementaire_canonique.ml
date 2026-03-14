importer json
importer random


# Source canonique du projet.
# Ce module decrit l'automate elementaire complet :
# - lecture de config JSON
# - plages de regles
# - etats initiaux centre / aleatoire / personnalise / couches
# - evolution bidirectionnelle
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

    soit initial = config.get("initial", {"mode": "center"})
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


déf apply_initial_state(automaton, cols, rows, initial):
    soit mode = initial.get("mode", "layers")
    soit origin_y = rows // 2

    si mode == "center":
        automaton[origin_y][cols // 2] = 1

    sinonsi mode == "random":
        soit count = initial.get("count", 1)
        origin_y = initial.get("y", origin_y)
        pour index dans random.sample(range(cols), min(count, cols)):
            si 0 <= origin_y < rows:
                automaton[origin_y][index] = 1

    sinonsi mode == "custom":
        soit positions = initial.get("positions", [])
        pour pos dans positions:
            soit x = pos.get("x", cols // 2)
            soit y = pos.get("y", origin_y)
            si 0 <= x < cols et 0 <= y < rows:
                automaton[y][x] = 1
        si positions:
            soit ys = [p["y"] pour p dans positions si "y" dans p]
            si ys:
                origin_y = sum(ys) // len(ys)

    sinon:
        soit x = initial.get("x", cols // 2)
        soit y = initial.get("y", origin_y)
        si 0 <= x < cols et 0 <= y < rows:
            automaton[y][x] = 1
        origin_y = y

    retour origin_y


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
    soit automaton = construire_grille(rows, cols)
    soit origin_row = apply_initial_state(automaton, cols, rows, initial)
    soit rule_dict = get_rule_dict(rule_number)

    pour row dans range(origin_row + 1, rows):
        automaton[row] = get_next_generation(automaton[row - 1], rule_dict, circular, probability, direction)

    pour row dans range(origin_row - 1, -1, -1):
        automaton[row] = get_next_generation(automaton[row + 1], rule_dict, circular, probability, direction)

    retour automaton


déf evoluer_mode_couches(rule_number, rows, cols, initial, color_list, circular=Faux, probability=1.0, direction="ltr"):
    soit couches = initial.get("positions", [])
    soit resultats = []
    si len(color_list) != len(couches):
        retour []

    pour idx dans range(len(couches)):
        soit automaton = construire_grille(rows, cols)
        soit position = couches[idx]
        apply_initial_state(automaton, cols, rows, position)
        soit rule_dict = get_rule_dict(rule_number)
        soit origin_row = position.get("y", rows // 2)

        pour row dans range(origin_row + 1, rows):
            automaton[row] = get_next_generation(automaton[row - 1], rule_dict, circular, probability, direction)

        pour row dans range(origin_row - 1, -1, -1):
            automaton[row] = get_next_generation(automaton[row + 1], rule_dict, circular, probability, direction)

        resultats.append({
            "automaton": automaton,
            "row_colors": [color_list[idx]] * rows,
        })

    retour resultats


déf decrire_generation(config):
    soit initial = config["initial"]
    soit mode = initial.get("mode", "center")
    si mode == "layers":
        retour "generation multicouche avec palette par couche"
    si mode == "custom":
        retour "generation avec cellules semees manuellement"
    si mode == "random":
        retour "generation probabiliste a partir d'un semis aleatoire"
    retour "generation standard a partir d'un centre unique"

