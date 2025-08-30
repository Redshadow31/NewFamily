console.log("⚡ clip.js optimisé + profil chargé");

// ---------- Config ----------
const clientId = "rr75kdousbzbp8qfjy0xtppwpljuke";
let accessToken = "";
let clipsQueue = [];
let currentIndex = -1;

// parent dynamique
const PARENT_DOMAIN = window.location.hostname;

// Pseudos ciblés
const members = [
  "nexou31",
  "clarastonewall",
  "red_shadow_31",
  "selena_Akemi",
  "thony1384",
  "jenny31200",
  "vektor_live",
  "livio_on",
  "dylow95",
];

// ---------- API helpers ----------
async function getToken() {
  try {
    const res = await fetch("/.netlify/functions/getTwitchData", { cache: "no-store" });
    if (!res.ok) throw new Error(`getTwitchData failed: ${res.status}`);
    const data = await res.json();
    accessToken = data.access_token;
  } catch (e) {
    console.error(e);
  }
}

// Renvoie l'objet utilisateur (pas juste l'ID)
async function getUser(username) {
  const res = await fetch(
    `https://api.twitch.tv/helix/users?login=${encodeURIComponent(username)}`,
    {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
      },
    }
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
}

async function getRandomClip(userId) {
  const res = await fetch(
    `https://api.twitch.tv/helix/clips?broadcaster_id=${userId}&first=10`,
    {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  const valid = (data.data || []).filter((c) => c.thumbnail_url && c.id);
  if (!valid.length) return null;
  return valid[Math.floor(Math.random() * valid.length)];
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
    avatar.src = "";
    return;
  }

  avatar.src = profile.avatar || "";
  avatar.alt = `Avatar de ${profile.display_name}`;
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

  // MAJ carte profil
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

// ---------- Préparation optimisée ----------
async function prepareOne(member) {
  try {
    const user = await getUser(member);
    if (!user) return null;
    const clip = await getRandomClip(user.id);
    if (!clip) return null;
    return {
      id: clip.id,
      thumbnail: clip.thumbnail_url,
      profile: user, // on garde TOUT le profil pour la carte
    };
  } catch {
    return null;
  }
}

async function prepareClipsFast() {
  const tasks = members.map((m) => prepareOne(m));

  let firstShown = false;
  tasks.forEach(async (t) => {
    const res = await t;
    if (res) {
      clipsQueue.push(res);
      if (!firstShown) {
        firstShown = true;
        displayNextClip();
      }
    }
  });

  await Promise.allSettled(tasks);

  // Mélange léger pour varier l'ordre
  for (let i = clipsQueue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clipsQueue[i], clipsQueue[j]] = [clipsQueue[j], clipsQueue[i]];
  }

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
  await prepareClipsFast();
})();
const data = await res.json();
console.log("users response", data);
