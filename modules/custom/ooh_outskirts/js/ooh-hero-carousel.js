(function (Drupal, once) {
  Drupal.behaviors.oohHeroLanding = {
    attach(context) {
      once('oohHeroLanding', 'body', context).forEach(() => {
        const root = document.querySelector('[data-ooh-hero]');
        if (!root) {
          return;
        }

        const ambientAudio = document.querySelector('[data-ooh-ambient-audio]');
        const isOperationAlphaRoute = window.location.pathname.indexOf('/operation-alpha') !== -1;
        const ambientRetryEvents = ['click', 'pointerdown', 'keydown', 'touchstart'];
        let ambientRetryBound = false;

        const isOperationAlphaEntry = (target) => {
          if (!target || !target.closest) {
            return false;
          }

          return !!target.closest('a[href*="operation-alpha"], button[data-ooh-operation-alpha], .ooh-operation-alpha-button, .ooh-enter-operation-alpha, [data-ooh-action="operation-alpha"]');
        };

        const removeAmbientRetries = () => {
          if (!ambientRetryBound) {
            return;
          }
          ambientRetryEvents.forEach((eventName) => {
            document.removeEventListener(eventName, playAmbient);
          });
          ambientRetryBound = false;
        };

        const stopAmbientNow = () => {
          if (!ambientAudio) {
            return;
          }

          removeAmbientRetries();
          ambientAudio.pause();
          ambientAudio.currentTime = 0;
        };

        const playAmbient = (event) => {
          if (event && isOperationAlphaEntry(event.target)) {
            stopAmbientNow();
            return;
          }
          if (!ambientAudio || !ambientAudio.paused) {
            removeAmbientRetries();
            return;
          }
          ambientAudio.volume = 0.18;
          ambientAudio.play().then(removeAmbientRetries).catch(() => {});
        };

        const bindAmbientRetries = () => {
          if (ambientRetryBound) {
            return;
          }
          ambientRetryEvents.forEach((eventName) => {
            document.addEventListener(eventName, playAmbient, { passive: true });
          });
          ambientRetryBound = true;
        };

        const fadeAmbientAndRoute = (href) => {
          if (!ambientAudio) {
            window.location.href = href;
            return;
          }

          removeAmbientRetries();

          if (ambientAudio.paused) {
            window.location.href = href;
            return;
          }

          const startVolume = ambientAudio.volume || 0.18;
          const steps = 8;
          let step = 0;
          const fadeTimer = window.setInterval(() => {
            step += 1;
            ambientAudio.volume = Math.max(0, startVolume * (1 - step / steps));
            if (step >= steps) {
              window.clearInterval(fadeTimer);
              ambientAudio.pause();
              ambientAudio.currentTime = 0;
              ambientAudio.volume = startVolume;
              window.location.href = href;
            }
          }, 30);
        };

        if (ambientAudio && isOperationAlphaRoute) {
          stopAmbientNow();
        }
        else if (ambientAudio) {
          bindAmbientRetries();
          playAmbient();
        }

        // ----- Modal wiring -----
        const openBtn = document.getElementById('ooh-read-prologue');
        const enterBtn = document.querySelector('[data-ooh-action="enter"]');
        const operationAlphaBtn = document.querySelector('[data-ooh-action="operation-alpha"]');
        const closeBtn = document.getElementById('ooh-close-prologue');
        const modal = document.getElementById('ooh-prologue-modal');
        const backdrop = modal ? modal.querySelector('[data-close="1"]') : null;
        const crawl = document.getElementById('ooh-prologue-crawl');

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

        if (enterBtn) {
          enterBtn.setAttribute('disabled', 'disabled');
          enterBtn.setAttribute('aria-disabled', 'true');
          enterBtn.removeAttribute('href');
          enterBtn.addEventListener('click', (event) => {
            event.preventDefault();
          });
        }

        if (openBtn) {
          openBtn.setAttribute('disabled', 'disabled');
          openBtn.setAttribute('aria-disabled', 'true');
        }

        if (openBtn && !openBtn.hasAttribute('disabled') && openBtn.getAttribute('aria-disabled') !== 'true') {
          openBtn.addEventListener('click', openModal);
        }
        if (operationAlphaBtn) {
          operationAlphaBtn.addEventListener('click', (event) => {
            const href = operationAlphaBtn.getAttribute('href');

            if (!href || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
              return;
            }

            event.preventDefault();
            fadeAmbientAndRoute(href);
          });
        }
        if (closeBtn) {
          closeBtn.addEventListener('click', closeModal);
        }
        if (backdrop) {
          backdrop.addEventListener('click', closeModal);
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
        const video = root.querySelector('.ooh-hero__video:not([data-ooh-homepage-video-disabled="true"])');

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
        };

        const restartTimer = () => {
          startTimer();
        };

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
