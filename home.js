// JioSaavn's home feed has no CORS headers, so the browser can't call it directly. This fetches it server-side.
const FEED = 'https://www.jiosaavn.com/api.php?__call=webapi.getLaunchData&api_version=4&_format=json&_marker=0&ctx=web6dot0';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const langs = String(req.query.languages || 'hindi,english');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const up = await fetch(FEED, { signal: ctrl.signal, headers: { Cookie: `L=${encodeURIComponent(langs)}`, 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } });
    const text = await up.text();
    let json;
    try { json = JSON.parse(text); } catch { return res.status(502).json({ error: `JioSaavn answered HTTP ${up.status} with something that isn’t JSON: ${text.slice(0, 120)}` }); }
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(up.ok ? 200 : up.status).json(json);
  } catch (e) {
    return res.status(504).json({ error: e.name === 'AbortError' ? 'JioSaavn took too long to answer.' : `Couldn’t reach JioSaavn: ${e.message}` });
  } finally { clearTimeout(timer); }
};
