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

  // Secciones de la barra lateral de administración. 'id' es el sufijo usado
  // en los contenedores (#admin-section-<id>) y en el atributo data-section
  // de cada botón de la barra.
  const ADMIN_SECTIONS = [
    { id: 'resumen',     label: 'Resumen',       icon: 'fa-chart-line' },
    { id: 'usuarios',    label: 'Usuarios',      icon: 'fa-users-cog' },
    { id: 'tecnicos',    label: 'Técnicos',      icon: 'fa-hard-hat' },
    { id: 'solicitudes', label: 'Solicitudes',   icon: 'fa-clipboard-list' },
    { id: 'pagos',       label: 'Pagos',         icon: 'fa-money-check-alt' },
    { id: 'ingresos',    label: 'Ingresos',      icon: 'fa-dollar-sign' }
  ];

  function renderAdminDashboard() {
    return `
      <section class="page-section dashboard-page admin-dashboard">
        <div class="container admin-layout">
          <!-- Barra lateral de administración -->
          <aside class="admin-sidebar glass-card">
            <div class="admin-sidebar-title"><i class="fas fa-user-shield"></i> Administración</div>
            <nav class="admin-sidebar-nav">
              ${ADMIN_SECTIONS.map((s, i) => `
                <button class="admin-sidebar-link${i === 0 ? ' active' : ''}" data-section="${s.id}">
                  <i class="fas ${s.icon}"></i> ${s.label}
                </button>
              `).join('')}
            </nav>
          </aside>

          <div class="admin-content">
            <div class="dashboard-header animate-on-scroll">
              <div>
                <h2><i class="fas fa-chart-line"></i> Panel de Administración</h2>
                <p>Visión general de la plataforma H&M Servicios.</p>
              </div>
            </div>

            <!-- Resumen -->
            <div class="admin-section" id="admin-section-resumen">
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
                  <div class="stat-icon" style="background:linear-gradient(135deg,hsl(280,80%,55%),hsl(300,70%,50%))"><i class="fas fa-dollar-sign"></i></div>
                  <div class="stat-info"><span class="stat-value" id="adminTotalRevenue">-</span><span class="stat-label">Ingresos (comisión)</span></div>
                </div>
              </div>

              <div class="dashboard-section glass-card animate-on-scroll">
                <h3><i class="fas fa-chart-bar"></i> Ingresos por Mes (comisión de la empresa)</h3>
                <div class="bar-chart" id="revenueChart"></div>
              </div>

              <div class="dashboard-section glass-card animate-on-scroll">
                <h3><i class="fas fa-clipboard-list"></i> Solicitudes Recientes</h3>
                <div class="table-responsive">
                  <table class="data-table" id="adminRecentRequestsTable">
                    <thead><tr><th>ID</th><th>Servicio</th><th>Cliente</th><th>Técnico</th><th>Estado</th><th>Fecha</th></tr></thead>
                    <tbody><tr><td colspan="6" class="loading-spinner"><i class="fas fa-circle-notch fa-spin"></i> Cargando…</td></tr></tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Usuarios -->
            <div class="admin-section" id="admin-section-usuarios" style="display:none;">
              <div class="dashboard-section glass-card animate-on-scroll">
                <h3><i class="fas fa-user-plus"></i> Crear Administrador</h3>
                <p class="admin-hint">Crea aquí una nueva cuenta de administrador, técnico o cliente. Es la única forma de dar acceso de administrador a alguien, además del script <code>scripts/create-admin.js</code>.</p>
                <form id="createUserForm" class="auth-form admin-create-form" novalidate>
                  <div class="form-row">
                    <div class="form-group">
                      <div class="input-wrapper">
                        <i class="fas fa-user input-icon"></i>
                        <input type="text" id="newUserName" placeholder=" " required />
                        <label for="newUserName">Nombre completo</label>
                      </div>
                    </div>
                    <div class="form-group">
                      <div class="input-wrapper">
                        <i class="fas fa-envelope input-icon"></i>
                        <input type="email" id="newUserEmail" placeholder=" " required />
                        <label for="newUserEmail">Correo electrónico</label>
                      </div>
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <div class="input-wrapper">
                        <i class="fas fa-lock input-icon"></i>
                        <input type="password" id="newUserPassword" placeholder=" " required minlength="6" />
                        <label for="newUserPassword">Contraseña (mín. 6 caracteres)</label>
                      </div>
                    </div>
                    <div class="form-group">
                      <div class="input-wrapper">
                        <i class="fas fa-user-tag input-icon"></i>
                        <select id="newUserRole" required>
                          <option value="admin">Administrador</option>
                          <option value="technician">Técnico</option>
                          <option value="client">Cliente</option>
                        </select>
                        <label for="newUserRole" class="select-label">Rol</label>
                      </div>
                    </div>
                  </div>
                  <button type="submit" class="btn btn-primary">
                    <span class="btn-text"><i class="fas fa-user-plus"></i> Crear usuario</span>
                    <span class="btn-loader" style="display:none;"><i class="fas fa-spinner fa-spin"></i></span>
                  </button>
                </form>
              </div>

              <div class="dashboard-section glass-card animate-on-scroll">
                <h3><i class="fas fa-users-cog"></i> Gestión de Usuarios</h3>
                <div class="table-responsive">
                  <table class="data-table" id="adminUsersTable">
                    <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th><th>Creado</th><th>Acciones</th></tr></thead>
                    <tbody><tr><td colspan="6" class="loading-spinner"><i class="fas fa-circle-notch fa-spin"></i> Cargando…</td></tr></tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Técnicos -->
            <div class="admin-section" id="admin-section-tecnicos" style="display:none;">
              <div class="dashboard-section glass-card animate-on-scroll">
                <h3><i class="fas fa-hard-hat"></i> Técnicos Registrados</h3>
                <div class="table-responsive">
                  <table class="data-table" id="adminTechsTable">
                    <thead><tr><th>Nombre</th><th>Email</th><th>Estado</th><th>Creado</th></tr></thead>
                    <tbody><tr><td colspan="4" class="loading-spinner"><i class="fas fa-circle-notch fa-spin"></i> Cargando…</td></tr></tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Solicitudes -->
            <div class="admin-section" id="admin-section-solicitudes" style="display:none;">
              <div class="dashboard-section glass-card animate-on-scroll">
                <h3><i class="fas fa-clipboard-list"></i> Todas las Solicitudes</h3>
                <div class="table-responsive">
                  <table class="data-table" id="adminAllRequestsTable">
                    <thead><tr><th>ID</th><th>Servicio</th><th>Cliente</th><th>Técnico</th><th>Estado</th><th>Precio</th><th>Fecha</th></tr></thead>
                    <tbody><tr><td colspan="7" class="loading-spinner"><i class="fas fa-circle-notch fa-spin"></i> Cargando…</td></tr></tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Pagos -->
            <div class="admin-section" id="admin-section-pagos" style="display:none;">
              <div class="dashboard-section glass-card animate-on-scroll">
                <h3><i class="fas fa-money-check-alt"></i> Pagos a Técnicos</h3>
                <div class="table-responsive">
                  <table class="data-table" id="adminPayoutsTable">
                    <thead><tr><th>Técnico</th><th>Monto</th><th>Periodo</th><th>Estado</th><th>Acciones</th></tr></thead>
                    <tbody><tr><td colspan="5" class="loading-spinner"><i class="fas fa-circle-notch fa-spin"></i> Cargando…</td></tr></tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Ingresos -->
            <div class="admin-section" id="admin-section-ingresos" style="display:none;">
              <div class="dashboard-section glass-card animate-on-scroll">
                <h3><i class="fas fa-chart-bar"></i> Ingresos por Mes (comisión de la empresa)</h3>
                <div class="bar-chart" id="revenueChartFull"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async function loadAdminDashboard() {
    // Resumen
    try {
      const stats = await api.get('/admin/dashboard');
      document.getElementById('adminTotalUsers').textContent = stats.totalUsers ?? '-';
      document.getElementById('adminActiveTechs').textContent = stats.activeTechs ?? '-';
      document.getElementById('adminTotalRevenue').textContent = `$${(stats.totalRevenue ?? 0).toLocaleString('es-CO')}`;
    } catch {
      ['adminTotalUsers','adminActiveTechs'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '-'; });
      const rev = document.getElementById('adminTotalRevenue'); if (rev) rev.textContent = '$0';
    }

    loadAdminRevenue();
    loadAdminRecentRequests();
    loadAdminUsers();
    loadAdminTechnicians();
    loadAdminAllRequests();
    loadAdminPayouts();
  }

  async function loadAdminRevenue() {
    try {
      const report = await api.get('/admin/revenue'); // [{month, revenue}, ...] más reciente primero
      const ordered = [...report].reverse();
      renderRevenueChart(ordered, 'revenueChart');
      renderRevenueChart(ordered, 'revenueChartFull');
    } catch {
      renderRevenueChart([], 'revenueChart');
      renderRevenueChart([], 'revenueChartFull');
    }
  }

  async function loadAdminRecentRequests() {
    const tbody = document.querySelector('#adminRecentRequestsTable tbody');
    if (!tbody) return;
    try {
      const requests = await api.get('/admin/requests');
      const recent = requests.slice(0, 10);
      tbody.innerHTML = recent.length ? recent.map(adminRequestRow).join('') : '<tr><td colspan="6" class="empty-state">Sin solicitudes</td></tr>';
    } catch {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Error cargando solicitudes</td></tr>';
    }
  }

  async function loadAdminAllRequests() {
    const tbody = document.querySelector('#adminAllRequestsTable tbody');
    if (!tbody) return;
    try {
      const requests = await api.get('/admin/requests');
      tbody.innerHTML = requests.length ? requests.map(r => `
        <tr>
          <td class="mono">#${r.id}</td>
          <td>${r.service_name || '-'}</td>
          <td>${r.client_name || '-'}</td>
          <td>${r.technician_name || '<span class="empty-state-inline">Sin asignar</span>'}</td>
          <td><span class="status-badge status-${r.status}">${statusLabel(r.status)}</span></td>
          <td>${r.agreed_price ? `$${Number(r.agreed_price).toLocaleString('es-CO')}` : '-'}</td>
          <td>${r.created_at ? new Date(r.created_at).toLocaleDateString('es-CO') : '-'}</td>
        </tr>
      `).join('') : '<tr><td colspan="7" class="empty-state">Sin solicitudes</td></tr>';
    } catch {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">Error cargando solicitudes</td></tr>';
    }
  }

  function adminRequestRow(r) {
    return `
      <tr>
        <td class="mono">#${r.id}</td>
        <td>${r.service_name || '-'}</td>
        <td>${r.client_name || '-'}</td>
        <td>${r.technician_name || '<span class="empty-state-inline">Sin asignar</span>'}</td>
        <td><span class="status-badge status-${r.status}">${statusLabel(r.status)}</span></td>
        <td>${r.created_at ? new Date(r.created_at).toLocaleDateString('es-CO') : '-'}</td>
      </tr>
    `;
  }

  async function loadAdminUsers() {
    const tbody = document.querySelector('#adminUsersTable tbody');
    if (!tbody) return;
    try {
      const users = await api.get('/admin/users');
      tbody.innerHTML = users.length ? users.map(u => `
        <tr>
          <td>${u.name}</td>
          <td class="mono">${u.email}</td>
          <td>
            <select class="role-select" data-id="${u.id}">
              ${['admin','technician','client'].map(r => `<option value="${r}" ${u.role === r ? 'selected' : ''}>${roleLabel(r)}</option>`).join('')}
            </select>
          </td>
          <td><span class="status-badge status-${u.is_active ? 'activo' : 'inactivo'}">${u.is_active ? 'Activo' : 'Inactivo'}</span></td>
          <td>${u.created_at ? new Date(u.created_at).toLocaleDateString('es-CO') : '-'}</td>
          <td>
            <button class="btn btn-ghost btn-sm toggle-user-btn" data-id="${u.id}" data-active="${!!u.is_active}">
              <i class="fas ${u.is_active ? 'fa-ban' : 'fa-check'}"></i>
              ${u.is_active ? 'Desactivar' : 'Activar'}
            </button>
          </td>
        </tr>
      `).join('') : '<tr><td colspan="6" class="empty-state">Sin usuarios</td></tr>';
    } catch {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Error cargando usuarios</td></tr>';
    }
  }

  async function loadAdminTechnicians() {
    const tbody = document.querySelector('#adminTechsTable tbody');
    if (!tbody) return;
    try {
      const users = await api.get('/admin/users');
      const techs = users.filter(u => u.role === 'technician');
      tbody.innerHTML = techs.length ? techs.map(u => `
        <tr>
          <td>${u.name}</td>
          <td class="mono">${u.email}</td>
          <td><span class="status-badge status-${u.is_active ? 'activo' : 'inactivo'}">${u.is_active ? 'Activo' : 'Inactivo'}</span></td>
          <td>${u.created_at ? new Date(u.created_at).toLocaleDateString('es-CO') : '-'}</td>
        </tr>
      `).join('') : '<tr><td colspan="4" class="empty-state">Sin técnicos registrados</td></tr>';
    } catch {
      tbody.innerHTML = '<tr><td colspan="4" class="empty-state">Error cargando técnicos</td></tr>';
    }
  }

  async function loadAdminPayouts() {
    const tbody = document.querySelector('#adminPayoutsTable tbody');
    if (!tbody) return;
    try {
      const payouts = await api.get('/admin/payouts');
      tbody.innerHTML = payouts.length ? payouts.map(p => `
        <tr>
          <td>${p.technician_name || '-'}</td>
          <td>$${Number(p.amount || 0).toLocaleString('es-CO')}</td>
          <td>${p.period || '-'}</td>
          <td><span class="status-badge status-${p.status}">${payoutStatusLabel(p.status)}</span></td>
          <td>
            ${p.status === 'pending' ? `<button class="btn btn-primary btn-sm process-payout-btn" data-id="${p.id}"><i class="fas fa-check"></i> Procesar</button>` : '-'}
          </td>
        </tr>
      `).join('') : '<tr><td colspan="5" class="empty-state">Sin pagos pendientes</td></tr>';
    } catch {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Error cargando pagos</td></tr>';
    }
  }

  function roleLabel(role) {
    return { admin: 'Administrador', technician: 'Técnico', client: 'Cliente' }[role] || role;
  }

  function payoutStatusLabel(status) {
    return { pending: 'Pendiente', processed: 'Procesado', paid: 'Pagado' }[status] || status;
  }

  function renderRevenueChart(report, containerId) {
    const chart = document.getElementById(containerId);
    if (!chart) return;

    if (!report || report.length === 0) {
      chart.innerHTML = '<p class="empty-state"><i class="fas fa-chart-bar"></i> Aún no hay ingresos registrados</p>';
      return;
    }

    const values = report.map(r => r.revenue || 0);
    const max = Math.max(...values, 1);

    chart.innerHTML = report.map(r => `
      <div class="bar-col">
        <div class="bar-value">$${((r.revenue || 0) / 1000).toFixed(0)}K</div>
        <div class="bar" style="height:${((r.revenue || 0) / max) * 100}%"></div>
        <div class="bar-label">${r.month || '-'}</div>
      </div>
    `).join('');
  }

  function switchAdminSection(sectionId) {
    ADMIN_SECTIONS.forEach(s => {
      const el = document.getElementById(`admin-section-${s.id}`);
      if (el) el.style.display = s.id === sectionId ? '' : 'none';
    });
    document.querySelectorAll('.admin-sidebar-link').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.section === sectionId);
    });
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
          await api.post(`/admin/users/${toggleUserBtn.dataset.id}/toggle`, { is_active: !isActive });
          window.toast(isActive ? 'Usuario desactivado' : 'Usuario activado', 'info');
          loadAdminUsers();
          loadAdminTechnicians();
        } catch (err) { window.toast(err.message || 'Error', 'error'); }
      }

      // Process a technician payout (admin)
      const processPayoutBtn = e.target.closest('.process-payout-btn');
      if (processPayoutBtn) {
        if (!confirm('¿Marcar este pago como procesado?')) return;
        try {
          await api.post(`/admin/payouts/${processPayoutBtn.dataset.id}/process`);
          window.toast('Pago procesado', 'success');
          loadAdminPayouts();
        } catch (err) { window.toast(err.message || 'Error', 'error'); }
      }

      // Admin sidebar navigation
      const sidebarLink = e.target.closest('.admin-sidebar-link');
      if (sidebarLink) {
        switchAdminSection(sidebarLink.dataset.section);
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

    // Change a user's role (admin)
    document.addEventListener('change', async (e) => {
      const roleSelect = e.target.closest('.role-select');
      if (roleSelect) {
        const newRole = roleSelect.value;
        try {
          await api.patch(`/admin/users/${roleSelect.dataset.id}/role`, { role: newRole });
          window.toast(`Rol actualizado a ${roleLabel(newRole)}`, 'success');
          loadAdminUsers();
          loadAdminTechnicians();
        } catch (err) {
          window.toast(err.message || 'Error al actualizar el rol', 'error');
          loadAdminUsers();
        }
      }
    });

    // Create a new user (admin, including other admins)
    document.addEventListener('submit', async (e) => {
      const form = e.target.closest('#createUserForm');
      if (!form) return;
      e.preventDefault();
      const btn = form.querySelector('button[type="submit"]');
      const payload = {
        name: document.getElementById('newUserName').value.trim(),
        email: document.getElementById('newUserEmail').value.trim(),
        password: document.getElementById('newUserPassword').value,
        role: document.getElementById('newUserRole').value
      };
      if (!payload.name || !payload.email || !payload.password) {
        window.toast('Completa todos los campos', 'warning');
        return;
      }
      auth.toggleBtnLoading(btn, true);
      try {
        await api.post('/admin/users', payload);
        window.toast(`${roleLabel(payload.role)} creado correctamente`, 'success');
        form.reset();
        loadAdminUsers();
        loadAdminTechnicians();
      } catch (err) {
        window.toast(err.message || 'Error al crear el usuario', 'error');
      } finally {
        auth.toggleBtnLoading(btn, false);
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
      // Usados por los paneles de cliente/técnico (service_requests en español
      // — no coinciden con el backend real; ver nota en la respuesta final).
      pendiente: 'Pendiente',
      aceptada: 'Aceptada',
      en_progreso: 'En Progreso',
      completada: 'Completada',
      cancelada: 'Cancelada',
      rechazada: 'Rechazada',
      activo: 'Activo',
      inactivo: 'Inactivo',
      // Usados por el panel de administración (status real de service_requests).
      pending: 'Pendiente',
      accepted: 'Aceptada',
      in_progress: 'En Progreso',
      completed: 'Completada',
      cancelled: 'Cancelada'
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
