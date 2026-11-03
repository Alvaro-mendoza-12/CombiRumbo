# CombiRumbo Chiclayo 🚌

> **"Tu combi, sin adivinar" / "Your transit, no guesswork."**  
> An open-access mobile Progressive Web App (PWA) built for the **Kiroween 2026 Hackathon** (*Frankenstein Category*).

[![Tests](https://img.shields.io/badge/tests-35%20passed%20(100%25)-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)]()
[![PWA Ready](https://img.shields.io/badge/PWA-offline%20ready-orange.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-combirumbo--chiclayo.vercel.app-blueviolet.svg)](https://combirumbo-chiclayo.vercel.app)

---

## 🏆 Kiroween 2026 Hackathon Official Data

- **Hackathon Name:** Kiroween 2026
- **Organizer:** Kiro AI / Devpost
- **Submission Window:** October 30 – December 4, 2026
- **Evaluation Period:** December 16, 2026 – January 29, 2027
- **Total Prize Pool:** $100,000 USD (1st: $30,000, 2nd: $20,000, 3rd: $10,000, Track Prizes: $5,000 each)
- **Target Category Track:** **Frankenstein** (stitching together disparate, high-utility technologies into a cohesive, production-grade product).

---

## 🌎 Overview (English for International Judges)

**CombiRumbo** tackles a daily pain point for millions of transit riders across Latin America: navigating informal and semi-formal transit networks (combis, micros, colectivos) where routes, fares, and stops are rarely digitized, constantly shifting, or unverified.

### The Chiclayo Pilot
Rather than claiming false "global coverage" with fabricated data, **CombiRumbo delivers a 100% verified, observable pilot in Chiclayo, Peru**. The underlying architecture is strictly multi-city: every stop, route, and segment is bound to an explicit `cityId`, allowing other cities to adopt CombiRumbo once local field verification is conducted.

---

## 🧟 Why Frankenstein Category?

CombiRumbo stitches together four seemingly incompatible paradigms into a single, cohesive, high-utility transit tool:

```
                      ┌────────────────────────────────────────┐
                      │            CombiRumbo PWA              │
                      └───────────────────┬────────────────────┘
                                          │
       ┌────────────────────┬─────────────┴───────┬────────────────────┐
       ▼                    ▼                     ▼                    ▼
┌──────────────┐   ┌────────────────┐   ┌──────────────────┐   ┌───────────────┐
│ OpenStreetMap│   │ Topological    │   │ Strict Field     │   │ Ephemeral     │
│ Cartography  │   │ Graph Router   │   │ Protocol Ground  │   │ Passenger     │
│ & Polyline   │   │ & Fare Engine  │   │ Truth & Provenance│   │ Mesh (20 min) │
└──────────────┘   └────────────────┘   └──────────────────┘   └───────────────┘
```

1. **OpenStreetMap GIS Mapping Layer:** Real street geometry, road-following curved waypoints, and landmark positioning with full ODbL attribution.
2. **Topological Routing Graph:** A breadth-first search (BFS) routing engine that prioritizes minimal transfers, calculates walking distances between connecting stops, generates direct-walking itineraries for close proximity (<280m), and accounts for realistic per-ride fare structures (not per-intermediate stop).
3. **Decaying Field Observation Protocol:** A data engine where every route, stop, and segment has an observer code, verification date, and a 30-day review decay window (`reviewAfter`). Data older than 30 days automatically transitions to `aging` and is excluded from active recommendations.
4. **Decentralized Ephemeral Passenger Signals:** Crowd-sourced observation reports that expire automatically in 20 minutes with anti-spam rate limiting (maximum 10 reports per 5-minute bucket per route). Passenger reports are cleanly decoupled from the verified catalog and **never contaminate ground truth**.

---

## ✨ Key Features & Enhancements

- **Zero-Account Access:** Publicly usable without creating an account, email, or password.
- **Privacy-Preserving Geolocation:** GPS is completely optional. If granted, coordinates are processed solely on the device to locate the nearest stop; no location history or personal trajectory is transmitted or stored. Out-of-bounds locations (>35 km from Chiclayo) are cleanly detected with helpful feedback.
- **Bottom-Sheet Stop Picker:** Category chips (`🎓 Universidades`, `🛒 Mercados`, `🌊 Playas`, `🏛️ Centro`, `🏥 Salud`), search-as-you-type filter, and large touch targets (>=48px) designed for one-handed mobile use.
- **Instant Route Swap (⇄):** Invert origin and destination with one tap to check the return leg.
- **Realistic Transit Cues:**
  - Front windshield sign (`vehicleSign`) to identify the incoming combi in heavy traffic.
  - Distinct combi colors and body types (Toyota HiAce, Coaster).
  - Exact phrase to tell the conductor/driver when getting off (e.g. *"Baja en el puente peatonal USMP"*).
- **Interactive Leaflet Map:**
  - Origin marker (🟢 **A**), boarding combi badge (🚐), alighting badge (🛑), destination flag (🏁).
  - Dashed cyan line for pedestrian walking steps.
  - Solid route-colored lines tracing actual street curves along Av. Bolognesi, Av. Grau, and Carretera a Pimentel.
  - Auto-centering and bounds fitting (`fitBounds`).
- **Honest "No Route Found" State:** If a query falls outside the verified pilot corridors, CombiRumbo shows a transparent explanation rather than hallucinating paths.
- **Bilingual Interface:** Real-time toggle between **Español (Perú)** and **English** for international review.
- **Full Offline PWA:** Automatic Service Worker runtime caching of verified catalog data and OSM tiles with synchronization timestamps.

---

## 🎬 Live Demonstration Script (Step-by-Step for Judges)

You can test these real flows on [https://combirumbo-chiclayo.vercel.app](https://combirumbo-chiclayo.vercel.app) or locally:

### Flow 1: Primary Corridor (Óvalo Santa Victoria ➔ Campus USMP Chiclayo)
1. Open the app.
2. Tap **Punto de partida** (Origin) and select **Óvalo Santa Victoria** (Reference: *Cruce Av. Santa Victoria con Av. Grau*).
3. Tap **Destino deseado** (Destination) and select **USMP - Campus Chiclayo** (Reference: *Carretera a Pimentel km 5*).
4. Tap **Buscar ruta de combi**.
5. **Observe:** The recommended card appears showing `⏱️ 18 min`, `💰 S/ 2.50`, `LETRERO: CHICLAYO - PIMENTEL DIRECTO`, and `⭐ Ruta directa`.
6. Tap **Ver detalles del viaje**:
   - The interactive Leaflet map displays the exact route following the curves of Carretera a Pimentel.
   - Step 1 guides the passenger where to board (*"Esperar en la verma central"*).
   - Shows vehicle visual guide (*"Combi Toyota HiAce blanca con franja azul/naranja"*).
   - Step 2 gives the exact alighting phrase: *"Baja en el puente peatonal USMP"*.
   - Provenance box shows observation date (`2026-10-24`) and observer ID (`CIX-OBS-01`).

### Flow 2: Inverting Route with Swap (⇄)
1. From the search view, tap the **⇄** swap button.
2. The starting point becomes **USMP - Campus Chiclayo** and the destination becomes **Óvalo Santa Victoria**.
3. Tap **Buscar ruta de combi**.
4. **Observe:** The return route is displayed with reverse boarding cues and alighting instructions for returning to Chiclayo center.

### Flow 3: Short Walk Detection (< 280 m)
1. Select **Parque Principal de Chiclayo** as origin.
2. Select **Mercado Central** as destination (~240 meters away).
3. Tap **Buscar ruta**.
4. **Observe:** The router detects short proximity and returns a direct walking itinerary (`🚶 A pie directo`, 0 fare, walking minutes), avoiding unnecessary vehicle rides.

### Flow 4: Geolocation Bounds Protection
1. Tap **📍 Usar mi ubicación**.
2. If testing outside Chiclayo, Peru (e.g. internationally): the app cleanly warns that the detected GPS position is outside the pilot boundary (>35 km) and prompts the user to select a verified stop from the list without crashing or hanging.

### Flow 5: Crowd-Sourced Passenger Report (Ephemeral Mesh)
1. On any active route, tap **📢 Reportar novedad**.
2. Select an event (e.g. *"Combi pasó con espacio"*).
3. Tap **Publicar reporte**.
4. **Observe:** The report appears with an active countdown timer (expires in 20 minutes) and is stored locally without persisting to the ground truth catalog.

---

## 🛠️ How Kiro was Used

This project was built leveraging Kiro's core capabilities:
- **Kiro Feature Specs (`.kiro/specs/`):** Guided the phased architecture:
  - `catalogo-recorridos`: Schema design, validator, CSV field importer, and aging lifecycle.
  - `busqueda-viaje`: Graph builder, BFS router, step-by-step instructions.
  - `mapa-offline`: Leaflet adapter, OSM tiles, offline cache, PWA service worker.
  - `reportes-pasajeros`: Ephemeral report store, 20-minute decay, anti-spam buckets.
  - `accesibilidad-entrega`: Bilingual translations, ARIA semantics, WCAG 2.2 AA tactile sizing (>=48px).
- **Kiro Steering (`.kiro/steering/`):** Enforced immutable constraints:
  - `product.md`: Pilot scope integrity, Chiclayo isolation.
  - `data-integrity.md`: Rejection of unverified sources, mandatory provenance.
  - `technology.md`: Lightweight TypeScript stack, zero secrets in repo, no `TEST_` fixtures in production.

---

## 🚀 Quick Start & Development

### Prerequisites
- Node.js v18+ (tested on Node v20 & v22)
- npm v9+

### Installation
```bash
git clone https://github.com/Alvaro-mendoza-12/CombiRumbo.git
cd CombiRumbo
npm install
```

### Running the Test Suite
```bash
npm test
```
*Runs all 8 test suites with 35 unit and end-to-end integration tests.*

### Type Checking
```bash
npx tsc --noEmit
```

### Local Development Server
```bash
npm run dev
```

### Production Build & Preview
```bash
npm run build
npm run preview
```
Visit `http://localhost:4173/` in your browser.

---

## 🚢 Production Deployment

The project is continuously deployed to Vercel:
- Production URL: [https://combirumbo-chiclayo.vercel.app](https://combirumbo-chiclayo.vercel.app)
- Framework Preset: **Vite**

---

## 📄 License & Attribution

- **Source Code:** Released under the [MIT License](LICENSE).
- **Cartography:** Map data &copy; [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (ODbL).
