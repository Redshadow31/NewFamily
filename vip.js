/* ===========================
   VIP Élites — Page équitable (carrousel + mur)
   Fonctionnalités :
   - Lecture vip.json (objets ou pseudos simples)
   - Filtre strict sur le mois courant "YYYY-MM"
   - Carrousel 3×3 avec avatar + bio + lien + pastille LIVE
   - Mur complet avec bouton 👏 (persistant localStorage)
   - Tri: aléatoire / par applaudissements / LIVE d’abord
   - Compteurs globaux (applaudissements + nombre de VIP)
   =========================== */

const CLIENT_ID = "rr75kdousbzbp8qfjy0xtppwpljuke";
const ymKey = new Date().toISOString().slice(0, 7); // "YYYY-MM"
const STORAGE_PREFIX = `vip_${ymKey}_applause_`;
const CLICK_SUFFIX = "_clicked";

// ---------- Utils basiques ----------
const $ = (sel, p = document) => p.querySelector(sel);
const $$ = (sel, p = document) => [...p.querySelectorAll(sel)];
const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ---------- LocalStorage applaudissements ----------
const applauseKey = (id) => STORAGE_PREFIX + id.toLowerCase();
const applauseClickedKey = (id) => applauseKey(id) + CLICK_SUFFIX;
const getApplause = (id) => parseInt(localStorage.getItem(applauseKey(id)) || "0", 10);
const hasApplauded = (id) => localStorage.getItem(applauseClickedKey(id)) === "1";
const incApplause = (id) => {
  const k = applauseKey(id);
  const v = getApplause(id) + 1;
  localStorage.setItem(k, String(v));
  localStorage.setItem(applauseClickedKey(id), "1");
  return v;
};

// ---------- Récup JSON VIP + Twitch ----------
async function fetchVIPList() {
  // Format accepté :
  // - ["login1","login2",...]
  // - [{ login, month, quote?, badges?, image?, banner?, spotlight? }, ...]
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
  // helix/users
  const token = await fetchToken();
  const size = 90, chunks = [];
  for (let i = 0; i < logins.length; i += size) chunks.push(logins.slice(i, i + size));
  const results = [];
  for (const chunk of chunks) {
    const query = chunk.map(l => `login=${encodeURIComponent(l)}`).join("&");
    const url = `https://api.twitch.tv/helix/users?${query}`;
    const res = await fetch(url, { headers: { "Client-ID": CLIENT_ID, Authorization: "Bearer " + token } });
    if (!res.ok) throw new Error(`helix/users: ${res.status}`);
    const json = await res.json();
    results.push(...(json.data || []));
  }
  return results;
}

async function fetchLiveStatus(userIds) {
  // helix/streams?user_id=... pour savoir qui est LIVE
  if (!userIds.length) return {};
  const token = await fetchToken();
  const size = 90, chunks = [];
  for (let i = 0; i < userIds.length; i += size) chunks.push(userIds.slice(i, i + size));
  const liveMap = {};
  for (const chunk of chunks) {
    const query = chunk.map(id => `user_id=${encodeURIComponent(id)}`).join("&");
    const url = `https://api.twitch.tv/helix/streams?${query}`;
    const res = await fetch(url, { headers: { "Client-ID": CLIENT_ID, Authorization: "Bearer " + token } });
    if (!res.ok) throw new Error(`helix/streams: ${res.status}`);
    const json = await res.json();
    (json.data || []).forEach(s => {
      liveMap[s.user_id] = {
        live: true,
        title: s.title || "",
        game_name: s.game_name || "",
        viewer_count: s.viewer_count || 0
      };
    });
  }
  return liveMap;
}

