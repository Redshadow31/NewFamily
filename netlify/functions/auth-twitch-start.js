exports.handler = async (event) => {
  const params = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID,
    redirect_uri: `${process.env.REDIRECT_BASE_URL}/.netlify/functions/auth-twitch-callback`,
    response_type: 'code',
    scope: 'user:read:email', // suffisant pour récupérer le profil
  });
  return {
    statusCode: 302,
    headers: { Location: `https://id.twitch.tv/oauth2/authorize?${params}` }
  };
};
