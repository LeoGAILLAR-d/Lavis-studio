import { Banner } from "@/components/Banner";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getSettings } from "@/lib/settings";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const s = await getSettings();
  return (
    <>
      {s.bannerActive && s.bannerText && <Banner text={s.bannerText} version={String(new Date(s.updatedAt).getTime())} />}
      <Header />
      <main id="contenu">{children}</main>
      <Footer />
    </>
  );
}
