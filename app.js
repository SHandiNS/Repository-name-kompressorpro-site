const form = document.getElementById('requestForm');
const success = document.getElementById('formSuccess');
const phoneInput = form?.querySelector('input[name="phone"]');

document.getElementById('year').textContent = new Date().getFullYear();

if (phoneInput) {
  phoneInput.addEventListener('input', () => {
    let digits = phoneInput.value.replace(/\D/g, '');
    if (digits.startsWith('8')) digits = `7${digits.slice(1)}`;
    if (digits && !digits.startsWith('7')) digits = `7${digits}`;
    digits = digits.slice(0, 11);

    const parts = [
      digits.slice(1, 4),
      digits.slice(4, 7),
      digits.slice(7, 9),
      digits.slice(9, 11)
    ];

    let formatted = digits ? '+7' : '';
    if (parts[0]) formatted += ` (${parts[0]}`;
    if (parts[0]?.length === 3) formatted += ')';
    if (parts[1]) formatted += ` ${parts[1]}`;
    if (parts[2]) formatted += `-${parts[2]}`;
    if (parts[3]) formatted += `-${parts[3]}`;
    phoneInput.value = formatted;
  });
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const phoneDigits = phoneInput.value.replace(/\D/g, '');

  if (phoneDigits.length !== 11) {
    phoneInput.setCustomValidity(
      'Введите номер телефона в формате +7 (999) 123-45-67'
    );
    phoneInput.reportValidity();
    phoneInput.setCustomValidity('');
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.innerHTML;

  const formData = Object.fromEntries(new FormData(form).entries());

  submitButton.disabled = true;
  submitButton.textContent = 'Отправляем заявку…';
  success.hidden = true;

  try {
    const response = await fetch('/.netlify/functions/submit-lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.error || 'Не удалось отправить заявку');
    }

    form.reset();

    success.innerHTML = `
      <strong>Заявка отправлена.</strong>
      Диспетчер получил данные и свяжется с вами после уточнения наличия техники.
    `;
    success.hidden = false;
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (error) {
    console.error('Ошибка отправки заявки:', error);

    success.innerHTML = `
      <strong>Не удалось отправить заявку.</strong>
      Пожалуйста, попробуйте ещё раз позже или позвоните нам: +7 995 904-10-08.
    `;
    success.hidden = false;
    success.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonText;
  }
});


const galleryStage = document.getElementById('galleryStage');
const gallerySlides = galleryStage
  ? [...galleryStage.querySelectorAll('.gallery-slide')]
  : [];
const galleryPrev = document.getElementById('galleryPrev');
const galleryNext = document.getElementById('galleryNext');
const galleryCurrent = document.getElementById('galleryCurrent');
const galleryTotal = document.getElementById('galleryTotal');
const galleryDots = document.getElementById('galleryDots');

let activeGallerySlide = 0;
let touchStartX = 0;

function stopInactiveVideos() {
  gallerySlides.forEach((slide, index) => {
    if (index === activeGallerySlide) return;

    const video = slide.querySelector('video');
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  });
}

function showGallerySlide(index) {
  if (!gallerySlides.length) return;

  activeGallerySlide = (index + gallerySlides.length) % gallerySlides.length;

  gallerySlides.forEach((slide, slideIndex) => {
    slide.classList.toggle('is-active', slideIndex === activeGallerySlide);
  });

  galleryCurrent.textContent = activeGallerySlide + 1;
  galleryTotal.textContent = gallerySlides.length;

  [...galleryDots.children].forEach((dot, dotIndex) => {
    dot.classList.toggle('is-active', dotIndex === activeGallerySlide);
  });

  stopInactiveVideos();
}

function createGalleryDots() {
  if (!galleryDots) return;

  gallerySlides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'gallery-dot';
    dot.setAttribute('aria-label', `Открыть материал ${index + 1}`);

    dot.addEventListener('click', () => {
      showGallerySlide(index);
    });

    galleryDots.append(dot);
  });
}

galleryPrev?.addEventListener('click', () => {
  showGallerySlide(activeGallerySlide - 1);
});

galleryNext?.addEventListener('click', () => {
  showGallerySlide(activeGallerySlide + 1);
});

let touchStartY = 0;
let isGallerySwipe = false;

galleryStage?.addEventListener('touchstart', (event) => {
  const touch = event.touches[0];

  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  isGallerySwipe = false;
}, { passive: true });

galleryStage?.addEventListener('touchmove', (event) => {
  const touch = event.touches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;

  /*
    Если жест идёт преимущественно горизонтально,
    это свайп по материалам. Вертикальная прокрутка
    страницы при этом остаётся рабочей.
  */
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 18) {
    isGallerySwipe = true;
  }
}, { passive: true });

galleryStage?.addEventListener('touchend', (event) => {
  const touch = event.changedTouches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;

  if (!isGallerySwipe || Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY)) {
    return;
  }

  if (deltaX < 0) {
    showGallerySlide(activeGallerySlide + 1);
  } else {
    showGallerySlide(activeGallerySlide - 1);
  }
}, { passive: true });

createGalleryDots();
showGallerySlide(0);
