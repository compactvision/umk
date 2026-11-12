# Hiérarchie institutionnelle

L'université courante est l'enregistrement `universities.context_key = current`. Son identifiant, code, nom officiel, sigle et statut sont saisis par un administrateur. L'adresse, les contacts et les logos restent dans le Site associé. Un futur document peut identifier l'émetteur par l'ID et le code institutionnels ; le nom affiché dans la maquette est conservé dans son instantané.

Une faculté appartient à l'université après rattachement explicite. Un département dépend d'une faculté et peut porter plusieurs programmes. Le cycle appartient à l'université. Un programme dépend d'une faculté et d'un cycle ; le département est facultatif pour les formations qui n'en ont pas. Les codes sont uniques par université pour les cycles, par faculté pour les départements et programmes. Les référentiels nouveaux sont désactivables ; leurs références existantes restent lisibles. Les clés étrangères interdisent la suppression des lignes utilisées.

Les horaires actuels ne possèdent qu'un libellé de salle. Si un inventaire des sites physiques devient disponible, introduire Campus → Bâtiment → Salle, puis une association plusieurs-à-plusieurs entre campus et formations. Confirmer l'identité des sites et des salles avant de relier les séances existantes.

Le [diagramme de données](erd.md) décrit les clés réellement créées.
