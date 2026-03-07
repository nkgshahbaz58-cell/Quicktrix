/* ============================================
   QUANTUM.AI — Landing Page Interactions
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ---------- Navbar scroll effect ----------
  const navbar = document.getElementById('navbar');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // ---------- Mobile nav toggle ----------
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');

  navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    // Animate hamburger to X
    const spans = navToggle.querySelectorAll('span');
    if (navLinks.classList.contains('open')) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  });

  // Close mobile nav on link click
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      const spans = navToggle.querySelectorAll('span');
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    });
  });

  // ---------- Intersection Observer for scroll animations ----------
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // Stagger animations
        setTimeout(() => {
          entry.target.classList.add('is-visible');
        }, index * 100);
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });

  // ---------- Smooth scroll for anchor links ----------
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        const offset = navbar.offsetHeight + 20;
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ---------- Code window subtle parallax ----------
  const codeWindow = document.querySelector('.code-window');
  if (codeWindow && window.innerWidth > 768) {
    window.addEventListener('scroll', () => {
      const scrolled = window.scrollY;
      const rate = scrolled * 0.03;
      codeWindow.style.transform = `translateY(${-rate}px)`;
    });
  }

  // ---------- Hero stat counter animation ----------
  const statValues = document.querySelectorAll('.hero-stat-value');
  const animateCounters = () => {
    statValues.forEach(stat => {
      const text = stat.textContent;
      // Only animate numeric values
      if (!isNaN(parseInt(text))) {
        const target = parseInt(text);
        let current = 0;
        const increment = Math.max(1, Math.floor(target / 30));
        const suffix = text.replace(/[0-9]/g, '');
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            stat.textContent = text;
            clearInterval(timer);
          } else {
            stat.textContent = current + suffix;
          }
        }, 40);
      }
    });
  };

  // Trigger counter animation when hero is visible
  const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounters();
        heroObserver.unobserve(entry.target);
      }
    });
  });

  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) heroObserver.observe(heroStats);
});
