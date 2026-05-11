# Handoff: TraveloCount — App Mobile de Voyage en Groupe

## Overview
TraveloCount est une app mobile (iOS-first) qui aide des groupes d'amis à **planifier ensemble** (itinéraire, réservations) ET **gérer les dépenses partagées** (qui paie quoi, qui doit combien, règlement en 1 virement). Le prototype couvre l'ensemble du parcours : onboarding → liste des voyages → détail voyage (overview / dépenses / itinéraire / soldes) → ajout de dépense → règlement des comptes → activité → stats → profil → membres → discussion de groupe.

## About the Design Files
Les fichiers de ce bundle sont des **références de design en HTML/React** — des prototypes haute-fidélité qui montrent l'intention visuelle et comportementale, **pas du code de production à copier tel quel**. La tâche est de **recréer ces écrans dans l'environnement cible** (React Native, SwiftUI, Flutter, etc.) en utilisant les patterns, composants et conventions de la codebase existante. Si aucun environnement n'existe encore, choisir le framework le plus adapté (React Native + Expo recommandé pour une app cross-platform).

Les prototypes utilisent React 18 + Babel inline + un device frame iOS (composant `IOSDevice`) à des fins de présentation. Ne pas recréer le device frame — il est uniquement décoratif.

## Fidelity
**Hifi (haute fidélité)** : palette exacte, typographie finale, espacements précis, micro-interactions définies. Le développeur doit reproduire l'UI au pixel près en s'appuyant sur les composants existants de la codebase cible.

## Design Tokens

### Palette (extraite de l'impact map fournie par le client)
```
--ink:      #0C1A22   /* texte principal, dark surfaces */
--ink-2:    #2F4550   /* texte secondaire, dark accents */
--ink-3:    #586F7C   /* texte tertiaire, métadonnées */
--mute:     #8FA0AB   /* timestamps, hints */
--line:     rgba(47, 69, 80, 0.10)
--line-2:   rgba(47, 69, 80, 0.16)
--bg:       #F4F4F9   /* background app */
--surface:  #FFFFFF   /* cartes */
--accent:   #B8DBD9   /* accent menthe, CTA secondaire */
--accent-2: #9CC9C5
--pos:      #2F7A6A   /* solde positif, succès */
--neg:      #A0496B   /* solde négatif, danger */
```

### Typographie
- **Plus Jakarta Sans** (Google Fonts, weights 400/500/600/700/800) — UI, titres, body
- **JetBrains Mono** (Google Fonts, weights 500/600/700) — chiffres, codes, timestamps, montants

### Scale typographique observée
- H1 écran : 26px / 700 / letter-spacing -0.02em
- H1 onboarding : 30px / 700 / letter-spacing -0.025em
- H2 carte : 17–18px / 700 / -0.01em
- Body : 13.5–14px / 500–600
- Label majuscule : 10–12px / 600–700 / letter-spacing 0.06–0.08em / uppercase
- Mono montant gros : 32–44px / 600–700 / -0.04em letter-spacing

### Radius
- Cartes : 18–24px
- Inputs / boutons : 12–14px
- Pills : 999px
- Avatar : 50%

### Shadows
- Carte légère : `0 1px 0 rgba(47,69,80,0.04), 0 1px 2px rgba(47,69,80,0.04)`
- Carte voyage : `0 1px 0 rgba(47,69,80,0.04), 0 8px 20px rgba(47,69,80,0.06)`
- FAB : `0 10px 22px rgba(12,26,34,0.30), 0 0 0 5px rgba(244,244,249,0.95)`

### Spacing
Base 4px. Paddings écran : 16px horizontal. Gaps cartes : 10–14px.

## Screens / Views

### 1. Onboarding (`OnboardingScreen`)
3 slides Plan / Dépenses / Équilibre. Fond plein de la couleur ink/ink2, art SVG géométrique, kicker mono + headline 30px + body 14px, indicateurs de progression à 3 segments (segment actif 2x plus large + accent), CTA pleine largeur 54px en accent.

### 2. Liste des voyages — accueil (`TripsScreen`)
- Header "Bonjour Léa" + titre TraveloCount + RoundBtn search/notif
- **Card solde global** fond ink, halo radial accent, montant mono 32px, 2 CTA (Régler / Voir détail)
- Sections : En cours (TripCardLarge avec cover 128px), À venir (TripCardSmall), Passés (TripCardSmall muted)
- TripCardLarge : cover gradient + dot-grid SVG + silhouette skyline + chips status, body avec titre/dates/solde + barre de progression budget

### 3. Détail voyage (`TripScreen` dans `trip.jsx`)
Header sombre avec cover + back/discussion/members buttons. 4 onglets :
- **Overview** : KPI cards, prochaines activités, dernières dépenses
- **Dépenses** : liste groupée par jour avec CatBadge
- **Itinéraire** : timeline jour par jour
- **Soldes** : matrice qui doit à qui + bouton Settle

