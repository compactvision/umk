# Types et validation

| Type | Entrées prises en charge |
| --- | --- |
| Support ou syllabus | Texte, lien, PDF, TXT, JPEG, PNG, WebP, DOCX, PPTX et XLSX |
| Lien pédagogique | Adresse HTTP ou HTTPS et description facultative |
| Vidéo | Lien externe ou fichier MP4 ou WebM |
| Audio | Lien externe ou fichier MP3, Ogg audio ou WAV |

Le serveur compare l’extension au MIME détecté par Fileinfo et calcule le SHA-256 du fichier. Le contrôle des fichiers bureautiques exige la structure ZIP attendue, exclut les macros et objets incorporés et borne le nombre d’entrées et la taille décompressée. Les archives génériques et formats exécutables sont exclus des nouveaux supports. Les anciens fichiers privés gardent leur accès en téléchargement.

Le plafond est de 10 Mio, ajusté aux limites PHP d’envoi et de requête. Les fichiers sont reçus en une requête et enregistrés sous un nom aléatoire. Les descriptions sont affichées comme du texte. Le serveur ne consulte pas les adresses externes et l’interface les ouvre dans un nouvel onglet. Le contrôle du format est distinct d’une analyse antivirus, qui reste à configurer si l’établissement en dispose.
