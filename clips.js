// Garder leur Client ID
const clientId = "rr75kdousbzbp8qfjy0xtppwpljuke";
let accessToken = "";

// On stocke tous les clips et un index pour navigation avant/arrière
let clipsQueue = [];
let currentIndex = -1;

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

// Récupération du token depuis leur Netlify function
async function getToken() {
  const res = await fetch("/.netlify/functions/getTwitchData");
  const data = await res.json();
  accessToken = data.access_token;
}

async function getUserId(username) {
  const res = await fetch(
    `https://api.twitch.tv/helix/users?login=${username}`,
    {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
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
  const data = await res.json();

  const validClips = (data.data || []).filter(
    (clip) => clip.thumbnail_url && clip.id
  );
  if (validClips.length === 0) return null;

  return validClips[Math.floor(Math.random() * validClips.length)];
}

async function prepareClips() {
  for (const member of members) {
    const userId = await getUserId(member);
    if (!userId) continue;
    const clip = await getRandomClip(userId);
    if (clip) {
      clipsQueue.push({ id: clip.id, user: member });
    }
  }
}

// Affiche le clip à l'index donné
function displayClip(index) {
  if (index < 0 || index >= clipsQueue.length) return;

  const { id, user } = clipsQueue[index];
  const iframeSrc = `https://clips.twitch.tv/embed?clip=${id}&parent=newfamily.netlify.app`;

  document.getElementById("clip-player").src = iframeSrc;
  document.getElementById("clip-user").textContent = `👤 ${user}`;
  currentIndex = index;
}

// Bouton suivant
function displayNextClip() {
  if (currentIndex + 1 < clipsQueue.length) {
    displayClip(currentIndex + 1);
  } else {
    document.getElementById("clip-user").textContent =
      "Aucun autre clip disponible.";
  }
}

// Bouton précédent
function displayPreviousClip() {
  if (currentIndex - 1 >= 0) {
    displayClip(currentIndex - 1);
  } else {
    document.getElementById("clip-user").textContent = "Pas de clip précédent.";
  }
}

// Attacher les événements une fois le DOM prêt
document.addEventListener("DOMContentLoaded", () => {
  const nextBtn = document.getElementById("next-button");
  const prevBtn = document.getElementById("prev-button");

  if (nextBtn) nextBtn.addEventListener("click", displayNextClip);
  if (prevBtn) prevBtn.addEventListener("click", displayPreviousClip);
});

// Initialisation
(async () => {
  await getToken();
  await prepareClips();
  if (clipsQueue.length > 0) {
    displayClip(0);
  } else {
    document.getElementById("clip-user").textContent = "Aucun clip disponible.";
  }
})();
