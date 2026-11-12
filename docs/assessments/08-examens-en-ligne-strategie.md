# Stratégie pour les examens en ligne

L’audit a trouvé un formulaire de remise de texte et de fichier. La phase 10 couvre cette remise et les examens en présentiel. Le moteur de questionnaires chronométrés est reporté.

L’extension prévue réutiliserait l’évaluation et son audience. Une version immuable d’épreuve référencerait des questions et un barème. Une tentative serveur figerait l’ordre des questions, le temps restant et l’inscription. Les sauvegardes seraient idempotentes par tentative et révision. La reprise rechargerait la dernière sauvegarde acceptée. La remise finale serait un état irréversible hors dérogation auditée. Les réponses attendues resteraient côté serveur jusqu’à la diffusion autorisée.

Les QCM, réponses courtes et numériques peuvent recevoir une correction déterministe. Les réponses ouvertes et fichiers restent corrigés par l’équipe pédagogique. Ce parcours nécessite des tests distincts de reconnexion, temporisation, sauvegarde concurrente et soumission en fin d’épreuve.
