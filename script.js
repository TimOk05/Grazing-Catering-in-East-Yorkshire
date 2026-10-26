const body = document.body;
const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const navigation = document.querySelector('[data-navigation]');
const services = document.querySelectorAll('[data-service]');
const planner = document.querySelector('[data-planner]');
const dateField = document.querySelector('#event-date');

const setHeaderState = () => {
  const announcementHeight = document.querySelector('.announcement')?.offsetHeight || 0;
  const isFixed = window.scrollY > announcementHeight;

  header.classList.toggle('is-fixed', isFixed);
  body.style.paddingTop = isFixed ? `${header.offsetHeight}px` : '0px';
};

const closeMenu = () => {
  navigation.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open menu');
  body.classList.remove('menu-open');
};

menuToggle.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  navigation.classList.toggle('is-open', !isOpen);
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Open menu' : 'Close menu');
  body.classList.toggle('menu-open', !isOpen);
});

navigation.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMenu);
});

window.addEventListener('scroll', setHeaderState, { passive: true });
window.addEventListener('resize', () => {
  if (window.innerWidth > 780) closeMenu();
  setHeaderState();
});
setHeaderState();

services.forEach((service) => {
  const button = service.querySelector('button');
  const content = service.querySelector('.service__body');

  button.addEventListener('click', () => {
    const willOpen = button.getAttribute('aria-expanded') !== 'true';

    services.forEach((item) => {
      item.classList.remove('service--active');
      item.querySelector('button').setAttribute('aria-expanded', 'false');
      item.querySelector('.service__body').hidden = true;
    });

    if (willOpen) {
      service.classList.add('service--active');
      button.setAttribute('aria-expanded', 'true');
      content.hidden = false;
    }
  });
});

const revealElements = document.querySelectorAll('.reveal');
revealElements.forEach((element) => {
  const delay = element.dataset.delay || 0;
  element.style.setProperty('--reveal-delay', `${delay}ms`);
});

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add('is-visible'));
}

const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
dateField.min = `${year}-${month}-${day}`;

const showError = (field, message) => {
  const error = document.querySelector(`#${field.id}-error`);
  field.setAttribute('aria-invalid', String(Boolean(message)));
  field.setAttribute('aria-describedby', error.id);
  error.textContent = message;
};

const validatePlanner = () => {
  const occasion = planner.elements.occasion;
  const eventDate = planner.elements.date;
  const guests = planner.elements.guests;
  const postcode = planner.elements.postcode;
  let isValid = true;

  showError(occasion, occasion.value ? '' : 'Please choose an occasion.');
  showError(eventDate, eventDate.value ? '' : 'Please choose a preferred date.');
  showError(guests, guests.value && Number(guests.value) >= 2 ? '' : 'Please enter at least 2 guests.');
  showError(postcode, postcode.value.trim() ? '' : 'Please add the venue postcode.');

  [occasion, eventDate, guests, postcode].forEach((field) => {
    if (field.getAttribute('aria-invalid') === 'true') isValid = false;
  });

  return isValid;
};

planner.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!validatePlanner()) {
    planner.querySelector('[aria-invalid="true"]')?.focus();
    return;
  }

  const formData = new FormData(planner);
  const date = new Date(`${formData.get('date')}T12:00:00`);
  const formattedDate = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
  const message = `Hi Gather & Graze Yorkshire! I’m planning a ${String(formData.get('occasion')).toLowerCase()} on ${formattedDate} for around ${formData.get('guests')} guests in ${String(formData.get('postcode')).toUpperCase()}. Could you let me know about availability and suitable grazing options?`;
  const result = planner.querySelector('[data-planner-result]');

  planner.querySelector('[data-planner-message]').textContent = message;
  result.hidden = false;
  result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

planner.querySelector('[data-copy-message]').addEventListener('click', async (event) => {
  const button = event.currentTarget;
  const message = planner.querySelector('[data-planner-message]').textContent;

  try {
    await navigator.clipboard.writeText(message);
    button.textContent = 'Copied!';
    window.setTimeout(() => { button.textContent = 'Copy message'; }, 1800);
  } catch {
    button.textContent = 'Select the message above';
  }
});

document.querySelector('[data-year]').textContent = String(new Date().getFullYear());
