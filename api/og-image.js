// 링크 공유 시 미리보기 썸네일(Open Graph 이미지)용 엔드포인트.
// index.html의 <meta property="og:image" content="/api/og-image?key=hero"> 가 이 함수를 가리킵니다.
//
// content/site-images.json 은 /admin 에서 저장할 때마다 GitHub 커밋 → Vercel 재배포되므로,
// 이 함수가 매 요청마다 최신 배포에 포함된 content/site-images.json 을 읽어
// 현재 설정된 사진으로 302 리다이렉트합니다. 즉, 대문(히어로) 사진을 /admin 에서 바꾸고
// 재배포되면 별도 작업 없이 링크 미리보기 썸네일도 자동으로 최신 사진을 가리키게 됩니다.

const fs = require('fs');
const path = require('path');

const FALLBACK_IMAGE = '/images/hero-team.jpg';

module.exports = async (req, res) => {
    let imagePath = FALLBACK_IMAGE;

    try {
        const filePath = path.join(process.cwd(), 'content', 'site-images.json');
        const raw = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(raw);

        const key = typeof req.query.key === 'string' && data[req.query.key] ? req.query.key : 'hero';
        const entry = data[key] || data.hero;
        if (entry && typeof entry.image === 'string' && entry.image.trim()) {
            imagePath = entry.image;
        }
    } catch (err) {
        console.error('[og-image] content/site-images.json 읽기 실패:', err);
    }

    const proto = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const absoluteUrl = /^https?:\/\//i.test(imagePath) ? imagePath : `${proto}://${host}${imagePath}`;

    // 카카오톡/슬랙 등 미리보기 크롤러가 매번 최신 사진을 받아가도록 캐시를 짧게 유지합니다.
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=600');
    res.writeHead(302, { Location: absoluteUrl });
    res.end();
};
