import { toggleBanner } from "@/actions/admin";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getSettings } from "@/lib/settings";

export const metadata = { title: "Bandeau & livraison" };

export default async function BannerAdmin() {
  const s = await getSettings();
  return (
    <>
      <h1>Bandeau d&apos;annonce & livraison</h1>
      <div className="card pad spread" style={{ marginBottom: 24 }}>
        <div>
          <strong className="sans">Bandeau : {s.bannerActive ? "actif" : "inactif"}</strong>
          <p className="small muted" style={{ margin: 0 }}>
            {s.bannerText || "Aucun message"}
          </p>
        </div>
        <form action={toggleBanner}>
          <input type="hidden" name="active" value={s.bannerActive ? "0" : "1"} />
          <button className={s.bannerActive ? "btn ghost" : "btn"} aria-pressed={s.bannerActive}>
            {s.bannerActive ? "Désactiver" : "Activer"}
          </button>
        </form>
      </div>
      <div className="card pad" style={{ maxWidth: 760 }}>
        <SettingsForm s={s} />
      </div>
    </>
  );
}
