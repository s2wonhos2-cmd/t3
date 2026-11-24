// 인스타그램 장기 토큰(60일 유효) 자동 연장 — Vercel Cron이 매주 1회 호출합니다 (vercel.json 참고)
// 필요한 Vercel 환경변수: INSTAGRAM_ACCESS_TOKEN, CRON_SECRET (임의의 긴 문자열)

module.exports = async (req, res) => {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
        res.status(401).json({ ok: false, error: 'unauthorized' });
        return;
    }

    const token = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!token) {
        res.status(200).json({ ok: false, error: 'INSTAGRAM_ACCESS_TOKEN 미설정' });
        return;
    }

    try {
        const igRes = await fetch(
            `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`
        );
        const data = await igRes.json();

        if (!igRes.ok || !data.access_token) {
            const msg = (data && data.error && data.error.message) || `HTTP ${igRes.status}`;
            console.error('[instagram-refresh] 토큰 연장 실패:', msg);
            res.status(502).json({ ok: false, error: msg });
            return;
        }

        const days = Math.round((data.expires_in || 0) / 86400);
        if (data.access_token !== token) {
            // 토큰 문자열이 바뀐 경우: Vercel 환경변수를 새 값으로 교체해야 합니다.
            console.warn('[instagram-refresh] 새 토큰이 발급되었습니다. INSTAGRAM_ACCESS_TOKEN 환경변수를 갱신하세요.');
        }
        console.log(`[instagram-refresh] 토큰 연장 완료 (남은 기간 약 ${days}일)`);
        res.status(200).json({ ok: true, expiresInDays: days, tokenChanged: data.access_token !== token });
    } catch (err) {
        console.error('[instagram-refresh] 요청 실패:', err);
        res.status(502).json({ ok: false, error: 'request failed' });
    }
};
