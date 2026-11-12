# Audit de sécurité

| Référence | Constat vérifié | Traitement |
| --- | --- | --- |
| SEC-01 | Le workflow Nitrohost était déclenché par un push sur `main`. Le chemin cPanel exécutait migrations et build hors de ce contrôle. | Déclenchement manuel, environnement `production`, critères préalables et fermeture du chemin cPanel automatique dans le dépôt. Configurer les réviseurs de l’environnement GitHub et vérifier les intégrations externes. |
| SEC-02 | Le middleware SEO écrasait `Referrer-Policy: no-referrer` sur le vérificateur documentaire. | Conservation de la politique définie par la route, politique privée par défaut et protection contre le cadrage intersite. |
| SEC-03 | Le contrôle de mise en production acceptait un environnement avec cookies de session non sécurisés. | Préflight exige HTTPS, Secure, HttpOnly et SameSite Lax ou Strict. |
| SEC-04 | Le portail sérialisait des transactions et des demandes sur des sections qui ne les affichaient pas. | Les transactions et demandes sont chargées sur les sections dédiées. |
| SEC-06 | Un marqueur local Vite redirigeait le navigateur vers les assets de développement malgré la présence du build. | Le paquet exclut `public/hot` et le préflight de production refuse sa présence. |
| SEC-05 | Les journaux HTTP manquaient d’un identifiant de corrélation pour les réponses lentes ou en erreur. | Sonde opt-in avec route nommée, statut et durée. Les paramètres, URL, requêtes et données personnelles restent hors de cette sonde. |

Les audits exécutés sur les dépendances verrouillées donnent zéro avis Composer et zéro vulnérabilité npm pour l’arbre de production. L’arbre npm complet relève sept avis modérés dans la chaîne de lint TypeScript et minimatch, sans avis élevé ou critique. Ces avis de développement restent à traiter. Le résultat est daté et dépend des registres interrogés. Le contrôle rapide des fichiers suivis n’a pas relevé de signature de clé privée ou de jeton dans les motifs recherchés. Un balayage de l’historique, du déploiement et des secrets de production n’a pas été réalisé. [Composer](evidence/composer-audit.json) · [npm production](evidence/npm-production-audit.json) · [npm complet](evidence/npm-all-audit.json)

Les tests locaux couvrent la révocation, la rotation CSRF, les uploads privés, les refus d’accès et l’intégrité documentaire. La politique TLS, le contrôle d’accès réseau, la protection des sauvegardes et les droits d’exploitation doivent être vérifiés sur la cible.
