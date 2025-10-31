// ==========================
// STAFF PAGE – Pôles TENF
// ==========================

const clientId = "rr75kdousbzbp8qfjy0xtppwpljuke";
let token = "";

// Caches globaux accessibles partout (modale comprise)
let AVATARS = {};          // login (lowercase) -> url d'avatar
let LIVESET = new Set();   // logins en live

// ========== Données structurées par PÔLES ==========
const POLES = [
  {
    id: "red",
    emoji: "🟥",
    title: "Accueil & Intégration",
    desc: "Accueil des nouveaux, réunions d’intégration, accompagnement et bonnes pratiques sur le serveur.",
    members: [
      {
        login: "red_shadow_31",
        name: "Red",
        level: "referent",
        // court texte sous la carte
        desc: "Coordination générale de l’accueil, cadre et rituels d’intégration.",
        // textes modale
        roleBio:
          "Fondateur de la New Family et garant du cadre bienveillant. Red veille à la cohésion de la communauté et accompagne les équipes. Référent direct des pôles Accueil & Intégration ainsi que Coordination & Formation interne.",
        personalBio:
          "Streamer multi-gaming, avec une grosse base Les Sims 4 (mode vie & constructions). Aussi des jeux de gestion et un rendez-vous communautaire hebdo (Fortnite) dans une ambiance chill, sans prise de tête.",
        // réseaux
        twitch: "https://twitch.tv/red_shadow_31",
        instagram: "",
        tiktok: ""
      },
      {
        login: "tabs_up",
        name: "Tab’s",
        level: "adjoint-ref",
        desc: "Adjoint référent — relais des intégrations et organisation pratique.",
        roleBio:
          "Adjoint référent : coordination des intégrations, suivi des tâches et organisation.",
        personalBio: "",
        twitch: "https://twitch.tv/tabs_up",
        instagram: "",
        tiktok: ""
      },
      {
        login: "saikossama",
        name: "Saiko",
        level: "mentor",
        desc: "Mentor (tickets) — accueil des tickets et pédagogie.",
        roleBio:
          "Mentor : accueil des demandes (tickets), accompagnement et pédagogie.",
        personalBio: "",
        twitch: "https://twitch.tv/saikossama",
        instagram: "",
        tiktok: ""
      },
      {
        login: "gilbert_hime",
        name: "Gilbert",
        level: "mentor",
        desc: "Mentor — présence et énergie sur le terrain.",
        roleBio: "Mentor terrain, soutien et énergie positive au quotidien.",
        personalBio: "",
        twitch: "https://twitch.tv/gilbert_hime",
        instagram: "",
        tiktok: ""
      },
      {
        login: "yaya_romali",
        name: "Yaya",
        level: "mentor",
        desc: "Mentor — dynamisme et bonne humeur.",
        roleBio: "Mentor : relais communication et énergie sur les lives.",
        personalBio: "",
        twitch: "https://twitch.tv/yaya_romali",
        instagram: "",
        tiktok: ""
      },
      {
        login: "rubbycrea",
        name: "Rubby",
        level: "mentor",
        desc: "Mentor — créativité et soutien à l’intégration.",
        roleBio:
          "Mentor : idées créatives, animations et soutien aux intégrations.",
        personalBio: "",
        twitch: "https://twitch.tv/rubbycrea",
        instagram: "",
        tiktok: ""
      },
      {
        login: "lespydyverse",
        name: "Spydy",
        level: "junior",
        desc: "Junior — apprentissage de la modération et des rituels d’accueil.",
        roleBio:
          "Junior : progression en modération et participation aux rituels d’accueil.",
        personalBio: "",
        twitch: "https://twitch.tv/lespydyverse",
        instagram: "",
        tiktok: ""
      }
    ]
  },

  {
    id: "green",
    emoji: "🩷",
    title: "Planification, Animation & Événements",
    desc: "Calendrier communautaire, animations et coordination inter-pôles.",
    members: [
     {
  login: "clarastonewall",
  name: "Clara",
  level: "referent",
  // Sous-titre sur la carte
  desc: "Référente — cheffe d’orchestre des plannings & événements.",
  // Bio rôle TENF (modale)
  roleBio:
    "Fondatrice émérite de la New Family, Clara pilote le planning de A à Z : rien ne se lance sans son feu vert. Elle conçoit les agendas, valide, coordonne et participe à chaque événement. Planificatrice hors pair, elle gère aussi la paperasse pour que tout roule, côté coulisses comme à l’écran.",
  // Bio de chaîne (modale)
  personalBio:
    "Joueuse invétérée des Sims 4 — attention, ça peut vite prendre feu… dans le jeu comme dans l’ambiance ! 🔥 Viens pour un moment fun & chill sur Les Sims 4 et d’autres jeux de simulation/gestion.",
  // Réseaux
  twitch: "https://twitch.tv/clarastonewall",
  instagram: "",
  tiktok: ""
},

      {
        login: "jenny31200",
        name: "Jenny",
        level: "adjoint-ref",
        desc: "Adjointe référente — suivi des projets et rigueur logistique.",
        roleBio:
          "Adjointe référente : suivi des projets et logistique soignée.",
        personalBio: "",
        twitch: "https://twitch.tv/jenny31200",
        instagram: "",
        tiktok: ""
      },
      {
        login: "thedark_sand",
        name: "Dark",
        level: "mentor",
        desc: "Mentor — expérience, rétro & cartes (Pokémon / Yu-Gi-Oh).",
        roleBio:
          "Mentor : expérience rétro & cartes (Pokémon / Yu-Gi-Oh).",
        personalBio: "",
        twitch: "https://twitch.tv/thedark_sand",
        instagram: "",
        tiktok: ""
      },
      {
        login: "zylkao",
        name: "Zylkao",
        level: "junior",
        desc: "Junior — mise en place opérationnelle et soutien sur les events.",
        roleBio:
          "Junior : mise en place opérationnelle et soutien des événements.",
        personalBio: "",
        twitch: "https://twitch.tv/zylkao",
        instagram: "",
        tiktok: ""
      },
      {
        login: "sigurdson64",
        name: "Sigur",
        level: "junior",
        desc: "Junior — relais du soutien des événements.",
        roleBio: "Junior : relais et logistique sur les événements.",
        personalBio: "",
        twitch: "https://twitch.tv/sigurdson64",
        instagram: "",
        tiktok: ""
      }
    ]
  },

  {
    id: "blue",
    emoji: "🟦",
    title: "Communication & Visuels",
    desc: "Identité visuelle, réseaux sociaux et supports graphiques des projets.",
    members: [
      {
        login: "nexou31",
        name: "Nexou",
        level: "referent",
        desc: "Référent — identité visuelle, réseaux, ligne graphique.",
        roleBio:
          "Référent com/visuels : identité visuelle, réseaux et ligne graphique.",
        personalBio: "",
        twitch: "https://twitch.tv/nexou31",
        instagram: "",
        tiktok: ""
      },
      {
        login: "selena_akemi",
        name: "Selena",
        level: "adjoint-ref",
        desc: "Adjointe référente — coordination créative et diffusion.",
        roleBio:
          "Adjointe référente : coordination créative et diffusion.",
        personalBio: "",
        twitch: "https://twitch.tv/selena_akemi",
        instagram: "",
        tiktok: ""
      },
      {
        login: "mmesigurdson64",
        name: "Mme Sigur",
        level: "support",
        desc: "Support visuel — aide sur les visuels & assets.",
        roleBio: "Support visuel : aide sur les visuels & assets.",
        personalBio: "",
        twitch: "https://twitch.tv/mmesigurdson64",
        instagram: "",
        tiktok: ""
      }
    ]
  },

  {
    id: "yellow",
    emoji: "🟨",
    title: "Coordination & Formation interne",
    desc: "Organisation des process et formation des modérateurs.",
    members: [
      {
        login: "red_shadow_31",
        name: "Red",
        level: "referent",
        desc: "Référent — process, standards et coordination des formations.",
        roleBio:
          "Référent : process, standards et coordination de la formation interne.",
        personalBio: "",
        twitch: "https://twitch.tv/red_shadow_31",
        instagram: "",
        tiktok: ""
      },
      {
        login: "nangel89",
        name: "Nangel",
        level: "adjoint-ref",
        desc: "Adjoint référent — suivi Boost Live Team & accompagnement.",
        roleBio:
          "Adjoint référent : suivi Boost Live Team & accompagnement.",
        personalBio: "",
        twitch: "https://twitch.tv/nangel89",
        instagram: "",
        tiktok: ""
      }
    ]
  },

  {
    id: "purple",
    emoji: "🟪",
    title: "Technique & Automatisation",
    desc: "Site, intégrations, automatisations, outils internes et support technique.",
    members: [
      {
        login: "nexou31",
        name: "Nexou",
        level: "tech",
        desc: "Lead dev — référent technique pour arbitrages et décisions.",
        roleBio:
          "Lead dev : intégrations, automatisations et qualité.",
        personalBio: "",
        twitch: "https://twitch.tv/nexou31",
        instagram: "",
        tiktok: ""
      },
      {
        login: "red_shadow_31",
        name: "Red",
        level: "tech",
        desc: "Lead dev — référent technique pour le site.",
        roleBio:
          "Lead dev : référent technique pour le site.",
        personalBio: "",
        twitch: "https://twitch.tv/red_shadow_31",
        instagram: "",
        tiktok: ""
      }
    ]
  }
];

