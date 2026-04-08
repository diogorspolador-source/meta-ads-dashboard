export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const TOKEN = process.env.META_ACCESS_TOKEN;
  const AD_ACCOUNT = process.env.META_AD_ACCOUNT_ID;
  if (!TOKEN || !AD_ACCOUNT) return res.status(500).json({ error: 'Credenciais não configuradas.' });

  const { endpoint, since, until, id } = req.query;
  const BASE = 'https://graph.facebook.com/v19.0';
  const insightFields = 'spend,impressions,clicks,reach,frequency,ctr,cpm,cpc,actions,cost_per_action_type';

  const timeParam = since && until
    ? `&time_range=${encodeURIComponent(JSON.stringify({ since, until }))}`
    : '&date_preset=last_30d';

  try {
    let url = '';

    switch (endpoint) {
      case 'campaigns':
        url = `${BASE}/${AD_ACCOUNT}/campaigns?fields=id,name,status,objective&limit=50&access_token=${TOKEN}`;
        break;

      case 'all_campaigns_insights':
        url = `${BASE}/${AD_ACCOUNT}/insights?fields=${insightFields},campaign_name,campaign_id&level=campaign&limit=50${timeParam}&access_token=${TOKEN}`;
        break;

      case 'daily':
        url = `${BASE}/${AD_ACCOUNT}/insights?fields=spend,impressions,clicks,ctr,actions&time_increment=1&limit=90${timeParam}&access_token=${TOKEN}`;
        break;

      case 'ads':
        if (!id) return res.status(400).json({ error: 'Parâmetro id obrigatório para ads.' });
        url = `${BASE}/${id}/ads?fields=id,name,status,creative{id,name,thumbnail_url,image_url}&limit=50&access_token=${TOKEN}`;
        break;

      case 'ad_insights':
        if (!id) return res.status(400).json({ error: 'Parâmetro id obrigatório para ad_insights.' });
        url = `${BASE}/${id}/insights?fields=${insightFields}&limit=1${timeParam}&access_token=${TOKEN}`;
        break;

      default:
        return res.status(400).json({ error: `Endpoint inválido: "${endpoint}". Verifique o frontend.` });
    }

    const response = await fetch(url);
    const data = await response.json();
    if (data.error) return res.status(400).json({ error: data.error.message });

    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
