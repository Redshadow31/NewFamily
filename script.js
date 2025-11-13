/* =========================================================
   New Family — script.js (2025 CLEAN VERSION)
   * Recherche par pseudo
   * Filtre par jeu
   * Mini lecteur hover
   * Badges VIP / Staff
   * Barre live dynamique
========================================================= */

/* === Mois courant (pour VIP filtrés) === */
const CURRENT_MONTH = new Date().toISOString().slice(0, 7);

const clientId = "rr75kdousbzbp8qfjy0xtppwpljuke";
let token = "";

/* Données globales */
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

    Object.assign(btn.style, {
      position: "absolute",
      top: "1rem",
      right: "1rem",
      background: "var(--surface)",
      color: "var(--text)",
      border: "1px solid var(--border)",
      borderRadius: "50%",
      width: "42px",
      height: "42px",
      fontSize: "1.1rem",
      cursor: "pointer",
      boxShadow: "var(--shadow)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "background .2s ease, transform .2s ease"
    });

    const header = document.querySelector("header") || document.body;
    if (!header.style.position) header.style.position = "relative";
    header.appendChild(btn);
  }

  const updateIcon = () => {
    const isDark = document.documentElement.classList.contains(THEME_CLASS);
    btn.textContent = isDark ? "☀️" : "🌙";
    btn.title = isDark ? "Passer en mode clair" : "Passer en mode sombre";
  };

  updateIcon();

  btn.addEventListener("click", () => {
    const root = document.documentElement;
    root.classList.toggle(THEME_CLASS);
    const isDark = root.classList.contains(THEME_CLASS);
    localStorage.setItem("theme", isDark ? "dark" : "light");
    updateIcon();
  });
}

/* -------------------------------------------------------
   AUTH Twitch
-------------------------------------------------------- */
async function getToken() {
  try {
    const response = await fetch("/.netlify/functions/getTwitchData");
    if (!response.ok) return console.error("❌ Token Twitch inaccessible.");

    const data = await response.json();
    token = data.access_token;
  } catch (e) {
    console.error("❌ Impossible d'obtenir le token Twitch.");
  }
}
const NF_TIPS = [
  "Le live gagnant TENF n’est pas un boost de statistiques, c’est une vitrine pour présenter ta chaîne, ton univers et ta personnalité à toute la communauté.",
  "Chaque soutien compte : un simple lurk, un passage rapide ou un petit coucou, c’est déjà beaucoup pour montrer que tu es là pour les autres.",
  "Discuter sur Discord, réagir et prendre des nouvelles, c’est déjà faire connaître ton stream. Plus on te voit ici, plus on a envie de te découvrir en live.",
  "À TENF, nous sommes des collègues de stream avant d’être des viewers. Le jeu est secondaire : l’important, c’est de se soutenir et de progresser ensemble.",
  "Un serveur d’entraide n’est pas une baguette magique. Ta progression se construit avec le temps, la régularité et les liens que tu crées avec les autres.",
  "Nous avons dépassé les 400 membres, mais seuls les actifs dans l’entraide sont mis en avant. Les autres restent de la famille, sans pression ni obligation.",
  "Bienveillance et entraide : se tourner vers les autres, c’est aussi se donner à soi-même plus de chances de grandir… même en plein live."
];
/* -------------------------------------------------------
   🔁 Rotation des conseils communautaires
-------------------------------------------------------- */
function initTipsRotator() {
  const el = document.querySelector(".nf-tips-text");
  if (!el || !NF_TIPS.length) return;

  let index = 0;
  el.textContent = NF_TIPS[index];

  setInterval(() => {
    index = (index + 1) % NF_TIPS.length;

    el.classList.add("is-fading");
    setTimeout(() => {
      el.textContent = NF_TIPS[index];
      el.classList.remove("is-fading");
    }, 300);
  }, 9000); // change toutes les 9 secondes
}

/* -------------------------------------------------------
   Chargement liste users
-------------------------------------------------------- */
async function fetchUserLists() {
  const files = ["users1.json", "users2.json", "users3.json"];
  const allUsers = [];

  for (const file of files) {
    try {
      const res = await fetch(file);
      if (!res.ok) throw new Error("fichier manquant");
      const data = await res.json();
      allUsers.push(...data);
    } catch (err) {
      console.warn("⚠️ Impossible de charger :", file);
    }
  }

  return [...new Set(allUsers.map(u => u.toLowerCase()))];
}

/* -------------------------------------------------------
   Streams en live
-------------------------------------------------------- */
async function fetchStreams(logins) {
  if (!logins?.length) return { data: [] };

  const query = logins.map(u => `user_login=${encodeURIComponent(u)}`).join("&");
  const url = `https://api.twitch.tv/helix/streams?${query}`;

  try {
    const res = await fetch(url, {
      headers: {
        "Client-ID": clientId,
        Authorization: "Bearer " + token
      }
    });

    if (!res.ok) return { data: [] };
    return await res.json();
  } catch {
    return { data: [] };
  }
}

