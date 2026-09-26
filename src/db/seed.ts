/* Jeu d'essai : réglages du site, compte admin et œuvres actuelles. Idempotent (upsert). */
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

try {
  process.loadEnvFile(".env");
} catch {
  /* variables fournies par l'environnement (Vercel) */
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL, max: 1 });
const db = drizzle(pool, { schema });

const artworks = [
  {
    slug: "colline-de-bruyere",
    title: "Colline de bruyère",
    category: "Paysage",
    format: "A5 — 21 × 14,8 cm",
    originalPrice: 150,
    printPrice: 60,
    altText: "Aquarelle d'une colline couverte de bruyère rose et de sapins, dessinée au liner noir",
    description:
      "Une colline prise de face, la bruyère en taches roses sur les pentes et la forêt de sapins au premier plan. Le trait est posé sapin par sapin, sans crayon dessous.",
    zoomX: 55,
    zoomY: 60,
  },
  {
    slug: "guadeloupe",
    title: "Guadeloupe",
    category: "Architecture",
    format: "A5 — 21 × 14,8 cm",
    originalPrice: null,
    printPrice: 60,
    altText: "Aquarelle de maisons créoles aux toits rouges entourées de végétation tropicale",
    description:
      "Des toits de tôle rouge serrés les uns contre les autres, au milieu de la végétation. Presque tout est dans le trait ; la couleur ne fait qu'indiquer la chaleur.",
    zoomX: 50,
    zoomY: 45,
  },
  {
    slug: "iles-pigeon",
    title: "Îles Pigeon",
    category: "Îles",
    format: "A5 — 21 × 14,8 cm",
    originalPrice: null,
    printPrice: 25,
    altText: "Aquarelle et encre d'un ensemble d'îlots rocheux entourés d'embarcations",
    description:
      "Cette aquarelle au trait épuré représente un ensemble d'îlots rocheux et verdoyants entourés d'embarcations sur une mer calme.",
    zoomX: 50,
    zoomY: 50,
  },
  {
    slug: "la-croix-du-promontoire",
    title: "La Croix du Promontoire",
    category: "Paysage",
    format: "A5 — 21 × 14,8 cm",
    originalPrice: 60,
    printPrice: 25,
    altText: "Aquarelle d'une croix monumentale au sommet d'une falaise, sentier littoral méditerranéen",
    description:
      "Dressée au sommet d'une falaise battue par les vents, une croix monumentale veille sur ce sentier littoral bordé de végétation méditerranéenne.",
    zoomX: 50,
    zoomY: 40,
  },
];

async function main() {
  await db
    .insert(schema.siteSettings)
    .values({
      id: 1,
      bannerText: "Expédition sous 3 jours ouvrés · livraison offerte en France dès 150 €",
      bannerActive: true,
    })
    .onConflictDoNothing();

  for (const [i, a] of artworks.entries()) {
    await db
      .insert(schema.artworks)
      .values({ ...a, imageUrl: `/artworks/${a.slug}.webp`, sortOrder: i })
      .onConflictDoNothing({ target: schema.artworks.slug });
  }

  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    if (password.length < 10) throw new Error("ADMIN_PASSWORD doit faire au moins 10 caractères");
    const passwordHash = await bcrypt.hash(password, 12);
    await db
      .insert(schema.users)
      .values({ email, passwordHash, role: "admin", firstName: "Léo", lastName: "Gaillard" })
      .onConflictDoUpdate({ target: schema.users.email, set: { role: "admin" } });
    console.log(`Compte admin prêt : ${email}`);
  } else {
    console.warn("ADMIN_EMAIL / ADMIN_PASSWORD absents : aucun compte admin créé.");
  }
  console.log(`${artworks.length} œuvres importées.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
