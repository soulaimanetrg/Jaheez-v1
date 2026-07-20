# JAHEEZ — Visite guidée du panneau d'administration

Document de référence non-technique. Décrit chaque page, chaque bouton, chaque dialogue et chaque effet visible. La page **Wallets clients** est volontairement exclue à votre demande.

---

## 0. Cadre général : la coquille (mise en page commune à toutes les pages)

Tout le panneau partage le même habillage défini dans `components/layout.tsx`.

### 0.1 La barre latérale gauche (sidebar)
- En haut : un carré rouge avec la lettre **J**, le titre **JAHEEZ Ops** et le sous-titre **Centre de contrôle**.
- En dessous, les liens du menu sont organisés en **5 sections** :
  - **Operations** : Dispatch (commandes en direct), Statistics, Driver Issues.
  - **Catalogue** : Categories, Stores, Products, Promotions.
  - **People** : Users, Drivers, Wallets, Wallets clients (page volontairement omise ici), Support.
  - **Finance** : Finance Hub, Refunds, Payout Requests, COD Reconciliation.
  - **Système** : Audit Logs, Analytics, Settings, App Content, Cities, Vehicle Types, Admin Accounts.
- Chaque entrée est masquée automatiquement si votre rôle (super_admin, operations, finance, support, content_manager) n'a pas la permission `*.read` correspondante. C'est la fonction `useAdminMe()` qui filtre la liste : un admin **support** par exemple ne verra ni Finance, ni Settings, ni Admin Accounts.
- Le lien actif est surligné en rouge JAHEEZ.

### 0.2 La barre du haut (header)
- Le **titre de la page courante** à gauche (mappé via `PAGE_TITLES`).
- À droite, dans l'ordre :
  1. Le **sélecteur de langue** FR / AR / EN. Il déclenche la traduction automatique de tous les textes français de l'écran. La traduction est faite par lots vers `/api/translate` (limité à 60 requêtes par minute par IP). Repasser en FR restitue les textes originaux instantanément.
  2. Le **badge d'alerte sécurité** (icône bouclier rouge) qui sonde toutes les 60 secondes `/api/admin/security/alerts`. S'il y a eu des connexions admin échouées dans les 24 dernières heures, il affiche un compteur rouge cliquable qui vous redirige vers Audit Logs.
  3. Un point vert clignotant + **« System Operational »** : indicateur visuel que tout va bien.
  4. Un bouton **« Sign out »** qui efface le token admin du localStorage et vous renvoie sur `/login`.

---

## 1. Login (`/login`)

Écran d'entrée. Fond gris foncé, logo JAHEEZ blanc, carte centrale.

- Champ **Email** (icône enveloppe), placeholder `admin@jaheez.ma`.
- Champ **Mot de passe** (icône cadenas), masqué.
- Bouton rouge **« Accéder au dispatch »**. Désactivé tant que les deux champs sont vides.
  - Pendant la requête, le bouton affiche un spinner et le texte « Connexion en cours… ».
  - En cas de succès : le token JWT est sauvegardé dans `localStorage` sous `jaheez_admin_token`, puis redirection automatique vers `/orders`.
  - En cas d'échec : un toast rouge en bas indique « Connexion échouée — Email ou mot de passe incorrect. ».
