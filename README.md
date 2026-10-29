# Château Haut-Piquat · maquette v13

Maquette de démonstration du futur site du Château Haut-Piquat (Lussac Saint-Émilion), direction artistique « Calcaire à astéries ». Site statique en HTML, CSS et JavaScript, sans étape de construction, prêt pour Vercel.

## Pages

| Page | Fichier | Contenu |
|---|---|---|
| Accueil | `index.html` | Ouverture, chiffres clés, coupe géologique et assemblage, trois vins, millésimes, bandeaux vers Le domaine et Visites & événements |
| Les vins | `vins.html` | Ouverture des trois bouteilles, tour de la cave épinglé, l'accord parfait, servir votre vin, grands formats, aussi au domaine |
| Le domaine | `domaine.html` | Frise « 2 000 ans gravés dans la pierre », savoir-faire en cinq étapes, chai de 480 barriques |
| Boutique | `boutique.html` | 24 références filtrables, panier, règle des formats, caisses cadeaux et primeurs |
| Fiche vin | `vin.html?id=…` | Une fiche pour chaque référence (ex. `vin.html?id=lf-2016`) |
| Visites & événements | `oenotourisme.html` | Passage de l'arche, quatre formules, atelier écriVins, journée dans le Libournais, réservation simulée, plan d'accès, parc et événements |
| Informations | `informations.html` | Mentions légales, données personnelles, principales conditions de vente |
| 404 | `404.html` | Page introuvable |

## Structure

- `assets/css/style.css` : styles
- `assets/js/main.js` : point d'entrée ; `core.js` (défilement, ouverture, langue, mode calme, filtre d'âge, transitions), `cart.js` (panier), `gl.js` (WebGL), `pages/*.js` (`home.js` accueil, `domain.js` Le domaine, `cellar.js` Les vins, `tourism.js` et `places.js` Visites & événements, `shop.js`, `wine.js`)
- `assets/js/data.js` : vins, formats, châteaux et formules, repris des fiches du site actuel (prix d'octobre 2026)
- `assets/img/photos`, `assets/img/vins`, `assets/img/logos` : photos du site actuel, étalonnées, en WebP
- `assets/img/grok` : textures et détails générés avec Grok (strates, pierre, socle, chêne, lumière)
- `assets/img/og` : images de partage 1200 × 630
- `assets/video` : vidéo de l'ouverture de l'accueil, `ouverture-1920.mp4` (ordinateur, 1920 × 1080) et `ouverture-720.mp4` (téléphone, 720 × 1280)
- `assets/vendor` : GSAP 3.15 (ScrollTrigger, SplitText, DrawSVG, Flip, CustomEase) et OGL, hébergés avec le site
- `assets/fonts` : Fraunces et Manrope en WOFF2

## Mettre à jour

1. Remplacer une image : déposer le nouveau fichier sous le même nom ; aucune règle de cache n'est à modifier.
2. Changer un prix : modifier `assets/js/data.js`.
3. À chaque version livrée, changer le numéro `?v=N` partout et à l'identique, dans les pages et dans les `import` JavaScript :
   `grep -rl "?v=13" --include=*.html --include=*.js . | xargs sed -i "" "s/?v=13/?v=14/g"`

## Version 13 : versement moins rapide au défilement

- Le défilement peut accélérer le versement jusqu'à 1,6 fois sa vitesse naturelle, pas plus : la jauge se remplit en 2 à 2,5 secondes quand on défile normalement (contre moins d'une seconde en v12).
- La section reste épinglée plus longtemps (environ 1 480 px de défilement sur ordinateur, 1 150 px sur mobile) pour laisser le temps au vin de couler.
- Sans défiler, le versement complet dure environ 4 secondes.
- Si l'on quitte la section avant la fin, le versement se termine rapidement pendant qu'elle s'éloigne.

## Version 12 : réglages de la bouteille qui verse

