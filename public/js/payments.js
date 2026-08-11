/* ═══════════════════════════════════════════════════════════
   payments.js — Payment Module for H&M Servicios
   ═══════════════════════════════════════════════════════════ */

const payments = (() => {

  function renderPaymentForm(amount = 0, serviceRequestId = '') {
    return `
      <section class="page-section payment-page">
        <div class="container container-sm">
          <div class="glass-card payment-card animate-on-scroll">
            <div class="payment-header">
              <div class="payment-icon"><i class="fas fa-credit-card"></i></div>
              <h2>Realizar Pago</h2>
              <p class="payment-amount">Total: <strong>$${Number(amount).toLocaleString('es-CO')} COP</strong></p>
            </div>

            <!-- Method Selection -->
            <div class="payment-methods">
              <label class="payment-method active" data-method="card">
                <input type="radio" name="payMethod" value="card" checked />
                <i class="fas fa-credit-card"></i>
                <span>Tarjeta</span>
              </label>
              <label class="payment-method" data-method="pse">
                <input type="radio" name="payMethod" value="pse" />
                <i class="fas fa-university"></i>
                <span>PSE</span>
              </label>
              <label class="payment-method" data-method="nequi">
                <input type="radio" name="payMethod" value="nequi" />
                <i class="fas fa-mobile-alt"></i>
                <span>Nequi</span>
              </label>
            </div>

            <!-- Card Form -->
            <form id="paymentForm" class="auth-form" novalidate>
              <input type="hidden" id="payServiceRequestId" value="${serviceRequestId}" />
              <input type="hidden" id="payAmount" value="${amount}" />
              <input type="hidden" id="payMethodValue" value="card" />

              <div id="cardFields">
                <div class="form-group">
                  <div class="input-wrapper">
                    <i class="fas fa-credit-card input-icon"></i>
                    <input type="text" id="cardNumber" placeholder=" " maxlength="19" />
                    <label for="cardNumber">Número de tarjeta</label>
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <div class="input-wrapper">
                      <i class="fas fa-calendar input-icon"></i>
                      <input type="text" id="cardExpiry" placeholder=" " maxlength="5" />
                      <label for="cardExpiry">MM/AA</label>
                    </div>
                  </div>
                  <div class="form-group">
                    <div class="input-wrapper">
                      <i class="fas fa-lock input-icon"></i>
                      <input type="text" id="cardCvv" placeholder=" " maxlength="4" />
                      <label for="cardCvv">CVV</label>
                    </div>
                  </div>
                </div>
                <div class="form-group">
                  <div class="input-wrapper">
                    <i class="fas fa-user input-icon"></i>
                    <input type="text" id="cardName" placeholder=" " />
                    <label for="cardName">Nombre en la tarjeta</label>
                  </div>
                </div>
              </div>

              <div id="pseFields" style="display:none;">
                <div class="form-group">
                  <div class="input-wrapper">
                    <i class="fas fa-university input-icon"></i>
                    <select id="pseBank">
                      <option value="">Selecciona tu banco</option>
                      <option>Bancolombia</option>
                      <option>Davivienda</option>
                      <option>BBVA</option>
                      <option>Banco de Bogotá</option>
                      <option>Nequi</option>
                    </select>
                    <label for="pseBank" class="select-label">Banco</label>
                  </div>
                </div>
              </div>

              <div id="nequiFields" style="display:none;">
                <div class="form-group">
                  <div class="input-wrapper">
                    <i class="fas fa-mobile-alt input-icon"></i>
                    <input type="tel" id="nequiPhone" placeholder=" " />
                    <label for="nequiPhone">Número Nequi</label>
                  </div>
                </div>
              </div>

              <button type="submit" class="btn btn-primary btn-block">
                <span class="btn-text"><i class="fas fa-lock"></i> Pagar $${Number(amount).toLocaleString('es-CO')} COP</span>
                <span class="btn-loader" style="display:none;"><i class="fas fa-spinner fa-spin"></i></span>
              </button>

              <p class="payment-secure"><i class="fas fa-shield-alt"></i> Pago seguro con encriptación de 256 bits</p>
            </form>
          </div>
        </div>
      </section>
    `;
  }

  // ── Events ─────────────────────────────────────────────────

  function initEvents() {
    // Payment method toggle
    document.querySelectorAll('.payment-method').forEach(m => {
      m.addEventListener('click', () => {
        document.querySelectorAll('.payment-method').forEach(x => x.classList.remove('active'));
        m.classList.add('active');
        const method = m.dataset.method;
        document.getElementById('payMethodValue').value = method;
        document.getElementById('cardFields').style.display = method === 'card' ? 'block' : 'none';
        document.getElementById('pseFields').style.display = method === 'pse' ? 'block' : 'none';
        document.getElementById('nequiFields').style.display = method === 'nequi' ? 'block' : 'none';
      });
    });

    // Card number formatting
    const cardNum = document.getElementById('cardNumber');
    if (cardNum) {
      cardNum.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '').slice(0, 16);
        e.target.value = v.replace(/(\d{4})(?=\d)/g, '$1 ');
      });
    }

    // Expiry formatting
    const expiry = document.getElementById('cardExpiry');
    if (expiry) {
      expiry.addEventListener('input', (e) => {
        let v = e.target.value.replace(/\D/g, '').slice(0, 4);
        if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2);
        e.target.value = v;
      });
    }

    // Payment form submit
    const form = document.getElementById('paymentForm');
    if (form) {
      form.addEventListener('submit', handlePayment);
    }
  }

  async function handlePayment(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const method = document.getElementById('payMethodValue').value;
    const amount = Number(document.getElementById('payAmount').value);
    const serviceRequestId = document.getElementById('payServiceRequestId').value;

    auth.toggleBtnLoading(btn, true);

    try {
      const payload = { serviceRequestId, amount, method };
      await api.post('/payments', payload);

      // Show success modal
      showPaymentResult(true, amount, method);
    } catch (err) {
      showPaymentResult(false, amount, method);
    } finally {
      auth.toggleBtnLoading(btn, false);
    }
  }

  function showPaymentResult(success, amount, method) {
    const methodLabels = { card: 'Tarjeta', pse: 'PSE', nequi: 'Nequi' };
    const receiptId = 'HM-' + Date.now().toString(36).toUpperCase();
    const now = new Date().toLocaleString('es-CO');

    const html = success ? `
      <div class="payment-result success">
        <div class="result-icon"><i class="fas fa-check-circle"></i></div>
        <h3>¡Pago Exitoso!</h3>
        <p>Tu pago ha sido procesado correctamente.</p>
        <div class="receipt">
          <div class="receipt-row"><span>Referencia</span><strong>${receiptId}</strong></div>
          <div class="receipt-row"><span>Monto</span><strong>$${amount.toLocaleString('es-CO')} COP</strong></div>
          <div class="receipt-row"><span>Método</span><strong>${methodLabels[method] || method}</strong></div>
          <div class="receipt-row"><span>Fecha</span><strong>${now}</strong></div>
        </div>
        <button class="btn btn-primary" onclick="window.closeModal(); location.hash='#client-dashboard';">
          <i class="fas fa-th-large"></i> Ir a Mi Panel
        </button>
      </div>
    ` : `
      <div class="payment-result failure">
        <div class="result-icon"><i class="fas fa-times-circle"></i></div>
        <h3>Pago Fallido</h3>
        <p>No se pudo procesar el pago. Por favor intenta nuevamente.</p>
        <button class="btn btn-primary" onclick="window.closeModal();">
          <i class="fas fa-redo"></i> Reintentar
        </button>
      </div>
    `;

    window.openModal(html);
  }

  return { renderPaymentForm, initEvents };
})();
