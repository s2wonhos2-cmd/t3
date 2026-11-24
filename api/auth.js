// GitHub OAuth 시작점 (Decap CMS 관리자 로그인용)
// 필요한 Vercel 환경변수: OAUTH_GITHUB_CLIENT_ID, OAUTH_GITHUB_CLIENT_SECRET
const crypto = require('crypto');

module.exports = (req, res) => {
    const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
    if (!clientId) {
        res.status(500).send('OAUTH_GITHUB_CLIENT_ID 환경변수가 설정되지 않았습니다. ADMIN_GUIDE.md를 참고하세요.');
        return;
    }

    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const redirectUri = `${proto}://${host}/api/callback`;

    // CSRF 방지용 state
    const state = crypto.randomBytes(16).toString('hex');
    res.setHeader(
        'Set-Cookie',
        `t3s_oauth_state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
    );

    const scope = req.query.scope === 'public_repo' ? 'public_repo' : 'repo';
    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope,
        state,
    });

    res.redirect(302, `https://github.com/login/oauth/authorize?${params}`);
};
