// ==========================
// STAFF PAGE – New Family
// ==========================

const clientId = "rr75kdousbzbp8qfjy0xtppwpljuke";
let token = "";

// =========================================================
// DATA STAFF (ta version d'origine, conservée)
// =========================================================
const STAFF = [
  // 👑 Fondateurs
  { role: "founder", emoji: "👑", title: "Admin Fondateurs",
    members: [
      { login: "clarastonewall", name: "Clara",
        desc: "Gardienne des plannings, streameuse Sims & simulation. L’organisation au service de la convivialité." },
      { login: "nexou31", name: "Nexou",
        desc: "Streamer Nintendo, formateur et gestionnaire des réseaux. Toujours à l’écoute des membres." },
      { login: "red_shadow_31", name: "Red",
        desc: "Sims & gestion. L’ombre du serveur : code du site, coordination des modos et coulisses techniques." },
    ]
  },

  // ⚙️ Adjoints
  { role: "adjoint", emoji: "⚙️", title: "Admins Adjoints",
    members: [
      { login: "selena_akemi", name: "Selena",
        desc: "Spécialiste gacha. Soutien créatif : visuels & réseaux aux côtés de Nexou." },
      { login: "nangel89", name: "Nangel",
        desc: "Couteau-suisse du staff. Présent partout pour fluidifier et aider." },
      { login: "tabs_up", name: "Tab's",
        desc: "Multigaming (LoL, No Man’s Sky…). Porte-parole des réunions d’intégration." },
      { login: "jenny31200", name: "Jenny",
        desc: "Call of Duty & Fortnite. Secrétaire en chef : rigueur et suivi des projets." },
    ]
  },

  // 🎓 Mentors
  { role: "mentor", emoji: "🎓", title: "Modérateurs Mentors",
    members: [
      { login: "mahyurah", name: "mahyurah",
        desc: "Jeux indés & farming (Palia…). Patience et bienveillance dans la modération." },
      { login: "livio_on", name: "Livio",
        desc: "Jeux d’horreur. Vigilance, sécurité et cohésion." },
      { login: "rubbycrea", name: "Rubby",
        desc: "Horreur & belles créations. Créativité et dynamisme." },
      { login: "leviacarpe", name: "Levia",
        desc: "Disney Dreamlight Valley. Magie, partage et douceur." },
      { login: "yaya_romali", name: "Yaya",
        desc: "Fortnite & Batman. Bonne humeur et énergie." },
      { login: "thedark_sand", name: "Dark",
        desc: "Pokémon, Yu-Gi-Oh, rétro. Expérience et écoute." },
      { login: "gilbert_hime", name: "Gilbert",
        desc: "DBD, Fortnite, gacha. Énergie et présence sur le terrain." },
      { login: "saikossama", name: "Saiko",
        desc: "DBD, Fortnite, ARK. Esprit d’équipe et vigilance." },
    ]
  },

  // 🌱 Juniors
  { role: "junior", emoji: "🌱", title: "Modérateurs Juniors",
    members: [
      { login: "lespydyverse", name: "le spydy",
        desc: "Jeux gacha. Enthousiasme et curiosité." },
      { login: "sigurdson64", name: "Sigur",
        desc: "Call of, une tuerie mais pas dans vos mp" },
      { login: "mmesigurdson64", name: "Mme Sigur",
       desc: "de Call of à la cuisine, une vrai régal" },
    ]
  },
];

// ================== UTILS ==================
const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

function badgeClass(role){
  if(role==="founder") return "badge--founder";
  if(role==="adjoint") return "badge--adjoint";
  if(role==="mentor")  return "badge--mentor";
  if(role==="junior")  return "badge--junior";
  return "";
}
function badgeText(role){
  if(role==="founder") return "👑 Fondateur";
  if(role==="adjoint") return "⚙️ Adjoint";
  if(role==="mentor")  return "🎓 Mentor";
  if(role==="junior")  return "🌱 Junior";
  return "Staff";
}

// ================== TOKEN & FETCH ==================
async function getToken(){
  try {
    const res = await fetch("/.netlify/functions/getTwitchData");
    if(res.ok){
      const data = await res.json();
      token = data.access_token || "";
    }
  } catch(e){ console.warn("Token Twitch indisponible:", e); }
}

async function getUsersByLogin(logins){
  if(!token) return {}; // fallback: pas de token → avatars par défaut
  const map = {};
  for(let i=0;i<logins.length;i+=90){
    const chunk = logins.slice(i,i+90);
    const query = chunk.map(l=>`login=${encodeURIComponent(l)}`).join("&");
    const url = `https://api.twitch.tv/helix/users?${query}`;
    const res = await fetch(url, {
      headers: { "Client-ID": clientId, Authorization: "Bearer " + token }
    });
    if(res.ok){
      const json = await res.json();
      (json.data || []).forEach(u=>{
        map[(u.login||"").toLowerCase()] = u.profile_image_url;
      });
    }
  }
  return map;
}

async function getLiveStatus(logins){
  if(!token) return new Set(); // fallback si pas de token
  const liveSet = new Set();
  for(let i=0;i<logins.length;i+=100){
    const chunk = logins.slice(i,i+100);
    const query = chunk.map(l=>`user_login=${encodeURIComponent(l)}`).join("&");
    const url = `https://api.twitch.tv/helix/streams?${query}`;
    const res = await fetch(url, {
      headers: { "Client-ID": clientId, Authorization: "Bearer " + token }
    });
    if(res.ok){
      const json = await res.json();
      (json.data || []).forEach(s=>{
        liveSet.add((s.user_login||"").toLowerCase());
      });
    }
  }
  return liveSet;
}

