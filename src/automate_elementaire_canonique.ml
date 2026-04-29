importer json
importer math
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


# Mode laboratoire : primitives de geometrie, champ de probabilite
# local et evenements reactifs.

déf laboratoire_forme_code_aucune():
    retour 0


déf laboratoire_forme_code_rectangle():
    retour 1


déf laboratoire_forme_code_cercle():
    retour 2


déf laboratoire_forme_code_anneau():
    retour 3


déf laboratoire_forme_code_cellule():
    retour 4


déf laboratoire_mode_code_aucun():
    retour 0


déf laboratoire_mode_code_interieur():
    retour 1


déf laboratoire_mode_code_exterieur():
    retour 2


déf laboratoire_mode_code_barriere():
    retour 3


déf laboratoire_evenement_code_aucun():
    retour 0


déf laboratoire_evenement_code_pulse():
    retour 1


déf laboratoire_evenement_code_effacer():
    retour 2


déf laboratoire_evenement_code_inverser():
    retour 3


déf laboratoire_evenement_code_geler():
    retour 4


déf laboratoire_distance_carre(ax, ay, bx, by):
    soit dx = ax - bx
    soit dy = ay - by
    retour dx * dx + dy * dy


déf laboratoire_forme_contient(code_forme, x, y, centre_x, centre_y, taille_a, taille_b, rayon_interieur):
    si code_forme == laboratoire_forme_code_cellule():
        retour 1 si x == centre_x et y == centre_y sinon 0

    si code_forme == laboratoire_forme_code_rectangle():
        retour 1 si abs(x - centre_x) <= taille_a et abs(y - centre_y) <= taille_b sinon 0

    soit distance_carre = laboratoire_distance_carre(x, y, centre_x, centre_y)

    si code_forme == laboratoire_forme_code_cercle():
        retour 1 si distance_carre <= taille_a * taille_a sinon 0

    si code_forme == laboratoire_forme_code_anneau():
        soit rayon_exterieur = max(taille_a, rayon_interieur)
        soit distance_interieure = rayon_interieur * rayon_interieur
        soit distance_exterieure = rayon_exterieur * rayon_exterieur
        retour 1 si distance_carre >= distance_interieure et distance_carre <= distance_exterieure sinon 0

    retour 0


déf laboratoire_mode_autorise(code_mode, contient):
    si code_mode == laboratoire_mode_code_aucun():
        retour 1
    si code_mode == laboratoire_mode_code_interieur():
        retour 1 si contient == 1 sinon 0
    si code_mode == laboratoire_mode_code_exterieur():
        retour 0 si contient == 1 sinon 1
    si code_mode == laboratoire_mode_code_barriere():
        retour 0 si contient == 1 sinon 1
    retour 1


déf laboratoire_intensite_radiale(x, y, centre_x, centre_y, rayon):
    si rayon <= 0:
        retour 1000 si x == centre_x et y == centre_y sinon 0

    soit distance = math.sqrt(laboratoire_distance_carre(x, y, centre_x, centre_y))
    si distance > rayon:
        retour 0

    soit intensite = (1 - (distance / rayon)) * 1000
    si intensite < 0:
        retour 0
    si intensite > 1000:
        retour 1000
    retour math.floor(intensite + 0.5)


déf laboratoire_probabilite_modifiee(probabilite_base_sur_1000, champ_local_sur_1000):
    soit champ = champ_local_sur_1000
    si champ < 0:
        champ = 0
    si champ > 2000:
        champ = 2000

    soit probabilite = (probabilite_base_sur_1000 * champ) / 1000
    si probabilite < 0:
        retour 0
    si probabilite > 1000:
        retour 1000
    retour math.floor(probabilite + 0.5)


