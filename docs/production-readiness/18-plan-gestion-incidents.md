# Gestion des incidents

1. Ouvrir l’incident avec l’heure, le domaine, le symptôme et l’identifiant de requête. Désigner le responsable de coordination.
2. Qualifier disponibilité, confidentialité et intégrité. Préserver les journaux, états de migration et références de release sans exporter de données personnelles.
3. Isoler les écritures affectées. Pour Finance, Results ou Documents, comparer le registre et l’audit avant toute reprise. Éviter de rejouer une écriture sans vérifier sa clé d’opération.
4. Vérifier l’application, la base, le cache, la file et le stockage. Appliquer le rollback compatible ou la restauration approuvée si nécessaire.
5. Confirmer le rétablissement sur des parcours de test, surveiller les délais et clôturer avec une analyse et des actions assignées.

Le responsable exploitation configure les canaux, horaires d’astreinte et niveaux de gravité. Ne transmettre ni pièces, ni notes, ni identifiants de session dans un canal d’incident.