/* -------------------------------------------------------
   Infos users Twitch
-------------------------------------------------------- */
async function fetchUsersInfo(allUsers) {
  const results = [];
  for (let i = 0; i < allUsers.length; i += 100) {
    const chunk = allUsers.slice(i, i + 100);
    const query = chunk.map(u => `login=${u}`).join("&");

    try {
      const res = await fetch(`https://api.twitch.tv/helix/users?${query}`, {
        headers: {
          "Client-ID": clientId,
          Authorization: "Bearer " + token
        }
      });

      if (res.ok) {
        const { data } = await res.json();
        results.push(...data);
      }
    } catch {}
  }
  return results;
}

/* -------------------------------------------------------
   VIP DU MOIS
-------------------------------------------------------- */
async function fetchVIPList() {
  try {
    const res = await fetch("vip.json", { cache: "no-store" });
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
      .filter(v => v.month === CURRENT_MONTH)
      .map(v => v.login.toLowerCase());
  } catch {
    return [];
  }
}

/* -------------------------------------------------------
   Badges Staff
-------------------------------------------------------- */
function getRoleBadge(user) {
  const u = user.toLowerCase();

  if (["clarastonewall", "nexou31", "red_shadow_31"].includes(u))
    return `<span class="badge badge--founder">🔮 Fondateur</span>`;

  if (["selena_akemi", "nangel89", "tabs_up", "jenny31200"].includes(u))
    return `<span class="badge badge--adjoint">🏛️ Adjoint</span>`;

  if (["mahyurah","livio_on","rubbycrea","leviacarpe","yaya_romali","thedark_sand","gilbert_hime","saikossama"]
      .includes(u))
    return `<span class="badge badge--mentor">🛡️ Mentor</span>`;

  if (["lespydyverse","mcaliena","mcfly_59140"].includes(u))
    return `<span class="badge badge--junior">🔧 Junior</span>`;

  return "";
}

