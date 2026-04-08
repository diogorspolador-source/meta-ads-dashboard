export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const TOKEN = process.env.META_ACCESS_TOKEN;
  const AD_ACCOUNT = process.env.META_AD_ACCOUNT_ID;

  if (!TOKEN || !AD_ACCOUNT) {
    return res.status(500).json({ error: 'Meta credentials not configured.' });
  }

  const { level = 'campaign', since, until, campaign_id, adset_id } = req.query;

  const timeRange = since && until
    ? `time_range={"since":"${since}","until":"${until}"}`
    : `date_preset=last_30d`;

  const BASE = 'https://graph.facebook.com/v19.0';

  const parentFields = 'name,status,objective';

  const insightFields = [
    'spend', 'impressions', 'clicks', 'reach', 'frequency',
    'ctr', 'cpm', 'cpc',
    'actions', 'cost_per_action_type',
    'unique_clicks', 'unique_ctr',
  ].join(',');

  try {
    let url = '';

    if (level === 'campaign') {
      url = `${BASE}/${AD_ACCOUNT}/campaigns?fields=${parentFields},insights.${timeRange}{${insightFields}}&limit=50&access_token=${TOKEN}`;
    } else if (level === 'adset' && campaign_id) {
      url = `${BASE}/${campaign_id}/adsets?fields=${parentFields},insights.${timeRange}{${insightFields}}&limit=50&access_token=${TOKEN}`;
    } else if (level === 'ad') {
      const parentParam = adset_id
        ? `${BASE}/${adset_id}/ads`
        : campaign_id
        ? `${BASE}/${campaign_id}/ads`
        : `${BASE}/${AD_ACCOUNT}/ads`;

      url = `${parentParam}?fields=${parentFields},insights.${timeRange}{${insightFields}},creative{id,name,thumbnail_url,image_url}&limit=50&access_token=${TOKEN}`;
    } else if (level === 'account') {
      url = `${BASE}/${AD_ACCOUNT}/insights?${timeRange}&fields=${insightFields}&access_token=${TOKEN}`;
    } else {
      return res.status(400).json({ error: 'Invalid level parameter.' });
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
