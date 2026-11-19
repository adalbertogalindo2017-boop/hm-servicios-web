/* ═══════════════════════════════════════════════════════════
   app.js — Main Application & SPA Router for H&M Servicios
   ═══════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  const appContainer = document.getElementById('app');

  // ═══════════════════════════════════════════════════════════
  //  TOAST NOTIFICATIONS
  // ═══════════════════════════════════════════════════════════

  window.toast = (message, type = 'info', duration = 4000) => {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span><button class="toast-close"><i class="fas fa-times"></i></button>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    const dismiss = () => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); };
    toast.querySelector('.toast-close').addEventListener('click', dismiss);
    setTimeout(dismiss, duration);
  };

  // ═══════════════════════════════════════════════════════════
  //  MODAL
  // ═══════════════════════════════════════════════════════════

  window.openModal = (html) => {
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');
    content.innerHTML = `<button class="modal-close" onclick="window.closeModal()"><i class="fas fa-times"></i></button>${html}`;
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('active'));
  };

  window.closeModal = () => {
    const overlay = document.getElementById('modalOverlay');
    overlay.classList.remove('active');
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
  };

  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) window.closeModal();
  });

  // ═══════════════════════════════════════════════════════════
  //  LANDING PAGE (HOME)
  // ═══════════════════════════════════════════════════════════

  function renderHome() {
    return `
      <!-- HERO -->
      <section class="hero">
        <div class="hero-bg">
          <div class="floating-shape shape-1"></div>
          <div class="floating-shape shape-2"></div>
          <div class="floating-shape shape-3"></div>
          <div class="floating-shape shape-4"></div>
          <div class="floating-shape shape-5"></div>
        </div>
        <div class="hero-content container">
          <span class="hero-badge animate-on-scroll"><i class="fas fa-bolt"></i> La plataforma #1 en servicios para el hogar</span>
          <h1 class="hero-title animate-on-scroll">Técnicos Certificados<br/><span class="gradient-text">a Tu Alcance</span></h1>
          <p class="hero-subtitle animate-on-scroll">Conectamos clientes con profesionales verificados en gasodomésticos y obra civil. Solicita un servicio en minutos y recibe atención de calidad.</p>
          <div class="hero-actions animate-on-scroll">
            <a href="#services" class="btn btn-primary btn-lg"><i class="fas fa-tools"></i> Ver Servicios</a>
            <a href="#technicians" class="btn btn-glass btn-lg"><i class="fas fa-search"></i> Buscar Técnicos</a>
          </div>
          <div class="hero-trust animate-on-scroll">
            <div class="trust-item"><i class="fas fa-shield-alt"></i> Técnicos verificados</div>
            <div class="trust-item"><i class="fas fa-award"></i> Garantía de servicio</div>
            <div class="trust-item"><i class="fas fa-headset"></i> Soporte 24/7</div>
          </div>
        </div>
      </section>

      <!-- HOW IT WORKS -->
      <section class="section-how-it-works">
        <div class="container">
          <div class="section-header animate-on-scroll">
            <span class="section-badge"><i class="fas fa-lightbulb"></i> ¿Cómo Funciona?</span>
            <h2 class="section-title">Tres Pasos Simples</h2>
            <p class="section-subtitle">Solicitar un servicio nunca fue tan fácil</p>
          </div>
          <div class="steps-grid">
            <div class="step-card animate-on-scroll">
              <div class="step-number">1</div>
              <div class="step-icon"><i class="fas fa-search"></i></div>
              <h3>Elige tu Servicio</h3>
              <p>Explora nuestro catálogo de servicios en gasodomésticos y obra civil.</p>
            </div>
            <div class="step-connector animate-on-scroll"><i class="fas fa-chevron-right"></i></div>
            <div class="step-card animate-on-scroll">
              <div class="step-number">2</div>
              <div class="step-icon"><i class="fas fa-user-check"></i></div>
              <h3>Conecta con un Técnico</h3>
              <p>Te asignamos un profesional certificado cerca de tu ubicación.</p>
            </div>
            <div class="step-connector animate-on-scroll"><i class="fas fa-chevron-right"></i></div>
            <div class="step-card animate-on-scroll">
              <div class="step-number">3</div>
              <div class="step-icon"><i class="fas fa-check-double"></i></div>
              <h3>Servicio Completado</h3>
              <p>Recibe el servicio, califica al técnico y paga de forma segura.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- SERVICES SHOWCASE -->
      <section class="section-services-showcase">
        <div class="container">
          <div class="section-header animate-on-scroll">
            <span class="section-badge"><i class="fas fa-star"></i> Destacados</span>
            <h2 class="section-title">Servicios Más Populares</h2>
            <p class="section-subtitle">Los servicios que más solicitan nuestros clientes</p>
          </div>
          <div class="showcase-grid">
            <div class="showcase-card glass-card animate-on-scroll">
              <div class="showcase-icon"><i class="fas fa-fire-burner"></i></div>
              <h3>Instalación de Estufas</h3>
              <p>Instalación profesional de estufas a gas con certificación completa.</p>
              <span class="showcase-price">Desde $120.000 COP</span>
            </div>
            <div class="showcase-card glass-card animate-on-scroll">
              <div class="showcase-icon"><i class="fas fa-temperature-high"></i></div>
              <h3>Revisión de Calentadores</h3>
              <p>Diagnóstico, limpieza y ajuste de calentadores de agua a gas.</p>
              <span class="showcase-price">Desde $85.000 COP</span>
            </div>
            <div class="showcase-card glass-card animate-on-scroll">
              <div class="showcase-icon"><i class="fas fa-faucet-drip"></i></div>
              <h3>Plomería General</h3>
              <p>Reparación de tuberías, grifería y solución de fugas.</p>
              <span class="showcase-price">Desde $150.000 COP</span>
            </div>
            <div class="showcase-card glass-card animate-on-scroll">
              <div class="showcase-icon"><i class="fas fa-paint-roller"></i></div>
              <h3>Pintura Interior</h3>
              <p>Servicio completo de pintura para tu hogar con acabados premium.</p>
              <span class="showcase-price">Desde $200.000 COP</span>
            </div>
          </div>
          <div class="text-center animate-on-scroll" style="margin-top:2rem;">
            <a href="#services" class="btn btn-primary btn-lg"><i class="fas fa-arrow-right"></i> Ver Todos los Servicios</a>
          </div>
        </div>
      </section>

      <!-- STATS COUNTER -->
      <section class="section-stats">
        <div class="container">
          <div class="stats-counter-grid">
            <div class="counter-card animate-on-scroll">
              <div class="counter-icon"><i class="fas fa-hard-hat"></i></div>
              <div class="counter-number" data-target="500">0</div>
              <div class="counter-label">Técnicos Certificados</div>
            </div>
            <div class="counter-card animate-on-scroll">
              <div class="counter-icon"><i class="fas fa-clipboard-check"></i></div>
              <div class="counter-number" data-target="10000">0</div>
              <div class="counter-label">Servicios Completados</div>
            </div>
            <div class="counter-card animate-on-scroll">
              <div class="counter-icon"><i class="fas fa-smile-beam"></i></div>
              <div class="counter-number" data-target="8500">0</div>
              <div class="counter-label">Clientes Satisfechos</div>
            </div>
            <div class="counter-card animate-on-scroll">
              <div class="counter-icon"><i class="fas fa-map-marker-alt"></i></div>
              <div class="counter-number" data-target="25">0</div>
              <div class="counter-label">Ciudades</div>
            </div>
          </div>
        </div>
      </section>

      <!-- TESTIMONIALS -->
      <section class="section-testimonials">
        <div class="container">
          <div class="section-header animate-on-scroll">
            <span class="section-badge"><i class="fas fa-quote-left"></i> Testimonios</span>
            <h2 class="section-title">Lo Que Dicen Nuestros Clientes</h2>
          </div>
          <div class="testimonials-grid">
            <div class="testimonial-card glass-card animate-on-scroll">
              <div class="testimonial-stars"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>
              <p class="testimonial-text">"Excelente servicio. El técnico llegó puntual, fue muy profesional y dejó todo funcionando perfectamente. ¡100% recomendado!"</p>
              <div class="testimonial-author">
                <div class="testimonial-avatar" style="background:hsl(220,70%,45%)">JR</div>
                <div><strong>Juan Rodríguez</strong><span>Bogotá, Colombia</span></div>
              </div>
            </div>
            <div class="testimonial-card glass-card animate-on-scroll">
              <div class="testimonial-stars"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>
              <p class="testimonial-text">"La plataforma es muy fácil de usar. En menos de 5 minutos tenía un técnico asignado. El precio fue justo y el trabajo de calidad."</p>
              <div class="testimonial-author">
                <div class="testimonial-avatar" style="background:hsl(160,70%,40%)">CM</div>
                <div><strong>Camila Martínez</strong><span>Medellín, Colombia</span></div>
              </div>
            </div>
            <div class="testimonial-card glass-card animate-on-scroll">
              <div class="testimonial-stars"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-alt"></i></div>
              <p class="testimonial-text">"Tuve un problema con mi calentador a las 9pm y encontré un técnico disponible rápidamente. Servicio increíble a cualquier hora."</p>
              <div class="testimonial-author">
                <div class="testimonial-avatar" style="background:hsl(36,80%,45%)">AP</div>
                <div><strong>Andrés Pérez</strong><span>Cali, Colombia</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA -->
      <section class="section-cta">
        <div class="container">
          <div class="cta-card animate-on-scroll">
            <h2>¿Listo para Transformar tu Hogar?</h2>
            <p>Únete a miles de colombianos que confían en H&M Servicios para el mantenimiento y mejora de sus hogares.</p>
            <div class="cta-actions">
              <a href="#register" class="btn btn-primary btn-lg"><i class="fas fa-rocket"></i> Comenzar Ahora</a>
              <a href="#register" class="btn btn-glass btn-lg"><i class="fas fa-hard-hat"></i> Ser Técnico</a>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  // ═══════════════════════════════════════════════════════════
  //  404 PAGE
  // ═══════════════════════════════════════════════════════════

  function render404() {
    return `
      <section class="page-section page-404">
        <div class="container text-center">
          <div class="error-icon animate-on-scroll"><i class="fas fa-exclamation-triangle"></i></div>
          <h1 class="animate-on-scroll">404</h1>
          <p class="animate-on-scroll">La página que buscas no existe.</p>
          <a href="#home" class="btn btn-primary btn-lg animate-on-scroll"><i class="fas fa-home"></i> Volver al Inicio</a>
        </div>
      </section>
    `;
  }

  // ═══════════════════════════════════════════════════════════
  //  SPA ROUTER
  // ═══════════════════════════════════════════════════════════

  function parseHash() {
    const raw = location.hash.slice(1) || 'home';
    const [path, queryString] = raw.split('?');
    const params = {};
    if (queryString) {
      queryString.split('&').forEach(p => {
        const [k, v] = p.split('=');
        params[decodeURIComponent(k)] = decodeURIComponent(v || '');
      });
    }
    return { path, params };
  }

  async function navigateTo(path, params = {}) {
    // Page transition out
    appContainer.classList.add('page-exit');
    await new Promise(r => setTimeout(r, 200));

    let html = '';
    let afterRender = null;

    switch (path) {
      case 'home':
        html = renderHome();
        afterRender = () => initScrollAnimations();
        break;

      case 'login':
        html = auth.renderLogin();
        break;

      case 'register':
        html = auth.renderRegister();
        afterRender = () => auth.initRegisterEvents();
        break;

      case 'forgot-password':
        html = auth.renderForgotPassword();
        break;

      case 'services':
        html = services.render();
        afterRender = () => { services.loadServices(); services.initEvents(); };
        break;

      case 'technicians':
        html = technicians.render();
        afterRender = () => { technicians.loadTechnicians(); technicians.initEvents(); };
        break;

      case 'booking':
        if (!auth.isLoggedIn()) { location.hash = '#login'; return; }
        html = dashboard.renderBooking(params);
        afterRender = () => dashboard.initBooking(params);
        break;

      case 'client-dashboard':
        if (!auth.isLoggedIn()) { location.hash = '#login'; return; }
        html = dashboard.renderClientDashboard();
        afterRender = () => dashboard.loadClientDashboard();
        break;

      case 'tech-dashboard':
        if (!auth.isLoggedIn()) { location.hash = '#login'; return; }
        html = dashboard.renderTechDashboard();
        afterRender = () => dashboard.loadTechDashboard();
        break;

      case 'admin-dashboard':
        if (!auth.isLoggedIn() || auth.getUserRole() !== 'admin') { location.hash = '#login'; return; }
        html = dashboard.renderAdminDashboard();
        afterRender = () => dashboard.loadAdminDashboard();
        break;

      case 'payment':
        if (!auth.isLoggedIn()) { location.hash = '#login'; return; }
        html = payments.renderPaymentForm(params.amount || 0, params.request || '');
        afterRender = () => payments.initEvents();
        break;

      default:
        html = render404();
    }

    appContainer.innerHTML = html;
    appContainer.classList.remove('page-exit');
    appContainer.classList.add('page-enter');
    setTimeout(() => appContainer.classList.remove('page-enter'), 500);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.toggle('active', link.dataset.page === path);
    });

    // Post-render hooks
    if (afterRender) afterRender();
    initScrollAnimations();
  }

  // ═══════════════════════════════════════════════════════════
  //  SCROLL ANIMATIONS & COUNTER
  // ═══════════════════════════════════════════════════════════

  // Observer de mutaciones activo entre navegaciones, para poder
  // desconectar el anterior y no ir acumulando uno nuevo cada vez que el
  // router cambia de página (ver más abajo).
  let scrollAnimMutationObserver = null;

  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');

          // Counter animation
          if (entry.target.querySelector('.counter-number')) {
            animateCounters(entry.target);
          }

          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));

    // initScrollAnimations() se llama una sola vez justo después de
    // renderizar la página (afterRender()), pero varias páginas (el
    // catálogo de servicios, la lista de técnicos) cargan su contenido de
    // forma asíncrona (esperan la respuesta de la API) e inyectan sus
    // tarjetas ".animate-on-scroll" DESPUÉS de ese punto. Esas tarjetas
    // nunca llegaban a pasar por el querySelectorAll de arriba, así que el
    // IntersectionObserver nunca las observaba y se quedaban en
    // "opacity:0" (su estado inicial en CSS) para siempre — la página se
    // veía completamente en blanco aunque el contenido sí se hubiera
    // cargado correctamente. Este MutationObserver detecta cualquier
    // ".animate-on-scroll" agregado después, sin importar qué módulo lo
    // inyecte ni cuándo, y lo entrega al mismo IntersectionObserver.
    if (scrollAnimMutationObserver) scrollAnimMutationObserver.disconnect();
    scrollAnimMutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          if (node.classList && node.classList.contains('animate-on-scroll')) {
            observer.observe(node);
          }
          if (node.querySelectorAll) {
            node.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
          }
        });
      });
    });
    scrollAnimMutationObserver.observe(appContainer, { childList: true, subtree: true });
  }

  function animateCounters(parent) {
    parent.querySelectorAll('.counter-number').forEach(counter => {
      const target = parseInt(counter.dataset.target);
      const increment = target / 80;
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          counter.textContent = target.toLocaleString('es-CO') + '+';
          clearInterval(timer);
        } else {
          counter.textContent = Math.floor(current).toLocaleString('es-CO');
        }
      }, 20);
    });
  }

  // ═══════════════════════════════════════════════════════════
  //  GLOBAL EVENT DELEGATION
  // ═══════════════════════════════════════════════════════════

  // Login form
  document.addEventListener('submit', (e) => {
    if (e.target.id === 'loginForm') auth.handleLogin(e);
    if (e.target.id === 'registerForm') auth.handleRegister(e);
    if (e.target.id === 'forgotPasswordForm') auth.handleForgotPassword(e);
  });

  // Logout
  document.addEventListener('click', (e) => {
    if (e.target.closest('#logoutBtn')) auth.logout();
  });

  // Hamburger toggle
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', navMenu.classList.contains('active'));
  });

  // Close menu on link click
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navMenu.classList.remove('active');
    });
  });

  // Navbar scroll effect
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
  });

  // ═══════════════════════════════════════════════════════════
  //  INIT
  // ═══════════════════════════════════════════════════════════

  window.addEventListener('hashchange', () => {
    const { path, params } = parseHash();
    navigateTo(path, params);
  });

  document.addEventListener('DOMContentLoaded', () => {
    auth.updateNav();
    dashboard.initDashboardEvents();
    const { path, params } = parseHash();
    navigateTo(path, params);
  });

})();
