exports.handler = async () => {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: `${process.env.REDIRECT_BASE_URL}/.netlify/functions/auth-discord-callback`,
    response_type: "code",
    scope: "identify email" // email optionnel
  });
  return {
    statusCode: 302,
    headers: { Location: `https://discord.com/api/oauth2/authorize?${params}` }
  };
};
