/* =========================================================
   H&M SERVICIOS — script.js
   Menú móvil, scroll spy, apertura de servicios, validación
   y envío de formularios (Agenda / Contacto) al backend Flask.
   Si el backend no está disponible, guarda la solicitud
   localmente para no perder la información del usuario.
   ========================================================= */

(function () {
  "use strict";

  const API_BASE = ""; // mismo origen que sirve el backend Flask (app.py)

  document.getElementById("anioActual").textContent = new Date().getFullYear();

  /* ---------------- Menú móvil ---------------- */
  const menuToggle = document.getElementById("menuToggle");
  const nav = menuToggle ? menuToggle.closest(".nav-contenedor").querySelector("nav") : null;

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const abierto = nav.classList.toggle("abierto");
      menuToggle.classList.toggle("activo", abierto);
      menuToggle.setAttribute("aria-expanded", String(abierto));
    });

    document.querySelectorAll(".enlace-menu").forEach((enlace) => {
      enlace.addEventListener("click", () => {
        nav.classList.remove("abierto");
        menuToggle.classList.remove("activo");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------------- Resaltar enlace activo al hacer scroll ---------------- */
  const secciones = document.querySelectorAll("main section[id]");
  const enlacesMenu = document.querySelectorAll(".enlace-menu");

  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          const id = entrada.target.getAttribute("id");
          enlacesMenu.forEach((enlace) => {
            enlace.classList.toggle("activo", enlace.dataset.seccion === id);
          });
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );
  secciones.forEach((seccion) => observador.observe(seccion));

  /* ---------------- Ver más → desplaza y resalta el servicio ---------------- */
  document.querySelectorAll("[data-abrir-servicio]").forEach((boton) => {
    boton.addEventListener("click", () => {
      const clave = boton.dataset.abrirServicio;
      const destino = document.getElementById("servicio-" + clave);
      if (!destino) return;
      destino.scrollIntoView({ behavior: "smooth", block: "center" });
      document.querySelectorAll(".detalle-servicio").forEach((el) => el.classList.remove("resaltado"));
      destino.classList.add("resaltado");
      setTimeout(() => destino.classList.remove("resaltado"), 2600);
    });
  });

  /* ---------------- "Solicitar cotización" → precarga el formulario de agenda ---------------- */
  document.querySelectorAll("[data-agendar]").forEach((boton) => {
    boton.addEventListener("click", () => {
      const servicio = boton.dataset.agendar;
      const selectServicio = document.getElementById("agendaServicio");
      if (selectServicio) selectServicio.value = servicio;
      document.getElementById("agenda").scrollIntoView({ behavior: "smooth", block: "start" });
      const nombreInput = document.getElementById("agendaNombre");
      if (nombreInput) setTimeout(() => nombreInput.focus(), 500);
    });
  });

  /* ---------------- Fecha mínima = hoy en el formulario de agenda ---------------- */
  const agendaFecha = document.getElementById("agendaFecha");
  if (agendaFecha) {
    const hoy = new Date().toISOString().split("T")[0];
    agendaFecha.setAttribute("min", hoy);
  }

  /* ---------------- Utilidades de validación ---------------- */
  function mostrarError(input, mensaje) {
    const campo = input.closest(".campo");
    const spanError = campo ? campo.querySelector(".error-campo") : null;
    if (campo) campo.classList.toggle("campo-error", Boolean(mensaje));
    if (spanError) spanError.textContent = mensaje || "";
  }

  function validarCampoRequerido(input, mensaje) {
    if (!input.value || !input.value.trim()) {
      mostrarError(input, mensaje || "Este campo es obligatorio.");
      return false;
    }
    mostrarError(input, "");
    return true;
  }

  function validarCorreo(input) {
    const patron = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!patron.test(input.value.trim())) {
      mostrarError(input, "Ingresa un correo electrónico válido.");
      return false;
    }
    mostrarError(input, "");
    return true;
  }

  function validarTelefono(input) {
    const digitos = input.value.replace(/\D/g, "");
    if (digitos.length < 7) {
      mostrarError(input, "Ingresa un teléfono válido (mínimo 7 dígitos).");
      return false;
    }
    mostrarError(input, "");
    return true;
  }

  /* ---------------- Toast ---------------- */
  let toastTimeout;
  function mostrarToast(texto) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = texto;
    toast.classList.add("visible");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("visible"), 4200);
  }

  /* ---------------- Envío genérico con respaldo local ---------------- */
  async function enviarDatos(endpoint, datos, storageKey) {
    try {
      const respuesta = await fetch(API_BASE + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      if (!respuesta.ok) throw new Error("Respuesta no válida del servidor");
      return { ok: true, offline: false, data: await respuesta.json().catch(() => ({})) };
    } catch (error) {
      // El backend Python no está corriendo o falló: guardamos localmente
      // para no perder la solicitud del usuario.
      try {
        const previos = JSON.parse(localStorage.getItem(storageKey) || "[]");
        previos.push({ ...datos, guardadoEn: new Date().toISOString() });
        localStorage.setItem(storageKey, JSON.stringify(previos));
      } catch (e) {
        /* almacenamiento no disponible; continuamos sin bloquear al usuario */
      }
      return { ok: true, offline: true };
    }
  }

  /* ---------------- Formulario: Agenda tu servicio ---------------- */
  const formAgenda = document.getElementById("formAgenda");
  if (formAgenda) {
    formAgenda.addEventListener("submit", async (evento) => {
      evento.preventDefault();

      const nombre = document.getElementById("agendaNombre");
      const telefono = document.getElementById("agendaTelefono");
      const correo = document.getElementById("agendaCorreo");
      const servicio = document.getElementById("agendaServicio");
      const direccion = document.getElementById("agendaDireccion");
      const fecha = document.getElementById("agendaFecha");
      const franja = document.getElementById("agendaFranja");
      const descripcion = document.getElementById("agendaDescripcion");
      const mensajeEstado = document.getElementById("agendaMensaje");

      const validaciones = [
        validarCampoRequerido(nombre, "Ingresa tu nombre completo."),
        validarTelefono(telefono),
        validarCorreo(correo),
        validarCampoRequerido(servicio, "Selecciona un servicio."),
        validarCampoRequerido(direccion, "Ingresa la dirección del servicio."),
        validarCampoRequerido(fecha, "Selecciona una fecha."),
        validarCampoRequerido(franja, "Selecciona una franja horaria."),
        validarCampoRequerido(descripcion, "Describe brevemente el trabajo."),
      ];

      if (validaciones.includes(false)) {
        mensajeEstado.textContent = "Revisa los campos marcados en rojo.";
        mensajeEstado.className = "mensaje-formulario error";
        return;
      }

      const botonEnviar = formAgenda.querySelector("button[type=submit]");
      botonEnviar.disabled = true;
      botonEnviar.textContent = "Enviando...";

      const datos = {
        nombre: nombre.value.trim(),
        telefono: telefono.value.trim(),
        correo: correo.value.trim(),
        servicio: servicio.value,
        direccion: direccion.value.trim(),
        fecha: fecha.value,
        franja: franja.value,
        descripcion: descripcion.value.trim(),
      };

      const resultado = await enviarDatos("/api/agenda", datos, "hym_agenda_pendientes");

      botonEnviar.disabled = false;
      botonEnviar.textContent = "Enviar solicitud";

      if (resultado.ok) {
        mensajeEstado.textContent = resultado.offline
          ? "Solicitud guardada. Te contactaremos pronto (modo sin conexión al servidor)."
          : "¡Solicitud enviada! Un asesor de H&M Servicios te contactará pronto.";
        mensajeEstado.className = "mensaje-formulario exito";
        mostrarToast("Solicitud de servicio recibida ✅");
        formAgenda.reset();
        if (agendaFecha) agendaFecha.setAttribute("min", new Date().toISOString().split("T")[0]);
      } else {
        mensajeEstado.textContent = "No pudimos enviar tu solicitud. Intenta nuevamente.";
        mensajeEstado.className = "mensaje-formulario error";
      }
    });

    // Limpia el error al escribir
    formAgenda.querySelectorAll("input, select, textarea").forEach((campo) => {
      campo.addEventListener("input", () => mostrarError(campo, ""));
    });
  }

  /* ---------------- Formulario: Contacto ---------------- */
  const formContacto = document.getElementById("formContacto");
  if (formContacto) {
    formContacto.addEventListener("submit", async (evento) => {
      evento.preventDefault();

      const nombre = document.getElementById("contactoNombre");
      const correo = document.getElementById("contactoCorreo");
      const mensaje = document.getElementById("contactoMensaje");
      const mensajeEstado = document.getElementById("contactoMensajeEstado");

      const validaciones = [
        validarCampoRequerido(nombre, "Ingresa tu nombre."),
        validarCorreo(correo),
        validarCampoRequerido(mensaje, "Escribe tu mensaje."),
      ];

      if (validaciones.includes(false)) {
        mensajeEstado.textContent = "Revisa los campos marcados en rojo.";
        mensajeEstado.className = "mensaje-formulario error";
        return;
      }

      const botonEnviar = formContacto.querySelector("button[type=submit]");
      botonEnviar.disabled = true;
      botonEnviar.textContent = "Enviando...";

      const datos = {
        nombre: nombre.value.trim(),
        correo: correo.value.trim(),
        mensaje: mensaje.value.trim(),
      };

      const resultado = await enviarDatos("/api/contacto", datos, "hym_contacto_pendientes");

      botonEnviar.disabled = false;
      botonEnviar.textContent = "Enviar mensaje";

      if (resultado.ok) {
        mensajeEstado.textContent = resultado.offline
          ? "Mensaje guardado. Te responderemos pronto (modo sin conexión al servidor)."
          : "¡Mensaje enviado! Te responderemos muy pronto.";
        mensajeEstado.className = "mensaje-formulario exito";
        mostrarToast("Mensaje enviado ✅");
        formContacto.reset();
      } else {
        mensajeEstado.textContent = "No pudimos enviar tu mensaje. Intenta nuevamente.";
        mensajeEstado.className = "mensaje-formulario error";
      }
    });

    formContacto.querySelectorAll("input, select, textarea").forEach((campo) => {
      campo.addEventListener("input", () => mostrarError(campo, ""));
    });
  }
})();
