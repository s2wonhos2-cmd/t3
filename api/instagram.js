// 인스타그램 최근 게시물 API (Instagram API with Instagram Login)
// 필요한 Vercel 환경변수: INSTAGRAM_ACCESS_TOKEN (장기 액세스 토큰)
// 결과는 Vercel CDN에 1시간 캐시되어, 방문자가 많아도 API 호출량이 거의 늘지 않습니다.

const FIELDS = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
const MAX_LIMIT = 12;

function isSafeUrl(value, hostPattern) {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' && (!hostPattern || hostPattern.test(url.hostname));
    } catch {
        return false;
    }
}

module.exports = async (req, res) => {
    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!token) {
        res.setHeader('Cache-Control', 's-maxage=300');
        res.status(503).json({ posts: [], error: 'INSTAGRAM_ACCESS_TOKEN 이 설정되지 않았습니다.' });
        return;
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 6, 1), MAX_LIMIT);
    const url = `https://graph.instagram.com/me/media?fields=${FIELDS}&limit=${limit}&access_token=${encodeURIComponent(token)}`;

    try {
        const igRes = await fetch(url);
        const data = await igRes.json();

        if (!igRes.ok || !Array.isArray(data.data)) {
            const msg = (data && data.error && data.error.message) || `HTTP ${igRes.status}`;
            console.error('[instagram] API 오류:', msg);
            res.setHeader('Cache-Control', 's-maxage=300');
            res.status(502).json({ posts: [], error: '인스타그램 게시물을 불러오지 못했습니다.' });
            return;
        }

        const posts = data.data
            .map(item => ({
                id: item.id,
                type: item.media_type,
                image: item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url,
                url: item.permalink,
                caption: item.caption || '',
                timestamp: item.timestamp,
            }))
            .filter(p => isSafeUrl(p.image) && isSafeUrl(p.url, /(^|\.)instagram\.com$/));

        // CDN 1시간 캐시 + 갱신 중에는 이전 결과를 하루까지 제공
        res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
        res.status(200).json({ posts });
    } catch (err) {
        console.error('[instagram] 요청 실패:', err);
        res.setHeader('Cache-Control', 's-maxage=60');
        res.status(502).json({ posts: [], error: '인스타그램 서버와 통신하지 못했습니다.' });
    }
};
