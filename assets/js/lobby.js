document.addEventListener('DOMContentLoaded', () => {
  const workItems = Array.from(document.querySelectorAll('.work-item'));
  const filterBtns = document.querySelectorAll('.filter-btn');
  const highlightTriggers = document.querySelectorAll('[data-highlight]');
  const allVideos = Array.from(document.querySelectorAll('.work-media video'));
  const totalSlots = 11;

  function clearSlots(el) {
    for (let i = 1; i <= totalSlots; i++) {
      el.classList.remove(`slot-${String(i).padStart(2, '0')}`);
    }
  }

  // 1. Reorganiza los cuadros al filtrar
  function reorganizeCollage(category) {
    const updateDOM = () => {
      let visibleIndex = 0;

      workItems.forEach(item => {
        clearSlots(item);
        item.classList.remove('is-dimmed');

        const cats = (item.getAttribute('data-category') || '').split(' ');
        const matches = category === 'all' || cats.includes(category);

        if (matches) {
          visibleIndex++;
          const slotNum = ((visibleIndex - 1) % totalSlots) + 1;
          item.classList.remove('is-hidden');
          item.classList.add(`slot-${String(slotNum).padStart(2, '0')}`);

          item.classList.remove('rearranging');
          void item.offsetWidth;
          item.classList.add('rearranging');
        } else {
          item.classList.add('is-hidden');
        }
      });
    };

    if (document.startViewTransition) {
      document.startViewTransition(updateDOM);
    } else {
      updateDOM();
    }

    if (window.scrollY > 100) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  reorganizeCollage('all');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      reorganizeCollage(btn.getAttribute('data-filter'));
    });
  });

  // 2. Opacar al pasar el cursor sobre "etc." o "ZINE etc."
  highlightTriggers.forEach(trigger => {
    const targetSection = trigger.getAttribute('data-highlight');

    trigger.addEventListener('mouseenter', () => {
      workItems.forEach(item => {
        if (item.classList.contains('is-hidden')) return;
        const cats = (item.getAttribute('data-category') || '').split(' ');
        item.classList.toggle('is-dimmed', !cats.includes(targetSection));
      });
    });

    trigger.addEventListener('mouseleave', () => {
      workItems.forEach(item => item.classList.remove('is-dimmed'));
    });
  });

  // 3. Videos en bucle en el collage (sin círculos flotantes del navegador)
  allVideos.forEach(video => {
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.disablePictureInPicture = true;
    video.setAttribute('disablepictureinpicture', '');
    video.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');
    // Ya no forzamos play() aquí: lo controla el IntersectionObserver de abajo,
    // así solo los videos que se ven en pantalla consumen batería/CPU.
  });

  // 3.1 CORRECCIÓN: solo reproducir los videos que están visibles en el viewport.
  // Antes los 13 videos del collage intentaban reproducirse todos a la vez,
  // lo que satura el hilo principal en celulares de gama media (por eso
  // los clics se sentían lentos en Android). Con esto, un video se pausa
  // en cuanto sale de pantalla y solo "gasta" recursos si el usuario lo ve.
  // Carga el archivo real del video (dataset.src -> src) solo la primera vez
  // que hace falta. Antes, aunque no reproducíamos los videos fuera de pantalla,
  // el navegador los descargaba TODOS igual por tener preload="auto" con src
  // puesto desde el HTML. Ahora el <video> no tiene src hasta este momento.
  function ensureVideoLoaded(video) {
    if (!video.getAttribute('src') && video.dataset.src) {
      video.setAttribute('src', video.dataset.src);
      video.load();
    }
  }

  if ('IntersectionObserver' in window && allVideos.length) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting) {
          ensureVideoLoaded(video);
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.25, rootMargin: '250px 0px' }); // rootMargin: empieza a cargar un poco antes de que se vea, para que no se note el salto

    allVideos.forEach(video => videoObserver.observe(video));
  } else {
    // Respaldo por si el navegador no soporta IntersectionObserver (muy raro hoy en día)
    allVideos.forEach(video => {
      ensureVideoLoaded(video);
      video.play().catch(() => {});
    });
  }

  // 4. Guardar proyecto numerado al hacer clic hacia /productora/
  document.querySelectorAll('a[href*="#etc-"]').forEach(link => {
    link.addEventListener('click', () => {
      const hash = link.getAttribute('href').split('#')[1];
      if (hash) {
        sessionStorage.setItem('etc_open_project', hash);
      }
    });
  });

  // 5. Visor en grande compatible con móvil (Android/iOS) y PC
  const lightbox = document.getElementById('video-lightbox');
  const lbClose = document.getElementById('lightbox-close');
  let lbPlayer = document.getElementById('lightbox-player');

  if (lightbox && !lbPlayer) {
    lbPlayer = document.createElement('video');
    lbPlayer.id = 'lightbox-player';
    lightbox.appendChild(lbPlayer);
  }

  if (lbPlayer) {
    lbPlayer.muted = true;
    lbPlayer.loop = true;
    lbPlayer.playsInline = true;
    lbPlayer.setAttribute('playsinline', '');
    lbPlayer.setAttribute('webkit-playsinline', '');
    lbPlayer.disablePictureInPicture = true;
  }

  function openVideoModal(triggerEl) {
    const thumbVideo = triggerEl.querySelector('video');
    // Si el video todavía no se había cargado (raro, pero puede pasar si se
    // hace clic muy rápido), lo forzamos a cargar aquí antes de leer su src.
    if (thumbVideo) ensureVideoLoaded(thumbVideo);

    const videoSrc =
      triggerEl.getAttribute('data-lightbox-video') ||
      thumbVideo?.currentSrc ||
      thumbVideo?.getAttribute('src') ||
      thumbVideo?.dataset.src;

    if (!videoSrc || !lightbox || !lbPlayer) return;

    // Pausa los videos del fondo para que el teléfono reproduzca fluido el video grande
    allVideos.forEach(v => v.pause());

    if (lbPlayer.getAttribute('src') !== videoSrc) {
      lbPlayer.setAttribute('src', videoSrc);
    }
    if (thumbVideo && thumbVideo.currentTime) {
      try {
        lbPlayer.currentTime = thumbVideo.currentTime;
      } catch (_) {}
    }

    lbPlayer.muted = true;
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    lbPlayer.play().catch(() => {});
  }

  function closeLightbox() {
    if (!lightbox || !lbPlayer) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    lbPlayer.pause();
    // Al cerrar, el IntersectionObserver retoma el control de qué videos
    // reproducir según lo que esté visible; no forzamos play() en todos.
  }

  // Funciona con .zoom-trigger y con [data-lightbox-video] en PC y pantallas táctiles
  document.querySelectorAll('.zoom-trigger, [data-lightbox-video]').forEach(trigger => {
    trigger.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      openVideoModal(trigger);
    });
  });

  lbClose?.addEventListener('click', e => {
    e.stopPropagation();
    closeLightbox();
  });

  lightbox?.addEventListener('click', e => {
    if (e.target !== lbPlayer) {
      closeLightbox();
    }
  });

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && lightbox?.classList.contains('is-open')) {
      closeLightbox();
    }
  });

  // 6. Oculta imágenes que aún no existan
  document.querySelectorAll('.work-media img').forEach(img => {
    const markEmpty = () => {
      img.style.display = 'none';
      img.closest('.work-media')?.classList.add('is-empty');
    };
    img.addEventListener('error', markEmpty);
    if (img.complete && img.naturalWidth === 0) {
      markEmpty();
    }
  });
});