### 4. Ajout dépense (`AddExpenseSheet`)
Bottom sheet — montant en mono géant 56px, sélection catégorie via CatBadge grid, payeur, split (équal/parts/exact), label, date.

### 5. Détail dépense (`ExpenseDetailSheet`)
Sheet — récap dépense + qui a payé + qui doit à qui combien + bouton supprimer.

### 6. Règlement (`SettleSheet`)
Liste des transferts minimum (algo de simplification) avec un bouton "Marquer comme payé" par ligne.

### 7. Nouveau voyage (`NewTripWizard`)
Wizard 3 étapes : Voyage (titre/destination/dates/ambiance avec preview cover live) → Équipe (lien d'invitation + liste membres) → Budget (slider 100–2000€ + récap mono noir).

### 8. Membres (`MembersScreen`)
Card invitation par lien (ink + accent button), liste membres avec roles admin/membre, préférences groupe, bouton "Quitter le voyage" en danger.

### 9. Activité (`ActivityScreen`)
Feed unifié : avatar + badge d'action (receipt/check/map/sparkle/user) + texte "{Nom} {verbe} {label}" + timestamp mono + montant à droite si applicable.

### 10. Stats (`StatsScreen`)
- Filtres chips (Lisbonne / Tous / 2026 / Comparer)
- Donut SVG 5 catégories avec total au centre
- Barres journalières (jour actif highlight ink + dot accent)
- 2 KPI cards (moyenne / plus gros payeur)
- Carte conseil budget en accent

### 11. Profil (`ProfileScreen`)
Carte identité ink avec halo, sections Compte / Notifications / App avec rows ic+label+value+chevron.

### 12. Discussion (`DiscussionScreen`)
Chat thread. Header avec "X tape…", bulles asymétriques (me=ink/right, others=surface/left), pièces jointes "dépense" inline avec preview, input + bouton micro/envoi.

### 13. Bottom nav (`BottomNav`)
4 tabs (Voyages / Activité / Stats / Profil) avec FAB ink central (+54px) au-dessus, blur glass background.

## Interactions & Behavior
- Navigation : state `route = { screen, tripId, tab }` ; bottom nav switche le screen
- Sheets : montent depuis le bas, fond `PAL.surface`, drag handle visible
- Onboarding : progression pas-à-pas, segment de progression élargit le current
- Wizard : 3 étapes avec stepper en haut, bouton back contextuel (X si step 0, ← sinon)
- Tweaks panel : panneau dev pour switcher d'écran et toggler darkTrip/showCover/density/accent — **à NE PAS porter en prod**

## State Management
- État global minimum : utilisateur courant, liste voyages, membres, dépenses, balances dérivées
- Par écran : sélection onglet, valeurs de formulaire, sheet active
- Recommandé : Zustand ou Redux Toolkit côté React Native, Combine/SwiftData côté iOS natif

## Assets
**Aucun asset binaire** — tout est en SVG inline (icons, illustrations onboarding, dot-grid, skyline). Les "covers" de voyage sont des dégradés CSS. À remplacer par de vraies photos en prod.

Icônes custom dans `icons.jsx` (stroke-based, 1.8 weight par défaut) : IcPlane, IcBed, IcFork, IcCar, IcTicket, IcPin, IcReceipt, IcChart, IcMap, IcUser, IcUsers, IcBell, IcSearch, IcPlus, IcArrowL, IcArrowR, IcCheck, IcX, IcSwap, IcCal, IcSparkle, IcWallet, IcCompass, IcFilter, IcCamera, IcMore.

## Files (dans ce bundle)
- `TraveloCount.html` — entry point qui charge tous les .jsx via Babel
- `app.jsx` — App shell, navigation, TripsScreen, atoms (Avatar, Money, Chip, Card, CatBadge, etc.)
- `trip.jsx` — TripScreen + ses 4 onglets
- `sheets.jsx` — AddExpenseSheet, SettleSheet, ExpenseDetailSheet
- `screens-extra.jsx` — BottomNav, Onboarding, NewTripWizard, Members, Activity, Stats, Profile, Discussion
- `icons.jsx` — tous les SVG d'icônes
- `ios-frame.jsx` — device frame iOS (décoratif uniquement, NE PAS porter)
- `tweaks-panel.jsx` — panneau dev tweaks (NE PAS porter)

## Notes
- Tous les montants utilisent `toLocaleString('fr-FR', { minimumFractionDigits:2 })` et le composant `<Money>` pour l'alignement tabulaire
- Les avatars sont des initiales colorées (4 tons issus de la palette)
- La langue est le français (fr-FR) — labels, dates, devises
