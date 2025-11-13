/* ===========================
   VIP Élites — Multi-mois
   =========================== */

const CLIENT_ID = "rr75kdousbzbp8qfjy0xtppwpljuke";

// Mois courant
let currentMonth = new Date().toISOString().slice(0, 7);

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

// ---------- Applaudissements avec historique par mois ----------
const STORAGE_PREFIX = `vip_applause_`; // fixe

const applauseKey = (id, month = currentMonth) =>
  `${STORAGE_PREFIX}${month}_${id.toLowerCase()}`;
const applauseClickedKey = (id, month = currentMonth) =>
  applauseKey(id, month) + "_clicked";

const getApplause = (id, month = currentMonth) =>
  parseInt(localStorage.getItem(applauseKey(id, month)) || "0", 10);

const hasApplauded = (id, month = currentMonth) =>
  localStorage.getItem(applauseClickedKey(id, month)) === "1";

const incApplause = (id, month = currentMonth) => {
  const key = applauseKey(id, month);
  const newVal = getApplause(id, month) + 1;
  localStorage.setItem(key, String(newVal));
  localStorage.setItem(applauseClickedKey(id, month), "1");
  return newVal;
};

// ---------- Fetch JSON + Twitch ----------
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
  return data?.access_token;
}

async function fetchUsersInfo(logins) {
  if (!logins.length) return [];

  const token = await fetchToken();
  const size = 90;
  const chunks = [];

  for (let i = 0; i < logins.length; i += size)
    chunks.push(logins.slice(i, i + size));

  const results = [];

  for (const ch of chunks) {
    const query = ch.map((l) => `login=${encodeURIComponent(l)}`).join("&");
    const res = await fetch(
      `https://api.twitch.tv/helix/users?${query}`,
      {
        headers: {
          "Client-ID": CLIENT_ID,
          Authorization: "Bearer " + token,
        },
      }
    );
    if (!res.ok) throw new Error(`helix/users: ${res.status}`);
    const json = await res.json();
    results.push(...(json.data || []));
  }
  return results;
}

async function fetchLiveStatus(ids) {
  if (!ids.length) return {};

  const token = await fetchToken();
  const size = 90;
  const chunks = [];

  for (let i = 0; i < ids.length; i += size)
    chunks.push(ids.slice(i, i + size));

  const liveMap = {};

  for (const ch of chunks) {
    const query = ch.map((id) => `user_id=${id}`).join("&");
    const res = await fetch(
      `https://api.twitch.tv/helix/streams?${query}`,
      {
        headers: {
          "Client-ID": CLIENT_ID,
          Authorization: "Bearer " + token,
        },
      }
    );
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
  const metaMap = {};
  rawList.forEach((item) => {
    const login = item.login.toLowerCase();
    metaMap[login] = {
      month: item.month,
    };
  });
  return { metaMap };
}

// Récupère les logins d’un mois donné
function getVipLoginsFor(month, metaMap) {
  return Object.entries(metaMap)
    .filter(([_, meta]) => meta.month === month)
    .map(([login]) => login);
}

function mergeUsersWithMeta(usersInfo, metaMap) {
  return usersInfo.map((u) => {
    const login = u.login.toLowerCase();
    const meta = metaMap[login];
    return {
      id: u.id,
      login,
      display_name: u.display_name,
      bio: u.description || "",
      avatar: u.profile_image_url,
      banner: u.offline_image_url || "",
      month: meta.month,
      isLive: false,
    };
  });
}

// ---------- HTML ----------
function liveDotHTML(isLive) {
  return isLive ? `<span class="live-dot"><span class="dot"></span> LIVE</span>` : "";
}

function cardHTML(v) {
  const img = v.avatar || v.banner || "assets/placeholder.webp";
  const applause = getApplause(v.login, v.month);
  const clicked = hasApplauded(v.login, v.month);

  return `
    <article class="user-card vip-card">
      <div class="media-wrap vip-media">
        ${liveDotHTML(v.isLive)}
        <img src="${img}" alt="${escapeHtml(v.display_name)}">
      </div>
      <div class="card-body vip-body">
        <div class="username">
          <a href="https://twitch.tv/${v.login}" target="_blank">${escapeHtml(v.display_name)}</a>
        </div>

        <div class="vip-actions">
          <a class="about-button" href="https://twitch.tv/${v.login}" target="_blank">Voir la chaîne</a>
          <button class="vip-applaud" aria-pressed="${clicked}" data-id="${v.login}">
            👏 <span class="vip-count">${applause}</span>
          </button>
        </div>
      </div>
    </article>`;
}

function renderWall(vips) {
  $("#vip-users").innerHTML = vips.map(cardHTML).join("");
}

function updateStats(vips) {
  const totalVip = vips.length;
  const totalApplause = vips.reduce(
    (sum, v) => sum + getApplause(v.login, v.month),
    0
  );

  $("#vip-count").innerHTML = `👏 <strong>${totalApplause}</strong> applaudissements pour <strong>${totalVip}</strong> VIP (${currentMonth})`;
}

// ---------- Tri ----------
function sortVips(vips, mode) {
  if (mode === "applause") {
    return [...vips].sort(
      (a, b) =>
        getApplause(b.login, b.month) - getApplause(a.login, a.month)
    );
  }
  if (mode === "live") {
    return [...vips].sort((a, b) => (a.isLive ? -1 : 1));
  }
  return shuffle(vips);
}

// ---------- MAIN ----------
async function loadMonth(month, metaMap) {
  currentMonth = month;

  const logins = getVipLoginsFor(month, metaMap);
  if (!logins.length) {
    $("#vip-users").innerHTML = `<p>Aucun VIP pour ${month}</p>`;
    updateStats([]);
    return;
  }

  const usersInfo = await fetchUsersInfo(logins);
  let vips = mergeUsersWithMeta(usersInfo, metaMap);

  const liveMap = await fetchLiveStatus(vips.map((v) => v.id));
  vips.forEach((v) => {
    if (liveMap[v.id]) v.isLive = true;
  });

  vips = sortVips(vips, "live");

  renderWall(vips);
  updateStats(vips);
}

async function main() {
  try {
    const raw = await fetchVIPListRaw();
    const { metaMap } = normalizeVipEntries(raw);

    // Extraire les mois disponibles
    const months = [...new Set(raw.map((i) => i.month))].sort();

    // Remplir sélecteur
    const select = $("#vip-month-select");
    select.innerHTML = months
      .map((m) => `<option value="${m}">${m}</option>`)
      .join("");

    // Sélectionner automatiquement le MOIS LE PLUS RÉCENT
    const lastMonth = months[months.length - 1];
    select.value = lastMonth;
    currentMonth = lastMonth;

    await loadMonth(currentMonth, metaMap);

    select.addEventListener("change", () => {
      loadMonth(select.value, metaMap);
    });

    // Applaudissements
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".vip-applaud");
      if (!btn) return;

      const login = btn.dataset.id;
      if (hasApplauded(login, currentMonth)) return;

      const val = incApplause(login, currentMonth);
      btn.querySelector(".vip-count").textContent = val;
      btn.setAttribute("aria-pressed", "true");

      const vips = []; // recalcul statistique
      updateStats(vips);
    });

  } catch (e) {
    console.error(e);
    $("#vip-users").innerHTML = `<p>Erreur de chargement VIP.</p>`;
  }
}

document.addEventListener("DOMContentLoaded", main);
