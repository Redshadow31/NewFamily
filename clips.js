// clips.js — version alignée avec le nouveau clips.html
// Utilise users1/2/3.json, Netlify token, pool de requêtes, et iframe direct.
console.log("⚡ clip.js — new UI (iframe direct) + users1/2/3 loader");

const clientId = "rr75kdousbzbp8qfjy0xtppwpljuke";
let accessToken = "";
let clipsQueue = [];
let currentIndex = -1;
const CONCURRENCY = 10;

// parent pour l'embed
const PARENT_DOMAIN =
  (window.CLIPS_PARENT && String(window.CLIPS_PARENT)) ||
  window.location.hostname.replace(/^www\./, "") ||
  "localhost";

/* ------------------- Utils ------------------- */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/* ------------------- API ------------------- */
async function getToken() {
  try {
    const res = await fetch("/.netlify/functions/getTwitchData", { cache: "no-store" });
    if (!res.ok) throw new Error(`getTwitchData failed: ${res.status}`);
    const data = await res.json();
    accessToken = data.access_token;
  } catch (e) {
    console.error("❌ Token Twitch introuvable :", e);
  }
}

async function getUser(username) {
  try {
    const res = await fetch(
      `https://api.twitch.tv/helix/users?login=${encodeURIComponent(username)}`,
      { headers: { "Client-ID": clientId, Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const u = data.data?.[0];
    if (!u) return null;
    return {
      id: u.id,
      login: u.login,
      display_name: u.display_name || u.login,
      avatar: u.profile_image_url || "",
      bio: u.description || "",
    };
  } catch {
    return null;
  }
}

async function getRandomClip(userId) {
  try {
    const res = await fetch(
      `https://api.twitch.tv/helix/clips?broadcaster_id=${userId}&first=10`,
      { headers: { "Client-ID": clientId, Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const valid = (data.data || []).filter((c) => c.id);
    if (!valid.length) return null;
    return valid[Math.floor(Math.random() * valid.length)];
  } catch {
    return null;
  }
}

/* -------- members from users1/2/3 -------- */
async function fetchAllMembers() {
  const files = ["users1.json", "users2.json", "users3.json"];
  const all = [];
  for (const f of files) {
    try {
      const r = await fetch(f, { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      if (Array.isArray(data)) all.push(...data);
      console.info(`Chargé ${f} → ${Array.isArray(data) ? data.length : 0} users`);
    } catch (e) {
      console.warn(`⚠️ Impossible de charger ${f} :`, e.message || e);
    }
  }
  const normalized = [...new Set(all.map((u) => String(u || "").trim().toLowerCase()).filter(Boolean))];
  return normalized;
}

/* ------------------- UI helpers ------------------- */
function updateProfile(profile) {
  const avatar = document.getElementById("stream-avatar");
  const name = document.getElementById("stream-name");
  const handle = document.getElementById("stream-handle");
  const bio = document.getElementById("stream-bio");
  const link = document.getElementById("stream-link");

  if (!profile) {
    if (avatar) avatar.src = "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_70x70.png";
    if (name) name.textContent = "—";
    if (handle) handle.textContent = "@—";
    if (bio) bio.textContent = "Profil indisponible.";
    if (link) link.href = "#";
    return;
  }
  if (avatar) {
    avatar.src = profile.avatar || "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_70x70.png";
    avatar.alt = `Avatar de ${profile.display_name}`;
  }
  if (name) name.textContent = profile.display_name;
  if (handle) handle.textContent = `@${profile.login}`;
  if (bio) bio.textContent = profile.bio && profile.bio.trim().length ? profile.bio : "Aucune bio renseignée.";
  if (link) link.href = `https://twitch.tv/${profile.login}`;
}

function setIframeClip(clipId) {
  const iframe = document.getElementById("clip-iframe");
  if (!iframe) return;
  const url = new URL("https://clips.twitch.tv/embed");
  url.searchParams.set("clip", clipId);
  url.searchParams.set("parent", PARENT_DOMAIN);
  url.searchParams.set("autoplay", "true");
  url.searchParams.set("muted", "false");
  iframe.src = url.toString();
}

/* ------------------- Display ------------------- */
function displayClip(index) {
  const item = clipsQueue[index];
  if (!item) return;
  // lecteur
  setIframeClip(item.id);
  // profil
  updateProfile(item.profile);

  // Prefetch du prochain document embed (micro-opt)
  const next = clipsQueue[index + 1];
  if (next) {
    const l = document.createElement("link");
    l.rel = "prefetch";
    l.as = "document";
    l.href = `https://clips.twitch.tv/embed?clip=${next.id}&parent=${encodeURIComponent(PARENT_DOMAIN)}`;
    document.head.appendChild(l);
  }
}

function nextClip() {
  if (currentIndex < clipsQueue.length - 1) {
    currentIndex++;
    displayClip(currentIndex);
  }
}

function prevClip() {
  if (currentIndex > 0) {
    currentIndex--;
    displayClip(currentIndex);
  }
}

/* ------------------- Build queue (pool) ------------------- */
async function prepareOne(member) {
  try {
    const user = await getUser(member);
    if (!user) return null;
    const clip = await getRandomClip(user.id);
    if (!clip) return null;
    return { id: clip.id, profile: user };
  } catch {
    return null;
  }
}

async function prepareClipsWithPool(members) {
  shuffle(members);

  let cursor = 0;
  let firstShown = false;

  async function worker() {
    while (cursor < members.length) {
      const idx = cursor++;
      const res = await prepareOne(members[idx]);
      if (res) {
        clipsQueue.push(res);
        if (!firstShown) {
          firstShown = true;
          nextClip();
        }
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  if (!firstShown) {
    updateProfile(null);
  }
}

/* ------------------- DOM ------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const btnNext = document.getElementById("btn-next");
  if (btnNext) btnNext.addEventListener("click", nextClip);
  const btnPrev = document.getElementById("btn-prev");
  if (btnPrev) btnPrev.addEventListener("click", prevClip);
});

/* ------------------- Init ------------------- */
(async () => {
  await getToken();
  if (!accessToken) {
    updateProfile(null);
    return;
  }

  let members = await fetchAllMembers();
  if (!members.length) {
    console.warn("⚠️ Liste users1/2/3 vide — fallback minimal.");
    members = ["nexou31", "clarastonewall", "red_shadow_31"];
  }

  await prepareClipsWithPool(members);
})();
