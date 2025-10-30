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
   THEME clair/sombre
----------------------------------*/
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
    btn.style.cssText = `
      position:absolute;top:1rem;right:1rem;
      background:var(--surface);color:var(--text);
      border:1px solid var(--border);border-radius:50%;
      width:42px;height:42px;font-size:1.1rem;
      cursor:pointer;box-shadow:var(--shadow);
      display:flex;align-items:center;justify-content:center;
      transition:background .2s,transform .2s;
    `;
    const header = document.querySelector("header") || document.body;
    if (!header.style.position) header.style.position = "relative";
    header.appendChild(btn);
  }

  const setIcon = () => {
    const isDark = document.documentElement.classList.contains(THEME_CLASS);
    btn.textContent = isDark ? "Sun" : "Moon";
    btn.title = isDark ? "Mode clair" : "Mode sombre";
  };
  setIcon();

  btn.addEventListener("click", () => {
    document.documentElement.classList.toggle(THEME_CLASS);
    const isDark = document.documentElement.classList.contains(THEME_CLASS);
    localStorage.setItem("theme", isDark ? "dark" : "light");
    setIcon();
  });
}

/* -------------------------------
   AUTH & appels Twitch
----------------------------------*/
async function getToken() {
  const res = await fetch("/.netlify/functions/getTwitchData");
  const data = await res.json();
  token = data.access_token;
}

/* --- Chargement résilient des listes users --- */
async function fetchUserLists() {
  const files = ["users1.json", "users2.json", "users3.json"];
  const all = [];
  for (const f of files) {
    try {
      const r = await fetch(f);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      all.push(...(Array.isArray(data) ? data : []));
      console.info(`Chargé ${f} → ${data.length} users`);
    } catch (e) {
      console.warn(`Impossible de charger ${f}:`, e.message);
    }
  }
  return [...new Set(all.map(u => (u || "").toLowerCase().trim()))];
}

/* --- Twitch API helpers --- */
async function fetchStreams(logins) {
  if (!logins?.length) return { data: [] };
  const query = logins.map(l => `user_login=${encodeURIComponent(l)}`).join("&");
  const url = `https://api.twitch.tv/helix/streams?${query}`;
  try {
    const r = await fetch(url, {
      headers: { "Client-ID": clientId, Authorization: `Bearer ${token}` },
    });
    return r.ok ? await r.json() : { data: [] };
  } catch {
    return { data: [] };
  }
}

async function fetchUsersInfo(logins) {
  const results = [];
  for (let i = 0; i < logins.length; i += 100) {
    const chunk = logins.slice(i, i + 100);
    const query = chunk.map(l => `login=${encodeURIComponent(l)}`).join("&");
    const url = `https://api.twitch.tv/helix/users?${query}`;
    try {
      const r = await fetch(url, {
        headers: { "Client-ID": clientId, Authorization: `Bearer ${token}` },
      });
      if (r.ok) results.push(...(await r.json()).data);
    } catch {}
  }
  return results;
}

async function fetchVIPList() {
  try {
    const r = await fetch("vip.json");
    if (!r.ok) return [];
    const data = await r.json();
    return data.map(i => (typeof i === "string" ? i : i.login || "").toLowerCase());
  } catch {
    return [];
  }
}

/* -------------------------------
   BADGES rôle
----------------------------------*/
function getRoleBadge(user) {
  const u = user.toLowerCase();
  if (["clarastonewall", "nexou31", "red_shadow_31"].includes(u)) return " Fondateur";
  if (["selena_akemi", "nangel89", "tabs_up", "jenny31200"].includes(u)) return " Adjoint";
  if (["mahyurah", "livio_on", "rubbycrea", "leviacarpe", "yaya_romali", "thedark_sand", "gilbert_hime", "saikossama"].includes(u)) return " Mentor";
  if (["lespydyverse", "mcaliena", "mcfly_59140"].includes(u)) return " Junior";
  return "";
}

