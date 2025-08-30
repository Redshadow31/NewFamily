console.log("⚡ clip.js optimisé chargé");

// ---------- Config ----------
const clientId = "rr75kdousbzbp8qfjy0xtppwpljuke";
let accessToken = "";
let clipsQueue = [];
let currentIndex = -1;

// parent dynamique (ok en prod + previews Netlify)
const PARENT_DOMAIN = window.location.hostname;

// Mets ici uniquement des pseudos valides
const members = [
  "Nexou31",
  "Clarastonewall",
  "Red_shadow_31",
  "Selena_Akemi",
  "Thony1384",
  "Jenny31200",
  "Vektor_live",
  "Livio_on",
  "Dylow95",
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

async function getUserId(username) {
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
  return data.data?.[0]?.id || null;
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
      style="width:100%;border-radius:10px;cursor:pointer;"
      onclick="loadTwitchClip(this,'${clip.id}')"
    >
    <div class="play-button">▶</div>
  `;
  u.textContent = `👤 ${clip.user}`;

  // Préfetch léger de l'embed du prochain clip
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
    const userId = await getUserId(member);
    if (!userId) return null;
    const clip = await getRandomClip(userId);
    if (!clip) return null;
    return { id: clip.id, user: member, thumbnail: clip.thumbnail_url };
  } catch {
    return null;
  }
}

async function prepareClipsFast() {
  const tasks = members.map((m) => prepareOne(m));

  // Afficher dès qu'on a le 1er clip
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

  // Attendre la fin de tous pour compléter la file
  await Promise.allSettled(tasks);

  // Mélange léger pour varier l'ordre
  for (let i = clipsQueue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clipsQueue[i], clipsQueue[j]] = [clipsQueue[j], clipsQueue[i]];
  }

  if (!firstShown) {
    const u = document.getElementById("clip-user");
    if (u) u.textContent = "Aucun clip disponible pour le moment.";
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
    return;
  }
  await prepareClipsFast();
})();
