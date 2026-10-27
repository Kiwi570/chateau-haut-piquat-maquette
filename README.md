# Château Haut-Piquat · maquette v2

Maquette de démonstration du futur site du Château Haut-Piquat (Lussac Saint-Émilion), direction artistique « Calcaire à astéries ». Site statique en HTML, CSS et JavaScript, sans étape de construction, prêt pour Vercel.

## Pages

| Page | Fichier | Contenu |
|---|---|---|
| Accueil | `index.html` | Ouverture, coupe géologique épinglée, trois vins, millésimes, frise « 2 000 ans gravés dans la pierre », savoir-faire, chai, visites, parc, accès |
| Boutique | `boutique.html` | 24 références filtrables, panier, règle des formats, caisses cadeaux et primeurs |
| Fiche vin | `vin.html?id=…` | Une fiche pour chaque référence (ex. `vin.html?id=lf-2016`) |
| Oenotourisme | `oenotourisme.html` | Passage de l'arche, quatre formules, atelier écriVins, journée dans le Libournais, réservation simulée |
| Informations | `informations.html` | Mentions légales, données personnelles, principales conditions de vente |
| 404 | `404.html` | Page introuvable |

## Structure

- `assets/css/style.css` : styles
- `assets/js/main.js` : point d'entrée ; `core.js` (défilement, ouverture, langue, mode calme, filtre d'âge, transitions), `cart.js` (panier), `gl.js` (WebGL), `pages/*.js`
- `assets/js/data.js` : vins, formats, châteaux et formules, repris des fiches du site actuel (prix d'octobre 2026)
- `assets/img/photos`, `assets/img/vins`, `assets/img/logos` : photos du site actuel, étalonnées, en WebP
- `assets/img/grok` : textures et détails générés avec Grok (strates, pierre, socle, chêne, lumière)
- `assets/img/og` : images de partage 1200 × 630
- `assets/vendor` : GSAP 3.15 (ScrollTrigger, SplitText, DrawSVG, Flip, CustomEase) et OGL, hébergés avec le site
- `assets/fonts` : Fraunces et Manrope en WOFF2

## Mettre à jour

1. Remplacer une image : déposer le nouveau fichier sous le même nom ; aucune règle de cache n'est à modifier.
2. Changer un prix : modifier `assets/js/data.js`.
3. À chaque version livrée, changer le numéro `?v=N` partout et à l'identique, dans les pages et dans les `import` JavaScript :
   `grep -rl "?v=2" --include=*.html --include=*.js . | xargs sed -i "" "s/?v=2/?v=3/g"`

## Version 2 : corrections issues de l'audit

- Titres animés : les lettres ne sont plus rognées (italiques, accents, jambages) et le texte redevient du texte normal après l'animation.
- Panier : plus d'ombre visible sur le bord droit quand il est fermé ; il n'est plus atteignable au clavier fermé ; le message de confirmation ne le recouvre plus.
- Paiement : choix du moyen de paiement obligatoire avant de payer, avec un message d'aide.
- Coupe géologique : un seul panneau lisible, la jauge s'efface avant l'assemblage, légende de l'assemblage alignée.
- Contrastes renforcés sur les sections sombres et sur l'ouverture.
- Millésimes : le dernier millésime est présélectionné.
- Frise historique : cartes de même hauteur.
- Savoir-faire : aucune ligne parasite avant l'animation.
- Visites : cartes accessibles sur mobile, effet d'empilement plus doux.
- Boutique : compteurs de filtres contextuels, filtres sans résultat désactivés, état vide avec des actions, filtres mobiles en panneau avec bouton « Voir N vins », formats courts sur mobile, règle des formats lisible.
- Fiche vin : socles et fonds propres à chaque château, appellation sans coupure.
- Réservation : récapitulatif de la formule, erreurs affichées sous chaque champ, écran de confirmation avec ajout au calendrier.
- Marges alignées sur grand écran, rythme vertical régulier, libellés au survol des boutons de l'en-tête.
- Images : tailles revues (jusqu'à 2 560 px pour les photos), textures allégées.

## À retirer pour la mise en ligne définitive

- La balise `<meta name="robots" content="noindex, nofollow">` dans chaque page.
- L'en-tête `X-Robots-Tag` dans `vercel.json`.
- Les mentions « maquette », « simulation » et « à compléter », dans le pied de page, le panier, les formulaires et la réservation.
- L'adresse `chateau-haut-piquat-maquette.vercel.app` dans les balises `og:image` et `og:url`, à remplacer par le domaine définitif.

## À brancher sur de vrais services

- Le paiement : Visa, Mastercard et PayPal, plus chèque et virement.
- La réservation des visites : le site actuel utilise l'outil de réservation de Wix.
- Les formulaires de contact, de devis et d'événement, et la lettre d'information.
- Le bandeau officiel « vente d'alcool interdite aux mineurs » (arrêté du 17 octobre 2016, annexe 4), sur la page boutique et sur la confirmation de commande.
- L'obligation de proposer des éthylotests à la vente : le domaine en est dispensé s'il vend uniquement sa propre récolte (à confirmer).

## À compléter par le domaine

- Le degré d'alcool et la mention des sulfites de chaque vin, obligatoires avant l'achat en ligne.
- L'assemblage de Château de Beaulieu sur les fiches boutique. La maquette reprend celui de la fiche technique.
- La raison sociale complète, le SIRET, le RCS, le numéro de TVA et l'hébergeur.
- Le responsable des données personnelles.
- Une photo du calcaire à astéries en haute définition : celle du site actuel fait 220 px.
- Une photo de Château Chatain.
- Des portraits de l'équipe en haute définition, dont Bruno Roques et Hervé Romat.
- La distance jusqu'à Libourne, et les horaires intermédiaires de la journée dans le Libournais.
- La traduction anglaise des notes de dégustation.

## Incohérences relevées sur le site actuel

- Surface : 20 ha selon la fiche technique, 30 ha selon l'infographie.
- Assemblage de Haut-Piquat : 80/14/6 depuis 2018 selon la fiche technique, 80/15/5 selon le site.
- Certification HVE obtenue en 2018 ou en 2019 selon la page ; la mention « HVE4 en 2025 » est à vérifier.
- Médailles : Beaulieu 2020 en argent (boutique) ou en or (fiche technique) ; La Fleur 2019 primée en 2022 ou en 2020 selon la page.
- Prix à la bouteille erronés sur 6 fiches. La maquette les recalcule à partir du prix de la caisse.
- Demi-bouteilles : millésime 2019 dans le titre, 2018 dans la description.
- Mentions légales copiées d'un autre site : « La petite boutique des couleurs », contact « Clémentine Decoursier ».
- CGV : la ligne « indiquer la solution de paiement » n'a jamais été remplie ; l'article de loi cité pour la rétractation est périmé (L121-16 au lieu de L221-18).

## Crédits

- GSAP : licence standard sans frais de GreenSock.
- OGL : licence MIT.
- Fraunces et Manrope : SIL Open Font License.
- Photos : Château Haut-Piquat.
- Textures : générées avec Grok.
