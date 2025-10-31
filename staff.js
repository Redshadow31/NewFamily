/* ======================================================
   🌈 New Family – Staff JS modernisé 2025 (Glass Fade)
   ====================================================== */

const clientId = "rr75kdousbzbp8qfjy0xtppwpljuke";
let token = "";

/* ========= Données par pôles ========= */
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
        desc: "Coordination générale de l’accueil, cadre et rituels d’intégration.",
        bio: "Référent accueil : anime les réunions d’intégration, pose le cadre et veille à la bonne cohésion des nouveaux.",
        twitch: "https://twitch.tv/red_shadow_31",
        instagram: "",
        tiktok: ""
      },
      {
        login: "tabs_up",
        name: "Tab’s",
        level: "adjoint-ref",
        desc: "Adjoint référent — relais des intégrations et organisation pratique.",
        bio: "Bras droit du pôle : fluidifie l’organisation et assure la continuité quand les fondateurs ne sont pas dispo.",
        twitch: "https://twitch.tv/tabs_up",
        instagram: "",
        tiktok: ""
      },
      {
        login: "saikossama",
        name: "Saiko",
        level: "mentor",
        desc: "Mentor (tickets) — accueil des tickets et pédagogie.",
        bio: "Point d’entrée sur les tickets : calme, pédagogue, accompagne les membres dans les cas sensibles.",
        twitch: "https://twitch.tv/saikossama",
        instagram: "",
        tiktok: ""
      },
      {
        login: "gilbert_hime",
        name: "Gilbert",
        level: "mentor",
        desc: "Mentor — présence et énergie sur le terrain.",
        bio: "Mentore présente sur le terrain : bienveillance, sécurité et énergie communicative.",
        twitch: "https://twitch.tv/gilbert_hime",
        instagram: "",
        tiktok: ""
      },
      {
        login: "yaya_romali",
        name: "Yaya",
        level: "mentor",
        desc: "Mentor — dynamisme et bonne humeur.",
        bio: "Relais accueil & ambiance : dynamise les premiers pas et rassure les nouveaux.",
        twitch: "https://twitch.tv/yaya_romali",
        instagram: "",
        tiktok: ""
      },
      {
        login: "rubbycrea",
        name: "Rubby",
        level: "mentor",
        desc: "Mentor — créativité et soutien à l’intégration.",
        bio: "Apporte une touche créative et des idées concrètes pour rendre l’intégration agréable et claire.",
        twitch: "https://twitch.tv/rubbycrea",
        instagram: "",
        tiktok: ""
      },
      {
        login: "lespydyverse",
        name: "Spydy",
        level: "junior",
        desc: "Junior — apprentissage de la modération et des rituels d’accueil.",
        bio: "En formation : met en pratique les rituels d’accueil et gagne en autonomie à chaque session.",
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
    desc: "Calendrier des événements communautaires, animations, soirées spéciales et coordination inter-pôles.",
    members: [
      {
        login: "clarastonewall",
        name: "Clara",
        level: "referent",
        desc: "Référente — planification, organisation et animation des événements.",
        bio: "Chef d’orchestre des events : structure, anime et veille à l’inclusion de tous les membres.",
        twitch: "https://twitch.tv/clarastonewall",
        instagram: "",
        tiktok: ""
      },
      {
        login: "jenny31200",
        name: "Jenny",
        level: "adjoint-ref",
        desc: "Adjointe référente — suivi des projets et rigueur logistique.",
        bio: "Main sûre du pôle : rigueur logistique, suivi des plannings et coordination fine des équipes.",
        twitch: "https://twitch.tv/jenny31200",
        instagram: "",
        tiktok: ""
      },
      {
        login: "rubbycrea",
        name: "Rubby",
        level: "mentor",
        desc: "Mentor — soutien animation & idées créatives.",
        bio: "Apporte idées et formats originaux, booste l’engagement lors des soirées spéciales.",
        twitch: "https://twitch.tv/rubbycrea",
        instagram: "",
        tiktok: ""
      },
      {
        login: "thedark_sand",
        name: "Dark",
        level: "mentor",
        desc: "Mentor — expérience, rétro & cartes (Pokémon / Yu-Gi-Oh).",
        bio: "Référent rétro & cartes : expertise jeux de cartes, culture événementielle et vibes old school.",
        twitch: "https://twitch.tv/thedark_sand",
        instagram: "",
        tiktok: ""
      },
      {
        login: "zylkao",
        name: "Zylkao",
        level: "junior",
        desc: "Junior — mise en place opérationnelle et soutien sur les events.",
        bio: "Aide opérationnelle : préparation technique, relais chat et mise en place des activités.",
        twitch: "https://twitch.tv/zylkao",
        instagram: "",
        tiktok: ""
      },
      {
        login: "sigurdson64",
        name: "Sigur",
        level: "junior",
        desc: "Junior — relais du soutien des événements.",
        bio: "Support terrain : aide à la logistique live et au bon déroulé des animations.",
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
    desc: "Identité visuelle, réseaux sociaux, supports graphiques des projets et valorisation des membres.",
    members: [
      {
        login: "nexou31",
        name: "Nexou",
        level: "referent",
        desc: "Référent — identité visuelle, réseaux, ligne graphique.",
        bio: "Pilote de l’identité visuelle : cohérence, templates et habillages pour une image forte.",
        twitch: "https://twitch.tv/nexou31",
        instagram: "",
        tiktok: ""
      },
      {
        login: "selena_akemi",
        name: "Selena",
        level: "adjoint-ref",
        desc: "Adjointe référente — coordination créative et diffusion.",
        bio: "Coordonne la prod’ visuelle, harmonise les posts et assure une diffusion régulière.",
        twitch: "https://twitch.tv/selena_akemi",
        instagram: "",
        tiktok: ""
      },
      {
        login: "yaya_romali",
        name: "Yaya",
        level: "mentor",
        desc: "Mentor — relais communication et énergie sur les lives.",
        bio: "Relais social : booste la visibilité des créateurs et anime la présence sur les réseaux.",
        twitch: "https://twitch.tv/yaya_romali",
        instagram: "",
        tiktok: ""
      },
      {
        login: "mmesigurdson64",
        name: "Mme Sigur",
        level: "support",
        desc: "Support visuel — aide sur les visuels & assets.",
        bio: "Soutien graphique : retouches simples, exports, petites aides visuelles au quotidien.",
        twitch: "",
        instagram: "",
        tiktok: ""
      }
    ]
  },

  {
    id: "yellow",
    emoji: "🟨",
    title: "Coordination & Formation interne",
    desc: "Organisation des process, passation d’informations, formation des modérateurs et transmission des savoir-faire.",
    members: [
      {
        login: "red_shadow_31",
        name: "Red",
        level: "referent",
        desc: "Référent — process, standards et coordination des formations.",
        bio: "Structure les process, définit les standards et anime les ateliers de formation.",
        twitch: "https://twitch.tv/red_shadow_31",
        instagram: "",
        tiktok: ""
      },
      {
        login: "nangel89",
        name: "Nangel",
        level: "adjoint-ref",
        desc: "Adjoint référent — suivi des Boost Live Team & accompagnement.",
        bio: "Suivi de la Boost Live Team : mentoring de groupe, feedbacks et coaching pratique.",
        twitch: "https://twitch.tv/nangel89",
        instagram: "",
        tiktok: ""
      },
      {
        login: "yaya_romali",
        name: "Yaya",
        level: "mentor",
        desc: "Mentor — entraide, posture et bonnes pratiques live.",
        bio: "Transmet les bonnes pratiques live : posture, accueil et gestion des situations.",
        twitch: "https://twitch.tv/yaya_romali",
        instagram: "",
        tiktok: ""
      },
      {
        login: "sigurdson64",
        name: "Sigur",
        level: "junior",
        desc: "Junior — progression continue et participation aux ateliers.",
        bio: "En montée en compétences : applique les process et participe aux ateliers.",
        twitch: "https://twitch.tv/sigurdson64",
        instagram: "",
        tiktok: ""
      }
    ]
  },

  {
    id: "purple",
    emoji: "🟪",
    title: "Technique & Automatisation",
    desc: "Site, intégrations, automatisations, outils internes et support technique aux membres.",
    members: [
      {
        login: "nexou31",
        name: "Nexou",
        level: "referent",
        desc: "Référent technique — intégrations, automatisations et qualité.",
        bio: "Lead technique : intègre les outils, automatise et veille à la qualité globale.",
        twitch: "https://twitch.tv/nexou31",
        instagram: "",
        tiktok: ""
      },
      {
        login: "nangel89",
        name: "Nangel",
        level: "adjoint-ref",
        desc: "Adjoint en soutien — aide technique et exploitation outils.",
        bio: "Support technique : tests, mises à jour, aide à l’exploitation des outils.",
        twitch: "https://twitch.tv/nangel89",
        instagram: "",
        tiktok: ""
      },
      {
        login: "nexou31",
        name: "Nexou",
        level: "tech",
        desc: "Lead dev — référent technique pour arbitrages et décisions.",
        bio: "Garant technique : tranchage des choix techniques, CI/CD et qualité du code.",
        twitch: "https://twitch.tv/nexou31",
        instagram: "",
        tiktok: ""
      },
      {
        login: "red_shadow_31",
        name: "Red",
        level: "tech",
        desc: "Lead dev — référent technique pour ce site.",
        bio: "Dev Web : front, intégration et suivi des fonctionnalités du site TENF.",
        twitch: "https://twitch.tv/red_shadow_31",
        instagram: "",
        tiktok: ""
      }
    ]
  }
];


/* ========= Outils internes ========= */
const escapeHtml = s => String(s)
  .replace(/&/g,"&amp;")
  .replace(/</g,"&lt;")
  .replace(/>/g,"&gt;")
  .replace(/"/g,"&quot;")
  .replace(/'/g,"&#039;");

function levelBadgeText(level){
  const map = {
    "referent":"Référent",
    "adjoint-ref":"Adjoint réf.",
    "mentor":"Mentor",
    "junior":"Junior",
    "support":"Support",
    "tech":"Tech"
  };
  return map[level] || "Staff";
}

/* ========= Rendu Staff ========= */
async function getToken(){
  try {
    const res = await fetch("/.netlify/functions/getTwitchData");
    if(res.ok){ const data = await res.json(); token = data.access_token || ""; }
  } catch(e){ console.warn("Token Twitch non récupéré", e); }
}

async function getUsersByLogin(logins){
  if(!token) return {};
  const map = {};
  const res = await fetch(`https://api.twitch.tv/helix/users?${logins.map(l=>`login=${l}`).join("&")}`,
    { headers:{ "Client-ID": clientId, Authorization:"Bearer "+token } });
  if(res.ok){
    const json = await res.json();
    (json.data||[]).forEach(u=>{
      map[u.login.toLowerCase()] = u.profile_image_url;
    });
  }
  return map;
}

function renderPole(container, pole, avatars){
  const section = document.createElement("section");
  section.className = "staff-section";
  section.innerHTML = `
    <h2>${pole.emoji} ${pole.title}</h2>
    <p>${pole.desc}</p>
    <div class="staff-grid"></div>`;
  const grid = section.querySelector(".staff-grid");

  pole.members.forEach(m=>{
    const login = m.login.toLowerCase();
    const imgSrc = avatars?.[login] || "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_600x600.png";

    const card = document.createElement("article");
    card.className = "staff-card";
    card.innerHTML = `
      <div class="avatar-box">
        <img class="avatar" src="${imgSrc}" alt="${escapeHtml(m.name)}">
        <span class="badge badge--${m.level}">${levelBadgeText(m.level)}</span>
      </div>
      <div class="body">
        <h3 class="name">${escapeHtml(m.name)}</h3>
        <p class="desc">${escapeHtml(m.desc)}</p>
        <div class="btns">
          <a href="${m.twitch}" target="_blank" rel="noopener" class="about-button">Twitch</a>
          <button class="about-button" data-more="${login}">Plus</button>
        </div>
      </div>`;
    grid.appendChild(card);
  });

  container.appendChild(section);
}

/* ========= Modale ========= */
function openModal(member, avatar){
  const modal = document.getElementById("staff-modal");
  const dialog = modal.querySelector(".dialog");
  dialog.innerHTML = `
    <button class="close" id="staff-close">✖</button>
    <header>
      <img src="${avatar}" alt="${escapeHtml(member.name)}">
      <h3>${escapeHtml(member.name)}</h3>
      <small>${levelBadgeText(member.level)}</small>
    </header>
    <div>
      <p>${escapeHtml(member.bio || member.desc || "")}</p>
      <div class="links">
        ${member.twitch ? `<a href="${member.twitch}" target="_blank"><img src="assets/twitch.png" alt="Twitch"></a>` : ""}
        ${member.instagram ? `<a href="${member.instagram}" target="_blank"><img src="assets/instagram.webp" alt="Instagram"></a>` : ""}
        ${member.tiktok ? `<a href="${member.tiktok}" target="_blank"><img src="assets/tiktok.webp" alt="TikTok"></a>` : ""}
      </div>
    </div>`;

  modal.setAttribute("aria-hidden","false");
  document.getElementById("staff-close").onclick = ()=>modal.setAttribute("aria-hidden","true");
  modal.onclick = e => { if(e.target.id === "staff-modal") modal.setAttribute("aria-hidden","true"); };
}

/* ========= Initialisation ========= */
async function initStaff(){
  const root = document.getElementById("staff-root");
  await getToken();
  const allLogins = POLES.flatMap(p=>p.members.map(m=>m.login.toLowerCase()));
  const avatars = await getUsersByLogin(allLogins);
  POLES.forEach(pole => renderPole(root, pole, avatars));

  document.addEventListener("click", e=>{
    const btn = e.target.closest("[data-more]");
    if(!btn) return;
    const login = btn.getAttribute("data-more");
    const member = POLES.flatMap(p=>p.members).find(m=>m.login.toLowerCase()===login);
    if(!member) return;
    const avatar = avatars?.[login] || "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_600x600.png";
    openModal(member, avatar);
  });
}
document.addEventListener("DOMContentLoaded", initStaff);
