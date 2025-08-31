// ===========================
// VIP Élites – Wall équitable + Applaudissements
// ===========================

const CLIENT_ID = "rr75kdousbzbp8qfjy0xtppwpljuke";

// ---------- Utils ----------
const $ = (s, p=document) => p.querySelector(s);
const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

// Shuffle équitable (Fisher–Yates)
function shuffle(arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

// ---------- Fetch helpers ----------
async function fetchVIPList() {
  // vip.json peut être: ["login1", ...] ou [{login, badges, quote, image, banner, title, month}, ...]
  const res = await fetch("vip.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`vip.json: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("vip.json doit contenir un tableau");
  return data;
}

async function fetchToken() {
  const res = await fetch("/.netlify/functions/getTwitchData", { cache: "no-store" });
  if (!res.ok) throw new Error(`getTwitchData: ${res.status}`);
  const data = await res.json();
  if (!data?.access_token) throw new Error("Token manquant");
  return data.access_token;
}

async function fetchUsersInfo(logins) {
  const token = await fetchToken();
  const size = 90, chunks = [];
  for (let i=0; i<logins.length; i+=size) chunks.push(logins.slice(i, i+size));
  const results = [];
  for (const chunk of chunks) {
    const query = chunk.map(l=>`login=${encodeURIComponent(l)}`).join("&");
    const url = `https://api.twitch.tv/helix/users?${query}`;
    const res = await fetch(url, { headers: { "Client-ID": CLIENT_ID, Authorization: "Bearer " + token }});
    if (!res.ok) throw new Error(`helix/users: ${res.status}`);
    const json = await res.json();
    results.push(...(json.data || []));
  }
  return results;
}

// ---------- Normalisation ----------
function normalizeVipEntries(rawList) {
  // -> { logins: [...], metaMap: { login: {badges, quote, image, banner, title, month} } }
  const metaMap = {};
  const logins = rawList.map((item) => {
    if (typeof item === "string") {
      const login = item.toLowerCase();
      metaMap[login] = {};
      return login;
    }
    const login = String(item.login || item.name || "").toLowerCase();
    metaMap[login] = {
      badges: item.badges || [],
      quote: item.quote || "",
      image: item.image || item.avatar || "",
      banner: item.banner || item.cover || "",
      title: item.title || "Membre VIP Élites",
      month: item.month || ""
    };
    return login;
  });
  return { logins, metaMap };
}

function mergeUsersWithMeta(usersInfo, metaMap) {
  return usersInfo.map((u) => {
    const login = (u.login || "").toLowerCase();
    const meta = metaMap[login] || {};
    return {
      login,
      display_name: u.display_name || u.login,
      avatar: u.profile_image_url || "",
      banner: meta.banner || u.offline_image_url || "",
      image: meta.image || u.profile_image_url || "",
      badges: meta.badges || [],
      quote: meta.quote || "",
      title: meta.title || "Membre VIP Élites",
      month: meta.month || "",
      description: u.description || "" // bio Twitch
    };
  });
}

// ================== Applaudissements (1 par VIP et par mois) ==================
const ymKey = new Intl.DateTimeFormat('fr-ES', { year:'numeric', month:'2-digit' }).format(new Date()); // YYYY-MM
const STORAGE_PREFIX = `vip_${ymKey}_applause_`;
const CLICK_SUFFIX = "_clicked";

function applauseKey(id){ return STORAGE_PREFIX + id; }
function getApplause(id){ return parseInt(localStorage.getItem(applauseKey(id)) || "0", 10); }
function hasApplauded(id){ return localStorage.getItem(applauseKey(id)+CLICK_SUFFIX) === "1"; }
function setApplauded(id){ localStorage.setItem(applauseKey(id)+CLICK_SUFFIX, "1"); }
function incApplause(id){
  const k = applauseKey(id);
  const v = getApplause(id) + 1;
  localStorage.setItem(k, String(v));
  return v;
}

// ================== Rendu (grille équitable, pas d'archives) ==================
function buildBadges(badges) {
  if (!badges || !badges.length) return "";
  return `<div class="vip-badges">
    ${badges.map((b) => `<span class="vip-badge">${escapeHtml(b)}</span>`).join("")}
  </div>`;
}

function cardHTML(v) {
  const login = (v.login || "").toLowerCase();
  const img = v.image || v.avatar || v.banner || "assets/placeholder.webp";
  const title = v.title || "Membre VIP Élites";
  const name = v.display_name || login;
  const quote = v.quote ? `<div class="vip-quote">“${escapeHtml(v.quote)}”</div>` : "";
  const applauded = hasApplauded(login);
  return `
    <article class="user-card vip-card">
      ${buildBadges(v.badges)}
      <div class="media-wrap">
        <img src="${img}" alt="${name}">
      </div>
      <div class="card-body">
        <div class="username"><a href="https://twitch.tv/${login}" target="_blank" rel="noopener">${name}</a></div>
        <div class="title">⭐ ${title}</div>
        ${quote}
        <div class="cta-row">
          <button class="vip-applaud" type="button" aria-pressed="${applauded ? "true" : "false"}" data-id="${login}">
            👏 <span class="vip-count">${getApplause(login)}</span>
          </button>
          <a href="https://twitch.tv/${login}" target="_blank" rel="noopener">Voir la chaîne</a>
        </div>
      </div>
    </article>
  `;
}

function renderGrid(vips){
  const grid = document.getElementById("vip-users");
  if (!grid) return;
  const list = shuffle(vips);
  grid.innerHTML = list.map(cardHTML).join("");
}

// ================== Flux principal ==================
async function showVIPs() {
  try {
    const rawList = await fetchVIPList();
    const { logins, metaMap } = normalizeVipEntries(rawList);
    if (!logins.length) {
      const grid = $("#vip-users");
      if (grid) grid.innerHTML = "<p>Aucun VIP à afficher.</p>";
      return;
    }
    const usersInfo = await fetchUsersInfo(logins);
    const vips = mergeUsersWithMeta(usersInfo, metaMap);

    // Pas d'archives: on peut garder seulement ceux du mois courant si "month" est fourni
    const currentYM = ymKey; // "YYYY-MM"
    const vipsThisMonth = vips.filter(v => (v.month || currentYM) === currentYM);

    renderGrid(vipsThisMonth);

    // Écoute applaudissements
    document.addEventListener("click", (e)=>{
      const btn = e.target.closest(".vip-applaud");
      if(!btn) return;
      const id = btn.dataset.id;
      if(!hasApplauded(id)){
        const val = incApplause(id);
        btn.querySelector(".vip-count").textContent = String(val);
        btn.setAttribute("aria-pressed", "true");
        setApplauded(id);
      }
    });
  } catch (e) {
    console.error(e);
    const grid = $("#vip-users");
    if (grid) grid.innerHTML = "<p>Erreur de chargement des VIP Élites.</p>";
  }
}

document.addEventListener("DOMContentLoaded", showVIPs);
