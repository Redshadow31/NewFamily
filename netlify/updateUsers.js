import fs from "fs";
import path from "path";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Méthode non autorisée" };
  }

  const body = JSON.parse(event.body || "{}");
  const { action, user } = body;

  // Chemin du fichier users3.json dans ton dépôt
  const filePath = path.join(process.cwd(), "public", "users3.json");
  let users = [];

  if (fs.existsSync(filePath)) {
    users = JSON.parse(fs.readFileSync(filePath, "utf8"));
  }

  if (action === "add" && user && !users.includes(user)) {
    users.push(user);
  } else if (action === "remove") {
    users = users.filter(u => u !== user);
  }

  fs.writeFileSync(filePath, JSON.stringify(users, null, 2));

  return {
    statusCode: 200,
    body: JSON.stringify(users),
  };
}
