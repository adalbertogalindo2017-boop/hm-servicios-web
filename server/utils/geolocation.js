/**
 * @module server/utils/geolocation
 * @description Funciones de geolocalización: cálculo de distancia Haversine
 * y búsqueda de técnicos cercanos.
 */

/**
 * Radio de la Tierra en kilómetros.
 * @constant {number}
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Convierte grados a radianes.
 * @param {number} degrees - Valor en grados.
 * @returns {number} Valor en radianes.
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine.
 * @param {number} lat1 - Latitud del punto 1.
 * @param {number} lon1 - Longitud del punto 1.
 * @param {number} lat2 - Latitud del punto 2.
 * @param {number} lon2 - Longitud del punto 2.
 * @returns {number} Distancia en kilómetros (redondeada a 2 decimales).
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;

  return Math.round(distance * 100) / 100; // 2 decimal places
}

/**
 * Busca técnicos disponibles dentro de un radio dado.
 * Usa la fórmula de Haversine para filtrar y ordenar por distancia.
 *
 * @param {import('better-sqlite3').Database} db - Instancia de la base de datos.
 * @param {number} lat - Latitud del cliente.
 * @param {number} lng - Longitud del cliente.
 * @param {number} [radiusKm=10] - Radio máximo de búsqueda en km.
 * @param {string} [category] - Categoría de servicio opcional para filtrar.
 * @returns {Array<Object>} Lista de técnicos con distancia, ordenados de más cercano a más lejano.
 */
function findNearbyTechnicians(db, lat, lng, radiusKm = 10, category = null) {
  // Fetch all available technicians with their coordinates
  const query = `
    SELECT
      u.id,
      u.name,
      u.email,
      u.phone,
      u.latitude,
      u.longitude,
      u.avatar,
      tp.specialties,
      tp.description,
      tp.coverage_radius_km,
      tp.rating_avg,
      tp.total_services,
      tp.is_available
    FROM users u
    INNER JOIN technician_profiles tp ON tp.user_id = u.id
    WHERE u.role = 'technician'
      AND u.is_active = 1
      AND tp.is_available = 1
      AND u.latitude IS NOT NULL
      AND u.longitude IS NOT NULL
  `;

  const technicians = db.prepare(query).all();

  // Calculate distance for each technician and filter by radius
  const nearby = technicians
    .map((tech) => {
      const distance = haversineDistance(lat, lng, tech.latitude, tech.longitude);
      // Parse specialties JSON
      let specialties = [];
      try {
        specialties = JSON.parse(tech.specialties || '[]');
      } catch {
        specialties = [];
      }

      return {
        ...tech,
        specialties,
        distance_km: distance,
      };
    })
    .filter((tech) => {
      // Filter by search radius and technician's own coverage
      const withinSearchRadius = tech.distance_km <= radiusKm;
      const withinTechCoverage = tech.distance_km <= tech.coverage_radius_km;

      // Optionally filter by category/specialty
      let matchesCategory = true;
      if (category) {
        matchesCategory = tech.specialties.some(
          (s) => s.toLowerCase().includes(category.toLowerCase())
        );
      }

      return withinSearchRadius && withinTechCoverage && matchesCategory;
    })
    .sort((a, b) => a.distance_km - b.distance_km);

  return nearby;
}

module.exports = {
  haversineDistance,
  findNearbyTechnicians,
};
