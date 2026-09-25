document.addEventListener('DOMContentLoaded', () => {
  const workItems = Array.from(document.querySelectorAll('.work-item'));
  const filterBtns = document.querySelectorAll('.filter-btn');
  const highlightTriggers = document.querySelectorAll('[data-highlight]');
  const totalSlots = 10;

  function clearSlots(el) {
    for (let i = 1; i <= totalSlots; i++) {
      el.classList.remove(`slot-${String(i).padStart(2, '0')}`);
    }
  }

  // 1. REORGANIZA LOS CUADROS CUANDO SE SELECCIONA UN BOTÓN DE FILTRO
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

  // 2. OPACAR LOS QUE NO SON DE ESA SECCIÓN AL PASAR EL CURSOR SOBRE "etc." O "ZINE etc."
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

  // 3. ASEGURA QUE TODOS LOS VIDEOS CORRAN EN BUCLE CONTINUO
  document.querySelectorAll('.work-media video').forEach(video => {
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.play().catch(() => {});
  });

  // 4. SI UNA IMAGEN DE PRUEBA AÚN NO EXISTE EN LA CARPETA, MUESTRA UN CUADRO GRIS TEMPORAL
  // Cuando la imagen sí existe (como 007.webp o 006.webp), la caja toma el tamaño exacto de tu archivo.
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