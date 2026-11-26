let datos = {
    producciones: [],
    ventas: [],
    inventario: []
};

let graficaFinanzas;
let graficaProduccion;
let temporizador;
let operacionEnCurso = false;

let pedidosAdmin = [];
let cargandoPedidos = false;

/* Conexión con Supabase */

async function operacionAdmin(accion, parametros = {}) {

    const resultado = await llamarFuncion("admin-operaciones", {
        ...parametros,
        accion: accion,
        token: obtenerToken()
    });

    if (!resultado.ok) {
        throw new Error(resultado.mensaje || "Error en la operación");
    }

    return resultado;
}

async function cargarDatos() {

    const resultado = await operacionAdmin("consultar");
    const informacion = resultado.datos;

    const productos = informacion.productos.map(p => ({
        id: Number(p.id),
        nombre: p.nombre,
        descripcion: p.descripcion,
        precio: Number(p.precio),
        costo: Number(p.costo),
        metaSemanal: Number(p.meta_semanal),
        imagen: p.imagen
    }));

    PRODUCTOS.splice(0, PRODUCTOS.length, ...productos);

    datos = {
        producciones: informacion.producciones || [],
        ventas: informacion.ventas || [],
        inventario: informacion.inventario || []
    };

    return datos;
}

async function ejecutarOperacion(accion, parametros, formulario) {

    if (operacionEnCurso) return;

    operacionEnCurso = true;

    const boton = formulario.querySelector('button[type="submit"]');

    boton.disabled = true;

    let registrada = false;

    try {

        const resultado = await operacionAdmin(accion, parametros);

        registrada = true;

        await cargarDatos();

        actualizarTodo();

        notificar(resultado.mensaje);

    } catch (error) {

        console.error(error);

        if (registrada) {

            alert(
                "La operación fue registrada, pero no se pudo actualizar el panel. Recarga la página."
            );

        } else {

            alert(
                error.message +
                ". Verifica el historial antes de volver a intentarlo."
            );

        }

    } finally {

        boton.disabled = false;
        operacionEnCurso = false;

    }
}

/* Funciones generales */

function elemento(id) {
    return document.getElementById(id);
}

function texto(id, valor) {
    elemento(id).textContent = valor;
}

function sumar(registros, campo) {

    return registros.reduce(
        (total, registro) => total + Number(registro[campo] ?? 0),
        0
    );
}

function fechaActual() {

    return new Date().toLocaleDateString("es-MX", {
        timeZone: "America/Mexico_City"
    });
}

function buscarProducto(id) {

    return PRODUCTOS.find(
        producto => producto.id === Number(id)
    );
}

function cantidadValida(cantidad) {

    return Number.isInteger(cantidad) &&
           cantidad > 0 &&
           cantidad <= 100000;
}

