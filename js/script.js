if (document.documentElement.classList.contains('has-intro')) {
  const dismissIntroOnKeyboard = (event) => {
    if (event.key === 'Tab' || event.key === 'Escape') {
      document.documentElement.classList.remove('has-intro', 'intro-ready');
      document.removeEventListener('keydown', dismissIntroOnKeyboard);
    }
  };
  document.addEventListener('keydown', dismissIntroOnKeyboard);
  window.setTimeout(() => {
    document.documentElement.classList.remove('has-intro');
    document.removeEventListener('keydown', dismissIntroOnKeyboard);
  }, 1950);
}

const services = [
  { icon: '</>', title: 'Desenvolvimento de sistemas', description: 'Aplicações web, interfaces e sistemas sob medida para organizar operações e criar experiências digitais claras.' },
  { icon: '↗', title: 'Automação de processos', description: 'Fluxos e ferramentas que reduzem tarefas repetitivas e liberam tempo para decisões de maior valor.' },
  { icon: '⇄', title: 'Integrações', description: 'Conexão entre sistemas, dados e serviços para que a informação circule com consistência.' }
];

const principles = [
  { title: 'Entender antes de construir', description: 'O contexto e os objetivos orientam as escolhas técnicas.' },
  { title: 'Fazer o complexo parecer simples', description: 'Interfaces claras e fluxos bem pensados aproximam a tecnologia das pessoas.' },
  { title: 'Criar para evoluir', description: 'Bases organizadas ajudam a solução a crescer com o negócio.' }
];

const create = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
};

const servicesGrid = document.querySelector('#services-grid');
services.forEach(({ icon, title, description }) => {
  const card = create('article', 'service-card reveal');
  const top = create('div', 'service-top');
  top.setAttribute('aria-hidden', 'true');
  top.append(create('span', '', 'SERVIÇO'), create('span', 'service-icon', icon));
  const bottom = create('div', 'service-bottom');
  bottom.setAttribute('aria-hidden', 'true');
  card.append(top, create('h3', '', title), create('p', '', description), bottom);
  servicesGrid.append(card);
});

const principlesList = document.querySelector('#principles-list');
principles.forEach(({ title, description }) => {
  const item = create('div', 'principle reveal');
  const content = create('div');
  content.append(create('h3', '', title), create('p', '', description));
  item.append(content);
  principlesList.append(item);
});

const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.site-nav');
function closeMenu() {
  menu.classList.remove('is-open');
  document.body.classList.remove('menu-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menu');
}
menuButton.addEventListener('click', () => {
  const isOpen = menu.classList.toggle('is-open');
  document.body.classList.toggle('menu-open', isOpen);
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
});
menu.addEventListener('click', (event) => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu.classList.contains('is-open')) {
    closeMenu();
    menuButton.focus();
  }
});
document.addEventListener('click', (event) => {
  if (!menu.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
});
window.matchMedia('(min-width: 1024px)').addEventListener('change', (event) => { if (event.matches) closeMenu(); });

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const brandLogoButton = document.querySelector('.alochio-logo-button');
const brandLogoImage = brandLogoButton.querySelector('img');
function syncBrandLogoMotion() {
  brandLogoButton.disabled = reducedMotion.matches;
  if (reducedMotion.matches) brandLogoButton.classList.remove('is-spinning');
}
reducedMotion.addEventListener('change', syncBrandLogoMotion);
syncBrandLogoMotion();
brandLogoButton.addEventListener('click', () => {
  brandLogoButton.classList.remove('is-spinning');
  void brandLogoButton.offsetWidth;
  brandLogoButton.classList.add('is-spinning');
});
brandLogoImage.addEventListener('animationend', () => brandLogoButton.classList.remove('is-spinning'));
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  document.documentElement.classList.add('js-motion');
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -28px 0px' });
  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      document.querySelectorAll('.site-nav a[href^="#"]').forEach((link) => {
        if (link.getAttribute('href') === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-35% 0px -55% 0px' });
  document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));
}

const progress = document.querySelector('.scroll-progress');
let ticking = false;
function updateProgress() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = `scaleX(${maxScroll > 0 ? window.scrollY / maxScroll : 0})`;
  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(updateProgress);
    ticking = true;
  }
}, { passive: true });
window.addEventListener('resize', updateProgress);
updateProgress();

const contactForm = document.querySelector('#contact-form');
const preparedMessage = document.querySelector('#prepared-message');
const preparedTitle = document.querySelector('#prepared-title');
const openEmail = document.querySelector('#open-email');
const messagePreview = document.querySelector('#message-preview');
const copyStatus = document.querySelector('#copy-status');

contactForm.addEventListener('input', () => {
  preparedMessage.hidden = true;
});

contactForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const subjectText = `Contato Alochio Technologies: ${data.get('topic')}`;
  const bodyText = `Nome: ${data.get('name')}\nE-mail: ${data.get('email')}\nInteresse: ${data.get('topic')}\n\nMensagem:\n${data.get('message')}`;
  openEmail.href = `mailto:alochiotechnologies@gmail.com?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(bodyText)}`;
  messagePreview.value = `Para: alochiotechnologies@gmail.com\nAssunto: ${subjectText}\n\n${bodyText}`;
  preparedMessage.hidden = false;
  copyStatus.textContent = '';
  preparedTitle.focus();
});

document.querySelector('#copy-message').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(messagePreview.value);
    copyStatus.textContent = 'Mensagem copiada.';
  } catch {
    messagePreview.focus();
    messagePreview.select();
    copyStatus.textContent = 'Selecione e copie a mensagem acima.';
  }
});

document.querySelector('#year').textContent = new Date().getFullYear();
