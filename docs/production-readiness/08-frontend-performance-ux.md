# Frontend, performance et accessibilité

Le build Vite sépare les pages Inertia. Le portail interroge les données pertinentes pour la section affichée et conserve le rafraîchissement des autorisations, du solde et du contexte. Les listes de transactions et de demandes restent sur leurs vues. Les contrôles TypeScript, ESLint et frontend portent sur la compilation et les composants. Les tests HTTP ne mesurent ni la latence d’interaction du navigateur ni la compatibilité avec les technologies d’assistance.

Le contrôle Chrome sur le build compilé a vérifié connexion et inscription à 390 px, et profil à 390 et 1 440 px. Il a confirmé un focus après Tab, des libellés pour les champs visibles et l’absence de débordement horizontal sur ces écrans. Les champs de connexion ont reçu des libellés et un lien vers leur message d’erreur. [Preuve navigateur](evidence/browser-local.jsonl)

En recette, vérifier la navigation au clavier, le focus visible et son retour après fermeture des dialogues. Tester les erreurs d’upload, les états vides et les tableaux sur petit écran. Contrôler le contraste, le zoom 200 % et la lecture des notifications. Mesurer les parcours sur mobile et réseau lent. Aucun audit WCAG complet ni certification n’est revendiqué.
