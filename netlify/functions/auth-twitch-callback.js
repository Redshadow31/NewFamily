const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");

exports.handler = async (event) => {
  try {
    const url = new URL(event.rawUrl);
    const code = url.searchParams.get("code");

    if (!code) {
      return { statusCode: 400, body: "❌ Missing code" };
    }

    // 1) Échange le "code" contre un access_token Twitch
    const tokenRes = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID,
        client_secret: process.env.TWITCH_CLIENT_SECRET,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.REDIRECT_BASE_URL}/.netlify/functions/auth-twitch-callback`,
        code
      })
    });

    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("⚠️ Error token exchange:", tokenJson);
      throw new Error("Failed to fetch Twitch token");
    }

    const { access_token } = tokenJson;

    // 2) Récupération profil utilisateur Twitch
    const meRes = await fetch("https://api.twitch.tv/helix/users", {
      headers: {
        "Client-Id": process.env.TWITCH_CLIENT_ID,
        "Authorization": `Bearer ${access_token}`
      }
    });

    const meJson = await meRes.json();
    const user = meJson.data && meJson.data[0];
    if (!user) throw new Error("❌ Unable to fetch Twitch user");

    // 3) Créer un JWT pour la session
    const payload = {
      provider: "twitch",
      sub: user.id,
      login: user.login,
      display_name: user.display_name,
      avatar: user.profile_image_url
    };

    const sessionToken = jwt.sign(payload, process.env.SESSION_JWT_SECRET, {
      expiresIn: "7d"
    });

    // 4) Création du cookie HttpOnly
    const cookie = [
      `nf_session=${sessionToken}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      "Secure" // ⚠️ obligatoire en prod HTTPS
    ].join("; ");

    // 5) Redirige l’utilisateur vers la page d’accueil
    return {
      statusCode: 302,
      headers: {
        "Set-Cookie": cookie,
        Location: "/"
      }
    };
  } catch (e) {
    console.error("❌ Auth error:", e);
    return { statusCode: 500, body: e.message || "Internal Server Error" };
  }
};
