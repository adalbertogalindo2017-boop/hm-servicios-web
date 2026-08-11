"""
H&M Servicios — Backend en Python (Flask)
==========================================
Sirve la página estática (index.html, style.css, script.js) y expone una
API sencilla para:

  POST /api/agenda      -> registrar una solicitud de servicio
  POST /api/contacto    -> registrar un mensaje de contacto
  GET  /api/solicitudes -> listar solicitudes de servicio (panel admin)
  GET  /api/mensajes    -> listar mensajes de contacto (panel admin)
  GET  /admin           -> panel administrativo muy simple en HTML

Los datos se guardan en una base de datos SQLite local (hym.db), que se
crea automáticamente la primera vez que se ejecuta el servidor.

Cómo ejecutarlo:
    pip install flask
    python app.py
Luego abre: http://127.0.0.1:5000
"""

from __future__ import annotations

import sqlite3
from datetime import datetime
from pathlib import Path

import os

from flask import Flask, g, jsonify, request, send_from_directory

BASE_DIR = Path(__file__).resolve().parent
# En Vercel el sistema de archivos es de solo lectura salvo /tmp, por lo que
# ahi se guarda la base de datos SQLite cuando corre como funcion serverless.
DB_PATH = Path("/tmp/hym.db") if os.environ.get("VERCEL") else BASE_DIR / "hym.db"

app = Flask(__name__, static_folder=str(BASE_DIR), static_url_path="")


# ---------------------------------------------------------------------------
# Base de datos
# ---------------------------------------------------------------------------
def obtener_conexion() -> sqlite3.Connection:
    """Devuelve una conexión SQLite reutilizable durante la petición actual."""
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def cerrar_conexion(exception=None):  # noqa: ARG001
    db = g.pop("db", None)
    if db is not None:
        db.close()


def inicializar_base_datos() -> None:
    conexion = sqlite3.connect(DB_PATH)
    conexion.execute(
        """
        CREATE TABLE IF NOT EXISTS solicitudes_servicio (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            telefono TEXT NOT NULL,
            correo TEXT NOT NULL,
            servicio TEXT NOT NULL,
            direccion TEXT NOT NULL,
            fecha TEXT NOT NULL,
            franja TEXT NOT NULL,
            descripcion TEXT NOT NULL,
            estado TEXT NOT NULL DEFAULT 'pendiente',
            creado_en TEXT NOT NULL
        )
        """
    )
    conexion.execute(
        """
        CREATE TABLE IF NOT EXISTS mensajes_contacto (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            correo TEXT NOT NULL,
            mensaje TEXT NOT NULL,
            creado_en TEXT NOT NULL
        )
        """
    )
    conexion.commit()
    conexion.close()


# ---------------------------------------------------------------------------
# Validación básica de payloads
# ---------------------------------------------------------------------------
def validar_campos(datos: dict, campos_requeridos: list[str]) -> str | None:
    for campo in campos_requeridos:
        valor = datos.get(campo)
        if not isinstance(valor, str) or not valor.strip():
            return f"El campo '{campo}' es obligatorio."
    return None


# ---------------------------------------------------------------------------
# Rutas de archivos estáticos (frontend)
# ---------------------------------------------------------------------------
@app.route("/")
def servir_inicio():
    return send_from_directory(app.static_folder, "index.html")


# ---------------------------------------------------------------------------
# API: Agenda tu servicio
# ---------------------------------------------------------------------------
@app.route("/api/agenda", methods=["POST"])
def crear_solicitud_agenda():
    datos = request.get_json(silent=True) or {}

    error = validar_campos(
        datos,
        ["nombre", "telefono", "correo", "servicio", "direccion", "fecha", "franja", "descripcion"],
    )
    if error:
        return jsonify({"ok": False, "error": error}), 400

    conexion = obtener_conexion()
    cursor = conexion.execute(
        """
        INSERT INTO solicitudes_servicio
            (nombre, telefono, correo, servicio, direccion, fecha, franja, descripcion, estado, creado_en)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', ?)
        """,
        (
            datos["nombre"].strip(),
            datos["telefono"].strip(),
            datos["correo"].strip(),
            datos["servicio"].strip(),
            datos["direccion"].strip(),
            datos["fecha"].strip(),
            datos["franja"].strip(),
            datos["descripcion"].strip(),
            datetime.now().isoformat(timespec="seconds"),
        ),
    )
    conexion.commit()

    return jsonify({"ok": True, "id": cursor.lastrowid, "mensaje": "Solicitud registrada correctamente."}), 201


