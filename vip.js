// ===========================
// VIP Élites – rendu enrichi
// ===========================

const CLIENT_ID = "rr75kdousbzbp8qfjy0xtppwpljuke";

// ---------- Utils ----------
const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

// ---------- Fetch helpers ----------
async function fetchVIPList() {
  // vip.json peut être: ["login1", ...] ou [{login, badges, quote, spotlight, image, banner, title, month}, ...]
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
  // Chunking par sécurité (limite ≈ 100 logins/req)
  const token = await fetchToken();
  const size = 90;
  const chunks = [];
  for (let i = 0; i < logins.length; i += size) chunks.push(logins.slice(i, i + size));

  const results = [];
  for (const chunk of chunks) {
    const query = chunk.map((l) => `login=${encodeURIComponent(l)}`).join("&");
    const url = `https://api.twitch.tv/helix/users?${query}`;
    const res = await fetch(url, {
      headers: {
        "Client-ID": CLIENT_ID,
        Authorization: "Bearer " + token,
      },
    });
    if (!res.ok) throw new Error(`helix/users: ${res.status}`);
    const json = await res.json();
    results.push(...(json.data || []));
  }
  return results;
}

// ---------- Normalisation ----------
function normalizeVipEntries(rawList) {
  // -> { logins: [...], metaMap: { login: {badges, quote, spotlight, image, banner, title, month} } }
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
      spotlight: !!item.spotlight,
      image: item.image || item.avatar || "",
      banner: item.banner || item.cover || "",
      title: item.title || "Membre VIP Élites",
      month: item.month || "",
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
      spotlight: !!meta.spotlight,
      title: meta.title || "Membre VIP Élites",
      month: meta.month || "",
      description: u.description || "", // <- bio Twitch
    };
  });
}

// ================== UI helpers ==================
function monthOptions(containerId) {
  const sel = document.getElementById(containerId);
  if (!sel) return;
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const label = d.toLocaleString("fr-FR", { month: "long", year: "numeric" });
    const opt = document.createElement("option");
    opt.value = `${y}-${m}`;
    opt.textContent = label.charAt(0).toUpperCase() + label.slice(1);
    sel.appendChild(opt);
  }
  sel.value = sel.options[0]?.value || "";
}

function buildBadges(badges) {
  if (!badges || !badges.length) return "";
  return `<div class="vip-badges">
    ${badges.map((b) => `<span class="vip-badge">${escapeHtml(b)}</span>`).join("")}
  </div>`;
}

function buildCTA(login) {
  const twitch = `https://twitch.tv/${login}`;
  const discord = `https://discord.com/channels/@me`; // remplace par le lien de ton salon si besoin
  return `<div class="cta-row">
    <a href="${twitch}" target="_blank" rel="noopener">Voir la chaîne</a>
    <a href="${discord}" target="_blank" rel="noopener">Féliciter sur Discord 🎉</a>
  </div>`;
}

// ---------- Spotlight (avec bio) ----------
function renderSpotlight(vip) {
  const host = document.getElementById("vip-spotlight");
  if (!host || !vip) return;
  const quote = vip.quote ? `<div class="vip-spotlight-quote">“${escapeHtml(vip.quote)}”</div>` : "";
  const bio = vip.description ? `<div class="vip-spotlight-bio">${escapeHtml(vip.description)}</div>` : "";
  host.innerHTML = `
    <article class="vip-spotlight-card">
      <div class="vip-spotlight-media">
        <span class="vip-ribbon">🏆 VIP Élites</span>
        <img src="${vip.banner || vip.image || "assets/placeholder.webp"}" alt="${vip.display_name || vip.login}">
      </div>
      <div class="vip-spotlight-body">
        <div class="vip-spotlight-name">${vip.display_name || vip.login}</div>
        ${quote}
        ${bio}
        <div class="vip-spotlight-actions">
          <a class="vip-btn" href="https://twitch.tv/${vip.login}" target="_blank" rel="noopener">Regarder sur Twitch</a>
          <a class="vip-btn" href="index.html">Découvrir la New Family</a>
        </div>
      </div>
    </article>
  `;
}

// ---------- Grille ----------
function enhanceVipGrid(vips) {
  // affiche la grille (spotlight géré ailleurs pour la rotation)
  const grid = document.getElementById("vip-users");
  if (!grid) return;

  grid.innerHTML = vips
    .map((v) => {
      const login = (v.login || "").toLowerCase();
      const img = v.image || v.avatar || v.banner || "assets/placeholder.webp";
      const title = v.title || "Membre VIP Élites";
      const name = v.display_name || login;
      const quote = v.quote ? `<div class="vip-quote">“${escapeHtml(v.quote)}”</div>` : "";
      return `
        <article class="user-card">
          ${buildBadges(v.badges)}
          <div class="media-wrap">
            <img src="${img}" alt="${name}">
          </div>
          <div class="card-body">
            <div class="username"><a href="https://twitch.tv/${login}" target="_blank" rel="noopener">${name}</a></div>
            <div class="title">⭐ ${title}</div>
            ${quote}
            ${buildCTA(login)}
          </div>
        </article>
      `;
    })
    .join("");
}

