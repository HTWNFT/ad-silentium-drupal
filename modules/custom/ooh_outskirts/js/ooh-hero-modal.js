(function (Drupal, once) {
  const warnOnce = (key, message) => {
    window.oohLandingWarnings = window.oohLandingWarnings || {};
    if (!window.oohLandingWarnings[key]) {
      window.oohLandingWarnings[key] = true;
    }
  };

  Drupal.behaviors.oohLanding = {
    attach(context) {
      once('oohLanding', '[data-ooh-landing-ui]', context).forEach((landing) => {
        document.documentElement.setAttribute('data-ooh-landing-library-loaded', '1');
        const root = landing.querySelector('[data-ooh-hero]');

        // ----- Modal wiring -----
        const openBtn = landing.querySelector('#ooh-read-prologue');
        const closeBtn = landing.querySelector('#ooh-close-prologue');
        const modal = landing.querySelector('#ooh-prologue-modal');
        const backdrop = modal ? modal.querySelector('[data-close="1"]') : null;
        const crawl = landing.querySelector('#ooh-prologue-crawl');
        const prologueEnterBtn = modal ? modal.querySelector('[data-ooh-prologue-enter]') : null;
        const skipBtn = modal ? modal.querySelector('[data-ooh-prologue-skip]') : null;
        const replayBtn = modal ? modal.querySelector('[data-ooh-prologue-replay]') : null;
        const prologueAutoOpenKey = 'ooh_prologue_auto_opened_v1';
        const prologueAutoDelayMs = 400;

        if (!root) {
          warnOnce('hero-missing', 'OOH landing: hero root not found.');
        }
        if (!openBtn) {
          warnOnce('prologue-button-missing', 'OOH landing: READ PROLOGUE button not found.');
        }
        if (!modal) {
          warnOnce('prologue-modal-missing', 'OOH landing: prologue modal not found.');
        }

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

        const hasSeenPrologue = () => {
          try {
            return window.localStorage.getItem(prologueAutoOpenKey) === '1';
          }
          catch (error) {
            return true;
          }
        };

        const markSeenPrologue = () => {
          try {
            window.localStorage.setItem(prologueAutoOpenKey, '1');
          }
          catch (error) {}
        };

        const deferAutoOpenPrologue = () => {
          const defer = window.requestAnimationFrame || ((callback) => window.setTimeout(callback, 16));

          defer(() => {
            defer(() => {
              window.setTimeout(() => {
                if (!modal || modal.classList.contains('is-open') || hasSeenPrologue()) {
                  return;
                }
                markSeenPrologue();
                openModal();
              }, prologueAutoDelayMs);
            });
          });
        };

        if (openBtn) {
          openBtn.addEventListener('click', () => {
            markSeenPrologue();
            openModal();
          });
        }
        if (closeBtn) {
          closeBtn.addEventListener('click', closeModal);
        }
        if (backdrop) {
          backdrop.addEventListener('click', closeModal);
        }
        if (skipBtn) {
          skipBtn.addEventListener('click', () => {
            markSeenPrologue();
            closeModal();
          });
        }
        if (replayBtn) {
          replayBtn.addEventListener('click', restartCrawl);
        }
        if (prologueEnterBtn) {
          prologueEnterBtn.addEventListener('click', () => {
            markSeenPrologue();
            closeModal();
          });
        }

        document.addEventListener('keydown', (event) => {
          if (event.key === 'Escape' && modal && modal.classList.contains('is-open')) {
            closeModal();
          }
        });

        if (modal && !hasSeenPrologue()) {
          deferAutoOpenPrologue();
        }
        // ----- Landing monetization UI scaffold -----
        (() => {
          const STARTER_CREDITS = 60;
          const creditDropDismissedKey = 'ooh_credit_drop_dismissed_v1';
          const starterCreditsReservedKey = 'ooh_starter_credits_reserved_v1';
          const audio = landing.querySelector('[data-ooh-ambient-audio]');
          const dossierLink = landing.querySelector('.ooh-hero__button--primary[href]');
          const buyCreditsButtons = landing.querySelectorAll('[data-ooh-buy-credits]');
          const creditStatuses = landing.querySelectorAll('[data-ooh-credit-status-message]');
          const memberLink = landing.querySelector('.ooh-account-status[href]');
          const loginUrl = landing.getAttribute('data-ooh-login-url') || '';
          const creditsUrl = landing.getAttribute('data-ooh-credits-url') || '';
          const isLoggedIn = landing.getAttribute('data-ooh-logged-in') === '1';
          const drupalSettingsCredits =
            window.drupalSettings &&
            window.drupalSettings.ooh &&
            window.drupalSettings.ooh.credits;
          const creditCount =
            drupalSettingsCredits ??
            landing.getAttribute('data-ooh-credits');

          const loginDialog = document.getElementById('ooh-login-intent-dialog');
          const creditDropDialog = document.getElementById('ooh-credit-drop-dialog');
          const purchaseDialog = document.getElementById('ooh-purchase-cta-dialog');
          const creditChoice = landing.querySelector('[data-ooh-credit-choice]');
          const creditForm = landing.querySelector('[data-ooh-credit-form]');
          const creditYes = landing.querySelector('[data-ooh-credit-yes]');
          const creditNo = landing.querySelector('[data-ooh-credit-no]');
          const creditStatusMessage = landing.querySelector('[data-ooh-credit-status-message]');

          const dialogs = [loginDialog, creditDropDialog, purchaseDialog].filter(Boolean);

          if (!audio) {
            warnOnce('audio-missing', 'OOH landing: ambient audio element not found.');
          }
          if (!dossierLink) {
            warnOnce('dossier-link-missing', 'OOH landing: ENTER DOSSIER link not found.');
          }
          if (!creditStatuses.length && !buyCreditsButtons.length) {
            warnOnce('credits-link-missing', 'OOH landing: credits button not found.');
          }
          if (isLoggedIn && !memberLink) {
            warnOnce('member-link-missing', 'OOH landing: member account button not found.');
          }

          const isAnyDialogOpen = () => dialogs.some((dialog) => dialog.classList.contains('is-open'));

          const openDialog = (dialog) => {
            if (!dialog) {
              return;
            }
            dialogs.forEach((item) => {
              item.classList.remove('is-open');
              item.setAttribute('aria-hidden', 'true');
            });
            dialog.classList.add('is-open');
            dialog.setAttribute('aria-hidden', 'false');
            document.body.classList.add('ooh-modal-open');
          };

          const closeDialog = (dialog) => {
            if (!dialog) {
              return;
            }
            dialog.classList.remove('is-open');
            dialog.setAttribute('aria-hidden', 'true');
            if (!isAnyDialogOpen() && !(modal && modal.classList.contains('is-open'))) {
              document.body.classList.remove('ooh-modal-open');
            }
          };

          dialogs.forEach((dialog) => {
            dialog.querySelectorAll('[data-ooh-dialog-close]').forEach((closeTarget) => {
              closeTarget.addEventListener('click', () => closeDialog(dialog));
            });
          });

          document.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape') {
              return;
            }
            dialogs.forEach(closeDialog);
          });

          if (audio && window.oohLandingAmbientWind) {
            console.log('[OA wind] duplicate initializer skipped');
          }

creditStatuses.forEach((creditStatus) => {
            creditStatus.textContent = creditCount !== null && creditCount !== undefined && creditCount !== '' ?
              `CREDITS: ${creditCount}` :
              'CREDITS // ACCESS READY';
            creditStatus.setAttribute('title', 'Clearance credits are available for expanded access.');
          });

          buyCreditsButtons.forEach((button) => {
            button.setAttribute('href', creditsUrl);
          });

          // Real passwordless login must be backed by signed, expiring,
          // single-use server-generated tokens. Raw URL arguments are only
          // treated as user intent and never authenticate a visitor.
          const query = new URLSearchParams(window.location.search);
          const hasLoginIntent =
            query.get('ooh_login') === '1' ||
            query.has('email') ||
            query.has('return');
          const loginConfirm = landing.querySelector('[data-ooh-login-confirm]');
          if (loginConfirm) {
            loginConfirm.setAttribute('href', loginUrl);
          }

          if (hasLoginIntent && !isLoggedIn) {
            window.setTimeout(() => openDialog(loginDialog), 500);
          }

          if (creditYes && creditForm && creditChoice) {
            creditYes.addEventListener('click', () => {
              creditChoice.hidden = true;
              creditForm.hidden = false;
              const input = creditForm.querySelector('input[type="email"]');
              if (input) {
                input.focus();
              }
            });
          }

          if (creditNo) {
            creditNo.addEventListener('click', () => {
              try {
                window.localStorage.setItem(creditDropDismissedKey, '1');
              }
              catch (error) {}
              closeDialog(creditDropDialog);
            });
          }

          if (creditForm) {
            creditForm.addEventListener('submit', (event) => {
              event.preventDefault();
              const input = creditForm.querySelector('input[type="email"]');
              if (!input || !input.checkValidity()) {
                if (input) {
                  input.reportValidity();
                }
                return;
              }

              try {
                window.localStorage.setItem(starterCreditsReservedKey, String(STARTER_CREDITS));
                window.localStorage.setItem(creditDropDismissedKey, '1');
              }
              catch (error) {}

              creditForm.hidden = true;
              if (creditStatusMessage) {
                creditStatusMessage.textContent =
                  'CREDITS // ACCESS RESERVED. LOGIN TO ATTACH ACCESS TO ACCOUNT.';
              }
            });
          }
        })();

        // ----- Carousel wiring -----
        if (!root) {
          return;
        }

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

