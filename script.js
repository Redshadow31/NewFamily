/* =========================================================
   New Family — script.js (FINAL 2025 - hover previews + live strip)
   - Résilient aux fichiers manquants
   - Moyenne lives/jour sur 30 jours
   - Mise en avant exceptionnelle (featured.json) avec lecteur Twitch temps réel
   - Mini lecteur vidéo sur les cartes "en ligne" au survol (lazy)
   - Barre horizontale des lives (avatar + nom + jeu)
========================================================= */
/* === Mois courant (pour VIP filtrés) === */
const CURRENT_MONTH = new Date().toISOString().slice(0, 7); 
// exemple : "2025-11"

const clientId = "rr75kdousbzbp8qfjy0xtppwpljuke";
let token = "";
let NF_CARD_DATA = [];
let NF_FILTER = { search: "", game: "all" };
let NF_LIVE_CONTAINER = null;
let NF_OFFLINE_CONTAINER = null;

/* -------------------------------------------------------
   THEME
-------------------------------------------------------- */
const THEME_CLASS = "dark";

function applyThemeFromStorage() {
  const saved = localStorage.getItem("theme");
  const root = document.documentElement;
  if (saved === "dark") root.classList.add(THEME_CLASS);
  else if (saved === "light") root.classList.remove(THEME_CLASS);
  else {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    root.classList.toggle(THEME_CLASS, !!prefersDark);
  }
}

function setupThemeToggle() {
  applyThemeFromStorage();
  let btn = document.getElementById("theme-toggle");
  if (!btn) {
    btn = document.createElement("button");
    btn.id = "theme-toggle";
    btn.type = "button";
    btn.setAttribute("aria-label", "Changer de thème");
    btn.style.position = "absolute";
    btn.style.top = "1rem";
    btn.style.right = "1rem";
    btn.style.background = "var(--surface)";
    btn.style.color = "var(--text)";
    btn.style.border = "1px solid var(--border)";
    btn.style.borderRadius = "50%";
    btn.style.width = "42px";
    btn.style.height = "42px";
    btn.style.fontSize = "1.1rem";
    btn.style.cursor = "pointer";
    btn.style.boxShadow = "var(--shadow)";
    btn.style.display = "flex";
    btn.style.alignItems = "center";
    btn.style.justifyContent = "center";
    btn.style.transition = "background .2s ease, transform .2s ease";

    const header = document.querySelector("header") || document.body;
    if (!header.style.position) header.style.position = "relative";
    header.appendChild(btn);
  }
  const setIcon = () => {
    const isDark = document.documentElement.classList.contains(THEME_CLASS);
    btn.textContent = isDark ? "☀️" : "🌙";
    btn.title = isDark ? "Passer en mode clair" : "Passer en mode sombre";
  };
  setIcon();
  btn.addEventListener("click", () => {
    const root = document.documentElement;
    root.classList.toggle(THEME_CLASS);
    const isDark = root.classList.contains(THEME_CLASS);
    localStorage.setItem("theme", isDark ? "dark" : "light");
    setIcon();
  });
}

/* -------------------------------------------------------
   AUTH & appels Twitch
-------------------------------------------------------- */
async function getToken() {
  const response = await fetch("/.netlify/functions/getTwitchData").catch(() => null);
  if (!response || !response.ok) {
    console.error("❌ Impossible de récupérer le token Twitch.");
    return;
  }
  const data = await response.json();
  token = data.access_token;
}

async function fetchUserLists() {
  const files = ["users1.json", "users2.json", "users3.json"];
  const allUsers = [];
  for (const file of files) {
    try {
      const response = await fetch(file);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      allUsers.push(...(Array.isArray(data) ? data : []));
      console.info(`Chargé ${file} → ${data.length} users`);
    } catch (error) {
      console.warn(`Impossible de charger ${file}:`, error.message);
    }
  }
  return [...new Set(allUsers.map(u => (u || "").toLowerCase()))];
}

async function fetchStreams(logins) {
  if (!logins || !logins.length) return { data: [] };
  const query = logins.map((user) => `user_login=${encodeURIComponent(user)}`).join("&");
  const url = `https://api.twitch.tv/helix/streams?${query}`;
  try {
    const response = await fetch(url, {
      headers: {
        "Client-ID": clientId,
        Authorization: "Bearer " + token,
      },
    });
    if (!response.ok) {
      console.warn(`⚠️ fetchStreams a échoué avec le code ${response.status}`);
      return { data: [] };
    }
    return await response.json();
  } catch (error) {
    console.error("❌ Erreur dans fetchStreams :", error);
    return { data: [] };
  }
}

