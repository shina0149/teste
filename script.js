// ===========================
// Rainbow Background Effect
// Baseado em: freefrontend.com (SylvainGarnot)
// Convertido de SCSS para JS vanilla
// Paleta adaptada ao tema verde do site
// ===========================
(function initRainbowBg() {
  const container = document.getElementById('rainbow-bg');
  if (!container) return;

  // Paleta verde bem escura e sutil
  const green1 = 'rgba(10, 80, 35, 0.45)';   // verde escuro suave
  const green2 = 'rgba(4, 50, 22, 0.55)';    // verde profundo
  const green3 = 'rgba(16, 120, 55, 0.35)';   // verde esmeralda sutil

  // 6 permutações das 3 cores
  const perms = [
    [green1, green2, green3],
    [green1, green3, green2],
    [green2, green1, green3],
    [green2, green3, green1],
    [green3, green2, green1],
    [green3, green1, green2],
  ];

  const glow   = 'rgba(0, 0, 0, 0.4)'; // sombra escura para dar profundidade
  const total  = 18;
  const aTime  = 70; // Animação mais lenta para evitar o aspecto "travado/rápido"

  for (let i = 1; i <= total; i++) {
    const [c1, c2, c3] = perms[(i - 1) % 6];
    const duration = aTime - (aTime / total / 2 * i);
    const delay    = -(i / total * aTime);

    const div = document.createElement('div');
    div.className = 'rainbow';
    div.style.cssText = `
      box-shadow: -130px 0 90px 45px ${glow},
                  -50px 0 60px 30px ${c1},
                  0 0 60px 30px ${c2},
                  50px 0 60px 30px ${c3},
                  130px 0 90px 45px ${glow};
      animation: rainbow-slide ${duration.toFixed(1)}s linear infinite;
      animation-delay: ${delay.toFixed(1)}s;
    `;
    container.appendChild(div);
  }

  // Glows horizontais e verticais (sutis para fundo escuro)
  const h = document.createElement('div');
  h.className = 'rainbow-h';
  container.appendChild(h);

  const v = document.createElement('div');
  v.className = 'rainbow-v';
  container.appendChild(v);
})();

// ===========================
// IP Geolocation → atualiza texto da localização com fallbacks
// ===========================
async function loadLocation() {
  const locationEl = document.getElementById('location-text');
  const disclaimerEl = document.getElementById('disclaimer-location');

  function updateDOM(city, region) {
    if (!city) return;
    if (locationEl) {
      const label = region
        ? `${city.toUpperCase()}, ${region.toUpperCase()}.`
        : `${city.toUpperCase()}.`;
      locationEl.textContent = label;
    }
    if (disclaimerEl) {
      disclaimerEl.textContent = city;
    }
  }

  // 1. Tenta ipwho.is (suporta HTTPS sem bloqueio CORS)
  try {
    const res = await fetch('https://ipwho.is/?lang=pt-BR');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.city) {
        updateDOM(data.city, data.region_code);
        return;
      }
    }
  } catch (e) {
    console.warn('ipwho.is failed, trying next provider...');
  }

  // 2. Tenta ipapi.co (fallback HTTPS gratuito)
  try {
    const res = await fetch('https://ipapi.co/json/');
    if (res.ok) {
      const data = await res.json();
      if (data.city) {
        updateDOM(data.city, data.region_code);
        return;
      }
    }
  } catch (e) {
    console.warn('ipapi.co failed, trying next provider...');
  }

  // 3. Tenta ip-api.com
  try {
    const res = await fetch('https://ip-api.com/json/?fields=city,regionCode&lang=pt-BR');
    if (res.ok) {
      const data = await res.json();
      if (data.city) {
        updateDOM(data.city, data.regionCode);
        return;
      }
    }
  } catch (e) {
    console.warn('ip-api.com failed');
  }
}

loadLocation();

// ===========================
// Toast — cicla entre depoimentos infinitamente
// Comportamento igual ao site de referência:
//   • aparece após 2s
//   • fica visível ~4s
//   • some, troca de depoimento (embaralhado)
//   • repete a cada ~10s
// ===========================
(function initToast() {
  const toastEl   = document.getElementById('toast');
  const textEl    = document.getElementById('toast-text');
  const nameEl    = document.getElementById('toast-name');
  if (!toastEl || !textEl || !nameEl) return;

  // Lê o array do data-items
  let items = [];
  try {
    items = JSON.parse(toastEl.dataset.items || '[]');
  } catch (e) {
    console.warn('Toast: invalid data-items JSON');
    return;
  }
  if (!items.length) return;

  // Embaralha o array (Fisher-Yates)
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  let queue = shuffle(items);
  let idx   = 0;

  function nextItem() {
    if (idx >= queue.length) {
      queue = shuffle(items);
      idx   = 0;
    }
    return queue[idx++];
  }

  // Duração em ms
  const SHOW_DURATION  = 4000;  // tempo visível
  const HIDE_DURATION  = 400;   // duração da saída
  const CYCLE_INTERVAL = 10000; // intervalo total entre cada toast

  function showToast(item) {
    // Preenche o conteúdo
    textEl.textContent = `"${item.text}"`;
    nameEl.textContent = `${item.name}, ${item.age} anos`;

    // Entra
    toastEl.classList.remove('hiding');
    toastEl.classList.add('visible');

    // Depois de SHOW_DURATION, começa a sair
    setTimeout(() => {
      toastEl.classList.add('hiding');
      toastEl.classList.remove('visible');
    }, SHOW_DURATION);
  }

  function cycle() {
    showToast(nextItem());
  }

  // Primeira exibição após 2s
  setTimeout(() => {
    cycle();
    // Continua ciclando a cada CYCLE_INTERVAL
    setInterval(cycle, CYCLE_INTERVAL);
  }, 2000);
})();

// ===========================
// Ripple effect nos cards
// Container interno com overflow:hidden para clipar o ripple
// sem cortar o box-shadow/glow externo do card
// ===========================
document.querySelectorAll('.link-card').forEach((card) => {
  // Cria um container de clipe dentro do card
  const clipper = document.createElement('span');
  clipper.style.cssText = `
    position: absolute;
    inset: 0;
    border-radius: inherit;
    overflow: hidden;
    pointer-events: none;
  `;
  card.appendChild(clipper);

  card.addEventListener('click', function (e) {
    const ripple = document.createElement('span');
    const rect   = card.getBoundingClientRect();
    const size   = Math.max(rect.width, rect.height);
    const x      = e.clientX - rect.left - size / 2;
    const y      = e.clientY - rect.top  - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(34, 197, 94, 0.1);
      border-radius: 50%;
      transform: scale(0);
      animation: rippleEffect 0.6s linear;
      pointer-events: none;
    `;

    clipper.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });
});

// Injetar keyframe do ripple
const style = document.createElement('style');
style.textContent = `
  @keyframes rippleEffect {
    to { transform: scale(2.5); opacity: 0; }
  }
`;
document.head.appendChild(style);
