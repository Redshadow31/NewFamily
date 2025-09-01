/* ===========================
   VIP Élites — Page (mur équitable)
   Compatible avec ton HTML :
   - #vip-users : grille
   - #vip-month : tag du mois
   - #vip-count : compteur global (optionnel)
   - .vip-toolbar [data-sort] : tri (optionnel)
   =========================== */

const CLIENT_ID = "rr75kdousbzbp8qfjy0xtppwpljuke";
const ymKey = new Date().toISOString().slice(0, 7); // "YYYY-MM"

const STORAGE_PREFIX = `vip_${ymKey}_applause_`;
const CLICK_SUFFIX = "_clicked";

// ---------- Helpers ----------
const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];
const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
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
const getApplause = (id) =>
  parseInt(localStorage.getItem(applauseKey(id)) || "0", 10);
const hasApplauded = (id) =>
  localStorage.getItem(applauseClickedKey(id)) === "1";
const incApplause = (id) => {
  const k = applauseKey(id);
  const v = getApplause(id) + 1;
  localStorage.setItem(k, String(v));
  localStorage.setItem(applauseClickedKey(id), "1");
  return v;
};

// ---------- Fetch: VIP JSON + Twitch ----------
async function fetchVIPListRaw() {
  const res = await fetch("vip.json", { cache: "no-store" });
  if (!res.ok) throw new Error(`vip.json: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("vip.json doit être un tableau");
  return data;
}

async function fetchToken() {
  const res = await fetch("/.netlify/functions/getTwitchData", {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`getTwitchData: ${res.status}`);
  const data = await res.json();
  if (!data?.access_token) throw new Error("Token manquant");
  return data.access_token;
}

async function fetchUsersInfo(logins) {
  if (!logins.length) return [];
  const token = await fetchToken();
  const size = 90;
  const chunks = [];
  for (let i = 0; i < logins.length; i += size) chunks.push(logins.slice(i, i + size));
  const results = [];
  for (const chunk of chunks) {
    const query = chunk.map((l) => `login=${encodeURIComponent(l)}`).join("&");
    const url = `https://api.twitch.tv/helix/users?${query}`;
    const res = await fetch(url, {
      headers: { "Client-ID": CLIENT_ID, Authorization: "Bearer " + token },
    });
    if (!res.ok) throw new Error(`helix/users: ${res.status}`);
    const json = await res.json();
    results.push(...(json.data || []));
  }
  return results;
}

async function fetchLiveStatus(userIds) {
  // Map { user_id: {live, title, game_name, viewer_count} }
  if (!userIds.length) return {};
  const token = await fetchToken();
  const size = 90;
  const chunks = [];
  for (let i = 0; i < userIds.length; i += size) chunks.push(userIds.slice(i, i + size));
  const liveMap = {};
  for (const chunk of chunks) {
    const query = chunk.map((id) => `user_id=${encodeURIComponent(id)}`).join("&");
    const url = `https://api.twitch.tv/helix/streams?${query}`;
    const res = await fetch(url, {
      headers: { "Client-ID": CLIENT_ID, Authorization: "Bearer " + token },
    });
    if (!res.ok) throw new Error(`helix/streams: ${res.status}`);
    const json = await res.json();
    (json.data || []).forEach((s) => {
      liveMap[s.user_id] = {
        live: true,
        title: s.title || "",
        game_name: s.game_name || "",
        viewer_count: s.viewer_count || 0,
      };
    });
  }
  return liveMap;
}

// ---------- Normalisation ----------
function normalizeVipEntries(rawList) {
  // Retourne { logins: [...], metaMap: {login: {month, badges?, quote?, image?, banner?}} }
  const metaMap = {};
  const logins = rawList.map((item) => {
    if (typeof item === "string") {
      const login = item.toLowerCase();
      metaMap[login] = {}; // pas de month par défaut => non affiché si pas fourni
      return login;
    }
    const login = String(item.login || item.name || "").toLowerCase();
    metaMap[login] = {
      month: item.month || undefined,
      badges: Array.isArray(item.badges) ? item.badges : undefined,
      quote: item.quote || undefined,
      image: item.image || item.avatar || undefined,
      banner: item.banner || item.cover || undefined,
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
      id: u.id,
      login,
      display_name: u.display_name || u.login,
      bio: u.description || "",
      avatar: u.profile_image_url || "",
      banner: meta.banner || u.offline_image_url || "",
      image: meta.image || u.profile_image_url || "",
      badges: meta.badges || [],
      quote: meta.quote || "",
      month: meta.month,
      isLive: false,
      liveData: null,
    };
  });
}

// ---------- Rendu ----------
function liveDotHTML(isLive) {
  return isLive
    ? `<span class="live-dot"><span class="dot"></span> LIVE</span>`
    : "";
}

