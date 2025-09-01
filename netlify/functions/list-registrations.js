// netlify/functions/list-registrations.js
const BASE = 'https://api.netlify.com/api/v1';

export default async (req) => {
  const url = new URL(req.url);
  const eventId = url.searchParams.get('eventId');
  if (!eventId) return new Response('Missing eventId', { status: 400 });

 const token = process.env.NETLIFY_API_TOKEN;
const siteId = process.env.MY_SITE_ID;   // <-- nouveau nom
if (!token || !siteId) return new Response('Server not configured', { status: 500 });

  // 1) Récupérer le formulaire "inscriptions"
  const formsRes = await fetch(`${BASE}/sites/${siteId}/forms?access_token=${token}`);
  const forms = await formsRes.json();
  const form = forms.find(f => f.name === 'inscriptions');
  if (!form) return new Response(JSON.stringify({ count: 0, items: [] }), { status: 200 });

  // 2) Récupérer les submissions et filtrer par eventId
  const subsRes = await fetch(`${BASE}/forms/${form.id}/submissions?access_token=${token}`);
  const subs = await subsRes.json();
  const items = subs
    .map(s => s.data)
    .filter(d => d.eventId === eventId)
    .map(d => ({ twitch: d.twitch, discord: d.discord || '', role: d.role || '' }));

  return new Response(JSON.stringify({ count: items.length, items }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