// ========== Utils ==========
const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

function levelBadgeClass(level){
  switch(level){
    case "referent":    return "badge--referent";
    case "adjoint-ref": return "badge--adjoint-ref";
    case "mentor":      return "badge--mentor";
    case "junior":      return "badge--junior";
    case "support":     return "badge--support";
    case "tech":        return "badge--tech";
    default:            return "";
  }
}
function levelBadgeText(level){
  switch(level){
    case "referent":    return "Référent";
    case "adjoint-ref": return "Adjoint réf.";
    case "mentor":      return "Mentor";
    case "junior":      return "Junior";
    case "support":     return "Support";
    case "tech":        return "Tech";
    default:            return "Staff";
  }
}

// ========== Token & Fetch ==========
async function getToken(){
  try{
    const res = await fetch("/.netlify/functions/getTwitchData");
    if(res.ok){
      const data = await res.json();
      token = data.access_token || "";
    }
  }catch(e){
    console.warn("Token Twitch indisponible:", e);
  }
}
async function getUsersByLogin(logins){
  if(!token) return {};
  const out = {};
  for(let i=0;i<logins.length;i+=90){
    const chunk = logins.slice(i,i+90);
    const query = chunk.map(l=>`login=${encodeURIComponent(l)}`).join("&");
    const url = `https://api.twitch.tv/helix/users?${query}`;
    const res = await fetch(url, {
      headers:{ "Client-ID": clientId, Authorization:"Bearer "+token }
    });
    if(res.ok){
      const json = await res.json();
      (json.data||[]).forEach(u=>{
        out[(u.login||"").toLowerCase()] = u.profile_image_url;
      });
    }
  }
  return out;
}
async function getLiveStatus(logins){
  if(!token) return new Set();
  const set = new Set();
  for(let i=0;i<logins.length;i+=100){
    const chunk = logins.slice(i,i+100);
    const query = chunk.map(l=>`user_login=${encodeURIComponent(l)}`).join("&");
    const url = `https://api.twitch.tv/helix/streams?${query}`;
    const res = await fetch(url, {
      headers:{ "Client-ID": clientId, Authorization:"Bearer "+token }
    });
    if(res.ok){
      const json = await res.json();
      (json.data||[]).forEach(s=> set.add((s.user_login||"").toLowerCase()));
    }
  }
  return set;
}

