<?php

// Editorial drafts only. No document is published or approved by this configuration.
return [
    'privacy' => <<<'TEXT'
Responsable et contact
[[name]], [[legal_form]], immatriculation [[registration]], situé à [[address]], détermine les finalités des traitements liés au site et aux services universitaires. Contact pour les données personnelles : [[privacy_contact]].

Données traitées
Le logiciel permet de traiter l’identité et les coordonnées des comptes, les informations de candidature, les pièces justificatives, le parcours académique, les affectations, les présences et les données nécessaires au suivi financier. Les champs et pièces demandés doivent correspondre aux nécessités de chaque démarche. Le formulaire de contact public utilise actuellement des liens vers l’email et WhatsApp ; il ne transmet pas de formulaire à l’application.

Finalités et bases juridiques
Les données servent à créer et sécuriser les comptes, examiner les candidatures, communiquer les décisions, organiser les enseignements et suivre les dossiers académiques et financiers. Les bases juridiques retenues et leur justification doivent être validées : [[legal_basis]]. Une inscription ou la simple navigation ne vaut pas consentement général à tous les traitements.

Destinataires et prestataires
L’accès applicatif dépend des rôles et autorisations. Les données nécessaires peuvent être traitées par l’hébergeur [[host_name]] et par les prestataires effectivement mobilisés pour la messagerie ou un service demandé. La liste complète, leurs rôles et les garanties contractuelles restent à confirmer. Transferts internationaux et lieux de traitement : [[international_transfers]].

Durées et protection
Politique de conservation et d’archivage : [[retention_policy]]. L’application utilise l’authentification, les autorisations et des mécanismes de protection des formulaires ; leur efficacité dépend également du paramétrage, de l’hébergement et des pratiques de l’établissement. Aucune sécurité absolue n’est garantie.

Cookies et audience
Les cookies de session et de protection CSRF servent au fonctionnement des services. Des préférences peuvent être conservées sur l’appareil. La mesure d’audience intégrée est désactivée par défaut ; lorsqu’elle est activée, elle requiert un choix explicite et ne conserve que des compteurs agrégés, sans identifiant utilisateur dans les événements. Les journaux de l’hébergeur et leurs durées doivent être documentés séparément. Les lecteurs vidéo tiers sont chargés seulement après une action explicite.

Droits et réclamations
Les demandes d’information, d’accès, de rectification, d’opposition ou d’effacement sont examinées selon les droits et exceptions applicables. Adressez votre demande à [[privacy_contact]] en précisant le service concerné ; une vérification proportionnée de l’identité peut être nécessaire. Les voies de réclamation auprès de l’autorité compétente doivent être confirmées selon les textes en vigueur en RDC, sans présumer une application automatique du RGPD.

Mineurs et modifications
Règles concernant les mineurs et l’intervention de leurs représentants : [[minors_policy]]. La date d’approbation de la version publiée est affichée sur la page ; une modification substantielle fait l’objet d’une nouvelle validation.
TEXT,
    'terms' => <<<'TEXT'
Objet et éditeur
Le site de [[name]], [[legal_form]], immatriculation [[registration]], présente l’établissement, ses formations et ses actualités et propose des démarches de candidature et des services académiques privés. Contact : [[email]].

Accès et utilisation
Les informations publiques sont accessibles sans compte. Les espaces privés sont soumis à authentification et aux autorisations accordées. Chaque utilisateur protège ses identifiants, fournit des informations exactes et utilise uniquement les fonctionnalités auxquelles il a accès. Les tentatives d’accès non autorisé, les contenus illicites et les atteintes aux droits d’autrui sont interdits.

Contenus et propriété intellectuelle
Les contenus institutionnels et les ressources publiées sont protégés selon leurs droits et licences respectifs. La consultation ne transfère aucun droit de reproduction ou de diffusion. Les demandes d’autorisation sont adressées à [[email]].

Exactitude, disponibilité et responsabilité
L’établissement veille à l’actualisation des informations ; les modalités propres à une formation et à une admission doivent être confirmées auprès des services compétents. Une présentation de formation ne constitue pas une décision individuelle d’admission. Le site peut connaître des interruptions de maintenance ou des incidents. Les responsabilités sont appréciées dans les limites fixées par le droit applicable.

Liens externes et sécurité
Les liens vers des services tiers conduisent à leurs propres règles et politiques. Aucun contenu externe ne doit être considéré comme une garantie ou une approbation générale de l’établissement. Les anomalies de sécurité sont à signaler sans exploiter ni divulguer de données d’autrui.

Modifications et litiges
Les modifications de ces conditions sont soumises à validation. Le cadre juridique et les voies de règlement des litiges sont à faire préciser pour l’établissement situé en République démocratique du Congo ; aucune compétence exclusive d’un tribunal n’est inventée. Les réclamations peuvent d’abord être adressées à [[email]].
TEXT,
    'notices' => <<<'TEXT'
Éditeur
Dénomination : [[name]]
Forme juridique : [[legal_form]]
Enregistrement : [[registration]]
Adresse : [[address]]
Email : [[email]]
Téléphone : [[phone]]

Publication et hébergement
Responsable de publication : [[publication_director]]
Hébergeur : [[host_name]]
Coordonnées de l’hébergeur : [[host_contact]]

Droits et informations réglementaires
Les contenus restent soumis à leurs droits d’auteur et licences. Toute information relative à une habilitation, un agrément ou une accréditation doit être vérifiée auprès de la direction avant publication. Les présentes mentions ne constituent pas une certification de conformité.
TEXT,
    'cookies' => <<<'TEXT'
Fonctionnement
Un cookie est une donnée conservée par le navigateur pour un service déterminé. Le site emploie les mécanismes de session Laravel et de protection CSRF pour le fonctionnement et la sécurité des formulaires. La durée de session configurée est de [[session_minutes]] minutes ; le paramétrage effectif de production doit être confirmé avant publication.

Préférences locales
Le logiciel peut conserver le thème, l’état de la navigation et une liste de pièces cochées dans le navigateur. Ces préférences servent à l’utilisation du service. La checklist ne constitue pas un dépôt de justificatifs.

Mesure d’audience facultative
La mesure intégrée est inactive par défaut. Si elle est activée, le choix est demandé avant tout événement facultatif. Accepter et refuser sont proposés au même niveau ; les préférences restent modifiables depuis le pied de page. Les événements autorisés ne contiennent que le nom d’un événement et un chemin public, regroupés par jour, sans email, nom, dossier ni identifiant personnel. Conservation des compteurs : [[retention_policy]]. Aucun outil Google Analytics ou Tag Manager n’est installé automatiquement par cette intégration.

Médias et services externes
Un lecteur YouTube ou Vimeo n’est chargé qu’après une action de chargement explicite. Le fournisseur peut alors recevoir des données techniques et appliquer sa politique. Les liens Google Maps, WhatsApp et autres liens externes s’ouvrent à la demande. Les traceurs de l’ancien site et les journaux serveur doivent être audités séparément lors du déploiement.

Gestion
Le cookie de préférence usk_audience conserve uniquement le choix accepté ou refusé pendant six mois. Il peut être modifié et retiré depuis Gestion des cookies. Les réglages du navigateur permettent aussi de supprimer les cookies et données locales ; supprimer les données nécessaires peut interrompre la connexion ou réinitialiser des préférences.
TEXT,
    'enrollment' => <<<'TEXT'
Candidature et décision
La création d’un compte et le dépôt d’un dossier permettent de présenter une candidature à [[name]]. Ils ne garantissent pas l’admission. Le candidat choisit une formation et un niveau proposés, renseigne les informations demandées et transmet les pièces requises par le service des admissions.

Déclarations et pièces
Les informations et documents doivent être exacts, lisibles et appartenir au candidat ou être transmis avec les autorisations nécessaires. Le service peut demander des corrections et vérifie la recevabilité du dossier selon les conditions applicables à la formation. Les règles d’équivalence et d’accès à un niveau supérieur doivent être confirmées.

Frais et paiements
Les frais applicables sont ceux communiqués officiellement pour la faculté, le niveau et l’année. Un montant affiché ou un versement déclaré ne constitue pas une confirmation de paiement ; les opérations nécessitent les vérifications prévues par l’établissement. Aucun tarif, délai ou résultat d’admission n’est inventé dans ces conditions.

Désistement, annulation et remboursement
Règles validées par la direction : [[refund_policy]]. Elles doivent préciser les démarches, justificatifs, délais et éventuelles conditions avant toute publication ou collecte correspondante.

Services et protection des données
Le suivi du dossier et les services étudiants dépendent de l’état de la candidature, de l’inscription et des règles applicables. Les données et justificatifs sont traités selon la politique de confidentialité approuvée. Les durées de conservation sont définies par [[retention_policy]].

Réclamations
Les demandes et contestations sont adressées à [[email]] avec la référence du dossier et sans publier les justificatifs dans un espace public. Les modalités de règlement et les voies de recours doivent être validées par la direction et son conseil.
TEXT,
    'accessibility' => <<<'TEXT'
Engagement et périmètre
[[name]] souhaite rendre ses informations et démarches accessibles. Le présent texte décrit une démarche d’amélioration ; il ne constitue pas une déclaration de conformité totale aux WCAG ou à un référentiel réglementaire.

Fonctionnalités prévues
Le site comprend un lien d’évitement, des libellés de formulaires, des états de focus, une navigation adaptable aux écrans et une prise en compte de la réduction des animations. Leur présence ne remplace pas un audit avec les utilisateurs et technologies d’assistance.

Limites à vérifier
L’accessibilité des PDF, contenus téléversés, sous-titres et transcriptions vidéo dépend des documents publiés. Les couleurs, parcours complexes, lecteurs externes et usages clavier doivent faire l’objet de contrôles réguliers. Aucun score ni niveau de conformité n’est revendiqué sans mesure.

Signaler un problème
Contact : [[email]]. Indiquez la page, l’action concernée et les difficultés rencontrées, sans transmettre de données sensibles inutiles. L’établissement examine les demandes et peut proposer un autre mode d’accès aux informations.
TEXT,
];
