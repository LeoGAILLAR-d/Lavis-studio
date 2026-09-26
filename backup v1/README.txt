LAVIS STUDIO — site livré (v6)
================================

index.html
  Le site complet, autonome (images incluses dans le fichier).
  Pour le mettre en ligne : dépose ce seul fichier chez n'importe quel
  hébergeur statique (Netlify, Vercel, OVH, o2switch, etc.) en le
  renommant "index.html" à la racine.

admin-ajouter-oeuvre.html
  Outil personnel (pas pour les visiteurs du site) pour :
    - ajouter une nouvelle œuvre (titre, description, prix, format)
    - modifier une œuvre existante (prix, texte, marquer "vendue")
    - choisir toi-même, à la souris, la zone de l'image utilisée
      pour le zoom "détail" dans la fiche œuvre
  Utilisation : ouvre ce fichier dans ton navigateur (double-clic),
  charge ton index.html actuel, remplis le formulaire, ajuste le
  cadre de zoom sur l'image (fichier JPG/PNG — pas de TIFF, les
  navigateurs ne le lisent pas), clique "Générer le nouveau
  index.html", télécharge-le, et remplace l'ancien avant de
  redéployer. Rien n'est envoyé sur internet, tout se passe dans
  ton navigateur.

assets/
  Tes scans actuels, compressés en WebP, en 4 tailles chacun
  (sm, lg, dt, xl). Fournis pour référence — index.html n'en a pas
  besoin pour fonctionner.

Nouveautés de cette version :
- le bouton "Payer" tente d'appeler /api/create-checkout-session
  (Stripe) ; tant que cette fonction n'existe pas encore côté
  serveur, un mode démonstration s'affiche à la place, sans erreur.
- outil admin-ajouter-oeuvre.html pour gérer le catalogue toi-même.

À venir (prochaine étape avec Claude) :
- la fonction serverless /api/create-checkout-session.js (Stripe)
- le guide de déploiement Vercel pas à pas
