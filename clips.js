const clientId = "rr75kdousbzbp8qfjy0xtppwpljuke";

// ⚠️ Pas de token ici, il sera récupéré dynamiquement
let accessToken = "";
let clipsQueue = [];

const members = ["Nexou31", "Clarastonewall", "Red_shadow_31", "Selena_Akemi", "Thony1384", "Jenny31200", "Vektor_live", "Livio_on", "Dylow95"]; // À personnaliser

async function getToken() {
    const res = await fetch('/.netlify/functions/getTwitchData');
    const data = await res.json();
    accessToken = data.access_token;
}

async function getUserId(username) {
    const res = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
        headers: {
            "Client-ID": clientId,
            "Authorization": `Bearer ${accessToken}`
        }
    });
    const data = await res.json();
    return data.data[0]?.id;
}

async function getRandomClip(userId) {
    const res = await fetch(`https://api.twitch.tv/helix/clips?broadcaster_id=${userId}&first=10`, {
        headers: {
            "Client-ID": clientId,
            "Authorization": `Bearer ${accessToken}`
        }
    });
    const data = await res.json();
    const clips = data.data;
    if (clips.length === 0) return null;
    return clips[Math.floor(Math.random() * clips.length)];
}

async function prepareClips() {
    for (const member of members) {
        const userId = await getUserId(member);
        if (!userId) continue;
        const clip = await getRandomClip(userId);
        if (clip) {
            clipsQueue.push({
                id: clip.id,
                user: member
            });
        }
    }
}

function displayNextClip() {
    if (clipsQueue.length === 0) {
        document.getElementById("clip-player").src = "";
        document.getElementById("clip-user").textContent = "Plus aucun clip à afficher 😢";
        return;
    }

    const { id, user } = clipsQueue.shift();
    const iframeSrc = `https://clips.twitch.tv/embed?clip=${id}&parent=newfamily.netlify.app`;

    document.getElementById("clip-player").src = iframeSrc;
    document.getElementById("clip-user").textContent = `👤 ${user}`;
}

document.getElementById("next-button").addEventListener("click", displayNextClip);

(async () => {
    await getToken();
    await prepareClips();
    displayNextClip();
})();


async function displayClips() {
    const container = document.getElementById("clips-container");

    await getToken(); // ← Récupère un token valable avant toute requête

    for (const member of members) {
        const userId = await getUserId(member);
        if (!userId) continue;

        const clip = await getRandomClip(userId);
        if (clip) {
            const clipEl = document.createElement("div");
            clipEl.className = "user-card";
            clipEl.innerHTML = `
                <iframe
                    src="https://clips.twitch.tv/embed?clip=${clip.id}&parent=newfamily.netlify.app"
                    width="320" height="180"
                    frameborder="0"
                    allowfullscreen>
                </iframe>
                <div class="username">${member}</div>
            `;
            container.appendChild(clipEl);
        }
    }
}

displayClips();