// ---------- Normalisation + fusion ----------
function normalizeVipEntries(rawList) {
  // -> { logins: [...], metaMap: {login: {month, badges?, quote?, image?, banner?}} }
  const metaMap = {};
  const logins = rawList.map((item) => {
    if (typeof item === "string") {
      const login = item.toLowerCase();
      // n'ajoute pas de month par défaut
      metaMap[login] = {};
      return login;
    }
    const login = String(item.login || item.name || "").toLowerCase();
    metaMap[login] = {
      month: item.month || undefined,        // on laisse vide si non fourni
      badges: Array.isArray(item.badges) ? item.badges : undefined,
      quote: item.quote || undefined,
      image: item.image || item.avatar || undefined,
      banner: item.banner || item.cover || undefined
    };
    return login;
  });
  return { logins, metaMap };
}

function mergeUsersWithMeta(usersInfo, metaMap) {
  return usersInfo.map((u) => {
    const login = (u.login || "").toLowerCase();
    const meta = metaMap[login] || {};
    const id = u.id;
    return {
      id,
      login,
      display_name: u.display_name || u.login,
      bio: u.description || "",                          // bio Twitch
      avatar: u.profile_image_url || "",
      banner: meta.banner || u.offline_image_url || "",
      image: meta.image || u.profile_image_url || "",
      badges: meta.badges || [],
      quote: meta.quote || "",
      month: meta.month,
      isLive: false, liveData: null                      // renseigné après fetchLiveStatus
    };
  });
}

// ---------- Rendu UI ----------
function liveDotHTML(isLive) {
  return isLive ? `<span class="live-dot"><span class="dot"></span> LIVE</span>` : "";
}

function cardHTML(v) {
  const login = v.login;
  const applause = getApplause(login);
  const clicked = hasApplauded(login);
  return `
  <article class="vip-card">
    <div class="vip-media">
      ${liveDotHTML(v.isLive)}
      <img src="${v.image || v.avatar || v.banner || "assets/placeholder.webp"}" alt="${escapeHtml(v.display_name)}">
    </div>
    <div class="vip-body">
      <div class="vip-name"><a href="https://twitch.tv/${login}" target="_blank" rel="noopener">${escapeHtml(v.display_name)}</a></div>
      ${v.bio ? `<p class="vip-bio">${escapeHtml(v.bio)}</p>` : ""}
      ${v.badges?.length ? `<div class="vip-badges">${v.badges.map(b => `<span class="vip-badge">${escapeHtml(b)}</span>`).join("")}</div>` : ""}
      <div class="vip-actions">
        <a class="about-button" href="https://twitch.tv/${login}" target="_blank" rel="noopener">Voir la chaîne</a>
        <button class="vip-applaud" type="button" aria-pressed="${clicked ? "true" : "false"}" data-id="${login}">
          👏 <span class="vip-count">${applause}</span>
        </button>
      </div>
    </div>
  </article>
  `;
}

function carouselItemHTML(v) {
  return `
    <div class="vip-slide">
      <div class="vip-slide-media">
        ${liveDotHTML(v.isLive)}
        <img src="${v.avatar || v.image || v.banner || "assets/placeholder.webp"}" alt="${escapeHtml(v.display_name)}">
      </div>
      <div class="vip-slide-body">
        <div class="vip-slide-name"><a href="https://twitch.tv/${v.login}" target="_blank" rel="noopener">${escapeHtml(v.display_name)}</a></div>
        ${v.bio ? `<p class="vip-slide-bio">${escapeHtml(v.bio)}</p>` : ""}
        <a class="about-button" href="https://twitch.tv/${v.login}" target="_blank" rel="noopener">Regarder</a>
      </div>
    </div>
  `;
}

