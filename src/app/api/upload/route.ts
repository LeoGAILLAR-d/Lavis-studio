/* Téléversement direct navigateur → Vercel Blob (contourne la limite de 4,5 Mo des fonctions Vercel). */
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ALLOWED_ATTACHMENT_TYPES, MAX_ATTACHMENT_BYTES } from "@/lib/validation";

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const kind = clientPayload === "artwork" ? "artwork" : "commission";
        if (kind === "artwork") {
          const session = await auth();
          if (session?.user?.role !== "admin") throw new Error("Non autorisé");
          if (!pathname.startsWith("artworks/")) throw new Error("Chemin invalide");
          return {
            allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/avif"],
            maximumSizeInBytes: 50 * 1024 * 1024,
            addRandomSuffix: true,
          };
        }
        if (!pathname.startsWith("commissions/")) throw new Error("Chemin invalide");
        return {
          allowedContentTypes: [...ALLOWED_ATTACHMENT_TYPES],
          maximumSizeInBytes: MAX_ATTACHMENT_BYTES,
          addRandomSuffix: true, // URL non devinable
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
