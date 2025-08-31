fetch("posts.json")
  .then(response => response.json())
  .then(posts => {
    const container = document.getElementById("blog-posts");
    posts.forEach(post => {
      const article = document.createElement("article");
      article.classList.add("post");

      article.innerHTML = `
        <h2>${post.title}</h2>
        <p class="date">📅 ${new Date(post.date).toLocaleDateString("fr-FR")}</p>
        <p>${post.content}</p>
      `;

      container.appendChild(article);
    });
  })
  .catch(error => console.error("Erreur lors du chargement des articles :", error));
