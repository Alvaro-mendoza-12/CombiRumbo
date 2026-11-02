# CombiRumbo Chiclayo 🚌

> **"Tu combi, sin adivinar" / "Your transit, no guesswork."**  
> An open-access mobile Progressive Web App (PWA) built with **Kiro** for the **Kiroween 2026 Hackathon** (*Frankenstein Category*).

[![Tests](https://img.shields.io/badge/tests-33%20passed%20(100%25)-brightgreen.svg)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)]()
[![PWA Ready](https://img.shields.io/badge/PWA-offline%20ready-orange.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

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

1. **OpenStreetMap GIS Mapping Layer:** Real street geometry and landmark positioning with full ODbL attribution.
2. **Topological Routing Graph:** A breadth-first search (BFS) routing engine that prioritizes minimal transfers, calculates walking distances between connecting stops, and accounts for per-ride fare structures.
3. **Decaying Field Observation Protocol:** A data engine where every route, stop, and segment has an observer code, verification date, and a 30-day review decay window (`reviewAfter`). Data older than 30 days automatically transitions to `aging` and is excluded from active recommendations.
4. **Decentralized Ephemeral Passenger Signals:** Crowd-sourced observation reports that expire automatically in 20 minutes with anti-spam rate limiting (maximum 10 reports per 5-minute bucket per route). Passenger reports are cleanly decoupled from the verified catalog and **never contaminate ground truth**.

---

## ✨ Key Features

- **Zero-Account Access:** Publicly usable without creating an account or signing in.
- **Privacy First & Local Geolocation:** GPS is completely optional. If granted, coordinates are processed solely on the device to locate the nearest stop; no location history or personal trajectory is transmitted or stored.
- **Honest "No Route Found" State:** If a query falls outside the verified pilot corridors, CombiRumbo shows a transparent explanation rather than hallucinating paths.
- **Bilingual Interface:** Real-time toggle between **Español (Perú)** and **English** for international review.
- **Full Offline PWA:** Automatic Service Worker runtime caching of verified catalog data and OSM tiles with synchronization timestamps.

---

## 🛠️ How Kiro was Used

This project was built from scratch leveraging Kiro's core capabilities:
- **Kiro Feature Specs (`.kiro/specs/`):** Guided the phased architecture:
  - `catalogo-recorridos`: Schema design, validator, CSV field importer, and aging lifecycle.
  - `busqueda-viaje`: Graph builder, BFS router, step-by-step instructions.
  - `mapa-offline`: Leaflet adapter, OSM tiles, offline cache, PWA service worker.
  - `reportes-pasajeros`: Ephemeral report store, 20-minute decay, anti-spam buckets.
  - `accesibilidad-entrega`: Bilingual translations, ARIA semantics, WCAG 2.2 AA tactile sizing (>=44px).
- **Kiro Steering (`.kiro/steering/`):** Enforced immutable constraints:
  - `product.md`: Pilot scope integrity, Chiclayo isolation.
  - `data-integrity.md`: Rejection of unverified sources, mandatory provenance.
  - `technology.md`: Lightweight TypeScript stack, zero secrets in repo, no `TEST_` fixtures in production.

---

## 🚀 Quick Start & Development

### Prerequisites
- Node.js v18+ (tested on Node v20 & v26)
- npm v9+

### Installation
```bash
git clone https://github.com/your-username/combirumbo-chiclayo.git
cd combirumbo-chiclayo
npm install
```

### Running the Test Suite
```bash
npm test
```
*Runs all 8 test suites with 33 unit and end-to-end integration tests.*

### Type Checking & Linting
```bash
npm run lint
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

## 🚢 Deploying to Vercel

The project includes an optimized [`vercel.json`](vercel.json) ready for immediate deployment:

1. Push your repository to **GitHub**.
2. Go to [Vercel](https://vercel.com/) and click **"Add New Project"**.
3. Import your GitHub repository.
4. Framework Preset will auto-detect as **Vite**.
5. Click **"Deploy"**.

---

## 📄 License & Attribution

- **Source Code:** Released under the [MIT License](LICENSE).
- **Cartography:** Map data &copy; [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors (ODbL).
