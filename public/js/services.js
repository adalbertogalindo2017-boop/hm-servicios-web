/* ═══════════════════════════════════════════════════════════
   services.js — Services Catalog for H&M Servicios
   ═══════════════════════════════════════════════════════════ */

const services = (() => {

  // Fallback services for when API is unavailable. Mismos nombres de campo
  // que usa la API real (category, name, description, base_price, icon,
  // estimated_time) para que renderGrid no tenga que distinguir entre datos
  // reales y datos de respaldo.
  const fallbackServices = [
    { id:'s1', name:'Instalación de Estufa a Gas', category:'gasodomesticos', description:'Instalación profesional de estufas a gas con certificación. Incluye revisión de conexiones y prueba de funcionamiento.', base_price:120000, icon:'fire-burner', estimated_time:'2-3 horas' },
    { id:'s2', name:'Revisión de Calentador', category:'gasodomesticos', description:'Inspección completa de calentadores de agua a gas. Diagnóstico, limpieza y ajuste para máximo rendimiento.', base_price:85000, icon:'temperature-high', estimated_time:'1-2 horas' },
    { id:'s3', name:'Detección de Fugas de Gas', category:'gasodomesticos', description:'Detección profesional de fugas de gas con equipo especializado. Reparación inmediata incluida.', base_price:95000, icon:'wind', estimated_time:'1-2 horas' },
    { id:'s4', name:'Mantenimiento de Horno', category:'gasodomesticos', description:'Servicio completo de mantenimiento preventivo para hornos a gas. Limpieza profunda y calibración.', base_price:110000, icon:'oven', estimated_time:'2 horas' },
    { id:'s5', name:'Instalación de Red de Gas', category:'gasodomesticos', description:'Diseño e instalación de redes internas de gas natural. Incluye certificación y trámites.', base_price:350000, icon:'diagram-project', estimated_time:'1-2 días' },
    { id:'s6', name:'Remodelación de Cocina', category:'obra_civil', description:'Remodelación integral de cocinas. Diseño, demolición, acabados y equipamiento completo.', base_price:2500000, icon:'kitchen-set', estimated_time:'5-10 días' },
    { id:'s7', name:'Instalación de Enchapes', category:'obra_civil', description:'Instalación profesional de enchapes en pisos y paredes. Cerámica, porcelanato y piedra natural.', base_price:180000, icon:'border-all', estimated_time:'2-4 días' },
    { id:'s8', name:'Plomería General', category:'obra_civil', description:'Servicios de plomería: reparación de tuberías, instalación de griferías y solución de goteras.', base_price:150000, icon:'faucet-drip', estimated_time:'2-4 horas' },
    { id:'s9', name:'Pintura Interior', category:'obra_civil', description:'Servicio de pintura interior para apartamentos y casas. Incluye preparación de superficies y acabados.', base_price:200000, icon:'paint-roller', estimated_time:'2-3 días' },
    { id:'s10', name:'Reparación de Drywall', category:'obra_civil', description:'Instalación y reparación de muros y cielos en drywall. Acabados lisos listos para pintar.', base_price:160000, icon:'vector-square', estimated_time:'1-3 días' }
  ];

  let servicesList = [];

  // ── Catálogo por tipo de servicio (pestaña desplegable) ──────
  // Agrupa los servicios existentes por el tipo específico que el
  // cliente busca (plomería, gas, obra blanca, pintura, mantenimiento
  // de calentadores/estufa/horno/secadora, construcción y remodelación),
  // para que cada persona pueda escoger directamente el servicio
  // adecuado en vez de navegar solo por las dos categorías generales.
  const catalogGroups = [
    { key: 'plomeria',      label: 'Plomería',                         icon: 'faucet-drip',     keywords: ['plomer', 'tuber', 'griferia', 'desague', 'desagüe', 'sanitario', 'lavaplatos', 'goter'] },
    { key: 'gas',           label: 'Instalaciones y Fugas de Gas',     icon: 'fire',             keywords: ['de gas', 'gasista'] },
    { key: 'obra_blanca',   label: 'Obra Blanca y Acabados',          icon: 'hard-hat',         keywords: ['obra blanca', 'drywall', 'enchape', 'pañete', 'panete', 'muro', 'cielo raso', 'acabado', 'albañil', 'albanil'] },
    { key: 'pintura',       label: 'Pintura',                          icon: 'paint-roller',     keywords: ['pintura', 'pintar'] },
    { key: 'calentadores',  label: 'Mantenimiento de Calentadores',    icon: 'temperature-high', keywords: ['calentador'] },
    { key: 'estufa',        label: 'Estufa',                           icon: 'fire-burner',      keywords: ['estufa'] },
    { key: 'horno',         label: 'Horno',                            icon: 'box',              keywords: ['horno'] },
    { key: 'secadora',      label: 'Secadora',                         icon: 'wind',             keywords: ['secadora'] },
    { key: 'construccion',  label: 'Construcción y Remodelación Integral', icon: 'building',     keywords: ['remodelacion', 'remodelación', 'construccion desde cero', 'construcción desde cero', 'obra civil', 'construccion integral', 'construcción integral'] }
  ];

  function stripAccents(str) {
    return (str || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function matchGroup(group) {
    return servicesList.filter(s => {
      const haystack = stripAccents(`${s.name || ''} ${s.description || ''} ${s.category || ''}`);
      return group.keywords.some(kw => haystack.includes(stripAccents(kw)));
    });
  }

  function renderGroupPanel(group) {
    const matches = matchGroup(group);
    if (matches.length === 0) {
      return `
        <div class="accordion-empty">
          <p><i class="fas fa-info-circle"></i> Aún no hay un servicio publicado exactamente para "${group.label}", pero puedes solicitar una cotización y un técnico te contactará.</p>
          <button class="btn btn-outline btn-sm accordion-request-btn" data-label="${group.label}"><i class="fas fa-paper-plane"></i> Solicitar cotización</button>
        </div>`;
    }
    return `
      <div class="accordion-services">
        ${matches.map(s => `
          <div class="accordion-service-row" data-id="${s.id}">
            <div class="accordion-service-info">
              <strong>${s.name || 'Servicio'}</strong>
              <span>${(s.description || '').slice(0, 110)}${(s.description || '').length > 110 ? '…' : ''}</span>
            </div>
            <div class="accordion-service-right">
              <span class="service-price">$${(s.base_price || 0).toLocaleString('es-CO')} COP</span>
              <button class="btn btn-primary btn-sm service-book-btn" data-id="${s.id}"><i class="fas fa-calendar-check"></i> Solicitar</button>
            </div>
          </div>
        `).join('')}
      </div>`;
  }

  function renderCatalogAccordion() {
    return `
      <div class="catalog-accordion animate-on-scroll" id="catalogAccordion">
        ${catalogGroups.map(g => `
          <div class="accordion-item" data-group="${g.key}">
            <button class="accordion-header" type="button" aria-expanded="false">
              <span class="accordion-header-left"><i class="fas fa-${g.icon}"></i> ${g.label}</span>
              <i class="fas fa-chevron-down accordion-chevron"></i>
            </button>
            <div class="accordion-panel">
              <div class="accordion-panel-inner"></div>
            </div>
          </div>
        `).join('')}
      </div>`;
  }

  // ── Render page ────────────────────────────────────────────

  function render() {
    return `
      <section class="page-section services-page">
        <div class="container">
          <div class="section-header animate-on-scroll">
            <span class="section-badge"><i class="fas fa-tools"></i> Nuestros Servicios</span>
            <h2 class="section-title">Soluciones Profesionales para tu Hogar</h2>
            <p class="section-subtitle">Contamos con técnicos certificados para cada necesidad. Todos los servicios incluyen garantía.</p>
          </div>

          <!-- Catálogo desplegable por tipo de servicio -->
          <div class="catalog-intro animate-on-scroll">
            <h3><i class="fas fa-list-check"></i> Escoge el servicio que necesitas</h3>
            <p>Despliega una categoría para ver el servicio exacto y solicitarlo.</p>
          </div>
          ${renderCatalogAccordion()}

          <!-- Filter Tabs -->
          <div class="filter-tabs animate-on-scroll">
            <button class="filter-tab active" data-filter="all"><i class="fas fa-th"></i> Todos</button>
            <button class="filter-tab" data-filter="gasodomesticos"><i class="fas fa-fire"></i> Gasodomésticos</button>
            <button class="filter-tab" data-filter="obra_civil"><i class="fas fa-hard-hat"></i> Obra Civil</button>
          </div>

          <!-- Services Grid -->
          <div class="services-grid" id="servicesGrid">
            <div class="loading-skeleton">
              ${Array(6).fill('<div class="skeleton-card"></div>').join('')}
            </div>
          </div>

          ${auth.getUserRole() === 'admin' ? `
          <div class="admin-section glass-card animate-on-scroll">
            <h3><i class="fas fa-plus-circle"></i> Agregar Nuevo Servicio</h3>
            <form id="addServiceForm" class="service-form">
              <div class="form-row">
                <div class="form-group">
                  <input type="text" id="svcName" placeholder="Nombre del servicio" required />
                </div>
                <div class="form-group">
                  <select id="svcCategory">
                    <option value="gasodomesticos">Gasodomésticos</option>
                    <option value="obra_civil">Obra Civil</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <textarea id="svcDesc" placeholder="Descripción" rows="2"></textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <input type="number" id="svcPrice" placeholder="Precio (COP)" min="0" />
                </div>
                <div class="form-group">
                  <input type="text" id="svcDuration" placeholder="Duración estimada" />
                </div>
              </div>
              <button type="submit" class="btn btn-primary">Agregar Servicio</button>
            </form>
          </div>` : ''}
        </div>
      </section>
    `;
  }

  // ── Load services ──────────────────────────────────────────

  async function loadServices() {
    try {
      const data = await api.get('/services');
      servicesList = Array.isArray(data) ? data : (data.services || data.servicios || fallbackServices);
    } catch {
      servicesList = fallbackServices;
    }
    renderGrid('all');
  }

  // ── Render the grid ────────────────────────────────────────

  // El backend (server/controllers/services.controller.js → tabla "services"
  // en database.js) siempre devuelve los campos en inglés: category, name,
  // description, base_price, estimated_time, icon. Antes esta función leía
  // s.categoria/s.nombre/s.descripcion/s.precio/s.duracion/s.icono — ninguno
  // existe en la respuesta real — así que cada tarjeta se renderizaba con
  // "undefined" en el título y la descripción, "$0 COP" de precio, y la
  // insignia de categoría siempre caía en "Obra Civil" (el valor por
  // defecto del operador ternario, porque s.categoria nunca era
  // 'gasodomesticos'). El filtro por categoría tampoco funcionaba por el
  // mismo motivo. El catálogo se veía roto para cualquier usuario, antes
  // incluso de intentar solicitar un servicio.
  function renderGrid(filter) {
    const filtered = filter === 'all' ? servicesList : servicesList.filter(s => s.category === filter);
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;

    if (filtered.length === 0) {
      grid.innerHTML = '<p class="empty-state"><i class="fas fa-inbox"></i> No se encontraron servicios</p>';
      return;
    }

    grid.innerHTML = filtered.map((s, i) => `
      <div class="service-card glass-card animate-on-scroll" style="animation-delay:${i * 0.08}s" data-id="${s.id}">
        <div class="service-card-icon">
          <i class="fas fa-${s.icon || 'wrench'}"></i>
        </div>
        <div class="service-card-badge">${s.category === 'gasodomesticos' ? 'Gasodomésticos' : 'Obra Civil'}</div>
        <h3 class="service-card-title">${s.name || 'Servicio'}</h3>
        <p class="service-card-desc">${s.description || ''}</p>
        <div class="service-card-meta">
          <span class="service-price"><i class="fas fa-tag"></i> $${(s.base_price || 0).toLocaleString('es-CO')} COP</span>
          <span class="service-duration"><i class="fas fa-clock"></i> ${s.estimated_time || 'Variable'}</span>
        </div>
        <button class="btn btn-primary btn-block btn-sm service-book-btn" data-id="${s.id}">
          <i class="fas fa-calendar-check"></i> Solicitar Servicio
        </button>
      </div>
    `).join('');
  }

  // ── Events ─────────────────────────────────────────────────

  function initEvents() {
    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderGrid(tab.dataset.filter);
      });
    });

    // Catalog accordion (pestaña desplegable por tipo de servicio)
    document.querySelectorAll('.accordion-header').forEach(header => {
      header.addEventListener('click', () => {
        const item = header.closest('.accordion-item');
        const panel = item.querySelector('.accordion-panel');
        const inner = item.querySelector('.accordion-panel-inner');
        const key = item.dataset.group;
        const isOpen = item.classList.contains('open');

        if (!isOpen) {
          if (!inner.dataset.rendered) {
            const group = catalogGroups.find(g => g.key === key);
            inner.innerHTML = renderGroupPanel(group);
            inner.dataset.rendered = '1';
          }
          item.classList.add('open');
          header.setAttribute('aria-expanded', 'true');
          panel.style.maxHeight = `${inner.scrollHeight}px`;
        } else {
          item.classList.remove('open');
          header.setAttribute('aria-expanded', 'false');
          panel.style.maxHeight = '0px';
        }
      });
    });

    // Service booking buttons (delegated) + accordion "solicitar cotización"
    document.addEventListener('click', (e) => {
      const bookBtn = e.target.closest('.service-book-btn');
      if (bookBtn) {
        if (!auth.isLoggedIn()) {
          window.toast('Inicia sesión para solicitar un servicio', 'warning');
          location.hash = '#login';
          return;
        }
        const serviceId = bookBtn.dataset.id;
        location.hash = `#booking?service=${serviceId}`;
        return;
      }

      const reqBtn = e.target.closest('.accordion-request-btn');
      if (reqBtn) {
        if (!auth.isLoggedIn()) {
          window.toast('Inicia sesión para solicitar un servicio', 'warning');
          location.hash = '#login';
          return;
        }
        const label = reqBtn.dataset.label || '';
        location.hash = `#booking?label=${encodeURIComponent(label)}`;
      }
    });

    // Admin add service
    const addForm = document.getElementById('addServiceForm');
    if (addForm) {
      addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
          nombre: document.getElementById('svcName').value,
          categoria: document.getElementById('svcCategory').value,
          descripcion: document.getElementById('svcDesc').value,
          precio: Number(document.getElementById('svcPrice').value),
          duracion: document.getElementById('svcDuration').value
        };
        try {
          await api.post('/services', payload);
          window.toast('Servicio creado exitosamente', 'success');
          addForm.reset();
          loadServices();
        } catch (err) {
          window.toast(err.message || 'Error al crear servicio', 'error');
        }
      });
    }
  }

  function getServiceById(id) {
    return servicesList.find(s => (s._id || s.id) === id);
  }

  return { render, loadServices, initEvents, getServiceById, servicesList: () => servicesList };
})();
