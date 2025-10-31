// ==========================
// STAFF PAGE – Pôles TENF
// ==========================

const clientId = "rr75kdousbzbp8qfjy0xtppwpljuke";
let token = "";

// ========== Données structurées par PÔLES ==========
const POLES = [
  {
    id: "red",
    emoji: "🟥",
    title: "Accueil & Intégration",
    desc: "Accueil des nouveaux, réunions d’intégration, accompagnement et mise en place des bonnes pratiques sur le serveur.",
    members: [
      { login: "red_shadow_31", name: "Red",    level: "referent", desc: "Coordination générale de l’accueil, cadre et rituels d’intégration." },
      { login: "tabs_up",       name: "Tab’s",  level: "adjoint-ref", desc: "Adjoint référent — relais des intégrations et organisation pratique." },
      { login: "saikossama",    name: "Saiko",  level: "mentor",  desc: "Mentor (tickets) — accueil des tickets et pédagogie." },
      { login: "gilbert_hime",  name: "Gilbert",level: "mentor",  desc: "Mentor — présence et énergie sur le terrain." },
      { login: "yaya_romali",   name: "Yaya",   level: "mentor",  desc: "Mentor — dynamisme et bonne humeur." },
      { login: "rubbycrea",     name: "Rubby",  level: "mentor",  desc: "Mentor — créativité et soutien à l’intégration." },
      { login: "lespydyverse",  name: "Spydy",  level: "junior",  desc: "Junior — apprentissage de la modération et des rituels d’accueil." },
    ]
  },
  {
    id: "green",
    emoji: "🩷",
    title: "Planification, Animation & Événements",
    desc: "Calendrier des événements communautaires, animations, soirées spéciales et coordination inter-pôles.",
    members: [
      { login: "clarastonewall", name: "Clara",    level: "referent", desc: "Référente — planification, organisation et animation des événements." },
      { login: "jenny31200",     name: "Jenny",    level: "adjoint-ref", desc: "Adjointe référente — suivi des projets et rigueur logistique." },
      { login: "rubbycrea",      name: "Rubby",    level: "mentor",  desc: "Mentor — soutien animation & idées créatives." },
      { login: "thedark_sand",   name: "Dark",     level: "mentor",  desc: "Mentor — expérience, rétro & cartes (Pokémon / Yu-Gi-Oh)." },
      { login: "Zylkao",         name: "Zylkao",   level: "junior",  desc: "Junior — mise en place opérationnelle et soutien sur les events." },
      { login: "sigurdson64",    name: "Sigur",    level: "junior",  desc: "Junior — relais du soutien des événments." },
    ]
  },
  {
    id: "blue",
    emoji: "🟦",
    title: "Communication & Visuels",
    desc: "Identité visuelle, réseaux sociaux, supports graphiques des projets et valorisation des membres.",
    members: [
      { login: "nexou31",         name: "Nexou",      level: "referent", desc: "Référent — identité visuelle, réseaux, ligne graphique." },
      { login: "selena_akemi",    name: "Selena",     level: "adjoint-ref", desc: "Adjointe référente — coordination créative et diffusion." },
      { login: "yaya_romali",     name: "Yaya",       level: "mentor",  desc: "Mentor — relais communication et énergie sur les lives." },
      { login: "mmesigurdson64",  name: "Mme Sigur",  level: "support", desc: "Support visuel — aide sur les visuels & assets." },
    ]
  },
  {
    id: "yellow",
    emoji: "🟨",
    title: "Coordination & Formation interne",
    desc: "Organisation des process, passation d’informations, formation des modérateurs et transmission des savoir-faire.",
    members: [
      { login: "red_shadow_31", name: "Red",    level: "referent", desc: "Référent — process, standards et coordination des formations." },
      { login: "nangel89",      name: "Nangel", level: "adjoint-ref", desc: "Adjoint référent — suivi des Boost Live Team & accompagnement." },
      { login: "yaya_romali",   name: "Yaya",   level: "mentor",  desc: "Mentor — entraide, posture et bonnes pratiques live." },
      { login: "sigurdson64",  name: "Sigur",  level: "junior",  desc: "Junior — progression continue et participation aux ateliers." },
    ]
  },
  {
    id: "purple",
    emoji: "🟪",
    title: "Technique & Automatisation",
    desc: "Site, intégrations, automatisations, outils internes et support technique aux membres.",
    members: [
      { login: "nexou31",  name: "Nexou",  level: "referent", desc: "Référent technique — intégrations, automatisations et qualité." },
      { login: "nangel89", name: "Nangel", level: "adjoint-ref", desc: "Adjoint en soutien — aide technique et exploitation outils." },
      { login: "nexou31",  name: "Nexou",  level: "tech",    desc: "Lead dev — référent technique pour arbitrages et décisions." },
      { login: "red_shadow_31",  name: "Red",  level: "tech",    desc: "Lead dev — référent technique pour Ceb site." },
    ]
  }
];

// ========== Utils ==========
const escapeHtml = (s) =>
  String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;")
           .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");

