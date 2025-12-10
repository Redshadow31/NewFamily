// netlify/functions/quizSubmit.js
export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    // Validation rapide
    const { player, score, total, answers, at } = body || {};
    if (
      typeof score !== "number" ||
      typeof total !== "number" ||
      !Array.isArray(answers)
    ) {
      return new Response("Bad Request", { status: 400 });
    }

    // Contexte utile
    const ip = req.headers.get("x-nf-client-connection-ip") || "unknown";
    const ua = req.headers.get("user-agent") || "unknown";
    const ts = at || new Date().toISOString();

    // Message Discord (compact + lisible)
    const lines = [];
    lines.push(`**🎯 Nouveau score au Quizz TENF**`);
    lines.push(`Joueur: ${player || "Anonyme"}`);
    lines.push(`Score: **${score}/${total}**`);
    lines.push(`Date: ${ts}`);
    lines.push(`IP: ${ip}`);
    lines.push(`UA: ${ua}`);
    lines.push("");
    // Petit récap des 5 premières questions max pour ne pas spam
    const preview = answers.slice(0, 5).map((a, i) => {
      const num = i + 1;
      const res = a.isCorrect ? "✅" : "❌";
      return `Q${num} ${res} (${a.timeLeft || 0}s)`;
    }).join(" • ");
    if (preview) lines.push(preview);
    if (answers.length > 5) lines.push(`… +${answers.length - 5} autres`);

    const payload = { content: lines.join("\n") };

    // Envoi Discord
    const hook = process.env.DISCORD_WEBHOOK_URL;
    if (hook) {
      await fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      console.warn("DISCORD_WEBHOOK_URL absent → aucun envoi Discord.");
    }

    // Réponse OK au navigateur
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response("Server Error", { status: 500 });
  }
};