/* -------------------------------
   CARTE utilisateur
----------------------------------*/
function createUserCard({ user, isOnline, streamData, userInfo, isVip }) {
  const card = document.createElement("div");
  card.className = `user-card${isVip ? " vip" : ""}${isOnline ? " is-live" : " offline"}`;
  if (isOnline) card.dataset.live = "LIVE";

  const link = `https://twitch.tv/${user}`;
  const game = isOnline ? (streamData.game_name || "en live") : "";
  const title = isOnline
    ? `Soutenez ${user} qui joue à ${escapeHtml(game)}`
    : "Hors ligne";
  const img = isOnline
    ? (streamData.thumbnail_url || "")
        .replace("{width}", "320")
        .replace("{height}", "180")
    : (userInfo?.profile_image_url || "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_600x600.png");

  card.innerHTML = `
    <a href="${link}" target="_blank" rel="noopener" title="${title}">
      <img src="${img}" alt="Preview ${escapeHtml(user)}" loading="lazy" decoding="async">
      <div class="user-info">
        <h3>${escapeHtml(user)}${getRoleBadge(user)}${isVip ? " VIP" : ""}</h3>
      </div>
    </a>
  `;
  return card;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* -------------------------------
   STATS helpers
----------------------------------*/
function setStatValue(id, value) {
  const el = document.getElementById(id);
  if (el) {
    const v = Math.max(0, Math.round(value));
    el.dataset.to = v;
    el.textContent = v;
  }
}

/* -------------------------------
   MOYENNE LIVES/JOUR (30 jours, inclut 0)
----------------------------------*/
const SNAP_KEY = "nf_live_snapshots_v2";
const DAYS_AVG = 30;   // moyenne sur 30 jours
const KEEP_DAYS = 60; // garde 60 jours max

function recordLiveSnapshot(count) {
  const now = Date.now();
  const arr = loadSnapshots();
  arr.push({ t: now, c: Number(count) || 0 });

  const cutoff = now - KEEP_DAYS * 86400000;
  const filtered = arr.filter(s => s.t >= cutoff).slice(-5000);
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

/**
 * Retourne la moyenne des PIC (max) sur les 30 derniers jours.
 * Si un jour n’a aucun snapshot → 0.
 */
function computeLivesPerDayAverage() {
  const snaps = loadSnapshots();
  if (!snaps.length) return 0;

  // 1. Regrouper par jour (UTC) → PIC
  const dayMap = new Map(); // "YYYY-MM-DD" → max count
  for (const s of snaps) {
    const d = new Date(s.t);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    const prev = dayMap.get(key) ?? 0;
    dayMap.set(key, Math.max(prev, s.c));
  }

  // 2. Générer les 30 derniers jours (inclut les jours sans donnée)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const days = [];
  for (let i = 0; i < DAYS_AVG; i++) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    days.push(dayMap.get(key) ?? 0);
  }

  // 3. Moyenne
  const sum = days.reduce((a, b) => a + b, 0);
  return sum / days.length;
}

/* -------------------------------
   INIT principale
----------------------------------*/
async function init() {
  setupThemeToggle();
  await getToken();
  if (!token) return console.error("Token manquant");

  const [allUsers, vipList] = await Promise.all([fetchUserLists(), fetchVIPList()]);

  // Stat "Actifs"
  setStatValue("stat-actifs", allUsers.length);

  const usersInfo = await fetchUsersInfo(allUsers);

  // Streams (2 paquets)
  const streamChunks = [allUsers.slice(0, 100), allUsers.slice(100)];
  const onlineUsers = [];
  for (const chunk of streamChunks) {
    const data = await fetchStreams(chunk);
    if (data?.data?.length) onlineUsers.push(...data.data);
  }

  // Snapshot + moyenne lives/jour
  recordLiveSnapshot(onlineUsers.length);
  setStatValue("stat-lives", computeLivesPerDayAverage());

  // Rendu des cartes
  const liveContainer = document.getElementById("live-users");
  const offlineContainer = document.getElementById("offline-users");
  if (!liveContainer || !offlineContainer) return console.warn("Conteneurs manquants");

  const onlineLogins = onlineUsers.map(s => (s.user_login || "").toLowerCase());

  // Tri VIP d’abord
  const sorted = [...allUsers].sort((a, b) => {
    const aVip = vipList.includes(a.toLowerCase());
    const bVip = vipList.includes(b.toLowerCase());
    return aVip === bVip ? 0 : aVip ? -1 : 1;
  });

  for (const user of sorted) {
    const low = user.toLowerCase();
    const isOn = onlineLogins.includes(low);
    const stream = isOn ? onlineUsers.find(s => (s.user_login || "").toLowerCase() === low) : null;
    const info = usersInfo.find(u => (u.login || "").toLowerCase() === low);
    const vip = vipList.includes(low);
    const card = createUserCard({ user, isOnline: isOn, streamData: stream, userInfo: info, isVip: vip });
    (isOn ? liveContainer : offlineContainer).appendChild(card);
  }

  // Eyebrow live count
  const liveEl = document.getElementById("live-count");
  if (liveEl) {
    const emoji = onlineUsers.length === 0 ? "Sleeping" : onlineUsers.length > 20 ? "Fire" : "Sparkles";
    liveEl.textContent = `${emoji} ${onlineUsers.length} membre${onlineUsers.length > 1 ? "s" : ""} de la New Family ${onlineUsers.length > 1 ? "sont" : "est"} en live`;
    liveEl.setAttribute("aria-live", "polite");
  }

  window.NF_ALL_USERS = allUsers;
  startLivePolling();

  // UI extras
  nfSetupSkeletons();
  nfSyncLiveBar();
  nfAnimateStatsOnView();
  nfSetupRevealOnScroll();
}

/* -------------------------------
   UI helpers (skeletons, livebar, animations)
----------------------------------*/
function nfSetupSkeletons() {
  const container = document.getElementById("nf-skeletons");
  if (!container) return;
  for (let i = 0; i < 20; i++) {
    const sk = document.createElement("div");
    sk.className = "user-skeleton";
    container.appendChild(sk);
  }
}

function nfSyncLiveBar() {
  const liveEl = document.getElementById("live-count");
  const barEl = document.getElementById("nf-live-count");
  if (!liveEl || !barEl) return;
  const sync = () => {
    const m = liveEl.textContent.match(/\d+/);
    if (m) barEl.textContent = m[0];
  };
  sync();
  new MutationObserver(sync).observe(liveEl, { childList: true, subtree: true, characterData: true });
}

function nfAnimateStatsOnView() {
  const nums = document.querySelectorAll(".num[data-to]");
  if (!nums.length) return;
  const obs = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target;
          const to = Number(el.dataset.to) || 0;
          let cur = Number(el.textContent) || 0;
          const step = Math.max(1, Math.round(to / 50));
          const int = setInterval(() => {
            cur = Math.min(cur + step, to);
            el.textContent = cur;
            if (cur >= to) clearInterval(int);
          }, 20);
          obs.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );
  nums.forEach(n => obs.observe(n));
}