function levelBadgeClass(level){
  switch(level){
    case "referent":   return "badge--referent";
    case "adjoint-ref":return "badge--adjoint-ref";
    case "mentor":     return "badge--mentor";
    case "junior":     return "badge--junior";
    case "support":    return "badge--support";
    case "tech":       return "badge--tech";
    default:           return "";
  }
}
function levelBadgeText(level){
  switch(level){
    case "referent":   return "Référent";
    case "adjoint-ref":return "Adjoint réf.";
    case "mentor":     return "Mentor";
    case "junior":     return "Junior";
    case "support":    return "Support";
    case "tech":       return "Tech";
    default:           return "Staff";
  }
}

// ========== Token & Fetch ==========
async function getToken(){
  try{
    const res = await fetch("/.netlify/functions/getTwitchData");
    if(res.ok){ const data = await res.json(); token = data.access_token || ""; }
  }catch(e){ console.warn("Token Twitch indisponible:", e); }
}
async function getUsersByLogin(logins){
  if(!token) return {};
  const map = {};
  for(let i=0;i<logins.length;i+=90){
    const chunk = logins.slice(i,i+90);
    const query = chunk.map(l=>`login=${encodeURIComponent(l)}`).join("&");
    const url = `https://api.twitch.tv/helix/users?${query}`;
    const res = await fetch(url, { headers:{ "Client-ID": clientId, Authorization:"Bearer "+token }});
    if(res.ok){
      const json = await res.json();
      (json.data||[]).forEach(u=>{
        map[(u.login||"").toLowerCase()] = u.profile_image_url;
      });
    }
  }
  return map;
}
async function getLiveStatus(logins){
  if(!token) return new Set();
  const liveSet = new Set();
  for(let i=0;i<logins.length;i+=100){
    const chunk = logins.slice(i,i+100);
    const query = chunk.map(l=>`user_login=${encodeURIComponent(l)}`).join("&");
    const url = `https://api.twitch.tv/helix/streams?${query}`;
    const res = await fetch(url, { headers:{ "Client-ID": clientId, Authorization:"Bearer "+token }});
    if(res.ok){
      const json = await res.json();
      (json.data||[]).forEach(s=> liveSet.add((s.user_login||"").toLowerCase()) );
    }
  }
  return liveSet;
}

// ========== Rendu ==========
function renderPole(container, pole, avatarMap, liveSet, q=""){
  const section = document.createElement("section");
  section.className = `staff-section reveal pole-${pole.id}`;

  const h2 = document.createElement("h2");
  h2.textContent = `${pole.emoji} ${pole.title}`;
  section.appendChild(h2);

  // Descriptif du pôle
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
      return m.name.toLowerCase().includes(s) || m.login.toLowerCase().includes(s) || (m.desc||"").toLowerCase().includes(s);
    })
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
          <span class="badge ${levelBadgeClass(m.level)}">${levelBadgeText(m.level)}</span>
        </div>
        <div class="body">
          <h3 class="name">${escapeHtml(m.name)}</h3>
          <p class="desc">${escapeHtml(m.desc || "")}</p>
          <div class="btns" style="margin-top:.4rem;display:flex;gap:.4rem;justify-content:center">
            <a class="about-button" href="https://twitch.tv/${login}" target="_blank" rel="noopener">Twitch</a>
            <button class="about-button" data-more="${login}" data-level="${m.level}" data-pole="${pole.id}">Plus</button>
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
  const [avatarMap, liveSet] = await Promise.all([ getUsersByLogin(allLogins), getLiveStatus(allLogins) ]);

  let activePole = "all";
  let query = "";

  function renderAll(){
    root.innerHTML = "";
    const groups = activePole === "all" ? POLES : POLES.filter(p => p.id === activePole);
    groups.forEach(pole => renderPole(root, pole, avatarMap, liveSet, query));
    setupReveal();
  }
  renderAll();

  // Onglets de pôles
  document.querySelectorAll(".tab").forEach(t=>{
    t.addEventListener("click", ()=>{
      document.querySelectorAll(".tab").forEach(x=>x.classList.remove("is-active"));
      t.classList.add("is-active");
      activePole = t.dataset.pole;
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

  // Modale
  const modal = document.getElementById("staff-modal");
  if(modal){
    document.addEventListener("click", (e)=>{
      const btn = e.target.closest("[data-more]");
      if(!btn) return;
      const login = btn.getAttribute("data-more");
      const level = btn.getAttribute("data-level");
      const member = POLES.flatMap(p=>p.members).find(m=>m.login.toLowerCase()===login);
      if(!member) return;

      document.getElementById("m-avatar").src = avatarMap[login] || "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_600x600.png";
      document.getElementById("m-avatar").alt = `Avatar de ${member.name}`;
      document.getElementById("m-name").textContent = member.name;
      document.getElementById("m-role").textContent = levelBadgeText(level);
      document.getElementById("m-desc").textContent = member.desc || "";
      document.getElementById("m-links").innerHTML = `<a href="https://twitch.tv/${login}" target="_blank" rel="noopener">Voir la chaîne</a>`;
      modal.setAttribute("aria-hidden", "false");
    });

    document.getElementById("staff-close")?.addEventListener("click", ()=> modal.setAttribute("aria-hidden","true"));
    modal.addEventListener("click", (e)=>{ if(e.target.id === "staff-modal"){ modal.setAttribute("aria-hidden","true"); }});
    document.addEventListener("keydown", (e)=>{ if(e.key === "Escape") modal.setAttribute("aria-hidden","true"); });
  }
}

document.addEventListener("DOMContentLoaded", initStaff);
