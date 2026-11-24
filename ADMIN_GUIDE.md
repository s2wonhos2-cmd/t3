# T3.s 홈페이지 관리자 가이드

홈페이지의 **수상기록·연혁**, **활동 갤러리 사진**은 HTML을 직접 고치지 않고
`https://<배포주소>/admin` 관리자 대시보드에서 수정합니다.
**인스타그램 최근 게시물**은 자동으로 불러옵니다.

```
관리자 대시보드(/admin)에서 저장
   → GitHub 저장소에 자동 커밋 (content/*.json, images/uploads/*)
   → Vercel 자동 재배포 (약 30초~1분 후 홈페이지 반영)
```

---

## 1. 최초 1회 설정 (운영진 중 1명)

### 1-1. `admin/config.yml` 수정
아래 3곳의 `YOUR-...` 부분을 실제 값으로 바꾸고 GitHub에 푸시합니다.

| 항목 | 예시 |
|---|---|
| `repo` | `khu-t3s/t3s-homepage` (GitHub 아이디/저장소 이름) |
| `branch` | `main` |
| `base_url`, `site_url`, `display_url` | `https://t3s.vercel.app` (끝에 `/` 없이) |

> 나중에 커스텀 도메인을 연결하면 `base_url` 등을 그 도메인으로 바꾸고,
> 아래 GitHub OAuth App의 주소도 같이 바꿔야 합니다.

### 1-2. GitHub OAuth App 만들기 (관리자 로그인용)
1. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
   (동아리 GitHub Organization이 있다면 Organization 설정에서 만드는 것을 권장)
2. 입력값
   - Application name: `T3.s Homepage Admin`
   - Homepage URL: `https://<배포주소>`
   - Authorization callback URL: `https://<배포주소>/api/callback`
3. 생성 후 **Client ID** 복사, **Generate a new client secret** 으로 Secret 복사

### 1-3. Vercel 환경변수 등록
Vercel 프로젝트 → **Settings → Environment Variables** (Production)

| 이름 | 값 |
|---|---|
| `OAUTH_GITHUB_CLIENT_ID` | 1-2의 Client ID |
| `OAUTH_GITHUB_CLIENT_SECRET` | 1-2의 Client Secret |
| `INSTAGRAM_ACCESS_TOKEN` | 2장 참고 (인스타그램 연동 시) |
| `CRON_SECRET` | 아무 긴 랜덤 문자열 (인스타그램 토큰 자동 연장용) |

등록 후 **Redeploy** 해야 적용됩니다.

### 1-4. 관리자 추가
관리자 대시보드에 로그인하려면 **GitHub 계정 + 저장소 쓰기 권한**이 필요합니다.
저장소 → **Settings → Collaborators** 에서 운영진 GitHub 계정을 추가하세요.
(운영진 교체 시 여기서 추가/삭제만 하면 됩니다)

---

## 2. 인스타그램 최근 게시물 연동

홈페이지의 "인스타그램 최신 소식" 영역은 `/api/instagram` 이 공식 Instagram API로
최근 게시물 6개를 불러와 표시합니다. **토큰이 없거나 오류가 나면 피드 대신
'@khu_t3 팔로우하기' 버튼만 표시**되므로 홈페이지가 깨지지 않습니다.

### 2-1. 준비
- @khu_t3 계정을 **프로페셔널 계정(비즈니스 또는 크리에이터)** 으로 전환
  (인스타그램 앱 → 설정 → 계정 유형 및 도구, 무료)