async function fetchUsersInfo(allUsers) {
  const results = [];
  for (let i = 0; i < allUsers.length; i += 100) {
    const chunk = allUsers.slice(i, i + 100);
    const query = chunk.map((user) => `login=${encodeURIComponent(user)}`).join("&");
    const url = `https://api.twitch.tv/helix/users?${query}`;
    try {
      const response = await fetch(url, {
        headers: {
          "Client-ID": clientId,
          Authorization: "Bearer " + token,
        },
      });
      if (!response.ok) throw new Error(`Erreur pour : ${chunk.join(", ")}`);
      const data = await response.json();
      results.push(...data.data);
    } catch (error) {
      console.warn("❌ Utilisateurs ignorés :", chunk, "-", error.message);
    }
  }
  return results;
}

/* -------------------------------------------------------
   🔥 Récupération DES VIP DU MOIS COURANT UNIQUEMENT
-------------------------------------------------------- */
async function fetchVIPList() {
  try {
    const response = await fetch("vip.json", { cache: "no-store" });
    if (!response.ok) return [];

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    // 📌 On filtre uniquement les VIP du mois en cours
    const monthVip = data.filter(item => {
      if (typeof item === "string") return false; // pas de mois → ignoré
      const m = item.month || "";
      return m === CURRENT_MONTH;
    });

    // 📌 On retourne uniquement les logins
    return monthVip.map(item => String(item.login || item.name || "").toLowerCase());

  } catch (e) {
    console.warn("Erreur lecture VIP :", e);
    return [];
  }
}


/* -------------------------------------------------------
   🏷️ Badges de rôle
-------------------------------------------------------- */
function getRoleBadge(user) {
  const u = (user || "").toLowerCase();
  if (["clarastonewall","nexou31","red_shadow_31"].includes(u)) {
    return '<span class="badge badge--founder">🔮 Fondateur</span>';
  }
  if (["selena_akemi","nangel89","tabs_up","jenny31200"].includes(u)) {
    return '<span class="badge badge--adjoint">🏛️ Adjoint</span>';
  }
  if (["mahyurah","livio_on","rubbycrea","leviacarpe","yaya_romali","thedark_sand","gilbert_hime","saikossama"].includes(u)) {
    return '<span class="badge badge--mentor">🛡️ Mentor</span>';
  }
  if (["lespydyverse","mcaliena","mcfly_59140"].includes(u)) {
    return '<span class="badge badge--junior">🔧 Junior</span>';
  }
  return "";
}

