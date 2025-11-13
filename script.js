/* =========================================================
   New Family — script.js CLEAN 2025
   - Barre live dynamique
   - VIP du mois
   - Stats Discord
   - Conseils TENF (typing effect)
   - Filtres (recherche + jeux)
   - Cartes live/offline
   - Mini-lecteurs au survol
========================================================= */

const clientId = "rr75kdousbzbp8qfjy0xtppwpljuke";
let token = "";

let NF_CARD_DATA = [];
let NF_FILTER = { search: "", game: "all" };
let NF_LIVE_CONTAINER = null;
let NF_OFFLINE_CONTAINER = null;

/* Conseils façon Twitch TENF */
const NF_TIPS = [
  "Le live gagnant TENF n’est pas un boost de statistiques, c’est une vitrine pour présenter ta chaîne, ton univers et ta personnalité à toute la communauté.",
  "Chaque soutien compte : un simple lurk, un passage rapide ou un petit coucou, c’est déjà beaucoup pour montrer que tu es là pour les autres.",
  "Discuter sur Discord, réagir et prendre des nouvelles, c’est déjà faire connaître ton stream. Plus on te voit ici, plus on a envie de te découvrir en live.",
  "À TENF, nous sommes des collègues de stream avant d’être des viewers. Le jeu est secondaire : l’essentiel est de se soutenir et de progresser ensemble.",
  "Un serveur d’entraide n’est pas une baguette magique. Ta progression se construit avec le temps, la régularité et les liens que tu crées autour de toi.",
  "Nous avons dépassé les 400 membres, mais seuls les actifs sont mis en avant. Les autres restent de la famille, sans obligation.",
  "Bienveillance et entraide : se tourner vers les autres, c’est aussi se donner à soi-même plus de chances de grandir… même en plein live."
];

/* -------------------------------------------------------
   THEME
-------------------------------------------------------- */
function setupThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
  });
}

/* -------------------------------------------------------
   TOKEN TWITCH
-------------------------------------------------------- */
async function getToken() {
  try {
    const res = await fetch("/.netlify/functions/getTwitchData");
    const data = await res.json();
    token = data.access_token;
  } catch {
    console.error("❌ Impossible de récupérer le token Twitch.");
  }
}

/* -------------------------------------------------------
   LECTURE LISTES USERS
-------------------------------------------------------- */
async function fetchUserLists() {
  const files = ["users1.json", "users2.json", "users3.json"];
  const all = [];
  for (const f of files) {
    try {
      const r = await fetch(f);
      if (r.ok) all.push(...await r.json());
    } catch {}
  }
  return [...new Set(all.map(u => u.toLowerCase()))];
}

/* -------------------------------------------------------
   STREAMS EN COURS
-------------------------------------------------------- */
async function fetchStreams(logins) {
  if (!logins.length) return { data: [] };
  const query = logins.map(l => `user_login=${l}`).join("&");
  try {
    const res = await fetch(`https://api.twitch.tv/helix/streams?${query}`, {
      headers: { "Client-ID": clientId, "Authorization": "Bearer " + token }
    });
    if (!res.ok) return { data: [] };
    return res.json();
  } catch {
    return { data: [] };
  }
}

/* -------------------------------------------------------
   INFOS USERS TWITCH
-------------------------------------------------------- */
async function fetchUsersInfo(allUsers) {
  const result = [];
  for (let i = 0; i < allUsers.length; i += 100) {
    const chunk = allUsers.slice(i, i + 100);
    const params = chunk.map(u => `login=${u}`).join("&");
    try {
      const res = await fetch(`https://api.twitch.tv/helix/users?${params}`, {
        headers: { "Client-ID": clientId, "Authorization": "Bearer " + token }
      });
      if (res.ok) {
        result.push(...(await res.json()).data);
      }
    } catch {}
  }
  return result;
}

/* -------------------------------------------------------
   VIP DU MOIS
-------------------------------------------------------- */
async function fetchVIPList() {
  try {
    const r = await fetch("vip.json", { cache: "no-store" });
    if (r.ok) {
      return (await r.json()).map(v => v.login.toLowerCase());
    }
    return [];
  } catch {
    return [];
  }
}

/* -------------------------------------------------------
   BADGES STAFF
-------------------------------------------------------- */
function getRoleBadge(user) {
  const u = user.toLowerCase();

  if (["red_shadow_31", "nexou31", "clarastonewall"].includes(u))
    return `<span class="badge badge--founder">🔮 Fondateur</span>`;

  if (["selena_akemi", "nangel89"].includes(u))
    return `<span class="badge badge--adjoint">🏛️ Adjoint</span>`;

  if (["thedark_sand","gilbert_hime","saikossama","mahyurah","livio_on","leviacarpe","yaya_romali"].includes(u))
    return `<span class="badge badge--mentor">🛡️ Mentor</span>`;

  return "";
}

