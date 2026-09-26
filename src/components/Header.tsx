import Link from "next/link";
import { auth } from "@/auth";
import { getCart } from "@/lib/cart";

export async function Header() {
  const [session, cart] = await Promise.all([auth(), getCart()]);
  return (
    <header className="header">
      <div className="wrap">
        <Link href="/" className="logo">
          LAVIS STUDIO
        </Link>
        <nav className="nav" aria-label="Navigation principale">
          <Link href="/#galerie">Galerie</Link>
          <Link href="/sur-mesure" className="hide-sm">
            Sur-mesure
          </Link>
          <Link href="/guide-des-formats" className="hide-sm">
            Formats
          </Link>
          {session?.user?.role === "admin" && <Link href="/admin">Admin</Link>}
          <Link href="/compte">{session?.user ? "Mon compte" : "Connexion"}</Link>
          <Link href="/panier" className="cart-pill" aria-label={`Panier, ${cart.count} article(s)`}>
            Panier {cart.count}
          </Link>
        </nav>
      </div>
    </header>
  );
}
