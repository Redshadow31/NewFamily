// netlify/functions/register.js
export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  const body = await req.json();
  const { eventId, eventTitle, twitch, discord, role, note } = body || {};
  const webhook = process.env.DISCORD_WEBHOOK_URL;

  if (!webhook) return new Response('Missing webhook', { status: 500 });

  const content =
    `📥 **Nouvelle inscription**\n` +
    `• **Événement**: ${eventTitle || eventId}\n` +
    `• **Twitch**: ${twitch}\n` +
    (discord ? `• **Discord**: ${discord}\n` : '') +
    (role ? `• **Rôle**: ${role}\n` : '') +
    (note ? `• **Note**: ${note}\n` : '');

  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    return new Response('Webhook failed', { status: 500 });
  }
}
