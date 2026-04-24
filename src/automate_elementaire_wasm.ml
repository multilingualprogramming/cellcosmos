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
