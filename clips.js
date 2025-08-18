console.log("✅ clip.js chargé");

const clientId = "rr75kdousbzbp8qfjy0xtppwpljuke";
let accessToken = "";
let clipsQueue = []; // Tous les clips préchargés
let currentIndex = -1; // Position actuelle dans le tableau

const PARENT_DOMAIN = "newfamily.netlify.app";

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

// === Récupération token depuis Netlify Function ===
async function getToken() {
  const res = await fetch("/.netlify/functions/getTwitchData");
  if (!res.ok) {
    console.error(`getTwitchData failed: ${res.status}`);
    return;
  }
  const data = await res.json();
  accessToken = data.access_token;
}

// === Récupération de l'ID utilisateur Twitch ===
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

// === Récupération d'un clip aléatoire ===
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
  const validClips = (data.data || []).filter(
    (clip) => clip.thumbnail_url && clip.id
  );
  if (validClips.length === 0) return null;
  return validClips[Math.floor(Math.random() * validClips.length)];
}

// === Préparation des clips ===
async function prepareClips() {
  for (const member of members) {
    const userId = await getUserId(member);
    if (!userId) continue;
    const clip = await getRandomClip(userId);
    if (clip) {
      clipsQueue.push({
        id: clip.id,
        user: member,
      });
    }
  }
}

// === Affiche une miniature ou iframe ===
function displayClip(index) {
  const clip = clipsQueue[index];
  if (!clip) return;

  const clipPlayer = document.getElementById("clip-player");
  if (!clipPlayer) return;

  clipPlayer.innerHTML = `
    <img src="https://clips-media-assets2.twitch.tv/${clip.id}-preview-480x272.jpg" 
         alt="Preview du clip"
         loading="lazy"
         onclick="loadTwitchClip(this, '${clip.id}')"
         style="width: 100%; border-radius: 10px; cursor: pointer;">
    <div class="play-button">▶</div>
  `;

  document.getElementById("clip-user").textContent = `👤 ${clip.user}`;
  currentIndex = index;
}

// === Charge l'iframe Twitch dynamiquement ===
function loadTwitchClip(element, clipId) {
  const container = element.parentElement;
  if (!container) return;

  container.innerHTML = `
    <iframe
      src="https://clips.twitch.tv/embed?clip=${clipId}&parent=${PARENT_DOMAIN}"
      width="100%"
      height="405"
      frameborder="0"
      allowfullscreen
      loading="lazy">
    </iframe>
  `;
}

// === Affichage du prochain clip ===
function displayNextClip() {
  if (currentIndex + 1 < clipsQueue.length) {
    displayClip(currentIndex + 1);
  } else {
    document.getElementById("clip-user").textContent =
      "Aucun autre clip disponible.";
  }
}

// === Affichage du clip précédent ===
function displayPreviousClip() {
  if (currentIndex > 0) {
    displayClip(currentIndex - 1);
  } else {
    document.getElementById("clip-user").textContent = "Pas de clip précédent.";
  }
}

// === Événements DOM ===
document.addEventListener("DOMContentLoaded", () => {
  const nextBtn = document.getElementById("next-button");
  if (nextBtn) nextBtn.addEventListener("click", displayNextClip);

  const prevBtn = document.getElementById("prev-button");
  if (prevBtn) prevBtn.addEventListener("click", displayPreviousClip);
});

// === Initialisation ===
(async () => {
  await getToken();
  if (!accessToken) {
    document.getElementById("clip-user").textContent =
      "Erreur d’authentification Twitch.";
    return;
  }
  await prepareClips();
  if (clipsQueue.length > 0) {
    displayClip(0);
  } else {
    document.getElementById("clip-user").textContent = "Aucun clip disponible.";
  }
})();
