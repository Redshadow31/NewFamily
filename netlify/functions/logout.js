exports.handler = async () => ({
  statusCode: 302,
  headers: {
    // cookie expiré
    "Set-Cookie": "nf_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure",
    "Location": "/"
  }
});
