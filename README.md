# Lavis Studio — e-commerce & back-office

Boutique d'aquarelles originales et de tirages signés de Léo Gaillard.
Next.js 15 (App Router, Server Actions, TypeScript) · PostgreSQL (Neon) · Drizzle ORM · Auth.js · Vercel Blob · Resend.

## Fonctionnalités

**Site public**
- Bandeau d'annonce piloté depuis l'admin, fermable par le visiteur (session).
- Galerie alimentée par la base, filtre par catégorie, étiquettes automatiques (Original disponible / vendu / Tirage seul).
- Fiche œuvre : visualiseur HD, détail centré sur `zoomX`/`zoomY`, plein écran avec zoom molette / pincement, choix Original / Tirage (original désactivé s'il est vendu ou déjà au panier).
- Guide des formats (comparateur A5/A4/A3 à l'échelle sur un mur) + FAQ papier / encres.
- Panier persistant en base (cookie), commande invité ou connecté, frais de port par zone (France / UE / Monde), livraison offerte en France au-delà du seuil réglé dans l'admin, référence `LAVIS-AAAA-XXXX`.
- Formulaire sur-mesure sans `mailto` : 1 à 2 pièces jointes (JPG/PNG/PDF, 10 Mo) envoyées directement sur Vercel Blob, e-mail à l'artiste (`Reply-To` = client) + accusé de réception au client, anti-spam Turnstile + pot de miel.
- Compte client : inscription, connexion, mot de passe oublié, carnet d'adresses, historique des commandes avec lien de suivi.

**Back-office `/admin`** (rôle `admin` uniquement, revérifié en base à chaque action)
- Tableau de bord : ventes totales / du mois, répartition originaux / tirages, graphique 6 mois, raccourcis.
- Bandeau (texte + interrupteur) et frais de port.
- Œuvres : CRUD complet, téléversement du scan HD, choix du point de zoom au clic ou aux curseurs avec aperçu.
- Commandes : filtre par statut, détail, passage en « Expédiée » avec numéro de suivi → e-mail automatique au client. L'annulation remet les originaux en vente.
- Demandes sur-mesure : aperçu des pièces jointes, changement de statut.

## Démarrage local

Prérequis : Node.js 20+ et une base PostgreSQL (une base Neon gratuite suffit).

```bash
npm install
cp .env.example .env          # puis remplir les valeurs
npm run db:migrate            # crée les tables
npm run db:seed               # réglages + 4 œuvres actuelles + compte admin
npm run dev                   # http://localhost:3000
```

Connexion admin : `/compte/connexion` avec `ADMIN_EMAIL` / `ADMIN_PASSWORD`, puis `/admin`.
Sans `RESEND_API_KEY`, les e-mails sont affichés dans la console. Sans `BLOB_READ_WRITE_TOKEN`, le téléversement de fichiers est indisponible (le reste fonctionne).

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | URL Neon *pooled* (contient `-pooler`), utilisée par le site |
| `DATABASE_URL_UNPOOLED` | URL Neon directe, utilisée par les migrations |
| `AUTH_SECRET` | Secret des sessions (`npx auth secret`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Compte admin créé / promu par `npm run db:seed` (10 caractères min.) |
| `NEXT_PUBLIC_SITE_URL` | URL publique (liens des e-mails), ex. `https://lavis-studio.fr` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob (images d'œuvres, pièces jointes) |
| `RESEND_API_KEY`, `EMAIL_FROM` | Envoi des e-mails (domaine vérifié chez Resend) |
| `ARTIST_EMAIL` | Destinataire des alertes de vente et demandes sur-mesure |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | Anti-spam Cloudflare Turnstile (optionnel en local) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Paiement en ligne (voir plus bas) |

## Mise en ligne sur Vercel

1. **Base** : Vercel → *Storage* → *Create* → **Neon** (Postgres). Les variables `DATABASE_URL` et `DATABASE_URL_UNPOOLED` sont ajoutées automatiquement.
2. **Fichiers** : Vercel → *Storage* → **Blob** → lier au projet (`BLOB_READ_WRITE_TOKEN` ajouté automatiquement).
3. **E-mails** : créer un compte [Resend](https://resend.com), vérifier le domaine `.fr`, créer une clé API.
4. **Anti-spam** : Cloudflare → Turnstile → ajouter le site, récupérer les deux clés.
5. Renseigner les autres variables dans *Settings → Environment Variables*.
6. Déployer : le script `vercel-build` applique les migrations puis compile.
7. Une seule fois, depuis votre poste avec les variables de production : `npm run db:seed` (crée le compte admin et importe les œuvres).

## Structure

```
drizzle/            migrations SQL versionnées
public/artworks/    images des œuvres du jeu d'essai
src/db/             schéma, client, migrate.ts, seed.ts
src/actions/        Server Actions (panier, commande, sur-mesure, compte, admin)
src/app/(site)/     pages publiques et compte client
src/app/admin/      back-office
src/app/api/        Auth.js et téléversement Blob
src/components/     composants (galerie, visualiseur, formulaires…)
src/emails/         templates React Email
src/lib/            auth, panier, frais de port, validation Zod, e-mails, paiement
```

Modifier le schéma : éditer `src/db/schema.ts`, puis `npm run db:generate` (nouvelle migration) et `npm run db:migrate`.

## Paiement en ligne (Stripe)

Le paiement s'active dès que `STRIPE_SECRET_KEY` est renseignée ; sans clé, les commandes restent enregistrées « non payées » (règlement manuel).

1. Créer un compte sur [stripe.com](https://stripe.com), compléter l'activation (identité, IBAN).
2. *Développeurs → Clés API* : copier la **clé secrète** (`sk_test_…` pour tester, `sk_live_…` en production) dans `STRIPE_SECRET_KEY` (Vercel).
3. *Développeurs → Webhooks → Ajouter un endpoint* : URL `https://VOTRE-SITE/api/webhooks/stripe`, événements
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`,
   `checkout.session.expired`, `charge.refunded`. Copier le **secret de signature** (`whsec_…`) dans `STRIPE_WEBHOOK_SECRET`.
4. Redéployer.

Fonctionnement : à la validation, la commande est créée (originaux réservés) puis le client est redirigé vers Stripe Checkout.
Le webhook passe la commande en `paid` et envoie les e-mails. Si le paiement n'est pas finalisé sous 30 min, la commande est
annulée et les originaux redeviennent disponibles. Un remboursement fait depuis Stripe passe la commande en `refunded`.
Test : en mode `sk_test_`, carte `4242 4242 4242 4242`, date future, CVC quelconque.

## Pages légales

`/mentions-legales`, `/cgv` et `/confidentialite`. Les informations (SIRET, adresse, médiateur…) sont centralisées dans
`src/lib/legal.ts` : remplacer chaque « [À COMPLÉTER] » avant la mise en vente.

## Écarts assumés par rapport au cahier des charges

- **Drizzle ORM** plutôt que Prisma (autorisé par le cahier des charges) : pas de moteur binaire, démarrage plus rapide sur Vercel.
- Statuts des commandes : ajout de `completed` (Terminée), prévu dans l'interface. Statuts sur-mesure alignés sur l'interface demandée (Nouvelle, En discussion, Devis envoyé, Refusée, Terminée).
- Tables ajoutées : `carts` / `cart_items` (panier persistant), `password_reset_tokens`. Colonnes ajoutées : `orders.contact_email`, `tracking_carrier`, `updated_at`, `artworks.sort_order`, `addresses.phone` / `is_default` / `is_archived`, frais de port par zone dans `site_settings`.
- Livraison offerte au-delà du seuil : France uniquement, comme sur le site actuel (modifiable dans `src/lib/shipping.ts`).
- CSRF : les Server Actions de Next.js vérifient l'origine des requêtes ; Turnstile + pot de miel protègent le formulaire sur-mesure.