/* -------------------------------------------------------
   CARTES
-------------------------------------------------------- */
function createUserCard({ user, isOnline, streamData, userInfo, isVip }) {
  const card = document.createElement("div");
  card.classList.add("user-card");
  if (isOnline) card.classList.add("is-live");
  if (isVip) card.classList.add("vip");

  const img = isOnline
    ? streamData.thumbnail_url.replace("{width}", "320").replace("{height}", "180")
    : userInfo?.profile_image_url || "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_600x600.png";

  const link = `https://twitch.tv/${user}`;
  const game = isOnline ? (streamData.game_name || "En live") : "";

  card.innerHTML = `
    <div class="media-wrap">
      <img class="card-thumb" src="${img}" alt="">
      ${getRoleBadge(user)}
      ${isVip ? `<span class="vip-chip">⭐ VIP</span>` : ""}
    </div>

    <div class="card-body">
      <div class="username">${user}</div>
      <p class="title">${isOnline ? `En live sur <strong>${game}</strong>` : "Hors ligne"}</p>
      <div class="card-footer">
        <a href="${link}" target="_blank">Regarder</a>
      </div>
    </div>
  `;
  return card;
}

/* -------------------------------------------------------
   CONSTRUCTION + FILTRES
-------------------------------------------------------- */
function buildCardData(allUsers, onlineUsers, usersInfo, vipList) {
  const onlineMap = new Map();
  onlineUsers.forEach(s => onlineMap.set(s.user_login.toLowerCase(), s));

  const infoMap = new Map();
  usersInfo.forEach(i => infoMap.set(i.login.toLowerCase(), i));

  NF_CARD_DATA = allUsers
    .map(u => {
      const lower = u.toLowerCase();
      const stream = onlineMap.get(lower);
      return {
        user: u,
        lower,
        isOnline: !!stream,
        streamData: stream,
        userInfo: infoMap.get(lower),
        isVip: vipList.includes(lower),
        gameName: stream?.game_name?.toLowerCase() || ""
      };
    })
    .sort((a, b) => (a.isVip && !b.isVip ? -1 : b.isVip && !a.isVip ? 1 : 0));
}

function applyFiltersAndRender() {
  if (!NF_LIVE_CONTAINER || !NF_OFFLINE_CONTAINER) return;
  NF_LIVE_CONTAINER.innerHTML = "";
  NF_OFFLINE_CONTAINER.innerHTML = "";

  for (const d of NF_CARD_DATA) {
    if (NF_FILTER.search && !d.lower.includes(NF_FILTER.search)) continue;
    if (d.isOnline && NF_FILTER.game !== "all" && d.gameName !== NF_FILTER.game) continue;

    const card = createUserCard(d);
    (d.isOnline ? NF_LIVE_CONTAINER : NF_OFFLINE_CONTAINER).appendChild(card);
  }
}

function setupLiveFilters(onlineUsers) {
  const searchInput = document.getElementById("search-member");
  const gameSelect = document.getElementById("filter-game");

  if (gameSelect) {
    const games = [...new Set(onlineUsers.map(s => s.game_name).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));

    gameSelect.innerHTML =
      `<option value="all">🎮 Tous les jeux</option>` +
      games.map(g => `<option value="${g.toLowerCase()}">${g}</option>`).join("");

    gameSelect.addEventListener("change", e => {
      NF_FILTER.game = e.target.value;
      applyFiltersAndRender();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", e => {
      NF_FILTER.search = e.target.value.toLowerCase();
      applyFiltersAndRender();
    });
  }
}

/* -------------------------------------------------------
   🎤 Typing effect Twitch — Conseils TENF
-------------------------------------------------------- */
function initTipsRotator() {
  const el = document.querySelector(".nf-tips-text");
  if (!el) return;

  let i = 0;
  let char = 0;
  let deleting = false;

  function type() {
    const text = NF_TIPS[i];

    if (!deleting) {
      el.textContent = text.slice(0, char + 1);
      char++;
      if (char === text.length) deleting = true;
    } else {
      el.textContent = text.slice(0, char - 1);
      char--;
      if (char === 0) {
        deleting = false;
        i = (i + 1) % NF_TIPS.length;
      }
    }

    setTimeout(type, deleting ? 40 : 55);
  }

  type();
}

