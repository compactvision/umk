# Suspensions, congés, abandon et reprise

- `suspended` : suspension annuelle motivée.
- `on_leave` : congé académique, distinct de la suspension.
- `withdrawn` : abandon administratif avec conservation des données.
- Retour à `confirmed` depuis suspension/congé : nouvelle décision, contrôles académiques et financiers.
- Retour d’abandon : `pending_confirmation`, puis nouveau contrôle.

Les décisions stockent auteur, motif (incluant les conditions de reprise), date d’effet et date de fin éventuelle. La date de fin ne vaut jamais réactivation automatique. Les opérations se font sous transaction et clé d’idempotence.

`AcademicAccessService` refuse les fonctionnalités pédagogiques soumises à un contexte confirmé/terminé. Les fonctionnalités essentielles (profil, accueil, finances et soutien administratif) restent accessibles selon les règles existantes. Une suspension annuelle ne suspend pas silencieusement le dossier permanent ou le compte numérique.

La page étudiante montre la situation annuelle, ses décisions et les liens vers les demandes de régularisation. Les motifs administratifs potentiellement sensibles et l’identité des agents ne sont pas exposés dans la liste étudiante des décisions.
