(function (Drupal, once) {
  const oohSlideLog = (...args) => {
    console.log('[OOH slides]', ...args);
  };

  oohSlideLog('slide script loaded');

  const readStorage = (storageName, key) => {
    try {
      return window[storageName] ? window[storageName].getItem(key) : null;
    }
    catch (error) {
      return 'unavailable';
    }
  };

  Drupal.behaviors.oohHeroLanding = {
    attach(context) {
      once('oohHeroLanding', 'body', context).forEach(() => {
        const ambientAudio = document.querySelector('[data-ooh-ambient-audio]');
        const isOperationAlphaRoute = window.location.pathname.indexOf('/operation-alpha') !== -1;
        // Refuse landing wind on Operation Alpha routes before any homepage setup.
        if (isOperationAlphaRoute) {
          if (ambientAudio) {
            ambientAudio.pause();
            ambientAudio.currentTime = 0;
          }
          return;
        }

        const root = document.querySelector('[data-ooh-hero]');
        oohSlideLog('slide container found', !!root);
        oohSlideLog('localStorage gate status', {
          prologueGate: 'none',
          localCreditDropDismissed: readStorage('localStorage', 'ooh_credit_drop_dismissed_v1'),
          localStarterCreditsReserved: readStorage('localStorage', 'ooh_starter_credits_reserved_v1'),
          sessionOperationAlphaSeen: readStorage('sessionStorage', 'ooh_operation_alpha_seen_v1')
        });
        if (!root) {
          return;
        }

        const ambientRetryEvents = ['pointerdown', 'click', 'keydown', 'touchstart'];
        let ambientRetryBound = false;
        let ambientStarted = false;
        let ambientFadeTimer = null;
        let ambientPlayWarningLogged = false;
        const ambientTargetVolume = 0.18;

        console.log('[OA wind] script loaded');

        const landingRoot = document.querySelector('[data-ooh-landing-ui]');
        const windSrc = landingRoot ? landingRoot.getAttribute('data-ooh-wind-src') : '';
        const soundButtons = Array.from(document.querySelectorAll('[data-ooh-sound-toggle], [data-ooh-audio-toggle], [data-ooh-ambient-toggle]'));

        const updateSoundButtons = (enabled) => {
          soundButtons.forEach((button) => {
            button.classList.toggle('is-sound-on', enabled);
            button.setAttribute('aria-pressed', enabled ? 'true' : 'false');
            button.textContent = enabled ? 'MUTE' : 'SOUND';
            button.setAttribute('aria-label', enabled ? 'Mute ambient wind' : 'Enable ambient wind');
          });
        };

        const resolveAmbientSource = () => {
          const source = ambientAudio ? ambientAudio.querySelector('source') : null;
          const resolved = windSrc || (source ? source.getAttribute('src') : '') || (ambientAudio ? ambientAudio.getAttribute('src') : '');

          console.log('[OA wind] source resolved', resolved || 'missing');
          return resolved;
        };

        const isOperationAlphaEntry = (target) => {
          if (!target || !target.closest) {
            return false;
          }

          return !!target.closest('a[href*="operation-alpha"], [data-ooh-action="operation-alpha"], [data-ooh-operation-alpha], .ooh-operation-alpha-button, .ooh-enter-operation-alpha');
        };

        const isSoundToggle = (target) => {
          if (!target || !target.closest) {
            return false;
          }

          return !!target.closest('[data-ooh-sound-toggle], [data-ooh-audio-toggle], [data-ooh-ambient-toggle]');
        };

        const removeAmbientRetries = () => {
          if (!ambientRetryBound) {
            return;
          }
          ambientRetryEvents.forEach((eventName) => {
            document.removeEventListener(eventName, unlockAmbient);
          });
          ambientRetryBound = false;
        };

        const armAmbientRetries = () => {
          if (ambientRetryBound || ambientStarted) {
            if (ambientRetryBound) {
              console.log('[OA wind] duplicate initializer skipped');
            }
            return;
          }
          ambientRetryEvents.forEach((eventName) => {
            document.addEventListener(eventName, unlockAmbient, { passive: true });
          });
          ambientRetryBound = true;
          updateSoundButtons(false);
          console.log('[OA wind] unlock listeners armed');
        };

        const fadeAmbientVolume = (targetVolume, onComplete) => {
          const startVolume = ambientAudio ? ambientAudio.volume || 0 : 0;
          const steps = 8;
          let step = 0;

          if (!ambientAudio) {
            if (onComplete) {
              onComplete();
            }
            return;
          }

          if (ambientFadeTimer) {
            window.clearInterval(ambientFadeTimer);
          }

          ambientFadeTimer = window.setInterval(() => {
            step += 1;
            ambientAudio.volume = Math.max(0, Math.min(ambientTargetVolume, startVolume + ((targetVolume - startVolume) * (step / steps))));
            if (step >= steps) {
              window.clearInterval(ambientFadeTimer);
              ambientFadeTimer = null;
              ambientAudio.volume = targetVolume;
              if (onComplete) {
                onComplete();
              }
            }
          }, 30);
        };

        const pauseAmbient = (resetTime = false, onComplete) => {
          if (!ambientAudio) {
            if (onComplete) {
              onComplete();
            }
            return;
          }

          removeAmbientRetries();
          fadeAmbientVolume(0, () => {
            ambientAudio.pause();
            if (resetTime) {
              ambientAudio.currentTime = 0;
            }
            ambientStarted = false;
            updateSoundButtons(false);
            if (onComplete) {
              onComplete();
            }
          });
        };

        const stopAmbientNow = () => {
          if (!ambientAudio) {
            return;
          }

          removeAmbientRetries();
          if (ambientFadeTimer) {
            window.clearInterval(ambientFadeTimer);
            ambientFadeTimer = null;
          }
          ambientAudio.pause();
          ambientAudio.currentTime = 0;
          ambientAudio.volume = ambientTargetVolume;
          ambientStarted = false;
          updateSoundButtons(false);
        };

        const playAmbient = (sourceLabel = 'startup', fadeIn = false) => {
          const resolved = resolveAmbientSource();
          let playPromise;

          if (!ambientAudio) {
            return Promise.resolve(false);
          }
          if (ambientStarted && !ambientAudio.paused) {
            console.log('[OA wind] duplicate initializer skipped');
            removeAmbientRetries();
            return Promise.resolve(true);
          }
          if (resolved && ambientAudio.getAttribute('src') !== resolved) {
            ambientAudio.setAttribute('src', resolved);
          }

          if (ambientFadeTimer) {
            window.clearInterval(ambientFadeTimer);
            ambientFadeTimer = null;
          }
          ambientAudio.muted = false;
          ambientAudio.loop = true;
          ambientAudio.preload = 'auto';
          ambientAudio.volume = fadeIn ? 0 : ambientTargetVolume;

          console.log('[OA wind] autoplay attempted', sourceLabel);
          playPromise = ambientAudio.play();
          if (!playPromise || typeof playPromise.then !== 'function') {
            ambientStarted = !ambientAudio.paused;
            if (ambientStarted) {
              console.log('[OA wind] playback started');
              updateSoundButtons(true);
              removeAmbientRetries();
              if (fadeIn) {
                fadeAmbientVolume(ambientTargetVolume);
              }
            }
            return Promise.resolve(ambientStarted);
          }

          return playPromise.then(() => {
            ambientStarted = true;
            console.log('[OA wind] playback started');
            updateSoundButtons(true);
            removeAmbientRetries();
            if (fadeIn) {
              fadeAmbientVolume(ambientTargetVolume);
            }
            return true;
          }).catch((error) => {
            if (!ambientPlayWarningLogged) {
              ambientPlayWarningLogged = true;
              console.warn('[OOH landing audio] Ambient wind play() failed; keeping Sound button state.', error);
            }
            updateSoundButtons(false);
            armAmbientRetries();
            return false;
          });
        };

        function unlockAmbient(event) {
          if (event && isOperationAlphaEntry(event.target)) {
            stopAmbientNow();
            return;
          }
          if (event && isSoundToggle(event.target)) {
            return;
          }
          console.log('[OA wind] unlock gesture received');
          playAmbient('unlock gesture').then((started) => {
            if (!started) {
              armAmbientRetries();
            }
          });
        }

        soundButtons.forEach((button) => {
          updateSoundButtons(false);
          button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (ambientStarted && ambientAudio && !ambientAudio.paused) {
              pauseAmbient(false);
              return;
            }
            playAmbient('sound toggle', true);
          });
        });

        window.oohLandingAmbientWind = {
          play: playAmbient,
          stop: stopAmbientNow,
          pause: pauseAmbient,
          arm: armAmbientRetries,
          isPlaying: () => ambientStarted && !!ambientAudio && !ambientAudio.paused
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

          pauseAmbient(true, () => {
            ambientAudio.volume = ambientTargetVolume;
            window.location.href = href;
          });
        };

        if (ambientAudio) {
          armAmbientRetries();
          playAmbient('startup');
        }

        // ----- Operation Alpha routing -----
        const operationAlphaBtn = document.querySelector('[data-ooh-action="operation-alpha"]');
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
        // ----- Carousel wiring -----
        const slides = Array.from(root.querySelectorAll('.ooh-hero__slide'));
        const dotsWrap = root.querySelector('.ooh-hero__dots');
        const prevBtn = root.querySelector('[data-ooh-carousel-prev]');
        const nextBtn = root.querySelector('[data-ooh-carousel-next]');
        const firstVideo = root.querySelector('.ooh-hero__video');

        oohSlideLog('slide count', slides.length);

        if (!slides.length) {
          if (firstVideo) {
            console.log('[OA hero] video found', firstVideo.currentSrc || firstVideo.querySelector('source')?.src || 'source pending');
            firstVideo.muted = true;
            firstVideo.loop = true;
            firstVideo.playsInline = true;
            console.log('[OA hero] video play attempted', 0);
            firstVideo.play().catch((error) => {
              console.log('[OA hero] video play failed', error && error.message ? error.message : error);
            });
          }
          else {
            console.log('[OA hero] using image fallback');
          }
          return;
        }

        let current = 0;
        let timer = null;
        const delay = 5500;

        if (dotsWrap) {
          dotsWrap.innerHTML = '';
        }

        const prepareSlideVideo = (videoElement) => {
          if (!videoElement) {
            return null;
          }
          videoElement.muted = true;
          videoElement.loop = true;
          videoElement.playsInline = true;
          videoElement.setAttribute('muted', 'muted');
          videoElement.setAttribute('loop', 'loop');
          videoElement.setAttribute('playsinline', 'playsinline');
          return videoElement;
        };

        const pauseInactiveVideos = (activeVideo) => {
          slides.forEach((slide) => {
            const slideVideo = slide.querySelector('video');
            if (!slideVideo || slideVideo === activeVideo) {
              return;
            }
            slideVideo.pause();
            slideVideo.currentTime = 0;
          });
        };

        const playActiveSlideVideo = () => {
          const activeSlide = slides[current];
          const activeVideo = activeSlide ? prepareSlideVideo(activeSlide.querySelector('video')) : null;

          console.log('[OA hero] slide activated', { current, total: slides.length });
          if (!activeVideo) {
            console.log('[OA hero] using image fallback');
            pauseInactiveVideos(null);
            return;
          }

          console.log('[OA hero] video found', activeVideo.currentSrc || activeVideo.querySelector('source')?.src || 'source pending');
          console.log('[OA hero] video play attempted', current);
          activeVideo.play().then(() => {
            pauseInactiveVideos(activeVideo);
          }).catch((error) => {
            console.log('[OA hero] video play failed', error && error.message ? error.message : error);
          });
        };
        const update = () => {
          oohSlideLog('current slide index', current);
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
          oohSlideLog('slide activation fired', { current, total: slides.length });
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
          if (slides.length > 1) {
            timer = window.setInterval(goNext, delay);
          }
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

        update();
        startTimer();
      });
    }
  };
})(Drupal, once);











