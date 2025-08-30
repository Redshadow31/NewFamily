import { NextRequest, NextResponse } from "next/server"; // ignore si TS; on n'utilise que les types
// Netlify fournit un runtime "standard" pour Edge
export default async (request: Request) => {
  const url = new URL(request.url);
  const path = url.pathname;

  // Routes à protéger
  const protectedPaths = ["/admin.html", "/membres", "/membres/"];
  if (!protectedPaths.some(p => path === p || path.startsWith(p))) {
    return; // laisser passer
  }

  const cookie = request.headers.get("cookie") || "";
  const match = /(?:^|;\s*)nf_session=([^;]+)/.exec(cookie);
  if (!match) {
    return Response.redirect(new URL("/login.html", url), 302);
  }

  // Optionnel : valider la signature côté Edge (léger parsing sans lib)
  // Par simplicité, on fait confiance; pour une vraie vérif JWT côté Edge,
  // tu peux utiliser 'jose' en ESM + secret.

  return; // autorisé
};
