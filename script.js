/* =========================================================
   New Family — script.js
   - Twitch data (ton code)
   - Toggle clair/sombre (.dark sur <html>)
   - Badges LIVE (.is-live + data-live)
   - Badges rôles (fondateur / adjoint / mentor / junior)
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
    // Pas de préférence stockée → on suit le système
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
  const [res1, res2, res3] = await Promise.all([
    fetch("users1.json"),
    fetch("users2.json"),
    fetch("users3.json"),
  ]);

  const users1 = await res1.json();
  const users2 = await res2.json();
  const users3 = await res3.json();

  // Fusion + déduplication
  return [...new Set([...users1, ...users2, ...users3])];
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
    return await response.json();
  } catch {
    return [];
  }
}

/* -------------------------------
   🏷️ Détermination du badge rôle
----------------------------------*/
function getRoleBadge(user) {
  const u = user.toLowerCase();
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
  const title = isOnline
    ? `<strong>Venez soutenir</strong> ce membre de la <strong>New Family</strong> qui joue actuellement à <em>${escapeHtml(game)}</em>.`
    : "Hors ligne";

  const img = isOnline
    ? (streamData.thumbnail_url || "")
        .replace("{width}", "320")
        .replace("{height}", "180")
    : (userInfo?.profile_image_url ||
       "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_600x600.png");

  card.innerHTML = `
  <div class="media-wrap">
    <img src="${img}" alt="Preview de ${escapeHtml(user)}">
    ${getRoleBadge(user)}
    ${isVip ? `<span class="vip-chip">⭐ VIP</span>` : ""}
  </div>
  <div class="card-body">
    <div class="username">${escapeHtml(user)}</div>
    <p class="title">${title}</p>
    <div class="card-footer">
      <a href="${link}" target="_blank" rel="noopener">Regarder</a>
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

  const usersInfo = await fetchUsersInfo(allUsers);

  const streamChunks = [allUsers.slice(0, 100), allUsers.slice(100)];
  const onlineUsers = [];
  for (const group of streamChunks) {
    const data = await fetchStreams(group);
    if (data?.data?.length) onlineUsers.push(...data.data);
  }

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
    const streamData = isOnline
      ? onlineUsers.find((u) => (u.user_login || "").toLowerCase() === lower)
      : null;
    const userInfo = usersInfo.find((u) => (u.login || "").toLowerCase() === lower);
    const isVip = vipList.includes(lower);

    const card = createUserCard({
      user,
      isOnline,
      streamData,
      userInfo,
      isVip,
    });

    if (isOnline) liveContainer.appendChild(card);
    else offlineContainer.appendChild(card);
  }

  const liveCountElement = document.getElementById("live-count");
  if (liveCountElement) {
    const emoji =
      onlineUsers.length === 0 ? "😴" : onlineUsers.length > 20 ? "🔥" : "✨";
    liveCountElement.textContent = `${emoji} ${onlineUsers.length} membre${
      onlineUsers.length > 1 ? "s" : ""
    } de la New Family ${
      onlineUsers.length > 1 ? "sont" : "est"
    } actuellement en live`;
    liveCountElement.setAttribute("aria-live", "polite");
  }
}
/* ====== NF — helpers accueil (livebar, stats, reveal, skeletons) ====== */
  // ---- Améliorations accueil (s'exécutent uniquement si les éléments existent) ----
  nfSetupSkeletons();       // squelettes pendant le fetch
  nfSyncLiveBar();          // synchronise la barre live
  nfAnimateStatsOnView();   // anime les compteurs
  nfSetupRevealOnScroll();  // effets reveal

/** Synchronise la barre live (.nf-livebar) avec #live-count déjà géré */
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

/** Compteurs animés pour la section .nf-stats */
function nfAnimateStatsOnView() {
  const els = document.querySelectorAll(".nf-stats .num");
  if (!els.length) return;
  const animate = (el) => {
    const to = +el.dataset.to || 0, dur = 900;
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = Math.floor(p * to);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { animate(e.target); io.unobserve(e.target); }
    });
  }, { threshold: .5 });
  els.forEach((el) => io.observe(el));
}

/** Effet reveal au scroll pour .reveal */
function nfSetupRevealOnScroll() {
  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { threshold: .2 });
  els.forEach((el) => io.observe(el));
}

/** Squelettes pendant le chargement des lives */
function nfSetupSkeletons() {
  const container = document.getElementById("nf-skeletons");
  const liveGrid = document.getElementById("live-users");
  if (!container || !liveGrid) return;
  // Crée 6 placeholders
  for (let i = 0; i < 6; i++) {
    const card = document.createElement("div"); card.className = "skel";
    card.innerHTML = `
      <div class="ph big"></div>
      <div class="ph w80" style="margin:.4rem 0;"></div>
      <div class="ph w60" style="margin:.3rem 0;"></div>
      <div class="ph w40"></div>`;
    container.appendChild(card);
  }
  // Retire quand les vrais éléments arrivent
  const obs = new MutationObserver(() => {
    if (liveGrid.children.length > 0) { container.remove(); obs.disconnect(); }
  });
  obs.observe(liveGrid, { childList: true });
  // Time-out de sécurité
  setTimeout(() => { if (document.body.contains(container)) container.remove(); }, 10000);
}

init();

