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

  // 1. REORGANIZA LOS CUADROS AL FILTRAR
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

  // 2. OPACAR AL PASAR EL CURSOR SOBRE "etc." O "ZINE etc."
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

  // 3. VIDEOS EN BUCLE EN EL COLLAGE
  allVideos.forEach(video => {
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('disablepictureinpicture', '');
    video.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');
    video.play().catch(() => {});
  });

  // 4. GUARDAR EL PROYECTO NUMERADO AL HACER CLIC PARA QUE /PRODUCTORA/ LO ABRA SIEMPRE
  document.querySelectorAll('a[href*="#etc-"]').forEach(link => {
    link.addEventListener('click', () => {
      const hash = link.getAttribute('href').split('#')[1];
      if (hash) {
        sessionStorage.setItem('etc_open_project', hash);
      }
    });
  });

  // 5. APERTURA INSTANTÁNEA (0 MS) REUTILIZANDO EL MISMO NODO <VIDEO>
  const lightbox = document.getElementById('video-lightbox');
  const lbClose = document.getElementById('lightbox-close');
  const legacyPlayer = document.getElementById('lightbox-player');
  if (legacyPlayer) legacyPlayer.remove(); // Elimina el segundo reproductor innecesario

  let activeVideo = null;
  let activeOrigin = null;

  document.querySelectorAll('.zoom-trigger').forEach(trigger => {
    trigger.addEventListener('click', e => {
      e.preventDefault();
      const video = trigger.querySelector('video');
      if (!video || !lightbox) return;

      // Congela el tamaño de la caja en el collage para que no salte el diseño
      const rect = trigger.getBoundingClientRect();
      trigger.style.width = `${rect.width}px`;
      trigger.style.height = `${rect.height}px`;

      activeVideo = video;
      activeOrigin = trigger;

      // Pausa los otros videos del fondo para liberar el 100% de la GPU
      allVideos.forEach(v => {
        if (v !== activeVideo) v.pause();
      });

      // Mueve el mismo video ya decodificado al visor principal
      activeVideo.id = 'lightbox-player';
      lightbox.appendChild(activeVideo);
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      activeVideo.play().catch(() => {});
    });
  });

  function closeLightbox() {
    if (!lightbox || !activeVideo || !activeOrigin) return;

    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');

    // Devuelve el video exactamente a su caja original
    activeVideo.removeAttribute('id');
    activeOrigin.appendChild(activeVideo);
    activeOrigin.style.width = '';
    activeOrigin.style.height = '';

    // Reanuda todos los videos en bucle
    allVideos.forEach(v => v.play().catch(() => {}));

    activeVideo = null;
    activeOrigin = null;
  }

  lbClose?.addEventListener('click', e => {
    e.stopPropagation();
    closeLightbox();
  });

  lightbox?.addEventListener('click', e => {
    if (e.target !== activeVideo) {
      closeLightbox();
    }
  });

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && lightbox?.classList.contains('is-open')) {
      closeLightbox();
    }
  });

  // 6. OCULTA IMÁGENES QUE AÚN NO EXISTAN
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