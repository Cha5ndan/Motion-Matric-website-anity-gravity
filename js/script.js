// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {

    // 1. Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.add('scrolled'); // we want slightly translucent initially too wait - no, let's toggle it
            // Actually, keep it simple
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    });

    // Handle duplicate inner for infinite scroll logo bar
    const scrollers = document.querySelectorAll(".scroller");
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        addAnimation();
    }

    function addAnimation() {
        scrollers.forEach((scroller) => {
            scroller.setAttribute("data-animated", true);
            const scrollerInner = scroller.querySelector(".scroller__inner");
            const scrollerContent = Array.from(scrollerInner.children);

            // Duplicate items to ensure smooth infinite loop
            scrollerContent.forEach((item) => {
                const duplicatedItem = item.cloneNode(true);
                duplicatedItem.setAttribute("aria-hidden", true);
                scrollerInner.appendChild(duplicatedItem);
            });
        });
    }

    // Custom Cursor Logic
    const cursor = document.querySelector('.cursor');
    if (cursor) {
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });

        // Add hover effects for cursor
        const hoverables = document.querySelectorAll('a, button, .portfolio-card, input, select, textarea');
        hoverables.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursor.style.transform = 'translate(-50%, -50%) scale(2)';
                cursor.style.backgroundColor = 'rgba(255,255,255,0.1)';
            });
            el.addEventListener('mouseleave', () => {
                cursor.style.transform = 'translate(-50%, -50%) scale(1)';
                cursor.style.backgroundColor = 'transparent';
            });
        });
    }

    // GSAP Animations (if loaded)
    if (typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        // Animated Hero Word Loop Setup
        const words = gsap.utils.toArray('.animated-word');
        if (words.length > 0) {
            let currentIndex = 0;

            // Initialize first word immediately
            gsap.set(words[0], { opacity: 1, y: 0 });

            setInterval(() => {
                const prevIndex = currentIndex;
                currentIndex = (currentIndex + 1) % words.length;

                // Animate old word out to the bottom or top depending on effect preference
                gsap.to(words[prevIndex], {
                    y: "150%",
                    opacity: 0,
                    duration: 0.6,
                    ease: "power2.inOut"
                });

                // Prep new word at top and animate it down to center
                gsap.set(words[currentIndex], { y: "-150%", opacity: 0 });
                gsap.to(words[currentIndex], {
                    y: "0%",
                    opacity: 1,
                    duration: 0.6,
                    ease: "power2.inOut"
                });

            }, 2000);
        }

        // Hero Reveal
        const heroTl = gsap.timeline();
        heroTl.from(".hero-title", {
            y: 50,
            opacity: 0,
            duration: 1,
            ease: "power3.out",
            delay: 0.2
        })
            .from(".hero-subtitle", {
                y: 20,
                opacity: 0,
                duration: 0.8,
                ease: "power2.out"
            }, "-=0.6")
            .from(".hero-actions", {
                y: 20,
                opacity: 0,
                duration: 0.8,
                ease: "power2.out"
            }, "-=0.6");

        // General Fade Up Elements
        gsap.utils.toArray('.fade-up').forEach(element => {
            gsap.from(element, {
                scrollTrigger: {
                    trigger: element,
                    start: "top 85%",
                    toggleActions: "play none none none"
                },
                y: 50,
                opacity: 0,
                duration: 0.8,
                ease: "power3.out"
            });
        });

        // General Fade In Elements
        gsap.utils.toArray('.fade-in').forEach(element => {
            gsap.from(element, {
                scrollTrigger: {
                    trigger: element,
                    start: "top 85%",
                    toggleActions: "play none none none"
                },
                opacity: 0,
                duration: 1,
                ease: "power2.inOut"
            });
        });
    }

    // Contact Form Logic (Google Sheets via Apps Script)
    const leadForm = document.getElementById('leadForm');
    const formMessage = document.getElementById('formMessage');
    const submitBtn = document.getElementById('submitBtn');

    if (leadForm) {
        leadForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // Disable button
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = 'Sending...';
            submitBtn.disabled = true;

            const formData = new FormData(leadForm);

            // Webhook mapped to Zapier URL provided
            const scriptURL = 'https://hooks.zapier.com/hooks/catch/26725865/ux4ghwt/';

            fetch(scriptURL, { method: 'POST', body: formData, mode: 'no-cors' })
                .then(response => {
                    // Because no-cors masks response data, assume success
                    formMessage.style.display = 'none';
                    leadForm.reset();
                    submitBtn.innerText = originalBtnText;
                    submitBtn.disabled = false;

                    // Show Modal
                    const modal = document.getElementById('successModal');
                    modal.classList.add('active');
                })
                .catch(error => {
                    formMessage.textContent = "Oops! Something went wrong. Please try again.";
                    formMessage.className = 'form-message error';
                    formMessage.style.display = 'block';
                    console.error('Error!', error.message);
                    submitBtn.innerText = originalBtnText;
                    submitBtn.disabled = false;
                });
        });
    }

    // Modal Close Logic
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            document.getElementById('successModal').classList.remove('active');
        });
    }

});
