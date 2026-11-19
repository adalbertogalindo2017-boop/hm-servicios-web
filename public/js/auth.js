/* ═══════════════════════════════════════════════════════════
   auth.js — Authentication Module for H&M Servicios
   ═══════════════════════════════════════════════════════════ */

const auth = (() => {

  // ── Token helpers ──────────────────────────────────────────

  function saveSession(data) {
    if (data.token) localStorage.setItem('hm_token', data.token);
    if (data.refreshToken) localStorage.setItem('hm_refresh_token', data.refreshToken);
    if (data.user) localStorage.setItem('hm_user', JSON.stringify(data.user));
  }

  function getUser() {
    try { return JSON.parse(localStorage.getItem('hm_user')); } catch { return null; }
  }

  function isLoggedIn() {
    return !!localStorage.getItem('hm_token') && !!getUser();
  }

  function getUserRole() {
    const u = getUser();
    // El backend siempre devuelve el rol en inglés: 'client' | 'technician' | 'admin'.
    return u ? u.role : null;
  }

  // Cuando express-validator rechaza el formulario, el servidor devuelve
  // { message: 'Error de validación.', errors: [{field, message}, ...] }
  // con el motivo real en "errors". Mostrar solo err.message dejaba al
  // usuario viendo "Error de validación." sin saber qué corregir (p. ej.
  // que la contraseña necesita un número o un símbolo), así que intenta
  // registrarse un par de veces y se rinde. Esto junta los mensajes
  // específicos cuando existen.
  function describeApiError(err, fallback) {
    if (err && err.data && Array.isArray(err.data.errors) && err.data.errors.length) {
      return err.data.errors.map(e => e.message).join(' ');
    }
    return (err && err.message) || fallback;
  }

  // ── UI updates ─────────────────────────────────────────────

  function updateNav() {
    const guest   = document.getElementById('guestButtons');
    const authBtns = document.getElementById('authButtons');
    const clientNav = document.querySelectorAll('.nav-client');
    const techNav   = document.querySelectorAll('.nav-tech');
    const adminNav  = document.querySelectorAll('.nav-admin');

    if (isLoggedIn()) {
      const user = getUser();
      guest.style.display = 'none';
      authBtns.style.display = 'flex';
      const nameSpan = authBtns.querySelector('#navUserName span');
      if (nameSpan) nameSpan.textContent = user.name || 'Usuario';

      const role = getUserRole();
      clientNav.forEach(el => el.style.display = role === 'client'     ? '' : 'none');
      techNav.forEach(el   => el.style.display = role === 'technician' ? '' : 'none');
      adminNav.forEach(el  => el.style.display = role === 'admin'      ? '' : 'none');
    } else {
      guest.style.display = 'flex';
      authBtns.style.display = 'none';
      clientNav.forEach(el => el.style.display = 'none');
      techNav.forEach(el   => el.style.display = 'none');
      adminNav.forEach(el  => el.style.display = 'none');
    }
  }

  // ── Login ──────────────────────────────────────────────────

  function renderLogin() {
    return `
      <section class="auth-section">
        <div class="auth-card glass-card">
          <div class="auth-header">
            <div class="auth-icon"><i class="fas fa-sign-in-alt"></i></div>
            <h2>Iniciar Sesión</h2>
            <p>Accede a tu cuenta para gestionar servicios</p>
          </div>
          <form id="loginForm" class="auth-form" novalidate>
            <div class="form-group">
              <div class="input-wrapper">
                <i class="fas fa-envelope input-icon"></i>
                <input type="email" id="loginEmail" placeholder=" " required />
                <label for="loginEmail">Correo electrónico</label>
              </div>
            </div>
            <div class="form-group">
              <div class="input-wrapper">
                <i class="fas fa-lock input-icon"></i>
                <input type="password" id="loginPassword" placeholder=" " required />
                <label for="loginPassword">Contraseña</label>
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-block">
              <span class="btn-text">Ingresar</span>
              <span class="btn-loader" style="display:none;"><i class="fas fa-spinner fa-spin"></i></span>
            </button>
          </form>
          <p class="auth-footer">
            <a href="#forgot-password">¿Olvidaste tu contraseña?</a><br/>
            ¿No tienes cuenta? <a href="#register">Regístrate aquí</a>
          </p>
        </div>
      </section>
    `;
  }

  async function handleLogin(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    // Algunos navegadores anteponen "mailto:" al autocompletar este campo;
    // se limpia aquí además de en el servidor, por seguridad adicional.
    const email = document.getElementById('loginEmail').value.trim().replace(/^mailto:/i, '').trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      window.toast('Por favor completa todos los campos', 'warning');
      return;
    }

    toggleBtnLoading(btn, true);
    try {
      const data = await api.post('/auth/login', { email, password });
      saveSession(data);
      updateNav();
      window.toast('¡Bienvenido de nuevo!', 'success');
      const role = getUserRole();
      if (role === 'admin') location.hash = '#admin-dashboard';
      else if (role === 'technician') location.hash = '#tech-dashboard';
      else location.hash = '#client-dashboard';
    } catch (err) {
      window.toast(describeApiError(err, 'Error al iniciar sesión'), 'error');
    } finally {
      toggleBtnLoading(btn, false);
    }
  }

  // ── Register ───────────────────────────────────────────────

  function renderRegister() {
    return `
      <section class="auth-section">
        <div class="auth-card glass-card auth-card-wide">
          <div class="auth-header">
            <div class="auth-icon"><i class="fas fa-user-plus"></i></div>
            <h2>Crear Cuenta</h2>
            <p>Únete a la plataforma de servicios líder en Colombia</p>
          </div>

          <!-- Role Selector -->
          <div class="role-selector">
            <button class="role-btn active" data-role="client">
              <i class="fas fa-user"></i> Soy Cliente
            </button>
            <button class="role-btn" data-role="technician">
              <i class="fas fa-hard-hat"></i> Soy Técnico
            </button>
          </div>

          <form id="registerForm" class="auth-form" novalidate>
            <input type="hidden" id="registerRole" value="client" />

            <div class="form-row">
              <div class="form-group">
                <div class="input-wrapper">
                  <i class="fas fa-user input-icon"></i>
                  <input type="text" id="regName" placeholder=" " required />
                  <label for="regName">Nombre completo</label>
                </div>
              </div>
              <div class="form-group">
                <div class="input-wrapper">
                  <i class="fas fa-envelope input-icon"></i>
                  <input type="email" id="regEmail" placeholder=" " required />
                  <label for="regEmail">Correo electrónico</label>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <div class="input-wrapper">
                  <i class="fas fa-phone input-icon"></i>
                  <input type="tel" id="regPhone" placeholder=" " required />
                  <label for="regPhone">Teléfono</label>
                </div>
              </div>
              <div class="form-group">
                <div class="input-wrapper">
                  <i class="fas fa-lock input-icon"></i>
                  <input type="password" id="regPassword" placeholder=" " required minlength="8" />
                  <label for="regPassword">Contraseña (mín. 8 car., mayúscula, minúscula, número y símbolo)</label>
                </div>
              </div>
            </div>

            <!-- Technician-only fields -->
            <div id="techFields" class="tech-fields" style="display:none;">
              <div class="form-group">
                <div class="input-wrapper">
                  <i class="fas fa-wrench input-icon"></i>
                  <input type="text" id="regSpecialties" placeholder=" " />
                  <label for="regSpecialties">Especialidades (separadas por coma)</label>
                </div>
              </div>
              <div class="form-group">
                <div class="input-wrapper">
                  <i class="fas fa-map-marked-alt input-icon"></i>
                  <input type="text" id="regCoverage" placeholder=" " />
                  <label for="regCoverage">Zona de cobertura</label>
                </div>
              </div>
              <div class="form-group">
                <div class="input-wrapper">
                  <i class="fas fa-align-left input-icon"></i>
                  <textarea id="regDescription" placeholder=" " rows="3"></textarea>
                  <label for="regDescription">Descripción profesional</label>
                </div>
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-block">
              <span class="btn-text">Crear Cuenta</span>
              <span class="btn-loader" style="display:none;"><i class="fas fa-spinner fa-spin"></i></span>
            </button>
          </form>
          <p class="auth-footer">¿Ya tienes cuenta? <a href="#login">Inicia sesión</a></p>
        </div>
      </section>
    `;
  }

  function initRegisterEvents() {
    document.querySelectorAll('.role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const role = btn.dataset.role;
        document.getElementById('registerRole').value = role;
        document.getElementById('techFields').style.display = role === 'technician' ? 'block' : 'none';
      });
    });
  }

  async function handleRegister(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const role = document.getElementById('registerRole').value;
    const payload = {
      name: document.getElementById('regName').value.trim(),
      email: document.getElementById('regEmail').value.trim().replace(/^mailto:/i, '').trim(),
      phone: document.getElementById('regPhone').value.trim(),
      password: document.getElementById('regPassword').value,
      role
    };

    if (!payload.name || !payload.email || !payload.password) {
      window.toast('Por favor completa todos los campos obligatorios', 'warning');
      return;
    }
    // server/middleware/validation.js (registerRules) ahora sí está
    // conectado a POST /auth/register, y exige mín. 8 caracteres con
    // mayúscula, minúscula, número y símbolo. Esta comprobación en el
    // cliente es solo para dar feedback inmediato sin esperar al servidor;
    // los mensajes detallados de cada regla (cuál falta exactamente) los
    // muestra el servidor vía auth.describeApiError si esta pasa pero esa
    // no.
    if (payload.password.length < 8) {
      window.toast('La contraseña debe tener al menos 8 caracteres, con mayúscula, minúscula, número y símbolo', 'warning');
      return;
    }

    if (role === 'technician') {
      payload.specialties = document.getElementById('regSpecialties').value.split(',').map(s => s.trim()).filter(Boolean);
      payload.address = document.getElementById('regCoverage').value.trim();
      payload.description = document.getElementById('regDescription').value.trim();
    }

    toggleBtnLoading(btn, true);
    try {
      const data = await api.post('/auth/register', payload);
      saveSession(data);
      updateNav();
      window.toast('¡Cuenta creada exitosamente!', 'success');
      location.hash = role === 'technician' ? '#tech-dashboard' : '#client-dashboard';
    } catch (err) {
      window.toast(describeApiError(err, 'Error al crear la cuenta'), 'error');
    } finally {
      toggleBtnLoading(btn, false);
    }
  }

  // ── Recuperar contraseña (sin correo, por email + teléfono) ──
  // No hay servicio de correo (SMTP/Resend/SendGrid) configurado en este
  // proyecto, así que en vez de un enlace enviado por email, la identidad
  // se confirma con el email Y el teléfono que quedaron registrados, y en
  // el mismo paso se fija la nueva contraseña. Si más adelante se agrega
  // un proveedor de correo con sus propias credenciales, este formulario
  // se puede cambiar por el flujo clásico de "te enviamos un enlace".

  function renderForgotPassword() {
    return `
      <section class="auth-section">
        <div class="auth-card glass-card">
          <div class="auth-header">
            <div class="auth-icon"><i class="fas fa-key"></i></div>
            <h2>Recuperar Contraseña</h2>
            <p>Confirma el correo y el teléfono con los que te registraste para fijar una nueva contraseña.</p>
          </div>
          <form id="forgotPasswordForm" class="auth-form" novalidate>
            <div class="form-group">
              <div class="input-wrapper">
                <i class="fas fa-envelope input-icon"></i>
                <input type="email" id="fpEmail" placeholder=" " required />
                <label for="fpEmail">Correo electrónico</label>
              </div>
            </div>
            <div class="form-group">
              <div class="input-wrapper">
                <i class="fas fa-phone input-icon"></i>
                <input type="tel" id="fpPhone" placeholder=" " required />
                <label for="fpPhone">Teléfono registrado</label>
              </div>
            </div>
            <div class="form-group">
              <div class="input-wrapper">
                <i class="fas fa-lock input-icon"></i>
                <input type="password" id="fpNewPassword" placeholder=" " required minlength="8" />
                <label for="fpNewPassword">Nueva contraseña (mín. 8 car., mayúscula, minúscula, número y símbolo)</label>
              </div>
            </div>
            <button type="submit" class="btn btn-primary btn-block">
              <span class="btn-text">Actualizar Contraseña</span>
              <span class="btn-loader" style="display:none;"><i class="fas fa-spinner fa-spin"></i></span>
            </button>
          </form>
          <p class="auth-footer">¿Ya la recordaste? <a href="#login">Inicia sesión</a></p>
        </div>
      </section>
    `;
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const email = document.getElementById('fpEmail').value.trim().replace(/^mailto:/i, '').trim();
    const phone = document.getElementById('fpPhone').value.trim();
    const newPassword = document.getElementById('fpNewPassword').value;

    if (!email || !phone || !newPassword) {
      window.toast('Por favor completa todos los campos', 'warning');
      return;
    }
    if (newPassword.length < 8) {
      window.toast('La contraseña debe tener al menos 8 caracteres, con mayúscula, minúscula, número y símbolo', 'warning');
      return;
    }

    toggleBtnLoading(btn, true);
    try {
      await api.post('/auth/forgot-password', { email, phone, newPassword });
      window.toast('Contraseña actualizada. Ya puedes iniciar sesión.', 'success');
      location.hash = '#login';
    } catch (err) {
      window.toast(describeApiError(err, 'No pudimos actualizar la contraseña'), 'error');
    } finally {
      toggleBtnLoading(btn, false);
    }
  }

  // ── Logout ─────────────────────────────────────────────────

  function logout() {
    localStorage.removeItem('hm_token');
    localStorage.removeItem('hm_refresh_token');
    localStorage.removeItem('hm_user');
    updateNav();
    location.hash = '#home';
    window.toast('Has cerrado sesión', 'info');
  }

  // ── Utility ────────────────────────────────────────────────

  function toggleBtnLoading(btn, loading) {
    if (!btn) return;
    const text = btn.querySelector('.btn-text');
    const loader = btn.querySelector('.btn-loader');
    if (text) text.style.display = loading ? 'none' : '';
    if (loader) loader.style.display = loading ? 'inline-block' : 'none';
    btn.disabled = loading;
  }

  // ── Public ─────────────────────────────────────────────────

  return {
    renderLogin,
    renderRegister,
    renderForgotPassword,
    handleLogin,
    handleRegister,
    handleForgotPassword,
    initRegisterEvents,
    logout,
    updateNav,
    isLoggedIn,
    getUser,
    getUserRole,
    toggleBtnLoading,
    describeApiError
  };
})();