function nfSetupRevealOnScroll() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  const obs = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("revealed");
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  els.forEach(el => obs.observe(el));
}

/* -------------------------------
   POLLING live (5 min)
----------------------------------*/
async function startLivePolling(intervalMs = 5 * 60 * 1000) {
  if (!Array.isArray(window.NF_ALL_USERS) || !window.NF_ALL_USERS.length) return;

  const poll = async () => {
    try {
      const chunks = [window.NF_ALL_USERS.slice(0, 100), window.NF_ALL_USERS.slice(100)];
      const online = [];
      for (const c of chunks) {
        const d = await fetchStreams(c);
        if (d?.data?.length) online.push(...d.data);
      }

      recordLiveSnapshot(online.length);
      setStatValue("stat-lives", computeLivesPerDayAverage());

      const bar = document.getElementById("nf-live-count");
      if (bar) bar.textContent = online.length;

      const eye = document.getElementById("live-count");
      if (eye) {
        const emoji = online.length === 0 ? "Sleeping" : online.length > 20 ? "Fire" : "Sparkles";
        eye.textContent = `${emoji} ${online.length} membre${online.length > 1 ? "s" : ""} de la New Family ${online.length > 1 ? "sont" : "est"} en live`;
      }
    } catch (e) {
      console.warn("Polling erreur:", e);
    }
  };

  setTimeout(poll, 10_000);
  setInterval(poll, intervalMs);
}

/* ---- GO ---- */
init();
