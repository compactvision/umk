# Permissions, audit et erreurs

| Acteur | Consulter | Saisir / confirmer | Aides / tarifs | Affecter / rembourser | Export |
|---|---|---|---|---|---|
| Étudiant | Son contexte, son historique et ses reçus | Non | Non | Non | Non |
| Admin sans `manage academic finance` | Selon ses autres droits dossier | Non | Non | Non | Non |
| Admin financier global | Oui | Oui | Oui | Oui | Oui |
| Admin financier avec facultés assignées | Dans ces facultés | Dans ces facultés | Tarifs de ces facultés, pas globaux | Dans ces facultés | Périmètre limité |
| Public muni d'un lien signé | État minimal du reçu | Non | Non | Non | Non |

Contrôles cumulés : session authentifiée et vérifiée, rôle admin, permission, Gate `AcademicEnrollmentPolicy::view` et relation `academic_staff_faculties`. Le frontend n'est pas une frontière de sécurité. Les options de barèmes sont filtrées, et les services recontrôlent les objets reçus. Les exports appliquent le même scope que la consultation.

L'audit `AcademicAudit` existant est réutilisé via `Audit::record` : auteur, heure, action, table/id, justification et contexte pertinent. Paiements : ancienne/nouvelle transition ; annotations : avant/après ; remboursements : étapes et montants ; tarifs : versions/remplacements ; affectations et rapprochements : identifiants et sommes. Les originaux immuables fournissent le contexte historique. Pas de secrets de prestataire, données de carte bancaire ou fichiers bancaires bruts dans les journaux.

## Erreurs et idempotence

Validation Laravel : erreurs de montant, référence, dépassement, devise, calendrier ou transition donnent 422 JSON ou redirection Inertia avec erreurs. Scope interdit : 403 ; ressource introuvable : 404. Toute mutation composée est transactionnelle : absence d'écriture partielle. Une erreur SQL d'unicité tardive peut imposer une nouvelle tentative après rechargement ; pas de confirmation optimiste côté UI.

| Opération | Protection |
|---|---|
| Saisie | Référence globale unique + comparaison du contenu |
| Confirmation / annulation | État verrouillé, répétition de la même transition sans doublon |
| Facturation | Verrou du contexte, facture du même tarif rejouable, unicités historiques d'échéance |
| Aide | Clé par inscription et empreinte du contenu |
| Affectation | Paire paiement/obligation unique, montant publié immuable |
| Remboursement | Clé globale de demande, réservations sous verrou, référence d'exécution unique |
| Relevé bancaire | Compte + référence bancaire uniques, revalidation exacte |
| Prestataire | Vérification serveur et paiement verrouillé ; événements propres au futur adaptateur à ajouter |

Le garde Eloquent ne protège pas contre SQL direct, scripts privilégiés ni accès DB administrateur. Mettre en place rôles DB restreints, sauvegardes, conservation et contrôle des exports selon la politique réelle de l'établissement. Le double contrôle est configurable et doit être décidé institutionnellement.
