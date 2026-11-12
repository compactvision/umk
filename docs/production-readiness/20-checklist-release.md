# Checklist de release

- [x] Baseline, cartographie et contrôles critiques locaux documentés.
- [x] Corrections locales de confidentialité, performance et déploiement préparées.
- [x] Sauvegarde et restauration exercées sur données synthétiques locales.
- [x] Smoke HTTP et comparaison SQL locale réalisés.
- [ ] Identifier et approuver le commit candidat avec la CI GitHub verte.
- [ ] Confirmer moteur, versions, réseau privé, cookies, secrets, sessions, queue et stockage de l’infrastructure cible.
- [ ] Paramétrer et tester les réviseurs de l’environnement GitHub `production`.
- [ ] Dérouler la recette métier et l’accessibilité avec les utilisateurs habilités.
- [ ] Exécuter les paliers de charge, résilience et contrôles d’intégrité en recette.
- [ ] Vérifier la sauvegarde de la cible, son RPO, son RTO et le rollback sur schéma compatible.
- [ ] Enregistrer le GO opérationnel et l’autorisation avant activation.
