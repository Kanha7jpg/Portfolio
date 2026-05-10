document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('interactive-bg');
    const ctx = canvas.getContext('2d');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pointer = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        targetX: window.innerWidth / 2,
        targetY: window.innerHeight / 2,
        active: false,
        pulse: 0
    };
    let particles = [];
    let animationFrame;

    const themeColors = () => {
        const styles = getComputedStyle(document.body);
        return {
            primary: styles.getPropertyValue('--primary-color').trim() || '#6C63FF',
            secondary: styles.getPropertyValue('--secondary-color').trim() || '#03dac6',
            text: styles.getPropertyValue('--text-color').trim() || '#e0e0e0'
        };
    };

    const hexToRgb = (hex) => {
        const normalized = hex.replace('#', '').trim();
        if (normalized.length !== 6) return '108, 99, 255';
        const value = Number.parseInt(normalized, 16);
        return `${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}`;
    };

    const resizeInteractiveBackground = () => {
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = window.innerWidth * pixelRatio;
        canvas.height = window.innerHeight * pixelRatio;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const particleCount = Math.min(90, Math.max(36, Math.floor((window.innerWidth * window.innerHeight) / 18000)));
        particles = Array.from({ length: particleCount }, () => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            vx: (Math.random() - 0.5) * 0.45,
            vy: (Math.random() - 0.5) * 0.45,
            radius: Math.random() * 2 + 0.8,
            orbit: Math.random() * Math.PI * 2
        }));
    };

    const drawInteractiveBackground = () => {
        const { primary, secondary, text } = themeColors();
        const primaryRgb = hexToRgb(primary);
        const secondaryRgb = hexToRgb(secondary);
        pointer.x += (pointer.targetX - pointer.x) * 0.08;
        pointer.y += (pointer.targetY - pointer.y) * 0.08;
        pointer.pulse *= 0.94;

        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        const glow = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 320 + pointer.pulse);
        glow.addColorStop(0, `rgba(${primaryRgb}, 0.28)`);
        glow.addColorStop(0.45, `rgba(${secondaryRgb}, 0.12)`);
        glow.addColorStop(1, 'rgba(10, 10, 10, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

        particles.forEach((particle, index) => {
            const dx = particle.x - pointer.x;
            const dy = particle.y - pointer.y;
            const distance = Math.hypot(dx, dy);
            const influence = Math.max(0, 1 - distance / 180);

            if (!reducedMotion) {
                particle.orbit += 0.01;
                particle.x += particle.vx + Math.cos(particle.orbit) * 0.08 + (dx / Math.max(distance, 1)) * influence * 1.8;
                particle.y += particle.vy + Math.sin(particle.orbit) * 0.08 + (dy / Math.max(distance, 1)) * influence * 1.8;
            }

            if (particle.x < -20) particle.x = window.innerWidth + 20;
            if (particle.x > window.innerWidth + 20) particle.x = -20;
            if (particle.y < -20) particle.y = window.innerHeight + 20;
            if (particle.y > window.innerHeight + 20) particle.y = -20;

            for (let next = index + 1; next < particles.length; next++) {
                const other = particles[next];
                const linkDistance = Math.hypot(particle.x - other.x, particle.y - other.y);
                if (linkDistance < 135) {
                    ctx.strokeStyle = `rgba(${primaryRgb}, ${0.18 * (1 - linkDistance / 135)})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particle.x, particle.y);
                    ctx.lineTo(other.x, other.y);
                    ctx.stroke();
                }
            }

            const size = particle.radius + influence * 2.8;
            ctx.fillStyle = index % 3 === 0 ? secondary : index % 2 === 0 ? primary : text;
            ctx.globalAlpha = 0.35 + influence * 0.45;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        animationFrame = requestAnimationFrame(drawInteractiveBackground);
    };

    resizeInteractiveBackground();
    drawInteractiveBackground();

    window.addEventListener('resize', resizeInteractiveBackground);

    window.addEventListener('pointermove', (e) => {
        pointer.targetX = e.clientX;
        pointer.targetY = e.clientY;
        pointer.active = true;
        document.documentElement.style.setProperty('--mouse-x', `${(e.clientX / window.innerWidth) * 100}%`);
        document.documentElement.style.setProperty('--mouse-y', `${(e.clientY / window.innerHeight) * 100}%`);
    });

    window.addEventListener('pointerdown', (e) => {
        pointer.targetX = e.clientX;
        pointer.targetY = e.clientY;
        pointer.pulse = 160;
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cancelAnimationFrame(animationFrame);
        } else {
            drawInteractiveBackground();
        }
    });

    // Custom Cursor
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');

    window.addEventListener('mousemove', (e) => {
        const posX = e.clientX;
        const posY = e.clientY;

        // Dot follows instantly
        cursorDot.style.left = `${posX}px`;
        cursorDot.style.top = `${posY}px`;

        // Outline follows with slight delay
        cursorOutline.animate({
            left: `${posX}px`,
            top: `${posY}px`
        }, { duration: 500, fill: "forwards" });
    });

    // Add hover effect for links and buttons
    const hoverables = document.querySelectorAll('a, button, .project-card, .resume-highlights');
    hoverables.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursorOutline.classList.add('hovered');
            cursorOutline.style.width = '60px';
            cursorOutline.style.height = '60px';
        });
        el.addEventListener('mouseleave', () => {
            cursorOutline.classList.remove('hovered');
            cursorOutline.style.width = '40px';
            cursorOutline.style.height = '40px';
        });
    });

    // Active Navigation Link on Scroll
    const sections = document.querySelectorAll('section, header');
    const navLinks = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });

    // Dark/Light Mode Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    const icon = themeToggle.querySelector('i');

    // Check for saved user preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.setAttribute('data-theme', savedTheme);
        if (savedTheme === 'light') {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        } else {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }

    themeToggle.addEventListener('click', () => {
        if (body.getAttribute('data-theme') === 'light') {
            body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            body.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    });

    // Tilt Effect for Project Cards (Simple JS implementation)
    const cards = document.querySelectorAll('.project-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -5; // Max rotation deg
            const rotateY = ((x - centerX) / centerX) * 5;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    });

    // Smooth Scroll for Internal Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Form Submission (Simulated)
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('button');
            const originalText = btn.innerHTML;
            
            btn.innerHTML = '<span>Message Sent!</span> <i class="fas fa-check"></i>';
            btn.style.backgroundColor = '#03dac6';
            btn.style.borderColor = '#03dac6';
            
            setTimeout(() => {
                form.reset();
                btn.innerHTML = originalText;
                btn.style.backgroundColor = '';
                btn.style.borderColor = '';
            }, 3000);
        });
    }

    // Resume Modal
    const resumeBtn = document.getElementById('resume-btn');
    const resumeModal = document.getElementById('resume-modal');
    const resumeModalClose = document.getElementById('resume-modal-close');

    if (resumeBtn) {
        resumeBtn.addEventListener('click', () => {
            resumeModal.classList.add('active');
        });
    }

    if (resumeModalClose) {
        resumeModalClose.addEventListener('click', () => {
            resumeModal.classList.remove('active');
        });
    }

    // Close modal on outside click
    if (resumeModal) {
        resumeModal.addEventListener('click', (e) => {
            if (e.target === resumeModal) {
                resumeModal.classList.remove('active');
            }
        });
    }

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            resumeModal.classList.remove('active');
        }
    });
});