/* -------------------------------------------------------
   MINI LECTEURS SURVOL
-------------------------------------------------------- */
const HOVER_MAX = 2;
const hoverPlayers = new Map();
const hoverTimers = new Map();

function makeIframeSrc(channel) {
  const p = new URLSearchParams({
    channel,
    parent: window.location.hostname,
    autoplay: "true",
    muted: "true"
  });
  return "https://player.twitch.tv/?" + p;
}

function mountHover(mediaWrap, login) {
  if (hoverPlayers.has(mediaWrap)) return;

  if (hoverPlayers.size >= HOVER_MAX) {
    const first = hoverPlayers.keys().next().value;
    unmountHover(first);
  }

 function mountHover(mediaWrap, login) {
  if (hoverPlayers.has(mediaWrap)) return;

  if (hoverPlayers.size >= HOVER_MAX) {
    const first = hoverPlayers.keys().next().value;
    unmountHover(first);
  }

  const img = mediaWrap.querySelector(".card-thumb");
  if (img) img.style.opacity = "0";

  const iframe = document.createElement("iframe");
  iframe.allow = "autoplay; picture-in-picture";
  iframe.src = makeIframeSrc(login);
  iframe.style.cssText = `
    position:absolute;
    inset:0;
    width:100%;
    height:100%;
    border:0;
    border-radius:.6rem;
  `;

  mediaWrap.appendChild(iframe);
  hoverPlayers.set(mediaWrap, iframe);
}

  iframe.style.cssText = `
    position:absolute;
    inset:0;
    width:100%;
    height:100%;
    border:0;
    border-radius:.6rem;
  `;

  mediaWrap.appendChild(iframe);
  hoverPlayers.set(mediaWrap, iframe);
}

function unmountHover(mediaWrap) {
  const iframe = hoverPlayers.get(mediaWrap);
  if (iframe) iframe.remove();
  hoverPlayers.delete(mediaWrap);

  const img = mediaWrap.querySelector(".card-thumb");
  if (img) img.style.opacity = "1";
}

function setupHoverPreviews() {
  const isTouch = matchMedia("(pointer: coarse)").matches;
  if (isTouch) return;

  document.querySelectorAll(".user-card.is-live .media-wrap").forEach((wrap) => {
    const card = wrap.closest(".user-card");
    const login = card.dataset.login || card.querySelector(".username")?.textContent.toLowerCase();
    if (!login) return;

    wrap.addEventListener("mouseenter", () => {
      const timer = setTimeout(() => mountHover(wrap, login), 250);
      hoverTimers.set(wrap, timer);
    });

    wrap.addEventListener("mouseleave", () => {
      const timer = hoverTimers.get(wrap);
      if (timer) clearTimeout(timer);
      hoverTimers.delete(wrap);
      unmountHover(wrap);
    });
  });
}

/* -------------------------------------------------------
   BARRE LIVE (avatars scrollables)
-------------------------------------------------------- */
function renderLiveStrip(onlineUsers, usersInfo) {
  const section = document.getElementById("live-strip");
  const inner = document.getElementById("live-strip-inner");
  if (!section || !inner) return;

  inner.innerHTML = "";

  if (!onlineUsers.length) {
    section.hidden = true;
    return;
  }

  const infoMap = new Map();
  usersInfo.forEach(u => infoMap.set(u.login.toLowerCase(), u));

  onlineUsers.forEach(s => {
    const login = s.user_login.toLowerCase();
    const info = infoMap.get(login);
    const display = info?.display_name || login;
    const avatar = info?.profile_image_url;

    const a = document.createElement("a");
    a.className = "live-chip";
    a.href = `https://twitch.tv/${login}`;
    a.target = "_blank";

    a.innerHTML = `
      <img class="live-chip__avatar" src="${avatar}" alt="">
      <div class="live-chip__texts">
        <span class="live-chip__name">${display}<span class="live-chip__dot"></span></span>
        <span class="live-chip__game">${s.game_name || ""}</span>
      </div>
    `;

    inner.appendChild(a);
  });

  section.hidden = false;
}

