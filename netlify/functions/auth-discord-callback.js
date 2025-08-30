const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");

exports.handler = async (event) => {
  try {
    const url = new URL(event.rawUrl);
    const code = url.searchParams.get("code");
    if (!code) return { statusCode: 400, body: "Missing code" };

    // 1) Échange du code contre un token
    const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        redirect_uri: `${process.env.REDIRECT_BASE_URL}/.netlify/functions/auth-discord-callback`,
        code
      })
    });

    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("⚠️ Discord token error:", tokenJson);
      throw new Error("Failed to fetch Discord token");
    }

    const { access_token } = tokenJson;

    // 2) Récupération du profil Discord
    const meRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const user = await meRes.json();
    if (!user || !user.id) throw new Error("No user from Discord");

    // 3) Créer le JWT
    const payload = {
      provider: "discord",
      sub: user.id,
      username: user.username + (user.discriminator !== "0" ? `#${user.discriminator}` : ""),
      avatar: user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
        : null
    };

    const sessionToken = jwt.sign(payload, process.env.SESSION_JWT_SECRET, {
      expiresIn: "7d"
    });

    const cookie = [
      `nf_session=${sessionToken}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      "Secure"
    ].join("; ");

    return {
      statusCode: 302,
      headers: {
        "Set-Cookie": cookie,
        Location: "/"
      }
    };
  } catch (e) {
    console.error("❌ Discord auth error:", e);
    return { statusCode: 500, body: e.message };
  }
};
