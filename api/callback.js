// GitHub OAuth 콜백: 토큰을 받아 관리자 창(Decap CMS)에 전달
// 필요한 Vercel 환경변수: OAUTH_GITHUB_CLIENT_ID, OAUTH_GITHUB_CLIENT_SECRET

function readCookie(req, name) {
    const header = req.headers.cookie || '';
    const match = header.split(';').map(s => s.trim()).find(s => s.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

// Decap CMS 팝업 핸드셰이크. 토큰은 같은 출처(이 사이트의 /admin)에만 전달합니다.
function renderPage(res, status, payload) {
    const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
    const safeMessage = JSON.stringify(message).replace(/</g, '\\u003c');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Set-Cookie', 't3s_oauth_state=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
    res.status(200).send(`<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8"><title>로그인 처리 중...</title></head>
<body>
<p>${status === 'success' ? '로그인 완료! 이 창은 자동으로 닫힙니다.' : '로그인에 실패했습니다. 창을 닫고 다시 시도해주세요.'}</p>
<script>
(function () {
  var message = ${safeMessage};
  function receive(e) {
    if (e.origin !== window.location.origin) return;
    window.opener.postMessage(message, e.origin);
    window.removeEventListener('message', receive, false);
  }
  if (!window.opener) return;
  window.addEventListener('message', receive, false);
  window.opener.postMessage('authorizing:github', window.location.origin);
})();
</script>
</body></html>`);
}

module.exports = async (req, res) => {
    const clientId = process.env.OAUTH_GITHUB_CLIENT_ID;
    const clientSecret = process.env.OAUTH_GITHUB_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        renderPage(res, 'error', { message: 'OAuth 환경변수가 설정되지 않았습니다.' });
        return;
    }

    const { code, state } = req.query;
    const savedState = readCookie(req, 't3s_oauth_state');
    if (!code || !state || !savedState || state !== savedState) {
        renderPage(res, 'error', { message: '잘못된 로그인 요청입니다. 다시 시도해주세요.' });
        return;
    }

    try {
        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
        });
        const data = await tokenRes.json();
        if (!data.access_token) {
            renderPage(res, 'error', { message: data.error_description || 'GitHub 토큰 발급 실패' });
            return;
        }
        renderPage(res, 'success', { token: data.access_token, provider: 'github' });
    } catch (err) {
        renderPage(res, 'error', { message: 'GitHub 서버와 통신하지 못했습니다.' });
    }
};