function renderCarousel(vips) {
  const root = $("#vip-carousel");
  if (!root) return;
  if (!vips.length) { root.innerHTML = ""; return; }

  // Structure : conteneur + flèches
  root.innerHTML = `
    <div class="vip-carousel-inner">
      <button class="vip-nav vip-prev" aria-label="Précédent">‹</button>
      <div class="vip-track"></div>
      <button class="vip-nav vip-next" aria-label="Suivant">›</button>
    </div>
  `;
  const track = $(".vip-track", root);

  // On prend tous les VIP (ordre déjà trié) et on crée les slides
  track.innerHTML = vips.map(carouselItemHTML).join("");

  // Logique défilement 3 par 3
  let index = 0;
  const pageSize = 3;
  function update() {
    const total = vips.length;
    const pageCount = Math.ceil(total / pageSize);
    if (index < 0) index = pageCount - 1;
    if (index > pageCount - 1) index = 0;
    const offset = index * 100;
    track.style.transform = `translateX(-${offset}%)`;
  }
  $(".vip-prev", root).addEventListener("click", () => { index--; update(); });
  $(".vip-next", root).addEventListener("click", () => { index++; update(); });

  // Prépare un layout en "pages" : 3 items par page => calc via CSS (.vip-track grid)
  update();
}

function renderWall(vips) {
  const grid = $("#vip-grid");
  if (!grid) return;
  grid.innerHTML = vips.map(cardHTML).join("");
}

function updateStats(vips) {
  const countEl = $("#vip-count");
  if (!countEl) return;
  const totalVip = vips.length;
  const totalApplause = vips.reduce((sum, v) => sum + getApplause(v.login), 0);
  countEl.innerHTML = `👏 <strong>${totalApplause}</strong> applaudissements ont déjà été donnés à nos <strong>${totalVip}</strong> VIP du mois <span class="vip-month">(${ymKey})</span> 🎉`;
}

// Appliquer tri
function sortVips(vips, mode) {
  if (mode === "applause") {
    return [...vips].sort((a, b) => getApplause(b.login) - getApplause(a.login) || a.display_name.localeCompare(b.display_name));
  }
  if (mode === "live") {
    return [...vips].sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      return a.display_name.localeCompare(b.display_name);
    });
  }
  // default: aléatoire neutre
  return shuffle(vips);
}

// ---------- Flux principal ----------
async function main() {
  try {
    const rawList = await fetchVIPList();
    const { logins, metaMap } = normalizeVipEntries(rawList);

    // Filtre strict : uniquement ceux du mois courant
    const thisMonthLogins = Object.entries(metaMap)
      .filter(([login, meta]) => meta.month === ymKey) // <= IMPORTANT
      .map(([login]) => login);

    if (!thisMonthLogins.length) {
      $("#vip-grid")?.insertAdjacentHTML("beforeend", `<p>Aucun VIP pour ${ymKey}.</p>`);
      $("#vip-carousel")?.remove();
      updateStats([]);
      return;
    }

    // Récup infos Twitch + LIVE
    const users = await fetchUsersInfo(thisMonthLogins);
    const vips = mergeUsersWithMeta(users, metaMap).filter(v => v.month === ymKey);
    const liveMap = await fetchLiveStatus(vips.map(v => v.id));
    vips.forEach(v => {
      const l = liveMap[v.id];
      if (l?.live) { v.isLive = true; v.liveData = l; }
    });

    // Tri initial: LIVE d’abord (comme demandé)
    let state = sortVips(vips, "live");

    // Render
    renderCarousel(state);
    renderWall(state);
    updateStats(state);

    // Click applaudissements (délégué)
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".vip-applaud");
      if (!btn) return;
      const id = btn.dataset.id;
      if (hasApplauded(id)) return;
      const newVal = incApplause(id);
      btn.setAttribute("aria-pressed", "true");
      const span = btn.querySelector(".vip-count");
      if (span) span.textContent = String(newVal);
      updateStats(state);
    });

    // Tri interactif
    $$(".vip-toolbar [data-sort]").forEach(b => {
      b.addEventListener("click", () => {
        const mode = b.getAttribute("data-sort");
        state = sortVips(vips, mode);
        renderCarousel(state);
        renderWall(state);
        updateStats(state);
      });
    });

  } catch (e) {
    console.error(e);
    $("#vip-grid")?.insertAdjacentHTML("beforeend", `<p>Erreur de chargement de la page VIP.</p>`);
  }
}

document.addEventListener("DOMContentLoaded", main);
