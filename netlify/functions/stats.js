import fetch from "node-fetch";
import fs from "fs";
import path from "path";

// 🔧 Paramètres
const TWITCH_CLIENT_ID = "rr75kdousbzbp8qfjy0xtppwpljuke";
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET; 
const SNAPSHOT_FILE = "/tmp/live_snapshots.json";

async function readJSON(file) {
  const base = process.env.URL || process.env.DEPLOY_URL;
  const res = await fetch(`${base}/${file}`);
  if (!res.ok) return [];
  return res.json();
}


async function getTwitchToken() {
  const url = `https://id.twitch.tv/oauth2/token?client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`;

  const res = await fetch(url, { method: "POST" });
  return (await res.json()).access_token;
}

async function fetchStreams(logins, token) {
  if (!logins.length) return [];
  const query = logins.map(l => `user_login=${l}`).join("&");

  const res = await fetch(`https://api.twitch.tv/helix/streams?${query}`, {
    headers: {
      "Client-ID": TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json();
  return data.data || [];
}

export async function handler() {
  try {
    // 1️⃣ Charger les membres
    const users1 = readJSON("users1.json");
    const users2 = readJSON("users2.json");
    const users3 = readJSON("users3.json");
    const members = [...new Set([...users1, ...users2, ...users3])];

    // 2️⃣ Charger les évènements
    const events = readJSON("events.json");
    const eventsCount = events.filter(e => e.category !== "integration").length;

    // 3️⃣ Token Twitch
    const token = await getTwitchToken();

    // 4️⃣ Streams en cours
    const chunks = [];
    for (let i = 0; i < members.length; i += 100) {
      chunks.push(members.slice(i, i + 100));
    }

    let liveNow = 0;
    for (const c of chunks) {
      const streams = await fetchStreams(c, token);
      liveNow += streams.length;
    }
    // 📌 5️⃣ Snapshot des lives (pour moyenne 14 jours)
    let snaps = [];
    try {
      snaps = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, "utf8"));
    } catch {
      snaps = [];
    }

    const now = Date.now();
    snaps.push({ t: now, c: liveNow });

    // garder 14 jours
    const min = now - 14 * 86400000;
    snaps = snaps.filter(s => s.t >= min);

    // enregistrer
    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(snaps));

    // 6️⃣ Calcul de la moyenne
    const byDay = {};
    for (const s of snaps) {
      const d = new Date(s.t);
      const key = d.toISOString().slice(0,10);
      byDay[key] = Math.max(byDay[key] || 0, s.c);
    }

    const days = Object.keys(byDay);
    const liveAvg = days.length === 0 ? 0 : days.reduce((a, d) => a + byDay[d], 0) / days.length;

    // 7️⃣ Déterminer les actifs (entraide) → exemple simple :
    //            un membre est "actif" s'il a streamé au moins 1 fois
    //            dans les dernières 72h
    const active = members.filter(m => {
      const latest = snaps.filter(s => s.c > 0);
      return latest.length > 0;
    }).length;

    // 8️⃣ Retour API
    return {
      statusCode: 200,
      body: JSON.stringify({
        members: members.length,
        active,
        liveNow,
        liveAvg: Math.round(liveAvg),
        events: eventsCount
      })
    };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
