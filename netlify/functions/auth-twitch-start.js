exports.handler = async () => {
  const redirect = new URL("https://id.twitch.tv/oauth2/authorize");
  redirect.searchParams.set("client_id", process.env.TWITCH_CLIENT_ID);
  redirect.searchParams.set("redirect_uri", `${process.env.REDIRECT_BASE_URL}/.netlify/functions/auth-twitch-callback`);
  redirect.searchParams.set("response_type", "code");
  redirect.searchParams.set("scope", "user:read:email"); // ou plus si besoin

  return {
    statusCode: 302,
    headers: { Location: redirect.toString() }
  };
};
