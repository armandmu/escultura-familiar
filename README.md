# Escultura Familiar Sistémica

Herramienta web interactiva para sesiones de psicoterapia sistémica: catálogo de 18 figuras con tamaño y color predeterminados, composición actual y deseada, arrastre libre, orientación y exportación SVG. Incluye dos vistas (profesional y paciente) y cursores visibles en tiempo real.

**Aplicación:** https://armandmu.github.io/escultura-familiar/

## Desarrollo

```bash
npm install
npm run dev
```

## Despliegue

GitHub Actions compila con Vite y despliega en GitHub Pages. Si es la primera publicación, activar **Settings > Pages > Build and deployment > Source: GitHub Actions**.

## Acceso a sesiones

La aplicación utiliza las funciones de sesión y la clave **publicable** de Supabase empleadas por Cartas Proyectivas (`cope_create_session`, `cope_join_session`, `cope_update_board`, `cope_close_session`). Repositorio y dirección web son independientes, pero **el servicio de sesiones es compartido**. No almacenes datos personales ni nombres completos de pacientes en las composiciones. Comprueba permisos, RLS y retención antes del uso clínico.

Los colores, tamaños, posiciones y direcciones son elecciones del paciente sin interpretación psicológica automática; la herramienta no es una prueba psicométrica validada.