function cardHTML(v) {
  const img = v.image || v.avatar || v.banner || "assets/placeholder.webp";
  const clicked = hasApplauded(v.login);
  const applause = getApplause(v.login);
  return `
    <article class="user-card vip-card">
      <div class="media-wrap vip-media">
        ${liveDotHTML(v.isLive)}
        <img src="${img}" alt="${escapeHtml(v.display_name)}">
      </div>
      <div class="card-body vip-body">
        <div class="username">
          <a href="https://twitch.tv/${v.login}" target="_blank" rel="noopener">${escapeHtml(v.display_name)}</a>
        </div>
        ${v.bio ? `<p class="vip-bio">${escapeHtml(v.bio)}</p>` : ""}
        ${v.badges?.length ? `<div class="vip-badges">${v.badges.map(b => `<span class="vip-badge">${escapeHtml(b)}</span>`).join("")}</div>` : ""}
        <div class="vip-actions">
          <a class="about-button" href="https://twitch.tv/${v.login}" target="_blank" rel="noopener">Voir la chaîne</a>
          <button class="vip-applaud" type="button" aria-pressed="${clicked ? "true" : "false"}" data-id="${v.login}">
            👏 <span class="vip-count">${applause}</span>
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderWall(vips) {
  const grid = $("#vip-users");
  if (!grid) return;
  grid.innerHTML = vips.map(cardHTML).join("");
}

function updateStats(vips) {
  const el = $("#vip-count");
  if (!el) return; // bloc optionnel
  const totalVip = vips.length;
  const totalApplause = vips.reduce((sum, v) => sum + getApplause(v.login), 0);
  el.innerHTML = `👏 <strong>${totalApplause}</strong> applaudissements ont déjà été donnés à nos <strong>${totalVip}</strong> VIP du mois <span class="vip-month">(${ymKey})</span> 🎉`;
}

function sortVips(vips, mode) {
  if (mode === "applause") {
    return [...vips].sort(
      (a, b) => getApplause(b.login) - getApplause(a.login) || a.display_name.localeCompare(b.display_name)
    );
  }
  if (mode === "live") {
    return [...vips].sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      return a.display_name.localeCompare(b.display_name);
    });
  }
  return shuffle(vips); // aléatoire neutre
}

// ---------- Main ----------
async function main() {
  try {
    // Affiche le mois dans le bandeau si #vip-month existe
    const monthEl = $("#vip-month");
    if (monthEl) monthEl.textContent = ymKey;

    const raw = await fetchVIPListRaw();
    const { logins, metaMap } = normalizeVipEntries(raw);

    // Filtre strict : uniquement month === "YYYY-MM"
    const thisMonthLogins = Object.entries(metaMap)
      .filter(([login, meta]) => meta.month === ymKey)
      .map(([login]) => login);

    if (!thisMonthLogins.length) {
      $("#vip-users")?.insertAdjacentHTML(
        "beforeend",
        `<p style="text-align:center;margin:1rem 0;">Aucun VIP pour ${ymKey}.</p>`
      );
      updateStats([]);
      return;
    }

    // Récup Twitch (users + LIVE)
    const usersInfo = await fetchUsersInfo(thisMonthLogins);
    const vips = mergeUsersWithMeta(usersInfo, metaMap).filter((v) => v.month === ymKey);
    const liveMap = await fetchLiveStatus(vips.map((v) => v.id));
    vips.forEach((v) => {
      const l = liveMap[v.id];
      if (l?.live) {
        v.isLive = true;
        v.liveData = l;
      }
    });

    // Tri initial : LIVE d’abord
    let state = sortVips(vips, "live");

    // Rendu
    renderWall(state);
    updateStats(state);

    // Applaudissements (délégué)
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".vip-applaud");
      if (!btn) return;
      const id = btn.dataset.id;
      if (hasApplauded(id)) return;
      const val = incApplause(id);
      btn.setAttribute("aria-pressed", "true");
      const span = btn.querySelector(".vip-count");
      if (span) span.textContent = String(val);
      updateStats(state);
    });

    // Tri interactif si .vip-toolbar existe
    $$(".vip-toolbar [data-sort]").forEach((b) => {
      b.addEventListener("click", () => {
        const mode = b.getAttribute("data-sort");
        state = sortVips(vips, mode);
        renderWall(state);
        updateStats(state);
      });
    });
  } catch (e) {
    console.error(e);
    $("#vip-users")?.insertAdjacentHTML(
      "beforeend",
      `<p style="text-align:center;margin:1rem 0;">Erreur de chargement de la page VIP.</p>`
    );
  }
}

document.addEventListener("DOMContentLoaded", main);

