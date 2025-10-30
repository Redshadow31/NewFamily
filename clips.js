// clips.js — version "users1/2/3 loader"
console.log("⚡ clip.js — chargement des membres via users1/2/3.json");

// ---------- Config ----------
const clientId = "rr75kdousbzbp8qfjy0xtppwpljuke";
let accessToken = "";
let clipsQueue = [];
let currentIndex = -1;
const CONCURRENCY = 10; // nb de requêtes simultanées max vers l’API

// parent dynamique pour l'embed
const PARENT_DOMAIN = window.location.hostname;

// ---------- Utilitaires ----------
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ---------- API helpers ----------
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

// Renvoie l'objet utilisateur (pas juste l'ID)
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
    const valid = (data.data || []).filter((c) => c.thumbnail_url && c.id);
    if (!valid.length) return null;
    return valid[Math.floor(Math.random() * valid.length)];
  } catch {
    return null;
  }
}

// ---------- Charge la liste des membres depuis users1/2/3 ----------
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
  // normalize + dedupe
  const normalized = [...new Set(all.map((u) => String(u || "").trim().toLowerCase()).filter(Boolean))];
  return normalized;
}

// ---------- UI helpers ----------
function tuneThumb(url) {
  if (!url) return { small: url, medium: url };
  return {
    small: url.replace(/-preview-\d+x\d+\.jpg/, "-preview-320x180.jpg"),
    medium: url.replace(/-preview-\d+x\d+\.jpg/, "-preview-480x272.jpg"),
  };
}

function updateProfileCard(profile) {
  const avatar = document.getElementById("profile-avatar");
  const name = document.getElementById("profile-name");
  const login = document.getElementById("profile-login");
  const bio = document.getElementById("profile-bio");
  const link = document.getElementById("profile-link");

  if (!profile) {
    name.textContent = "—";
    login.textContent = "@—";
    bio.textContent = "Profil indisponible.";
    link.href = "#";
    if (avatar) avatar.src = "";
    return;
  }
  if (avatar) {
    avatar.src = profile.avatar || "";
    avatar.alt = `Avatar de ${profile.display_name}`;
  }
  name.textContent = profile.display_name;
  login.textContent = `@${profile.login}`;
  bio.textContent = profile.bio && profile.bio.trim().length ? profile.bio : "Aucune bio renseignée.";
  link.href = `https://twitch.tv/${profile.login}`;
}

function displayClip(index) {
  const clip = clipsQueue[index];
  if (!clip) return;

  const p = document.getElementById("clip-player");
  const u = document.getElementById("clip-user");
  if (!p || !u) return;

  const tuned = tuneThumb(clip.thumbnail);
  p.innerHTML = `
    <img
      src="${tuned.small}"
      srcset="${tuned.small} 320w, ${tuned.medium} 480w"
      sizes="(max-width: 480px) 320px, 480px"
      alt="Preview du clip"
      loading="lazy"
      decoding="async"
      fetchpriority="${index === 0 ? "high" : "low"}"
      style="width:100%;border-radius:14px;cursor:pointer;"
      onclick="loadTwitchClip(this,'${clip.id}')"
    >
    <div class="play-button">▶</div>
  `;
  u.textContent = `👤 ${clip.profile.display_name}`;

  updateProfileCard(clip.profile);

  // Préfetch du prochain embed
  const next = clipsQueue[index + 1];
  if (next) {
    const prefetch = document.createElement("link");
    prefetch.rel = "prefetch";
    prefetch.as = "document";
    prefetch.href = `https://clips.twitch.tv/embed?clip=${next.id}&parent=${encodeURIComponent(PARENT_DOMAIN)}`;
    document.head.appendChild(prefetch);
  }
}

window.loadTwitchClip = function (imgEl, clipId) {
  const container = imgEl.parentElement;
  if (!container) return;
  container.innerHTML = `
    <iframe
      src="https://clips.twitch.tv/embed?clip=${clipId}&parent=${encodeURIComponent(PARENT_DOMAIN)}"
      width="100%"
      height="405"
      frameborder="0"
      allowfullscreen
      loading="lazy"
      title="Twitch clip"
    ></iframe>
  `;
};

function displayNextClip() {
  if (currentIndex < clipsQueue.length - 1) {
    currentIndex++;
    displayClip(currentIndex);
  } else {
    const u = document.getElementById("clip-user");
    if (u) u.textContent = "🚫 Aucun autre clip disponible.";
  }
}
function displayPreviousClip() {
  if (currentIndex > 0) {
    currentIndex--;
    displayClip(currentIndex);
  }
}

// ---------- Préparation (avec limite de concurrence) ----------
async function prepareOne(member) {
  try {
    const user = await getUser(member);
    if (!user) return null;
    const clip = await getRandomClip(user.id);
    if (!clip) return null;
    return {
      id: clip.id,
      thumbnail: clip.thumbnail_url,
      profile: user,
    };
  } catch {
    return null;
  }
}

async function prepareClipsWithPool(members) {
  // Option: randomiser l’ordre
  shuffle(members);

  // Pool de workers
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
          displayNextClip();
        }
      }
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  if (!firstShown) {
    const u = document.getElementById("clip-user");
    if (u) u.textContent = "Aucun clip disponible pour le moment.";
    updateProfileCard(null);
  }
}

// ---------- DOM ----------
document.addEventListener("DOMContentLoaded", () => {
  const nextBtn = document.getElementById("next-button");
  if (nextBtn) nextBtn.addEventListener("click", displayNextClip);
  const prevBtn = document.getElementById("prev-button");
  if (prevBtn) prevBtn.addEventListener("click", displayPreviousClip);
});

// ---------- Init ----------
(async () => {
  await getToken();
  if (!accessToken) {
    const u = document.getElementById("clip-user");
    if (u) u.textContent = "Erreur d’authentification Twitch.";
    updateProfileCard(null);
    return;
  }

  let members = await fetchAllMembers();

  // Fallback si vide
  if (!members.length) {
    console.warn("⚠️ Liste users1/2/3 vide — fallback minimal.");
    members = ["nexou31", "clarastonewall", "red_shadow_31"];
  }

  // Si la liste est très longue, on peut tronquer (optionnel) :
  // members = members.slice(0, 150);

  await prepareClipsWithPool(members);
})();
