document.addEventListener('DOMContentLoaded', () => {

  // CATÁLOGO(Portada + Fotos internas)
  const registries = {
    registro01: {
      title: 'Registro 01 — 31/07/26',
      images: [
        '../assets/img/registro01.jpg',
        '../assets/img/registro01/1.webp',
        '../assets/img/registro01/2.jpg',
        '../assets/img/registro01/3.webp',
        '../assets/img/registro01/4.webp',
        '../assets/img/registro01/5.webp',
        '../assets/img/registro01/6.webp',
        '../assets/img/registro01/7.webp',
        '../assets/img/registro01/8.webp',
        '../assets/img/registro01/9.webp'
      ]
    },
    registro02: {
      title: 'Registro 02 — 06/09/26',
      images: [
        '../assets/img/registro02.webp',
        '../assets/img/registro02/1.webp',
        '../assets/img/registro02/2.webp',
        '../assets/img/registro02/3.webp',
        '../assets/img/registro02/4.webp',
        '../assets/img/registro02/5.webp',
        '../assets/img/registro02/6.webp',
        '../assets/img/registro02/7.webp',
        '../assets/img/registro02/8.webp',
        '../assets/img/registro02/9.webp',
        '../assets/img/registro02/10.webp',
        '../assets/img/registro02/11.webp',
        '../assets/img/registro02/12.webp',
        '../assets/img/registro02/13.webp',
        '../assets/img/registro02/14.webp',
        '../assets/img/registro02/15.webp',
        '../assets/img/registro02/16.webp'
      ]
    }
  };

  //PILA DE REVISTAS 
  const issues = Array.from(document.querySelectorAll('.mag-issue'));
  let stackTopZ = 10;

  issues.forEach((issue, i) => {
    issue.style.zIndex = i + 1;
    let isDragging = false;
    let startX = 0, startY = 0;
    let currentX = 0, currentY = 0;
    let movedDistance = 0;

    issue.addEventListener('pointerdown', e => {
      if (e.target.closest('.open-issue-btn')) return;
      isDragging = true;
      movedDistance = 0;
      stackTopZ++;
      issue.style.zIndex = stackTopZ;
      startX = e.clientX - currentX;
      startY = e.clientY - currentY;
      issue.setPointerCapture(e.pointerId);
    });

    issue.addEventListener('pointermove', e => {
      if (!isDragging) return;
      const nx = e.clientX - startX;
      const ny = e.clientY - startY;
      movedDistance += Math.hypot(nx - currentX, ny - currentY);
      currentX = nx;
      currentY = ny;
      issue.style.transform = `translate(${currentX}px, ${currentY}px) rotate(var(--rot))`;
    });

    issue.addEventListener('pointerup', e => {
      if (!isDragging) return;
      isDragging = false;
      issue.releasePointerCapture(e.pointerId);

      // Si el usuario solo tocó/cliqueó sin arrastrar (< 6px), abre el registro directo
      if (movedDistance < 6) {
        openScatterFloor(issue.getAttribute('data-issue'));
      }
    });

    issue._resetPos = () => {
      currentX = 0;
      currentY = 0;
      issue.style.transform = `translate(var(--ox), var(--oy)) rotate(var(--rot))`;
    };
  });

  document.querySelectorAll('[data-open]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      openScatterFloor(btn.getAttribute('data-open'));
    });
  });

  document.getElementById('cycle-stack-btn')?.addEventListener('click', () => {
    const sorted = [...issues].sort((a, b) => Number(b.style.zIndex) - Number(a.style.zIndex));
    const topIssue = sorted[0];
    if (!topIssue) return;
    issues.forEach(el => { el.style.zIndex = Number(el.style.zIndex) + 1; });
    topIssue.style.zIndex = 1;
    topIssue._resetPos();
  });

  const resetStack = () => {
    issues.forEach((issue, idx) => {
      issue.style.zIndex = idx + 1;
      issue._resetPos();
    });
  };

  document.getElementById('reset-stack-btn')?.addEventListener('click', resetStack);

  //SUELO DE CUADRÍCULA

  const scatterFloor = document.getElementById('scatter-floor');
  const floorCanvas = document.getElementById('floor-canvas');
  const floorTitle = document.getElementById('floor-title');
  const reshuffleBtn = document.getElementById('reshuffle-floor-btn');
  const closeFloorBtn = document.getElementById('close-floor-btn');

  let activeKey = null;
  let activeList = [];
  let floorTopZ = 20;

  function scatterPositions(count) {
    const isMobile = window.innerWidth <= 680;
    const spreadX = isMobile ? window.innerWidth * 0.26 : Math.min(window.innerWidth * 0.32, 390);
    const spreadY = isMobile ? window.innerHeight * 0.24 : Math.min(window.innerHeight * 0.25, 220);

    const coords = [];
    for (let i = 0; i < count; i++) {
      const angle = i * 2.39996 + (Math.random() * 0.45 - 0.22);
      const radius = Math.sqrt((i + 0.6) / count);
      const x = Math.cos(angle) * spreadX * radius + (Math.random() * 34 - 17);
      const y = Math.sin(angle) * spreadY * radius + (Math.random() * 30 - 15);
      const rot = (Math.random() * 22 - 11).toFixed(1);
      coords.push({ x, y, rot });
    }
    return coords;
  }

  function openScatterFloor(key) {
    const data = registries[key];
    if (!data) return;

    activeKey = key;
    activeList = [...data.images];
    floorTitle.textContent = data.title;
    floorCanvas.innerHTML = '';
    floorTopZ = 20 + activeList.length;

    const layout = scatterPositions(activeList.length);

    activeList.forEach((src, idx) => {
      const card = document.createElement('div');
      card.className = 'scattered-photo' + (idx === 0 ? ' is-cover-photo' : '');
      card.style.zIndex = idx === 0 ? floorTopZ : 10 + idx;

      let posX = layout[idx].x;
      let posY = layout[idx].y;
      const rot = layout[idx].rot;

      card.style.transform = `translate(calc(-50% + ${posX}px), calc(-50% + ${posY}px)) rotate(${rot}deg)`;

      const img = document.createElement('img');
      img.src = src;
      img.alt = `${data.title} — ${idx + 1}`;
      img.draggable = false;

      img.addEventListener('error', () => {
        const currentSrc = img.getAttribute('src') || '';
        if (currentSrc.endsWith('.webp')) {
          const jpgFallback = currentSrc.replace(/\.webp$/, '.jpg');
          activeList[idx] = jpgFallback;
          img.src = jpgFallback;
        } else {
          card.remove();
        }
      });

      if (idx === 0) {
        const badge = document.createElement('span');
        badge.className = 'scattered-badge';
        badge.textContent = 'PORTADA';
        card.appendChild(badge);
      }

      card.appendChild(img);
      floorCanvas.appendChild(card);

      let draggingPhoto = false;
      let sx = 0, sy = 0, dist = 0;

      card.addEventListener('pointerdown', e => {
        draggingPhoto = true;
        dist = 0;
        floorTopZ++;
        card.style.zIndex = floorTopZ;
        sx = e.clientX - posX;
        sy = e.clientY - posY;
        card.setPointerCapture(e.pointerId);
      });

      card.addEventListener('pointermove', e => {
        if (!draggingPhoto) return;
        const nx = e.clientX - sx;
        const ny = e.clientY - sy;
        dist += Math.hypot(nx - posX, ny - posY);
        posX = nx;
        posY = ny;
        card.style.transform = `translate(calc(-50% + ${posX}px), calc(-50% + ${posY}px)) rotate(${rot}deg)`;
      });

      card.addEventListener('pointerup', e => {
        if (!draggingPhoto) return;
        draggingPhoto = false;
        card.releasePointerCapture(e.pointerId);

        if (dist < 6) {
          openGalleryReader(idx);
        }
      });
    });

    scatterFloor.classList.add('is-open');
    scatterFloor.setAttribute('aria-hidden', 'false');
    history.replaceState(null, '', `#${key}`);
  }

  function closeScatterFloor() {
    scatterFloor.classList.remove('is-open');
    scatterFloor.setAttribute('aria-hidden', 'true');
    history.replaceState(null, '', window.location.pathname);
  }

  reshuffleBtn?.addEventListener('click', () => {
    if (activeKey) openScatterFloor(activeKey);
  });

  closeFloorBtn?.addEventListener('click', closeScatterFloor);

  // GALERÍA EN GRANDE
  const reader = document.getElementById('zine-reader');
  const readerImg = document.getElementById('reader-img');
  const readerTitle = document.getElementById('reader-title');
  const readerCounter = document.getElementById('reader-counter');
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  const closeReaderBtn = document.getElementById('reader-close');

  let currentIndex = 0;

  function showSlide(index) {
    if (!activeList.length) return;
    currentIndex = (index + activeList.length) % activeList.length;
    readerImg.src = activeList[currentIndex];
    readerCounter.textContent = `${currentIndex + 1} / ${activeList.length}`;
  }

  function openGalleryReader(startIndex) {
    if (!activeKey || !registries[activeKey]) return;
    readerTitle.textContent = registries[activeKey].title;
    showSlide(startIndex);
    reader.classList.add('is-open');
    reader.setAttribute('aria-hidden', 'false');
  }

  function closeGalleryReader() {
    reader.classList.remove('is-open');
    reader.setAttribute('aria-hidden', 'true');
  }

  prevBtn?.addEventListener('click', e => {
    e.stopPropagation();
    showSlide(currentIndex - 1);
  });

  nextBtn?.addEventListener('click', e => {
    e.stopPropagation();
    showSlide(currentIndex + 1);
  });

  closeReaderBtn?.addEventListener('click', e => {
    e.stopPropagation();
    closeGalleryReader();
  });

  reader?.addEventListener('click', e => {
    if (e.target === readerImg || e.target.closest('.nav-arrow')) return;
    closeGalleryReader();
  });

  // 5. LOGO "ZINE etc."
  document.getElementById('zine-home-link')?.addEventListener('click', e => {
    e.preventDefault();
    closeGalleryReader();
    closeScatterFloor();
    resetStack();
  });

  window.addEventListener('keydown', e => {
    if (reader.classList.contains('is-open')) {
      if (e.key === 'ArrowRight') showSlide(currentIndex + 1);
      if (e.key === 'ArrowLeft') showSlide(currentIndex - 1);
      if (e.key === 'Escape') closeGalleryReader();
    } else if (scatterFloor.classList.contains('is-open') && e.key === 'Escape') {
      closeScatterFloor();
    }
  });

  function checkHashOnLoad() {
    const hashKey = window.location.hash.replace('#', '');
    if (registries[hashKey]) {
      openScatterFloor(hashKey);
    }
  }

  checkHashOnLoad();
  window.addEventListener('hashchange', checkHashOnLoad);
});