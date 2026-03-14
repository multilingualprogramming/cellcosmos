importer math


# Export WASM principal : calcule l'etat suivant d'une cellule
# a partir du triplet voisinage et du numero de regle [0, 255].
déf cellule_suivante(numero_regle, gauche, centre, droite):
    soit indice = gauche * 4 + centre * 2 + droite
    retour (numero_regle // (2 ** indice)) % 2


# Helper numerique expose au runtime web pour conserver
# une petite partie de la logique canonique cote source multilingual.
déf classe_wolfram(numero_regle):
    si numero_regle dans [0, 8, 32, 40, 64, 72, 96, 104, 128, 136, 160, 168, 192, 200, 224, 232, 248, 255]:
        retour 1
    si numero_regle dans [18, 22, 30, 45, 60, 90, 105, 122, 126, 150]:
        retour 3
    si numero_regle dans [54, 106, 110, 137, 193]:
        retour 4
    retour 2


déf nom_forme(code_forme):
    si code_forme == 0:
        retour 0
    si code_forme == 1:
        retour 1
    si code_forme == 2:
        retour 2
    retour 3

