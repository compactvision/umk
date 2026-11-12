# Modèle annuel, versionnement et plan de migration

`AcademicEnrollment` / `academic_enrollments` reste le contexte annuel. Il référence le profil permanent, l’admission source, l’année, le niveau, le département, le groupe, la cohorte et la maquette. Le programme vient de la maquette ; la promotion affectée vient du groupe. Les dates de création et les décisions sont conservées. La maquette et le programme de la source ne sont jamais remplacés par ceux de la cible.

La migration `2026_11_07_140000_add_academic_enrollment_decisions` prépare le registre immuable `academic_enrollment_changes`, le périmètre `academic_staff_faculties`, `classes.capacity` et les index de consultation.

## Unicité des contextes et réorientations au même niveau

La contrainte initiale `(student_profile_id, level_id, academic_year_id)` interdisait de conserver deux versions d’un parcours au même niveau. La migration `2026_11_07_150000_version_academic_enrollment_contexts` la remplace par l’unicité `(student_profile_id, level_id, academic_year_id, context_slot)` :

- `context_slot=1` réserve le contexte courant et reste la valeur par défaut des nouvelles inscriptions. Les doublons ordinaires restent interdits. Ce champ interne n’est pas modifiable par les formulaires.
- `context_slot=NULL` désigne une source transférée conservée dans l’historique. Une décision autorisée libère sa réservation et crée la cible dans la même transaction.
- Les sources déjà transférées avant migration sont reconnues uniquement si un `EnrollmentChange` de transfert avec cible existe. Seule la nouvelle métadonnée `context_slot` est alors initialisée à NULL. Les autres lignes gardent 1.

Les dates, identités, programmes, maquettes, groupes, résultats et écritures antérieurs ne sont pas réécrits. Les inscriptions annulées gardent leur réservation ; aucune suppression ni réactivation arbitraire ne découle du schéma. Cette évolution n’autorise pas les doubles cursus à un même niveau.

## Application à une base réelle — validation préalable requise

Le prompt demande : « Toute opération irréversible ou susceptible d’altérer les données existantes nécessite une analyse d’impact et une validation explicite. » L’application réelle de cette migration de compatibilité doit donc être validée avant exécution. **Aucune base réelle n’a été migrée pendant cette intervention.**

1. Sauvegarder le schéma et les données ; identifier les migrations déjà présentes.
2. Auditer les contextes dupliqués, les anciennes décisions de transfert, les états `transferred` sans cible et les inscriptions sans références de programme. Les cas non prouvés ne sont pas régularisés automatiquement.
3. Appliquer d’abord 140000 puis 150000 sur une copie de recette. L’index réservé est créé avant le retrait de l’ancienne unicité. Évaluer la durée et les verrous DDL sur le moteur cible.
4. Comparer les décomptes et les champs métier avant/après, ainsi que les totaux des obligations, paiements et résultats. Seules de nouvelles structures et la métadonnée de réservation doivent différer.
5. Déployer le code compatible après le schéma, puis vérifier création, transfert, lecture de l’historique et réinscription.
6. Ne pas revenir à l’ancien code après publication de contextes versionnés sans étude de compatibilité. `down()` refuse dès qu’un contexte historique non réservé existe ; aucun effacement d’inscription n’est prévu pour forcer un rollback.

Les migrations ont été exécutées uniquement sur SQLite en mémoire par les tests, y compris un scénario d’upgrade avec données existantes et un refus de rollback après transfert. PostgreSQL et la production nécessitent leur validation propre en recette.
