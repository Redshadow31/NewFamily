/* =========================================================
   New Family — script.js (READY)
   - API Twitch + rendu cartes
   - Thème clair/sombre
   - Badges rôles + LIVE
   - Stats dynamiques (Actifs & Lives/jour)
   - Polling live (maj périodique sans recharger la page)
   ========================================================= */

const clientId = "rr75kdousbzbp8qfjy0xtppwpljuke";
let token = "";

/* -------------------------------
   🎛️ Thème clair/sombre
----------------------------------*/
const THEME_CLASS = "dark";

function applyThemeFromStorage() {
  const saved = localStorage.getItem("theme"); // "dark" | "light" | null
  const root = document.documentElement;

  if (saved === "dark") {
    root.classList.add(THEME_CLASS);
  } else if (saved === "light") {
    root.classList.remove(THEME_CLASS);
  } else {
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
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

/* -------------------------------
   🔑 Auth & appels Twitch
----------------------------------*/
async function getToken() {
  const response = await fetch("/.netlify/functions/getTwitchData");
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

  // Déduplication et minuscule
  return [...new Set(allUsers.map(u => (u || "").toLowerCase().trim()))];
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

async function fetchVIPList() {
  try {
    const response = await fetch("vip.json");
    if (!response.ok) return [];
    const data = await response.json();
    // Toujours renvoyer une liste de pseudos en minuscule
    return data.map(item => typeof item === "string" ? item.toLowerCase() : String(item.login || "").toLowerCase());
  } catch {
    return [];
  }
}

/* -------------------------------
   🏷️ Badges de rôle
----------------------------------*/
function getRoleBadge(user) {
  const u = (user || "").toLowerCase();
  if (["clarastonewall", "nexou31", "red_shadow_31"].includes(u)) {
    return ' 🔮 Fondateur';
  }
  if (["selena_akemi", "nangel89", "tabs_up", "jenny31200"].includes(u)) {
    return ' 🏛️ Adjoint';
  }
  if (["mahyurah", "livio_on", "rubbycrea", "leviacarpe", "yaya_romali", "thedark_sand", "gilbert_hime", "saikossama"].includes(u)) {
    return ' 🛡️ Mentor';
  }
  if (["lespydyverse", "mcaliena", "mcfly_59140"].includes(u)) {
    return ' 🔧 Junior';
  }
  return "";
}

/* -------------------------------
   🖼️ Rendu des cartes
----------------------------------*/
function createUserCard({ user, isOnline, streamData, userInfo, isVip }) {
  const card = document.createElement("div");
  card.classList.add("user-card");
  if (isVip) card.classList.add("vip");
  if (!isOnline) card.classList.add("offline");
  if (isOnline) {
    card.classList.add("is-live");
    card.setAttribute("data-live", "LIVE");
  }

  const link = `https://twitch.tv/${user}`;
  const game = isOnline ? (streamData.game_name || "en live") : "";
  const title = isOnline ? ` Venez soutenir ce membre de la New Family qui joue actuellement à ${escapeHtml(game)}.` : "Hors ligne";
  const img = isOnline ? (streamData.thumbnail_url || "")
    .replace("{width}", "320")
    .replace("{height}", "180") : (userInfo?.profile_image_url || "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_600x600.png");

  card.innerHTML = `
    <a href="${link}" target="_blank" rel="noopener noreferrer" title="${title}">
      <img src="${img}" alt="Preview de ${escapeHtml(user)}" loading="lazy" decoding="async">
      <div class="user-info">
        <h3>${escapeHtml(user)}${getRoleBadge(user)}${isVip ? ` ⭐ VIP` : ""}</h3>
      </div>
    </a>
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

/* -------------------------------
   📊 Stats dynamiques (helpers)
----------------------------------*/
function setStatValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  const v = Math.max(0, Math.round(value));
  el.dataset.to = String(v);
  el.textContent = String(v);
}

// LocalStorage des snapshots live pour moyenne quotidienne
const SNAP_KEY = "nf_live_snapshots_v1";
const SNAP_DAYS = 14; // fenêtre glissante (jours)
const SNAP_KEEP = 30; // conservation max (jours)

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

// moyenne du PIC quotidien sur les N derniers jours observés
function computeLivesPerDayAverage() {
  const snaps = loadSnapshots();
  if (!snaps.length) return 0;

  // regroupe par jour (UTC) et prend le max par jour
  const byDay = new Map();
  for (const s of snaps) {
    const d = new Date(s.t);
    const key = `${d.getUTCFullYear()}-${(d.getUTCMonth()+1).toString().padStart(2,"0")}-${d.getUTCDate().toString().padStart(2,"0")}`;
    const prev = byDay.get(key) ?? 0;
    byDay.set(key, Math.max(prev, s.c));
  }

  // ne garde que les 14 derniers jours, puis moyenne
  const days = Array.from(byDay.keys()).sort();
  const lastDays = days.slice(-SNAP_DAYS);
  if (!lastDays.length) return 0;
  const sum = lastDays.reduce((acc, key) => acc + (byDay.get(key) || 0), 0);
  return sum / lastDays.length;
}

/* -------------------------------
   🚀 Init principale
----------------------------------*/
async function init() {
  setupThemeToggle();
  await getToken();
  if (!token) {
    console.error("❌ Token manquant !");
    return;
  }

  const [allUsers, vipList] = await Promise.all([
    fetchUserLists(),
    fetchVIPList(),
  ]);

  // >>> STAT "Actifs" = nb d'utilisateurs uniques dans users1/2/3
  setStatValue("stat-actifs", allUsers.length);

  const usersInfo = await fetchUsersInfo(allUsers);

  // streams en 2 paquets (limite query)
  const streamChunks = [allUsers.slice(0, 100), allUsers.slice(100)];
  const onlineUsers = [];
  for (const group of streamChunks) {
    const data = await fetchStreams(group);
    if (data?.data?.length) onlineUsers.push(...data.data);
  }

  // enregistre snapshot pour "Lives/jour" + mise à jour de la moyenne
  recordLiveSnapshot(onlineUsers.length);
  setStatValue("stat-lives", computeLivesPerDayAverage());

  // Remplissage des grilles
  const liveContainer = document.getElementById("live-users");
  const offlineContainer = document.getElementById("offline-users");
  if (!liveContainer || !offlineContainer) {
    console.warn("⚠️ Conteneurs #live-users ou #offline-users introuvables.");
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
    if (isOnline) liveContainer.appendChild(card);
    else offlineContainer.appendChild(card);
  }

  // Texte "X membres en live" (eyebrow)
  const liveCountElement = document.getElementById("live-count");
  if (liveCountElement) {
    const emoji = onlineUsers.length === 0 ? "😴" : onlineUsers.length > 20 ? "🔥" : "✨";
    liveCountElement.textContent = `${emoji} ${onlineUsers.length} membre${onlineUsers.length > 1 ? "s" : "" } de la New Family ${onlineUsers.length > 1 ? "sont" : "est" } actuellement en live`;
    liveCountElement.setAttribute("aria-live", "polite");
  }

  // Mémorise la liste pour le polling et démarre le suivi
  window.NF_ALL_USERS = allUsers;
  startLivePolling(); // par défaut toutes les 5 minutes

  // --- UI Enhancements ---
  nfSetupSkeletons(); // squelettes pendant le fetch
  nfSyncLiveBar(); // synchronise la barre live
  nfAnimateStatsOnView(); // anime les compteurs au scroll
  nfSetupRevealOnScroll(); // effets reveal
}

/* ====== NF — helpers accueil (livebar, stats, reveal, skeletons) ====== */

// 1) Barre live ← synchronisée avec #live-count (texte)
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

// 2) Animation des nombres quand la section devient visible
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

// 3) Effets reveal au scroll (sections .reveal)
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

// 4) Squelettes pendant le chargement
function nfSetupSkeletons() {
  const skeletonContainer = document.getElementById("nf-skeletons");
  if (!skeletonContainer) return;

  for (let i = 0; i < 20; i++) {
    const skel = document.createElement("div");
    skel.classList.add("user-skeleton");
    skeletonContainer.appendChild(skel);
  }
}

/* -------------------------------
   🔁 Polling live (maj périodique)
   - Refait les appels Twitch à intervalle régulier
   - Met à jour: snapshot, moyenne Lives/jour, barre live & eyebrow
----------------------------------*/
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

      // 1) enregistre snapshot + met à jour la moyenne
      recordLiveSnapshot(onlineUsers.length);
      setStatValue("stat-lives", computeLivesPerDayAverage());

      // 2) synchro barre live
      const barCount = document.getElementById("nf-live-count");
      if (barCount) barCount.textContent = String(onlineUsers.length);

      // 3) maj eyebrow texte (si présent)
      const liveCountElement = document.getElementById("live-count");
      if (liveCountElement) {
        const emoji =
          onlineUsers.length === 0 ? "😴" : onlineUsers.length > 20 ? "🔥" : "✨";
        liveCountElement.textContent = `${emoji} ${onlineUsers.length} membre${
          onlineUsers.length > 1 ? "s" : ""
        } de la New Family ${
          onlineUsers.length > 1 ? "sont" : "est"
        } actuellement en live`;
      }
      // NB: on ne rerend pas toutes les cartes pour rester léger.
    } catch (e) {
      console.warn("Polling live: erreur", e);
    }
  };

  // premier run 10s après le chargement, puis intervalle régulier
  setTimeout(poll, 10_000);
  setInterval(poll, intervalMs);
}

/* ---- GO ---- */
init();