déf laboratoire_cellule_evenement(etat_initial, code_evenement, intensite_sur_1000, seuil_sur_1000):
    si intensite_sur_1000 < seuil_sur_1000:
        retour etat_initial

    si code_evenement == laboratoire_evenement_code_pulse():
        retour 1
    si code_evenement == laboratoire_evenement_code_effacer():
        retour 0
    si code_evenement == laboratoire_evenement_code_inverser():
        retour 0 si etat_initial == 1 sinon 1

    retour etat_initial


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


déf code_motif(gauche, centre, droite):
    retour gauche * 4 + centre * 2 + droite


déf progression_morphosee(distance, distance_max, intensite_sur_1000):
    soit intensite = intensite_sur_1000
    si intensite < 0:
        intensite = 0
    si intensite > 1000:
        intensite = 1000
    si distance_max <= 0:
        retour intensite
    soit distance_normale = abs(distance)
    si distance_normale > distance_max:
        distance_normale = distance_max
    soit progression_locale = (distance_normale * 1000) // distance_max
    retour (progression_locale * intensite) // 1000


déf regle_morphee(regle_source, regle_cible, progression_sur_1000):
    soit progression = progression_sur_1000
    si progression < 0:
        progression = 0
    si progression > 1000:
        progression = 1000

    soit regle = 0
    pour motif dans range(8):
        soit seuil = ((motif + 1) * 1000) // 8
        soit bit = (regle_source >> motif) & 1
        si progression >= seuil:
            bit = (regle_cible >> motif) & 1
        regle = regle + (bit * (2 ** motif))
    retour regle


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


déf propagation_code(mode):
    si mode == "both":
        retour 0
    si mode == "down":
        retour 1
    si mode == "up":
        retour 2
    si mode == "right":
        retour 3
    si mode == "left":
        retour 4
    si mode == "angle":
        retour 5
    retour 0


déf propagation_angle_normalise(angle_degres):
    soit angle = angle_degres % 360
    si angle < 0:
        angle = angle + 360
    retour angle


déf option_probabilite_point(probabilite_globale_sur_1000, probabilite_point_sur_1000):
    si probabilite_point_sur_1000 < 0:
        retour probabilite_globale_sur_1000
    si probabilite_point_sur_1000 > 1000:
        retour 1000
    retour probabilite_point_sur_1000


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


# Analyse musicale des motifs de l'automate

déf calculer_vitesse_evolution(grille, lignes, colonnes):
    si lignes <= 1:
        retour 0.0
    soit transitions = 0
    pour row dans range(1, lignes):
        pour col dans range(colonnes):
            si grille[row][col] != grille[row - 1][col]:
                transitions = transitions + 1
    retour transitions / ((lignes - 1) * colonnes)