/* -------------------------------------------------------
   Construction carte membre
-------------------------------------------------------- */
function createUserCard({ user, isOnline, streamData, userInfo, isVip }) {
  const card = document.createElement("div");
  card.classList.add("user-card");
  if (isVip) card.classList.add("vip");
  if (isOnline) {
    card.classList.add("is-live");
    card.dataset.login = user.toLowerCase();
  } else {
    card.classList.add("offline");
  }

  const link = `https://twitch.tv/${user}`;
  const game = isOnline ? (streamData.game_name || "En live") : "";
  const img = isOnline
    ? streamData.thumbnail_url.replace("{width}", "320").replace("{height}", "180")
    : (userInfo?.profile_image_url || "https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_600x600.png");

  const title = isOnline
    ? `En live sur <strong>${escapeHtml(game)}</strong>`
    : "Hors ligne";

  card.innerHTML = `
    <div class="media-wrap">
      <img class="card-thumb" src="${img}" alt="">
      ${getRoleBadge(user)}
      ${isVip ? `<span class="vip-chip">⭐ VIP</span>` : ""}
    </div>

    <div class="card-body">
      <div class="username">${escapeHtml(user)}</div>
      <p class="title">${title}</p>
      <div class="card-footer">
        <a href="${link}" target="_blank">Regarder</a>
      </div>
    </div>
  `;

  return card;
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/* -------------------------------------------------------
   Construction DATA + Filtres
-------------------------------------------------------- */
function buildCardData(allUsers, onlineUsers, usersInfo, vipList) {
  const onlineMap = new Map();
  onlineUsers.forEach(s => onlineMap.set(s.user_login.toLowerCase(), s));

  const infoMap = new Map();
  usersInfo.forEach(i => infoMap.set(i.login.toLowerCase(), i));

  NF_CARD_DATA = allUsers
    .sort((a,b) => vipList.includes(a) ? -1 : (vipList.includes(b) ? 1 : 0))
    .map(user => {
      const lower = user.toLowerCase();
      const stream = onlineMap.get(lower) || null;
      return {
        user,
        lower,
        isOnline: !!stream,
        streamData: stream,
        userInfo: infoMap.get(lower) || null,
        isVip: vipList.includes(lower),
        gameName: stream?.game_name?.toLowerCase() || ""
      };
    });
}

function applyFiltersAndRender() {
  if (!NF_LIVE_CONTAINER || !NF_OFFLINE_CONTAINER) return;

  NF_LIVE_CONTAINER.innerHTML = "";
  NF_OFFLINE_CONTAINER.innerHTML = "";

  const search = NF_FILTER.search.toLowerCase();
  const game = NF_FILTER.game.toLowerCase();

  NF_CARD_DATA.forEach(data => {
    if (search && !data.lower.includes(search)) return;
    if (data.isOnline && game !== "all" && data.gameName !== game) return;

    const card = createUserCard(data);
    (data.isOnline ? NF_LIVE_CONTAINER : NF_OFFLINE_CONTAINER).appendChild(card);
  });

  setupHoverPreviews();
}

function setupLiveFilters(onlineUsers) {
  const searchInput = document.getElementById("search-member");
  const gameSelect = document.getElementById("filter-game");

  /* JEUX uniques */
  const games = [...new Set(onlineUsers.map(s => s.game_name).filter(Boolean))]
    .sort((a,b) => a.localeCompare(b));

  if (gameSelect) {
    gameSelect.innerHTML = `<option value="all">🎮 Tous les jeux</option>` +
      games.map(g => `<option value="${g.toLowerCase()}">${g}</option>`).join("");

    gameSelect.addEventListener("change", e => {
      NF_FILTER.game = e.target.value;
      applyFiltersAndRender();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", e => {
      NF_FILTER.search = e.target.value;
      applyFiltersAndRender();
    });
  }
}
/* -------------------------------------------------------
   🧩 Mini lecteurs survol — Hover Twitch Players
-------------------------------------------------------- */
const HOVER_MAX_PLAYERS = 2;
const hoverPlayers = new Map();
const hoverTimers = new Map();

function makeIframeSrc(channel) {
  const params = new URLSearchParams({
    channel,
    parent: window.location.hostname.replace(/^www\./, ""),
    autoplay: "true",
    muted: "true",
    controls: "false"
  });
  return "https://player.twitch.tv/?" + params.toString();
}

function mountHoverPlayer(mediaWrap, login) {
  if (hoverPlayers.has(mediaWrap)) return;

  // Limite joueurs simultanés
  if (hoverPlayers.size >= HOVER_MAX_PLAYERS) {
    const first = hoverPlayers.keys().next().value;
    unmountHoverPlayer(first);
  }

  const img = mediaWrap.querySelector(".card-thumb");
  if (img) img.style.opacity = "0";

  const iframe = document.createElement("iframe");
  iframe.allow = "autoplay; encrypted-media; picture-in-picture";
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
  if (iframe) iframe.remove();
  hoverPlayers.delete(mediaWrap);

  const img = mediaWrap.querySelector(".card-thumb");
  if (img) img.style.opacity = "1";
}

function setupHoverPreviews() {
  const isTouch = matchMedia("(pointer: coarse)").matches;
  if (isTouch) return;

  const cards = document.querySelectorAll(".user-card.is-live .media-wrap");

  cards.forEach(mediaWrap => {
    const card = mediaWrap.closest(".user-card");
    const login = card?.dataset?.login;
    if (!login) return;

    mediaWrap.onmouseenter = () => {
      const t = setTimeout(() => mountHoverPlayer(mediaWrap, login), 250);
      hoverTimers.set(mediaWrap, t);
    };

    mediaWrap.onmouseleave = () => {
      const t = hoverTimers.get(mediaWrap);
      if (t) clearTimeout(t);
      hoverTimers.delete(mediaWrap);
      unmountHoverPlayer(mediaWrap);
    };
  });
}

/* -------------------------------------------------------
   ⭐ Barre horizontale des lives (avatars)
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
    const display = info?.display_name || s.user_name || login;
    const avatar = info?.profile_image_url;

    const a = document.createElement("a");
    a.className = "live-chip";
    a.href = `https://twitch.tv/${login}`;
    a.target = "_blank";

    a.innerHTML = `
      <img class="live-chip__avatar" src="${avatar}" alt="">
      <div class="live-chip__texts">
        <span class="live-chip__name">${display}<span class="live-chip__dot"></span></span>
        <span class="live-chip__game">${s.game_name || "En live"}</span>
      </div>
    `;

    inner.appendChild(a);
  });

  section.hidden = false;
}

/* -------------------------------------------------------
   🚀 INIT PRINCIPALE
-------------------------------------------------------- */
async function init() {
  setupThemeToggle();

  await getToken();
  if (!token) {
    console.error("❌ Token Twitch non récupéré.");
    return;
  }

  // Chargement users
  const [allUsers, vipList] = await Promise.all([
    fetchUserLists(),
    fetchVIPList()
  ]);

  const usersInfo = await fetchUsersInfo(allUsers);

  // Streams live
  const chunks = [allUsers.slice(0, 100), allUsers.slice(100)];
  const onlineUsers = (
    await Promise.all(chunks.map(c => fetchStreams(c)))
  ).flatMap(res => res.data || []);

  // Mise en place des conteneurs
  NF_LIVE_CONTAINER = document.getElementById("live-users");
  NF_OFFLINE_CONTAINER = document.getElementById("offline-users");

  if (!NF_LIVE_CONTAINER || !NF_OFFLINE_CONTAINER) {
    console.error("❌ Conteneurs de cartes manquants.");
    return;
  }

  // Construction données
  buildCardData(allUsers, onlineUsers, usersInfo, vipList);

  // Setup filtres recherche + jeu
  setupLiveFilters(onlineUsers);

  // Rendu initial des cartes
  applyFiltersAndRender();

  // Barre live
  renderLiveStrip(onlineUsers, usersInfo);

  // Hover players
  setupHoverPreviews();
}
  // Barre live
  renderLiveStrip(onlineUsers, usersInfo);

  // Hover players
  setupHoverPreviews();

  // Conseils communautaires TENF
  initTipsRotator();
}

/* -------------------------------------------------------
   GO !
-------------------------------------------------------- */
init();
