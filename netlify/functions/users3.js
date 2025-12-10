// netlify/functions/users3.js
import { getStore } from "@netlify/blobs";

export async function handler(event) {
  const store = getStore("new-family-store"); // nom du “bucket” Blobs
  const key = "users3"; // clé sous laquelle on stocke la liste

  // 🔐 (optionnel) vérif mot de passe simple envoyé par l’admin
  const adminToken = process.env.ADMIN_TOKEN || "";
  const reqToken =
    event.headers["x-admin-token"] ||
    event.headers["X-Admin-Token"] ||
    "";

  // GET = retourner la liste
  if (event.httpMethod === "GET") {
    const list = (await store.get(key, { type: "json" })) || [];
    return json(list);
  }

  // POST = ajouter/supprimer un pseudo
  if (event.httpMethod === "POST") {
    if (!adminToken || reqToken !== adminToken) {
      return { statusCode: 401, body: "Unauthorized" };
    }

    let body = {};
    try {
      body = JSON.parse(event.body || "{}");
    } catch {
      return { statusCode: 400, body: "Bad JSON" };
    }

    const action = (body.action || "").trim();
    const user = (body.user || "").toLowerCase().trim();
    if (!["add", "remove"].includes(action) || !user) {
      return { statusCode: 400, body: "Invalid payload" };
    }

    const current = (await store.get(key, { type: "json" })) || [];
    let next = Array.isArray(current) ? [...current] : [];

    if (action === "add" && !next.includes(user)) next.push(user);
    if (action === "remove") next = next.filter((u) => u !== user);

    // Dédup + tri basique
    next = [...new Set(next)].sort();

    await store.set(key, JSON.stringify(next), {
      contentType: "application/json",
    });

    return json(next);
  }

  return { statusCode: 405, body: "Method Not Allowed" };
}

function json(data) {
  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data),
  };
}
