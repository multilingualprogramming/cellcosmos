importer math


# Module WASM-compatible minimal, utilise par le site statique.
# Il expose uniquement des primitives numeriques simples que le
# frontend combine ensuite pour rendre les automates.

déf cellule_suivante(numero_regle, gauche, centre, droite):
    soit indice = gauche * 4 + centre * 2 + droite
    si indice == 0:
        retour numero_regle % 2
    si indice == 1:
        retour (numero_regle // 2) % 2
    si indice == 2:
        retour (numero_regle // 4) % 2
    si indice == 3:
        retour (numero_regle // 8) % 2
    si indice == 4:
        retour (numero_regle // 16) % 2
    si indice == 5:
        retour (numero_regle // 32) % 2
    si indice == 6:
        retour (numero_regle // 64) % 2
    retour (numero_regle // 128) % 2


déf sortie_motif(numero_regle, motif):
    si motif <= 0:
        retour numero_regle % 2
    si motif == 1:
        retour (numero_regle // 2) % 2
    si motif == 2:
        retour (numero_regle // 4) % 2
    si motif == 3:
        retour (numero_regle // 8) % 2
    si motif == 4:
        retour (numero_regle // 16) % 2
    si motif == 5:
        retour (numero_regle // 32) % 2
    si motif == 6:
        retour (numero_regle // 64) % 2
    retour (numero_regle // 128) % 2


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
    soit distance_normale = distance
    si distance_normale < 0:
        distance_normale = 0 - distance_normale
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
        soit bit = sortie_motif(regle_source, motif)
        si progression >= seuil:
            bit = sortie_motif(regle_cible, motif)
        regle = regle + (bit * (2 ** motif))
    retour regle


déf cellule_morphosee(regle_source, regle_cible, progression_sur_1000, gauche, centre, droite):
    soit regle = regle_morphee(regle_source, regle_cible, progression_sur_1000)
    retour cellule_suivante(regle, gauche, centre, droite)


déf classe_wolfram(numero_regle):
    si numero_regle == 0 ou numero_regle == 8 ou numero_regle == 32 ou numero_regle == 40 ou numero_regle == 64 ou numero_regle == 72 ou numero_regle == 96 ou numero_regle == 104 ou numero_regle == 128 ou numero_regle == 136 ou numero_regle == 160 ou numero_regle == 168 ou numero_regle == 192 ou numero_regle == 200 ou numero_regle == 224 ou numero_regle == 232 ou numero_regle == 248 ou numero_regle == 255:
        retour 1
    si numero_regle == 18 ou numero_regle == 22 ou numero_regle == 30 ou numero_regle == 45 ou numero_regle == 60 ou numero_regle == 90 ou numero_regle == 105 ou numero_regle == 122 ou numero_regle == 126 ou numero_regle == 150:
        retour 3
    si numero_regle == 54 ou numero_regle == 106 ou numero_regle == 110 ou numero_regle == 137 ou numero_regle == 193:
        retour 4
    retour 2


déf note_regle(numero_regle):
    si numero_regle == 30:
        retour 1
    si numero_regle == 90:
        retour 2
    si numero_regle == 110:
        retour 3
    si numero_regle == 150:
        retour 4
    si numero_regle == 184:
        retour 5
    si numero_regle == 254:
        retour 6
    retour 0


déf etiquette_note_regle(numero_regle):
    soit identifiant = note_regle(numero_regle)
    si identifiant == 1:
        retour "Chaos pseudo aleatoire"
    si identifiant == 2:
        retour "Triangle de Sierpinski"
    si identifiant == 3:
        retour "Calcul universel"
    si identifiant == 4:
        retour "XOR avec auto-reference"
    si identifiant == 5:
        retour "Modele de trafic"
    si identifiant == 6:
        retour "Frontieres seulement"
    retour ""


déf composante_interpolee(debut, fin, progression_sur_1000):
    soit progression = progression_sur_1000 / 1000
    retour math.floor(debut + (fin - debut) * progression + 0.5)


déf forme_code_rect():
    retour 0


déf forme_code_circle():
    retour 1


déf forme_code_ellipse():
    retour 2


déf forme_code_triangle():
    retour 3


# Codes de texture pour le rendu esthetique avance
déf texture_code_solide():
    retour 0


déf texture_code_points():
    retour 1


déf texture_code_hachures():
    retour 2


déf texture_code_gradient():
    retour 3


déf texture_code_bruit():
    retour 4


# Codes de mode de fusion (blending)
déf fusion_code_normal():
    retour 0


déf fusion_code_ecran():
    retour 1


déf fusion_code_multiplier():
    retour 2


déf fusion_code_superposer():
    retour 3


déf fusion_code_eclaircir():
    retour 4


déf fusion_code_assombrir():
    retour 5


déf fusion_code_difference():
    retour 6


déf fusion_code_esquiver():
    retour 7


# Parametres de synthese sonore derives du numero de regle
déf frequence_fondamentale(numero_regle):
    soit expose = numero_regle / 64
    soit facteur_puissance = math.pow(2, expose)
    retour 110 * facteur_puissance


déf forme_onde_synthese(numero_regle):
    soit categorie = classe_wolfram(numero_regle)
    si categorie == 1:
        retour 1
    si categorie == 2:
        retour 2
    si categorie == 3:
        retour 3
    retour 4


déf desaccord_oscillateur_secondaire(numero_regle):
    soit modulo = numero_regle % 12
    retour modulo * 100


déf calcul_densite_densites_cellulaires(total_cellules, cellules_vivantes):
    si total_cellules <= 0:
        retour 0
    retour cellules_vivantes / total_cellules


déf frequence_cutoff_filtre_sonore(densite, base_frequence):
    soit modulation = densite * 3000
    retour 200 + modulation


déf temps_delai_reverb(numero_regle):
    soit modulo = numero_regle % 16
    retour 0.1 + modulo / 160


# Musique generative depuis les motifs : mappings derives des statistiques de la grille

déf tempo_depuis_vitesse(vitesse_sur_1000):
    retour 60 + (vitesse_sur_1000 * 120) // 1000


déf gamme_depuis_classe(classe_wolfram):
    si classe_wolfram == 1:
        retour 0
    si classe_wolfram == 3:
        retour 2
    si classe_wolfram == 4:
        retour 3
    retour 1


déf reverb_depuis_symetrie(symetrie_sur_1000):
    retour symetrie_sur_1000


déf pan_depuis_centre(centre_sur_1000):
    retour centre_sur_1000 - 500


déf octave_depuis_course(longueur_course, max_colonnes):
    si max_colonnes <= 0:
        retour 4
    soit rapport = longueur_course * 100 // max_colonnes
    si rapport > 60:
        retour 5
    si rapport > 30:
        retour 4
    retour 3


déf note_depuis_colonne(colonne, largeur, longueur_gamme):
    si largeur <= 0 ou longueur_gamme <= 0:
        retour 0
    soit degre = (colonne * longueur_gamme) // largeur
    retour degre % longueur_gamme


déf duree_note_depuis_densite(densite_sur_1000):
    si densite_sur_1000 > 700:
        retour 80
    si densite_sur_1000 > 400:
        retour 150
    retour 250


# Logique d'automate supplementaire pour limiter la logique JS :
# - champ stochastique vertical
# - fenetre temporelle de rendu
# - transformations de symetrie

déf probabilite_ligne(probabilite_base_sur_1000, champ_actif, probabilite_haut_sur_1000, probabilite_bas_sur_1000, ligne, total_lignes):
    si champ_actif == 0 ou total_lignes <= 1:
        retour probabilite_base_sur_1000
    soit progression = ligne / (total_lignes - 1)
    soit modulation = probabilite_haut_sur_1000 + ((probabilite_bas_sur_1000 - probabilite_haut_sur_1000) * progression)
    soit probabilite = (probabilite_base_sur_1000 * modulation) / 1000
    si probabilite < 0:
        retour 0
    si probabilite > 1000:
        retour 1000
    retour probabilite


déf ligne_visible(progression_sur_1000, ligne_origine, ligne_courante, total_lignes):
    si total_lignes <= 1:
        retour 1
    soit distance = ligne_courante - ligne_origine
    si distance < 0:
        distance = 0 - distance
    soit distance_max = (progression_sur_1000 * (total_lignes - 1)) // 1000
    si distance <= distance_max:
        retour 1
    retour 0


déf miroir_horizontal_colonne(colonne, largeur):
    retour (largeur - 1) - colonne


déf miroir_vertical_ligne(ligne, hauteur):
    retour (hauteur - 1) - ligne


déf coordonnee_tuilee(coordonnee, decalage, maximum):
    soit resultat = coordonnee + decalage
    si resultat < 0:
        retour 0
    si resultat > maximum:
        retour maximum
    retour resultat


# Outils Matter Lab : geometrie, champ local de probabilite
# et evenements reactifs compacts pour le frontend.

déf laboratoire_forme_code_aucune():
    retour 0


déf laboratoire_forme_code_rectangle():
    retour 1


déf laboratoire_forme_code_cercle():
    retour 2


déf laboratoire_forme_code_anneau():
    retour 3


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
    si code_forme == laboratoire_forme_code_rectangle():
        retour 1 si abs(x - centre_x) <= taille_a et abs(y - centre_y) <= taille_b sinon 0

    soit distance_carre = laboratoire_distance_carre(x, y, centre_x, centre_y)

    si code_forme == laboratoire_forme_code_cercle():
        retour 1 si distance_carre <= taille_a * taille_a sinon 0

    si code_forme == laboratoire_forme_code_anneau():
        soit rayon_exterieur = taille_a
        si rayon_exterieur < rayon_interieur:
            rayon_exterieur = rayon_interieur
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

