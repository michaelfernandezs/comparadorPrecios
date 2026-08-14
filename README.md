# PriceHunter — Comparador de precios

Full stack app que compara y rastrea precios de productos en Amazon, Mercado Libre y Liverpool mediante scraping automatizado, con historial de precios y alertas de bajada.

**[Ver demo en vivo](https://comparador-precios-beta.vercel.app)**

## Quick start (correr todo en local)

Requiere [Docker](https://www.docker.com/products/docker-desktop/) instalado. No necesitas crear ninguna cuenta externa (Supabase, GCP, etc.) — todo corre en contenedores locales, incluida la base de datos.

```bash
git clone https://github.com/michaelfernandezs/comparadorPrecios.git
cd comparadorPrecios
docker compose up --build
```

Abre **http://localhost:4200** — la app ya está corriendo, con su propio backend y base de datos local.

> Nota: como la base de datos local arranca vacía, usa el buscador de la app ("Buscar por nombre") para generar los primeros resultados.

## Stack técnico

| Capa | Tecnología |
|---|---|
| **Frontend** | Angular 21, TypeScript, Chart.js |
| **Backend** | NestJS, TypeORM, Puppeteer |
| **Base de datos** | PostgreSQL (Supabase en producción) |
| **Infraestructura cloud** | Google Cloud Run, Cloud Scheduler, Secret Manager, Artifact Registry |
| **CI/CD** | GitHub Actions |
| **Contenedores** | Docker, Docker Compose |

## Estructura del repo

```
comparadorPrecios/
├── docker-compose.yml     # Levanta todo el stack en local (DB + backend + frontend)
├── backend/                # API NestJS + scraper con Puppeteer
│   └── README.md            # Arquitectura cloud, decisiones técnicas y problemas resueltos
└── frontend/                # App Angular
```

## Documentación técnica a fondo

El detalle completo de la arquitectura de producción — por qué se separó el scraping en un Cloud Run Job, cómo se manejan los secretos, el pipeline de CI/CD, y los problemas reales que surgieron al desplegar (timeouts, SSL, selectores desactualizados, bloqueo de IPs de datacenter) — está documentado en **[`backend/README.md`](./backend/README.md)**.

## Producción

- **Frontend:** desplegado en Vercel, con deploy automático en cada push a `main`
- **Backend:** desplegado en Google Cloud Run, con CI/CD vía GitHub Actions ([`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml))
- **Scraping periódico:** Cloud Run Job disparado diariamente por Cloud Scheduler