/* -------------------------------------------------------
   🖼️ Cartes utilisateurs
-------------------------------------------------------- */
function createUserCard({ user, isOnline, streamData, userInfo, isVip }) {
  const card = document.createElement("div");
  card.classList.add("user-card");
  if (isVip) card.classList.add("vip");
  if (!isOnline) card.classList.add("offline");
  if (isOnline) {
    card.classList.add("is-live");
    card.setAttribute("data-live", "LIVE");
    card.setAttribute("data-login", (streamData?.user_login || user || "").toLowerCase());
  }

  const link = `https://twitch.tv/${user}`;
  const game = isOnline ? (streamData.game_name || "en live") : "";
  const title = isOnline
    ? `<strong>Venez soutenir</strong> ce membre de la <strong>New Family</strong> qui joue actuellement à <em>${escapeHtml(game)}</em>.`
    : "Hors ligne";

  const img = isOnline
    ? (streamData.thumbnail_url || "").replace("{width}", "320").replace("{height}", "180")
    : (userInfo?.profile_image_url || "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_600x600.png");

  card.innerHTML = `
    <div class="media-wrap" style="position:relative;">
      <img class="card-thumb" src="${img}" loading="lazy" alt="Preview de ${escapeHtml(user)}" style="display:block;width:100%;height:auto;border-radius:.6rem;">
      ${getRoleBadge(user)}
      ${isVip ? `<span class="vip-chip">⭐ VIP</span>` : ""}
    </div>
    <div class="card-body">
      <div class="username">${escapeHtml(user)}</div>
      <p class="title">${title}</p>
      <div class="card-footer">
        <a href="${link}" target="_blank" rel="noopener" aria-label="Regarder ${escapeHtml(user)} sur Twitch">Regarder</a>
      </div>
    </div>
  `;
  return card;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
/* -------------------------------------------------------
   🧩 Cartes + filtres (recherche / jeu)
-------------------------------------------------------- */
function buildCardData(allUsers, onlineUsers, usersInfo, vipList) {
  const onlineLogins = onlineUsers.map(u => (u.user_login || "").toLowerCase());

  const uiMap = new Map();
  (usersInfo || []).forEach(u => {
    uiMap.set((u.login || "").toLowerCase(), u);
  });

  const streamMap = new Map();
  (onlineUsers || []).forEach(s => {
    streamMap.set((s.user_login || "").toLowerCase(), s);
  });

  const sortedUsers = [...allUsers].sort((a, b) => {
    const aIsVip = vipList.includes(a.toLowerCase());
    const bIsVip = vipList.includes(b.toLowerCase());
    return aIsVip === bIsVip ? 0 : aIsVip ? -1 : 1;
  });

  NF_CARD_DATA = sortedUsers.map(user => {
    const lower = user.toLowerCase();
    const isOnline = onlineLogins.includes(lower);
    const streamData = streamMap.get(lower) || null;
    const userInfo = uiMap.get(lower) || null;
    const isVip = vipList.includes(lower);
    const gameName = streamData?.game_name || "";
    return { user, lower, isOnline, streamData, userInfo, isVip, gameName };
  });
}

function applyFiltersAndRender() {
  if (!NF_LIVE_CONTAINER || !NF_OFFLINE_CONTAINER) return;
  NF_LIVE_CONTAINER.innerHTML = "";
  NF_OFFLINE_CONTAINER.innerHTML = "";

  const search = (NF_FILTER.search || "").trim().toLowerCase();
  const game = (NF_FILTER.game || "all").toLowerCase();

  for (const data of NF_CARD_DATA) {
    if (search && !data.lower.includes(search)) continue;

    if (data.isOnline && game !== "all") {
      if (!data.gameName || data.gameName.toLowerCase() !== game) continue;
    }

    const card = createUserCard({
      user: data.user,
      isOnline: data.isOnline,
      streamData: data.streamData,
      userInfo: data.userInfo,
      isVip: data.isVip
    });

    (data.isOnline ? NF_LIVE_CONTAINER : NF_OFFLINE_CONTAINER).appendChild(card);
  }

  // Rebranche les mini-lecteurs de survol sur les nouvelles cartes
  setupHoverPreviews();
}

function setupLiveFilters(onlineUsers) {
  const searchInput = document.getElementById("search-member");
  const gameSelect = document.getElementById("filter-game");

  if (gameSelect) {
    const games = Array.from(
      new Set(
        (onlineUsers || [])
          .map(u => (u.game_name || "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));

    gameSelect.innerHTML =
      '<option value="all">🎮 Tous les jeux</option>' +
      games.map(g => `<option value="${g.toLowerCase()}">${g}</option>`).join("");
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      NF_FILTER.search = e.target.value || "";
      applyFiltersAndRender();
    });
  }

  if (gameSelect) {
    gameSelect.addEventListener("change", (e) => {
      NF_FILTER.game = e.target.value || "all";
      applyFiltersAndRender();
    });
  }
}
  const onlineLogins = onlineUsers.map((u) => (u.user_login || "").toLowerCase());
  const sortedUsers = [...allUsers].sort((a, b) => {
    const aIsVip = vipList.includes(a.toLowerCase());
    const bIsVip = vipList.includes(b.toLowerCase());
    return aIsVip === bIsVip ? 0 : aIsVip ? -1 : 1;
  });

  for (const user of sortedUsers) {
    const lower = user.toLowerCase();
    const isOnline = onlineLogins.includes(lower);
    const streamData = isOnline ? onlineUsers.find((u) => (u.user_login || "").toLowerCase() === lower) : null;
    const userInfo = usersInfo.find((u) => (u.login || "").toLowerCase() === lower);
    const isVip = vipList.includes(lower);
    const card = createUserCard({ user, isOnline, streamData, userInfo, isVip });
    (isOnline ? liveContainer : offlineContainer).appendChild(card);
  }

/* -------------------------------------------------------
   📊 Stats dynamiques
-------------------------------------------------------- */
function setStatValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  const v = Math.max(0, Math.round(value));
  el.dataset.to = String(v);
  el.textContent = String(v);
}

const SNAP_KEY = "nf_live_snapshots_v1";
const SNAP_DAYS = 30;
const SNAP_KEEP = 30;

function recordLiveSnapshot(count) {
  const now = Date.now();
  const arr = loadSnapshots();
  arr.push({ t: now, c: Number(count) || 0 });
  const minKeep = now - SNAP_KEEP * 86400000;
  const filtered = arr.filter(s => s.t >= minKeep).slice(-2000);
  localStorage.setItem(SNAP_KEY, JSON.stringify(filtered));
}

function loadSnapshots() {
  try {
    const raw = localStorage.getItem(SNAP_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function computeLivesPerDayAverage() {
  const snaps = loadSnapshots();
  if (!snaps.length) return 0;
  const byDay = new Map();
  for (const s of snaps) {
    const d = new Date(s.t);
    const key = `${d.getUTCFullYear()}-${(d.getUTCMonth()+1).toString().padStart(2,"0")}-${d.getUTCDate().toString().padStart(2,"0")}`;
    const prev = byDay.get(key) ?? 0;
    byDay.set(key, Math.max(prev, s.c));
  }
  const days = Array.from(byDay.keys()).sort();
  const lastDays = days.slice(-SNAP_DAYS);
  if (!lastDays.length) return 0;
  const sum = lastDays.reduce((acc, key) => acc + (byDay.get(key) || 0), 0);
  return sum / lastDays.length;
}

/* -------------------------------------------------------
   🔥 Mise en avant — lecteur temps réel
-------------------------------------------------------- */
const TWITCH_PARENT = window.location.hostname.replace(/^www\./, "");

function fmtUptime(startedAt) {
  if (!startedAt) return "";
  const diffMs = Date.now() - new Date(startedAt).getTime();
  const m = Math.floor(diffMs / 60000);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return h ? `${h}h${mm.toString().padStart(2, "0")}` : `${mm} min`;
}

function mountFeaturedPlayer(channel) {
  const container = document.getElementById("featured-player");
  if (!container) return;
  container.style.display = "block";
  container.innerHTML = "";
  try {
    if (typeof Twitch === "undefined" || !Twitch?.Player) {
      console.warn("Twitch Player non chargé (embed script manquant).");
      return;
    }
    new Twitch.Player("featured-player", {
      width: "100%",
      height: "100%",
      channel,
      muted: true,
      autoplay: true,
      parent: [TWITCH_PARENT, "localhost", "127.0.0.1"]
    });
  } catch (e) {
    console.error("Erreur création lecteur Twitch:", e);
  }
}

async function renderFeaturedLive(ev, usersInfo, onlineUsers) {
  const section = document.getElementById("featured-live");
  if (!section) return;

  const link = document.getElementById("featured-link");
  const channelA = document.getElementById("fl-channel");
  const titleEl = document.getElementById("fl-title");
  const gameEl = document.getElementById("fl-game");
  const thumbImg = document.getElementById("fl-thumb");
  const avatarImg = document.getElementById("fl-avatar");
  const viewersEl = document.getElementById("fl-viewers");
  const uptimeEl = document.getElementById("fl-uptime");

  const login = (ev.user || "").toLowerCase();
  const url = ev.url || `https://www.twitch.tv/${login}`;
  if (link) link.href = url;
  if (channelA) { channelA.href = url; channelA.textContent = ev.user; }

  const sRes = await fetchStreams([login]);
  const s = sRes?.data?.[0];

  let userInfo = usersInfo?.find(u => (u.login || "").toLowerCase() === login);
  if (!userInfo) {
    try {
      const r = await fetch(`https://api.twitch.tv/helix/users?login=${encodeURIComponent(login)}`, {
        headers: { "Client-ID": clientId, Authorization: "Bearer " + token }
      });
      if (r.ok) {
        const j = await r.json();
        userInfo = j.data?.[0];
      }
    } catch {}
  }

  if (s) {
    if (titleEl) titleEl.textContent = s.title || "Live en cours";
    if (gameEl) gameEl.textContent = s.game_name || "Jeu";
    if (viewersEl) viewersEl.textContent = `👀 ${s.viewer_count ?? 0}`;
    if (uptimeEl) uptimeEl.textContent = `⏱️ ${fmtUptime(s.started_at)}`;
    if (thumbImg) {
      thumbImg.src = (s.thumbnail_url || "").replace("{width}", "1280").replace("{height}", "720");
      thumbImg.alt = `Aperçu du live de ${ev.user}`;
      thumbImg.loading = "lazy";
    }
    mountFeaturedPlayer(login);
  } else {
    const player = document.getElementById("featured-player");
    if (player) player.style.display = "none";
    if (titleEl) titleEl.textContent = `${ev.user} — mise en avant exceptionnelle`;
    if (gameEl) gameEl.textContent = "New Family";
    if (viewersEl) viewersEl.textContent = `👀 —`;
    if (uptimeEl) uptimeEl.textContent = `⏱️ —`;
    if (thumbImg) {
      thumbImg.src = "assets/featured_placeholder.jpg";
      thumbImg.alt = "Mise en avant New Family";
      thumbImg.loading = "lazy";
    }
  }

  if (userInfo && avatarImg) {
    avatarImg.src = userInfo.profile_image_url;
    avatarImg.alt = `Avatar de ${ev.user}`;
    avatarImg.loading = "lazy";
  }

  section.style.display = "block";
}

/* -------------------------------------------------------
   🧩 Mini lecteurs survol — hover previews (iframe)
-------------------------------------------------------- */
// Limite de previews simultanées (éviter CPU/RAM)
const HOVER_MAX_PLAYERS = 2;
const hoverPlayers = new Map();  // elem -> iframe
const hoverTimers = new Map();   // elem -> timeout id

function makeIframeSrc(channel) {
  const params = new URLSearchParams({
    channel,
    parent: TWITCH_PARENT,
    autoplay: "true",
    muted: "true",
    controls: "false"
  });
  return `https://player.twitch.tv/?${params.toString()}`;
}

function mountHoverPlayer(mediaWrap, login) {
  if (hoverPlayers.has(mediaWrap)) return;

  if (hoverPlayers.size >= HOVER_MAX_PLAYERS) {
    const firstKey = hoverPlayers.keys().next().value;
    unmountHoverPlayer(firstKey);
  }

  const img = mediaWrap.querySelector(".card-thumb");
  if (img) img.style.opacity = "0";

  const iframe = document.createElement("iframe");
  iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
  iframe.setAttribute("title", `Preview Twitch ${login}`);
  iframe.setAttribute("loading", "eager");
  iframe.style.position = "absolute";
  iframe.style.inset = "0";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "0";
  iframe.style.borderRadius = ".6rem";
  iframe.src = makeIframeSrc(login);

  mediaWrap.appendChild(iframe);
  hoverPlayers.set(mediaWrap, iframe);
}

function unmountHoverPlayer(mediaWrap) {
  const iframe = hoverPlayers.get(mediaWrap);
  if (iframe && iframe.parentNode) {
    iframe.parentNode.removeChild(iframe);
  }
  hoverPlayers.delete(mediaWrap);
  const img = mediaWrap.querySelector(".card-thumb");
  if (img) img.style.opacity = "1";
}

function setupHoverPreviews() {
  const isTouch = matchMedia("(pointer: coarse)").matches;
  if (isTouch) return;

  const liveCards = document.querySelectorAll(".user-card.is-live .media-wrap");
  liveCards.forEach(mediaWrap => {
    const card = mediaWrap.closest(".user-card");
    const login = (card?.dataset?.login || "").toLowerCase();
    if (!login) return;

    mediaWrap.onmouseenter = null;
    mediaWrap.onmouseleave = null;

    mediaWrap.addEventListener("mouseenter", () => {
      const t = setTimeout(() => mountHoverPlayer(mediaWrap, login), 220);
      hoverTimers.set(mediaWrap, t);
    });

    mediaWrap.addEventListener("mouseleave", () => {
      const t = hoverTimers.get(mediaWrap);
      if (t) clearTimeout(t);
      hoverTimers.delete(mediaWrap);
      unmountHoverPlayer(mediaWrap);
    });
  });
}

/* -------------------------------------------------------
   ⭐ Barre live (avatars + nom + jeu)
-------------------------------------------------------- */
function renderLiveStrip(onlineUsers, usersInfo){
  const section = document.getElementById("live-strip");
  const inner = document.getElementById("live-strip-inner");
  if (!section || !inner) return;

  inner.innerHTML = "";

  if (!onlineUsers || !onlineUsers.length){
    section.hidden = true;
    return;
  }

  const byLogin = new Map();
  (usersInfo || []).forEach(u => byLogin.set((u.login||"").toLowerCase(), u));

  for (const s of onlineUsers){
    const login = (s.user_login || "").toLowerCase();
    const info = byLogin.get(login);
    const display = info?.display_name || s.user_name || login;
    const avatar = info?.profile_image_url || "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_70x70.png";
    const game = s.game_name || "En live";
    const url = `https://twitch.tv/${login}`;

    const a = document.createElement("a");
    a.className = "live-chip";
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.ariaLabel = `${display} — ${game}`;
    a.innerHTML = `
      <img class="live-chip__avatar" src="${avatar}" alt="Avatar de ${display}" loading="lazy">
      <div class="live-chip__texts">
        <span class="live-chip__name">${display}<span class="live-chip__dot" aria-hidden="true"></span></span>
        <span class="live-chip__game">${game}</span>
      </div>
    `;
    inner.appendChild(a);
  }

  section.hidden = false;
}

/* -------------------------------------------------------
   🚀 Init principale
-------------------------------------------------------- */
async function init() {
  setupThemeToggle();
  nfSetupSkeletons();

  await getToken();
  if (!token) {
    console.error("❌ Token manquant !");
    setTimeout(hideSkeletons, 5000);
    return;
  }

  const [allUsers, vipList] = await Promise.all([fetchUserLists(), fetchVIPList()]);
  setStatValue("stat-members", 418);
  setStatValue("stat-actifs", allUsers.length || 0);

  const usersInfo = await fetchUsersInfo(allUsers);
  window.NF_USERS_INFO = usersInfo; // pour réutiliser dans le polling

  // Streams (2 chunks) en parallèle
  const streamChunks = [allUsers.slice(0, 100), allUsers.slice(100)];
  const onlineUsers = await Promise.all(streamChunks.map(chunk => fetchStreams(chunk)))
    .then(resList => {
      const arr = [];
      for (const r of resList) if (r?.data?.length) arr.push(...r.data);
      return arr;
    });

  // Stats dynamiques
  recordLiveSnapshot(onlineUsers.length);
  setStatValue("stat-lives", computeLivesPerDayAverage());

  // Événements
  try {
    const evRes = await fetch("events.json");
    if (evRes.ok) {
      const ev = await evRes.json();
      const nbEvents = Array.isArray(ev) ? ev.length : (ev?.count || 0);
      setStatValue("stat-events", nbEvents);
    }
  } catch (e) {
    console.warn("Erreur lecture events.json", e);
  }

  // Rendu cartes
  const liveContainer = document.getElementById("live-users");
  const offlineContainer = document.getElementById("offline-users");
  if (!liveContainer || !offlineContainer) {
    hideSkeletons();
    return;
  }

  const onlineLogins = onlineUsers.map((u) => (u.user_login || "").toLowerCase());
  const sortedUsers = [...allUsers].sort((a, b) => {
    const aIsVip = vipList.includes(a.toLowerCase());
    const bIsVip = vipList.includes(b.toLowerCase());
    return aIsVip === bIsVip ? 0 : aIsVip ? -1 : 1;
  });

  for (const user of sortedUsers) {
    const lower = user.toLowerCase();
    const isOnline = onlineLogins.includes(lower);
    const streamData = isOnline ? onlineUsers.find((u) => (u.user_login || "").toLowerCase() === lower) : null;
    const userInfo = usersInfo.find((u) => (u.login || "").toLowerCase() === lower);
    const isVip = vipList.includes(lower);
    const card = createUserCard({ user, isOnline, streamData, userInfo, isVip });
    (isOnline ? liveContainer : offlineContainer).appendChild(card);
  }

  // Texte barre
  const liveCountElement = document.getElementById("live-count");
  if (liveCountElement) {
    const emoji = onlineUsers.length === 0 ? "😴" : onlineUsers.length > 20 ? "🔥" : "✨";
    liveCountElement.textContent =
      `${emoji} ${onlineUsers.length} membre${onlineUsers.length > 1 ? "s" : ""} de la New Family ` +
      `${onlineUsers.length > 1 ? "sont" : "est"} actuellement en live`;
  }

  hideSkeletons();
  nfAnimateStatsOnView();
  nfSyncLiveBar();
  nfSetupRevealOnScroll();

  // Barre live + previews au survol
  renderLiveStrip(onlineUsers, usersInfo);
  setupHoverPreviews();

  // Polling régulier
  window.NF_ALL_USERS = allUsers;
  startLivePolling();

  // 🎯 Mise en avant exceptionnelle (featured.json) — anticache + fenêtre de tolérance
  try {
    const fRes = await fetch(`featured.json?ts=${Date.now()}`);
    if (fRes.ok) {
      const list = await fRes.json();
      const now = Date.now();
      const isActive = (iso) => {
        const start = new Date(iso).getTime();
        return now >= (start - 5 * 60 * 1000) && now <= (start + 130 * 60 * 1000);
      };
      const current = list.find(ev => isActive(ev.date));
      if (current) {
        await renderFeaturedLive(current, usersInfo, onlineUsers);
      } else {
        const player = document.getElementById("featured-player");
        if (player) player.style.display = "none";
      }
    }
  } catch (e) {
    console.warn("Erreur lecture featured.json", e);
  }
}

/* -------------------------------------------------------
   Helpers accueil (livebar, stats, reveal, skeletons)
-------------------------------------------------------- */
function nfSyncLiveBar() {
  const liveCountEl = document.getElementById("live-count");
  const barCount = document.getElementById("nf-live-count");
  if (!liveCountEl || !barCount) return;
  const sync = () => {
    const m = (liveCountEl.textContent || "").match(/\d+/);
    if (m) barCount.textContent = m[0];
  };
  sync();
  const obs = new MutationObserver(sync);
  obs.observe(liveCountEl, { childList: true, subtree: true, characterData: true });
}

function nfAnimateStatsOnView() {
  const els = document.querySelectorAll(".num[data-to]");
  if (!els.length) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        const to = Number(el.dataset.to) || 0;
        let from = Number(el.textContent) || 0;
        const step = Math.max(1, Math.round(to / 50));
        const interval = setInterval(() => {
          from += step;
          if (from >= to) {
            from = to;
            clearInterval(interval);
          }
          el.textContent = from;
        }, 20);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  els.forEach(el => observer.observe(el));
}

function nfSetupRevealOnScroll() {
  const reveals = document.querySelectorAll(".reveal");
  if (!reveals.length) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("revealed");
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  reveals.forEach(r => observer.observe(r));
}

function nfSetupSkeletons() {
  const skeletonContainer = document.getElementById("nf-skeletons");
  if (!skeletonContainer) return;
  skeletonContainer.innerHTML = "";
  for (let i = 0; i < 20; i++) {
    const skel = document.createElement("div");
    skel.classList.add("user-skeleton");
    skeletonContainer.appendChild(skel);
  }
}

function hideSkeletons() {
  const sk = document.getElementById("nf-skeletons");
  if (sk) {
    sk.innerHTML = "";
    sk.style.display = "none";
  }
}

async function startLivePolling(intervalMs = 5 * 60 * 1000) {
  if (!Array.isArray(window.NF_ALL_USERS) || !window.NF_ALL_USERS.length) return;
  const poll = async () => {
    try {
      const chunks = [window.NF_ALL_USERS.slice(0, 100), window.NF_ALL_USERS.slice(100)];
      const onlineUsers = [];
      for (const group of chunks) {
        const data = await fetchStreams(group);
        if (data?.data?.length) onlineUsers.push(...data.data);
      }
      recordLiveSnapshot(onlineUsers.length);
      setStatValue("stat-lives", computeLivesPerDayAverage());

      const barCount = document.getElementById("nf-live-count");
      if (barCount) barCount.textContent = String(onlineUsers.length);

      const liveCountElement = document.getElementById("live-count");
      if (liveCountElement) {
        const emoji = onlineUsers.length === 0 ? "😴" : onlineUsers.length > 20 ? "🔥" : "✨";
        liveCountElement.textContent =
          `${emoji} ${onlineUsers.length} membre${onlineUsers.length > 1 ? "s" : ""} de la New Family ` +
          `${onlineUsers.length > 1 ? "sont" : "est"} actuellement en live`;
      }

      // Barre live + previews (liste peut avoir changé)
      renderLiveStrip(onlineUsers, window.NF_USERS_INFO || []);
      setupHoverPreviews();
    } catch (e) {
      console.warn("Polling live: erreur", e);
    }
  };
  setTimeout(poll, 10_000);
  setInterval(poll, intervalMs);
}

/* ---- GO ---- */
init();
