const grid = document.getElementById("blog-grid");
const searchInput = document.getElementById("search");
const tagFilter = document.getElementById("tagFilter");

let allPosts = [];

fetch("posts.json")
  .then(r => r.json())
  .then(posts => {
    allPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    populateTagFilter(allPosts);
    render(allPosts);
  })
  .catch(err => {
    console.error("Erreur chargement posts:", err);
    grid.innerHTML = `<p>Impossible de charger les articles pour le moment.</p>`;
  });

function populateTagFilter(posts) {
  const tags = new Set();
  posts.forEach(p => (p.tags || []).forEach(t => tags.add(t)));
  [...tags].sort().forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    tagFilter.appendChild(opt);
  });
}

function render(posts) {
  const q = (searchInput?.value || "").toLowerCase().trim();
  const t = tagFilter?.value || "";

  const filtered = posts.filter(p => {
    const hay =
      `${p.title} ${p.summary || ""} ${p.content || ""} ${(p.tags || []).join(" ")}`.toLowerCase();
    const matchQuery = q ? hay.includes(q) : true;
    const matchTag = t ? (p.tags || []).includes(t) : true;
    return matchQuery && matchTag;
  });

  grid.innerHTML = filtered.map(toCardHTML).join("") || `<p>Aucun article trouvé.</p>`;
}

function toCardHTML(post) {
  const date = new Date(post.date).toLocaleDateString("fr-FR");
  const img = post.image || "";
  const bg = img
    ? `style="background-image:url('${img}')" class="card-media has-img"`
    : `class="card-media"`; // dégradé par défaut via CSS

  const tags = (post.tags || [])
    .map(t => `<span class="tag">${t}</span>`)
    .join("");

  const summary = (post.summary || post.content || "").toString();
  const short = summary.length > 180 ? summary.slice(0, 177) + "…" : summary;

  // Si tu fais des pages de détail plus tard: href="post.html?slug=${encodeURIComponent(post.slug)}"
  return `
    <article class="card" tabindex="0">
      <div ${bg} aria-label="${post.title}"></div>
      <div class="card-body">
        <h2 class="card-title">${post.title}</h2>
        <p class="card-meta">📅 ${date}${post.author ? " • ✍️ " + post.author : ""}</p>
        <p class="card-text">${short}</p>
        <div class="card-tags">${tags}</div>
        <div class="card-actions">
          <button class="btn-read" onclick="openPost('${encodeURIComponent(post.slug)}')">Lire</button>
        </div>
      </div>
    </article>
  `;
}

// Lecture (popup simple)
window.openPost = function(slug) {
  const p = allPosts.find(x => x.slug === decodeURIComponent(slug));
  if (!p) return;

  const date = new Date(p.date).toLocaleDateString("fr-FR");
  const tags = (p.tags || []).map(t => `<span class="tag">${t}</span>`).join("");

  const modal = document.createElement("dialog");
  modal.className = "modal";
  modal.innerHTML = `
    <article class="modal-content">
      <button class="modal-close" aria-label="Fermer" onclick="this.closest('dialog').close(); this.closest('dialog').remove();">✖</button>
      <h2>${p.title}</h2>
      <p class="card-meta">📅 ${date}${p.author ? " • ✍️ " + p.author : ""}</p>
      <div class="card-tags">${tags}</div>
      ${p.image ? `<img src="${p.image}" alt="" class="modal-image" loading="lazy">` : ""}
      <div class="modal-body"><p>${(p.content || "").replace(/\n/g, "<br>")}</p></div>
    </article>
  `;
  document.body.appendChild(modal);
  modal.showModal();
};

// interactions
searchInput?.addEventListener("input", () => render(allPosts));
tagFilter?.addEventListener("change", () => render(allPosts));