- Le versement avance seul, mais un défilement rapide le fait avancer plus vite : il est toujours terminé quand la section se libère (avant, un visiteur pressé ne voyait qu'une jauge vide).
- Versement raccourci : environ 4 secondes au lieu de 5.
- Le titre de l'assemblage apparaît d'un seul geste au lieu de suivre le défilement : il n'est plus jamais à moitié transparent sous la bouteille.
- En remontant un peu, la jauge reste pleine ; elle se vide seulement quand l'assemblage a disparu, puis le versement se rejoue.
- Si la largeur de la fenêtre change pendant le versement, la jauge se termine directement (la bouteille ne reste plus au mauvais endroit).
- Une fois pleine, chaque part de la jauge ondule quand on la survole ou qu'on la touche.
- Avec le son d'ambiance activé, un léger glouglou accompagne chaque cépage, avec une note qui monte à mesure que la jauge se remplit.
- Plus léger : la bouteille a sa propre image de 12 Ko au lieu de 64 Ko, et le vin monte par une transformation plutôt qu'en changeant la hauteur.

## Version 11

- Accueil, section « L'assemblage » : une bouteille du Château Haut-Piquat arrive en profondeur, s'incline et verse le vin dans la jauge. Chaque cépage se remplit à son tour (merlot, cabernet sauvignon, malbec) avec une surface qui ondule, quelques gouttes, et le pourcentage qui monte avec le niveau. La couleur du filet change à chaque cépage.
- La jauge prend un aspect de tube de verre (reflet, fond plus sombre).
- La section reste épinglée un peu plus longtemps pour laisser le temps de voir le versement. Si le visiteur fait défiler vite, l'animation s'accélère ; s'il revient en arrière, elle se rejoue.
- Avec « réduire les animations », la jauge s'affiche pleine, sans bouteille.

## Version 10

- Le bouton « mode calme » est retiré de l'en-tête et du menu mobile. Les animations sont réduites automatiquement pour les visiteurs qui ont activé « réduire les animations » sur leur appareil.

## Version 9

- Accueil : vidéo en boucle dans l'ouverture (16,8 s, muette), montée à partir de cinq photos du domaine : vignes au matin, grappes, vignoble d'automne, chai à barriques, château au soleil couchant.
- La photo actuelle reste affichée pendant le chargement. La vidéo ne se charge pas en mode calme, avec « réduire les animations », ni sur connexion lente ; elle se met en pause hors de l'écran. En cas d'échec, la lumière WebGL d'origine reprend.
- Remplacer la vidéo : déposer les nouveaux fichiers sous les mêmes noms dans `assets/video` (MP4 H.264, muet, 3 à 5 Mo, 1920 × 1080 pour l'ordinateur et 720 × 1280 pour le téléphone), puis changer le numéro de version.

## Version 8

- Nouvelle page « Les vins » (menu « Les vins ») :
  - ouverture sur les trois bouteilles posées sur leurs socles de calcaire ;
  - tour de la cave : sur grand écran, la section reste en place et les trois vins se succèdent (bouteille qui pivote, fond aux couleurs du vin, fiche, assemblage, médailles, extrait de note de dégustation, nombre de millésimes et prix de départ tirés de la boutique) ;
  - l'accord parfait : on choisit une famille de plats, les vins que le domaine y associe sur ses fiches s'allument, avec la liste des millésimes et des plats cités ;
  - servir votre vin : vin jeune ou vin vieux, thermomètre, carafe et verre animés, textes repris des conseils du domaine ;
  - grands formats avec liens directs vers la boutique, Château Picampeau et Château Montroc pour les professionnels.
- Accueil : bouton « Découvrir les vins » dans la section des trois vins. Pied de page : lien « Les vins ».

## Version 7

- Curseur : l'astérie n'a plus de carré sombre derrière elle sur les sections foncées, et reste bien visible.

## Version 6 (finale)

- En-tête : bouton « Réserver » sur grand écran ; libellés du menu toujours sur une ligne.
- Menu mobile : deux actions directes, « Réserver une visite » et « Boutique en ligne ».
- Retour en haut : une astérie qui tourne avec la lecture, cerclée de sa progression.
- Boutique : 12 vins d'abord, puis « Voir les 12 autres vins » ; les filtres montrent toujours tous les résultats.
- Fiche vin sur mobile : barre d'achat collante dès que le bouton principal sort de l'écran.
- Visites & événements : fin de page « Avant de venir » vers Le domaine et la boutique.
- Savoir-faire au rythme resserré ; panier : « Retirer » détaché de l'option caisse bois.

## Version 5

- Accueil raccourci de moitié : il garde l'ouverture, le terroir, les vins et les millésimes, puis renvoie vers les autres pages par deux bandeaux.
- Nouvelle page « Le domaine » : histoire, savoir-faire et chai.
- La page Oenotourisme devient « Visites & événements » et accueille le plan d'accès et le parc.
- Menu : Le domaine · Les vins · Boutique · Visites & événements · Venir.

## Version 4

- Panier : une caisse en bois de six bouteilles se remplit jusqu'au port offert (350 €), puis affiche « Port offert ».
- Fil de lecture ocre sous l'en-tête, qui suit la progression dans la page.
- Atelier écriVins : la robe tourne dans le verre quand on déplace un curseur.
- Coupe géologique : panneaux enchaînés sans boîte vide, passage direct vers l'assemblage.
- Visites : les photos des cartes recouvertes ne virent plus au noir.
- Boutique : boutons « Ajouter » de taille identique sur toutes les cartes.
- Chiffres : les années et les plages (2015, 2–3) ne sont plus animées ni tronquées ; altitude sur une ligne.
- Fiche vin : assemblage aux couleurs des cépages, nom du château jamais coupé.
- Frise : archives fondues dans le papier, fond de pierre adouci. Parc : texte qui accompagne la mosaïque.
- Pied de page : labels HVE et Vignobles & Découvertes présentés fidèlement. Grands formats : légendes en double retirées.

## Version 3

- Fin de la coupe géologique : nouvelle scène « L'assemblage du Château Haut-Piquat » sur fond sombre uni. Une barre aux couleurs des trois cépages se remplit d'un seul geste, avec chiffres animés et étiquettes reliées ; la scène reste à l'écran le temps de la lire.
- Le titre « Trois strates, trois cépages » est retiré : le site du domaine n'établit pas de lien entre sols et cépages.

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
