exports.handler = async () => {
  const redirect = new URL("https://discord.com/api/oauth2/authorize");
  redirect.searchParams.set("client_id", process.env.DISCORD_CLIENT_ID);
  redirect.searchParams.set("redirect_uri", `${process.env.REDIRECT_BASE_URL}/.netlify/functions/auth-discord-callback`);
  redirect.searchParams.set("response_type", "code");
  redirect.searchParams.set("scope", "identify email"); // scopes utiles

  return {
    statusCode: 302,
    headers: { Location: redirect.toString() }
  };
};
