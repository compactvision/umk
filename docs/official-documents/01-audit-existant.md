# Audit avant la phase 12

| Domaine | Source de vérité | Intégration |
| --- | --- | --- |
| Admissions | Décision du dossier `Enrollment` et justificatifs privés | Le registre exige une admission validée. Les justificatifs conservent leurs routes et leurs règles. |
| Étudiants et inscriptions | `StudentProfile`, `AcademicEnrollment`, matricule et affectations | Les demandes sont rattachées à une inscription précise. Le document fige l’identité émise. |
| Structure | Universités, facultés, niveaux, maquettes publiées | Les types sont isolés par établissement et faculté. |
| Cartes | Contrôle de la photo, modèles historiques, file d’impression et remise | Réutilisation de l’éligibilité. Bascule faculté par faculté après activation du modèle officiel. |
| Résultats et jury | Résultats publiés, versions de délibération, archives PDF | Les PDF et leurs références existantes sont réutilisés. Les éditions futures reçoivent un QR. |
| Finance | Obligations, versements confirmés, règles et dérogations | Consultation par les services existants. Les reçus conservent leur service de vérification. |
| Demandes et notifications | Demandes étudiant, audit académique et boîte interne | Réutilisation des supports avec un workflow séparé pour les demandes documentaires typées. |

Le dépôt contenait des travaux antérieurs en cours. La baseline les inclut. Le journal brut se trouve dans [evidence/baseline.txt](evidence/baseline.txt).
