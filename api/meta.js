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

      case 'ads': {
        // Passo 1: lista os ads da campanha com ID do criativo
        if (!id) return res.status(400).json({ error: 'id obrigatório.' });
        const adsUrl = `${BASE}/${id}/ads?fields=id,name,status,creative{id}&limit=100&access_token=${TOKEN}`;
        const adsRes = await fetch(adsUrl);
        const adsData = await adsRes.json();
        if (adsData.error) return res.status(400).json({ error: adsData.error.message });

        const ads = adsData.data || [];

        // Passo 2: para cada ad, busca insights + criativo em paralelo
        const enriched = await Promise.all(ads.map(async (ad) => {
          const creativeId = ad.creative?.id;

          const [insRes, creativeRes] = await Promise.all([
            // Insights do ad no período
            fetch(`${BASE}/${ad.id}/insights?fields=${insightFields}&limit=1${timeParam}&access_token=${TOKEN}`),
            // Criativo pelo ID real — thumbnail_url só vem aqui
            creativeId
              ? fetch(`${BASE}/${creativeId}?fields=id,name,thumbnail_url,image_url,body,title,effective_object_story_id&access_token=${TOKEN}`)
              : Promise.resolve(null),
          ]);

          const insJson = await insRes.json();
          const creativeJson = creativeRes ? await creativeRes.json() : null;

          return {
            id: ad.id,
            name: ad.name,
            status: ad.status,
            insights: insJson.data?.[0] || null,
            creative: creativeJson && !creativeJson.error ? creativeJson : null,
          };
        }));

        res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate');
        return res.status(200).json({ data: enriched });
      }

      case 'ad_insights':
        if (!id) return res.status(400).json({ error: 'id obrigatório.' });
        url = `${BASE}/${id}/insights?fields=${insightFields}&limit=1${timeParam}&access_token=${TOKEN}`;
        break;

      default:
        return res.status(400).json({ error: `Endpoint inválido: "${endpoint}".` });
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
