const fetch = require("node-fetch");

// À mettre plus tard dans .env
const client_id = process.env.TWITCH_CLIENT_ID;
const client_secret = process.env.TWITCH_CLIENT_SECRET;

let cachedToken = null;
let tokenExpiry = 0;

exports.handler = async function (event, context) {
  try {
    const now = Date.now();

    if (!cachedToken || now >= tokenExpiry) {
      const tokenResponse = await fetch(
        `https://id.twitch.tv/oauth2/token?client_id=${client_id}&client_secret=${client_secret}&grant_type=client_credentials`,
        {
          method: "POST",
        }
      );

      const tokenData = await tokenResponse.json();
      cachedToken = tokenData.access_token;
      tokenExpiry = now + tokenData.expires_in * 1000;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        access_token: cachedToken,
        expires_in: tokenExpiry - now
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

    const data = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
