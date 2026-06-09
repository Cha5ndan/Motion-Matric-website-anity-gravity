// Motion Matrix Client-Side Logic
document.addEventListener('DOMContentLoaded', () => {

    // 1. Navbar Scroll Toggle
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 40) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // 2. Infinite Scroll Logo Bar Animation Loop
    const scrollers = document.querySelectorAll(".scroller");
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        scrollers.forEach((scroller) => {
            scroller.setAttribute("data-animated", true);
            const scrollerInner = scroller.querySelector(".scroller__inner");
            if (scrollerInner) {
                const scrollerContent = Array.from(scrollerInner.children);
                // Duplicate items to ensure smooth infinite loop
                scrollerContent.forEach((item) => {
                    const duplicatedItem = item.cloneNode(true);
                    duplicatedItem.setAttribute("aria-hidden", true);
                    scrollerInner.appendChild(duplicatedItem);
                });
            }
        });
    }

    // 3. Custom Brand Cursor Tracking
    const cursor = document.querySelector('.cursor');
    if (cursor) {
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });

        // Add magnetic scale-up effect on hoverables
        const hoverables = document.querySelectorAll('a, button, .portfolio-card, .premium-card, input, select, textarea, .filter-tab');
        hoverables.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.style.transform = 'translate(-50%, -50%) scale(2)';
                cursor.style.backgroundColor = 'rgba(198, 255, 61, 0.15)';
                cursor.style.borderColor = '#C6FF3D';
            });
            el.addEventListener('mouseleave', () => {
                cursor.style.transform = 'translate(-50%, -50%) scale(1)';
                cursor.style.backgroundColor = 'transparent';
                cursor.style.borderColor = '#C6FF3D';
            });
        });
    }

    // 4. GSAP Text Loop Carousel (Hero Headlines)
    if (typeof gsap !== 'undefined') {
        const words = gsap.utils.toArray('.animated-word');
        if (words.length > 0) {
            let currentIndex = 0;

            // Hide other words initially to prevent layouts overlaps and flash
            gsap.set(words, { opacity: 0, y: "-120%" });
            gsap.set(words[0], { opacity: 1, y: "0%" });

            setInterval(() => {
                const prevIndex = currentIndex;
                currentIndex = (currentIndex + 1) % words.length;

                // Animate old word out downwards
                gsap.to(words[prevIndex], {
                    y: "120%",
                    opacity: 0,
                    duration: 0.5,
                    ease: "power2.inOut"
                });

                // Prepare new word top and animate down to center
                gsap.set(words[currentIndex], { y: "-120%", opacity: 0 });
                gsap.to(words[currentIndex], {
                    y: "0%",
                    opacity: 1,
                    duration: 0.5,
                    ease: "power2.inOut"
                });

            }, 2600);
        }
    }

    // 5. GA4 Custom Event Trackers on CTA clicks
    const btnBookCall = document.getElementById('heroCtaCall');
    const btnSeeWork = document.getElementById('heroCtaWork');
    const navBtnContact = document.getElementById('navBtnContact');

    function trackGAEvent(eventName, params) {
        if (typeof gtag === 'function') {
            gtag('event', eventName, params);
        }
    }

    if (btnBookCall) {
        btnBookCall.addEventListener('click', () => {
            trackGAEvent('click_cta_book_call', {
                'event_category': 'Conversion',
                'event_label': 'Hero CTA Calendar'
            });
        });
    }

    if (btnSeeWork) {
        btnSeeWork.addEventListener('click', () => {
            trackGAEvent('click_cta_see_work', {
                'event_category': 'Engagement',
                'event_label': 'Hero CTA Selected Work'
            });
        });
    }

    if (navBtnContact) {
        navBtnContact.addEventListener('click', () => {
            trackGAEvent('click_nav_start_project', {
                'event_category': 'Conversion',
                'event_label': 'Navigation Action Button'
            });
        });
    }

    // 6. Lead Capture Form Submission Handler
    const leadForm = document.getElementById('leadForm');
    const formMessage = document.getElementById('formMessage');
    const submitBtn = document.getElementById('submitBtn');
    const successModal = document.getElementById('successModal');
    const closeModalBtn = document.getElementById('closeModalBtn');

    if (leadForm) {
        leadForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Button loading visual feedback
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = 'Submitting...';
            submitBtn.disabled = true;
            formMessage.style.display = 'none';

            // Extract fields
            const payload = {
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                company: document.getElementById('company') ? document.getElementById('company').value.trim() : '',
                phone: document.getElementById('phone') ? document.getElementById('phone').value.trim() : '',
                service: document.getElementById('service').value,
                message: document.getElementById('message').value.trim(),
                source: 'website_homepage_lead_form'
            };

            try {
                const response = await fetch('/api/submit-lead', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (response.ok && result.success) {
                    // GA4 Form Track Event Success
                    trackGAEvent('lead_form_submit', {
                        'event_category': 'Engagement',
                        'event_label': 'Lead Form Submit Success',
                        'service_selected': payload.service
                    });

                    leadForm.reset();
                    
                    // Show success confirmation modal
                    if (successModal) {
                        successModal.classList.add('active');
                    } else {
                        formMessage.textContent = "Thank you! Your inquiry was submitted successfully.";
                        formMessage.className = 'form-message success';
                        formMessage.style.display = 'block';
                    }
                } else {
                    throw new Error(result.error || 'Server error occurred during lead saving.');
                }

            } catch (err) {
                console.error('Lead submit error:', err);
                formMessage.textContent = err.message || "Oops! There was a connection issue. Please try again.";
                formMessage.className = 'form-message error';
                formMessage.style.display = 'block';
                
                trackGAEvent('lead_form_error', {
                    'event_category': 'Error',
                    'event_label': err.message || 'Unknown Connection Error'
                });
            } finally {
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    // Modal Close Logic
    if (closeModalBtn && successModal) {
        closeModalBtn.addEventListener('click', () => {
            successModal.classList.remove('active');
        });
    }

    // 7. Dynamic Portfolio Loader from Supabase (Headless integration)
    const portfolioGrid = document.getElementById('portfolioGrid');
    const portfolioLoading = document.getElementById('portfolioLoading');

    if (portfolioGrid && portfolioLoading) {
        loadPortfolio();
    }

    async function loadPortfolio() {
        try {
            // Load configuration parameters
            const configRes = await fetch('/api/config');
            const config = await configRes.json();

            if (!config.supabaseUrl || !config.supabaseAnonKey) {
                throw new Error("Supabase credentials are not configured.");
            }

            // Dynamic import of Supabase SDK from CDN to maximize Initial Page Load Performance
            if (!window.supabase) {
                await new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            const supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);

            // Query projects
            const { data: projects, error } = await supabase
                .from('portfolio_projects')
                .select('*')
                .order('sort_order', { ascending: true });

            if (error) throw error;

            portfolioLoading.style.display = 'none';

            if (!projects || projects.length === 0) {
                portfolioLoading.innerText = 'No portfolio items published.';
                portfolioLoading.style.display = 'block';
            } else {
                portfolioGrid.style.display = 'grid';
                renderPortfolio(projects);
            }

        } catch (err) {
            console.error('Failed to load portfolio items:', err);
            portfolioLoading.innerHTML = `<span style="color: #ff5252; font-family: var(--font-mono);">Failed to fetch portfolio: ${err.message}</span>`;
        }
    }

    function renderPortfolio(projects) {
        portfolioGrid.innerHTML = '';
        projects.forEach((proj) => {
            const article = document.createElement('article');
            article.className = 'portfolio-card';
            article.id = `project-${proj.id}`;

            if (proj.project_url) {
                article.addEventListener('click', () => {
                    window.open(proj.project_url, '_blank');
                });
            }

            article.innerHTML = `
                <div class="portfolio-img-wrapper">
                    <img src="${proj.image_url}" alt="${proj.title} Case Study" class="portfolio-img" loading="lazy">
                </div>
                <div class="portfolio-info">
                    <span class="portfolio-category">${proj.category}</span>
                    <h3 class="portfolio-title">${proj.title}</h3>
                </div>
            `;
            
            // Add custom cursor scale animations
            if (cursor) {
                article.addEventListener('mouseenter', () => {
                    cursor.style.transform = 'translate(-50%, -50%) scale(2)';
                    cursor.style.backgroundColor = 'rgba(198, 255, 61, 0.15)';
                    cursor.style.borderColor = '#C6FF3D';
                });
                article.addEventListener('mouseleave', () => {
                    cursor.style.transform = 'translate(-50%, -50%) scale(1)';
                    cursor.style.backgroundColor = 'transparent';
                    cursor.style.borderColor = '#C6FF3D';
                });
            }

            portfolioGrid.appendChild(article);
        });
    }

});
