// Motion Matrix — Client-Side Logic v2
document.addEventListener('DOMContentLoaded', () => {

    // ─── 1. Navbar Scroll ─────────────────────────────────────
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            navbar.classList.toggle('scrolled', window.scrollY > 40);
        }, { passive: true });
    }

    // ─── 2. Mobile Menu Toggle ────────────────────────────────
    const menuToggle = document.getElementById('menuToggle');
    const navLinks   = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('open');
            menuToggle.setAttribute('aria-expanded', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });

        // Close on nav link click
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('open');
                menuToggle.setAttribute('aria-expanded', 'false');
                document.body.style.overflow = '';
            });
        });
    }

    // ─── 3. Client Logo Scroller ──────────────────────────────
    const scrollers = document.querySelectorAll('.scroller');
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        scrollers.forEach(scroller => {
            scroller.setAttribute('data-animated', true);
            const inner = scroller.querySelector('.scroller__inner');
            if (inner) {
                Array.from(inner.children).forEach(item => {
                    const clone = item.cloneNode(true);
                    clone.setAttribute('aria-hidden', true);
                    inner.appendChild(clone);
                });
            }
        });
    }

    // ─── 4. Testimonial Scroller — duplicate cards ────────────
    ['testiTrack1', 'testiTrack2'].forEach(id => {
        const track = document.getElementById(id);
        if (!track) return;
        const cards = Array.from(track.children);
        cards.forEach(card => {
            const clone = card.cloneNode(true);
            clone.setAttribute('aria-hidden', true);
            track.appendChild(clone);
        });
    });

    // ─── 5. Custom Cursor ─────────────────────────────────────
    const cursor = document.querySelector('.cursor');
    if (cursor) {
        document.addEventListener('mousemove', e => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top  = e.clientY + 'px';
        }, { passive: true });

        document.querySelectorAll('a, button, .portfolio-card, .premium-card, input, select, textarea').forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.style.transform = 'translate(-50%, -50%) scale(2.2)';
                cursor.style.backgroundColor = 'rgba(198, 255, 61, 0.12)';
            });
            el.addEventListener('mouseleave', () => {
                cursor.style.transform = 'translate(-50%, -50%) scale(1)';
                cursor.style.backgroundColor = 'transparent';
            });
        });
    }

    // ─── 6. GSAP Animations ───────────────────────────────────
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        // Hero text carousel — show word 0 immediately, then cycle
        const words = gsap.utils.toArray('.animated-word');
        if (words.length > 0) {
            let current = 0;
            // Reset all to hidden, then show first
            gsap.set(words, { opacity: 0, y: '-120%' });
            gsap.set(words[0], { opacity: 1, y: '0%' });

            setInterval(() => {
                const prev = current;
                current = (current + 1) % words.length;
                gsap.to(words[prev], { y: '120%', opacity: 0, duration: 0.5, ease: 'power2.inOut' });
                gsap.fromTo(words[current],
                    { y: '-120%', opacity: 0 },
                    { y: '0%', opacity: 1, duration: 0.5, ease: 'power2.inOut', delay: 0.05 }
                );
            }, 2600);
        }

        // Hero content entrance
        gsap.from('.hero-content .eyebrow', { y: 30, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.2 });
        gsap.from('.hero-title', { y: 50, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.35 });
        gsap.from('.hero-subtitle', { y: 30, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.55 });
        gsap.from('.hero-actions', { y: 24, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 0.7 });

        // Stats counter — loops continuously
        const statNums = document.querySelectorAll('.stat-num[data-target]');
        if (statNums.length) {
            function loopStat(el, target) {
                const ticker = { val: 0 };
                function cycle() {
                    gsap.fromTo(ticker,
                        { val: 0 },
                        {
                            val: target,
                            duration: 1.6,
                            ease: 'power2.out',
                            onUpdate() { el.textContent = Math.round(ticker.val); },
                            onComplete() {
                                setTimeout(cycle, 3200); // hold then restart
                            }
                        }
                    );
                }
                // Start when stats bar enters view, then keep looping
                ScrollTrigger.create({
                    trigger: '.stats-bar',
                    start: 'top 85%',
                    once: true,
                    onEnter: cycle
                });
            }

            statNums.forEach(el => {
                loopStat(el, parseInt(el.dataset.target, 10));
            });
        }

        // Section reveals — staggered cards
        const revealSections = [
            { trigger: '#work',      targets: '.portfolio-card',  stagger: 0.1 },
            { trigger: '#services',  targets: '.premium-card',    stagger: 0.08 },
            { trigger: '#why-us',    targets: '.feature-block',   stagger: 0.1 },
            { trigger: '#process',   targets: '.process-step',    stagger: 0.1 },
        ];

        revealSections.forEach(({ trigger, targets, stagger }) => {
            const els = document.querySelectorAll(targets);
            if (!els.length) return;
            gsap.from(els, {
                scrollTrigger: { trigger, start: 'top 78%' },
                y: 56,
                opacity: 0,
                duration: 0.75,
                stagger,
                ease: 'power3.out',
            });
        });

        // Section headers
        document.querySelectorAll('.section-header').forEach(header => {
            gsap.from(header, {
                scrollTrigger: { trigger: header, start: 'top 82%' },
                y: 36,
                opacity: 0,
                duration: 0.7,
                ease: 'power3.out',
            });
        });

        // Contact section
        gsap.from('#contactInfoArea', {
            scrollTrigger: { trigger: '#contact', start: 'top 75%' },
            x: -40, opacity: 0, duration: 0.8, ease: 'power3.out'
        });
        gsap.from('#formWrapper', {
            scrollTrigger: { trigger: '#contact', start: 'top 75%' },
            x: 40, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.15
        });
    }

    // ─── 7. GA4 Event Trackers ────────────────────────────────
    function trackGAEvent(name, params) {
        if (typeof gtag === 'function') gtag('event', name, params);
    }

    const btnBook  = document.getElementById('heroCtaCall');
    const btnWork  = document.getElementById('heroCtaWork');
    const btnNav   = document.getElementById('navBtnContact');

    if (btnBook) btnBook.addEventListener('click', () => trackGAEvent('click_cta_book_call', { event_category: 'Conversion' }));
    if (btnWork) btnWork.addEventListener('click', () => trackGAEvent('click_cta_see_work', { event_category: 'Engagement' }));
    if (btnNav)  btnNav.addEventListener('click',  () => trackGAEvent('click_nav_start_project', { event_category: 'Conversion' }));

    // ─── 8. Lead Capture Form ─────────────────────────────────
    const leadForm    = document.getElementById('leadForm');
    const formMessage = document.getElementById('formMessage');
    const submitBtn   = document.getElementById('submitBtn');
    const successModal = document.getElementById('successModal');
    const closeModalBtn = document.getElementById('closeModalBtn');

    if (leadForm) {
        leadForm.addEventListener('submit', async e => {
            e.preventDefault();
            const orig = submitBtn.innerText;
            submitBtn.innerText = 'Submitting...';
            submitBtn.disabled = true;
            formMessage.style.display = 'none';

            const payload = {
                name:    document.getElementById('name').value.trim(),
                email:   document.getElementById('email').value.trim(),
                company: document.getElementById('company')?.value.trim() || '',
                phone:   document.getElementById('phone')?.value.trim() || '',
                service: document.getElementById('service').value,
                message: document.getElementById('message').value.trim(),
                source:  'website_homepage_lead_form'
            };

            try {
                const res    = await fetch('/api/submit-lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                const result = await res.json();
                if (res.ok && result.success) {
                    trackGAEvent('lead_form_submit', { event_category: 'Engagement', service_selected: payload.service });
                    leadForm.reset();
                    if (successModal) successModal.classList.add('active');
                } else {
                    throw new Error(result.error || 'Server error.');
                }
            } catch (err) {
                formMessage.textContent = err.message || 'Connection issue. Please try again.';
                formMessage.className = 'form-message error';
                formMessage.style.display = 'block';
            } finally {
                submitBtn.innerText = orig;
                submitBtn.disabled = false;
            }
        });
    }

    if (closeModalBtn && successModal) {
        closeModalBtn.addEventListener('click', () => successModal.classList.remove('active'));
    }

    // ─── 9. Portfolio Loader ──────────────────────────────────
    const portfolioGrid       = document.getElementById('portfolioGrid');
    const portfolioScrollerWrap = document.getElementById('portfolioScrollerWrap');
    const portfolioLoading    = document.getElementById('portfolioLoading');

    // Static fallback — shown immediately while Supabase loads
    const STATIC_PORTFOLIO = [
        { id: 's1', title: 'Simplifying Complexity',   category: 'Explainer Videos',              image_url: '/assets/portfolio-explainer.png',    project_url: 'https://dribbble.com/shots/26396711-Explainer-Videofolio' },
        { id: 's2', title: 'Authentic Stories',        category: 'Testimonial Videos',             image_url: '/assets/portfolio-testimonial.png',  project_url: 'https://dribbble.com/shots/26396561-Testimonial-Video-Series' },
        { id: 's3', title: 'Audio & Visual Excellence',category: 'Podcast Production',             image_url: '/assets/portfolio-podcast.png',      project_url: 'https://dribbble.com/shots/26396458-Refyne-Podcast' },
        { id: 's4', title: 'Campaign Assets',          category: 'Marketing Creatives',            image_url: '/assets/portfolio-creative.png',     project_url: 'https://dribbble.com/shots/26396432-Refyne-Graphic-Visual-Design-for-Marketing-Collaterals' },
        { id: 's5', title: 'Conversion Drivers',       category: 'Performance Marketing Campaigns',image_url: '/assets/portfolio-performance.png',  project_url: 'https://dribbble.com/shots/26396658-Performance-Ad-Portfolio' },
    ];

    if (portfolioGrid && portfolioLoading) {
        loadPortfolio();
    }

    async function loadPortfolio() {
        try {
            const configRes = await fetch('/api/config');
            const config    = await configRes.json();

            if (!config.supabaseUrl || !config.supabaseAnonKey) {
                throw new Error('Supabase not configured');
            }

            if (!window.supabase) {
                await new Promise((resolve, reject) => {
                    const s = document.createElement('script');
                    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                    s.onload = resolve; s.onerror = reject;
                    document.head.appendChild(s);
                });
            }

            const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
            const { data: projects, error } = await client
                .from('portfolio_projects')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;

            portfolioLoading.style.display = 'none';

            if (!projects || projects.length === 0) {
                renderPortfolio(STATIC_PORTFOLIO);
            } else {
                renderPortfolio(projects);
            }

        } catch {
            portfolioLoading.style.display = 'none';
            renderPortfolio(STATIC_PORTFOLIO);
        }
    }

    function renderPortfolio(projects) {
        portfolioGrid.innerHTML = '';

        // Render cards into the track
        projects.forEach(proj => {
            const article = document.createElement('article');
            article.className = 'portfolio-card';
            if (proj.project_url) {
                article.addEventListener('click', () => window.open(proj.project_url, '_blank'));
            }
            article.innerHTML = `
                <div class="portfolio-img-wrapper">
                    <img src="${proj.image_url}" alt="${proj.title}" class="portfolio-img" loading="lazy">
                    <div class="portfolio-overlay">
                        <span class="portfolio-overlay-cta">View on Dribbble</span>
                    </div>
                </div>
                <div class="portfolio-info">
                    <span class="portfolio-category">${proj.category}</span>
                    <h3 class="portfolio-title">${proj.title}</h3>
                </div>
            `;
            portfolioGrid.appendChild(article);
        });

        // Duplicate cards for seamless infinite loop
        Array.from(portfolioGrid.children).forEach(card => {
            const clone = card.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            // Re-attach click on clone
            const url = projects[Array.from(portfolioGrid.children).indexOf(card)]?.project_url;
            if (url) clone.addEventListener('click', () => window.open(url, '_blank'));
            portfolioGrid.appendChild(clone);
        });

        // Show the scroller wrapper
        if (portfolioScrollerWrap) portfolioScrollerWrap.style.display = 'block';
    }

});
