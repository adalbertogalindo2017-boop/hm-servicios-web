/* ═══════════════════════════════════════════════════════════
   technicians.js — Technician Search for H&M Servicios
   ═══════════════════════════════════════════════════════════ */

const technicians = (() => {

  const fallbackTechnicians = [
    { _id:'t1', nombre:'Carlos Rodríguez', email:'carlos@hm.com', telefono:'3001234567', especialidades:['Estufas','Calentadores','Hornos'], rating:4.8, totalReviews:127, distancia:1.2, disponible:true, zonaCobertura:'Norte de Bogotá', descripcion:'Técnico certificado con 10 años de experiencia en gasodomésticos.' },
    { _id:'t2', nombre:'María González', email:'maria@hm.com', telefono:'3109876543', especialidades:['Plomería','Enchapes','Drywall'], rating:4.9, totalReviews:98, distancia:2.5, disponible:true, zonaCobertura:'Chapinero, Usaquén', descripcion:'Especialista en obra civil y acabados de alta calidad.' },
    { _id:'t3', nombre:'Andrés López', email:'andres@hm.com', telefono:'3201112233', especialidades:['Redes de Gas','Detección de Fugas'], rating:4.7, totalReviews:85, distancia:3.1, disponible:false, zonaCobertura:'Suba, Engativá', descripcion:'Ingeniero de gas con certificación clase A.' },
    { _id:'t4', nombre:'Laura Martínez', email:'laura@hm.com', telefono:'3154445566', especialidades:['Pintura','Remodelación','Acabados'], rating:4.6, totalReviews:64, distancia:4.8, disponible:true, zonaCobertura:'Centro y Sur de Bogotá', descripcion:'Diseñadora de interiores y experta en remodelaciones.' },
    { _id:'t5', nombre:'Pedro Sánchez', email:'pedro@hm.com', telefono:'3187778899', especialidades:['Calentadores','Estufas','Redes de Gas'], rating:4.5, totalReviews:112, distancia:5.3, disponible:true, zonaCobertura:'Kennedy, Fontibón', descripcion:'Más de 15 años de experiencia en instalación y mantenimiento de gasodomésticos.' },
    { _id:'t6', nombre:'Ana Ramírez', email:'ana@hm.com', telefono:'3002223344', especialidades:['Plomería','Pintura','Enchapes'], rating:4.9, totalReviews:73, distancia:6.0, disponible:true, zonaCobertura:'Teusaquillo, Barrios Unidos', descripcion:'Profesional multidisciplinaria en servicios de obra civil.' }
  ];

  let techList = [];

  // ── Render page ────────────────────────────────────────────

  function render() {
    return `
      <section class="page-section technicians-page">
        <div class="container">
          <div class="section-header animate-on-scroll">
            <span class="section-badge"><i class="fas fa-hard-hat"></i> Técnicos Certificados</span>
            <h2 class="section-title">Profesionales Cerca de Ti</h2>
            <p class="section-subtitle">Encontramos los técnicos mejor calificados en tu zona. Todos verificados y con garantía.</p>
          </div>

          <!-- Location Status -->
          <div class="location-bar glass-card animate-on-scroll" id="locationBar">
            <i class="fas fa-location-crosshairs fa-spin"></i>
            <span>Obteniendo tu ubicación…</span>
          </div>

          <!-- Technicians Grid -->
          <div class="technicians-grid" id="techniciansGrid">
            <div class="loading-skeleton">
              ${Array(4).fill('<div class="skeleton-card skeleton-wide"></div>').join('')}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  // ── Load technicians ───────────────────────────────────────

  async function loadTechnicians() {
    const bar = document.getElementById('locationBar');

    // Try geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          if (bar) bar.innerHTML = '<i class="fas fa-map-marker-alt"></i> <span>Mostrando técnicos cerca de tu ubicación</span>';
          try {
            const data = await api.get(`/technicians/nearby?lat=${latitude}&lng=${longitude}`);
            techList = Array.isArray(data) ? data : (data.technicians || data.tecnicos || fallbackTechnicians);
          } catch {
            techList = fallbackTechnicians;
          }
          renderGrid();
        },
        async () => {
          // Geolocation denied
          if (bar) bar.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span>No se pudo acceder a tu ubicación. Mostrando todos los técnicos disponibles.</span>';
          await loadAll();
        },
        { timeout: 8000 }
      );
    } else {
      if (bar) bar.innerHTML = '<i class="fas fa-exclamation-triangle"></i> <span>Geolocalización no soportada. Mostrando todos los técnicos.</span>';
      await loadAll();
    }
  }

  async function loadAll() {
    try {
      const data = await api.get('/technicians');
      techList = Array.isArray(data) ? data : (data.technicians || data.tecnicos || fallbackTechnicians);
    } catch {
      techList = fallbackTechnicians;
    }
    renderGrid();
  }

  // ── Render grid ────────────────────────────────────────────

  function renderGrid() {
    const grid = document.getElementById('techniciansGrid');
    if (!grid) return;

    if (techList.length === 0) {
      grid.innerHTML = '<p class="empty-state"><i class="fas fa-user-slash"></i> No se encontraron técnicos disponibles</p>';
      return;
    }

    grid.innerHTML = techList.map((t, i) => {
      const initials = (t.nombre || 'T').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const hue = ((t.nombre || '').charCodeAt(0) * 37) % 360;
      return `
        <div class="tech-card glass-card animate-on-scroll" style="animation-delay:${i * 0.08}s" data-id="${t._id || t.id}">
          <div class="tech-card-header">
            <div class="tech-avatar" style="background:hsl(${hue},70%,45%)">
              <span>${initials}</span>
            </div>
            <div class="tech-info">
              <h3 class="tech-name">${t.nombre}</h3>
              <div class="tech-rating">
                ${renderStars(t.rating || 0)}
                <span class="rating-value">${(t.rating || 0).toFixed(1)}</span>
                <span class="rating-count">(${t.totalReviews || 0} reseñas)</span>
              </div>
            </div>
            <span class="availability-badge ${t.disponible ? 'available' : 'unavailable'}">
              <i class="fas ${t.disponible ? 'fa-check-circle' : 'fa-clock'}"></i>
              ${t.disponible ? 'Disponible' : 'Ocupado'}
            </span>
          </div>

          <p class="tech-description">${t.descripcion || ''}</p>

          <div class="tech-specialties">
            ${(t.especialidades || []).map(s => `<span class="specialty-tag">${s}</span>`).join('')}
          </div>

          <div class="tech-card-footer">
            <div class="tech-meta">
              ${t.distancia != null ? `<span class="tech-distance"><i class="fas fa-route"></i> ${t.distancia.toFixed(1)} km</span>` : ''}
              <span class="tech-zone"><i class="fas fa-map-marker-alt"></i> ${t.zonaCobertura || 'N/A'}</span>
            </div>
            <button class="btn btn-primary btn-sm tech-request-btn" data-id="${t._id || t.id}" ${!t.disponible ? 'disabled' : ''}>
              <i class="fas fa-paper-plane"></i> Solicitar Servicio
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) stars += '<i class="fas fa-star star-filled"></i>';
      else if (rating >= i - 0.5) stars += '<i class="fas fa-star-half-alt star-filled"></i>';
      else stars += '<i class="far fa-star star-empty"></i>';
    }
    return `<span class="stars">${stars}</span>`;
  }

  // ── Events ─────────────────────────────────────────────────

  function initEvents() {
    document.addEventListener('click', (e) => {
      const reqBtn = e.target.closest('.tech-request-btn');
      if (reqBtn) {
        if (!auth.isLoggedIn()) {
          window.toast('Inicia sesión para solicitar un servicio', 'warning');
          location.hash = '#login';
          return;
        }
        const techId = reqBtn.dataset.id;
        location.hash = `#booking?technician=${techId}`;
      }
    });
  }

  return { render, loadTechnicians, initEvents, renderStars };
})();
