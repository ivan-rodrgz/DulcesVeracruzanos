# Dulces Típicos Veracruzanos

Sistema web desarrollado para un emprendimiento dedicado a la elaboración
y venta de dulces típicos de Veracruz.

El proyecto surge de la necesidad de llevar un mejor control de la
producción, inventario, pedidos, ventas y costos del negocio, además
de contar con un catálogo en línea para los clientes.

## Sitio web

[Visitar Dulces Típicos Veracruzanos](https://ivan-rodrgz.github.io/DulcesVeracruzanos/)

## Funcionalidades

### Tienda en línea

- Catálogo de productos.
- Consulta de precios y existencias.
- Carrito de compras.
- Generación de pedidos con folio.
- Envío de pedidos mediante WhatsApp.
- Diseño adaptable a computadoras y celulares.

### Panel administrativo

- Acceso mediante PIN.
- Dashboard de indicadores financieros.
- Registro de producción.
- Control de inventario.
- Registro de ventas directas.
- Administración y seguimiento de pedidos.
- Control de metas semanales de producción.
- Cálculo de costos, ingresos, utilidades y márgenes.
- Exportación de reportes en formato CSV.

## Tecnologías utilizadas

| Tecnología | Uso |
|---|---|
| HTML5 | Estructura de las páginas |
| CSS3 | Diseño y estilos |
| JavaScript | Lógica y funcionamiento del sistema |
| Supabase | Servicios backend y conexión con la base de datos |
| PostgreSQL | Almacenamiento de información |
| Chart.js | Gráficas del panel administrativo |
| GitHub Pages | Alojamiento del sitio web |

## Funcionamiento

Los clientes pueden consultar los productos disponibles, seleccionar
las cantidades y generar un pedido que posteriormente pueden enviar
por WhatsApp.

Desde el panel administrativo se pueden consultar los pedidos recibidos,
confirmarlos, cancelarlos o marcarlos como entregados.

Cuando se confirma un pedido, los productos quedan reservados en el
inventario. Al marcarlo como entregado, se registra la venta y se
actualizan los indicadores financieros.

La información se almacena en Supabase, lo que permite acceder al
sistema desde diferentes dispositivos sin depender del almacenamiento
local de una computadora.

## Estructura del proyecto

    DulcesVeracruzanos/
    ├── admin/
    │   ├── index.html
    │   └── login.html
    ├── css/
    │   ├── styles.css
    │   ├── admin.css
    │   └── login.css
    ├── js/
    │   ├── inicio.js
    │   ├── productos.js
    │   ├── catalogo.js
    │   ├── carrito.js
    │   ├── admin.js
    │   ├── auth.js
    │   └── supabase.js
    ├── img/
    │   ├── logo.png
    │   └── productos/
    ├── index.html
    ├── catalogo.html
    ├── carrito.html
    ├── confirmacion.html
    ├── .gitignore
    └── README.md

## Estado del proyecto

Actualmente, el sistema se encuentra desplegado en GitHub Pages
y conectado a una base de datos en la nube mediante Supabase.

El proyecto contempla futuras mejoras relacionadas con la seguridad,
la generación de reportes por periodos y la automatización de
notificaciones.

---

## Desarrollador

**Iván Rodríguez Hernandez**

Estudiante de Ingeniería en Sistemas Computacionales.

Proyecto desarrollado por mí, desde el diseño de la interfaz y la
programación del sistema hasta la implementación de la base de datos
y su despliegue en Internet.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-Iv%C3%A1n%20Rodr%C3%ADguez-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/iv%C3%A1n-rodr%C3%ADguez/)

[![GitHub](https://img.shields.io/badge/GitHub-ivan--rodrgz-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ivan-rodrgz)

