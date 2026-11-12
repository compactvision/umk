# Tests et non-régression

La baseline PHP est conservée dans [la sortie initiale](evidence/baseline.txt). Les tests dédiés exercent les routes réelles avec SQLite en mémoire et un disque privé simulé. Ils vérifient le cycle de publication, les barèmes, les dates, les refus, le dépôt et son rejeu, les versions historiques, le retard, les groupes, les absences, le flux Results et la protection des copies. La suite historique couvre aussi les inscriptions, les maquettes, les supports et les résultats personnels.

Le test historique de dépôt utilisait un fichier vide déclaré PDF. Il utilise désormais un contenu reconnu comme PDF et conserve ses assertions. Un test dédié rejette un texte déguisé en PDF.

En recette, vérifier les conflits de salles à la création d’une séance, les remises simultanées sur le moteur SQL cible, le redémarrage après interruption d’envoi, la récupération des notifications en file et les mesures de temps de réponse. Les résultats des commandes effectivement exécutées figurent dans le rapport final.