@app.route("/api/solicitudes", methods=["GET"])
def listar_solicitudes():
    conexion = obtener_conexion()
    filas = conexion.execute(
        "SELECT * FROM solicitudes_servicio ORDER BY id DESC"
    ).fetchall()
    return jsonify({"ok": True, "total": len(filas), "solicitudes": [dict(fila) for fila in filas]})


# ---------------------------------------------------------------------------
# API: Contacto
# ---------------------------------------------------------------------------
@app.route("/api/contacto", methods=["POST"])
def crear_mensaje_contacto():
    datos = request.get_json(silent=True) or {}

    error = validar_campos(datos, ["nombre", "correo", "mensaje"])
    if error:
        return jsonify({"ok": False, "error": error}), 400

    conexion = obtener_conexion()
    cursor = conexion.execute(
        """
        INSERT INTO mensajes_contacto (nombre, correo, mensaje, creado_en)
        VALUES (?, ?, ?, ?)
        """,
        (
            datos["nombre"].strip(),
            datos["correo"].strip(),
            datos["mensaje"].strip(),
            datetime.now().isoformat(timespec="seconds"),
        ),
    )
    conexion.commit()

    return jsonify({"ok": True, "id": cursor.lastrowid, "mensaje": "Mensaje registrado correctamente."}), 201


@app.route("/api/mensajes", methods=["GET"])
def listar_mensajes():
    conexion = obtener_conexion()
    filas = conexion.execute(
        "SELECT * FROM mensajes_contacto ORDER BY id DESC"
    ).fetchall()
    return jsonify({"ok": True, "total": len(filas), "mensajes": [dict(fila) for fila in filas]})


# ---------------------------------------------------------------------------
# Panel administrativo simple (solo lectura)
# ---------------------------------------------------------------------------
@app.route("/admin")
def panel_admin():
    conexion = obtener_conexion()
    solicitudes = conexion.execute(
        "SELECT * FROM solicitudes_servicio ORDER BY id DESC"
    ).fetchall()
    mensajes = conexion.execute(
        "SELECT * FROM mensajes_contacto ORDER BY id DESC"
    ).fetchall()

    filas_solicitudes = "".join(
        f"""<tr>
            <td>{s['id']}</td><td>{s['nombre']}</td><td>{s['telefono']}</td>
            <td>{s['correo']}</td><td>{s['servicio']}</td><td>{s['direccion']}</td>
            <td>{s['fecha']}</td><td>{s['franja']}</td><td>{s['estado']}</td>
            <td>{s['creado_en']}</td>
        </tr>"""
        for s in solicitudes
    ) or "<tr><td colspan='10'>No hay solicitudes registradas.</td></tr>"

    filas_mensajes = "".join(
        f"""<tr>
            <td>{m['id']}</td><td>{m['nombre']}</td><td>{m['correo']}</td>
            <td>{m['mensaje']}</td><td>{m['creado_en']}</td>
        </tr>"""
        for m in mensajes
    ) or "<tr><td colspan='5'>No hay mensajes registrados.</td></tr>"

    return f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Panel administrativo — H&amp;M Servicios</title>
        <style>
            body {{ font-family: Arial, sans-serif; background:#0f172a; color:#f8fafc; padding:2rem; }}
            h1 {{ color:#f97316; }}
            table {{ width:100%; border-collapse:collapse; margin-bottom:2.5rem; font-size:0.85rem; }}
            th, td {{ border:1px solid #263248; padding:0.6rem; text-align:left; }}
            th {{ background:#1e293b; color:#f97316; }}
            tr:nth-child(even) {{ background:rgba(255,255,255,0.03); }}
        </style>
    </head>
    <body>
        <h1>Panel administrativo — H&amp;M Servicios</h1>

        <h2>Solicitudes de servicio ({len(solicitudes)})</h2>
        <table>
            <tr>
                <th>ID</th><th>Nombre</th><th>Teléfono</th><th>Correo</th><th>Servicio</th>
                <th>Dirección</th><th>Fecha</th><th>Franja</th><th>Estado</th><th>Creado</th>
            </tr>
            {filas_solicitudes}
        </table>

        <h2>Mensajes de contacto ({len(mensajes)})</h2>
        <table>
            <tr><th>ID</th><th>Nombre</th><th>Correo</th><th>Mensaje</th><th>Creado</th></tr>
            {filas_mensajes}
        </table>
    </body>
    </html>
    """


inicializar_base_datos()

if __name__ == "__main__":
    print("H&M Servicios corriendo en http://127.0.0.1:5000")
    print("Panel administrativo en http://127.0.0.1:5000/admin")
    app.run(debug=True)
