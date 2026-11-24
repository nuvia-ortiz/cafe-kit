# Pendientes — Cafe Kit

Revisado el 23-nov-2026.

## Estado comprobado
- CI en verde (lint, comprobación de tipos, pruebas unitarias y e2e, imagen Docker). Última ejecución: 23-nov-2026.
- La demo responde: https://cafe-kit.onrender.com/c/cafeteria-de-barrio (código 200).

## Lo que falta
1. **Rellenar el campo «Website» del repositorio** en GitHub con la URL de la demo. Hoy está vacío.
2. **Añadir una sección «Roadmap» al README**, como en VetMa y Snagkit.
3. **Precios de ejemplo de la demo:** son orientativos y no se han validado con precios reales de cafeterías.
4. **Guía para un café real**, paso a paso: disco persistente o `DATABASE_URL`, `SEED_DEMO=false`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`, `PUBLIC_URL`. Hoy está resumido en la sección *Deploy*.
5. **Las imágenes se guardan en la base de datos.** Vale para una demo; con muchas cafeterías conviene pasarlas a almacenamiento de archivos.
6. **El plan gratis de Render se duerme** a los 15 minutos: la primera carga puede tardar hasta un minuto. Ya está avisado en el README.

## Ideas (sin compromiso)
- Estadísticas por producto (más pedidos), además de las de QR frente a enlace.
- Servir de base para la web mínima del proyecto «Qué Hay Hoy».

## Diseño en Figma
- Archivo público de solo lectura con las pantallas reales como capas editables (24-nov-2026): https://www.figma.com/design/FjeMagWLgelsnHoSxjpqZV/Cafe-Kit-Diseno-de-la-web
- Enlazado en el README y en la web portfolio.