// ================== RENDU ==================
function renderSection(container, { role, emoji, title, members }, avatarMap, liveSet, q=""){
  const section = document.createElement("section");
  section.className = "staff-section reveal";

  const h2 = document.createElement("h2");
  h2.textContent = `${emoji} ${title}`;
  section.appendChild(h2);

  // === Texte explicatif selon le rôle (ajout) ===
  const roleDesc = {
    founder: "👑 Les fondateurs sont à l'origine de la communauté et assurent sa vision globale.",
    adjoint: "⚙️ Les adjoints épaulent les fondateurs dans la gestion quotidienne et les projets.",
    mentor: "🎓 Les mentors sont des modérateurs expérimentés qui guident et forment les autres.",
    junior: "🌱 Les juniors débutent en modération et apprennent aux côtés des mentors."
  };
  if(roleDesc[role]){
    const p = document.createElement("p");
    p.className = "role-desc";
    p.textContent = roleDesc[role];
    section.appendChild(p);
  }

  const grid = document.createElement("div");
  grid.className = "staff-grid";

  members
    .filter(m => m.name.toLowerCase().includes(q) || m.login.toLowerCase().includes(q))
    .forEach(m => {
      const login = m.login.toLowerCase();
      const imgSrc = avatarMap[login] || "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_600x600.png";
      const isLive = liveSet?.has(login);

      const card = document.createElement("article");
      card.className = "staff-card";
      card.innerHTML = `
        <div class="avatar-box">
          ${isLive ? `<span class="live-dot">LIVE</span>` : ""}
          <img class="avatar" loading="lazy" decoding="async" src="${imgSrc}" alt="Avatar de ${escapeHtml(m.name)}">
          <span class="badge ${badgeClass(role)}">${badgeText(role)}</span>
        </div>
        <div class="body">
          <h3 class="name">${escapeHtml(m.name)}</h3>
          <p class="desc">${escapeHtml(m.desc)}</p>
          <div class="btns" style="margin-top:.4rem;display:flex;gap:.4rem;justify-content:center">
            <a class="about-button" href="https://twitch.tv/${login}" target="_blank" rel="noopener">Twitch</a>
            <button class="about-button" data-more="${login}" data-role="${role}">Plus</button>
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

// ================== INIT ==================
async function initStaff(){
  showSkeletons();
  await getToken();

  const root = document.getElementById("staff-root");
  const allLogins = STAFF.flatMap(g => g.members.map(m => m.login.toLowerCase()));
  const [avatarMap, liveSet] = await Promise.all([
    getUsersByLogin(allLogins),
    getLiveStatus(allLogins)
  ]);

  let activeRole = "all";
  let query = "";

  function renderAll(){
    root.innerHTML = "";
    const groups = activeRole === "all" ? STAFF : STAFF.filter(g => g.role === activeRole);
    groups.forEach(group => renderSection(root, group, avatarMap, liveSet, query));
    setupReveal();
  }
  renderAll();

  // Onglets (si présents dans le HTML)
  document.querySelectorAll(".tab").forEach(t=>{
    t.addEventListener("click", ()=>{
      document.querySelectorAll(".tab").forEach(x=>x.classList.remove("is-active"));
      t.classList.add("is-active");
      activeRole = t.dataset.role;
      renderAll();
    });
  });

  // Recherche (si présente)
  const input = document.getElementById("staff-search");
  if(input){
    input.addEventListener("input", ()=>{
      query = input.value.trim().toLowerCase();
      renderAll();
    });
  }

  // Modale “Plus” (si présente)
  const modal = document.getElementById("staff-modal");
  if(modal){
    document.addEventListener("click", (e)=>{
      const btn = e.target.closest("[data-more]");
      if(!btn) return;
      const login = btn.getAttribute("data-more");
      const role = btn.getAttribute("data-role");
      const member = STAFF.flatMap(g=>g.members).find(m=>m.login.toLowerCase()===login);
      if(!member) return;

      document.getElementById("m-avatar").src = avatarMap[login] || "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_600x600.png";
      document.getElementById("m-avatar").alt = `Avatar de ${member.name}`;
      document.getElementById("m-name").textContent = member.name;
      document.getElementById("m-role").textContent = badgeText(role);
      document.getElementById("m-desc").textContent = member.desc;
      document.getElementById("m-links").innerHTML =
        `<a href="https://twitch.tv/${login}" target="_blank" rel="noopener">Voir la chaîne</a>`;
      modal.setAttribute("aria-hidden", "false");
    });

    document.getElementById("staff-close")?.addEventListener("click", ()=> {
      modal.setAttribute("aria-hidden", "true");
    });
    modal.addEventListener("click", (e)=>{
      if(e.target.id === "staff-modal"){
        modal.setAttribute("aria-hidden", "true");
      }
    });
    document.addEventListener("keydown", (e)=>{
      if(e.key === "Escape") modal.setAttribute("aria-hidden", "true");
    });
  }
}

document.addEventListener("DOMContentLoaded", initStaff);
