/* ═══════════════════════════════════════════════════════════
   dashboard.js — Role-based Dashboards for H&M Servicios
   ═══════════════════════════════════════════════════════════ */

const dashboard = (() => {

  // ═══════════════════════════════════════════════════════════
  //  CLIENT DASHBOARD
  // ═══════════════════════════════════════════════════════════

  function renderClientDashboard() {
    const user = auth.getUser() || {};
    return `
      <section class="page-section dashboard-page">
        <div class="container">
          <div class="dashboard-header animate-on-scroll">
            <div>
              <h2><i class="fas fa-hand-wave"></i> ¡Hola, ${user.nombre || user.name || 'Cliente'}!</h2>
              <p>Gestiona tus solicitudes de servicio desde aquí.</p>
            </div>
          </div>

          <!-- Stats -->
          <div class="stats-grid animate-on-scroll">
            <div class="stat-card glass-card">
              <div class="stat-icon" style="background:linear-gradient(135deg,hsl(220,90%,56%),hsl(240,80%,60%))"><i class="fas fa-clipboard-list"></i></div>
              <div class="stat-info"><span class="stat-value" id="clientActiveCount">-</span><span class="stat-label">Activos</span></div>
            </div>
            <div class="stat-card glass-card">
              <div class="stat-icon" style="background:linear-gradient(135deg,hsl(160,84%,44%),hsl(140,70%,40%))"><i class="fas fa-check-double"></i></div>
              <div class="stat-info"><span class="stat-value" id="clientCompletedCount">-</span><span class="stat-label">Completados</span></div>
            </div>
            <div class="stat-card glass-card">
              <div class="stat-icon" style="background:linear-gradient(135deg,hsl(36,100%,56%),hsl(30,90%,50%))"><i class="fas fa-star"></i></div>
              <div class="stat-info"><span class="stat-value" id="clientAvgRating">-</span><span class="stat-label">Calificación</span></div>
            </div>
          </div>

          <!-- Active Requests -->
          <div class="dashboard-section glass-card animate-on-scroll">
            <h3><i class="fas fa-bolt"></i> Solicitudes Activas</h3>
            <div id="clientActiveRequests" class="request-list">
              <div class="loading-spinner"><i class="fas fa-circle-notch fa-spin"></i> Cargando…</div>
            </div>
          </div>

          <!-- History -->
          <div class="dashboard-section glass-card animate-on-scroll">
            <h3><i class="fas fa-history"></i> Historial de Servicios</h3>
            <div id="clientHistory" class="request-list">
              <div class="loading-spinner"><i class="fas fa-circle-notch fa-spin"></i> Cargando…</div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async function loadClientDashboard() {
    try {
      const data = await api.get('/service-requests/my');
      const requests = Array.isArray(data) ? data : (data.requests || data.solicitudes || []);

      const active = requests.filter(r => ['pendiente','aceptada','en_progreso'].includes(r.estado));
      const completed = requests.filter(r => r.estado === 'completada');

      document.getElementById('clientActiveCount').textContent = active.length;
      document.getElementById('clientCompletedCount').textContent = completed.length;
      document.getElementById('clientAvgRating').textContent = '—';

      renderRequestList('clientActiveRequests', active, true);
      renderRequestList('clientHistory', completed, false);
    } catch {
      document.getElementById('clientActiveRequests').innerHTML = '<p class="empty-state"><i class="fas fa-inbox"></i> No tienes solicitudes activas</p>';
      document.getElementById('clientHistory').innerHTML = '<p class="empty-state"><i class="fas fa-inbox"></i> Aún no tienes servicios completados</p>';
      document.getElementById('clientActiveCount').textContent = '0';
      document.getElementById('clientCompletedCount').textContent = '0';
      document.getElementById('clientAvgRating').textContent = '—';
    }
  }

  function renderRequestList(containerId, requests, showCancel) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (requests.length === 0) {
      container.innerHTML = '<p class="empty-state"><i class="fas fa-inbox"></i> Sin solicitudes</p>';
      return;
    }

    container.innerHTML = requests.map(r => `
      <div class="request-item">
        <div class="request-status">
          <span class="status-badge status-${r.estado}">${statusLabel(r.estado)}</span>
        </div>
        <div class="request-details">
          <strong>${r.servicio?.nombre || r.servicioNombre || 'Servicio'}</strong>
          <span class="request-date"><i class="fas fa-calendar"></i> ${new Date(r.createdAt || r.fecha).toLocaleDateString('es-CO')}</span>
          ${r.tecnico?.nombre ? `<span class="request-tech"><i class="fas fa-user-hard-hat"></i> ${r.tecnico.nombre}</span>` : ''}
        </div>
        <div class="request-actions">
          ${showCancel && r.estado === 'pendiente' ? `<button class="btn btn-danger btn-sm cancel-request-btn" data-id="${r._id || r.id}"><i class="fas fa-times"></i> Cancelar</button>` : ''}
          ${r.estado === 'completada' && !r.calificada ? `<button class="btn btn-accent btn-sm rate-btn" data-id="${r._id || r.id}"><i class="fas fa-star"></i> Calificar</button>` : ''}
          ${r.estado === 'completada' && !r.pagada ? `<button class="btn btn-primary btn-sm pay-request-btn" data-id="${r._id || r.id}" data-amount="${r.precio || r.monto || 0}"><i class="fas fa-credit-card"></i> Pagar</button>` : ''}
        </div>
      </div>
    `).join('');
  }


  // ═══════════════════════════════════════════════════════════
  //  TECHNICIAN DASHBOARD
  // ═══════════════════════════════════════════════════════════

  function renderTechDashboard() {
    const user = auth.getUser() || {};
    return `
      <section class="page-section dashboard-page">
        <div class="container">
          <div class="dashboard-header animate-on-scroll">
            <div>
              <h2><i class="fas fa-hard-hat"></i> Panel de Técnico</h2>
              <p>Bienvenido, ${user.nombre || user.name || 'Técnico'}. Gestiona tus servicios.</p>
            </div>
            <div class="header-actions">
              <label class="toggle-switch">
                <input type="checkbox" id="availabilityToggle" checked />
                <span class="toggle-slider"></span>
                <span class="toggle-label">Disponible</span>
              </label>
            </div>
          </div>

          <!-- Earnings -->
          <div class="stats-grid animate-on-scroll">
            <div class="stat-card glass-card">
              <div class="stat-icon" style="background:linear-gradient(135deg,hsl(160,84%,44%),hsl(140,70%,40%))"><i class="fas fa-wallet"></i></div>
              <div class="stat-info"><span class="stat-value" id="techMonthEarnings">$0</span><span class="stat-label">Este Mes</span></div>
            </div>
            <div class="stat-card glass-card">
              <div class="stat-icon" style="background:linear-gradient(135deg,hsl(220,90%,56%),hsl(240,80%,60%))"><i class="fas fa-coins"></i></div>
              <div class="stat-info"><span class="stat-value" id="techTotalEarnings">$0</span><span class="stat-label">Total Ganado</span></div>
            </div>
            <div class="stat-card glass-card">
              <div class="stat-icon" style="background:linear-gradient(135deg,hsl(36,100%,56%),hsl(30,90%,50%))"><i class="fas fa-clipboard-check"></i></div>
              <div class="stat-info"><span class="stat-value" id="techJobsCount">0</span><span class="stat-label">Servicios</span></div>
            </div>
            <div class="stat-card glass-card">
              <div class="stat-icon" style="background:linear-gradient(135deg,hsl(280,80%,55%),hsl(300,70%,50%))"><i class="fas fa-star"></i></div>
              <div class="stat-info"><span class="stat-value" id="techRating">-</span><span class="stat-label">Calificación</span></div>
            </div>
          </div>

          <!-- Pending Requests -->
          <div class="dashboard-section glass-card animate-on-scroll">
            <h3><i class="fas fa-bell"></i> Solicitudes Pendientes</h3>
            <div id="techPendingRequests" class="request-list">
              <div class="loading-spinner"><i class="fas fa-circle-notch fa-spin"></i> Cargando…</div>
            </div>
          </div>

          <!-- Active Jobs -->
          <div class="dashboard-section glass-card animate-on-scroll">
            <h3><i class="fas fa-tools"></i> Trabajos Activos</h3>
            <div id="techActiveJobs" class="request-list">
              <div class="loading-spinner"><i class="fas fa-circle-notch fa-spin"></i> Cargando…</div>
            </div>
          </div>

          <!-- Completed -->
          <div class="dashboard-section glass-card animate-on-scroll">
            <h3><i class="fas fa-check-double"></i> Historial Completado</h3>
            <div id="techCompletedJobs" class="request-list">
              <div class="loading-spinner"><i class="fas fa-circle-notch fa-spin"></i> Cargando…</div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async function loadTechDashboard() {
    try {
      const data = await api.get('/service-requests/technician');
      const requests = Array.isArray(data) ? data : (data.requests || data.solicitudes || []);

      const pending = requests.filter(r => r.estado === 'pendiente');
      const active = requests.filter(r => ['aceptada', 'en_progreso'].includes(r.estado));
      const completed = requests.filter(r => r.estado === 'completada');

      const totalEarnings = completed.reduce((s, r) => s + (r.precio || r.monto || 0), 0);
      const now = new Date();
      const monthEarnings = completed
        .filter(r => { const d = new Date(r.completadaEn || r.createdAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
        .reduce((s, r) => s + (r.precio || r.monto || 0), 0);

      document.getElementById('techMonthEarnings').textContent = `$${monthEarnings.toLocaleString('es-CO')}`;
      document.getElementById('techTotalEarnings').textContent = `$${totalEarnings.toLocaleString('es-CO')}`;
      document.getElementById('techJobsCount').textContent = completed.length;
      document.getElementById('techRating').textContent = '—';

      renderTechRequestList('techPendingRequests', pending, 'pending');
      renderTechRequestList('techActiveJobs', active, 'active');
      renderTechRequestList('techCompletedJobs', completed, 'completed');
    } catch {
      ['techPendingRequests','techActiveJobs','techCompletedJobs'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '<p class="empty-state"><i class="fas fa-inbox"></i> Sin solicitudes</p>';
      });
    }

    // Availability toggle
    const toggle = document.getElementById('availabilityToggle');
    if (toggle) {
      toggle.addEventListener('change', async () => {
        try {
          await api.patch('/technicians/availability', { disponible: toggle.checked });
          window.toast(toggle.checked ? 'Estás disponible' : 'Estás como no disponible', 'info');
        } catch { window.toast('Error al actualizar disponibilidad', 'error'); }
      });
    }
  }

  function renderTechRequestList(containerId, requests, type) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (requests.length === 0) {
      container.innerHTML = '<p class="empty-state"><i class="fas fa-inbox"></i> Sin solicitudes</p>';
      return;
    }

    container.innerHTML = requests.map(r => `
      <div class="request-item">
        <div class="request-status">
          <span class="status-badge status-${r.estado}">${statusLabel(r.estado)}</span>
        </div>
        <div class="request-details">
          <strong>${r.servicio?.nombre || r.servicioNombre || 'Servicio'}</strong>
          <span class="request-date"><i class="fas fa-calendar"></i> ${new Date(r.createdAt || r.fecha).toLocaleDateString('es-CO')}</span>
          ${r.cliente?.nombre ? `<span class="request-client"><i class="fas fa-user"></i> ${r.cliente.nombre}</span>` : ''}
        </div>
        <div class="request-actions">
          ${type === 'pending' ? `
            <button class="btn btn-primary btn-sm accept-btn" data-id="${r._id || r.id}"><i class="fas fa-check"></i> Aceptar</button>
            <button class="btn btn-danger btn-sm reject-btn" data-id="${r._id || r.id}"><i class="fas fa-times"></i> Rechazar</button>
          ` : ''}
          ${type === 'active' ? `
            <button class="btn btn-primary btn-sm complete-btn" data-id="${r._id || r.id}"><i class="fas fa-check-double"></i> Completar</button>
          ` : ''}
        </div>
      </div>
    `).join('');
  }


  // ═══════════════════════════════════════════════════════════
  //  ADMIN DASHBOARD
  // ═══════════════════════════════════════════════════════════

  function renderAdminDashboard() {
    return `
      <section class="page-section dashboard-page admin-dashboard">
        <div class="container">
          <div class="dashboard-header animate-on-scroll">
            <div>
              <h2><i class="fas fa-chart-line"></i> Panel de Administración</h2>
              <p>Visión general de la plataforma H&M Servicios.</p>
            </div>
          </div>

          <!-- Stats -->
          <div class="stats-grid stats-grid-4 animate-on-scroll">
            <div class="stat-card glass-card">
              <div class="stat-icon" style="background:linear-gradient(135deg,hsl(220,90%,56%),hsl(240,80%,60%))"><i class="fas fa-users"></i></div>
              <div class="stat-info"><span class="stat-value" id="adminTotalUsers">-</span><span class="stat-label">Usuarios</span></div>
            </div>
            <div class="stat-card glass-card">
              <div class="stat-icon" style="background:linear-gradient(135deg,hsl(160,84%,44%),hsl(140,70%,40%))"><i class="fas fa-hard-hat"></i></div>
              <div class="stat-info"><span class="stat-value" id="adminActiveTechs">-</span><span class="stat-label">Técnicos Activos</span></div>
            </div>
            <div class="stat-card glass-card">
              <div class="stat-icon" style="background:linear-gradient(135deg,hsl(36,100%,56%),hsl(30,90%,50%))"><i class="fas fa-calendar-day"></i></div>
              <div class="stat-info"><span class="stat-value" id="adminTodayServices">-</span><span class="stat-label">Servicios Hoy</span></div>
            </div>
            <div class="stat-card glass-card">
              <div class="stat-icon" style="background:linear-gradient(135deg,hsl(280,80%,55%),hsl(300,70%,50%))"><i class="fas fa-dollar-sign"></i></div>
              <div class="stat-info"><span class="stat-value" id="adminMonthlyRevenue">-</span><span class="stat-label">Ingresos del Mes</span></div>
            </div>
          </div>

          <!-- Revenue Chart -->
          <div class="dashboard-section glass-card animate-on-scroll">
            <h3><i class="fas fa-chart-bar"></i> Ingresos por Mes</h3>
            <div class="bar-chart" id="revenueChart"></div>
          </div>

          <!-- Recent Requests -->
          <div class="dashboard-section glass-card animate-on-scroll">
            <h3><i class="fas fa-clipboard-list"></i> Solicitudes Recientes</h3>
            <div class="table-responsive">
              <table class="data-table" id="adminRequestsTable">
                <thead>
                  <tr>
                    <th>ID</th><th>Servicio</th><th>Cliente</th><th>Técnico</th><th>Estado</th><th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td colspan="6" class="loading-spinner"><i class="fas fa-circle-notch fa-spin"></i> Cargando…</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- User Management -->
          <div class="dashboard-section glass-card animate-on-scroll">
            <h3><i class="fas fa-users-cog"></i> Gestión de Usuarios</h3>
            <div class="table-responsive">
              <table class="data-table" id="adminUsersTable">
                <thead>
                  <tr>
                    <th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td colspan="5" class="loading-spinner"><i class="fas fa-circle-notch fa-spin"></i> Cargando…</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async function loadAdminDashboard() {
    // Stats
    try {
      const stats = await api.get('/admin/stats');
      document.getElementById('adminTotalUsers').textContent = stats.totalUsers ?? stats.totalUsuarios ?? '-';
      document.getElementById('adminActiveTechs').textContent = stats.activeTechnicians ?? stats.tecnicosActivos ?? '-';
      document.getElementById('adminTodayServices').textContent = stats.todayServices ?? stats.serviciosHoy ?? '-';
      document.getElementById('adminMonthlyRevenue').textContent = `$${(stats.monthlyRevenue ?? stats.ingresosMes ?? 0).toLocaleString('es-CO')}`;

      renderRevenueChart(stats.revenueByMonth || stats.ingresosPorMes || null);
    } catch {
      ['adminTotalUsers','adminActiveTechs','adminTodayServices'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = '-'; });
      document.getElementById('adminMonthlyRevenue').textContent = '$0';
      renderRevenueChart(null);
    }

    // Requests table
    try {
      const data = await api.get('/service-requests?limit=20');
      const requests = Array.isArray(data) ? data : (data.requests || data.solicitudes || []);
      const tbody = document.querySelector('#adminRequestsTable tbody');
      if (tbody) {
        tbody.innerHTML = requests.length ? requests.map(r => `
          <tr>
            <td class="mono">${(r._id || r.id || '').slice(-6)}</td>
            <td>${r.servicio?.nombre || r.servicioNombre || '-'}</td>
            <td>${r.cliente?.nombre || r.clienteNombre || '-'}</td>
            <td>${r.tecnico?.nombre || r.tecnicoNombre || '-'}</td>
            <td><span class="status-badge status-${r.estado}">${statusLabel(r.estado)}</span></td>
            <td>${new Date(r.createdAt || r.fecha).toLocaleDateString('es-CO')}</td>
          </tr>
        `).join('') : '<tr><td colspan="6" class="empty-state">Sin solicitudes</td></tr>';
      }
    } catch {
      const tbody = document.querySelector('#adminRequestsTable tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Error cargando solicitudes</td></tr>';
    }

    // Users table
    try {
      const data = await api.get('/admin/users');
      const users = Array.isArray(data) ? data : (data.users || data.usuarios || []);
      const tbody = document.querySelector('#adminUsersTable tbody');
      if (tbody) {
        tbody.innerHTML = users.length ? users.map(u => `
          <tr>
            <td>${u.nombre || u.name}</td>
            <td class="mono">${u.email}</td>
            <td><span class="role-badge role-${u.rol || u.role}">${u.rol || u.role}</span></td>
            <td><span class="status-badge status-${u.activo || u.active ? 'activo' : 'inactivo'}">${u.activo || u.active ? 'Activo' : 'Inactivo'}</span></td>
            <td>
              <button class="btn btn-ghost btn-sm toggle-user-btn" data-id="${u._id || u.id}" data-active="${u.activo ?? u.active ?? true}">
                <i class="fas ${u.activo || u.active ? 'fa-ban' : 'fa-check'}"></i>
                ${u.activo || u.active ? 'Desactivar' : 'Activar'}
              </button>
            </td>
          </tr>
        `).join('') : '<tr><td colspan="5" class="empty-state">Sin usuarios</td></tr>';
      }
    } catch {
      const tbody = document.querySelector('#adminUsersTable tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Error cargando usuarios</td></tr>';
    }
  }

  function renderRevenueChart(data) {
    const chart = document.getElementById('revenueChart');
    if (!chart) return;

    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    // Use sample data if none provided
    const values = data || [1200000, 1800000, 2200000, 1900000, 2800000, 3100000, 2600000, 3400000, 2900000, 3800000, 4200000, 3600000];
    const max = Math.max(...values, 1);

    chart.innerHTML = values.map((v, i) => `
      <div class="bar-col">
        <div class="bar-value">$${(v/1000000).toFixed(1)}M</div>
        <div class="bar" style="height:${(v/max)*100}%"></div>
        <div class="bar-label">${months[i]}</div>
      </div>
    `).join('');
  }


  // ═══════════════════════════════════════════════════════════
  //  BOOKING PAGE
  // ═══════════════════════════════════════════════════════════

  function renderBooking(params) {
    return `
      <section class="page-section booking-page">
        <div class="container container-sm">
          <div class="glass-card booking-card animate-on-scroll">
            <div class="auth-header">
              <div class="auth-icon"><i class="fas fa-calendar-check"></i></div>
              <h2>Solicitar Servicio</h2>
              <p>Completa los detalles para tu solicitud</p>
            </div>

            <form id="bookingForm" class="auth-form" novalidate>
              <div class="form-group">
                <div class="input-wrapper">
                  <i class="fas fa-tools input-icon"></i>
                  <select id="bookService" required>
                    <option value="">Selecciona un servicio</option>
                  </select>
                  <label for="bookService" class="select-label">Servicio</label>
                </div>
              </div>
              <div class="form-group">
                <div class="input-wrapper">
                  <i class="fas fa-calendar input-icon"></i>
                  <input type="date" id="bookDate" required min="${new Date().toISOString().split('T')[0]}" />
                  <label for="bookDate" class="date-label">Fecha preferida</label>
                </div>
              </div>
              <div class="form-group">
                <div class="input-wrapper">
                  <i class="fas fa-clock input-icon"></i>
                  <select id="bookTime" required>
                    <option value="">Franja horaria</option>
                    <option value="08:00-10:00">08:00 – 10:00</option>
                    <option value="10:00-12:00">10:00 – 12:00</option>
                    <option value="14:00-16:00">14:00 – 16:00</option>
                    <option value="16:00-18:00">16:00 – 18:00</option>
                  </select>
                  <label for="bookTime" class="select-label">Horario</label>
                </div>
              </div>
              <div class="form-group">
                <div class="input-wrapper">
                  <i class="fas fa-map-marker-alt input-icon"></i>
                  <input type="text" id="bookAddress" placeholder=" " required />
                  <label for="bookAddress">Dirección completa</label>
                </div>
              </div>
              <div class="form-group">
                <div class="input-wrapper">
                  <i class="fas fa-comment input-icon"></i>
                  <textarea id="bookNotes" placeholder=" " rows="3"></textarea>
                  <label for="bookNotes">Notas adicionales</label>
                </div>
              </div>
              <button type="submit" class="btn btn-primary btn-block">
                <span class="btn-text"><i class="fas fa-paper-plane"></i> Enviar Solicitud</span>
                <span class="btn-loader" style="display:none;"><i class="fas fa-spinner fa-spin"></i></span>
              </button>
            </form>
          </div>
        </div>
      </section>
    `;
  }

  async function initBooking(params) {
    const select = document.getElementById('bookService');
    if (!select) return;

    // Populate services
    try {
      const data = await api.get('/services');
      const svcs = Array.isArray(data) ? data : (data.services || data.servicios || []);
      svcs.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s._id || s.id;
        opt.textContent = `${s.nombre} — $${(s.precio||0).toLocaleString('es-CO')} COP`;
        select.appendChild(opt);
      });
    } catch { /* fallback already in the select */ }

    // Pre-select service from params
    if (params.service) select.value = params.service;

    // Form submit
    const form = document.getElementById('bookingForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        const payload = {
          servicio: document.getElementById('bookService').value,
          fecha: document.getElementById('bookDate').value,
          franja: document.getElementById('bookTime').value,
          direccion: document.getElementById('bookAddress').value,
          notas: document.getElementById('bookNotes').value
        };
        if (params.technician) payload.tecnico = params.technician;

        if (!payload.servicio || !payload.fecha || !payload.franja || !payload.direccion) {
          window.toast('Por favor completa todos los campos obligatorios', 'warning');
          return;
        }

        auth.toggleBtnLoading(btn, true);
        try {
          await api.post('/service-requests', payload);
          window.toast('¡Solicitud enviada exitosamente!', 'success');
          location.hash = '#client-dashboard';
        } catch (err) {
          window.toast(err.message || 'Error al enviar la solicitud', 'error');
        } finally {
          auth.toggleBtnLoading(btn, false);
        }
      });
    }
  }


  // ═══════════════════════════════════════════════════════════
  //  SHARED EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════

  function initDashboardEvents() {
    document.addEventListener('click', async (e) => {
      // Cancel request
      const cancelBtn = e.target.closest('.cancel-request-btn');
      if (cancelBtn) {
        if (!confirm('¿Deseas cancelar esta solicitud?')) return;
        try {
          await api.patch(`/service-requests/${cancelBtn.dataset.id}`, { estado: 'cancelada' });
          window.toast('Solicitud cancelada', 'info');
          loadClientDashboard();
        } catch (err) { window.toast(err.message || 'Error', 'error'); }
      }

      // Accept request (tech)
      const acceptBtn = e.target.closest('.accept-btn');
      if (acceptBtn) {
        try {
          await api.patch(`/service-requests/${acceptBtn.dataset.id}`, { estado: 'aceptada' });
          window.toast('Solicitud aceptada', 'success');
          loadTechDashboard();
        } catch (err) { window.toast(err.message || 'Error', 'error'); }
      }

      // Reject request (tech)
      const rejectBtn = e.target.closest('.reject-btn');
      if (rejectBtn) {
        try {
          await api.patch(`/service-requests/${rejectBtn.dataset.id}`, { estado: 'rechazada' });
          window.toast('Solicitud rechazada', 'info');
          loadTechDashboard();
        } catch (err) { window.toast(err.message || 'Error', 'error'); }
      }

      // Complete (tech)
      const completeBtn = e.target.closest('.complete-btn');
      if (completeBtn) {
        try {
          await api.patch(`/service-requests/${completeBtn.dataset.id}`, { estado: 'completada' });
          window.toast('¡Servicio completado!', 'success');
          loadTechDashboard();
        } catch (err) { window.toast(err.message || 'Error', 'error'); }
      }

      // Toggle user active (admin)
      const toggleUserBtn = e.target.closest('.toggle-user-btn');
      if (toggleUserBtn) {
        const isActive = toggleUserBtn.dataset.active === 'true';
        try {
          await api.patch(`/admin/users/${toggleUserBtn.dataset.id}`, { activo: !isActive });
          window.toast(isActive ? 'Usuario desactivado' : 'Usuario activado', 'info');
          loadAdminDashboard();
        } catch (err) { window.toast(err.message || 'Error', 'error'); }
      }

      // Rate service
      const rateBtn = e.target.closest('.rate-btn');
      if (rateBtn) {
        showRatingModal(rateBtn.dataset.id);
      }

      // Pay for a service
      const payBtn = e.target.closest('.pay-request-btn');
      if (payBtn) {
        location.hash = `#payment?amount=${payBtn.dataset.amount}&request=${payBtn.dataset.id}`;
      }
    });
  }

  function showRatingModal(requestId) {
    const html = `
      <div class="rating-modal">
        <h3><i class="fas fa-star"></i> Calificar Servicio</h3>
        <div class="star-rating" id="starRating">
          ${[1,2,3,4,5].map(i => `<i class="far fa-star" data-value="${i}"></i>`).join('')}
        </div>
        <textarea id="ratingComment" placeholder="Escribe un comentario (opcional)" rows="3" class="rating-textarea"></textarea>
        <button class="btn btn-primary btn-block" id="submitRating" data-id="${requestId}">Enviar Calificación</button>
      </div>
    `;
    window.openModal(html);

    // Star click
    setTimeout(() => {
      let selected = 0;
      document.querySelectorAll('#starRating i').forEach(star => {
        star.addEventListener('click', () => {
          selected = Number(star.dataset.value);
          document.querySelectorAll('#starRating i').forEach((s, idx) => {
            s.className = idx < selected ? 'fas fa-star star-filled' : 'far fa-star star-empty';
          });
        });
        star.addEventListener('mouseenter', () => {
          const val = Number(star.dataset.value);
          document.querySelectorAll('#starRating i').forEach((s, idx) => {
            s.className = idx < val ? 'fas fa-star star-filled' : 'far fa-star star-empty';
          });
        });
      });
      document.getElementById('starRating').addEventListener('mouseleave', () => {
        document.querySelectorAll('#starRating i').forEach((s, idx) => {
          s.className = idx < selected ? 'fas fa-star star-filled' : 'far fa-star star-empty';
        });
      });

      document.getElementById('submitRating').addEventListener('click', async () => {
        if (selected === 0) { window.toast('Selecciona una calificación', 'warning'); return; }
        try {
          await api.post(`/service-requests/${requestId}/rate`, {
            rating: selected,
            comment: document.getElementById('ratingComment').value
          });
          window.toast('¡Gracias por tu calificación!', 'success');
          window.closeModal();
          loadClientDashboard();
        } catch (err) { window.toast(err.message || 'Error', 'error'); }
      });
    }, 100);
  }


  // ═══════════════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════════════

  function statusLabel(status) {
    const map = {
      pendiente: 'Pendiente',
      aceptada: 'Aceptada',
      en_progreso: 'En Progreso',
      completada: 'Completada',
      cancelada: 'Cancelada',
      rechazada: 'Rechazada',
      activo: 'Activo',
      inactivo: 'Inactivo'
    };
    return map[status] || status;
  }


  return {
    renderClientDashboard, loadClientDashboard,
    renderTechDashboard, loadTechDashboard,
    renderAdminDashboard, loadAdminDashboard,
    renderBooking, initBooking,
    initDashboardEvents, statusLabel
  };
})();
