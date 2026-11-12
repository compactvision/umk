# Permissions et sécurité

Les routes administratives restent authentifiées, vérifiées et réservées au rôle `admin`. `StudentProfilePolicy` centralise la lecture et les actions sur le compte. La phase 05 ajoute `AcademicEnrollmentPolicy` et `EnsureAcademicStaffScope`.

| Fonction | Permission existante |
|---|---|
| Répertoire / contexte annuel | Au moins une : manage academic access, manage academic finance, publish academic content |
| Coordonnées, admission, demandes, carte, chronologie | manage academic access |
| Cours, présences et documents académiques | manage academic access ou publish academic content |
| Notes modifiables via service existant | publish academic content |
| Montants, paiements, exonérations | manage academic finance |
| Vérification email / révocation | manage academic access **et** manage users |

La révocation complète est proposée uniquement lorsque `session.driver=database`. Elle utilise `RevokeCredentials` (sessions, tokens et remember token). Aucun secret, mot de passe, token ou contenu de session n’est sérialisé. Le renvoi de vérification ne réactive pas une admission et ne crée pas de nouveau compte.

Les fichiers d’admission exigent la propriété étudiante ou un administrateur habilité ; les aperçus ont été renforcés. Les documents académiques sont vérifiés par profil, année, niveau, publication et permission côté serveur. Les réponses portent `Cache-Control: private, no-store` et `nosniff`.

Les masquages React accompagnent les contrôles Laravel. Les nouveaux tests vérifient notamment le refus des finances et demandes à un agent non habilité, l’accès étudiant aux routes administratives, la justification des actions et l’absence de secrets.
