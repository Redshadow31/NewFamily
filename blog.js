/***** CONFIG *****/
const ASSET_DEFAULT_PREFIX = "assets/blog/";
const DEFAULT_BLOG_IMAGE = null; // ex: "assets/blog/default.jpg"

/***** ÉTAT *****/
const grid = document.getElementById("blog-grid");
const searchInput = document.getElementById("search");
const tagFilter = document.getElementById("tagFilter");
let allPosts = [];

/***** HELPERS *****/
function resolveImage(img) {
  if (!img && DEFAULT_BLOG_IMAGE) img = DEFAULT_BLOG_IMAGE;
  if (!img) return null;
  const hasProtocol = /^(https?:)?\/\//i.test(img) || img.startsWith("/");
  if (hasProtocol) return img;
  if (img.includes("/")) return img; // déjà un chemin relatif
  return ASSET_DEFAULT_PREFIX + img;
}

function populateTagFilter(posts) {
  if (!tagFilter) return;
  const tags = new Set();
  posts.forEach(p => (p.tags || []).forEach(t => tags.add(t)));
  [...tags].sort().forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    tagFilter.appendChild(opt);
  });
}

/***** RENDER *****/
function render(posts) {
  const q = (searchInput?.value || "").toLowerCase().trim();
  const t = tagFilter?.value || "";

  const filtered = posts.filter(p => {
    const hay = `${p.title} ${p.summary || ""} ${p.content || ""} ${(p.tags || []).join(" ")}`.toLowerCase();
    const matchQuery = q ? hay.includes(q) : true;
    const matchTag = t ? (p.tags || []).includes(t) : true;
    return matchQuery && matchTag;
  });

  grid.innerHTML = filtered.map(toCardHTML).join("") || `<p>Aucun article trouvé.</p>`;
}

function toCardHTML(post) {
  const date = new Date(post.date).toLocaleDateString("fr-FR");
  const img = resolveImage(post.image || post.imageFile);
  const tags = (post.tags || []).map(t => `<span class="tag">${t}</span>`).join("");
  const summary = (post.summary || post.content || "").toString();
  const short = summary.length > 220 ? summary.slice(0, 217) + "…" : summary;

  return `
    <article class="card" tabindex="0" onclick="openPost('${encodeURIComponent(post.slug)}')">
      <figure class="card-media">
        ${
          img
            ? `<img class="card-media-img" src="${img}" alt="${post.imageAlt || ""}" loading="lazy"
                 onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'card-media-fallback'}));">`
            : `<div class="card-media-fallback" aria-hidden="true"></div>`
        }
      </figure>

      <div class="card-body">
        <h2 class="card-title">${post.title}</h2>
        <p class="card-meta">📅 ${date}${post.author ? " • ✍️ " + post.author : ""}</p>
        <p class="card-text clamp-3">${short}</p>
        <div class="card-tags">${tags}</div>
        <div class="card-actions">
          <button class="btn-read" type="button"
                  onclick="event.stopPropagation(); openPost('${encodeURIComponent(post.slug)}')">Lire</button>
        </div>
      </div>
    </article>
  `;
}

/***** MODAL LECTURE *****/
window.openPost = function (slug) {
  const p = allPosts.find(x => x.slug === decodeURIComponent(slug));
  if (!p) return;

  const date = new Date(p.date).toLocaleDateString("fr-FR");
  const tags = (p.tags || []).map(t => `<span class="tag">${t}</span>`).join("");
  const img = resolveImage(p.image || p.imageFile);

  const modal = document.createElement("dialog");
  modal.className = "modal";
  modal.innerHTML = `
    <article class="modal-content">
      <button class="modal-close" aria-label="Fermer"
              onclick="this.closest('dialog').close(); this.closest('dialog').remove();">✖</button>
      <h2>${p.title}</h2>
      <p class="card-meta">📅 ${date}${p.author ? " • ✍️ " + p.author : ""}</p>
      <div class="card-tags">${tags}</div>
      ${img ? `<img src="${img}" alt="${p.imageAlt || ""}" class="modal-image" loading="lazy"
                    onerror="this.remove()">` : ""}
      <div class="modal-body"><p>${(p.content || "").replace(/\n/g, "<br>")}</p></div>
    </article>
  `;
  document.body.appendChild(modal);
  modal.showModal();
};

/***** DATA LOAD *****/
fetch("posts.json")
  .then(r => r.json())
  .then(posts => {
    allPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    populateTagFilter(allPosts);
    render(allPosts);
  })
  .catch(err => {
    console.error("Erreur chargement posts:", err);
    if (grid) grid.innerHTML = `<p>Impossible de charger les articles pour le moment.</p>`;
  });

/***** UI EVENTS *****/
searchInput?.addEventListener("input", () => render(allPosts));
tagFilter?.addEventListener("change", () => render(allPosts));
