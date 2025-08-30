// ===========================
// VIP Élites – rendu enrichi
// ===========================

const CLIENT_ID = "rr75kdousbzbp8qfjy0xtppwpljuke";

// --------- Fetch helpers ---------
async function fetchVIPList() {
  // vip.json peut être: ["login1","login2", ...]
  // ou [{login:"...", badges:["Mentor"], month:"2025-08", spotlight:true, ...}, ...]
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
  // Twitch accepte ~100 logins d’un coup; on gère le chunking par sécurité.
  const token = await fetchToken();
  const chunks = [];
  const size = 90;
  for (let i = 0; i < logins.length; i += size) {
    chunks.push(logins.slice(i, i + size));
  }

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

// --------- Normalisation des données ---------
function normalizeVipEntries(rawList) {
  // Retourne: { logins: [...], metaMap: {login: {badges, quote, spotlight, image, title, month}} }
  const metaMap = {};
  const logins = rawList.map((item) => {
    if (typeof item === "string") {
      const login = item.toLowerCase();
      metaMap[login] = {}; // pas de méta
      return login;
    }
    // Objet enrichi
    const login = String(item.login || item.name || "").toLowerCase();
    metaMap[login] = {
      badges: item.badges || [],
      quote: item.quote || "",
      spotlight: Boolean(item.spotlight),
      image: item.image || item.avatar || "",
      banner: item.banner || item.cover || "",
      title: item.title || "Membre VIP Élites",
      month: item.month || "", // format "YYYY-MM" si tu veux filtrer
    };
    return login;
  });
  return { logins, metaMap };
}

function mergeUsersWithMeta(usersInfo, metaMap) {
  // usersInfo = données Twitch: login, display_name, profile_image_url, offline_image_url, description, etc.
  return usersInfo.map((u) => {
    const login = (u.login || "").toLowerCase();
    const meta = metaMap[login] || {};
    return {
      login,
      display_name: u.display_name || u.login,
      avatar: u.profile_image_url || "",
      // offline_image_url (bannière de chaîne) peut être vide; on garde meta.banner si fourni
      banner: meta.banner || u.offline_image_url || "",
      image: meta.image || u.profile_image_url || "",
      badges: meta.badges || [],
      quote: meta.quote || "",
      spotlight: !!meta.spotlight,
      title: meta.title || "Membre VIP Élites",
      month: meta.month || "",
      description: u.description || "",
    };
  });
}

// ================== UI Utils (tes fonctions intégrées & adaptées) ==================

function monthOptions(containerId) {
  // Génère 6 derniers mois (AAA-MM) si le select existe
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
  // Le filtrage est branché dans initShowVIPs() plus bas
}

function buildBadges(badges) {
  if (!badges || !badges.length) return "";
  return `<div class="vip-badges">
    ${badges.map((b) => `<span class="vip-badge">${b}</span>`).join("")}
  </div>`;
}

function buildCTA(login) {
  const twitch = `https://twitch.tv/${login}`;
  const discord = `https://discord.com/channels/@me`; // remplace par ton salon si tu veux
  return `<div class="cta-row">
    <a href="${twitch}" target="_blank" rel="noopener">Voir la chaîne</a>
    <a href="${discord}" target="_blank" rel="noopener">Féliciter sur Discord 🎉</a>
  </div>`;
}

function renderSpotlight(vip) {
  const host = document.getElementById("vip-spotlight");
  if (!host || !vip) return;
  const quote = vip.quote || "Membre VIP Élites — merci pour ton énergie et ton entraide !";
  host.innerHTML = `
    <article class="vip-spotlight-card">
      <div class="vip-spotlight-media">
        <span class="vip-ribbon">🏆 VIP Élites</span>
        <img src="${vip.banner || vip.image || "assets/placeholder.webp"}" alt="${vip.display_name || vip.login}">
      </div>
      <div class="vip-spotlight-body">
        <div class="vip-spotlight-name">${vip.display_name || vip.login}</div>
        <div class="vip-spotlight-quote">“${quote}”</div>
        <div class="vip-spotlight-actions">
          <a class="vip-btn" href="https://twitch.tv/${vip.login}" target="_blank" rel="noopener">Regarder sur Twitch</a>
          <a class="vip-btn" href="index.html">Découvrir la New Family</a>
        </div>
      </div>
    </article>
  `;
}

function enhanceVipGrid(vips) {
  // Spotlight: priorise un VIP marqué spotlight=true, sinon le 1er
  const spotlight = vips.find((v) => v.spotlight) || vips[0];
  renderSpotlight(spotlight);

  const grid = document.getElementById("vip-users");
  if (!grid) return;

  grid.innerHTML = vips
    .map((v) => {
      const login = (v.login || "").toLowerCase();
      const img = v.image || v.avatar || v.banner || "assets/placeholder.webp";
      const title = v.title || "Membre VIP Élites";
      const name = v.display_name || login;
      return `
        <article class="user-card">
          ${buildBadges(v.badges)}
          <div class="media-wrap">
            <img src="${img}" alt="${name}">
          </div>
          <div class="card-body">
            <div class="username"><a href="https://twitch.tv/${login}" target="_blank" rel="noopener">${name}</a></div>
            <div class="title">⭐ ${title}</div>
            ${buildCTA(login)}
          </div>
        </article>
      `;
    })
    .join("");
}

// --------- Filtrage par mois (si tu fournis month dans vip.json + select présent) ---------
function attachMonthFilter(allVips) {
  const sel = document.getElementById("vip-month-select");

  // 👉 fonction de tri : d’abord ceux qui ont des badges, puis par display_name
  const sortByBadges = (list) =>
    list.slice().sort((a, b) => {
      const aBadges = a.badges && a.badges.length ? 1 : 0;
      const bBadges = b.badges && b.badges.length ? 1 : 0;
      if (bBadges !== aBadges) return bBadges - aBadges; // VIP avec badge en premier
      return (a.display_name || a.login).localeCompare(b.display_name || b.login);
    });

  const renderFor = (value) => {
    let list = allVips;
    if (value) {
      list = allVips.filter((v) => (v.month || "") === value);
      if (!list.length) list = allVips;
    }
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
    // 1) Récupère la liste (logins ou objets)
    const rawList = await fetchVIPList();
    const { logins, metaMap } = normalizeVipEntries(rawList);

    if (!logins.length) {
      const grid = document.getElementById("vip-users");
      if (grid) grid.innerHTML = "<p>Aucun VIP à afficher.</p>";
      return;
    }

    // 2) Infos Twitch
    const usersInfo = await fetchUsersInfo(logins);

    // 3) Fusion
    const vips = mergeUsersWithMeta(usersInfo, metaMap);

    // 4) UI – options de mois (si le select existe)
    monthOptions("vip-month-select");

    // 5) Rendu (avec filtre si présent)
    attachMonthFilter(vips);
  } catch (e) {
    console.error(e);
    const grid = document.getElementById("vip-users");
    if (grid) grid.innerHTML = "<p>Erreur de chargement des VIP Élites.</p>";
  }
}

document.addEventListener("DOMContentLoaded", showVIPs);
