(function (Drupal, once) {
  Drupal.behaviors.oohHeroLanding = {
    attach(context) {
      once('oohHeroLanding', '[data-ooh-hero]', context).forEach((root) => {
        // ----- Modal wiring -----
        const openBtn = document.getElementById('ooh-read-prologue');
        const closeBtn = document.getElementById('ooh-close-prologue');
        const modal = document.getElementById('ooh-prologue-modal');
        const backdrop = modal ? modal.querySelector('[data-close="1"]') : null;
        const crawl = document.getElementById('ooh-prologue-crawl');
        const prologueSeenKey = 'ooh_prologue_seen_landing_v1';

        const restartCrawl = () => {
          if (!crawl) {
            return;
          }
          crawl.style.animation = 'none';
          void crawl.offsetHeight;
          crawl.style.animation = '';
        };

        const openModal = () => {
          if (!modal) {
            return;
          }
          modal.classList.add('is-open');
          modal.setAttribute('aria-hidden', 'false');
          document.body.classList.add('ooh-modal-open');
          restartCrawl();
        };

        const closeModal = () => {
          if (!modal) {
            return;
          }
          modal.classList.remove('is-open');
          modal.setAttribute('aria-hidden', 'true');
          document.body.classList.remove('ooh-modal-open');
        };

        if (openBtn) {
          openBtn.addEventListener('click', openModal);
        }
        if (closeBtn) {
          closeBtn.addEventListener('click', closeModal);
        }
        if (backdrop) {
          backdrop.addEventListener('click', closeModal);
        }

        try {
          if (!window.localStorage.getItem(prologueSeenKey)) {
            window.localStorage.setItem(prologueSeenKey, '1');
            window.setTimeout(openModal, 900);
          }
        }
        catch (error) {
          window.setTimeout(openModal, 900);
        }

        document.addEventListener('keydown', (event) => {
          if (event.key === 'Escape' && modal && modal.classList.contains('is-open')) {
            closeModal();
          }
        });

        // ----- Carousel wiring -----
        const slides = Array.from(root.querySelectorAll('.ooh-hero__slide'));
        const dotsWrap = root.querySelector('.ooh-hero__dots');
        const prevBtn = root.querySelector('[data-ooh-carousel-prev]');
        const nextBtn = root.querySelector('[data-ooh-carousel-next]');
        const video = root.querySelector('.ooh-hero__video');

        if (!slides.length) {
          if (video) {
            video.play().catch(() => {
              video.muted = true;
              video.play().catch(() => {});
            });
          }
          return;
        }

        let current = 0;
        let timer = null;
        const delay = 5500;

        if (dotsWrap) {
          dotsWrap.innerHTML = '';
        }

        const dots = slides.map((_, index) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'ooh-hero__dot';
          btn.setAttribute('aria-label', `Go to slide ${index + 1}`);
          btn.setAttribute('aria-pressed', 'false');
          btn.addEventListener('click', () => {
            goTo(index);
            restartTimer();
          });
          if (dotsWrap) {
            dotsWrap.appendChild(btn);
          }
          return btn;
        });

        const update = () => {
          slides.forEach((slide, index) => {
            const isActive = index === current;
            slide.classList.toggle('is-active', isActive);
            slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
          });

          dots.forEach((dot, index) => {
            const isActive = index === current;
            dot.classList.toggle('is-active', isActive);
            dot.setAttribute('aria-pressed', isActive ? 'true' : 'false');
          });
        };

        const goTo = (index) => {
          current = (index + slides.length) % slides.length;
          update();
        };

        const goNext = () => {
          goTo(current + 1);
        };

        const goPrev = () => {
          goTo(current - 1);
        };

        const stopTimer = () => {
          if (timer) {
            window.clearInterval(timer);
            timer = null;
          }
        };

        const startTimer = () => {
          stopTimer();
          timer = window.setInterval(() => {
            goNext();
          }, delay);
        };

        const restartTimer = () => {
          startTimer();
        };

        if (prevBtn) {
          prevBtn.addEventListener('click', () => {
            goPrev();
            restartTimer();
          });
        }

        if (nextBtn) {
          nextBtn.addEventListener('click', () => {
            goNext();
            restartTimer();
          });
        }

        root.addEventListener('mouseenter', stopTimer);
        root.addEventListener('mouseleave', startTimer);

        document.addEventListener('keydown', (event) => {
          if (event.key === 'ArrowRight') {
            goNext();
            restartTimer();
          }
          if (event.key === 'ArrowLeft') {
            goPrev();
            restartTimer();
          }
        });

        if (video) {
          video.play().catch(() => {
            video.muted = true;
            video.play().catch(() => {});
          });
        }

        update();
        startTimer();
      });
    }
  };
})(Drupal, once);
