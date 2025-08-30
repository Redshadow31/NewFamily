const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");

exports.handler = async (event) => {
  try {
    const url = new URL(event.rawUrl);
    const code = url.searchParams.get("code");
    if (!code) return { statusCode: 400, body: "Missing code" };

    // 1) échange code → token
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
    if (!tokenRes.ok) throw new Error(JSON.stringify(tokenJson));
    const { access_token, token_type } = tokenJson;

    // 2) profil utilisateur
    const meRes = await fetch("https://discord.com/api/users/@me", {
      headers: { Authorization: `${token_type} ${access_token}` }
    });
    const user = await meRes.json();

    // 3) cookie de session
    const payload = {
      provider: "discord",
      sub: user.id,
      login: user.username,
      display_name: `${user.username}`,
      avatar: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`
    };
    const token = jwt.sign(payload, process.env.SESSION_JWT_SECRET, { expiresIn: "7d" });

    const cookie = [
      `nf_session=${token}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      "Secure"
    ].join("; ");

    return {
      statusCode: 302,
      headers: { "Set-Cookie": cookie, "Location": "/" }
    };
  } catch (e) {
    return { statusCode: 500, body: e.message };
  }
};
