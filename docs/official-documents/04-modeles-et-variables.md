# Modèles et variables

Chaque création ajoute une version. Elle contient un titre, un corps en texte, une mise en page, un compte signataire habilité et la qualité de ce signataire. L’approbateur relit le texte et peut consulter les fichiers PNG dans le back-office privé.

Variables communes sous la forme `{{ student }}`, `{{ matricule }}`, `{{ institution }}`, `{{ faculty }}`, `{{ level }}`, `{{ program }}`, `{{ year }}`, `{{ number }}` et `{{ issued_on }}`. Les modèles de réussite et de diplôme ajoutent `{{ decision }}`, `{{ credits }}`, `{{ session }}` et `{{ degree }}`. La validation refuse les variables inconnues. Le moteur substitue le texte puis l’échappe.

Une demande retient sa version. Une version retirée empêche l’émission correspondante et le gestionnaire peut refuser la demande pour permettre un nouveau dépôt sur la version active. Les anciens PDF restent archivés.
