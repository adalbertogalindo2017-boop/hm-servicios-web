/* ═══════════════════════════════════════════════════════════════════════════
   app.js — Lógica Principal del Sistema Administrativo H&M
   ═══════════════════════════════════════════════════════════════════════════
   Archivo principal que contiene:
   - Almacén de datos de ejemplo (productos, clientes, pedidos, etc.)
   - Funciones de renderizado para cada módulo del sistema
   - Enrutador de páginas (SPA-like)
   - Funciones auxiliares (formato, toasts, modales, etc.)
   ═══════════════════════════════════════════════════════════════════════════ */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════
//  FORMATEADORES Y UTILIDADES GLOBALES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Formatea un valor numérico como moneda colombiana (COP)
 * @param {number} amount - Cantidad a formatear
 * @returns {string} Cantidad formateada (ej: $1.250.000)
 */
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Formatea una fecha en formato DD/MM/YYYY
 * @param {string} date - Fecha en formato ISO o compatible con Date
 * @returns {string} Fecha formateada
 */
const formatDate = (date) => {
  const d = new Date(date);
  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(d);
};

/**
 * Retorna HTML de un badge de estado con color apropiado
 * @param {string} status - Estado del elemento
 * @returns {string} HTML del badge
 */
const getStatusBadge = (status) => {
  // Mapa de estados a clases CSS y colores
  const statusMap = {
    'Activo': { clase: 'badge-success', icono: 'fa-check-circle' },
    'Inactivo': { clase: 'badge-danger', icono: 'fa-times-circle' },
    'Pendiente': { clase: 'badge-warning', icono: 'fa-clock' },
    'En Proceso': { clase: 'badge-info', icono: 'fa-spinner' },
    'Completado': { clase: 'badge-success', icono: 'fa-check-double' },
    'Cancelado': { clase: 'badge-danger', icono: 'fa-ban' },
    'Pagada': { clase: 'badge-success', icono: 'fa-check-circle' },
    'Pendiente de Pago': { clase: 'badge-warning', icono: 'fa-clock' },
    'Vencida': { clase: 'badge-danger', icono: 'fa-exclamation-triangle' },
    'Anulada': { clase: 'badge-danger', icono: 'fa-times-circle' },
    'Bajo Stock': { clase: 'badge-danger', icono: 'fa-exclamation-triangle' },
    'Stock Normal': { clase: 'badge-success', icono: 'fa-check-circle' },
    'Sin Stock': { clase: 'badge-danger', icono: 'fa-times-circle' }
  };

  const config = statusMap[status] || { clase: 'badge-secondary', icono: 'fa-info-circle' };
  return `<span class="badge ${config.clase}"><i class="fas ${config.icono}"></i> ${status}</span>`;
};

/**
 * Anima un contador numérico desde 0 hasta el valor objetivo
 * @param {HTMLElement} element - Elemento DOM del contador
 * @param {number} target - Valor objetivo
 * @param {number} duration - Duración de la animación en ms
 */
const animateCounter = (element, target, duration = 1500) => {
  let startTime = null;
  const startValue = 0;

  const step = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const progress = Math.min((timestamp - startTime) / duration, 1);
    // Función de easing para suavizar la animación
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const currentValue = Math.floor(easeOutQuart * (target - startValue) + startValue);

    element.textContent = new Intl.NumberFormat('es-CO').format(currentValue);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      element.textContent = new Intl.NumberFormat('es-CO').format(target);
    }
  };

  requestAnimationFrame(step);
};

/**
 * Muestra una notificación toast en pantalla
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
 */
