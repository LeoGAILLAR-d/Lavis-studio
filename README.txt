LAVIS STUDIO — site livré (v4)
================================

index.html
  Le site complet, autonome (images incluses dans le fichier).
  Pour le mettre en ligne : dépose ce seul fichier chez n'importe quel
  hébergeur statique (Netlify, Vercel, OVH, o2switch, etc.) en le
  renommant "index.html" à la racine.

assets/
  Tes deux scans, compressés en WebP, en 4 tailles chacun :
  sm (grille), lg (fiche œuvre), dt (détail zoomé pré-recadré),
  xl (haute définition, utilisée pour le zoom interactif).
  Fournis pour référence — index.html n'en a pas besoin pour
  fonctionner, les images y sont déjà intégrées.

Nouveauté de cette version :
  Cliquer sur l'image d'une œuvre ouvre une vue plein écran avec
  zoom interactif : molette ou boutons +/− sur ordinateur, pincement
  à deux doigts sur mobile, glisser pour se déplacer dans l'image.

Points encore à trancher :
- le format réel de chaque œuvre (actuellement A5 par défaut)
- les titres définitifs
- le seuil de livraison offerte (150 € actuellement)
- brancher un vrai formulaire (Formspree ou équivalent) à la place
  du mailto, et Stripe/PayPal pour un vrai paiement
