// Protège temporairement la landing page (pas encore en vente) par un
// simple mot de passe HTTP Basic, le temps des tests. Actif uniquement si
// LANDING_PREVIEW_PASSWORD est configurée sur Vercel — sinon, on laisse
// passer plutôt que de bloquer tout le monde par erreur de configuration.
export const config = {
  matcher: ["/intelligence-emotionnelle", "/intelligence-emotionnelle.html"],
};

export default function middleware(request) {
  const expectedPassword = process.env.LANDING_PREVIEW_PASSWORD;
  if (!expectedPassword) {
    return;
  }

  const expectedUser = process.env.LANDING_PREVIEW_USER || "dhabarry";
  const authHeader = request.headers.get("authorization");

  if (authHeader && authHeader.startsWith("Basic ")) {
    try {
      const decoded = atob(authHeader.slice(6));
      const separatorIndex = decoded.indexOf(":");
      const user = decoded.slice(0, separatorIndex);
      const pass = decoded.slice(separatorIndex + 1);
      if (user === expectedUser && pass === expectedPassword) {
        return;
      }
    } catch (err) {
      // Header malformé : on retombe sur la demande d'authentification ci-dessous.
    }
  }

  return new Response("Authentification requise.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Editions Dhabarry — Aperçu privé"' },
  });
}
