/* =========================================================
   Staff – rendu en vignettes + avatars Twitch automatiques
   Utilise la même auth Netlify/Twitch que ton site.
========================================================= */

const clientId = "rr75kdousbzbp8qfjy0xtppwpljuke";
let token = "";

// ⚠️ Mets bien les logins EXACTS Twitch (en minuscules)
const STAFF = [
  // 👑 Fondateurs
  { role: "founder", emoji: "👑", title: "Admin Fondateurs",
    members: [
      { login: "clarastonewall",          name: "Clara",
        desc: "Gardienne des plannings, streameuse Sims & simulation. L’organisation au service de la convivialité." },
      { login: "nexou31",        name: "Nexou31",
        desc: "Streamer Nintendo, formateur et gestionnaire des réseaux. Toujours à l’écoute des membres." },
      { login: "red_shadow_31",  name: "Red_Shadow_31",
        desc: "Sims & gestion. L’ombre du serveur : code du site, coordination des modos et coulisses techniques." },
    ]
  },

  // ⚙️ Adjoints
  { role: "adjoint", emoji: "⚙️", title: "Admins Adjoints",
    members: [
      { login: "selena_akemi", name: "Selena_akemi",
        desc: "Spécialiste gacha. Soutien créatif : visuels & réseaux aux côtés de Nexou." },
      { login: "nangel89", name: "Nangel89",
        desc: "Couteau-suisse du staff. Présent partout pour fluidifier et aider." },
      { login: "tabs_up", name: "Tabs_up",
        desc: "Multigaming (LoL, No Man’s Sky…). Porte-parole des réunions d’intégration." },
      { login: "jenny31200", name: "Jenny31200",
        desc: "Call of Duty & Fortnite. Secrétaire en chef : rigueur et suivi des projets." },
    ]
  },

  // 🎓 Mentors
  { role: "mentor", emoji: "🎓", title: "Modérateurs Mentors",
    members: [
      { login: "mahyurah", name: "mahyurah",
        desc: "Jeux indés & farming (Palia…). Patience et bienveillance dans la modération." },
      { login: "livio_on", name: "Livio_on",
        desc: "Jeux d’horreur. Vigilance, sécurité et cohésion." },
      { login: "rubbycrea", name: "Rubbycrea",
        desc: "Horreur & belles créations. Créativité et dynamisme." },
      { login: "leviacarpe", name: "Leviacarpe",
        desc: "Disney Dreamlight Valley. Magie, partage et douceur." },
      { login: "yaya_romali", name: "Yaya_romali",
        desc: "Fortnite & Batman. Bonne humeur et énergie." },
      { login: "thedark_sand", name: "Thedark_sand",
        desc: "Pokémon, Yu-Gi-Oh, rétro. Expérience et écoute." },
      { login: "gilbert_hime", name: "gilbert_hime",
        desc: "DBD, Fortnite, gacha. Énergie et présence sur le terrain." },
      { login: "saikosama", name: "Saikosama",
        desc: "DBD, Fortnite, ARK. Esprit d’équipe et vigilance." },
    ]
  },

  // 🌱 Juniors
  { role: "junior", emoji: "🌱", title: "Modérateurs Juniors",
    members: [
      { login: "lespydyverse", name: "lespydyverse",
        desc: "Jeux gacha. Enthousiasme et curiosité." },
      { login: "mcaliena", name: "Mcaliena",
        desc: "ARK & Medieval Dynasty. Sérieuse et impliquée." },
      { login: "mcfly_59140", name: "McFly_59140",
        desc: "Farming Simulator 25 & GTA RP. Convivialité et énergie." },
    ]
  },
];

/* ---------- Auth ---------- */
async function getToken() {
  const res = await fetch("/.netlify/functions/getTwitchData");
  const data = await res.json();
  token = data?.access_token || "";
}

/* ---------- Fetch avatars pour une liste de logins ---------- */
async function getUsersByLogin(logins) {
  const chunks = [];
  for (let i = 0; i < logins.length; i += 100) chunks.push(logins.slice(i, i+100));
  const results = [];

  for (const c of chunks) {
    const query = c.map(l => `login=${encodeURIComponent(l)}`).join("&");
    const url = `https://api.twitch.tv/helix/users?${query}`;
    const res = await fetch(url, {
      headers: { "Client-ID": clientId, Authorization: "Bearer " + token }
    });
    if (res.ok) {
      const json = await res.json();
      results.push(...json.data);
    }
  }
  // map login -> profile_image_url
  const map = {};
  results.forEach(u => { map[u.login.toLowerCase()] = u.profile_image_url; });
  return map;
}

/* ---------- Rendering ---------- */
function renderSection(container, { role, emoji, title, members }, avatarMap) {
  const section = document.createElement("section");
  section.className = "staff-section";

  const h2 = document.createElement("h2");
  h2.textContent = `${emoji} ${title}`;
  section.appendChild(h2);

  const grid = document.createElement("div");
  grid.className = "staff-grid";

  members.forEach(m => {
    const imgSrc = avatarMap[m.login.toLowerCase()] ||
      "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_600x600.png";

    const card = document.createElement("article");
    card.className = "staff-card";

    card.innerHTML = `
      <div class="avatar-box">
        <img class="avatar" loading="lazy" decoding="async"
             src="${imgSrc}" alt="Avatar de ${escapeHtml(m.name)}">
        <span class="badge ${badgeClass(role)}">${badgeText(role)}</span>
      </div>
      <div class="body">
        <h3 class="name">${escapeHtml(m.name)}</h3>
        <p class="desc">${escapeHtml(m.desc)}</p>
      </div>
    `;

    grid.appendChild(card);
  });

  section.appendChild(grid);
  container.appendChild(section);
}

function badgeClass(role){
  return role === "founder" ? "badge--founder"
       : role === "adjoint" ? "badge--adjoint"
       : role === "mentor"  ? "badge--mentor"
       : "badge--junior";
}
function badgeText(role){
  return role === "founder" ? "👑 Fondateur"
       : role === "adjoint" ? "⚙️ Adjoint"
       : role === "mentor"  ? "🎓 Mentor"
       : "🌱 Junior";
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* ---------- Init ---------- */
async function initStaff(){
  await getToken();
  if (!token) { console.error("❌ Token manquant"); return; }

  // toutes les logins à récupérer
  const allLogins = STAFF.flatMap(g => g.members.map(m => m.login.toLowerCase()));
  const avatarMap = await getUsersByLogin(allLogins);

  const root = document.getElementById("staff-root");
  STAFF.forEach(group => renderSection(root, group, avatarMap));
}

initStaff();
