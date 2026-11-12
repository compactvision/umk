# Tests et non-régression — clôture phase 01

> Clôture de phase 01 — 4 novembre 2026 : validation du périmètre local demandé. Suite SQLite : 229 tests réussis ; PostgreSQL : 87 tests d’intégration et 2 tests concurrents réussis. Typage, lint sans avertissement, 51 tests frontend, build et autoload PSR-4 strict validés. Composer et npm production : aucun avis de vulnérabilité. Restent 13 avis modérés de développement, analysés dans le rapport de sécurité. Aucune certification de production ni de capacité à 5 000 utilisateurs.

## Résultats et preuves

| Vérification | Baseline complète | Validation finale |
|---|---|---|
| PHPUnit SQLite | 187 réussites, 22 échecs, 150402 assertions | 229 réussites, 0 échec, 150532 assertions |
| TypeScript | 349 erreurs ; premier compte rendu prématuré corrigé | npm run types : succès |
| ESLint | 86 erreurs, 5 avertissements | eslint . --max-warnings=0 : succès |
| Frontend | 51 tests réussis | 51 tests réussis |
| Production Vite | Build réussi | Build hors dépôt dans /tmp, réussi après mises à jour ; bundle principal 468,17 kB / 151,79 kB gzip |
| PostgreSQL 16 | Non exécuté | 87 tests d’intégration réussis ([preuve finale](evidence/postgres-locked-final.txt)) |
| PostgreSQL concurrent | Non exécuté | 2 tests / 12 assertions avec 2 processus |
| Autoload | Doublons PSR-4 découverts après mise à jour | composer dump-autoload -o --no-scripts --strict-psr : succès sans avertissement |
| Dépendances | Composer : 54 avis ; npm : 24 paquets signalés | Composer 0 ; npm production 0 ; npm développement 13 modérés documentés |
| k6 | Script non exécuté | Smoke local 1 VU, CSRF actif, seuils fonctionnels vérifiés ; pas de validation 5000 |

Les preuves finales sont conservées dans evidence/. PHP local : 8.4.17 ; Node local : 24.13.1. Composer impose PHP 8.2.0 lors de la résolution et la CI PostgreSQL déclare PHP 8.2 ; l’exécution réelle sous PHP 8.2 reste du ressort de cette CI, pas une mesure réalisée localement.

## Anciens tests et parcours réels

Les dix tests de /confirm-password et /settings/* ciblaient des pages et routes du starter kit non enregistrées, absentes du frontend actif. Ils ont été remplacés par dix tests du parcours étudiant existant : affichage du profil, mise à jour d’identité, changement d’email avec mot de passe et nouvelle vérification, impossibilité de changer matricule/statut par payload, mot de passe actuel requis et confirmation du nouveau mot de passe. La suppression libre d’un compte universitaire n’a pas été réactivée. Aucun skip, assertion affaiblie ou endpoint fictif n’a servi à masquer ces échecs.

Les fixtures User utilisent l’identité civile réelle. Les fixtures PostgreSQL respectent varchar(10). TestCase::actingAs simule aussi l’empreinte de session d’une authentification fraîche ; le test de session obsolète remplace explicitement cette empreinte et vérifie le refus.

## Tests de sécurité supplémentaires

PhaseOneSecurityTest : refus API site anonyme/non-admin, erreurs login uniformes, logout/CSRF, verrou au-delà d’une minute et casse email, upload interutilisateur, MIME et échec stockage, échec/succès du healthcheck HTTP sans exposer le corps.

CredentialRevocationTest : révocation ciblée des tokens, conservation des tokens d’un autre compte, suppression des sessions database obsolètes, rejet d’empreinte de mot de passe périmée, reset non rejouable et événement PasswordReset ; OAuth refuse email non vérifié et compte local non vérifié, inscription sociale vérifiée sans privilège excessif.

DraftStorageTransactionTest : ancien fichier supprimé seulement après commit réussi ; panne de sauvegarde injectée après copie, DB et ancien fichier conservés, nouvelle copie nettoyée, temp réutilisable. Ces tests passent également PostgreSQL.

Cinq tests CacheLoginRateLimiter auparavant placés dans app/ sont désormais découverts dans tests/Feature. Le test de seconde série utilise réellement trois tentatives supplémentaires.

## Limites de la validation

Pas de serveur de production, email/fournisseur OAuth réel, S3 ou test navigateur complet responsive/accessibilité. Les suites avec Storage::fake sont exécutées séquentiellement pour éviter un répertoire partagé entre processus. Les deux tests de concurrence ne couvrent pas tous les scénarios possibles de deadlock. Les charges 100 à 5000 restent à exécuter sur infrastructure représentative avant toute certification de capacité.
