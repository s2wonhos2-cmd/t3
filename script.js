// ===== Navbar Scroll Effect =====
const navbar = document.getElementById('navbar');

function handleNavScroll() {
    if (window.scrollY > 80) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}

window.addEventListener('scroll', handleNavScroll);

// ===== Mobile Navigation Toggle =====
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
});

// Close mobile menu when link is clicked
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    });
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
    }
});

// ===== Scroll Animations (Intersection Observer) =====
const observerOptions = {
    root: null,
    rootMargin: '0px 0px -80px 0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe elements for fade-in animation
// (여러 번 호출해도 안전: 이미 등록된 요소는 건너뜀 → 동적으로 렌더링된 요소에도 적용)
const ANIMATED_SELECTOR =
    '.about-text, .about-image, .timeline-item, .activity-card, ' +
    '.training-detail-card, .table-level, .timetable-item, .coach-card, ' +
    '.event-card, .gallery-item, .benefit-card, .sponsor-about, .insta-item';

function initAnimations() {
    const animatedElements = document.querySelectorAll(ANIMATED_SELECTOR);

    animatedElements.forEach((el, index) => {
        if (el.classList.contains('fade-in')) return;
        el.classList.add('fade-in');
        el.style.transitionDelay = `${(index % 6) * 0.1}s`;
        observer.observe(el);
    });
}

// ===== Dynamic Content (관리자 대시보드에서 수정하는 콘텐츠) =====
// content/*.json 은 /admin (Decap CMS)에서 편집되며, 저장 시 GitHub 커밋 → Vercel 자동 재배포됩니다.

async function loadJSON(url) {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${url} 로드 실패 (${res.status})`);
    return res.json();
}

function createEl(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined && text !== null) el.textContent = text;
    return el;
}

function renderStats(stats) {
    const wrap = document.getElementById('heroStats');
    if (!wrap || !Array.isArray(stats)) return;
    wrap.replaceChildren(...stats.map(stat => {
        const item = createEl('div', 'stat-item');
        item.append(
            createEl('span', 'stat-number', stat.number),
            createEl('span', 'stat-label', stat.label)
        );
        return item;
    }));
    wrap.classList.add('is-loaded');
}

function renderTimeline(entries) {
    const wrap = document.getElementById('timeline');
    if (!wrap || !Array.isArray(entries)) return;

    // 관리자 화면에서는 최신 항목이 위에 오도록 저장됨 → 화면에는 오래된 순으로 표시
    // (같은 날짜끼리는 입력한 순서 유지)
    const sorted = [...entries].reverse().sort((a, b) =>
        String(a.date || '').localeCompare(String(b.date || ''), 'en', { numeric: true })
    );

    wrap.replaceChildren(...sorted.map(entry => {
        const item = createEl('div', 'timeline-item');
        if (entry.highlight) item.classList.add('highlight');
        if (entry.type === 'award') item.classList.add('timeline-item--award');

        const content = createEl('div', 'timeline-content');
        const title = createEl('h3', null, entry.title);
        if (entry.type === 'award') {
            title.prepend(createEl('span', 'timeline-badge', 'AWARD'));
        }
        content.append(title);
        if (entry.description) content.append(createEl('p', null, entry.description));

        item.append(createEl('div', 'timeline-year', entry.date), content);
        return item;
    }));
}

function renderGallery(items) {
    const wrap = document.getElementById('galleryGrid');
    if (!wrap || !Array.isArray(items)) return;

    wrap.replaceChildren(...items.filter(it => it && it.image).map(it => {
        const item = createEl('div', 'gallery-item');
        if (it.large) item.classList.add('gallery-item--large');

        const img = document.createElement('img');
        img.src = it.image;
        img.alt = it.alt || it.caption || 'T3.s 활동 사진';
        img.loading = 'lazy';
        img.decoding = 'async';
        item.append(img);

        if (it.caption) item.append(createEl('div', 'gallery-caption', it.caption));
        return item;
    }));
}

async function loadSiteContent() {
    const [awards, gallery] = await Promise.allSettled([
        loadJSON('/content/awards.json'),
        loadJSON('/content/gallery.json')
    ]);

    if (awards.status === 'fulfilled') {
        renderStats(awards.value.stats);
        renderTimeline(awards.value.timeline);
    } else {
        console.error(awards.reason);
    }

    if (gallery.status === 'fulfilled') {
        renderGallery(gallery.value.items);
    } else {
        console.error(gallery.reason);
    }
}

// ===== Instagram Feed =====
// /api/instagram (Vercel 서버리스 함수)가 최신 게시물을 반환합니다.
// 토큰 미설정·오류 시에는 피드 영역을 숨기고 '팔로우하기' 버튼만 표시합니다.
const INSTAGRAM_POST_COUNT = 6;

async function loadInstagram() {
    const grid = document.getElementById('instaGrid');
    if (!grid) return;
    grid.classList.add('is-loading');

    try {
        const data = await loadJSON(`/api/instagram?limit=${INSTAGRAM_POST_COUNT}`);
        const posts = Array.isArray(data.posts) ? data.posts : [];
        if (posts.length === 0) throw new Error('표시할 인스타그램 게시물이 없습니다.');

        grid.replaceChildren(...posts.map(post => {
            const link = createEl('a', 'insta-item');
            link.href = post.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            const caption = (post.caption || '').trim();
            link.setAttribute('aria-label', caption ? `인스타그램 게시물: ${caption.slice(0, 60)}` : '인스타그램 게시물 보기');

            const img = document.createElement('img');
            img.src = post.image;
            img.alt = caption ? caption.slice(0, 100) : 'T3.s 인스타그램 게시물';
            img.loading = 'lazy';
            img.decoding = 'async';
            img.referrerPolicy = 'no-referrer';
            link.append(img);

            if (post.type === 'VIDEO' || post.type === 'CAROUSEL_ALBUM') {
                link.append(createEl('span', 'insta-type', post.type === 'VIDEO' ? '▶' : '❐'));
            }
            if (caption) {
                const overlay = createEl('div', 'insta-overlay');
                overlay.append(createEl('p', null, caption));
                link.append(overlay);
            }
            return link;
        }));
        grid.classList.remove('is-loading');
        initAnimations();
    } catch (err) {
        console.warn('[Instagram]', err.message);
        grid.remove();
        document.getElementById('instagram')?.classList.add('instagram--fallback');
    }
}

// ===== Smooth Scroll for anchor links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offset = navbar.offsetHeight + 20;
            const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ===== Active Nav Link on Scroll =====
function highlightNavLink() {
    const scrollY = window.scrollY + 100;

    // 콘텐츠가 비동기로 렌더링되므로 섹션 위치는 매번 다시 계산
    document.querySelectorAll('section[id]').forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');
        const navLink = document.querySelector(`.nav-link[href="#${sectionId}"]`);

        if (navLink) {
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                navLink.classList.add('active');
            } else {
                navLink.classList.remove('active');
            }
        }
    });
}

window.addEventListener('scroll', highlightNavLink);

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', async () => {
    handleNavScroll();
    loadInstagram();
    try {
        await loadSiteContent();
    } finally {
        initAnimations();
    }
});