déf calculer_symetrie_horizontale(grille, lignes, colonnes):
    si colonnes <= 1:
        retour 1.0
    soit concordances = 0
    soit total = 0
    pour row dans range(lignes):
        pour col dans range(colonnes // 2):
            si grille[row][col] == grille[row][colonnes - 1 - col]:
                concordances = concordances + 1
            total = total + 1
    si total == 0:
        retour 1.0
    retour concordances / total


déf calculer_centre_gravite(grille, lignes, colonnes):
    soit somme_ponderee = 0
    soit total_vivantes = 0
    pour row dans range(lignes):
        pour col dans range(colonnes):
            si grille[row][col] == 1:
                somme_ponderee = somme_ponderee + col
                total_vivantes = total_vivantes + 1
    si total_vivantes == 0:
        retour colonnes / 2
    retour somme_ponderee / total_vivantes


déf calculer_longueur_course_max(grille, lignes, colonnes):
    soit max_course = 0
    pour row dans range(lignes):
        soit course = 0
        pour col dans range(colonnes):
            si grille[row][col] == 1:
                course = course + 1
                si course > max_course:
                    max_course = course
            sinon:
                course = 0
    retour max_course


déf analyser_motif_musical(grille, lignes, colonnes):
    soit vitesse = calculer_vitesse_evolution(grille, lignes, colonnes)
    soit symetrie = calculer_symetrie_horizontale(grille, lignes, colonnes)
    soit centre = calculer_centre_gravite(grille, lignes, colonnes)
    soit course_max = calculer_longueur_course_max(grille, lignes, colonnes)
    soit densite = calculer_densite_totale(grille, lignes, colonnes)
    retour {
        "vitesse_evolution": vitesse,
        "symetrie": symetrie,
        "centre_gravite": centre,
        "longueur_course_max": course_max,
        "densite": densite,
    }


déf calculer_densite_totale(grille, lignes, colonnes):
    si lignes * colonnes == 0:
        retour 0.0
    soit vivantes = 0
    pour row dans range(lignes):
        pour col dans range(colonnes):
            vivantes = vivantes + grille[row][col]
    retour vivantes / (lignes * colonnes)


déf sequence_notes_depuis_grille(grille, lignes, colonnes, gamme):
    soit row_origine = lignes // 2
    soit notes = []
    pour col dans range(colonnes):
        si grille[row_origine][col] == 1:
            soit degre = (col * len(gamme)) // colonnes
            notes.append(gamme[degre % len(gamme)])
    retour notes


déf descriptions_gammes():
    retour {
        "pentatonique": "Cinq notes, harmonieuse et reposante",
        "diatonique": "Gamme majeure classique, melodieuse",
        "chromatique": "Douze demi-tons, richesse maximale",
        "ton_entier": "Six notes equidistantes, ambiance suspendue",
    }


# Moteur de generation avec options completes

déf graine_ligne(graine_base, ligne_source, ligne_cible):
    retour graine_base + (ligne_source + 1) * 1009 + (ligne_cible + 1) * 9176


déf obtenir_probabilite_ligne_avec_options(ligne, total_lignes, options):
    soit prob_de_base = (options.get("probability", 1.0) * 1000) ou 1000
    soit champ_actif = 1 si options.get("champProbabiliteActif", Faux) sinon 0
    soit prob_haut = (options.get("probabiliteHaut", 1.0) * 1000) ou 1000
    soit prob_bas = (options.get("probabiliteBas", 0.0) * 1000) ou 0

    soit probabilite_sur_mille = probabilite_ligne(int(prob_de_base), champ_actif, int(prob_haut), int(prob_bas), ligne, total_lignes)
    retour max(0, min(1000, probabilite_sur_mille)) / 1000.0


déf generer_prochaine_generation_avec_options(courante, numero_regle, graine, row_index, total_lignes, ligne_origine, options):
    soit generateur = random.Random(graine)
    soit resultat = []
    soit taille = len(courante)
    soit direction = options.get("direction", "ltr")
    soit indices = range(taille) si direction == "ltr" sinon reversed(range(taille))
    soit prob_courante = obtenir_probabilite_ligne_avec_options(row_index, total_lignes, options)
    soit morphing_actif = options.get("morphingActive", Faux)
    soit regle_cible = options.get("morphTargetRule", numero_regle) si morphing_actif sinon numero_regle
    soit intensite_morph = (options.get("morphIntensity", 0) * 1000) ou 0
    soit progression_morph = progression_morphosee(abs(row_index - ligne_origine), max(1, total_lignes - 1), int(intensite_morph))
    soit regle_effective = regle_morphee(numero_regle, regle_cible, progression_morph) si morphing_actif sinon numero_regle
    soit circulaire = options.get("circular", Faux)

    pour i dans indices:
        si generateur.random() > prob_courante:
            resultat.append(0)
            continuer
        soit gauche = 0
        soit centre = courante[i]
        soit droite = 0

        si direction == "ltr":
            si i > 0:
                gauche = courante[i - 1]
            sinonsi circulaire:
                gauche = courante[taille - 1]
            si i < taille - 1:
                droite = courante[i + 1]
            sinonsi circulaire:
                droite = courante[0]
        sinon:
            si i > 0:
                droite = courante[i - 1]
            sinonsi circulaire:
                droite = courante[taille - 1]
            si i < taille - 1:
                gauche = courante[i + 1]
            sinonsi circulaire:
                gauche = courante[0]

        soit nouvelle_cellule = cellule_suivante(regle_effective, gauche, centre, droite)
        resultat.append(nouvelle_cellule)

    retour resultat si direction == "ltr" sinon list(reversed(resultat))


déf evoluer_depuis_position(numero_regle, lignes, colonnes, position, graine_base, options):
    soit grille = [[0] * colonnes pour _ dans range(lignes)]
    soit x = max(0, min(colonnes - 1, position.get("x", colonnes // 2)))
    soit y = max(0, min(lignes - 1, position.get("y", obtenir_origine_y_par_defaut("top", lignes))))

    grille[y][x] = 1
    soit mode_propagation = options.get("propagationMode", "both")

    si mode_propagation dans ["down", "both"]:
        pour row dans range(y + 1, lignes):
            soit graine_ligne_val = graine_ligne(graine_base, row - 1, row)
            grille[row] = generer_prochaine_generation_avec_options(grille[row - 1], numero_regle, graine_ligne_val, row, lignes, y, options)

    si mode_propagation dans ["up", "both"]:
        pour row dans range(y - 1, -1, -1):
            soit graine_ligne_val = graine_ligne(graine_base, row + 1, row)
            grille[row] = generer_prochaine_generation_avec_options(grille[row + 1], numero_regle, graine_ligne_val, row, lignes, y, options)

    retour grille


déf analyser_motif_musical(grille):
    soit transitions = 0
    soit correspondances_horizontales = 0
    soit correspondances_verticales = 0
    soit total_comparaisons = 0
    soit centre_x_somme = 0
    soit centre_y_somme = 0
    soit cellules_vivantes = 0
    soit course_max = 0

    pour y, ligne dans enumerate(grille):
        pour x, valeur dans enumerate(ligne):
            si valeur == 1:
                cellules_vivantes = cellules_vivantes + 1
                centre_x_somme = centre_x_somme + x
                centre_y_somme = centre_y_somme + y

                si x < len(ligne) - 1:
                    transitions = transitions + (1 si ligne[x + 1] != valeur sinon 0)

                si y < len(grille) - 1:
                    transitions = transitions + (1 si grille[y + 1][x] != valeur sinon 0)

        pour x dans range(1, len(ligne)):
            total_comparaisons = total_comparaisons + 1
            si ligne[x] == ligne[x - 1]:
                correspondances_horizontales = correspondances_horizontales + 1

    pour y dans range(1, len(grille)):
        pour x dans range(len(grille[0])):
            total_comparaisons = total_comparaisons + 1
            si grille[y][x] == grille[y - 1][x]:
                correspondances_verticales = correspondances_verticales + 1

    soit centre_x = (centre_x_somme / cellules_vivantes) si cellules_vivantes > 0 sinon (len(grille[0]) // 2)
    soit centre_y = (centre_y_somme / cellules_vivantes) si cellules_vivantes > 0 sinon (len(grille) // 2)

    retour {
        "transitions": transitions,
        "symmetrie": (correspondances_horizontales + correspondances_verticales) / (2 * total_comparaisons) si total_comparaisons > 0 sinon 0,
        "centre_x": centre_x,
        "centre_y": centre_y,
        "densite": cellules_vivantes / (len(grille) * len(grille[0])) si len(grille) > 0 et len(grille[0]) > 0 sinon 0,
    }


déf calculer_densite_grille(grille):
    soit total = 0
    soit vivantes = 0
    pour ligne dans grille:
        pour cellule dans ligne:
            total = total + 1
            si cellule == 1:
                vivantes = vivantes + 1
    retour vivantes / total si total > 0 sinon 0

