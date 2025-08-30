const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");

exports.handler = async (event) => {
  try {
    const url = new URL(event.rawUrl);
    const code = url.searchParams.get("code");
    if (!code) return { statusCode: 400, body: "Missing code" };

    // 1) échange code → token
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
    if (!tokenRes.ok) throw new Error(JSON.stringify(tokenJson));
    const { access_token, refresh_token, expires_in } = tokenJson;

    // 2) profil utilisateur
    const meRes = await fetch("https://api.twitch.tv/helix/users", {
      headers: {
        "Client-Id": process.env.TWITCH_CLIENT_ID,
        "Authorization": `Bearer ${access_token}`
      }
    });
    const meJson = await meRes.json();
    const user = meJson.data && meJson.data[0];
    if (!user) throw new Error("No user");

    // 3) créer cookie de session (JWT)
    const payload = {
      provider: "twitch",
      sub: user.id,
      login: user.login,
      display_name: user.display_name,
      avatar: user.profile_image_url
    };
    const token = jwt.sign(payload, process.env.SESSION_JWT_SECRET, { expiresIn: "7d" });

    const cookie = [
      `nf_session=${token}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      "Secure" // en prod HTTPS
    ].join("; ");

    return {
      statusCode: 302,
      headers: {
        "Set-Cookie": cookie,
        "Location": "/"
      }
    };
  } catch (e) {
    return { statusCode: 500, body: e.message };
  }
};
