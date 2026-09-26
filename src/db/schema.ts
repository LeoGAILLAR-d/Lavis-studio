/* Lavis Studio — schéma de données PostgreSQL (Drizzle ORM). Migrations : `npm run db:generate` puis `npm run db:migrate`. */
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  real,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["client", "admin"]);
// pending = Nouvelle · processing = En préparation · shipped = Expédiée · completed = Terminée · cancelled = Annulée
export const orderStatusEnum = pgEnum("order_status", ["pending", "processing", "shipped", "completed", "cancelled"]);
export const paymentStatusEnum = pgEnum("payment_status", ["unpaid", "paid", "refunded"]);
export const variantEnum = pgEnum("variant", ["original", "print"]);
// new = Nouvelle · in_discussion = En discussion · quote_sent = Devis envoyé · declined = Refusée · completed = Terminée
export const commissionStatusEnum = pgEnum("commission_status", [
  "new",
  "in_discussion",
  "quote_sent",
  "declined",
  "completed",
]);

const money = (name: string) => numeric(name, { precision: 10, scale: 2, mode: "number" });
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("client"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  createdAt: createdAt(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }), // null si invité
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2"),
    postalCode: text("postal_code").notNull(),
    city: text("city").notNull(),
    country: text("country").notNull(),
    phone: text("phone"),
    isDefault: boolean("is_default").notNull().default(false),
    // Retirée du carnet par le client (conservée car liée à une commande)
    isArchived: boolean("is_archived").notNull().default(false),
  },
  (t) => [index("addresses_user_idx").on(t.userId)],
);

export const artworks = pgTable(
  "artworks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    category: text("category").notNull(),
    format: text("format").notNull(),
    description: text("description").notNull(),
    altText: text("alt_text").notNull(),
    imageUrl: text("image_url").notNull(),
    zoomX: integer("zoom_x").notNull().default(50),
    zoomY: integer("zoom_y").notNull().default(50),
    // Puissance du zoom (1 = aucun, 6 = maximum) : à réduire pour les images de faible résolution
    zoomScale: real("zoom_scale").notNull().default(2.5),
    originalPrice: money("original_price"), // null = pas d'original à vendre
    printPrice: money("print_price").notNull(),
    isOriginalSold: boolean("is_original_sold").notNull().default(false),
    isPublished: boolean("is_published").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("artworks_published_idx").on(t.isPublished, t.category)],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: text("order_number").notNull().unique(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    guestEmail: text("guest_email"),
    // E-mail de contact effectif (compte ou invité), figé au moment de la commande
    contactEmail: text("contact_email").notNull(),
    shippingAddressId: uuid("shipping_address_id")
      .notNull()
      .references(() => addresses.id),
    shippingZone: text("shipping_zone").notNull(),
    shippingCost: money("shipping_cost").notNull(),
    totalAmount: money("total_amount").notNull(),
    status: orderStatusEnum("status").notNull().default("pending"),
    trackingNumber: text("tracking_number"),
    trackingCarrier: text("tracking_carrier"),
    // Paiement — isolé pour le branchement Stripe (webhooks) en phase 2
    paymentStatus: paymentStatusEnum("payment_status").notNull().default("unpaid"),
    paymentIntentId: text("payment_intent_id").unique(),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("orders_status_idx").on(t.status),
    index("orders_user_idx").on(t.userId),
    index("orders_created_idx").on(t.createdAt),
  ],
);

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  artworkId: uuid("artwork_id")
    .notNull()
    .references(() => artworks.id),
  variant: variantEnum("variant").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: money("unit_price").notNull(),
});

// Panier persistant : cookie `lavis_cart` = id du panier, rattaché au compte si connecté
export const carts = pgTable("carts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    artworkId: uuid("artwork_id")
      .notNull()
      .references(() => artworks.id, { onDelete: "cascade" }),
    variant: variantEnum("variant").notNull(),
    quantity: integer("quantity").notNull().default(1),
  },
  (t) => [uniqueIndex("cart_items_unique").on(t.cartId, t.artworkId, t.variant)],
);

export type Attachment = { url: string; name: string; contentType: string; size: number };

export const commissionRequests = pgTable(
  "commission_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientName: text("client_name").notNull(),
    clientEmail: text("client_email").notNull(),
    desiredFormat: text("desired_format").notNull(),
    deadline: text("deadline"),
    description: text("description").notNull(),
    attachmentUrls: jsonb("attachment_urls").$type<Attachment[]>().notNull().default([]),
    status: commissionStatusEnum("status").notNull().default("new"),
    createdAt: createdAt(),
  },
  (t) => [index("commissions_status_idx").on(t.status)],
);

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  bannerText: text("banner_text").notNull().default(""),
  bannerActive: boolean("banner_active").notNull().default(false),
  freeShippingThreshold: money("free_shipping_threshold").notNull().default(150),
  shippingFr: money("shipping_fr").notNull().default(6.9),
  shippingEu: money("shipping_eu").notNull().default(12.9),
  shippingWorld: money("shipping_world").notNull().default(19.9),
  // Délai affiché pour les tirages (commandés à l'imprimeur, signés puis expédiés)
  printLeadTime: text("print_lead_time").notNull().default("1 à 2 semaines"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* Relations (pour les requêtes `db.query.*`) */
export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders),
}));
export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, { fields: [addresses.userId], references: [users.id] }),
}));
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  shippingAddress: one(addresses, { fields: [orders.shippingAddressId], references: [addresses.id] }),
  items: many(orderItems),
}));
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  artwork: one(artworks, { fields: [orderItems.artworkId], references: [artworks.id] }),
}));
export const cartsRelations = relations(carts, ({ many }) => ({ items: many(cartItems) }));
export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  artwork: one(artworks, { fields: [cartItems.artworkId], references: [artworks.id] }),
}));

export type Artwork = typeof artworks.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type CommissionStatus = (typeof commissionStatusEnum.enumValues)[number];
export type Variant = (typeof variantEnum.enumValues)[number];
