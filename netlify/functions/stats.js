const fetch = require("node-fetch");
const { getStore } = require("@netlify/blobs");

const CLIENT_ID = "rr75kdousbzbp8qfjy0xtppwpljuke";
// À définir dans Netlify → Site settings → Environment variables
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET || "";

/**
 * Récupère un JSON public du site (users1.json, events.json, etc.)
 */
async function readJSON(fileName) {
  const base =
    process.env.URL ||
    process.env.DEPLOY_URL ||
    process.env.DEPLOY_PRIME_URL ||
    "https://newfamily.netlify.app";

  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/${fileName}`, {
      headers: { "User-Agent": "newfamily-stats-fn" },
    });
    if (!res.ok) {
      console.warn("⚠ readJSON:", fileName, "->", res.status);
      return [];
    }
    return await res.json();
  } catch (err) {
    console.error("❌ Erreur readJSON:", fileName, err.message);
    return [];
  }
}

/**
 * Token Twitch
 */
async function getTwitchToken() {
  if (!CLIENT_SECRET) {
    console.warn("⚠ Pas de TWITCH_CLIENT_SECRET défini → liveNow restera à 0");
    return null;
  }

  const url = `https://id.twitch.tv/oauth2/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`;

  const res = await fetch(url, { method: "POST" });
  if (!res.ok) {
    console.warn("⚠ Erreur token Twitch:", res.status);
    return null;
  }
  const data = await res.json();
  return data.access_token;
}

/**
 * Récupère les streams en cours pour un chunk de logins
 */
async function fetchStreams(logins, token) {
  if (!token || !logins.length) return [];
  const query = logins.map((l) => `user_login=${encodeURIComponent(l)}`).join("&");

  const res = await fetch(`https://api.twitch.tv/helix/streams?${query}`, {
    headers: {
      "Client-ID": CLIENT_ID,
      Authorization: "Bearer " + token,
    },
  });

  if (!res.ok) {
    console.warn("⚠ Erreur Twitch streams:", res.status);
    return [];
  }

  const data = await res.json();
  return data.data || [];
}

exports.handler = async function (event, context) {
  try {
    // 1️⃣ Charger les membres + les events
    const [u1, u2, u3, eventsRaw] = await Promise.all([
      readJSON("users1.json"),
      readJSON("users2.json"),
      readJSON("users3.json"),
      readJSON("events.json"),
    ]);

    const membersSet = new Set();
    [...u1, ...u2, ...u3].forEach((login) => {
      if (typeof login === "string" && login.trim()) {
        membersSet.add(login.toLowerCase());
      }
    });
    const members = Array.from(membersSet);

    const events =
      Array.isArray(eventsRaw) ?
      eventsRaw.filter((e) => e.category !== "integration") :
      [];
    const eventsCount = events.length;

    // 2️⃣ Compter les lives en cours
    const token = await getTwitchToken();
    let liveNow = 0;
    const activeLogins = new Set();

    if (token && members.length) {
      for (let i = 0; i < members.length; i += 100) {
        const chunk = members.slice(i, i + 100);
        const streams = await fetchStreams(chunk, token);
        liveNow += streams.length;
        streams.forEach((s) =>
          activeLogins.add((s.user_login || s.user_name || "").toLowerCase())
        );
      }
    }

    const active = activeLogins.size;

    // 3️⃣ Historique sur 14 jours avec Netlify Blobs
    const store = getStore("live-stats-tenf");
    const key = "history.json";

    let history = [];
    try {
      const text = await store.get(key, { type: "text" });
      if (text) history = JSON.parse(text);
    } catch {
      history = [];
    }

    const now = Date.now();
    history.push({ t: now, c: liveNow });

    const cutoff = now - 14 * 24 * 60 * 60 * 1000;
    history = history.filter((h) => h.t >= cutoff);

    await store.set(key, JSON.stringify(history), {
      metadata: { updatedAt: new Date().toISOString() },
    });

    // 4️⃣ Moyenne de lives / jour (max par jour)
    const perDay = {};
    for (const h of history) {
      const d = new Date(h.t).toISOString().slice(0, 10);
      perDay[d] = Math.max(perDay[d] || 0, h.c);
    }
    const days = Object.keys(perDay);
    const liveAvg =
      days.length === 0
        ? 0
        : Math.round(days.reduce((sum, d) => sum + perDay[d], 0) / days.length);

    // 5️⃣ Réponse JSON pour le front
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify({
        members: members.length,
        active,
        liveNow,
        liveAvg,
        events: eventsCount,
      }),
    };
  } catch (err) {
    console.error("❌ Stats function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "stats-failed", details: err.message }),
    };
  }
};
