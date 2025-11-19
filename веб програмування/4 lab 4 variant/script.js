// ===== ЗАГРУЗКА ДАННЫХ ИЗ JSON =====
async function loadServices() {
  try {
    const resp = await fetch('services.json');
    const services = await resp.json();
    renderServices(services);
  } catch (err) {
    console.error('Помилка завантаження послуг:', err);
  }
}

async function loadTeam() {
  try {
    const resp = await fetch('team.json');
    const team = await resp.json();
    window.__teamData = team; // сохраним, чтобы фильтровать
    renderTeam(team);
  } catch (err) {
    console.error('Помилка завантаження команди:', err);
  }
}

// ===== РЕНДЕР УСЛУГ =====
function renderServices(services) {
  const container = document.getElementById('services-container');
  if (!container) return;
  container.innerHTML = '';

  services.forEach(service => {
    const col = document.createElement('div');
    col.className = 'col-md-6 col-lg-3';

    col.innerHTML = `
      <div class="card h-100 shadow-sm service-card">
        <div class="card-body">
          <div class="icon-circle mb-3">
            <i class="bi ${service.icon}"></i>
          </div>
          <h5 class="card-title">${service.title}</h5>
          <p class="card-text">${service.shortDesc}</p>
          <button class="btn btn-outline-primary btn-sm"
                  data-service-id="${service.id}">
            Детальніше
          </button>
        </div>
      </div>
    `;

    container.appendChild(col);
  });

  // навесим обработчики на кнопки "Детальніше"
  container.querySelectorAll('button[data-service-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.getAttribute('data-service-id'));
      const service = services.find(s => s.id === id);
      if (service) openServiceModal(service);
    });
  });
}

function openServiceModal(service) {
  const titleEl = document.getElementById('serviceModalLabel');
  const descEl = document.getElementById('serviceModalDesc');
  const priceEl = document.getElementById('serviceModalPrice');
  const durEl = document.getElementById('serviceModalDuration');

  if (!titleEl) return;

  titleEl.textContent = service.title;
  descEl.textContent = service.fullDesc;
  priceEl.textContent = service.price;
  durEl.textContent = service.duration;

  const modalEl = document.getElementById('serviceModal');
  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

// ===== РЕНДЕР КОМАНДЫ + ФИЛЬТР =====
function renderTeam(team) {
  const container = document.getElementById('team-container');
  if (!container) return;
  container.innerHTML = '';

  team.forEach(member => {
    const col = document.createElement('div');
    col.className = 'col-sm-6 col-lg-3';

    const skillsText = member.skills.join(', ');

    col.innerHTML = `
      <div class="card h-100 text-center team-card shadow-sm">
        <img src="${member.photo}" class="card-img-top" alt="${member.name}">
        <div class="card-body">
          <h5 class="card-title mb-0">${member.name}</h5>
          <small class="text-muted d-block mb-1">${member.position}</small>
          <p class="card-text mb-1"><strong>Навички:</strong> ${skillsText}</p>
          <p class="card-text"><strong>Досвід:</strong> ${member.experience}</p>
        </div>
      </div>
    `;

    container.appendChild(col);
  });
}

function initTeamFilter() {
  const buttons = document.querySelectorAll('.team-filter');
  if (!buttons.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const skill = btn.getAttribute('data-skill');
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const all = window.__teamData || [];
      if (skill === 'all') {
        renderTeam(all);
      } else {
        const filtered = all.filter(m =>
          m.skills.includes(skill)
        );
        renderTeam(filtered);
      }
    });
  });
}

