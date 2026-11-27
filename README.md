# Règlement de la communauté

Site web communautaire pour **consulter, commenter et faire évoluer un règlement en ligne**.

**Site en ligne :** https://real-astrg.github.io/reglement-communaute/

> **Version actuelle : 1.0** · La **V2** est en cours de préparation (voir la [feuille de route](#feuille-de-route)).

---

## Présentation

Le règlement est publié sous forme d'articles numérotés (de 0 à 15). Tout le monde peut le lire. Les membres de la communauté peuvent le commenter et voter aux sondages. Les administrateurs gèrent le contenu.

Le projet est volontairement simple : une page statique, un thème bleu marine et blanc, et aucun outil de compilation. Il fonctionne **entièrement avec des offres gratuites**.

## Fonctionnalités de la V1

**Pour tous les visiteurs**
- Lecture du règlement, article par article, avec un sommaire cliquable.
- Lecture des commentaires et des résultats des sondages.

**Pour les membres**
- Connexion avec un pseudonyme et le code commun de la communauté.
- Publication de commentaires et de réponses.
- Participation aux sondages (un vote par sondage).

**Pour les administrateurs**
- Connexion par e-mail et mot de passe, via un lien discret en bas de page.
- Modification du titre et du texte des articles.
- Suppression de commentaires.
- Création, clôture et réouverture de sondages.

## Les trois profils

| | Visiteur | Membre | Administrateur |
|---|:---:|:---:|:---:|
| Lire le règlement, les commentaires et les sondages | oui | oui | oui |
| Commenter et répondre | non | oui | oui |
| Voter | non | oui | oui |
| Modifier les articles | non | non | oui |
| Supprimer des commentaires | non | non | oui |
| Créer, clôturer et rouvrir des sondages | non | non | oui |

Ces droits sont **imposés par le serveur** (règles de sécurité Supabase), et pas seulement par l'affichage du site.

## Technologies

- **Interface** : HTML, CSS et JavaScript sans framework.
- **Hébergement** : GitHub Pages (branche `main`, racine du dépôt).
- **Base de données et authentification** : [Supabase](https://supabase.com) (offre gratuite).
- **Fonction serveur** : une fonction Edge Supabase, `join-community`, qui vérifie le code commun et enregistre le profil des nouveaux membres.

## Structure du dépôt

```
index.html     Structure de la page
style.css      Mise en forme (thème bleu marine et blanc)
app.js         Logique du site : connexion, articles, commentaires, sondages
supabase/      Éléments liés au serveur
README.md      Cette page
```

## Sécurité

- Le navigateur n'utilise que la **clé publique** (« publishable ») de Supabase, conçue pour être visible.
- La **clé de service** et le **code commun** ne se trouvent que dans les secrets de la fonction Edge. Ils ne sont **jamais** dans ce dépôt.
- Le **rôle** (membre ou administrateur) est décidé côté serveur. Un nouvel arrivant est toujours membre. Un compte administrateur est créé uniquement par l'administrateur du projet, directement dans Supabase.
- La sécurité au niveau des lignes (RLS) est activée sur les cinq tables : `profiles`, `articles`, `comments`, `polls` et `poll_responses`.
- Les textes affichés sont systématiquement protégés contre l'injection de code.

> Ne publiez jamais de clé secrète, de mot de passe ou de code commun dans ce dépôt.

## Passer un compte en administrateur

Le rôle administrateur ne s'attribue jamais depuis le site. Il se donne dans Supabase :

1. Créez l'utilisateur dans **Authentication > Users** (e-mail et mot de passe, avec « Auto Confirm User »).
2. Dans **SQL Editor**, exécutez, en remplaçant l'adresse e-mail :

```sql
insert into public.profiles (id, nickname, role)
select id, 'Admin', 'admin'
from auth.users
where email = 'VOTRE_EMAIL_ICI'
on conflict (id) do update set role = 'admin';
```

## Limites connues de la V1

Ces points sont identifiés et prévus dans la V2 :

- Les membres ne se reconnectent qu'avec une session propre à leur navigateur. Après une déconnexion, un changement d'appareil ou un nettoyage du navigateur, le pseudonyme précédent n'est plus récupérable.
- Les pseudonymes ne sont pas encore uniques.
- Le nom affiché sur un commentaire n'est pas vérifié par le serveur.
- Il n'existe pas de moyen d'exclure un membre.
- Pas de tableau de bord administrateur.
- Le projet gratuit Supabase peut être mis en pause après une période d'inactivité.

## Feuille de route

### V1.0 : version actuelle
- Lecture publique, comptes membres, commentaires, réponses, sondages.
- Administration : modification des articles, modération, gestion des sondages.
- Connexion administrateur stable par e-mail.

### V2 : en cours
- **Comptes membres durables** : mot de passe défini à la première connexion avec le code commun, puis reconnexion simple.
- **Pseudonymes uniques**.
- **Profil membre** avec adresse e-mail facultative.
- **Tableau de bord administrateur** : liste de tous les membres, statistiques et bloc-notes privé.
- **Prévisualisation du règlement complet** et **export PDF** (couverture, sommaire, articles, pagination).
- **Lien pour rejoindre la communauté**.

L'ordre et le contenu de la V2 peuvent évoluer.

## Contraintes du projet

- 100 % gratuit : aucun service payant ni abonnement.
- Compatible avec l'hébergement GitHub Pages.
- Simplicité d'abord : pas de complexité inutile.

## Versions

Les versions publiées sont listées dans l'onglet **Releases** du dépôt.

| Version | Date | Contenu |
|---|---|---|
| 1.0.0 | novembre 2026 | Première version publiée |

## Licence

Ce projet est publié sous licence [MIT](LICENSE).
