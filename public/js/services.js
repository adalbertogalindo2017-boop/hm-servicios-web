/* ═══════════════════════════════════════════════════════════
   services.js — Services Catalog for H&M Servicios
   ═══════════════════════════════════════════════════════════ */

const services = (() => {

  // Fallback services for when API is unavailable
  const fallbackServices = [
    { _id:'s1', nombre:'Instalación de Estufa a Gas', categoria:'gasodomesticos', descripcion:'Instalación profesional de estufas a gas con certificación. Incluye revisión de conexiones y prueba de funcionamiento.', precio:120000, icono:'fa-fire-burner', duracion:'2-3 horas' },
    { _id:'s2', nombre:'Revisión de Calentador', categoria:'gasodomesticos', descripcion:'Inspección completa de calentadores de agua a gas. Diagnóstico, limpieza y ajuste para máximo rendimiento.', precio:85000, icono:'fa-temperature-high', duracion:'1-2 horas' },
    { _id:'s3', nombre:'Detección de Fugas de Gas', categoria:'gasodomesticos', descripcion:'Detección profesional de fugas de gas con equipo especializado. Reparación inmediata incluida.', precio:95000, icono:'fa-wind', duracion:'1-2 horas' },
    { _id:'s4', nombre:'Mantenimiento de Horno', categoria:'gasodomesticos', descripcion:'Servicio completo de mantenimiento preventivo para hornos a gas. Limpieza profunda y calibración.', precio:110000, icono:'fa-oven', duracion:'2 horas' },
    { _id:'s5', nombre:'Instalación de Red de Gas', categoria:'gasodomesticos', descripcion:'Diseño e instalación de redes internas de gas natural. Incluye certificación y trámites.', precio:350000, icono:'fa-diagram-project', duracion:'1-2 días' },
    { _id:'s6', nombre:'Remodelación de Cocina', categoria:'obra_civil', descripcion:'Remodelación integral de cocinas. Diseño, demolición, acabados y equipamiento completo.', precio:2500000, icono:'fa-kitchen-set', duracion:'5-10 días' },
    { _id:'s7', nombre:'Instalación de Enchapes', categoria:'obra_civil', descripcion:'Instalación profesional de enchapes en pisos y paredes. Cerámica, porcelanato y piedra natural.', precio:180000, icono:'fa-border-all', duracion:'2-4 días' },
    { _id:'s8', nombre:'Plomería General', categoria:'obra_civil', descripcion:'Servicios de plomería: reparación de tuberías, instalación de griferías y solución de goteras.', precio:150000, icono:'fa-faucet-drip', duracion:'2-4 horas' },
    { _id:'s9', nombre:'Pintura Interior', categoria:'obra_civil', descripcion:'Servicio de pintura interior para apartamentos y casas. Incluye preparación de superficies y acabados.', precio:200000, icono:'fa-paint-roller', duracion:'2-3 días' },
    { _id:'s10', nombre:'Reparación de Drywall', categoria:'obra_civil', descripcion:'Instalación y reparación de muros y cielos en drywall. Acabados lisos listos para pintar.', precio:160000, icono:'fa-vector-square', duracion:'1-3 días' }
  ];

  let servicesList = [];

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

  function renderGrid(filter) {
    const filtered = filter === 'all' ? servicesList : servicesList.filter(s => s.categoria === filter);
    const grid = document.getElementById('servicesGrid');
    if (!grid) return;

    if (filtered.length === 0) {
      grid.innerHTML = '<p class="empty-state"><i class="fas fa-inbox"></i> No se encontraron servicios</p>';
      return;
    }

    grid.innerHTML = filtered.map((s, i) => `
      <div class="service-card glass-card animate-on-scroll" style="animation-delay:${i * 0.08}s" data-id="${s._id || s.id}">
        <div class="service-card-icon">
          <i class="fas ${s.icono || 'fa-wrench'}"></i>
        </div>
        <div class="service-card-badge">${s.categoria === 'gasodomesticos' ? 'Gasodomésticos' : 'Obra Civil'}</div>
        <h3 class="service-card-title">${s.nombre}</h3>
        <p class="service-card-desc">${s.descripcion}</p>
        <div class="service-card-meta">
          <span class="service-price"><i class="fas fa-tag"></i> $${(s.precio || 0).toLocaleString('es-CO')} COP</span>
          <span class="service-duration"><i class="fas fa-clock"></i> ${s.duracion || 'Variable'}</span>
        </div>
        <button class="btn btn-primary btn-block btn-sm service-book-btn" data-id="${s._id || s.id}">
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

    // Service booking buttons (delegated)
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
