const clientId = "rr75kdousbzbp8qfjy0xtppwpljuke";
const accessToken = "4dac4j69keeckddjaqp5617uenbav6";

// 👇 Liste des usernames Twitch des membres
const members = ["tsukilamoon", "sebdaries", "leprofesseurx", "moon_alonzo"];

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

async function displayClips() {
    const container = document.getElementById("clips-container");
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