// ========== Rendu ==========
function renderPole(container, pole, avatarMap, liveSet, q=""){
  const section = document.createElement("section");
  section.className = `staff-section reveal pole-${pole.id}`;

  const h2 = document.createElement("h2");
  h2.textContent = `${pole.emoji} ${pole.title}`;
  section.appendChild(h2);

  if(pole.desc){
    const p = document.createElement("p");
    p.className = "pole-desc";
    p.textContent = pole.desc;
    section.appendChild(p);
  }

  const grid = document.createElement("div");
  grid.className = "staff-grid";

  pole.members
    .filter(m => {
      const s = q.trim().toLowerCase();
      if(!s) return true;
      return (
        m.name.toLowerCase().includes(s) ||
        m.login.toLowerCase().includes(s) ||
        (m.desc||"").toLowerCase().includes(s) ||
        (m.roleBio||"").toLowerCase().includes(s) ||
        (m.personalBio||"").toLowerCase().includes(s)
      );
    })
    .forEach(m => {
      const loginLc = m.login.toLowerCase();
      const imgSrc = avatarMap[loginLc] || "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_600x600.png";
      const isLive = liveSet?.has(loginLc);

      const card = document.createElement("article");
      card.className = "staff-card";
      card.innerHTML = `
        <div class="avatar-box">
          ${isLive ? `<span class="live-dot">LIVE</span>` : ""}
          <img class="avatar" loading="lazy" decoding="async" src="${imgSrc}" alt="Avatar de ${escapeHtml(m.name)}">
          <span class="badge ${levelBadgeClass(m.level)}">${levelBadgeText(m.level)}</span>
        </div>
        <div class="body">
          <h3 class="name">${escapeHtml(m.name)}</h3>
          <p class="desc">${escapeHtml(m.desc || "")}</p>
          <div class="btns" style="margin-top:.4rem;display:flex;gap:.4rem;justify-content:center">
            <a class="about-button" href="https://twitch.tv/${loginLc}" target="_blank" rel="noopener">Twitch</a>
            <button class="about-button" data-more="${loginLc}" data-level="${m.level}">Plus</button>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });

  section.appendChild(grid);
  container.appendChild(section);
}

function showSkeletons(){
  const root = document.getElementById("staff-root");
  root.innerHTML = "";
  const sk = document.createElement("section");
  sk.className = "staff-section";
  const grid = document.createElement("div");
  grid.className = "staff-grid";
  for (let i=0;i<8;i++){
    const card = document.createElement("div");
    card.className = "skel";
    card.innerHTML = `<div class="ph big"></div><div class="ph" style="width:60%;margin:.4rem auto"></div><div class="ph" style="width:80%;margin:.3rem auto"></div>`;
    grid.appendChild(card);
  }
  sk.appendChild(grid);
  root.appendChild(sk);
}
function setupReveal(){
  const els = document.querySelectorAll('.reveal');
  if(!els.length) return;
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  },{threshold:.15});
  els.forEach(el=>io.observe(el));
}

// ========== INIT ==========
async function initStaff(){
  showSkeletons();
  await getToken();

  const root = document.getElementById("staff-root");
  const allLogins = POLES.flatMap(p => p.members.map(m => m.login.toLowerCase()));

  // Récup avatars + live, puis expose en global
  const [avatars, liveSet] = await Promise.all([
    getUsersByLogin(allLogins),
    getLiveStatus(allLogins)
  ]);
  AVATARS = avatars;
  LIVESET = liveSet;

  let activePole = "all";
  let query = "";

  function renderAll(){
    root.innerHTML = "";
    const groups = activePole === "all" ? POLES : POLES.filter(p => p.id === activePole);
    groups.forEach(pole => renderPole(root, pole, avatars, liveSet, query));
    setupReveal();
  }
  renderAll();

  // Tabs
  document.querySelectorAll(".tab").forEach(t=>{
    t.addEventListener("click", ()=>{
      document.querySelectorAll(".tab").forEach(x=>x.classList.remove("is-active"));
      t.classList.add("is-active");
      activePole = t.dataset.pole || "all";
      renderAll();
    });
  });

  // Recherche
  const input = document.getElementById("staff-search");
  if(input){
    input.addEventListener("input", ()=>{
      query = input.value.trim();
      renderAll();
    });
  }
}

document.addEventListener("DOMContentLoaded", initStaff);

// ========== MODALE (unique listener global) ==========
const modal = document.getElementById("staff-modal");
if (modal) {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-more]");
    if (!btn) return;

    const login = (btn.getAttribute("data-more") || "").toLowerCase();
    const level = btn.getAttribute("data-level");
    const member = POLES.flatMap(p=>p.members).find(m=>m.login.toLowerCase()===login);
    if(!member) return;

    // Avatar depuis le cache global
    const avatarSrc =
      AVATARS[login] ||
      "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_600x600.png";

    // Bios
    const roleBio     = (member.roleBio || member.desc || "").trim();
    const personalBio = (member.personalBio || member.bio || "").trim();

    // Réseaux
    const tw = (member.twitch    || `https://twitch.tv/${login}`).trim();
    const ig = (member.instagram || "").trim();
    const tk = (member.tiktok    || "").trim();

    // Remplissage UI
    const $ = (id)=>document.getElementById(id);
    $("m-avatar").src = avatarSrc;
    $("m-avatar").alt = `Avatar de ${member.name}`;
    $("m-name").textContent = member.name;
    $("m-role").textContent = levelBadgeText(level);

    // Rôle TENF
    if (roleBio) {
      $("m-desc-role").textContent = roleBio;
      $("m-desc-role-wrap").hidden = false;
    } else {
      $("m-desc-role").textContent = "";
      $("m-desc-role-wrap").hidden = true;
    }

    // Bio de chaîne
    if (personalBio) {
      $("m-desc-personal").textContent = personalBio;
      $("m-desc-personal-wrap").hidden = false;
    } else {
      $("m-desc-personal").textContent = "";
      $("m-desc-personal-wrap").hidden = true;
    }

    // Icônes sociaux (affichage conditionnel)
    const links = [];
    if (tw) links.push(`<a href="${tw}" target="_blank" rel="noopener" aria-label="Twitch"><img src="assets/twitch.png" alt=""></a>`);
    if (ig) links.push(`<a href="${ig}" target="_blank" rel="noopener" aria-label="Instagram"><img src="assets/instagram.png" alt=""></a>`);
    if (tk) links.push(`<a href="${tk}" target="_blank" rel="noopener" aria-label="TikTok"><img src="assets/tiktok.png" alt=""></a>`);
    $("m-links").innerHTML = links.join("");

    modal.setAttribute("aria-hidden", "false");
  });

  document.getElementById("staff-close")?.addEventListener("click", () => modal.setAttribute("aria-hidden","true"));
  modal.addEventListener("click", (e) => { if (e.target.id === "staff-modal") modal.setAttribute("aria-hidden","true"); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") modal.setAttribute("aria-hidden","true"); });
}
