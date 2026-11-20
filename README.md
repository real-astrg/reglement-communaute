# Règlement de la communauté — installation gratuite

Ce projet est un site statique pour GitHub Pages, avec Supabase pour les données, les comptes anonymes, les commentaires et les votes.

## Fonctionnalités prévues

- Lecture publique du règlement.
- Pseudonyme + code membre commun pour participer.
- Commentaires et réponses affichés dans la marge de chaque article.
- Suppression des commentaires réservée aux administrateurs.
- Sondages créés par les administrateurs ; un vote par compte membre.
- Modification des articles réservée aux administrateurs.

## Important avant de publier

- GitHub Pages héberge le front-end ; il ne stocke pas les commentaires.
- Supabase est nécessaire pour la base de données et les contrôles d'accès.
- Le code membre est commun : il ne prouve pas l'identité réelle d'un membre et peut être partagé.
- Le projet est un modèle de départ. Testez les rôles et les règles RLS avec un compte visiteur, membre et admin avant de partager le lien largement.
- Ne mettez JAMAIS la clé `service_role` ou le code membre dans `app.js` ou dans GitHub.
- Les offres gratuites ont des limites et peuvent évoluer. Vérifiez les conditions des fournisseurs.

## Étape 1 — Créer le projet Supabase

1. Créez un compte sur https://supabase.com/ et un nouveau projet gratuit.
2. Choisissez un mot de passe fort pour la base de données et conservez-le en lieu sûr.
3. Dans le tableau de bord, ouvrez **SQL Editor**.
4. Copiez-collez tout le contenu de `supabase/schema.sql`, puis cliquez sur **Run**.
5. Ouvrez **Authentication > Sign In / Providers** et activez **Anonymous Sign-Ins** (connexion anonyme).
6. Dans **Project Settings > API**, copiez l'URL du projet et la clé `anon` / publishable. Elles sont destinées au navigateur ; ne copiez pas la clé `service_role`.

## Étape 2 — Configurer la fonction sécurisée d'accès membre

Cette étape utilise la CLI Supabase et nécessite un ordinateur avec Node.js installé.

1. Installez la CLI Supabase selon le guide officiel : https://supabase.com/docs/guides/cli
2. Dans un terminal, placez-vous dans le dossier du projet.
3. Connectez-vous : `npx supabase login`
4. Liez le projet : `npx supabase link --project-ref VOTRE_PROJECT_REF`
5. Déployez la fonction : `npx supabase functions deploy join-community`
6. Dans Supabase > Edge Functions > `join-community` > Secrets, ajoutez :
   - `COMMUNITY_MEMBER_CODE` : le code que vous communiquerez aux membres.
   Les variables `SUPABASE_URL`, `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` sont normalement disponibles automatiquement dans les fonctions hébergées. Si l'interface demande de les définir, utilisez les valeurs de Project Settings > API et gardez la clé service role exclusivement dans les secrets de fonction.

## Étape 3 — Relier le site à Supabase

1. Ouvrez `app.js`.
2. Remplacez `REMPLACER_PAR_URL_SUPABASE` par l'URL du projet.
3. Remplacez `REMPLACER_PAR_CLE_ANON_SUPABASE` par la clé `anon` / publishable.
4. Enregistrez le fichier.

Ces deux valeurs publiques peuvent apparaître dans le code du site. La clé `service_role` ne doit jamais y apparaître.

## Étape 4 — Publier gratuitement avec GitHub Pages

1. Sur GitHub, créez un dépôt nommé `reglement-communaute` (public si vous utilisez GitHub Pages sur l'offre gratuite).
2. Envoyez les fichiers du dossier du projet à la racine du dépôt : `index.html`, `style.css`, `app.js`, le dossier `supabase`, et ce README.
3. Dans le dépôt, ouvrez **Settings > Pages**.
4. Dans **Build and deployment**, choisissez **Deploy from a branch**.
5. Sélectionnez la branche `main` et le dossier `/ (root)`, puis cliquez sur **Save**.
6. Attendez la publication. GitHub affichera l'adresse du site, normalement `https://VOTREPSEUDO.github.io/reglement-communaute/`.

## Étape 5 — Devenir administrateur

1. Ouvrez votre site publié.
2. Cliquez sur **Espace membre**.
3. Choisissez votre pseudonyme et entrez le code membre.
4. Dans Supabase > **Authentication > Users**, trouvez l'utilisateur créé et copiez son UUID.
5. Dans SQL Editor, exécutez en remplaçant l'UUID :

```sql
update public.profiles
set role = 'admin'
where id = 'VOTRE-UUID-ICI';
```

6. Déconnectez-vous puis reconnectez-vous sur le site. Le bouton de modification des articles et le formulaire de création de votes seront disponibles.

## Étape 6 — Tester avant de partager

- Visiteur déconnecté : peut lire les articles et les votes, mais pas commenter.
- Membre : peut commenter, répondre et voter une fois par sondage.
- Admin : peut modifier les articles, supprimer les commentaires, créer et clôturer les votes.

Testez aussi avec une fenêtre privée ou un autre navigateur.

## Personnaliser le règlement

Les articles d'exemple sont ajoutés par `schema.sql`. Une fois administrateur, vous pouvez modifier leur titre et leur texte depuis le site. Pour ajouter ou supprimer des articles, utilisez le tableau `articles` dans Supabase pour cette première version.

## Limites connues de cette première version

- Le code d'accès est commun à tous les membres : pour révoquer un membre précis, il faudra passer à des comptes individuels.
- Les comptes anonymes sont liés au navigateur/appareil. Effacer les données du navigateur peut faire perdre la session.
- Les commentaires sont publics en lecture ; n'y publiez pas d'informations privées.
- Le code membre commun doit être changé dans les secrets de la fonction si trop de personnes le connaissent.
- Les votes sont uniques par compte anonyme, pas par personne physique.
- Le site ne fournit pas encore de notifications, de signalement, ni de journal d'audit.
- La validation de pseudonymes en doublon et la limitation anti-spam devront être renforcées avant une utilisation à grande échelle.
