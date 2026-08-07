# Sommeil Agenda

Cahier des charges – Application de suivi du sommeil (compatible Android & iOS)

Nom du projet

Journal de Sommeil

Version 1.0

Objectif

Développer une application mobile moderne permettant à un patient de remplir facilement un agenda de sommeil demandé par un centre du sommeil.

L'objectif est de remplacer le document papier par une saisie extrêmement simple tout en générant automatiquement un document identique au modèle officiel fourni.

L'application ne remplace pas une montre connectée ou un dispositif médical. Elle est uniquement destinée au suivi manuel demandé par les médecins.

Choix technologique (IMPORTANT)

L'application doit être développée avec une technologie permettant une diffusion maximale.

Framework

Flutter (Google)

Pourquoi :

une seule base de code

Android

iPhone

iPad

Web

Windows

macOS

Linux (optionnel)

L'application devra pouvoir être publiée sur :

Apple App Store

Google Play

Web

sans modifier le code métier.

Principes de conception

Le maître mot est :

Simplicité

Le remplissage quotidien doit prendre moins de 30 secondes.

L'utilisateur ne doit jamais manipuler le graphique du sommeil.

Il ne saisit que quelques informations.

Le graphique est généré automatiquement.

Public visé

Patients

Centres du sommeil

Médecins

Neurologues

Pneumologues

Design

Interface moderne inspirée :

Apple Santé

Google Material 3

Utiliser :

Flutter Material 3

animations discrètes

coins arrondis

cartes

grands boutons

très peu de texte

couleurs douces

Mode clair

Mode sombre

Responsive

Architecture

Application entièrement locale.

Aucun compte.

Aucun serveur.

Toutes les données sont enregistrées dans la mémoire du téléphone.

Sauvegarde

Base SQLite locale.

Export JSON.

Import JSON.

Navigation

Navigation inférieure

Accueil

Historique

Statistiques

Paramètres

Écran Accueil

Carte principale

"Comment s'est passée votre nuit ?"

Bouton

Remplir

En dessous

Historique des derniers jours

Exemple

30 juillet

22h40 → 6h50

★★★★☆


Création d'une nuit

Un seul écran.

Grandes cartes.

1 Heure du coucher

Sélecteur heure.

2 Heure d'endormissement

Deux modes

Mode simple

Je me suis endormi immédiatement

ou

Mode délai

Temps avant endormissement

0

15

30

45

60

Autre

3 Réveils nocturnes

Bouton

Ajouter un réveil

Chaque réveil contient

Début

Fin

Suppression possible

Nombre illimité

4 Heure de lever

Sélecteur heure.

5 Sieste

Interrupteur

Oui

Non

Si Oui

heure début

heure fin

6 Evaluation

Trois notes.

Qualité du sommeil

Qualité du réveil

Forme de la journée

Valeurs possibles

Très bonne

Bonne

Moyenne

Mauvaise

Très mauvaise

En interne

TB

B

Moy

M

TM

7 Remarques

Texte libre.

Bouton

Enregistrer

Historique

Vue liste.

Une ligne par nuit.

Date

Heure coucher

Heure lever

Qualité

Modifier

Supprimer

Vue calendrier

Calendrier mensuel.

Chaque jour coloré.

Vert

Orange

Rouge

Un clic ouvre la fiche.

Statistiques

Durée moyenne du sommeil

Temps moyen d'endormissement

Nombre moyen de réveils

Temps éveillé

Heure moyenne du coucher

Heure moyenne du lever

Nombre de siestes

Temps total de sieste

Nombre de nuits enregistrées

Graphiques simples.

Paramètres

Nom

Prénom

Date de naissance

Centre du sommeil

Notifications

Thème clair/sombre

Format horaire

Sauvegarde

Export

Import

Export PDF

Fonction essentielle.

L'application doit générer automatiquement un PDF reprenant fidèlement le document papier fourni.

Le PDF doit respecter :

même présentation

même découpage horaire

même grille

même représentation graphique

mêmes colonnes

mêmes notes

mêmes commentaires

Le médecin doit pouvoir imprimer le PDF sans différence notable avec la feuille originale.

Moteur graphique

L'utilisateur ne dessine rien.

Le moteur convertit automatiquement les données.

Exemple

Coucher

22h30

Endormissement

22h50

Réveil

03h20 → 03h45

Lever

06h50


devient automatiquement

↓

██████

vide

████

↑

sur le graphique.

Export

PDF

PNG

CSV

Excel

JSON

Notifications

Le soir

"Pensez à noter votre heure de coucher."

Le matin

"Remplissez votre nuit."

Paramétrables.

Fonctionnement hors ligne

Obligatoire.

Aucune connexion Internet nécessaire.

Sécurité

Toutes les données restent sur l'appareil.

Aucune collecte.

Aucun tracking.

Aucune publicité.

Base de données

Table Nuit

id

date

heureCoucher

heureEndormissement

heureLever

qualiteSommeil

qualiteReveil

formeJournee

commentaire


Table Réveil

id

nuitId

debut

fin


Table Sieste

id

nuitId

debut

fin


Génération du PDF

Créer un moteur indépendant.

À partir des données de la nuit, il doit :

placer automatiquement :

↓

heure coucher

barre sommeil

blanc réveil

demi sommeil si besoin

↑ lever

S sieste

notes

commentaires

sans intervention de l'utilisateur.

Performances

Ouverture < 2 secondes.

Navigation fluide à 60 FPS.

Compatible téléphones de plus de 5 ans.

Accessibilité

Police adaptable.

Contraste suffisant.

Boutons de grande taille.

Compatible VoiceOver et TalkBack.

Architecture logicielle

Flutter 3.x

Dart

Architecture MVVM

Gestion d'état : Riverpod

Base locale : SQLite (Drift recommandé)

PDF : pdf + printing

Graphiques : fl_chart

Notifications : flutter_local_notifications

Partage : share_plus

Sélection de fichiers : file_picker

Internationalisation : intl

L'application doit être organisée par modules (sleep, history, statistics, settings, export) avec une séparation claire entre l'interface, la logique métier et les données.

Évolutions prévues (V2)

Le code doit être conçu pour intégrer facilement les fonctionnalités suivantes sans refonte majeure :

Synchronisation optionnelle via iCloud Drive, Google Drive ou Dropbox.

Sauvegarde chiffrée et restauration multi-appareils.

Import de données Apple Santé / Google Health Connect à titre informatif.

Génération d'un rapport médical enrichi (PDF avec statistiques et graphiques).

Plusieurs profils utilisateurs (famille).

Ajout de questionnaires validés (Epworth, Insomnia Severity Index, etc.).

Export conforme aux formats demandés par différents centres du sommeil.

Personnalisation du modèle PDF selon le formulaire du centre de sommeil.

Consigne finale pour l'IA de développement

L'objectif n'est pas de créer une application de suivi du sommeil grand public, mais un outil médical de saisie extrêmement simple, centré sur la conformité avec les agendas de sommeil utilisés en consultation. Toute décision d'interface doit privilégier la rapidité de saisie, la clarté et la fidélité de l'export PDF au document papier fourni. Le code doit être propre, documenté, modulaire et prêt à être publié sur Google Play et l'App Store à partir d'une unique base de code Flutter.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b7a40a8e-e858-4e51-9e94-a5d55d9e8c3d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
