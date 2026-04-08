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

  // Campos de insight válidos
  const insightFields = 'spend,impressions,clicks,reach,frequency,ctr,cpm,cpc,actions,cost_per_action_type';

  // Monta time_range encodado corretamente
  const timeRange = since && until
    ? `time_range=%7B%22since%22%3A%22${since}%22%2C%22until%22%3A%22${until}%22%7D`
    : 'date_preset=last_30d';

  try {
    let url = '';

    if (endpoint === 'campaigns') {
      // Busca campanhas com insights separados (mais confiável)
      url = `${BASE}/${AD_ACCOUNT}/campaigns?fields=id,name,status,objective&limit=50&access_token=${TOKEN}`;
    }
    else if (endpoint === 'campaign_insights') {
      // Insights de uma campanha específica ou de todas
      const parent = id || AD_ACCOUNT;
      const level = id ? '' : '&level=campaign';
      url = `${BASE}/${parent}/insights?fields=${insightFields}&${timeRange}${level}&limit=50&access_token=${TOKEN}`;
    }
    else if (endpoint === 'adsets') {
      url = `${BASE}/${id}/adsets?fields=id,name,status&limit=50&access_token=${TOKEN}`;
    }
    else if (endpoint === 'adset_insights') {
      url = `${BASE}/${id}/insights?fields=${insightFields}&${timeRange}&limit=50&access_token=${TOKEN}`;
    }
    else if (endpoint === 'ads') {
      url = `${BASE}/${id}/ads?fields=id,name,status,creative{id,name,thumbnail_url,image_url}&limit=50&access_token=${TOKEN}`;
    }
    else if (endpoint === 'ad_insights') {
      url = `${BASE}/${id}/insights?fields=${insightFields}&${timeRange}&limit=50&access_token=${TOKEN}`;
    }
    else if (endpoint === 'account_insights') {
      url = `${BASE}/${AD_ACCOUNT}/insights?fields=${insightFields}&${timeRange}&access_token=${TOKEN}`;
    }
    else if (endpoint === 'daily') {
      // Série temporal dia a dia
      const parent = id || AD_ACCOUNT;
      url = `${BASE}/${parent}/insights?fields=spend,impressions,clicks,ctr,cpc,actions&time_increment=1&${timeRange}&limit=90&access_token=${TOKEN}`;
    }
    else if (endpoint === 'all_campaigns_insights') {
      // Insights de todas as campanhas no período — chamada única mais eficiente
      url = `${BASE}/${AD_ACCOUNT}/insights?fields=${insightFields},campaign_name,campaign_id&level=campaign&${timeRange}&limit=50&access_token=${TOKEN}`;
    }
    else {
      return res.status(400).json({ error: 'Endpoint inválido.' });
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
