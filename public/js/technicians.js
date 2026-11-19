/* ═══════════════════════════════════════════════════════════
   technicians.js — Technician Search for H&M Servicios
   ═══════════════════════════════════════════════════════════ */

const technicians = (() => {

  // Mismos nombres de campo que usa la API real (name, rating_avg,
  // total_services, distance_km, is_available, coverage_radius_km,
  // description, specialties) para que renderGrid no tenga que distinguir
  // entre datos reales y datos de respaldo.
  const fallbackTechnicians = [
    { id:'t1', name:'Carlos Rodríguez', email:'carlos@hm.com', phone:'3001234567', specialties:['Estufas','Calentadores','Hornos'], rating_avg:4.8, total_services:127, distance_km:1.2, is_available:true, coverage_radius_km:10, description:'Técnico certificado con 10 años de experiencia en gasodomésticos.' },
    { id:'t2', name:'María González', email:'maria@hm.com', phone:'3109876543', specialties:['Plomería','Enchapes','Drywall'], rating_avg:4.9, total_services:98, distance_km:2.5, is_available:true, coverage_radius_km:15, description:'Especialista en obra civil y acabados de alta calidad.' },
    { id:'t3', name:'Andrés López', email:'andres@hm.com', phone:'3201112233', specialties:['Redes de Gas','Detección de Fugas'], rating_avg:4.7, total_services:85, distance_km:3.1, is_available:false, coverage_radius_km:12, description:'Ingeniero de gas con certificación clase A.' },
    { id:'t4', name:'Laura Martínez', email:'laura@hm.com', phone:'3154445566', specialties:['Pintura','Remodelación','Acabados'], rating_avg:4.6, total_services:64, distance_km:4.8, is_available:true, coverage_radius_km:18, description:'Diseñadora de interiores y experta en remodelaciones.' },
    { id:'t5', name:'Pedro Sánchez', email:'pedro@hm.com', phone:'3187778899', specialties:['Calentadores','Estufas','Redes de Gas'], rating_avg:4.5, total_services:112, distance_km:5.3, is_available:true, coverage_radius_km:20, description:'Más de 15 años de experiencia en instalación y mantenimiento de gasodomésticos.' },
    { id:'t6', name:'Ana Ramírez', email:'ana@hm.com', phone:'3002223344', specialties:['Plomería','Pintura','Enchapes'], rating_avg:4.9, total_services:73, distance_km:6.0, is_available:true, coverage_radius_km:14, description:'Profesional multidisciplinaria en servicios de obra civil.' }
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

    // La API real (technicians.controller.js / findNearbyTechnicians) usa
    // name, rating_avg, is_available, description, specialties, distance_km
    // y coverage_radius_km — nunca nombre/rating/disponible/descripcion/
    // especialidades/distancia/zonaCobertura. Con esos nombres antiguos
    // cada tarjeta de técnico salía con el nombre vacío, 0 estrellas y
    // "Ocupado" siempre (t.disponible undefined es falsy), así que ningún
    // técnico parecía disponible para solicitarle un servicio. No hay una
    // columna de "zona" como texto, solo un radio de cobertura en km.
    grid.innerHTML = techList.map((t, i) => {
      const name = t.name || 'Técnico';
      const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
      const hue = (name.charCodeAt(0) * 37) % 360;
      const available = !!t.is_available;
      return `
        <div class="tech-card glass-card animate-on-scroll" style="animation-delay:${i * 0.08}s" data-id="${t.id}">
          <div class="tech-card-header">
            <div class="tech-avatar" style="background:hsl(${hue},70%,45%)">
              <span>${initials}</span>
            </div>
            <div class="tech-info">
              <h3 class="tech-name">${name}</h3>
              <div class="tech-rating">
                ${renderStars(t.rating_avg || 0)}
                <span class="rating-value">${(t.rating_avg || 0).toFixed(1)}</span>
                <span class="rating-count">(${t.total_services || 0} servicios)</span>
              </div>
            </div>
            <span class="availability-badge ${available ? 'available' : 'unavailable'}">
              <i class="fas ${available ? 'fa-check-circle' : 'fa-clock'}"></i>
              ${available ? 'Disponible' : 'Ocupado'}
            </span>
          </div>

          <p class="tech-description">${t.description || ''}</p>

          <div class="tech-specialties">
            ${(t.specialties || []).map(s => `<span class="specialty-tag">${s}</span>`).join('')}
          </div>

          <div class="tech-card-footer">
            <div class="tech-meta">
              ${t.distance_km != null ? `<span class="tech-distance"><i class="fas fa-route"></i> ${t.distance_km.toFixed(1)} km</span>` : ''}
              <span class="tech-zone"><i class="fas fa-map-marker-alt"></i> ${t.coverage_radius_km ? `Cobertura ${t.coverage_radius_km} km` : 'N/A'}</span>
            </div>
            <button class="btn btn-primary btn-sm tech-request-btn" data-id="${t.id}" ${!available ? 'disabled' : ''}>
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