function escaparHTML(valor) {

    return String(valor ?? "").replace(
        /[&<>"']/g,
        caracter => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[caracter]
    );
}

function notificar(mensaje) {

    const aviso = elemento("notificacion");

    aviso.textContent = mensaje;
    aviso.style.display = "block";

    clearTimeout(temporizador);

    temporizador = setTimeout(() => {

        aviso.style.display = "none";

    }, 3000);
}

/* Navegación */

const titulos = {
    dashboard: "Dashboard",
    produccion: "Control de producción",
    inventario: "Inventario",
    ventas: "Registro de ventas",
    pedidos: "Gestión de pedidos",
    productos: "Productos",
    reportes: "Reportes financieros"
};

document.querySelectorAll(".menu-item").forEach(boton => {

    boton.addEventListener("click", () => {

        document.querySelectorAll(".menu-item")
            .forEach(item => item.classList.remove("active"));

        document.querySelectorAll(".page")
            .forEach(page => page.classList.remove("active"));

        boton.classList.add("active");

        const seccion = boton.dataset.seccion;

        elemento(seccion).classList.add("active");

        texto("titulo", titulos[seccion]);

        elemento("sidebar").classList.remove("open");

        if (seccion === "dashboard") {
            actualizarGraficas();
        }

        if (seccion === "pedidos") {
            cargarPedidos();
        }

    });

});

elemento("menu-toggle").addEventListener("click", () => {

    elemento("sidebar").classList.toggle("open");

});

texto("fecha", fechaActual());

/* Selectores de productos */

function cargarSelectores() {

    const opciones = PRODUCTOS.map(producto => `
        <option value="${producto.id}">
            ${escaparHTML(producto.nombre)}
        </option>
    `).join("");

    elemento("producto-produccion").innerHTML = opciones;

    elemento("producto-venta").innerHTML = opciones;
}

/* Inventario */

function obtenerInventario(id) {

    const registro = datos.inventario.find(
        item => Number(item.producto_id) === Number(id)
    );

    return {
        producidas: Number(registro?.producidas || 0),
        vendidas: Number(registro?.vendidas || 0),
        reservadas: Number(registro?.reservadas || 0),
        disponibles: Number(registro?.disponibles || 0)
    };
}

function mostrarInventario() {

    elemento("tabla-inventario").innerHTML =
        PRODUCTOS.map(producto => {

            const inventario = obtenerInventario(producto.id);

            let estado = "Disponible";
            let clase = "available";

            if (inventario.disponibles <= 0) {

                estado = "Sin existencias";
                clase = "empty";

            } else if (inventario.disponibles <= 10) {

                estado = "Existencias bajas";
                clase = "low";

            }

            return `
                <tr>

                    <td>

                        <div class="product-cell">

                            <img src="../${escaparHTML(producto.imagen)}"
                                 alt="${escaparHTML(producto.nombre)}">

                            ${escaparHTML(producto.nombre)}

                        </div>

                    </td>

                    <td>${inventario.producidas}</td>
                    <td>${inventario.vendidas}</td>
                    <td>${inventario.reservadas}</td>
                    <td>${inventario.disponibles}</td>

                    <td>

                        <span class="status ${clase}">
                            ${estado}
                        </span>

                    </td>

                </tr>
            `;

        }).join("");
}

/* Producción */

function calcularProduccion() {

    const producto = buscarProducto(
        elemento("producto-produccion").value
    );

    const cantidad = Number(
        elemento("cantidad-produccion").value
    );

    if (!producto || !cantidadValida(cantidad)) {

        texto("calculo-costo", moneda(0));
        texto("calculo-ingreso", moneda(0));
        texto("calculo-utilidad", moneda(0));

        return;
    }

    const costo = producto.costo * cantidad;

    const ingreso = producto.precio * cantidad;

    texto("calculo-costo", moneda(costo));

    texto("calculo-ingreso", moneda(ingreso));

    texto("calculo-utilidad", moneda(ingreso - costo));
}

elemento("producto-produccion")
    .addEventListener("change", calcularProduccion);

elemento("cantidad-produccion")
    .addEventListener("input", calcularProduccion);

elemento("form-produccion")
    .addEventListener("submit", async evento => {

        evento.preventDefault();

        const producto = buscarProducto(
            elemento("producto-produccion").value
        );

        const cantidad = Number(
            elemento("cantidad-produccion").value
        );

        if (!producto || !cantidadValida(cantidad)) {

            alert("Introduce una cantidad válida.");

            return;
        }

        await ejecutarOperacion(
            "registrar_produccion",
            {
                producto_id: producto.id,
                cantidad: cantidad
            },
            evento.currentTarget
        );

    });

function mostrarProducciones() {

    elemento("tabla-produccion").innerHTML =
        datos.producciones.length === 0
        ? `
            <tr>

                <td colspan="4">
                    No hay producciones registradas.
                </td>

            </tr>
          `
        : [...datos.producciones].reverse().map(registro => `

            <tr>

                <td>${escaparHTML(registro.fecha)}</td>

                <td>${escaparHTML(registro.producto)}</td>

                <td>${Number(registro.cantidad)}</td>

                <td>${moneda(registro.costoTotal)}</td>

            </tr>

        `).join("");
}

/* Ventas */

function calcularVenta() {

    const producto = buscarProducto(
        elemento("producto-venta").value
    );

    const cantidad = Number(
        elemento("cantidad-venta").value
    );

    if (!producto) return;

    const inventario = obtenerInventario(producto.id);

    texto(
        "stock-disponible",
        `Existencias disponibles: ${inventario.disponibles} piezas`
    );

    if (!cantidadValida(cantidad)) {

        texto("calculo-venta", moneda(0));

        texto("calculo-ganancia", moneda(0));

        return;
    }

    const ingreso = producto.precio * cantidad;

    const costo = producto.costo * cantidad;

    texto("calculo-venta", moneda(ingreso));

    texto("calculo-ganancia", moneda(ingreso - costo));
}

elemento("producto-venta")
    .addEventListener("change", calcularVenta);

elemento("cantidad-venta")
    .addEventListener("input", calcularVenta);

elemento("form-venta")
    .addEventListener("submit", async evento => {

        evento.preventDefault();

        const producto = buscarProducto(
            elemento("producto-venta").value
        );

        const cantidad = Number(
            elemento("cantidad-venta").value
        );

        if (!producto || !cantidadValida(cantidad)) {

            alert("Introduce una cantidad válida.");

            return;
        }

        const inventario = obtenerInventario(producto.id);

        if (cantidad > inventario.disponibles) {

            alert("No hay suficientes productos disponibles.");

            return;
        }

        await ejecutarOperacion(
            "registrar_venta",
            {
                producto_id: producto.id,
                cantidad: cantidad
            },
            evento.currentTarget
        );

    });

function mostrarVentas() {

    elemento("tabla-ventas").innerHTML =
        datos.ventas.length === 0
        ? `

            <tr>

                <td colspan="5">
                    No hay ventas registradas.
                </td>

            </tr>

          `
        : [...datos.ventas].reverse().map(registro => `

            <tr>

                <td>${escaparHTML(registro.fecha)}</td>

                <td>${escaparHTML(registro.producto)}</td>

                <td>${Number(registro.cantidad)}</td>

                <td>${moneda(registro.ingreso)}</td>

                <td>${moneda(registro.utilidad)}</td>

            </tr>

        `).join("");
}

/* Gestión de pedidos */

async function cargarPedidos() {

    if (cargandoPedidos) return;

    cargandoPedidos = true;

    const tabla = elemento("tabla-pedidos");

    tabla.innerHTML = `

        <tr>

            <td colspan="7">
                Cargando pedidos...
            </td>

        </tr>

    `;

    try {

        const respuesta = await operacionAdmin(
            "consultar_pedidos"
        );

        pedidosAdmin = respuesta.pedidos || [];

        actualizarIndicadoresPedidos();

        mostrarPedidos();

    } catch (error) {

        console.error(error);

        pedidosAdmin = [];

        actualizarIndicadoresPedidos();

        tabla.innerHTML = `

            <tr>

                <td colspan="7">
                    No se pudieron cargar los pedidos.
                </td>

            </tr>

        `;

    } finally {

        cargandoPedidos = false;

    }
}

function actualizarIndicadoresPedidos() {

    const estados = [
        "pendiente",
        "confirmado",
        "entregado",
        "cancelado"
    ];

    estados.forEach(estado => {

        const cantidad = pedidosAdmin.filter(
            pedido => pedido.estado === estado
        ).length;

        texto(
            "pedidos-" + estado + "s",
            cantidad
        );

    });
}

function mostrarPedidos() {

    const filtro = elemento("filtro-pedidos").value;

    const pedidos = pedidosAdmin.filter(pedido =>
        filtro === "todos" ||
        pedido.estado === filtro
    );

    const tabla = elemento("tabla-pedidos");

    if (pedidos.length === 0) {

        tabla.innerHTML = `

            <tr>

                <td colspan="7">
                    No hay pedidos para mostrar.
                </td>

            </tr>

        `;

        return;
    }

    tabla.innerHTML = pedidos.map(pedido => {

        const folio = "DTV-" +
            String(pedido.id).padStart(5, "0");

        const fecha = new Date(
            pedido.fecha
        ).toLocaleString("es-MX", {
            timeZone: "America/Mexico_City"
        });

        const productos = (pedido.productos || [])
            .map(producto => `

                <div>

                    ${Number(producto.cantidad)} x
                    ${escaparHTML(producto.nombre)}

                </div>

            `).join("");

        let acciones = "";

        if (pedido.estado === "pendiente") {

            acciones = `

                <button
                    type="button"
                    class="btn-pedido btn-confirmar"
                    onclick="cambiarEstadoPedido(
                        ${Number(pedido.id)}, 'confirmado'
                    )"
                >
                    Confirmar
                </button>

                <button
                    type="button"
                    class="btn-pedido btn-cancelar"
                    onclick="cambiarEstadoPedido(
                        ${Number(pedido.id)}, 'cancelado'
                    )"
                >
                    Cancelar
                </button>

            `;

        } else if (pedido.estado === "confirmado") {

            acciones = `

                <button
                    type="button"
                    class="btn-pedido btn-entregar"
                    onclick="cambiarEstadoPedido(
                        ${Number(pedido.id)}, 'entregado'
                    )"
                >
                    Entregar
                </button>

                <button
                    type="button"
                    class="btn-pedido btn-cancelar"
                    onclick="cambiarEstadoPedido(
                        ${Number(pedido.id)}, 'cancelado'
                    )"
                >
                    Cancelar
                </button>

            `;

        } else {

            acciones = "Pedido cerrado";

        }

        return `

            <tr>

                <td>

                    <strong>
                        ${escaparHTML(folio)}
                    </strong>

                </td>

                <td>${escaparHTML(fecha)}</td>

                <td>

                    <strong>
                        ${escaparHTML(pedido.cliente)}
                    </strong>

                    <div class="pedido-observaciones">

                        ${escaparHTML(pedido.observaciones)}

                    </div>

                </td>

                <td>${productos}</td>

                <td>${moneda(Number(pedido.total))}</td>

                <td>

                    <span class="estado-pedido estado-${escaparHTML(pedido.estado)}">

                        ${escaparHTML(pedido.estado)}

                    </span>

                </td>

                <td>

                    <div class="acciones-pedido">

                        ${acciones}

                    </div>

                </td>

            </tr>

        `;

    }).join("");

    if (operacionEnCurso) {

        document.querySelectorAll(".btn-pedido")
            .forEach(boton => {

                boton.disabled = true;

            });

    }
}

async function cambiarEstadoPedido(id, estado) {

    if (operacionEnCurso || cargandoPedidos) return;

    const mensajes = {

        confirmado:
            "¿Confirmar el pedido y reservar los productos?",

        entregado:
            "¿Registrar la entrega y contabilizar la venta?",

        cancelado:
            "¿Cancelar definitivamente este pedido?"

    };

    if (!mensajes[estado]) return;

    if (!confirm(mensajes[estado])) return;

    operacionEnCurso = true;

    document.querySelectorAll(".btn-pedido")
        .forEach(boton => {

            boton.disabled = true;

        });

    let registrado = false;

    try {

        const respuesta = await operacionAdmin(
            "cambiar_estado_pedido",
            {
                pedido_id: id,
                estado: estado
            }
        );

        registrado = true;

        await cargarDatos();

        actualizarTodo();

        notificar(respuesta.mensaje);

    } catch (error) {

        console.error(error);

        if (registrado) {

            alert(
                "El pedido fue actualizado, pero no se pudo sincronizar el panel. Recarga la página."
            );

        } else {

            alert(error.message);

        }

    } finally {

        operacionEnCurso = false;

        await cargarPedidos();

        document.querySelectorAll(".btn-pedido")
            .forEach(boton => {

                boton.disabled = false;

            });

    }
}

elemento("filtro-pedidos").addEventListener(
    "change",
    () => {

        if (!cargandoPedidos) {
            mostrarPedidos();
        }

    }
);

/* Productos */

function mostrarProductos() {

    elemento("tabla-productos").innerHTML =
        PRODUCTOS.map(producto => {

            const utilidad = producto.precio - producto.costo;

            const margen = producto.precio > 0
                ? utilidad / producto.precio * 100
                : 0;

            return `

                <tr>

                    <td>

                        <div class="product-cell">

                            <img src="../${escaparHTML(producto.imagen)}"
                                 alt="${escaparHTML(producto.nombre)}">

                            ${escaparHTML(producto.nombre)}

                        </div>

                    </td>

                    <td>${moneda(producto.costo)}</td>

                    <td>${moneda(producto.precio)}</td>

                    <td>${moneda(utilidad)}</td>

                    <td>${margen.toFixed(2)}%</td>

                    <td>${producto.metaSemanal} piezas</td>

                    <td>

                        <button class="btn btn-editar"
                            onclick="editarMeta(${producto.id})">

                            Editar

                        </button>

                    </td>

                </tr>

            `;

        }).join("");
}

async function editarMeta(id) {

    if (operacionEnCurso) return;

    const producto = buscarProducto(id);

    if (!producto) return;

    const valor = prompt(
        "Nueva meta semanal de " + producto.nombre,
        producto.metaSemanal
    );

    if (valor === null) return;

    const meta = Number(valor);

    if (
        valor.trim() === "" ||
        !Number.isInteger(meta) ||
        meta < 0 ||
        meta > 100000
    ) {

        alert("Introduce una meta válida.");

        return;
    }

    operacionEnCurso = true;

    try {

        await operacionAdmin("actualizar_meta", {
            producto_id: id,
            meta: meta
        });

        await cargarDatos();

        actualizarTodo();

        notificar(
            "Meta semanal actualizada correctamente."
        );

    } catch (error) {

        console.error(error);

        alert(
            "No se pudo completar la actualización. Recarga el panel para verificar los cambios."
        );

    } finally {

        operacionEnCurso = false;

    }
}

/* Dashboard */

function actualizarDashboard() {

    const meta = sumar(PRODUCTOS, "metaSemanal");

    const costoProyectado = PRODUCTOS.reduce(
        (total, p) => total + p.costo * p.metaSemanal,
        0
    );

    const ingresoProyectado = PRODUCTOS.reduce(
        (total, p) => total + p.precio * p.metaSemanal,
        0
    );

    const utilidadProyectada =
        ingresoProyectado - costoProyectado;

    const margen = ingresoProyectado > 0
        ? utilidadProyectada / ingresoProyectado * 100
        : 0;

    texto("total-productos", PRODUCTOS.length);

    texto("meta-produccion", meta + " piezas");

    texto("costo-proyectado", moneda(costoProyectado));

    texto("ingreso-proyectado", moneda(ingresoProyectado));

    texto("utilidad-proyectada", moneda(utilidadProyectada));

    texto("margen-proyectado", margen.toFixed(2) + "%");

    texto(
        "real-produccion",
        sumar(datos.producciones, "cantidad")
    );

    texto(
        "real-ventas",
        sumar(datos.ventas, "cantidad")
    );

    texto(
        "real-ingresos",
        moneda(sumar(datos.ventas, "ingreso"))
    );

    texto(
        "real-utilidad",
        moneda(sumar(datos.ventas, "utilidad"))
    );
}

/* Gráficas */

function actualizarGraficas() {

    if (typeof Chart === "undefined") return;

    if (!elemento("dashboard").classList.contains("active")) {

        return;
    }

    if (graficaFinanzas) graficaFinanzas.destroy();

    if (graficaProduccion) graficaProduccion.destroy();

    const nombres = PRODUCTOS.map(p => p.nombre);

    graficaFinanzas = new Chart(

        elemento("grafica-finanzas"),

        {

            type: "bar",

            data: {

                labels: nombres,

                datasets: [

                    {

                        label: "Costo proyectado",

                        data: PRODUCTOS.map(
                            p => p.costo * p.metaSemanal
                        ),

                        backgroundColor: "#e5a12b"

                    },

                    {

                        label: "Ingreso proyectado",

                        data: PRODUCTOS.map(
                            p => p.precio * p.metaSemanal
                        ),

                        backgroundColor: "#a51020"

                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                indexAxis: "y",

                scales: {

                    x: {

                        beginAtZero: true

                    }

                }

            }

        }

    );

    graficaProduccion = new Chart(

        elemento("grafica-produccion"),

        {

            type: "bar",

            data: {

                labels: nombres,

                datasets: [

                    {

                        label: "Meta semanal",

                        data: PRODUCTOS.map(
                            p => p.metaSemanal
                        ),

                        backgroundColor: "#e5a12b"

                    },

                    {

                        label: "Producción registrada",

                        data: PRODUCTOS.map(
                            p => obtenerInventario(p.id).producidas
                        ),

                        backgroundColor: "#27834b"

                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                indexAxis: "y",

                scales: {

                    x: {

                        beginAtZero: true

                    }

                }

            }

        }

    );
}

/* Reportes */

function actualizarReportes() {

    const costoProduccion = sumar(
        datos.producciones,
        "costoTotal"
    );

    const ingresos = sumar(datos.ventas, "ingreso");

    const costos = sumar(datos.ventas, "costo");

    const utilidad = ingresos - costos;

    const margen = ingresos > 0
        ? utilidad / ingresos * 100
        : 0;

    texto("reporte-produccion", moneda(costoProduccion));

    texto("reporte-ingresos", moneda(ingresos));

    texto("reporte-costos", moneda(costos));

    texto("reporte-utilidad", moneda(utilidad));

    texto("reporte-margen", margen.toFixed(2) + "%");
}

/* Exportación CSV */

function descargarCSV(nombre, encabezados, filas) {

    if (filas.length === 0) {

        alert("No existen registros para exportar.");

        return;
    }

    function escapar(valor) {

        let contenido = String(valor ?? "");

        if (
            typeof valor === "string" &&
            /^[\s]*[=+\-@\t\r\n]/.test(contenido)
        ) {

            contenido = "'" + contenido;

        }

        return '"' + contenido.replace(/"/g, '""') + '"';
    }

    const contenido = [
        encabezados,
        ...filas
    ].map(fila =>

        fila.map(escapar).join(",")

    ).join("\r\n");

    const archivo = new Blob(
        ["\uFEFF" + contenido],
        {
            type: "text/csv;charset=utf-8;"
        }
    );

    const url = URL.createObjectURL(archivo);

    const enlace = document.createElement("a");

    enlace.href = url;

    enlace.download = nombre;

    document.body.appendChild(enlace);

    enlace.click();

    enlace.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

elemento("exportar-ventas").addEventListener("click", () => {

    descargarCSV(

        "reporte_ventas.csv",

        [

            "Fecha",
            "Producto",
            "Cantidad",
            "Ingreso",
            "Costo",
            "Utilidad"

        ],

        datos.ventas.map(v => [

            v.fecha,
            v.producto,
            Number(v.cantidad),
            Number(v.ingreso),
            Number(v.costo),
            Number(v.utilidad)

        ])

    );

});

elemento("exportar-produccion")
    .addEventListener("click", () => {

        descargarCSV(

            "reporte_produccion.csv",

            [

                "Fecha",
                "Producto",
                "Cantidad",
                "Costo unitario",
                "Costo total"

            ],

            datos.producciones.map(p => [

                p.fecha,
                p.producto,
                Number(p.cantidad),
                Number(p.costoUnitario),
                Number(p.costoTotal)

            ])

        );

    });

/* Reiniciar registros */

elemento("reiniciar").disabled = true;

elemento("reiniciar").textContent =
    "Reinicio de registros deshabilitado";

/* Actualización general */

function actualizarTodo() {

    actualizarDashboard();

    mostrarInventario();

    mostrarProducciones();

    mostrarVentas();

    mostrarProductos();

    actualizarReportes();

    calcularProduccion();

    calcularVenta();

    actualizarGraficas();
}

/* Inicialización del panel */

async function iniciarPanel() {

    const botonProduccion = elemento("form-produccion")
        .querySelector('button[type="submit"]');

    const botonVenta = elemento("form-venta")
        .querySelector('button[type="submit"]');

    botonProduccion.disabled = true;

    botonVenta.disabled = true;

    try {

        if (!(await sesionActiva())) {

            window.location.replace("login.html");

            return;
        }

        await cargarDatos();

        cargarSelectores();

        actualizarTodo();

        await cargarPedidos();

        botonProduccion.disabled = false;

        botonVenta.disabled = false;

        notificar(
            "Información sincronizada correctamente."
        );

    } catch (error) {

        console.error(error);

        alert(
            "No fue posible cargar la información de Supabase."
        );

    }
}

iniciarPanel();