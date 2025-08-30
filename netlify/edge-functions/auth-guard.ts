export default async (request, context) => {
  const cookie = request.headers.get("cookie") || "";
  const hasSession = cookie.includes("nf_session=");

  // Si pas connecté → redirige vers la page login
  if (!hasSession) {
    return Response.redirect(new URL("/login.html", request.url), 302);
  }

  // Sinon → on laisse passer
  return context.next();
};
