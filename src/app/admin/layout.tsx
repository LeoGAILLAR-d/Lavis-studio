import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/actions/account";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: { default: "Administration", template: "%s · Admin Lavis" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="admin">
      <aside>
        <Link href="/admin" className="logo" style={{ fontSize: 18, padding: 0 }}>
          LAVIS · ADMIN
        </Link>
        <nav aria-label="Administration">
          <Link href="/admin">Tableau de bord</Link>
          <Link href="/admin/commandes">Commandes</Link>
          <Link href="/admin/sur-mesure">Sur-mesure</Link>
          <Link href="/admin/oeuvres">Œuvres</Link>
          <Link href="/admin/bandeau">Bandeau & livraison</Link>
          <Link href="/">← Voir le site</Link>
        </nav>
        <p className="small muted" style={{ marginTop: 24 }}>
          {admin.email}
        </p>
        <form action={logout}>
          <button className="linkbtn small">Se déconnecter</button>
        </form>
      </aside>
      <main>{children}</main>
    </div>
  );
}