// ---------- Rotation automatique du spotlight ----------
let _spotlightTimer = null;
let _spotlightKickoff = null; // kickoff rapide du premier switch
let _spotlightIndex = 0;

function buildSpotlightList(vips) {
  // priorité: spotlight=true, puis présence de badges, puis alpha
  return vips.slice().sort((a, b) => {
    const aS = a.spotlight ? 1 : 0, bS = b.spotlight ? 1 : 0;
    if (bS !== aS) return bS - aS;
    const aB = a.badges && a.badges.length ? 1 : 0;
    const bB = b.badges && b.badges.length ? 1 : 0;
    if (bB !== aB) return bB - aB;
    return (a.display_name || a.login).localeCompare(b.display_name || b.login);
  });
}

function startSpotlightRotation(vips, { intervalMs = 8000, firstDelayMs = 3000 } = {}) {
  const host = document.getElementById("vip-spotlight");
  if (!host || !vips.length) return;

  const list = buildSpotlightList(vips);
  _spotlightIndex = 0;

  const showNext = () => {
    host.classList.add("is-fading");
    setTimeout(() => {
      renderSpotlight(list[_spotlightIndex]);
      host.classList.remove("is-fading");
      _spotlightIndex = (_spotlightIndex + 1) % list.length;
    }, 420); // doit correspondre au CSS .vip-spotlight { transition }
  };

  // Nettoyage si on relance
  clearInterval(_spotlightTimer);
  clearTimeout(_spotlightKickoff);

  // Premier affichage immédiat
  showNext();

  // Lancement rapide de la première rotation
  _spotlightKickoff = setTimeout(() => {
    showNext();
    _spotlightTimer = setInterval(showNext, intervalMs);
  }, Math.max(0, firstDelayMs));

  // Pause au survol — handlers directs pour ne pas empiler
  host.onmouseenter = () => {
    clearInterval(_spotlightTimer);
    clearTimeout(_spotlightKickoff);
  };
  host.onmouseleave = () => {
    clearInterval(_spotlightTimer);
    clearTimeout(_spotlightKickoff);
    showNext();
    _spotlightTimer = setInterval(showNext, intervalMs);
  };
}

// ---------- Filtrage mois + tri badges pour la grille ----------
function attachMonthFilter(allVips) {
  const sel = document.getElementById("vip-month-select");

  const sortByBadges = (list) =>
    list.slice().sort((a, b) => {
      const aBadges = a.badges && a.badges.length ? 1 : 0;
      const bBadges = b.badges && b.badges.length ? 1 : 0;
      if (bBadges !== aBadges) return bBadges - aBadges;
      return (a.display_name || a.login).localeCompare(b.display_name || b.login);
    });

  const renderFor = (value) => {
    let list = allVips;
    if (value) {
      list = allVips.filter((v) => (v.month || "") === value);
      if (!list.length) list = allVips;
    }
    // lance/relance la rotation du spotlight sur l’ensemble filtré
    startSpotlightRotation(list, { intervalMs: 7000, firstDelayMs: 2000 });
    // affiche la grille (badges en premier)
    enhanceVipGrid(sortByBadges(list));
  };

  if (sel) {
    sel.addEventListener("change", () => renderFor(sel.value));
    renderFor(sel.value);
  } else {
    renderFor("");
  }
}

// ================== Flux principal ==================
async function showVIPs() {
  try {
    const rawList = await fetchVIPList();
    const { logins, metaMap } = normalizeVipEntries(rawList);
    if (!logins.length) {
      const grid = document.getElementById("vip-users");
      if (grid) grid.innerHTML = "<p>Aucun VIP à afficher.</p>";
      return;
    }

    const usersInfo = await fetchUsersInfo(logins);
    const vips = mergeUsersWithMeta(usersInfo, metaMap);

    monthOptions("vip-month-select");
    attachMonthFilter(vips);
  } catch (e) {
    console.error(e);
    const grid = document.getElementById("vip-users");
    if (grid) grid.innerHTML = "<p>Erreur de chargement des VIP Élites.</p>";
  }
}

document.addEventListener("DOMContentLoaded", showVIPs);