### 2-2. 액세스 토큰 발급
1. [developers.facebook.com](https://developers.facebook.com) 에서 앱 생성 (유형: 비즈니스/기타)
2. 앱에 **Instagram** 제품 추가 → **Instagram 로그인을 통한 API 설정(API setup with Instagram business login)**
3. "액세스 토큰 생성"에서 @khu_t3 계정을 추가하고 로그인 → **토큰 생성**
4. 생성된 **장기 액세스 토큰(60일 유효)** 을 Vercel 환경변수 `INSTAGRAM_ACCESS_TOKEN` 에 등록 → Redeploy

### 2-3. 토큰 자동 연장
- `vercel.json` 의 Cron이 **매주 월요일** `/api/instagram-refresh` 를 호출해 토큰 유효기간을 60일로 연장합니다.
- Vercel → 프로젝트 → **Logs** 에서 `[instagram-refresh]` 로그로 결과를 확인할 수 있습니다.
- 로그에 "새 토큰이 발급되었습니다" 경고가 보이거나 홈페이지에 피드가 사라지면,
  2-2를 다시 해서 환경변수를 새 토큰으로 바꾸고 Redeploy 하세요.
- 게시물은 1시간 단위로 캐시됩니다. (새 게시물은 최대 1시간 뒤 반영)

---

## 3. 평소 사용법

### 수상기록 추가
1. `https://<배포주소>/admin` 접속 → **GitHub로 로그인**
2. **홈페이지 콘텐츠 → 수상기록 · 연혁**
3. "연혁 · 수상기록" 목록에서 **추가** → 날짜(`2026.11`), 구분(수상), 제목, 상세 내용 입력
   - 중요한 기록은 **강조 표시** 켜기 (타임라인 점이 크게 표시됨)
   - 순서는 신경 쓰지 않아도 됩니다. 홈페이지에서 날짜순으로 자동 정렬됩니다.
4. 필요하면 **히어로 통계**(대회 출전 수, 입상 대회 수)도 함께 수정
5. 우측 상단 **저장(게시)** → 1분 내 홈페이지 반영

### 대문 · 소개 · VICTAS 앰버서더 사진 교체
**홈페이지 콘텐츠 → 메인 사진 관리**에서 아래 3곳 사진을 교체할 수 있습니다.

| 사진 | 표시 위치 |
|---|---|
| 대문(히어로) 사진 | 홈페이지 맨 위 배경 |
| 동아리 소개 사진 | "동아리 소개" 섹션 오른쪽 |
| VICTAS 앰버서더 선발 사진 | "후원사" 섹션 하단 (**매 학기 교체 필요**) |

각 항목에서 사진을 업로드하고 필요하면 대체 텍스트를 수정한 뒤 **저장(게시)**하면 1분 내 반영됩니다.

### 활동 사진 추가·교체
1. **홈페이지 콘텐츠 → 활동 갤러리 사진**
2. **추가** → 사진 업로드, 캡션 입력, 필요 시 "크게 표시(2칸)" 켜기
3. 목록을 드래그해서 순서 변경, 휴지통 아이콘으로 삭제
4. **저장(게시)**

> 📷 사진은 **1MB 이하, 가로 1600px 정도**로 줄여서 올려주세요.
> 휴대폰 원본(3~10MB)을 그대로 올리면 홈페이지가 느려집니다.
> (예: [squoosh.app](https://squoosh.app) 에서 간단히 압축 가능)

---

## 4. 파일 구조 (개발 참고)

| 경로 | 설명 |
|---|---|
| `content/awards.json` | 히어로 통계 + 연혁·수상기록 데이터 |
| `content/gallery.json` | 갤러리 사진 목록 |
| `content/site-images.json` | 대문 · 동아리 소개 · VICTAS 앰버서더 사진 |
| `images/uploads/` | 관리자 대시보드에서 업로드한 사진 |
| `admin/` | 관리자 대시보드 (Decap CMS) |
| `api/auth.js`, `api/callback.js` | 관리자 GitHub 로그인 처리 |
| `api/instagram.js` | 인스타그램 최근 게시물 API |
| `api/instagram-refresh.js` | 인스타그램 토큰 자동 연장 (Cron) |
| `vercel.json` | Cron 및 캐시 설정 |

- 홈페이지는 `script.js` 가 `content/*.json` 을 읽어 화면을 그립니다.
  따라서 `index.html` 을 파일로 직접 더블클릭해 열면 해당 영역이 비어 보입니다.
  로컬 확인은 `npx serve .` 등 로컬 서버로 열어주세요.
- 로컬에서 관리자 화면을 테스트하려면: 프로젝트 폴더에서 `npx decap-server` 실행 후
  로컬 서버의 `/admin` 접속 (로그인 없이 로컬 파일을 직접 수정).