const showToast = (message, type = 'info') => {
  // Remover toast anterior si existe
  const existente = document.querySelector('.toast-notification');
  if (existente) existente.remove();

  const iconos = {
    success: 'fa-check-circle',
    error: 'fa-times-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  };

  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  toast.innerHTML = `
    <i class="fas ${iconos[type] || iconos.info}"></i>
    <span>${message}</span>
    <button class="toast-close" aria-label="Cerrar notificación" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `;

  document.body.appendChild(toast);

  // Animación de entrada
  requestAnimationFrame(() => toast.classList.add('toast-show'));

  // Auto-cerrar después de 4 segundos
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

/**
 * Muestra un diálogo modal personalizado
 * @param {string} title - Título del modal
 * @param {string} content - Contenido HTML del modal
 * @param {Array} actions - Botones de acción [{texto, clase, onClick}]
 */
const showModal = (title, content, actions = []) => {
  // Crear overlay del modal
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'appModal';

  const accionesHTML = actions.map(action =>
    `<button class="btn ${action.clase || 'btn-primary'}" onclick="${action.onClick}">${action.texto}</button>`
  ).join('');

  overlay.innerHTML = `
    <div class="modal-container" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div class="modal-header">
        <h3 id="modalTitle">${title}</h3>
        <button class="modal-close-btn" aria-label="Cerrar modal" onclick="closeModal()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="modal-body">${content}</div>
      ${accionesHTML ? `<div class="modal-footer">${accionesHTML}</div>` : ''}
    </div>
  `;

  document.body.appendChild(overlay);

  // Animación de entrada
  requestAnimationFrame(() => overlay.classList.add('modal-active'));

  // Cerrar al hacer clic fuera del contenido
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Cerrar con tecla Escape
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
};

/**
 * Cierra el modal activo
 */
const closeModal = () => {
  const modal = document.getElementById('appModal');
  if (modal) {
    modal.classList.remove('modal-active');
    setTimeout(() => modal.remove(), 300);
  }
};
// Exponer globalmente para los onclick inline
window.closeModal = closeModal;

/**
 * Muestra un diálogo de confirmación antes de eliminar
 * @param {string} itemName - Nombre del elemento a eliminar
 * @param {Function} callback - Función a ejecutar si se confirma
 */
const confirmDelete = (itemName, callback) => {
  showModal(
    'Confirmar Eliminación',
    `<div class="confirm-delete-content">
       <i class="fas fa-exclamation-triangle confirm-icon"></i>
       <p>¿Estás seguro de que deseas eliminar <strong>${itemName}</strong>?</p>
       <p class="text-muted">Esta acción no se puede deshacer.</p>
     </div>`,
    [
      { texto: 'Cancelar', clase: 'btn-ghost', onClick: 'closeModal()' },
      { texto: 'Eliminar', clase: 'btn-danger', onClick: `(${callback})(); closeModal();` }
    ]
  );
};
window.confirmDelete = confirmDelete;


// ═══════════════════════════════════════════════════════════════════════════
//  ALMACÉN DE DATOS DE EJEMPLO
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Productos — 12 artículos de moda H&M con información detallada
 * Precios en Pesos Colombianos (COP)
 */
const datosProductos = [
  {
    id: 1, nombre: 'Camiseta Básica Algodón', categoria: 'Camisetas', precio: 49900,
    stock: 150, estado: 'Activo', imagen: 'https://placehold.co/80x80/E50010/FFF?text=CAM',
    sku: 'HM-CAM01', descripcion: 'Camiseta básica de algodón orgánico, corte regular, disponible en 8 colores.'
  },
  {
    id: 2, nombre: 'Pantalón Slim Fit', categoria: 'Pantalones', precio: 129900,
    stock: 85, estado: 'Activo', imagen: 'https://placehold.co/80x80/1a1a2e/FFF?text=PAN',
    sku: 'HM-PAN01', descripcion: 'Pantalón slim fit en algodón stretch con cierre de botón.'
  },
  {
    id: 3, nombre: 'Vestido Floral Midi', categoria: 'Vestidos', precio: 159900,
    stock: 42, estado: 'Activo', imagen: 'https://placehold.co/80x80/E50010/FFF?text=VES',
    sku: 'HM-VES01', descripcion: 'Vestido midi con estampado floral, tela fluida y cintura elástica.'
  },
  {
    id: 4, nombre: 'Chaqueta Denim Oversize', categoria: 'Chaquetas', precio: 199900,
    stock: 30, estado: 'Activo', imagen: 'https://placehold.co/80x80/16213e/FFF?text=CHQ',
    sku: 'HM-CHQ01', descripcion: 'Chaqueta de denim oversize con bolsillos de parche y botones metálicos.'
  },
  {
    id: 5, nombre: 'Falda Plisada Satinada', categoria: 'Faldas', precio: 119900,
    stock: 60, estado: 'Activo', imagen: 'https://placehold.co/80x80/E50010/FFF?text=FAL',
    sku: 'HM-FAL01', descripcion: 'Falda midi plisada en tejido satinado con cintura elástica.'
  },
  {
    id: 6, nombre: 'Sudadera Con Capucha', categoria: 'Sudaderas', precio: 99900,
    stock: 12, estado: 'Activo', imagen: 'https://placehold.co/80x80/0a0a0a/FFF?text=SUD',
    sku: 'HM-SUD01', descripcion: 'Sudadera con capucha en algodón perchado, bolsillo canguro.'
  },
  {
    id: 7, nombre: 'Blazer Entallado', categoria: 'Blazers', precio: 249900,
    stock: 25, estado: 'Activo', imagen: 'https://placehold.co/80x80/16213e/FFF?text=BLZ',
    sku: 'HM-BLZ01', descripcion: 'Blazer entallado de un botón con solapas de muesca, forro interior.'
  },
  {
    id: 8, nombre: 'Jeans Straight Leg', categoria: 'Pantalones', precio: 149900,
    stock: 95, estado: 'Activo', imagen: 'https://placehold.co/80x80/1a1a2e/FFF?text=JEA',
    sku: 'HM-JEA01', descripcion: 'Jeans rectos de tiro alto en denim rígido con efecto lavado.'
  },
  {
    id: 9, nombre: 'Top Crop Ribeteado', categoria: 'Camisetas', precio: 39900,
    stock: 200, estado: 'Activo', imagen: 'https://placehold.co/80x80/E50010/FFF?text=TOP',
    sku: 'HM-TOP01', descripcion: 'Top crop sin mangas en punto acanalado de algodón elástico.'
  },
  {
    id: 10, nombre: 'Abrigo Largo Lana', categoria: 'Chaquetas', precio: 349900,
    stock: 8, estado: 'Activo', imagen: 'https://placehold.co/80x80/0a0a0a/FFF?text=ABR',
    sku: 'HM-ABR01', descripcion: 'Abrigo largo de mezcla de lana con cuello solapa y cierre cruzado.'
  },
  {
    id: 11, nombre: 'Short Deportivo', categoria: 'Shorts', precio: 59900,
    stock: 5, estado: 'Activo', imagen: 'https://placehold.co/80x80/16213e/FFF?text=SHO',
    sku: 'HM-SHO01', descripcion: 'Short deportivo de secado rápido con cintura elástica y cordón.'
  },
  {
    id: 12, nombre: 'Camisa Lino Manga Larga', categoria: 'Camisas', precio: 139900,
    stock: 0, estado: 'Inactivo', imagen: 'https://placehold.co/80x80/1a1a2e/FFF?text=CML',
    sku: 'HM-CML01', descripcion: 'Camisa de lino puro con manga larga enrollable y cuello clásico.'
  }
];

/**
 * Clientes — 8 clientes con información de compra
 */
const datosClientes = [
  {
    id: 1, nombre: 'María García López', email: 'maria.garcia@email.com',
    telefono: '+57 310 234 5678', ciudad: 'Bogotá', totalCompras: 1250000,
    ultimaCompra: '2026-06-20', estado: 'Activo'
  },
  {
    id: 2, nombre: 'Carlos Rodríguez Díaz', email: 'carlos.rodriguez@email.com',
    telefono: '+57 315 876 5432', ciudad: 'Medellín', totalCompras: 890000,
    ultimaCompra: '2026-06-18', estado: 'Activo'
  },
  {
    id: 3, nombre: 'Ana Martínez Ruiz', email: 'ana.martinez@email.com',
    telefono: '+57 300 123 4567', ciudad: 'Cali', totalCompras: 2100000,
    ultimaCompra: '2026-06-25', estado: 'Activo'
  },
  {
    id: 4, nombre: 'Luis Hernández Torres', email: 'luis.hernandez@email.com',
    telefono: '+57 312 456 7890', ciudad: 'Barranquilla', totalCompras: 450000,
    ultimaCompra: '2026-05-30', estado: 'Activo'
  },
  {
    id: 5, nombre: 'Sofía Ramírez Pérez', email: 'sofia.ramirez@email.com',
    telefono: '+57 318 987 6543', ciudad: 'Cartagena', totalCompras: 3200000,
    ultimaCompra: '2026-06-22', estado: 'Activo'
  },
  {
    id: 6, nombre: 'Diego Morales Vega', email: 'diego.morales@email.com',
    telefono: '+57 305 321 6549', ciudad: 'Bucaramanga', totalCompras: 175000,
    ultimaCompra: '2026-04-15', estado: 'Inactivo'
  },
  {
    id: 7, nombre: 'Valentina Castro Mejía', email: 'valentina.castro@email.com',
    telefono: '+57 311 654 3210', ciudad: 'Pereira', totalCompras: 980000,
    ultimaCompra: '2026-06-10', estado: 'Activo'
  },
  {
    id: 8, nombre: 'Andrés Jiménez Soto', email: 'andres.jimenez@email.com',
    telefono: '+57 320 111 2233', ciudad: 'Manizales', totalCompras: 560000,
    ultimaCompra: '2026-06-05', estado: 'Activo'
  }
];

/**
 * Pedidos — 10 pedidos con diferentes estados
 */
const datosPedidos = [
  {
    id: 1, numero: 'PED-2026-0001', cliente: 'María García López',
    fecha: '2026-06-25', productos: ['Camiseta Básica Algodón x2', 'Pantalón Slim Fit x1'],
    total: 229700, estado: 'Completado', metodoPago: 'Tarjeta de Crédito'
  },
  {
    id: 2, numero: 'PED-2026-0002', cliente: 'Carlos Rodríguez Díaz',
    fecha: '2026-06-26', productos: ['Chaqueta Denim Oversize x1'],
    total: 199900, estado: 'En Proceso', metodoPago: 'PSE'
  },
  {
    id: 3, numero: 'PED-2026-0003', cliente: 'Ana Martínez Ruiz',
    fecha: '2026-06-26', productos: ['Vestido Floral Midi x1', 'Falda Plisada Satinada x1'],
    total: 279800, estado: 'Pendiente', metodoPago: 'Nequi'
  },
  {
    id: 4, numero: 'PED-2026-0004', cliente: 'Sofía Ramírez Pérez',
    fecha: '2026-06-24', productos: ['Blazer Entallado x1', 'Top Crop Ribeteado x3'],
    total: 369600, estado: 'Completado', metodoPago: 'Tarjeta de Crédito'
  },
  {
    id: 5, numero: 'PED-2026-0005', cliente: 'Luis Hernández Torres',
    fecha: '2026-06-27', productos: ['Sudadera Con Capucha x1'],
    total: 99900, estado: 'Pendiente', metodoPago: 'Daviplata'
  },
  {
    id: 6, numero: 'PED-2026-0006', cliente: 'Valentina Castro Mejía',
    fecha: '2026-06-23', productos: ['Abrigo Largo Lana x1'],
    total: 349900, estado: 'Cancelado', metodoPago: 'Tarjeta Débito'
  },
  {
    id: 7, numero: 'PED-2026-0007', cliente: 'Andrés Jiménez Soto',
    fecha: '2026-06-27', productos: ['Jeans Straight Leg x1', 'Camiseta Básica Algodón x1'],
    total: 199800, estado: 'En Proceso', metodoPago: 'PSE'
  },
  {
    id: 8, numero: 'PED-2026-0008', cliente: 'Diego Morales Vega',
    fecha: '2026-06-20', productos: ['Short Deportivo x2'],
    total: 119800, estado: 'Completado', metodoPago: 'Efectivo'
  },
  {
    id: 9, numero: 'PED-2026-0009', cliente: 'María García López',
    fecha: '2026-06-27', productos: ['Camisa Lino Manga Larga x1', 'Falda Plisada Satinada x1'],
    total: 259800, estado: 'Pendiente', metodoPago: 'Tarjeta de Crédito'
  },
  {
    id: 10, numero: 'PED-2026-0010', cliente: 'Ana Martínez Ruiz',
    fecha: '2026-06-26', productos: ['Blazer Entallado x1', 'Pantalón Slim Fit x1'],
    total: 379800, estado: 'En Proceso', metodoPago: 'Nequi'
  }
];

/**
 * Ventas — 8 registros de ventas realizadas
 */
const datosVentas = [
  {
    id: 1, fecha: '2026-06-25', cliente: 'María García López',
    productos: 'Camiseta Básica x2, Pantalón Slim x1', total: 229700,
    vendedor: 'Laura Gómez', estado: 'Completado'
  },
  {
    id: 2, fecha: '2026-06-24', cliente: 'Sofía Ramírez Pérez',
    productos: 'Blazer Entallado x1, Top Crop x3', total: 369600,
    vendedor: 'Pedro Sánchez', estado: 'Completado'
  },
  {
    id: 3, fecha: '2026-06-23', cliente: 'Carlos Rodríguez Díaz',
    productos: 'Chaqueta Denim x1', total: 199900,
    vendedor: 'Laura Gómez', estado: 'Completado'
  },
  {
    id: 4, fecha: '2026-06-22', cliente: 'Ana Martínez Ruiz',
    productos: 'Vestido Floral x1, Falda Plisada x1', total: 279800,
    vendedor: 'Miguel Torres', estado: 'Completado'
  },
  {
    id: 5, fecha: '2026-06-20', cliente: 'Diego Morales Vega',
    productos: 'Short Deportivo x2', total: 119800,
    vendedor: 'Pedro Sánchez', estado: 'Completado'
  },
  {
    id: 6, fecha: '2026-06-18', cliente: 'Valentina Castro Mejía',
    productos: 'Jeans Straight x1, Sudadera x1', total: 249800,
    vendedor: 'Laura Gómez', estado: 'Completado'
  },
  {
    id: 7, fecha: '2026-06-15', cliente: 'Andrés Jiménez Soto',
    productos: 'Abrigo Largo Lana x1', total: 349900,
    vendedor: 'Miguel Torres', estado: 'Completado'
  },
  {
    id: 8, fecha: '2026-06-27', cliente: 'Luis Hernández Torres',
    productos: 'Camiseta Básica x3', total: 149700,
    vendedor: 'Pedro Sánchez', estado: 'Pendiente'
  }
];

/**
 * Inventario — 10 elementos con niveles de stock y ubicación
 */
const datosInventario = [
  {
    id: 1, codigo: 'HM-CAM01', nombre: 'Camiseta Básica Algodón', categoria: 'Camisetas',
    stock: 150, stockMinimo: 30, precioUnitario: 49900, ubicacion: 'Bodega A - Estante 1',
    ultimaActualizacion: '2026-06-27'
  },
  {
    id: 2, codigo: 'HM-PAN01', nombre: 'Pantalón Slim Fit', categoria: 'Pantalones',
    stock: 85, stockMinimo: 20, precioUnitario: 129900, ubicacion: 'Bodega A - Estante 3',
    ultimaActualizacion: '2026-06-26'
  },
  {
    id: 3, codigo: 'HM-VES01', nombre: 'Vestido Floral Midi', categoria: 'Vestidos',
    stock: 42, stockMinimo: 15, precioUnitario: 159900, ubicacion: 'Bodega B - Estante 1',
    ultimaActualizacion: '2026-06-25'
  },
  {
    id: 4, codigo: 'HM-CHQ01', nombre: 'Chaqueta Denim Oversize', categoria: 'Chaquetas',
    stock: 30, stockMinimo: 10, precioUnitario: 199900, ubicacion: 'Bodega B - Estante 2',
    ultimaActualizacion: '2026-06-26'
  },
  {
    id: 5, codigo: 'HM-SUD01', nombre: 'Sudadera Con Capucha', categoria: 'Sudaderas',
    stock: 12, stockMinimo: 15, precioUnitario: 99900, ubicacion: 'Bodega A - Estante 5',
    ultimaActualizacion: '2026-06-24'
  },
  {
    id: 6, codigo: 'HM-BLZ01', nombre: 'Blazer Entallado', categoria: 'Blazers',
    stock: 25, stockMinimo: 10, precioUnitario: 249900, ubicacion: 'Bodega C - Estante 1',
    ultimaActualizacion: '2026-06-23'
  },
  {
    id: 7, codigo: 'HM-ABR01', nombre: 'Abrigo Largo Lana', categoria: 'Chaquetas',
    stock: 8, stockMinimo: 10, precioUnitario: 349900, ubicacion: 'Bodega C - Estante 2',
    ultimaActualizacion: '2026-06-22'
  },
  {
    id: 8, codigo: 'HM-SHO01', nombre: 'Short Deportivo', categoria: 'Shorts',
    stock: 5, stockMinimo: 20, precioUnitario: 59900, ubicacion: 'Bodega A - Estante 6',
    ultimaActualizacion: '2026-06-21'
  },
  {
    id: 9, codigo: 'HM-CML01', nombre: 'Camisa Lino Manga Larga', categoria: 'Camisas',
    stock: 0, stockMinimo: 10, precioUnitario: 139900, ubicacion: 'Bodega B - Estante 3',
    ultimaActualizacion: '2026-06-20'
  },
  {
    id: 10, codigo: 'HM-TOP01', nombre: 'Top Crop Ribeteado', categoria: 'Camisetas',
    stock: 200, stockMinimo: 50, precioUnitario: 39900, ubicacion: 'Bodega A - Estante 2',
    ultimaActualizacion: '2026-06-27'
  }
];

/**
 * Proveedores — 6 proveedores del sistema
 */
const datosProveedores = [
  {
    id: 1, nombre: 'Textiles del Pacífico S.A.S', contacto: 'Ricardo Vargas',
    email: 'ricardo@textilespacifico.com', telefono: '+57 602 555 1234',
    productos: 'Telas de algodón, lino y mezclas', estado: 'Activo'
  },
  {
    id: 2, nombre: 'Confecciones Andinas Ltda', contacto: 'Patricia Muñoz',
    email: 'patricia@confeccionesandinas.com', telefono: '+57 601 444 5678',
    productos: 'Prendas terminadas: camisetas, tops', estado: 'Activo'
  },
  {
    id: 3, nombre: 'Denim Colombia S.A', contacto: 'Fernando Restrepo',
    email: 'fernando@denimcolombia.com', telefono: '+57 604 333 9012',
    productos: 'Telas denim, jeans terminados', estado: 'Activo'
  },
  {
    id: 4, nombre: 'Accesorios Moda Global', contacto: 'Isabela Cortés',
    email: 'isabela@modaglobal.com', telefono: '+57 310 222 3456',
    productos: 'Botones, cierres, herrajes, etiquetas', estado: 'Activo'
  },
  {
    id: 5, nombre: 'Importadora Fashion Trends', contacto: 'Sebastián Ríos',
    email: 'sebastian@fashiontrends.com', telefono: '+57 315 111 7890',
    productos: 'Prendas importadas premium', estado: 'Inactivo'
  },
  {
    id: 6, nombre: 'Empaques y Logística Verde', contacto: 'Camila Duarte',
    email: 'camila@logisticaverde.com', telefono: '+57 318 666 1234',
    productos: 'Bolsas, cajas, empaques ecológicos', estado: 'Activo'
  }
];

/**
 * Empleados — 6 miembros del equipo
 */
const datosEmpleados = [
  {
    id: 1, nombre: 'Laura Gómez Herrera', cargo: 'Gerente de Tienda',
    departamento: 'Operaciones', email: 'laura.gomez@hm.com.co',
    fechaIngreso: '2023-03-15', estado: 'Activo'
  },
  {
    id: 2, nombre: 'Pedro Sánchez Ruiz', cargo: 'Asesor de Ventas',
    departamento: 'Ventas', email: 'pedro.sanchez@hm.com.co',
    fechaIngreso: '2024-01-10', estado: 'Activo'
  },
  {
    id: 3, nombre: 'Miguel Torres Parra', cargo: 'Asesor de Ventas',
    departamento: 'Ventas', email: 'miguel.torres@hm.com.co',
    fechaIngreso: '2024-06-01', estado: 'Activo'
  },
  {
    id: 4, nombre: 'Daniela López Cárdenas', cargo: 'Coordinadora de Inventario',
    departamento: 'Logística', email: 'daniela.lopez@hm.com.co',
    fechaIngreso: '2023-09-20', estado: 'Activo'
  },
  {
    id: 5, nombre: 'Julián Méndez Ospina', cargo: 'Diseñador Visual',
    departamento: 'Marketing', email: 'julian.mendez@hm.com.co',
    fechaIngreso: '2025-02-01', estado: 'Activo'
  },
  {
    id: 6, nombre: 'Carolina Ríos Bermúdez', cargo: 'Analista Contable',
    departamento: 'Finanzas', email: 'carolina.rios@hm.com.co',
    fechaIngreso: '2024-08-15', estado: 'Inactivo'
  }
];

/**
 * Facturas — 8 facturas con diferentes estados
 */
const datosFacturas = [
  {
    id: 1, numero: 'FAC-2026-0001', cliente: 'María García López',
    fecha: '2026-06-25', subtotal: 193025, iva: 36675, total: 229700, estado: 'Pagada'
  },
  {
    id: 2, numero: 'FAC-2026-0002', cliente: 'Carlos Rodríguez Díaz',
    fecha: '2026-06-26', subtotal: 168067, iva: 31933, total: 199900, estado: 'Pendiente de Pago'
  },
  {
    id: 3, numero: 'FAC-2026-0003', cliente: 'Ana Martínez Ruiz',
    fecha: '2026-06-26', subtotal: 235126, iva: 44674, total: 279800, estado: 'Pendiente de Pago'
  },
  {
    id: 4, numero: 'FAC-2026-0004', cliente: 'Sofía Ramírez Pérez',
    fecha: '2026-06-24', subtotal: 310588, iva: 59012, total: 369600, estado: 'Pagada'
  },
  {
    id: 5, numero: 'FAC-2026-0005', cliente: 'Diego Morales Vega',
    fecha: '2026-06-20', subtotal: 100672, iva: 19128, total: 119800, estado: 'Pagada'
  },
  {
    id: 6, numero: 'FAC-2026-0006', cliente: 'Valentina Castro Mejía',
    fecha: '2026-06-23', subtotal: 294034, iva: 55866, total: 349900, estado: 'Anulada'
  },
  {
    id: 7, numero: 'FAC-2026-0007', cliente: 'Andrés Jiménez Soto',
    fecha: '2026-06-15', subtotal: 294034, iva: 55866, total: 349900, estado: 'Pagada'
  },
  {
    id: 8, numero: 'FAC-2026-0008', cliente: 'Luis Hernández Torres',
    fecha: '2026-06-10', subtotal: 125882, iva: 23918, total: 149700, estado: 'Vencida'
  }
];

/**
 * Reportes — Datos KPI para el dashboard y reportes
 */
const datosReportes = {
  ventasHoy: 1948200,
  pedidosPendientes: 3,
  inventarioBajo: 4,
  clientesNuevos: 12,
  ventasMensuales: [
    { mes: 'Enero', total: 15200000 },
    { mes: 'Febrero', total: 18500000 },
    { mes: 'Marzo', total: 22100000 },
    { mes: 'Abril', total: 19800000 },
    { mes: 'Mayo', total: 25400000 },
    { mes: 'Junio', total: 28700000 }
  ]
};


// ═══════════════════════════════════════════════════════════════════════════
//  RENDERIZADO DEL DASHBOARD PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Renderiza el dashboard con tarjetas KPI, gráfico de barras CSS,
 * tabla de pedidos recientes y alertas de inventario bajo
 */
const renderDashboard = () => {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  // Encontrar el valor máximo de ventas mensuales para escalar el gráfico
  const maxVenta = Math.max(...datosReportes.ventasMensuales.map(v => v.total));

  // Pedidos recientes (últimos 5)
  const pedidosRecientes = datosPedidos.slice(0, 5);

  // Productos con bajo stock
  const productoBajoStock = datosInventario.filter(item => item.stock <= item.stockMinimo);

  mainContent.innerHTML = `
    <div class="content-header">
      <h2><i class="fas fa-chart-line"></i> Dashboard</h2>
      <p class="content-subtitle">Resumen general del sistema — ${formatDate(new Date())}</p>
    </div>

    <!-- ═══ TARJETAS KPI ═══ -->
    <div class="kpi-grid fade-in">
      <!-- Ventas de Hoy -->
      <div class="kpi-card kpi-ventas" aria-label="Ventas de hoy">
        <div class="kpi-icon">
          <i class="fas fa-dollar-sign"></i>
        </div>
        <div class="kpi-info">
          <span class="kpi-value" data-counter="${datosReportes.ventasHoy}">0</span>
          <span class="kpi-label">Ventas Hoy</span>
        </div>
        <div class="kpi-change kpi-positive">
          <i class="fas fa-arrow-up"></i> +12.5%
        </div>
      </div>

      <!-- Pedidos Pendientes -->
      <div class="kpi-card kpi-pedidos" aria-label="Pedidos pendientes">
        <div class="kpi-icon">
          <i class="fas fa-shopping-cart"></i>
        </div>
        <div class="kpi-info">
          <span class="kpi-value" data-counter="${datosReportes.pedidosPendientes}">0</span>
          <span class="kpi-label">Pedidos Pendientes</span>
        </div>
        <div class="kpi-change kpi-negative">
          <i class="fas fa-arrow-down"></i> -3.2%
        </div>
      </div>

      <!-- Inventario Bajo -->
      <div class="kpi-card kpi-inventario" aria-label="Productos con inventario bajo">
        <div class="kpi-icon">
          <i class="fas fa-boxes-stacked"></i>
        </div>
        <div class="kpi-info">
          <span class="kpi-value" data-counter="${datosReportes.inventarioBajo}">0</span>
          <span class="kpi-label">Inventario Bajo</span>
        </div>
        <div class="kpi-change kpi-warning">
          <i class="fas fa-exclamation-circle"></i> Atención
        </div>
      </div>

      <!-- Clientes Nuevos -->
      <div class="kpi-card kpi-clientes" aria-label="Clientes nuevos este mes">
        <div class="kpi-icon">
          <i class="fas fa-user-plus"></i>
        </div>
        <div class="kpi-info">
          <span class="kpi-value" data-counter="${datosReportes.clientesNuevos}">0</span>
          <span class="kpi-label">Clientes Nuevos</span>
        </div>
        <div class="kpi-change kpi-positive">
          <i class="fas fa-arrow-up"></i> +8.1%
        </div>
      </div>
    </div>

    <!-- ═══ GRÁFICO DE VENTAS MENSUALES (CSS) ═══ -->
    <div class="dashboard-grid fade-in">
      <div class="card chart-card">
        <div class="card-header">
          <h3><i class="fas fa-chart-bar"></i> Ventas Mensuales</h3>
          <span class="card-badge">Últimos 6 meses</span>
        </div>
        <div class="chart-container">
          <div class="bar-chart" role="img" aria-label="Gráfico de barras de ventas mensuales">
            ${datosReportes.ventasMensuales.map(v => {
              const porcentaje = (v.total / maxVenta) * 100;
              return `
                <div class="bar-group">
                  <div class="bar-value">${formatCurrency(v.total)}</div>
                  <div class="bar" style="height: ${porcentaje}%;" title="${v.mes}: ${formatCurrency(v.total)}"></div>
                  <div class="bar-label">${v.mes.substring(0, 3)}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- ═══ PEDIDOS RECIENTES ═══ -->
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-clock"></i> Pedidos Recientes</h3>
          <button class="btn btn-sm btn-ghost" onclick="navigateTo('pedidos')" aria-label="Ver todos los pedidos">
            Ver todos <i class="fas fa-arrow-right"></i>
          </button>
        </div>
        <div class="table-responsive">
          <table class="data-table" aria-label="Tabla de pedidos recientes">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${pedidosRecientes.map(p => `
                <tr>
                  <td><strong>${p.numero}</strong></td>
                  <td>${p.cliente}</td>
                  <td>${formatCurrency(p.total)}</td>
                  <td>${getStatusBadge(p.estado)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ═══ ALERTAS DE INVENTARIO BAJO ═══ -->
    <div class="card fade-in" style="margin-top: 1.5rem;">
      <div class="card-header">
        <h3><i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i> Alertas de Stock Bajo</h3>
        <button class="btn btn-sm btn-ghost" onclick="navigateTo('inventario')" aria-label="Ver inventario completo">
          Ver inventario <i class="fas fa-arrow-right"></i>
        </button>
      </div>
      <div class="table-responsive">
        <table class="data-table" aria-label="Tabla de alertas de inventario bajo">
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Stock Actual</th>
              <th>Stock Mínimo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${productoBajoStock.map(item => `
              <tr class="low-stock-row">
                <td><code>${item.codigo}</code></td>
                <td>${item.nombre}</td>
                <td><strong class="text-danger">${item.stock}</strong></td>
                <td>${item.stockMinimo}</td>
                <td>${getStatusBadge(item.stock === 0 ? 'Sin Stock' : 'Bajo Stock')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Animar contadores KPI después de renderizar
  setTimeout(() => {
    document.querySelectorAll('.kpi-value[data-counter]').forEach(el => {
      const target = parseInt(el.dataset.counter);
      // Si el valor es grande (ventas), formatear como moneda
      if (target > 10000) {
        animateCounter(el, target, 2000);
        // Después de la animación, formatear como moneda
        setTimeout(() => {
          el.textContent = formatCurrency(target);
        }, 2100);
      } else {
        animateCounter(el, target, 1200);
      }
    });
  }, 300);
};


// ═══════════════════════════════════════════════════════════════════════════
//  RENDERIZADORES DE MÓDULOS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Renderiza la vista de Productos con tabla, filtros y acciones CRUD
 */
const renderProductos = () => {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  mainContent.innerHTML = `
    <div class="content-header">
      <h2><i class="fas fa-tshirt"></i> Productos</h2>
      <p class="content-subtitle">Gestión del catálogo de productos H&M</p>
    </div>

    <!-- Barra de herramientas -->
    <div class="toolbar fade-in">
      <div class="toolbar-left">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="text" id="buscarProducto" placeholder="Buscar producto..." 
                 aria-label="Buscar producto" class="search-input">
        </div>
        <select id="filtroCategoria" class="filter-select" aria-label="Filtrar por categoría">
          <option value="">Todas las categorías</option>
          <option value="Camisetas">Camisetas</option>
          <option value="Pantalones">Pantalones</option>
          <option value="Vestidos">Vestidos</option>
          <option value="Chaquetas">Chaquetas</option>
          <option value="Faldas">Faldas</option>
          <option value="Sudaderas">Sudaderas</option>
          <option value="Blazers">Blazers</option>
          <option value="Shorts">Shorts</option>
          <option value="Camisas">Camisas</option>
        </select>
      </div>
      <button class="btn btn-primary" onclick="showToast('Formulario de nuevo producto próximamente', 'info')" aria-label="Agregar nuevo producto">
        <i class="fas fa-plus"></i> Nuevo Producto
      </button>
    </div>

    <!-- Tabla de productos -->
    <div class="card fade-in">
      <div class="table-responsive">
        <table class="data-table" id="tablaProductos" aria-label="Tabla de productos">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Nombre</th>
              <th>SKU</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${datosProductos.map(p => `
              <tr>
                <td><img src="${p.imagen}" alt="${p.nombre}" class="product-thumb" loading="lazy"></td>
                <td>
                  <strong>${p.nombre}</strong>
                  <br><small class="text-muted">${p.descripcion.substring(0, 50)}...</small>
                </td>
                <td><code>${p.sku}</code></td>
                <td><span class="category-tag">${p.categoria}</span></td>
                <td><strong>${formatCurrency(p.precio)}</strong></td>
                <td>
                  <span class="${p.stock <= 10 ? 'text-danger' : p.stock <= 30 ? 'text-warning' : 'text-success'}">
                    ${p.stock} uds.
                  </span>
                </td>
                <td>${getStatusBadge(p.estado)}</td>
                <td class="actions-cell">
                  <button class="btn-icon" title="Ver detalle" aria-label="Ver detalle de ${p.nombre}" onclick="showToast('Detalle de ${p.nombre}', 'info')">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn-icon" title="Editar" aria-label="Editar ${p.nombre}" onclick="showToast('Editando ${p.nombre}', 'info')">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn-icon btn-icon-danger" title="Eliminar" aria-label="Eliminar ${p.nombre}" onclick="confirmDelete('${p.nombre}', () => showToast('${p.nombre} eliminado', 'success'))">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Búsqueda en tiempo real para la tabla de productos
  const inputBuscar = document.getElementById('buscarProducto');
  const filtroCategoria = document.getElementById('filtroCategoria');

  const filtrarProductos = () => {
    const texto = inputBuscar.value.toLowerCase();
    const categoria = filtroCategoria.value;
    const filas = document.querySelectorAll('#tablaProductos tbody tr');

    filas.forEach(fila => {
      const nombre = fila.children[1].textContent.toLowerCase();
      const sku = fila.children[2].textContent.toLowerCase();
      const cat = fila.children[3].textContent.trim();
      const coincideTexto = nombre.includes(texto) || sku.includes(texto);
      const coincideCategoria = !categoria || cat === categoria;
      fila.style.display = coincideTexto && coincideCategoria ? '' : 'none';
    });
  };

  if (inputBuscar) inputBuscar.addEventListener('input', filtrarProductos);
  if (filtroCategoria) filtroCategoria.addEventListener('change', filtrarProductos);
};

/**
 * Renderiza la vista de Inventario con niveles de stock y alertas
 */
const renderInventario = () => {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  mainContent.innerHTML = `
    <div class="content-header">
      <h2><i class="fas fa-warehouse"></i> Inventario</h2>
      <p class="content-subtitle">Control de existencias y movimientos de inventario</p>
    </div>

    <!-- Resumen rápido de inventario -->
    <div class="mini-stats fade-in">
      <div class="mini-stat">
        <i class="fas fa-cubes"></i>
        <div>
          <strong>${datosInventario.reduce((sum, i) => sum + i.stock, 0)}</strong>
          <span>Total Unidades</span>
        </div>
      </div>
      <div class="mini-stat">
        <i class="fas fa-check-circle text-success"></i>
        <div>
          <strong>${datosInventario.filter(i => i.stock > i.stockMinimo).length}</strong>
          <span>Stock Normal</span>
        </div>
      </div>
      <div class="mini-stat">
        <i class="fas fa-exclamation-triangle text-warning"></i>
        <div>
          <strong>${datosInventario.filter(i => i.stock <= i.stockMinimo && i.stock > 0).length}</strong>
          <span>Stock Bajo</span>
        </div>
      </div>
      <div class="mini-stat">
        <i class="fas fa-times-circle text-danger"></i>
        <div>
          <strong>${datosInventario.filter(i => i.stock === 0).length}</strong>
          <span>Sin Stock</span>
        </div>
      </div>
    </div>

    <!-- Tabla de inventario -->
    <div class="card fade-in">
      <div class="card-header">
        <h3>Listado de Inventario</h3>
        <button class="btn btn-sm btn-primary" onclick="showToast('Exportar inventario próximamente', 'info')">
          <i class="fas fa-download"></i> Exportar
        </button>
      </div>
      <div class="table-responsive">
        <table class="data-table" aria-label="Tabla de inventario">
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Mínimo</th>
              <th>Precio Unit.</th>
              <th>Ubicación</th>
              <th>Última Actualización</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${datosInventario.map(item => {
              let estadoStock = 'Stock Normal';
              let claseStock = '';
              if (item.stock === 0) { estadoStock = 'Sin Stock'; claseStock = 'row-danger'; }
              else if (item.stock <= item.stockMinimo) { estadoStock = 'Bajo Stock'; claseStock = 'row-warning'; }
              return `
                <tr class="${claseStock}">
                  <td><code>${item.codigo}</code></td>
                  <td><strong>${item.nombre}</strong></td>
                  <td>${item.categoria}</td>
                  <td>
                    <div class="stock-indicator">
                      <div class="stock-bar">
                        <div class="stock-fill ${item.stock === 0 ? 'stock-empty' : item.stock <= item.stockMinimo ? 'stock-low' : 'stock-ok'}"
                             style="width: ${Math.min((item.stock / (item.stockMinimo * 3)) * 100, 100)}%"></div>
                      </div>
                      <span>${item.stock}</span>
                    </div>
                  </td>
                  <td>${item.stockMinimo}</td>
                  <td>${formatCurrency(item.precioUnitario)}</td>
                  <td><small>${item.ubicacion}</small></td>
                  <td>${formatDate(item.ultimaActualizacion)}</td>
                  <td>${getStatusBadge(estadoStock)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
};

/**
 * Renderiza la vista de Categorías con tarjetas de resumen
 */
const renderCategorias = () => {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  // Agrupar productos por categoría
  const categorias = {};
  datosProductos.forEach(p => {
    if (!categorias[p.categoria]) {
      categorias[p.categoria] = { count: 0, totalStock: 0, productos: [] };
    }
    categorias[p.categoria].count++;
    categorias[p.categoria].totalStock += p.stock;
    categorias[p.categoria].productos.push(p.nombre);
  });

  // Iconos para cada categoría
  const iconosCategorias = {
    'Camisetas': 'fa-tshirt', 'Pantalones': 'fa-person', 'Vestidos': 'fa-shirt',
    'Chaquetas': 'fa-vest', 'Faldas': 'fa-person-dress', 'Sudaderas': 'fa-shirt',
    'Blazers': 'fa-user-tie', 'Shorts': 'fa-person-running', 'Camisas': 'fa-shirt'
  };

  mainContent.innerHTML = `
    <div class="content-header">
      <h2><i class="fas fa-tags"></i> Categorías</h2>
      <p class="content-subtitle">Organización del catálogo por categorías de producto</p>
    </div>

    <div class="toolbar fade-in">
      <div class="toolbar-left">
        <span class="toolbar-info"><i class="fas fa-info-circle"></i> ${Object.keys(categorias).length} categorías activas</span>
      </div>
      <button class="btn btn-primary" onclick="showToast('Nueva categoría próximamente', 'info')">
        <i class="fas fa-plus"></i> Nueva Categoría
      </button>
    </div>

    <div class="categories-grid fade-in">
      ${Object.entries(categorias).map(([nombre, data]) => `
        <div class="category-card card" tabindex="0" aria-label="Categoría ${nombre}">
          <div class="category-icon">
            <i class="fas ${iconosCategorias[nombre] || 'fa-tag'}"></i>
          </div>
          <h3>${nombre}</h3>
          <div class="category-stats">
            <div class="cat-stat">
              <strong>${data.count}</strong>
              <span>Productos</span>
            </div>
            <div class="cat-stat">
              <strong>${data.totalStock}</strong>
              <span>En stock</span>
            </div>
          </div>
          <div class="category-products">
            ${data.productos.map(p => `<span class="mini-tag">${p}</span>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `;
};

/**
 * Renderiza la vista de Clientes con tabla y acciones
 */
const renderClientes = () => {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  mainContent.innerHTML = `
    <div class="content-header">
      <h2><i class="fas fa-users"></i> Clientes</h2>
      <p class="content-subtitle">Gestión de la cartera de clientes</p>
    </div>

    <div class="toolbar fade-in">
      <div class="toolbar-left">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="text" id="buscarCliente" placeholder="Buscar cliente..." 
                 aria-label="Buscar cliente" class="search-input">
        </div>
      </div>
      <button class="btn btn-primary" onclick="showToast('Formulario de nuevo cliente próximamente', 'info')">
        <i class="fas fa-user-plus"></i> Nuevo Cliente
      </button>
    </div>

    <div class="card fade-in">
      <div class="table-responsive">
        <table class="data-table" id="tablaClientes" aria-label="Tabla de clientes">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Ciudad</th>
              <th>Total Compras</th>
              <th>Última Compra</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${datosClientes.map(c => `
              <tr>
                <td>
                  <div class="client-info">
                    <div class="client-avatar">${c.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
                    <strong>${c.nombre}</strong>
                  </div>
                </td>
                <td><a href="mailto:${c.email}">${c.email}</a></td>
                <td>${c.telefono}</td>
                <td>${c.ciudad}</td>
                <td><strong>${formatCurrency(c.totalCompras)}</strong></td>
                <td>${formatDate(c.ultimaCompra)}</td>
                <td>${getStatusBadge(c.estado)}</td>
                <td class="actions-cell">
                  <button class="btn-icon" title="Ver perfil" aria-label="Ver perfil de ${c.nombre}">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn-icon" title="Editar" aria-label="Editar ${c.nombre}">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn-icon btn-icon-danger" title="Eliminar" aria-label="Eliminar ${c.nombre}" onclick="confirmDelete('${c.nombre}', () => showToast('Cliente eliminado', 'success'))">
                    <i class="fas fa-trash-alt"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Filtrado de clientes
  const inputBuscar = document.getElementById('buscarCliente');
  if (inputBuscar) {
    inputBuscar.addEventListener('input', () => {
      const texto = inputBuscar.value.toLowerCase();
      document.querySelectorAll('#tablaClientes tbody tr').forEach(fila => {
        const contenido = fila.textContent.toLowerCase();
        fila.style.display = contenido.includes(texto) ? '' : 'none';
      });
    });
  }
};

/**
 * Renderiza la vista de Pedidos con tabla y estados color-coded
 */
const renderPedidos = () => {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  mainContent.innerHTML = `
    <div class="content-header">
      <h2><i class="fas fa-shopping-bag"></i> Pedidos</h2>
      <p class="content-subtitle">Seguimiento y gestión de pedidos</p>
    </div>

    <div class="toolbar fade-in">
      <div class="toolbar-left">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="text" id="buscarPedido" placeholder="Buscar por número o cliente..." 
                 aria-label="Buscar pedido" class="search-input">
        </div>
        <select id="filtroEstadoPedido" class="filter-select" aria-label="Filtrar por estado">
          <option value="">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="En Proceso">En Proceso</option>
          <option value="Completado">Completado</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </div>
      <button class="btn btn-primary" onclick="showToast('Nuevo pedido próximamente', 'info')">
        <i class="fas fa-plus"></i> Nuevo Pedido
      </button>
    </div>

    <div class="card fade-in">
      <div class="table-responsive">
        <table class="data-table" id="tablaPedidos" aria-label="Tabla de pedidos">
          <thead>
            <tr>
              <th>Número</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Productos</th>
              <th>Total</th>
              <th>Método de Pago</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${datosPedidos.map(p => `
              <tr>
                <td><strong>${p.numero}</strong></td>
                <td>${p.cliente}</td>
                <td>${formatDate(p.fecha)}</td>
                <td>
                  <div class="product-list-cell">
                    ${p.productos.map(prod => `<span class="mini-tag">${prod}</span>`).join('')}
                  </div>
                </td>
                <td><strong>${formatCurrency(p.total)}</strong></td>
                <td><small>${p.metodoPago}</small></td>
                <td>${getStatusBadge(p.estado)}</td>
                <td class="actions-cell">
                  <button class="btn-icon" title="Ver detalle" aria-label="Ver detalle pedido ${p.numero}">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn-icon" title="Editar" aria-label="Editar pedido ${p.numero}">
                    <i class="fas fa-edit"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Filtrado de pedidos
  const inputBuscar = document.getElementById('buscarPedido');
  const filtroEstado = document.getElementById('filtroEstadoPedido');

  const filtrarPedidos = () => {
    const texto = inputBuscar ? inputBuscar.value.toLowerCase() : '';
    const estado = filtroEstado ? filtroEstado.value : '';
    document.querySelectorAll('#tablaPedidos tbody tr').forEach(fila => {
      const contenido = fila.textContent.toLowerCase();
      const estadoFila = fila.querySelector('.badge')?.textContent.trim() || '';
      const coincideTexto = contenido.includes(texto);
      const coincideEstado = !estado || estadoFila.includes(estado);
      fila.style.display = coincideTexto && coincideEstado ? '' : 'none';
    });
  };

  if (inputBuscar) inputBuscar.addEventListener('input', filtrarPedidos);
  if (filtroEstado) filtroEstado.addEventListener('change', filtrarPedidos);
};

/**
 * Renderiza la vista de Ventas con registros y resumen
 */
const renderVentas = () => {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  const totalVentas = datosVentas.reduce((sum, v) => sum + v.total, 0);

  mainContent.innerHTML = `
    <div class="content-header">
      <h2><i class="fas fa-cash-register"></i> Ventas</h2>
      <p class="content-subtitle">Registro y seguimiento de ventas realizadas</p>
    </div>

    <!-- Resumen de ventas -->
    <div class="mini-stats fade-in">
      <div class="mini-stat">
        <i class="fas fa-coins"></i>
        <div>
          <strong>${formatCurrency(totalVentas)}</strong>
          <span>Total Vendido</span>
        </div>
      </div>
      <div class="mini-stat">
        <i class="fas fa-receipt"></i>
        <div>
          <strong>${datosVentas.length}</strong>
          <span>Transacciones</span>
        </div>
      </div>
      <div class="mini-stat">
        <i class="fas fa-calculator"></i>
        <div>
          <strong>${formatCurrency(Math.round(totalVentas / datosVentas.length))}</strong>
          <span>Ticket Promedio</span>
        </div>
      </div>
    </div>

    <div class="card fade-in">
      <div class="table-responsive">
        <table class="data-table" aria-label="Tabla de ventas">
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Productos</th>
              <th>Total</th>
              <th>Vendedor</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${datosVentas.map(v => `
              <tr>
                <td>#${v.id}</td>
                <td>${formatDate(v.fecha)}</td>
                <td>${v.cliente}</td>
                <td><small>${v.productos}</small></td>
                <td><strong>${formatCurrency(v.total)}</strong></td>
                <td>${v.vendedor}</td>
                <td>${getStatusBadge(v.estado)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
};

/**
 * Renderiza la vista de Facturación con tabla de facturas
 */
const renderFacturacion = () => {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  mainContent.innerHTML = `
    <div class="content-header">
      <h2><i class="fas fa-file-invoice-dollar"></i> Facturación</h2>
      <p class="content-subtitle">Gestión de facturas electrónicas</p>
    </div>

    <div class="toolbar fade-in">
      <div class="toolbar-left">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="text" id="buscarFactura" placeholder="Buscar factura..." 
                 aria-label="Buscar factura" class="search-input">
        </div>
      </div>
      <button class="btn btn-primary" onclick="showToast('Nueva factura próximamente', 'info')">
        <i class="fas fa-plus"></i> Nueva Factura
      </button>
    </div>

    <div class="card fade-in">
      <div class="table-responsive">
        <table class="data-table" aria-label="Tabla de facturas">
          <thead>
            <tr>
              <th>Número</th>
              <th>Cliente</th>
              <th>Fecha</th>
              <th>Subtotal</th>
              <th>IVA (19%)</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${datosFacturas.map(f => `
              <tr>
                <td><strong>${f.numero}</strong></td>
                <td>${f.cliente}</td>
                <td>${formatDate(f.fecha)}</td>
                <td>${formatCurrency(f.subtotal)}</td>
                <td>${formatCurrency(f.iva)}</td>
                <td><strong>${formatCurrency(f.total)}</strong></td>
                <td>${getStatusBadge(f.estado)}</td>
                <td class="actions-cell">
                  <button class="btn-icon" title="Ver factura" aria-label="Ver factura ${f.numero}">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn-icon" title="Descargar PDF" aria-label="Descargar factura ${f.numero}">
                    <i class="fas fa-file-pdf"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
};

/**
 * Renderiza la vista de Proveedores
 */
const renderProveedores = () => {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  mainContent.innerHTML = `
    <div class="content-header">
      <h2><i class="fas fa-truck"></i> Proveedores</h2>
      <p class="content-subtitle">Directorio de proveedores y aliados comerciales</p>
    </div>

    <div class="toolbar fade-in">
      <div class="toolbar-left">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Buscar proveedor..." aria-label="Buscar proveedor" class="search-input">
        </div>
      </div>
      <button class="btn btn-primary" onclick="showToast('Nuevo proveedor próximamente', 'info')">
        <i class="fas fa-plus"></i> Nuevo Proveedor
      </button>
    </div>

    <div class="card fade-in">
      <div class="table-responsive">
        <table class="data-table" aria-label="Tabla de proveedores">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Contacto</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Productos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${datosProveedores.map(p => `
              <tr>
                <td><strong>${p.nombre}</strong></td>
                <td>${p.contacto}</td>
                <td><a href="mailto:${p.email}">${p.email}</a></td>
                <td>${p.telefono}</td>
                <td><small>${p.productos}</small></td>
                <td>${getStatusBadge(p.estado)}</td>
                <td class="actions-cell">
                  <button class="btn-icon" title="Ver detalle" aria-label="Ver detalle de ${p.nombre}">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn-icon" title="Editar" aria-label="Editar ${p.nombre}">
                    <i class="fas fa-edit"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
};

/**
 * Renderiza la vista de Empleados
 */
const renderEmpleados = () => {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  mainContent.innerHTML = `
    <div class="content-header">
      <h2><i class="fas fa-id-badge"></i> Empleados</h2>
      <p class="content-subtitle">Gestión del equipo de trabajo H&M</p>
    </div>

    <div class="toolbar fade-in">
      <div class="toolbar-left">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Buscar empleado..." aria-label="Buscar empleado" class="search-input">
        </div>
      </div>
      <button class="btn btn-primary" onclick="showToast('Nuevo empleado próximamente', 'info')">
        <i class="fas fa-user-plus"></i> Nuevo Empleado
      </button>
    </div>

    <div class="card fade-in">
      <div class="table-responsive">
        <table class="data-table" aria-label="Tabla de empleados">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Cargo</th>
              <th>Departamento</th>
              <th>Email</th>
              <th>Fecha Ingreso</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${datosEmpleados.map(e => `
              <tr>
                <td>
                  <div class="client-info">
                    <div class="client-avatar">${e.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>
                    <strong>${e.nombre}</strong>
                  </div>
                </td>
                <td>${e.cargo}</td>
                <td><span class="category-tag">${e.departamento}</span></td>
                <td><a href="mailto:${e.email}">${e.email}</a></td>
                <td>${formatDate(e.fechaIngreso)}</td>
                <td>${getStatusBadge(e.estado)}</td>
                <td class="actions-cell">
                  <button class="btn-icon" title="Ver perfil" aria-label="Ver perfil de ${e.nombre}">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn-icon" title="Editar" aria-label="Editar ${e.nombre}">
                    <i class="fas fa-edit"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
};

/**
 * Renderiza la vista de Reportes con gráficos y estadísticas
 */
const renderReportes = () => {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  // Calcular estadísticas
  const totalVentasMes = datosReportes.ventasMensuales.reduce((sum, v) => sum + v.total, 0);
  const promedioMensual = totalVentasMes / datosReportes.ventasMensuales.length;
  const maxVenta = Math.max(...datosReportes.ventasMensuales.map(v => v.total));

  // Ventas por vendedor
  const ventasPorVendedor = {};
  datosVentas.forEach(v => {
    ventasPorVendedor[v.vendedor] = (ventasPorVendedor[v.vendedor] || 0) + v.total;
  });

  // Pedidos por estado
  const pedidosPorEstado = {};
  datosPedidos.forEach(p => {
    pedidosPorEstado[p.estado] = (pedidosPorEstado[p.estado] || 0) + 1;
  });

  mainContent.innerHTML = `
    <div class="content-header">
      <h2><i class="fas fa-chart-pie"></i> Reportes</h2>
      <p class="content-subtitle">Análisis y métricas del negocio</p>
    </div>

    <div class="dashboard-grid fade-in">
      <!-- Gráfico de ventas mensuales -->
      <div class="card chart-card">
        <div class="card-header">
          <h3><i class="fas fa-chart-line"></i> Tendencia de Ventas</h3>
        </div>
        <div class="chart-container">
          <div class="bar-chart" role="img" aria-label="Gráfico de tendencia de ventas">
            ${datosReportes.ventasMensuales.map(v => {
              const porcentaje = (v.total / maxVenta) * 100;
              return `
                <div class="bar-group">
                  <div class="bar-value">${(v.total / 1000000).toFixed(1)}M</div>
                  <div class="bar" style="height: ${porcentaje}%;" title="${v.mes}: ${formatCurrency(v.total)}"></div>
                  <div class="bar-label">${v.mes.substring(0, 3)}</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Resumen de métricas -->
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-tachometer-alt"></i> Métricas Clave</h3>
        </div>
        <div class="metrics-list">
          <div class="metric-item">
            <span class="metric-label">Total Semestre</span>
            <span class="metric-value">${formatCurrency(totalVentasMes)}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Promedio Mensual</span>
            <span class="metric-value">${formatCurrency(promedioMensual)}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Mejor Mes</span>
            <span class="metric-value">${formatCurrency(maxVenta)}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Total Clientes</span>
            <span class="metric-value">${datosClientes.length}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Productos Activos</span>
            <span class="metric-value">${datosProductos.filter(p => p.estado === 'Activo').length}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Segunda fila de reportes -->
    <div class="dashboard-grid fade-in" style="margin-top: 1.5rem;">
      <!-- Ventas por vendedor -->
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-user-tie"></i> Ventas por Vendedor</h3>
        </div>
        <div class="table-responsive">
          <table class="data-table" aria-label="Ventas por vendedor">
            <thead>
              <tr><th>Vendedor</th><th>Total Ventas</th><th>Participación</th></tr>
            </thead>
            <tbody>
              ${Object.entries(ventasPorVendedor).map(([vendedor, total]) => `
                <tr>
                  <td><strong>${vendedor}</strong></td>
                  <td>${formatCurrency(total)}</td>
                  <td>
                    <div class="progress-bar-container">
                      <div class="progress-bar" style="width: ${(total / Object.values(ventasPorVendedor).reduce((a, b) => a + b, 0) * 100).toFixed(0)}%"></div>
                      <span>${(total / Object.values(ventasPorVendedor).reduce((a, b) => a + b, 0) * 100).toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pedidos por estado -->
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-list-check"></i> Pedidos por Estado</h3>
        </div>
        <div class="status-summary">
          ${Object.entries(pedidosPorEstado).map(([estado, cantidad]) => `
            <div class="status-item">
              ${getStatusBadge(estado)}
              <strong>${cantidad}</strong>
              <span>pedido${cantidad > 1 ? 's' : ''}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
};

/**
 * Renderiza la vista de Configuración con pestañas
 */
const renderConfiguracion = () => {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  mainContent.innerHTML = `
    <div class="content-header">
      <h2><i class="fas fa-cog"></i> Configuración</h2>
      <p class="content-subtitle">Preferencias y ajustes del sistema</p>
    </div>

    <!-- Pestañas de configuración -->
    <div class="config-tabs fade-in" role="tablist" aria-label="Pestañas de configuración">
      <button class="config-tab active" data-tab="general" role="tab" aria-selected="true">
        <i class="fas fa-sliders-h"></i> General
      </button>
      <button class="config-tab" data-tab="notificaciones" role="tab" aria-selected="false">
        <i class="fas fa-bell"></i> Notificaciones
      </button>
      <button class="config-tab" data-tab="seguridad" role="tab" aria-selected="false">
        <i class="fas fa-shield-alt"></i> Seguridad
      </button>
      <button class="config-tab" data-tab="apariencia" role="tab" aria-selected="false">
        <i class="fas fa-palette"></i> Apariencia
      </button>
    </div>

    <!-- Contenido de pestañas -->
    <div class="card fade-in" id="configContent">
      <div class="config-panel" id="panel-general" role="tabpanel">
        <h3>Configuración General</h3>
        <form class="config-form" onsubmit="event.preventDefault(); showToast('Configuración guardada', 'success')">
          <div class="form-group">
            <label for="nombreTienda">Nombre de la Tienda</label>
            <input type="text" id="nombreTienda" class="form-control" value="H&M Colombia" aria-label="Nombre de la tienda">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="emailTienda">Email de Contacto</label>
              <input type="email" id="emailTienda" class="form-control" value="admin@hm.com.co" aria-label="Email de contacto">
            </div>
            <div class="form-group">
              <label for="telefonoTienda">Teléfono</label>
              <input type="tel" id="telefonoTienda" class="form-control" value="+57 601 555 0123" aria-label="Teléfono">
            </div>
          </div>
          <div class="form-group">
            <label for="direccionTienda">Dirección</label>
            <input type="text" id="direccionTienda" class="form-control" value="Calle 85 #15-20, Bogotá, Colombia" aria-label="Dirección">
          </div>
          <div class="form-group">
            <label for="moneda">Moneda</label>
            <select id="moneda" class="form-control" aria-label="Moneda">
              <option value="COP" selected>Peso Colombiano (COP)</option>
              <option value="USD">Dólar Estadounidense (USD)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="iva">Porcentaje IVA</label>
            <input type="number" id="iva" class="form-control" value="19" min="0" max="100" aria-label="Porcentaje IVA">
          </div>
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Guardar Cambios</button>
        </form>
      </div>

      <div class="config-panel" id="panel-notificaciones" role="tabpanel" style="display:none;">
        <h3>Notificaciones</h3>
        <form class="config-form" onsubmit="event.preventDefault(); showToast('Preferencias de notificación guardadas', 'success')">
          <div class="toggle-group">
            <label class="toggle-label">
              <span>Notificaciones por Email</span>
              <input type="checkbox" class="toggle-input" checked>
              <span class="toggle-switch"></span>
            </label>
          </div>
          <div class="toggle-group">
            <label class="toggle-label">
              <span>Alertas de Inventario Bajo</span>
              <input type="checkbox" class="toggle-input" checked>
              <span class="toggle-switch"></span>
            </label>
          </div>
          <div class="toggle-group">
            <label class="toggle-label">
              <span>Notificaciones de Nuevos Pedidos</span>
              <input type="checkbox" class="toggle-input" checked>
              <span class="toggle-switch"></span>
            </label>
          </div>
          <div class="toggle-group">
            <label class="toggle-label">
              <span>Resumen Diario de Ventas</span>
              <input type="checkbox" class="toggle-input">
              <span class="toggle-switch"></span>
            </label>
          </div>
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Guardar Preferencias</button>
        </form>
      </div>

      <div class="config-panel" id="panel-seguridad" role="tabpanel" style="display:none;">
        <h3>Seguridad</h3>
        <form class="config-form" onsubmit="event.preventDefault(); showToast('Contraseña actualizada', 'success')">
          <div class="form-group">
            <label for="passActual">Contraseña Actual</label>
            <input type="password" id="passActual" class="form-control" aria-label="Contraseña actual" data-validacion="requerido">
          </div>
          <div class="form-group">
            <label for="passNueva">Nueva Contraseña</label>
            <input type="password" id="passNueva" class="form-control" aria-label="Nueva contraseña" data-validacion="password">
          </div>
          <div class="form-group">
            <label for="passConfirmar">Confirmar Contraseña</label>
            <input type="password" id="passConfirmar" class="form-control" aria-label="Confirmar contraseña" data-validacion="requerido">
          </div>
          <div class="toggle-group">
            <label class="toggle-label">
              <span>Autenticación de Dos Factores</span>
              <input type="checkbox" class="toggle-input">
              <span class="toggle-switch"></span>
            </label>
          </div>
          <button type="submit" class="btn btn-primary"><i class="fas fa-lock"></i> Actualizar Contraseña</button>
        </form>
      </div>

      <div class="config-panel" id="panel-apariencia" role="tabpanel" style="display:none;">
        <h3>Apariencia</h3>
        <form class="config-form" onsubmit="event.preventDefault(); showToast('Tema actualizado', 'success')">
          <div class="form-group">
            <label>Tema del Sistema</label>
            <div class="theme-options">
              <label class="theme-option active">
                <input type="radio" name="tema" value="dark" checked>
                <span class="theme-preview theme-dark"></span>
                <span>Oscuro</span>
              </label>
              <label class="theme-option">
                <input type="radio" name="tema" value="light">
                <span class="theme-preview theme-light"></span>
                <span>Claro</span>
              </label>
            </div>
          </div>
          <div class="form-group">
            <label for="colorPrimario">Color Primario</label>
            <input type="color" id="colorPrimario" class="form-control form-color" value="#E50010" aria-label="Color primario">
          </div>
          <div class="form-group">
            <label for="tamanoFuente">Tamaño de Fuente</label>
            <select id="tamanoFuente" class="form-control" aria-label="Tamaño de fuente">
              <option value="small">Pequeño</option>
              <option value="medium" selected>Mediano</option>
              <option value="large">Grande</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary"><i class="fas fa-palette"></i> Aplicar Cambios</button>
        </form>
      </div>
    </div>
  `;

  // Lógica de cambio de pestañas de configuración
  document.querySelectorAll('.config-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      // Desactivar todas las pestañas
      document.querySelectorAll('.config-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      // Ocultar todos los paneles
      document.querySelectorAll('.config-panel').forEach(p => p.style.display = 'none');

      // Activar la pestaña seleccionada
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const panelId = `panel-${tab.dataset.tab}`;
      const panel = document.getElementById(panelId);
      if (panel) panel.style.display = 'block';
    });
  });
};

/**
 * Renderiza la vista de Perfil del usuario
 */
const renderPerfil = () => {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  mainContent.innerHTML = `
    <div class="content-header">
      <h2><i class="fas fa-user-circle"></i> Mi Perfil</h2>
      <p class="content-subtitle">Información personal y preferencias de cuenta</p>
    </div>

    <div class="profile-layout fade-in">
      <!-- Tarjeta de perfil -->
      <div class="card profile-card">
        <div class="profile-header">
          <div class="profile-avatar" aria-label="Avatar del usuario">
            <i class="fas fa-user"></i>
          </div>
          <h3>Administrador H&M</h3>
          <p class="text-muted">admin@hm.com.co</p>
          <span class="badge badge-success"><i class="fas fa-check-circle"></i> Activo</span>
        </div>
        <div class="profile-details">
          <div class="profile-detail-item">
            <i class="fas fa-briefcase"></i>
            <span>Gerente General</span>
          </div>
          <div class="profile-detail-item">
            <i class="fas fa-building"></i>
            <span>H&M Colombia — Sede Principal</span>
          </div>
          <div class="profile-detail-item">
            <i class="fas fa-calendar"></i>
            <span>Miembro desde: Enero 2023</span>
          </div>
          <div class="profile-detail-item">
            <i class="fas fa-clock"></i>
            <span>Último acceso: ${formatDate(new Date())}</span>
          </div>
        </div>
      </div>

      <!-- Formulario de edición -->
      <div class="card profile-edit-card">
        <div class="card-header">
          <h3><i class="fas fa-edit"></i> Editar Información</h3>
        </div>
        <form class="config-form" onsubmit="event.preventDefault(); showToast('Perfil actualizado correctamente', 'success')">
          <div class="form-row">
            <div class="form-group">
              <label for="perfilNombre">Nombre Completo</label>
              <input type="text" id="perfilNombre" class="form-control" value="Administrador H&M" data-validacion="requerido" aria-label="Nombre completo">
            </div>
            <div class="form-group">
              <label for="perfilEmail">Email</label>
              <input type="email" id="perfilEmail" class="form-control" value="admin@hm.com.co" data-validacion="email" aria-label="Email">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="perfilTelefono">Teléfono</label>
              <input type="tel" id="perfilTelefono" class="form-control" value="+57 310 555 1234" data-validacion="telefono" aria-label="Teléfono">
            </div>
            <div class="form-group">
              <label for="perfilCiudad">Ciudad</label>
              <input type="text" id="perfilCiudad" class="form-control" value="Bogotá" aria-label="Ciudad">
            </div>
          </div>
          <div class="form-group">
            <label for="perfilBio">Biografía</label>
            <textarea id="perfilBio" class="form-control" rows="3" aria-label="Biografía">Gerente General de H&M Colombia. Apasionado por la moda sostenible y la innovación en retail.</textarea>
          </div>
          <button type="submit" class="btn btn-primary"><i class="fas fa-save"></i> Guardar Cambios</button>
        </form>
      </div>
    </div>
  `;
};


// ═══════════════════════════════════════════════════════════════════════════
//  ENRUTADOR DE PÁGINAS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Mapa de rutas a sus funciones de renderizado y metadatos
 * Cada entrada contiene: render (función), titulo, icono, breadcrumb
 */
const rutas = {
  'dashboard':     { render: renderDashboard,     titulo: 'Dashboard',      icono: 'fa-chart-line',          breadcrumb: ['Dashboard'] },
  'productos':     { render: renderProductos,     titulo: 'Productos',      icono: 'fa-tshirt',              breadcrumb: ['Dashboard', 'Productos'] },
  'inventario':    { render: renderInventario,    titulo: 'Inventario',     icono: 'fa-warehouse',           breadcrumb: ['Dashboard', 'Inventario'] },
  'categorias':    { render: renderCategorias,    titulo: 'Categorías',     icono: 'fa-tags',                breadcrumb: ['Dashboard', 'Categorías'] },
  'clientes':      { render: renderClientes,      titulo: 'Clientes',       icono: 'fa-users',               breadcrumb: ['Dashboard', 'Clientes'] },
  'pedidos':       { render: renderPedidos,       titulo: 'Pedidos',        icono: 'fa-shopping-bag',        breadcrumb: ['Dashboard', 'Pedidos'] },
  'ventas':        { render: renderVentas,        titulo: 'Ventas',         icono: 'fa-cash-register',       breadcrumb: ['Dashboard', 'Ventas'] },
  'facturacion':   { render: renderFacturacion,   titulo: 'Facturación',    icono: 'fa-file-invoice-dollar', breadcrumb: ['Dashboard', 'Facturación'] },
  'proveedores':   { render: renderProveedores,   titulo: 'Proveedores',    icono: 'fa-truck',               breadcrumb: ['Dashboard', 'Proveedores'] },
  'empleados':     { render: renderEmpleados,     titulo: 'Empleados',      icono: 'fa-id-badge',            breadcrumb: ['Dashboard', 'Empleados'] },
  'reportes':      { render: renderReportes,      titulo: 'Reportes',       icono: 'fa-chart-pie',           breadcrumb: ['Dashboard', 'Reportes'] },
  'configuracion': { render: renderConfiguracion, titulo: 'Configuración',  icono: 'fa-cog',                 breadcrumb: ['Dashboard', 'Configuración'] },
  'perfil':        { render: renderPerfil,        titulo: 'Mi Perfil',      icono: 'fa-user-circle',         breadcrumb: ['Dashboard', 'Perfil'] }
};

/**
 * Navega a una página específica del sistema
 * @param {string} page - Identificador de la página (ej: 'dashboard', 'productos')
 */
const navigateTo = (page) => {
  const ruta = rutas[page];
  if (!ruta) {
    showToast(`Página "${page}" no encontrada`, 'error');
    return;
  }

  // 1. Remover clase .active de todos los ítems del sidebar
  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.classList.remove('active');
  });

  // 2. Añadir .active al ítem actual del sidebar
  const sidebarItem = document.querySelector(`.sidebar-item[data-page="${page}"]`);
  if (sidebarItem) sidebarItem.classList.add('active');

  // 3. Actualizar breadcrumb en el header
  const breadcrumbContainer = document.getElementById('breadcrumb');
  if (breadcrumbContainer) {
    breadcrumbContainer.innerHTML = ruta.breadcrumb.map((item, index) => {
      if (index === 0 && ruta.breadcrumb.length > 1) {
        return `<a href="#" onclick="navigateTo('dashboard'); return false;" class="breadcrumb-link">
                  <i class="fas fa-home"></i> ${item}
                </a>`;
      }
      if (index === ruta.breadcrumb.length - 1) {
        return `<span class="breadcrumb-current">${item}</span>`;
      }
      return `<a href="#" class="breadcrumb-link">${item}</a>`;
    }).join('<i class="fas fa-chevron-right breadcrumb-separator"></i>');
  }

  // 4. Actualizar título del documento
  document.title = `${ruta.titulo} — H&M Sistema Administrativo`;

  // 5. Ejecutar la función de renderizado del módulo
  ruta.render();

  // 6. Añadir animación de entrada al contenido
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.classList.remove('content-fade-in');
    // Forzar reflow para reiniciar la animación
    void mainContent.offsetWidth;
    mainContent.classList.add('content-fade-in');
  }

  // 7. Scroll al inicio de la página
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // 8. Cerrar sidebar en móvil después de navegar
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar && window.innerWidth <= 768) {
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
  }
};

// Exponer navigateTo globalmente para los onclick
window.navigateTo = navigateTo;


// ═══════════════════════════════════════════════════════════════════════════
//  INICIALIZACIÓN DE LA APLICACIÓN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Función de inicialización principal
 * Se ejecuta cuando el DOM está completamente cargado
 */
const init = () => {
  // Verificar si estamos en la página de login
  const isLoginPage = document.body.classList.contains('login-page');
  if (isLoginPage) {
    // En la página de login no se renderiza el dashboard
    console.log('🔐 Página de inicio de sesión cargada');
    return;
  }

  // Verificar si existe el contenedor principal
  const mainContent = document.getElementById('main-content');
  if (!mainContent) {
    console.error('❌ No se encontró el contenedor #main-content');
    return;
  }

  // Renderizar el dashboard por defecto
  console.log('🚀 Inicializando Sistema Administrativo H&M...');
  navigateTo('dashboard');

  // Mostrar saludo basado en la hora
  const hora = new Date().getHours();
  let saludo = 'Buenos días';
  if (hora >= 12 && hora < 18) saludo = 'Buenas tardes';
  else if (hora >= 18) saludo = 'Buenas noches';

  setTimeout(() => {
    showToast(`${saludo}, Administrador. Bienvenido al sistema.`, 'success');
  }, 800);
};

// Ejecutar init cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);


// ═══════════════════════════════════════════════════════════════════════════
//  EXPORTACIONES GLOBALES (para uso desde otros archivos JS)
// ═══════════════════════════════════════════════════════════════════════════

// Exponer funciones y datos que pueden necesitar otros módulos
window.appData = {
  productos: datosProductos,
  clientes: datosClientes,
  pedidos: datosPedidos,
  ventas: datosVentas,
  inventario: datosInventario,
  proveedores: datosProveedores,
  empleados: datosEmpleados,
  facturas: datosFacturas,
  reportes: datosReportes
};

window.appHelpers = {
  formatCurrency,
  formatDate,
  getStatusBadge,
  animateCounter,
  showToast,
  showModal,
  closeModal,
  confirmDelete,
  navigateTo
};