// ===== КАЛЬКУЛЯТОР ПРОЕКТА =====
function initCalculator() {
  const form = document.getElementById('calcForm');
  const resultEl = document.getElementById('calcResult');
  if (!form || !resultEl) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const type = document.getElementById('siteType').value;
    if (!type) {
      resultEl.className = 'alert alert-danger';
      resultEl.textContent = 'Будь ласка, оберіть тип сайту.';
      resultEl.classList.remove('d-none');
      return;
    }

    // базовые цены и сроки
    let price = 0;
    let weeks = 0;

    switch (type) {
      case 'landing':
        price = 15000;
        weeks = 2;
        break;
      case 'multi':
        price = 25000;
        weeks = 3;
        break;
      case 'ecommerce':
        price = 35000;
        weeks = 4;
        break;
      case 'portal':
        price = 45000;
        weeks = 6;
        break;
    }

    // доп. опции
    const multilang = document.getElementById('optMultilang').checked;
    const cms = document.getElementById('optCMS').checked;
    const seo = document.getElementById('optSEO').checked;

    if (multilang) {
      price += 5000;
      weeks += 1;
    }
    if (cms) {
      price += 7000;
      weeks += 1;
    }
    if (seo) {
      price += 4000;
    }

    resultEl.className = 'alert alert-info';
    resultEl.innerHTML = `
      Орієнтовна вартість: <strong>${price.toLocaleString('uk-UA')} грн</strong><br>
      Орієнтовний термін розробки: <strong>${weeks} тиж.</strong>
    `;
    resultEl.classList.remove('d-none');
  });
}

// ===== МНОГОШАГОВАЯ ФОРМА =====
function initOrderForm() {
  const form = document.getElementById('orderForm');
  const steps = document.querySelectorAll('.order-step');
  const progress = document.getElementById('orderProgress');
  const btnPrev = document.getElementById('prevStep');
  const btnNext = document.getElementById('nextStep');
  const btnSubmit = document.getElementById('submitOrder');

  if (!form || !steps.length) return;

  let currentStep = 1;
  const maxStep = steps.length;

  function showStep(step) {
    steps.forEach(s => {
      const n = Number(s.getAttribute('data-step'));
      s.classList.toggle('d-none', n !== step);
    });

    const percent = Math.round((step / maxStep) * 100);
    progress.style.width = percent + '%';
    progress.textContent = `Крок ${step} з ${maxStep}`;

    btnPrev.disabled = step === 1;
    btnNext.classList.toggle('d-none', step === maxStep);
    btnSubmit.classList.toggle('d-none', step !== maxStep);
  }

  function validateStep(step) {
    // простая проверка нужных полей
    if (step === 1) {
      const type = document.getElementById('orderSiteType');
      return type && type.value;
    }
    if (step === 2) {
      const name = document.getElementById('orderName');
      const email = document.getElementById('orderEmail');
      return name.value.trim().length >= 2 && email.value.trim().length > 3;
    }
    if (step === 3) {
      const msg = document.getElementById('orderMessage');
      return msg.value.trim().length >= 10;
    }
    return true;
  }

  btnNext.addEventListener('click', () => {
    if (!validateStep(currentStep)) {
      alert('Будь ласка, заповніть всі обов’язкові поля на цьому кроці.');
      return;
    }
    if (currentStep < maxStep) {
      currentStep++;
      showStep(currentStep);
    }
  });

  btnPrev.addEventListener('click', () => {
    if (currentStep > 1) {
      currentStep--;
      showStep(currentStep);
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) {
      alert('Перевірте коректність введених даних.');
      return;
    }
    alert('Дякуємо! Заявку відправлено.');
    form.reset();
    currentStep = 1;
    showStep(currentStep);
  });

  showStep(currentStep);
}

// ===== АНИМИРОВАННЫЕ СЧЁТЧИКИ =====
function initCountersOnScroll() {
  const counters = document.querySelectorAll('.counter');
  if (!counters.length) return;

  const animateCounter = (el) => {
    const target = Number(el.getAttribute('data-target')) || 0;
    let current = 0;
    const step = Math.max(1, Math.floor(target / 80));

    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      el.textContent = current;
    }, 20);
  };

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

// ===== ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ =====
document.addEventListener('DOMContentLoaded', () => {
  loadServices();
  loadTeam();
  initTeamFilter();
  initCalculator();
  initOrderForm();
  initCountersOnScroll();
});