- En haut à droite : sélecteur de langue (la page de connexion est traduisible avant même d'être identifié).
- Bas de page : mention « JAHEEZ Admin · Accès réservé aux opérateurs ».

> Le compte « root » historique (`admin@jaheez.ma`) fonctionne avec un token codé en dur ; tous les autres comptes passent par la table `admin_accounts` (sha256 du mot de passe).

---

## 2. Dispatch — Commandes en direct (`/orders`)

Le cœur opérationnel. C'est la page d'atterrissage par défaut après connexion.

- **En-tête** : titre + petite phrase « live order board », et un bouton **« Refresh »** qui recharge manuellement (la liste se rafraîchit déjà toute seule toutes les 10 secondes).
- **Barre de filtres** :
  - Une rangée d'onglets de statut : Toutes / En attente / Confirmées / Préparation / En route / Livrées / Annulées. Chaque onglet montre le compteur entre parenthèses.
  - Un champ de recherche libre (ID commande, nom client, téléphone, magasin).
- **Tableau principal** : ID court, client, magasin, montant en MAD, statut coloré, chauffeur assigné (ou « Non assigné »), heure relative.
- **Actions par ligne** (icônes à droite) :
  - **Œil** : ouvre la fiche détaillée en panneau latéral (articles, totaux, adresse, historique).
  - **Faire avancer le statut** (flèche) : pousse la commande à l'étape suivante de la chaîne (`pending → confirmed → preparing → on_the_way → delivered`). Chaque transition est journalisée dans Audit Logs.
  - **Assigner un chauffeur** : ouvre un dialogue listant les chauffeurs vérifiés et en ligne. Cliquer attribue immédiatement la course.
  - **Ajouter une note** : dialogue avec textarea, sauvegardée comme note interne.
  - **Annuler** : dialogue de confirmation rouge ; oblige à renseigner un motif d'annulation. Une fois validé, la commande passe à `cancelled` et le motif est tracé.
- **État vide** : message centré « Aucune commande pour ce filtre ».

---

## 3. Statistics (`/stats`)

Tableau de bord opérationnel rapide (différent d'Analytics qui est plus poussé).

- **4 grandes cartes KPI** : Total commandes, Commandes livrées, Commandes annulées, Revenu total (MAD).
- **Graphique en barres** : répartition des commandes par statut.
- **Bloc « Synthèse rapide »** en bas : taux de livraison, taux d'annulation, panier moyen, etc., présentés sous forme de mini-cartes.

---

## 4. Stores — Magasins (`/stores`)

Gestion du catalogue marchand.

- En-tête : compteur de magasins, bouton rouge **« + Add Store »**.
- **Tableau** : logo, nom, catégorie, ville, statut actif/inactif, badge couleur, actions.
- **Dialogue de création/édition** :
  - Champs : Nom (FR), Nom (AR), Description, Catégorie (select), Ville (select alimentée par la page Cities), Adresse, Téléphone, Frais de livraison, Délai de préparation moyen.
  - **Logo** + **Image de couverture** : upload via présigné App Storage, prévisualisation immédiate.
  - **Sélecteur de couleur** (palette de pastilles) qui devient la couleur d'accent du magasin dans l'app cliente.
  - Switch **Actif** : désactive le magasin dans l'app utilisateur sans le supprimer.
- **Bouton supprimer** (icône poubelle rouge) : dialogue de confirmation, irréversible.
- **« Voir les produits »** sur chaque ligne : redirige vers `/products/:storeId`.

---

## 5. Products — Produits (`/products/:storeId`)

Page contextuelle ouverte depuis Stores. Le titre du header devient « Product Management ».

- Bandeau supérieur : nom du magasin, bouton retour, bouton **« + Nouveau produit »**.
- **Liste de produits** : image, nom (FR/AR), prix en MAD, badge actif/inactif, actions éditer/supprimer.
- **Dialogue produit** :
  - Nom FR/AR, Description FR/AR, Prix (en centimes), Image (upload), Catégorie locale, Switch Actif.
  - **OptionGroupEditor** : éditeur d'options à plusieurs niveaux (par exemple « Taille », « Suppléments »). Chaque groupe a :
    - Un libellé (FR/AR).
    - Un switch **Obligatoire** (le client doit choisir).
    - Un switch **Choix multiples** (sinon choix unique).
    - Une liste d'options enfant avec libellé + supplément de prix en MAD. Boutons « + Ajouter une option » et icône poubelle par option.
- Sauvegarde : un toast vert « Produit créé/mis à jour » et le tableau se rafraîchit.

---

## 6. Categories (`/categories`)

Catégories marchandes globales (food, grocery, pharmacy, etc.).

- Tableau avec icône, nom FR/AR, ordre d'affichage, couleur, actif/inactif.
- Dialogue de création : **icon picker** (grille d'emojis/lucide), nom FR/AR, **palette de couleurs**, ordre numérique.
- Boutons éditer / supprimer par ligne. La suppression est bloquée côté serveur si la catégorie est utilisée par un magasin.

---

## 7. Promotions (`/promotions`)

Gestion des bannières et codes promo.

- Vue **grille de cartes** : chaque promotion est rendue avec un **aperçu en direct** tel qu'il apparaît dans l'app utilisateur (image de fond, titre, sous-titre, bouton CTA).
- Bouton **« + Nouvelle promotion »** ouvre un dialogue :
  - Titre FR/AR, sous-titre FR/AR, image de bannière, lien cible (deep link interne), code promo (optionnel), pourcentage ou montant fixe, dates de début/fin, switch Actif.
- Actions par carte : éditer, dupliquer, supprimer.

---

## 8. Users — Clients (`/users`)

- Champ recherche (nom, téléphone), filtre statut.
- Tableau : nom, téléphone, nombre de commandes, date d'inscription, badge statut (actif / suspendu).
- **Actions par ligne** :
  - **Suspendre / Activer** (le bouton change selon l'état actuel).
  - **Supprimer** (corbeille rouge, confirmation requise).
  - **Voir détails** : ouvre une fiche modale avec deux onglets :
    - **Commandes** : historique paginé.
    - **Adresses** : adresses sauvegardées du client.

---

## 9. Drivers — Chauffeurs (`/drivers`)

Page très riche, double-écran (liste + dialogue KYC).

- En-tête : compteur total + sous-comptes « X en attente d'approbation » et « X en ligne » en couleur.
- Bouton **« + Add Driver »**.
- **Filtres** : Tous / En attente / Vérifiés / Suspendus + recherche libre nom/téléphone.
- **Tableau** : Nom, téléphone, type de véhicule (moto/car/bicycle/foot), plaque, **statut** coloré (En attente, À examiner, Vérifié, Rejeté, Suspendu), **En ligne** (bascule cliquable Wifi/WifiOff visible uniquement si vérifié), date d'inscription.
- **Actions par ligne** (selon statut) :
  - Si `pending` : bouton ✓ vert **Approuver** et bouton ✗ rouge **Rejeter** (pré-KYC quick action).
  - Si vérifié : bouton **Suspendre** (icône Ban jaune).
  - Si suspendu/rejeté : bouton **Réactiver** (✓ vert).
  - **Documents KYC** (icône feuille bleue) : ouvre le dialogue ci-dessous.
  - Crayon : dialogue d'édition.
  - Corbeille : suppression définitive (confirmation).
- **Dialogue KYC** (`DriverDocumentsDialog`) :
  - Liste des documents téléversés par le chauffeur : CIN recto, CIN verso, Permis de conduire, Carte grise (optionnel), Photo de profil.
  - Chaque document affiche :
    - Type, badge de statut (En attente / Approuvé / Rejeté), motif de rejet le cas échéant.
    - **Aperçu intégré** : `<img>` pour les images, `<iframe>` pour les PDF, lien « Ouvrir dans un nouvel onglet ». L'authentification se fait via `?_token=` dans l'URL pour autoriser la balise image.
    - Bouton vert **Approuver** et bouton rouge **Rejeter**. Rejeter ouvre un champ texte pour saisir un **motif de rejet** (visible par le chauffeur dans son app), puis Confirmer/Annuler.
  - Quand les 4 documents requis sont approuvés, le statut du chauffeur passe automatiquement à `verified` côté serveur.
  - Rejeter un document ramène le chauffeur en `pending` s'il avait déjà soumis.
- **Dialogue création/édition** : Nom, Téléphone, Type de véhicule (select moto/car/bicycle/foot), Plaque, Note interne.

---

## 10. Support Tickets (`/support`)

- En-tête avec compteurs colorés : « X open » en rouge, « X in progress » en ambre, sinon « All tickets resolved » en vert.
- Onglets : All / Open / In Progress / Closed.
- **Tableau** : sujet + extrait de description, client (nom + téléphone), commande liée si disponible, badge statut, date relative (« il y a 3h »), bouton **Voir**.
- **Dialogue de détail** :
  - Affiche l'icône MessageSquare + sujet.
  - Statut + identité du client + lien commande.
  - Bloc gris avec la description complète.
  - Textarea **« Note interne admin »** (visible uniquement par les admins).
  - Si non clôturé : bouton **Mark In Progress** (uniquement si encore `open`) et bouton **Fermer le ticket**. Le bouton Fermer demande un **double-clic de confirmation** (passe en rouge « Confirmer la fermeture »).
  - Footer : Fermer + **Sauvegarder la note** (juste enregistre le commentaire sans changer le statut).

---

## 11. Audit Logs (`/audit-logs`)

Journal d'audit, sécurité-conscient.

- En-tête : nombre total d'entrées + compteur d'**échecs** en rouge.
- Bouton **Rafraîchir**.
- **Filtres** : champ texte « Filtrer par action » (ex: `order.cancel`) + select de type de cible (order, driver, user, store, product, promotion, wallet, support_ticket, admin_session, …).
- **Tableau** : Horodatage relatif, **action** dans une pastille colorée (vert pour `auth.login`, rouge pour `auth.login_failed` / `order.cancel` / `driver.reject`, bleu pour `order.status_change`, etc.), acteur (ID + rôle), cible (type + ID tronqué), résultat (✓ vert / ⚠ rouge), IP source, chevron pour ouvrir le détail.
- **Dialogue de détail** (en cliquant une ligne) :
  - Acteur, rôle, résultat, type/id de cible, IP, date complète, raison d'échec si applicable.
  - **Valeur précédente** et **Nouvelle valeur** sous forme de blocs JSON formatés (pour les modifications).
  - User-Agent du navigateur.

---

## 12. Finance Hub (`/finance`)

Vue d'ensemble financière. Page de routage qui résume l'état et renvoie vers les pages spécialisées.

- Bouton **Actualiser** en haut à droite.
- **4 cartes KPI cliquables** :
  - **COD non encaissé** (icône horloge jaune) : montant + nombre de commandes livrées en attente, badge rouge « X en attente », clique → `/cod-reconciliation`.
  - **COD encaissé** (icône alerte verte) : montant déjà collecté.
  - **Versements en attente** (icône Banknote bleue) : montant et nombre, badge, clique → `/payout-requests`.
  - **COD total (global)** : somme cumulée non encaissé + encaissé, en violet.
- Deux **« QuickLinks »** plus bas, en cartes larges :
  - « Versements chauffeurs » avec description et badge urgent.
  - « Réconciliation COD » idem.

---

## 13. Refunds — Remboursements (`/refunds`)

Flux à 3 étapes : `pending → approved → processed` (ou `rejected`).

- En-tête + bouton **« + Nouvelle demande »**.
- Filtres : Toutes / En attente / Approuvé / Traité / Rejeté. Le filtre « En attente » porte un compteur.
- **Tableau** : Client, ID commande + magasin, raison + note admin, montant, badge statut, date.
- **Actions par ligne** selon le statut :
  - Si `pending` : bouton ✓ bleu ouvre le dialogue de revue.
  - Si `approved` : bouton **Traiter** (icône portefeuille vert) — c'est cette action qui crédite réellement le portefeuille du client.
  - Si `processed` : étiquette « via portefeuille » ou « via Stripe ».
- **Dialogue de revue** : récap (client, montant, raison) + textarea note interne. Deux boutons : **Rejeter** (rouge) et **Approuvé** (vert). Le texte précise bien que l'approbation n'est qu'une décision et que le crédit n'a lieu qu'à l'étape « Traiter ».
- **Dialogue de création** : ID commande (UUID), montant en MAD, raison.

---

## 14. Payout Requests — Versements chauffeurs (`/payout-requests`)

- En-tête + compteurs et bouton **« + Nouvelle demande »**.
- Filtres : Toutes / En attente / Approuvé / Payé / Rejeté.
- **Tableau** : Chauffeur (nom + tél), **Méthode** (icône CB pour virement bancaire, smartphone pour mobile money, portefeuille pour espèces), **Détails** :
  - Si virement bancaire avec RIB structuré : nom de la banque en gras, titulaire, RIB en mono-espace.
  - Sinon : champ texte libre `accountDetails`.
- Montant MAD, badge statut, date, actions :
  - Si `pending` : ✓ vert **Approuver** (ouvre dialogue) ou ✗ rouge **Rejeter** (action immédiate).
  - Si `approved` : bouton **« ✓ Marquer payé »** qui passe au statut `paid`.
- **Dialogue d'approbation** : récap (chauffeur, montant, méthode, banque/RIB ou détails libres) + textarea note interne (« Ex: virement effectué le… »). Bouton **Approuver** vert.
- **Dialogue de création manuelle** : Select chauffeur (liste de tous les chauffeurs), Montant (MAD), Méthode (virement bancaire / espèces / mobile money), Détails du compte (IBAN ou n° téléphone).

---

## 15. COD Reconciliation (`/cod-reconciliation`)

Marquer comme encaissées les courses payées en espèces.

- **Deux cartes résumé** : « Non encaissé » (jaune) et « Encaissé » (vert), avec montant et nombre.
- Filtres : Non encaissé / Encaissé / Tout, plus une recherche libre.
- **Tableau** : ID commande raccourci + date, client, chauffeur, magasin, statut de livraison, montant, **Encaissement** (badge « En attente » jaune ou « Encaissé » vert + date), bouton d'action.
- **Bouton « Encaisser »** (visible seulement si la commande est `delivered` et non encore encaissée) : un seul clic, pas de confirmation, marque la commande comme `codCollectedAt = now`. Toast « Encaissement enregistré ».

---

## 16. Driver Issues — Signalements chauffeurs (`/driver-issues`)

- Onglets : Ouverts / Résolus / Tous. Le compteur d'ouverts est affiché en jaune.
- **Tableau** : Chauffeur, Type (pastille orange : Client absent, Mauvaise adresse, Article manquant, Article endommagé, Refus de réception, Autre), Description, ID commande, statut, date courte.
- Si ouvert : bouton **Résoudre** (icône check vert).
- Si résolu : la note de résolution est affichée en italique.
- **Dialogue de résolution** : rappel du type + description, champ texte « Note de résolution (optionnelle) », bouton vert **Marquer comme résolu**.

---

## 17. Settings — Paramètres plateforme (`/settings`)

Configuration globale en clé/valeur (Cahier §4.12).

- Bouton **« + Nouveau paramètre »**.
- **Grille de cartes** :
  - Cartes pleines pour les paramètres déjà configurés : nom de clé en mono, description, valeur en gras dans un cadre gris, date de modification, boutons éditer/supprimer.
  - Cartes en **pointillés** pour les paramètres recommandés non encore configurés (presets : `cancellation_window_min`, `auto_assign_timeout_sec`, `min_payout_mad`, `default_commission_percent`, `wallet_expiry_days`, `cod_change_default_max_mad`, `support_whatsapp_number`). Cliquer pré-remplit le dialogue avec la bonne clé et description.
- **Dialogue d'upsert** : Clé (forcée en `snake_case`, désactivée en édition), Valeur, Description.
- **Dialogue de suppression** : confirmation explicite, irréversible.

---

## 18. App Content — Contenu de l'app (`/app-content`)

FAQ, CGU, Confidentialité, À propos — tout est **bilingue FR/AR** ici.

- Onglets : FAQ / CGU / Confidentialité / À propos.
- Bouton **« + Nouveau »**.
- **Liste** : par ligne, titre FR + slug en pastille + badge « Désactivé » si inactif, titre AR (sens RTL), 2 lignes d'aperçu du corps. Boutons crayon/corbeille (la corbeille demande un `confirm()` natif du navigateur).
- **Dialogue d'édition** :
  - À la création : Slug + Type. À l'édition : ces deux champs sont verrouillés.
  - Titre FR, Titre AR (`dir="rtl"`), Corps FR (textarea), Corps AR (textarea RTL).
  - Ordre d'affichage (numérique), switch **Actif**.

---

## 19. Cities — Villes desservies (`/cities`)

- Tableau : Ordre, Nom FR, Nom AR (RTL), Coordonnées GPS (lat/lng tronquées à 4 décimales ou « — »), Actif (pastille verte/grise), actions.
- **Dialogue** : Nom FR, Nom AR (RTL), Latitude, Longitude (acceptent décimales), Ordre, switch Actif.
- Suppression via `confirm()` natif.

---

## 20. Vehicle Types — Types de véhicule (`/vehicle-types`)

- Tableau : Ordre, **Slug** en mono (immuable une fois créé — c'est référencé par `drivers.vehicleType`), Libellé FR, Libellé AR, Icône (nom lucide), Actif, actions.
- **Dialogue** : Slug (désactivé en édition), Libellé FR, Libellé AR, nom d'icône lucide (ex: `bike`), Ordre, switch Actif.

---

## 21. Admin Accounts (`/admins`)

Gestion des comptes administrateurs (super_admin uniquement).

- En-tête : compteur + nombre désactivés en rouge. Bouton **« + Nouvel admin »**.
- **Tableau** :
  - Première ligne fictive « Root Admin » : `admin@jaheez.ma`, badge **Super Admin**, statut Actif, créé le **« Système »**, actions affichant simplement « Protégé » (impossible à modifier ou supprimer).
  - Lignes réelles : avatar bouclier, nom, email, badge **Rôle** coloré (Super Admin rouge, Opérations bleu, Finance vert, Support ambre, Contenu violet, Admin legacy gris), badge Actif/Désactivé, date.
- **Actions** par admin :
  - **Clé** : ouvre le dialogue **Réinitialiser le token**.
  - **Bouclier** (jaune si actif, vert si désactivé) : bascule actif/désactivé.
  - **Crayon** : éditer.
  - **Corbeille** : supprimer.
- **Dialogue création/édition** : Nom complet, Email (verrouillé en édition), Mot de passe (avec œil pour afficher/masquer ; en édition la mention « laisser vide pour ne pas changer »), Rôle (select : Support / Contenu / Opérations / Finance / Super Admin). Validation : email obligatoire, mot de passe obligatoire à la création.
- **Dialogue suppression** : confirmation rouge, indique que l'accès est révoqué immédiatement.
- **Dialogue token** :
  - Confirmation : « L'ancien token sera immédiatement révoqué. »
  - Après génération : affichage du nouveau token dans un cadre mono sélectionnable, avec un avertissement jaune « ne sera plus visible » et conseil de partage sécurisé. Bouton **Fermer**.

---

## 22. Analytics (`/analytics`)

Vrai tableau de bord analytique avec graphiques.

- **Sélecteur de période** en haut : 7j / 14j / 30j / 60j / 90j (boutons).
- **3 boutons d'export CSV** : Commandes / Clients / Chauffeurs. Pendant l'export, le bouton montre un spinner. Limite serveur de 5000 lignes par export.
- **4 cartes KPI** pour la période sélectionnée : Revenus (MAD), Commandes, Livrées, Annulées.
- **Graphique aire** : « Revenus quotidiens (MAD) — N derniers jours ». Dégradé rouge JAHEEZ, axe Y formaté en MAD, tooltip personnalisé qui affiche la date et le montant.
- **Graphique barres empilées** : « Volume de commandes » avec trois séries — Livrées (vert), Annulées (rouge), Total (rouge JAHEEZ semi-transparent en arrière-plan). Légende en bas.
- **Section bas, deux colonnes** :
  - **Top Stores — Revenus** : top 8, classement numéroté, nom + nb commandes + revenus en MAD.
  - **Top Chauffeurs — Livraisons** : top 8, classement, nom + nb livraisons + revenus générés.
- Tous les chiffres se rafraîchissent automatiquement (60 secondes pour les revenus/commandes, 2 minutes pour les tops).

---

## 23. 404 — Not Found

Page de repli si vous tapez une URL inconnue : message simple « Page introuvable » avec un lien retour vers le dispatch.

---

## Récapitulatif des comportements transverses utiles à connaître

- **Toasts** : tous les enregistrements et erreurs s'affichent en bas à droite. Vert/neutre pour succès, rouge pour erreur.
- **Permissions** : un admin **Support** ne voit que ce qui le concerne (Support, parties read-only). Un admin **Finance** voit Finance/Refunds/Payouts/COD. Un **Operations** voit Dispatch/Drivers. Un **Content Manager** voit App Content/Promotions/Cities/Catégories. Le **Super Admin** voit tout. Toute action protégée renvoie 403 avec message explicite si la permission manque.
- **Audit** : presque chaque action écrivante (cancel, suspend, approve, refund process, payout, content edit, settings, admin create/delete, token reset, login/logout) est tracée et visible dans `/audit-logs`.
- **Multilingue** : le panneau est rédigé en **français** ; le bouton de langue traduit dynamiquement vers AR ou EN sans rechargement. Les contenus bilingues persistés (catégories, contenus app, villes, types de véhicule) ont des champs FR et AR séparés et ne sont pas affectés par la traduction automatique.
- **Sécurité visuelle** : le badge bouclier rouge dans le header est votre alerte première sur les tentatives de connexion suspectes.
