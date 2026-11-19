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
