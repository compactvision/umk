# Appel et rapports de présence

La table `academic_attendances` reste unique par séance et inscription annuelle. Pour une offre versionnée, l’appel contrôle la participation valable au début de la séance et conserve son identifiant quand il existe. Les offres historiques continuent d’utiliser leur public de niveau, groupe et exceptions.

L’appel commence après le début d’une séance publiée. Les listes paginent par 50. Un responsable ou intervenant actif et en vigueur au créneau peut saisir avec `manage students`. L’agent administratif reste limité à sa faculté. Les assistants consultent leurs séances selon leurs droits et n’obtiennent pas la saisie d’appel.

Les états existants présent, absent, retard et excusé sont conservés. Une ligne non saisie reste inconnue. L’enseignant ne qualifie pas une absence administrative. Le verrou de séance sérialise l’appel et la version envoyée par l’interface protège les corrections concurrentes. Une correction administrative après clôture exige version et motif. Chaque changement garde l’ancienne et la nouvelle valeur. Une absence avec dossier de justification conserve son constat initial.

Les rapports comptent les lignes saisies des séances publiées terminées, hors annulation. Une absence acceptée est classée justifiée, comme l’ancien statut `excused`. Le taux est le nombre de présents et retards divisé par le nombre de lignes saisies, avec un état vide pour zéro ligne. Les filtres couvrent année, période, cours, enseignant, groupe et inscription annuelle. L’export CSV applique les mêmes filtres et protections. Aucune sanction ou décision académique n’est déduite du taux. Les seuils institutionnels ne sont pas fournis.