/* -------------------------------------------------------
   ⭐ Mise en avant basée sur featured.json uniquement
-------------------------------------------------------- */
async function renderFeaturedLive(onlineUsers, usersInfo) {
  const featuredSection = document.getElementById("featured-live");
  if (!featuredSection) return;

  // 1) Charger le planning des mises en avant
  let featuredData = [];
  try {
    const res = await fetch("featured.json", { cache: "no-store" });
    if (res.ok) featuredData = await res.json();
  } catch {}

  if (!featuredData.length) {
    featuredSection.style.display = "none";
    return;
  }

  // 2) Trouver la mise en avant du jour
  const today = new Date().toISOString().slice(0, 10); // format YYYY-MM-DD
  const todayFeatured = featuredData.find(f => f.date.slice(0, 10) === today);

  if (!todayFeatured) {
    // Personne prévu aujourd’hui → pas de mise en avant
    featuredSection.style.display = "none";
    return;
  }

  // 3) Vérifier si ce streamer est en live
  const login = todayFeatured.user.toLowerCase();
  const stream = onlineUsers.find(s => s.user_login.toLowerCase() === login);

  if (!stream) {
    // programmé mais PAS live → on n'affiche rien
    featuredSection.style.display = "none";
    return;
  }

  // 4) On récupère les infos du streamer
  const info = usersInfo.find(u => u.login.toLowerCase() === login);
  const display = info?.display_name || login;

  // 5) Remplissage UI
  document.getElementById("featured-user").textContent = "@" + display;
  document.getElementById("featured-stream-title").textContent = stream.title;
  document.getElementById("featured-game").textContent = stream.game_name || "-";
  document.getElementById("featured-viewers").textContent = "👁️ " + stream.viewer_count;

  const link = document.getElementById("featured-link");
  link.href = `https://twitch.tv/${login}`;

  const thumb = stream.thumbnail_url
    .replace("{width}", "1280")
    .replace("{height}", "720");
  document.getElementById("featured-bg").style.backgroundImage = `url("${thumb}")`;

  // 6) player
  const player = document.getElementById("featured-player");
  player.innerHTML = "";
  const iframe = document.createElement("iframe");
  iframe.src = `https://player.twitch.tv/?channel=${login}&parent=${window.location.hostname}&muted=true`;
  iframe.allow = "autoplay; picture-in-picture";
  iframe.style.cssText = "width:100%;height:100%;border:0;";
  player.appendChild(iframe);
  player.style.display = "block";

  featuredSection.style.display = "block";
}


/* -------------------------------------------------------
   CALCUL DES STATS DISCORD / LIVES
-------------------------------------------------------- */
async function loadStats() {
  try {
    const res = await fetch("/.netlify/functions/stats", { cache: "no-store" });
    if (!res.ok) {
      console.warn("⚠ Impossible de charger /stats :", res.status);
      return;
    }
    const stats = await res.json();

    setStatValue("stat-members", stats.members ?? 0);
    setStatValue("stat-actifs", stats.active ?? 0);
    setStatValue("stat-lives", stats.liveAvg ?? 0);
    setStatValue("stat-events", stats.events ?? 0);

    const liveCountEl = document.getElementById("nf-live-count");
    const liveTextEl = document.getElementById("live-count");
    if (liveCountEl) liveCountEl.textContent = stats.liveNow ?? 0;
    if (liveTextEl) liveTextEl.textContent = "live(s) en cours";
  } catch (err) {
    console.error("❌ Erreur lors du chargement des stats :", err);
  }
}

function setStatValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value;
}



/* -------------------------------------------------------
   INIT PRINCIPALE
-------------------------------------------------------- */
async function init() {
  setupThemeToggle();
  await getToken();
  if (!token) return;

  // Users + VIP
  const [allUsers, vipList] = await Promise.all([
    fetchUserLists(),
    fetchVIPList()
  ]);

  const usersInfo = await fetchUsersInfo(allUsers);

  // Streams
  const chunks = [allUsers.slice(0, 100), allUsers.slice(100)];
  const onlineUsers = (
    await Promise.all(chunks.map(c => fetchStreams(c)))
  ).flatMap(r => r.data || []);

  // Conteneurs
  NF_LIVE_CONTAINER = document.getElementById("live-users");
  NF_OFFLINE_CONTAINER = document.getElementById("offline-users");

  if (!NF_LIVE_CONTAINER || !NF_OFFLINE_CONTAINER) {
    console.error("❌ Conteneurs de cartes manquants.");
    return;
  }

  // Cartes
  buildCardData(allUsers, onlineUsers, usersInfo, vipList);
  applyFiltersAndRender();
  setupLiveFilters(onlineUsers);

  // Barre live
  renderLiveStrip(onlineUsers, usersInfo);

  // Mise en avant
  await renderFeaturedLive(onlineUsers, usersInfo);


  // Hover players
  setupHoverPreviews();

  // Stats Discord / Lives
  loadStats();

  // Conseils typing
  initTipsRotator();
}

/* -------------------------------------------------------
   GO !
-------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", init);


