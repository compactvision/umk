# Performance Laravel

Les règles d’accès sont chargées ensemble en conservant l’ordre de priorité par niveau, année et édition. Le lot réutilise les ajustements et les soldes par nature de frais pour la seule inscription évaluée. Un autre appel relit les règles. Les transactions et demandes sont calculées sur leur écran. Le portail réutilise le relevé financier déjà calculé et charge seulement les identifiants d’offres pour la recherche de ressources.

Le benchmark fixe un étudiant synthétique, douze offres, trente-six supports et sept règles financières. Il effectue trois échauffements puis trente requêtes par route dans le noyau HTTP Laravel, avec SQLite en mémoire. Les durées incluent l’exécution PHP et la production de la réponse. Le réseau, le reverse proxy et la concurrence sont hors mesure.

| Route | SQL avant → après | P50 avant → après | P95 avant → après | P99 avant → après |
| --- | ---: | ---: | ---: | ---: |
| Accueil | 144 → 93 | 59,34 → 45,10 ms | 83,39 → 57,88 ms | 85,74 → 64,21 ms |
| Cours | 111 → 51 | 37,29 → 25,61 ms | 56,28 → 34,38 ms | 58,37 → 35,14 ms |
| Horaires | 112 → 54 | 36,56 → 28,58 ms | 38,89 → 38,19 ms | 39,97 → 40,75 ms |
| Profil | 104 → 51 | 34,70 → 33,61 ms | 39,04 → 95,73 ms | 41,54 → 125,78 ms |
| Documents | 124 → 72 | 39,63 → 41,38 ms | 51,49 → 95,34 ms | 53,29 → 231,15 ms |
| Résultats | 121 → 62 | 38,98 → 29,29 ms | 42,92 → 32,59 ms | 43,09 → 33,73 ms |

Le volume de SQL baisse sur les six routes. Les pics profil et documents augmentent dans cet échantillon court partagé avec d’autres vérifications. Une répétition locale au repos, sur 60 requêtes par route, retrouve les mêmes nombres de requêtes. Les p95 profil et documents sont alors de 28,87 et 40,90 ms. Cette variabilité justifie une mesure en recette représentative. [Avant](evidence/benchmark-before.json) · [Après](evidence/benchmark-after.json) · [Répétition](evidence/benchmark-repeat.json)
