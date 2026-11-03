/**
 * Directorio curado de Lugares de Interés (POIs) y Destinos Clave de Chiclayo.
 * Permite buscar universidades (USMP, USS, USAT, UNPRG, UTP, UCV), hospitales,
 * centros comerciales (Real Plaza, Mall Aventura), terminales y puntos populares.
 * Vincula cada lugar al paradero verificado más cercano y calcula la distancia a pie.
 */

import type { Place } from '@/catalog/types';

export const CHICLAYO_PLACES: Place[] = [
  // =========================================================================
  // UNIVERSIDADES E INSTITUTOS
  // =========================================================================
  {
    id: 'place-usmp',
    cityId: 'chiclayo',
    name: 'Universidad de San Martín de Porres (USMP) - Campus Chiclayo',
    shortName: 'USMP Campus Chiclayo',
    category: 'university',
    address: 'Carretera a Pimentel km 5',
    landmarkContext: 'Frente a Puente Peatonal USMP, Carretera Chiclayo - Pimentel',
    lat: -6.8045,
    lon: -79.8820,
    aliases: ['usmp', 'san martin', 'universidad san martin de porres', 'san martín', 'usmp filial norte', 'puente peatonal usmp'],
    isVerifiedTransitStop: true,
    transitStopId: 'stop-usmp-campus-chiclayo',
  },
  {
    id: 'place-uss',
    cityId: 'chiclayo',
    name: 'Universidad Señor de Sipán (USS)',
    shortName: 'USS - Campus Universitario',
    category: 'university',
    address: 'Carretera a Pimentel km 5.5, Los Sauces',
    landmarkContext: 'Carretera a Pimentel km 5.5, a 850m de la USMP',
    lat: -6.8120,
    lon: -79.8965,
    aliases: ['uss', 'senor de sipan', 'señor de sipán', 'universidad señor de sipan', 'campus uss'],
    isVerifiedTransitStop: false,
    transitStopId: 'stop-usmp-campus-chiclayo',
  },
  {
    id: 'place-usat',
    cityId: 'chiclayo',
    name: 'Universidad Católica Santo Toribio de Mogrovejo (USAT)',
    shortName: 'USAT - Campus Central',
    category: 'university',
    address: 'Av. San Josemaría Escrivá de Balaguer 855',
    landmarkContext: 'Cruce con Av. Panamericana Norte, Urb. Los Parques',
    lat: -6.7628,
    lon: -79.8580,
    aliases: ['usat', 'santo toribio', 'universidad catolica', 'católica santo toribio de mogrovejo', 'mogrovejo', 'usat chiclayo'],
    isVerifiedTransitStop: false,
  },
  {
    id: 'place-unprg',
    cityId: 'chiclayo',
    name: 'Universidad Nacional Pedro Ruiz Gallo (UNPRG) - Lambayeque',
    shortName: 'UNPRG Ciudad Universitaria',
    category: 'university',
    address: 'Calle Juan XXIII 391, Lambayeque',
    landmarkContext: 'Ciudad Universitaria Lambayeque (11 km al norte de Chiclayo)',
    lat: -6.7080,
    lon: -79.9055,
    aliases: ['unprg', 'pedro ruiz gallo', 'universidad nacional pedro ruiz gallo', 'nacional lambayeque', 'ruiz gallo', 'la pedro'],
    isVerifiedTransitStop: false,
  },
  {
    id: 'place-utp',
    cityId: 'chiclayo',
    name: 'Universidad Tecnológica del Perú (UTP) - Chiclayo',
    shortName: 'UTP Chiclayo',
    category: 'university',
    address: 'Av. Panamericana Norte con Av. Los Incas',
    landmarkContext: 'Entrada sur de Chiclayo, frente a Urb. San Carlos',
    lat: -6.7790,
    lon: -79.8320,
    aliases: ['utp', 'universidad tecnologica del peru', 'utp chiclayo', 'tecnológica del perú'],
    isVerifiedTransitStop: false,
  },
  {
    id: 'place-ucv',
    cityId: 'chiclayo',
    name: 'Universidad César Vallejo (UCV) - Chiclayo',
    shortName: 'UCV Chiclayo',
    category: 'university',
    address: 'Carretera a Pimentel km 3.5',
    landmarkContext: 'Margen izquierda hacia Pimentel, pasando Los Parques',
    lat: -6.7930,
    lon: -79.8730,
    aliases: ['ucv', 'vallejo', 'universidad cesar vallejo', 'cesar vallejo', 'ucv chiclayo'],
    isVerifiedTransitStop: false,
    transitStopId: 'stop-ovalo-santa-victoria',
  },

  // =========================================================================
  // SALUD Y HOSPITALES
  // =========================================================================
  {
    id: 'place-hrl',
    cityId: 'chiclayo',
    name: 'Hospital Regional Lambayeque (HRL)',
    shortName: 'Hospital Regional',
    category: 'health',
    address: 'Vía de Evitamiento s/n con Av. Progreso',
    landmarkContext: 'Vía de Evitamiento Norte, ingreso principal de emergencias',
    lat: -6.7550,
    lon: -79.8450,
    aliases: ['hospital regional', 'regional lambayeque', 'hrl', 'regional'],
    isVerifiedTransitStop: false,
  },
  {
    id: 'place-almanzor',
    cityId: 'chiclayo',
    name: 'Hospital Nacional Almanzor Aguinaga Asenjo (EsSalud)',
    shortName: 'Hospital Almanzor Aguinaga',
    category: 'health',
    address: 'Plaza Bolognesi s/n con Av. Balta',
    landmarkContext: 'Plaza Bolognesi frente a Av. Salaverry',
    lat: -6.7735,
    lon: -79.8415,
    aliases: ['almanzor', 'almanzor aguinaga', 'essalud aguinaga', 'hospital aguinaga', 'seguro balta'],
    isVerifiedTransitStop: true,
    transitStopId: 'stop-ovalo-quinones',
  },
  {
    id: 'place-mercedes',
    cityId: 'chiclayo',
    name: 'Hospital Las Mercedes de Chiclayo',
    shortName: 'Hospital Las Mercedes',
    category: 'health',
    address: 'Av. Luis Gonzales con Calle Manuel María Izaga',
    landmarkContext: 'Esquina Luis Gonzales con Izaga, a 4 cuadras del Parque Principal',
    lat: -6.7760,
    lon: -79.8435,
    aliases: ['las mercedes', 'hospital las mercedes', 'mercedes chiclayo', 'posta las mercedes'],
    isVerifiedTransitStop: false,
  },

  // =========================================================================
  // MERCADOS Y CENTROS COMERCIALES
  // =========================================================================
  {
    id: 'place-mercado-modelo',
    cityId: 'chiclayo',
    name: 'Mercado Modelo de Chiclayo',
    shortName: 'Mercado Modelo',
    category: 'market',
    address: 'Calle Arica / Av. Balta',
    landmarkContext: 'Cruce Calle Arica con Av. José Balta, corazón comercial de Chiclayo',
    lat: -6.7695,
    lon: -79.8385,
    aliases: ['mercado modelo', 'modelo', 'calle arica', 'mercado central chiclayo', 'arica con balta'],
    isVerifiedTransitStop: true,
    transitStopId: 'stop-mercado-modelo',
  },
  {
    id: 'place-moshoqueque',
    cityId: 'chiclayo',
    name: 'Mercado Mayorista Moshoqueque',
    shortName: 'Mercado Moshoqueque',
    category: 'market',
    address: 'Av. Kennedy / Av. Bolívar, José Leonardo Ortiz',
    landmarkContext: 'Sector Comercial Moshoqueque, José Leonardo Ortiz',
    lat: -6.7590,
    lon: -79.8335,
    aliases: ['moshoqueque', 'mercado moshoqueque', 'jlo mercado', 'mayorista moshoqueque'],
    isVerifiedTransitStop: true,
    transitStopId: 'stop-mercado-moshoqueque',
  },
  {
    id: 'place-real-plaza',
    cityId: 'chiclayo',
    name: 'Real Plaza Chiclayo',
    shortName: 'Real Plaza',
    category: 'market',
    address: 'Av. Andrés Avelino Cáceres con Panamericana Norte',
    landmarkContext: 'Frente a Urbanización Santa Victoria / Av. Bolognesi',
    lat: -6.7845,
    lon: -79.8410,
    aliases: ['real plaza', 'real plaza chiclayo', 'mall real plaza', 'plaza bolognesi', 'cineplanet real plaza'],
    isVerifiedTransitStop: false,
    transitStopId: 'stop-ovalo-santa-victoria',
  },
  {
    id: 'place-mall-aventura',
    cityId: 'chiclayo',
    name: 'Mall Aventura Chiclayo',
    shortName: 'Mall Aventura',
    category: 'market',
    address: 'Panamericana Norte con Av. Víctor Raúl Haya de la Torre',
    landmarkContext: 'Salida norte de Chiclayo, frente a Urb. San Juan',
    lat: -6.7520,
    lon: -79.8390,
    aliases: ['mall aventura', 'mall aventura chiclayo', 'aventura plaza', 'ripley mall aventura'],
    isVerifiedTransitStop: false,
  },
  {
    id: 'place-mercado-central',
    cityId: 'chiclayo',
    name: 'Mercado Central de Chiclayo',
    shortName: 'Mercado Central',
    category: 'market',
    address: 'Calle Alfonso Ugarte con San José',
    landmarkContext: 'A 2 cuadras del Parque Principal',
    lat: -6.7730,
    lon: -79.8415,
    aliases: ['mercado central', 'central chiclayo', 'alfonso ugarte'],
    isVerifiedTransitStop: true,
    transitStopId: 'stop-mercado-central',
  },

  // =========================================================================
  // CENTRO CÍVICO, PARQUES Y TURISMO
  // =========================================================================
  {
    id: 'place-parque-principal',
    cityId: 'chiclayo',
    name: 'Parque Principal de Chiclayo (Plaza de Armas)',
    shortName: 'Parque Principal',
    category: 'center',
    address: 'Cruce Calle San José con Av. San Martín',
    landmarkContext: 'Frente a la Catedral de Chiclayo y Palacio Municipal',
    lat: -6.7715,
    lon: -79.8400,
    aliases: ['parque principal', 'plaza de armas', 'centro', 'catedral', 'parque chiclayo', 'palacio municipal'],
    isVerifiedTransitStop: true,
    transitStopId: 'stop-parque-principal',
  },
  {
    id: 'place-ovalo-santa-victoria',
    cityId: 'chiclayo',
    name: 'Óvalo Santa Victoria',
    shortName: 'Óvalo Santa Victoria',
    category: 'center',
    address: 'Av. Santa Victoria con Av. Grau',
    landmarkContext: 'Urb. Santa Victoria, frente a Restaurante El Rincón del Pato y bancos',
    lat: -6.7820,
    lon: -79.8480,
    aliases: ['ovalo santa victoria', 'óvalo santa victoria', 'santa victoria', 'grau con santa victoria'],
    isVerifiedTransitStop: true,
    transitStopId: 'stop-ovalo-santa-victoria',
  },
  {
    id: 'place-ovalo-quinones',
    cityId: 'chiclayo',
    name: 'Óvalo Quiñones',
    shortName: 'Óvalo Quiñones',
    category: 'transit-hub',
    address: 'Av. Quiñones con Av. Salaverry',
    landmarkContext: 'Monumento al héroe FAP José Quiñones Gonzales',
    lat: -6.7780,
    lon: -79.8450,
    aliases: ['ovalo quiñones', 'óvalo quiñones', 'quiñones', 'salaverry'],
    isVerifiedTransitStop: true,
    transitStopId: 'stop-ovalo-quinones',
  },
  {
    id: 'place-pimentel-balneario',
    cityId: 'chiclayo',
    name: 'Balneario y Muelle Histórico de Pimentel',
    shortName: 'Playa Pimentel (Muelle)',
    category: 'beach',
    address: 'Malecón Grau s/n, Pimentel',
    landmarkContext: 'Frente al Muelle de Madera de Pimentel y Malecón',
    lat: -6.8350,
    lon: -79.9340,
    aliases: ['pimentel', 'balneario pimentel', 'playa pimentel', 'muelle pimentel', 'malecon pimentel', 'playa'],
    isVerifiedTransitStop: true,
    transitStopId: 'stop-balneario-pimentel',
  },
  {
    id: 'place-las-musas',
    cityId: 'chiclayo',
    name: 'Paseo Las Musas',
    shortName: 'Paseo Las Musas',
    category: 'center',
    address: 'Calle Garcilaso de la Vega / Las Musas',
    landmarkContext: 'Parque temático de esculturas mitológicas, Urb. Santa Victoria',
    lat: -6.7795,
    lon: -79.8440,
    aliases: ['las musas', 'paseo las musas', 'parque las musas', 'musas'],
    isVerifiedTransitStop: false,
    transitStopId: 'stop-ovalo-santa-victoria',
  },

  // =========================================================================
  // TERMINALES DE TRANSPORTE Y AEROPUERTO
  // =========================================================================
  {
    id: 'place-terminal-terrestre',
    cityId: 'chiclayo',
    name: 'Terminal Terrestre de Pasajeros de Chiclayo',
    shortName: 'Terminal Terrestre',
    category: 'transit-hub',
    address: 'Av. Garcilaso de la Vega s/n con Av. Víctor Raúl Haya de la Torre',
    landmarkContext: 'Terminal Interprovincial sur de Chiclayo',
    lat: -6.7870,
    lon: -79.8415,
    aliases: ['terminal terrestre', 'terminal chiclayo', 'terminal de buses', 'terrapuerto'],
    isVerifiedTransitStop: false,
    transitStopId: 'stop-ovalo-santa-victoria',
  },
  {
    id: 'place-aeropuerto',
    cityId: 'chiclayo',
    name: 'Aeropuerto Internacional FAP José Abelardo Quiñones',
    shortName: 'Aeropuerto Chiclayo (CIX)',
    category: 'transit-hub',
    address: 'Av. Bolognesi final Este',
    landmarkContext: 'Terminal Aéreo de Chiclayo',
    lat: -6.7870,
    lon: -79.8280,
    aliases: ['aeropuerto', 'aeropuerto quiñones', 'aeropuerto chiclayo', 'cix', 'vuelos chiclayo'],
    isVerifiedTransitStop: false,
  },
  {
    id: 'place-terminal-bolognesi',
    cityId: 'chiclayo',
    name: 'Terminal de Colectivos Av. Bolognesi',
    shortName: 'Terminal Bolognesi',
    category: 'transit-hub',
    address: 'Av. Bolognesi cuadra 4',
    landmarkContext: 'Salida de colectivos hacia Monsefú, Reque y Santa Rosa',
    lat: -6.7765,
    lon: -79.8420,
    aliases: ['terminal bolognesi', 'colectivos monsefu', 'paradero bolognesi'],
    isVerifiedTransitStop: true,
    transitStopId: 'stop-bolognesi-balta',
  },
];

/**
 * Busca lugares en el directorio local por coincidencia de texto,
 * prefijos, siglas (USMP, USS, USAT) o categorías.
 */
export function searchLocalPlaces(query: string, cityId = 'chiclayo'): Place[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const cityPlaces = CHICLAYO_PLACES.filter(p => p.cityId === cityId);

  return cityPlaces
    .map(place => {
      let score = 0;
      const lowerName = place.name.toLowerCase();
      const lowerShort = (place.shortName ?? '').toLowerCase();

      // 1. Coincidencia exacta de alias o sigla (ej. "usmp", "usat", "uss")
      if (place.aliases.some(a => a === q)) {
        score += 100;
      } else if (place.aliases.some(a => a.startsWith(q))) {
        score += 80;
      } else if (place.aliases.some(a => a.includes(q))) {
        score += 60;
      }

      // 2. Coincidencia en nombre o nombre corto
      if (lowerShort === q) {
        score += 90;
      } else if (lowerName.includes(q)) {
        score += 50;
      }

      // 3. Coincidencia en contexto o dirección
      if (place.landmarkContext?.toLowerCase().includes(q) || place.address?.toLowerCase().includes(q)) {
        score += 30;
      }

      return { place, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.place);
}
