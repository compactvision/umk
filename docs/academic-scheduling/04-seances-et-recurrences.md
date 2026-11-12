# Séances et récurrences

Le formulaire de planning conserve les séances uniques, les répétitions de 1 à 26 semaines et les plans par créneaux de jour et d’heure. Les limites annuelles, semestrielles ou personnalisées de l’offre sont vérifiées. Une séance peut recevoir un type libre. Le contrôle garde le modèle de temps de Kinshasa et limite les nouvelles séances à 24 heures. Les cours traversant minuit restent soumis aux bornes de leur période.

Les générations multi-occurrences ignorent les vacances du calendrier et les dates explicitement exclues. Chaque créneau récurrent reçoit un UUID de série. Les écritures réutilisent une empreinte d’occurrence unique pour éviter de recréer un créneau rejoué, même si la séance a ensuite été reportée. Un échec au sein d’un plan annule le lot.

L’édition d’une occurrence agit sur une séance. L’édition du créneau semestriel applique le nouvel horaire aux occurrences futures actives de la série. Les anciennes lignes sans UUID utilisent le rapprochement historique par semaine, heure et durée. Les anciens créneaux et les reports restent consultables. Les changements futurs de durée, d’heure et de salle sont enregistrés sur les occurrences. Une définition de récurrence autonome qui génère automatiquement de nouvelles dates reste hors du modèle actuel.
