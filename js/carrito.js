const TELEFONO = "522297781347";

const lista = document.getElementById("lista-carrito");
const formulario = document.getElementById("form-pedido");
const botonPedido = formulario.querySelector('button[type="submit"]');

let catalogo = [];
let catalogoCargado = false;
let procesando = false;

function mostrarCarrito() {

    const carrito = obtenerCarrito();

    let total = 0;
    let cantidadTotal = 0;
    let pedidoValido = true;

    lista.innerHTML = "";

    if (carrito.length === 0) {

        lista.innerHTML = `
            <div class="empty">

                <h3>Tu pedido está vacío</h3>

                <p>Agrega productos desde nuestro catálogo.</p>

                <a href="catalogo.html" class="btn">
                    Ver productos
                </a>

            </div>
        `;

        pedidoValido = false;
    }

    carrito.forEach(item => {

        const producto = catalogo.find(
            p => p.id === item.id
        );

        if (!producto) {

            pedidoValido = false;

            lista.innerHTML += `
                <article class="cart-item">

                    <p>Producto no disponible.</p>

                    <button
                        class="remove-btn"
                        onclick="eliminarProducto(${item.id})"
                    >
                        Eliminar
                    </button>

                </article>
            `;

            return;
        }

        const subtotal = producto.precio * item.cantidad;

        const cantidadInvalida =
            !Number.isInteger(item.cantidad) ||
            item.cantidad <= 0 ||
            item.cantidad > producto.disponibles;

        if (cantidadInvalida) {
            pedidoValido = false;
        }

        total += subtotal;
        cantidadTotal += item.cantidad;

        lista.innerHTML += `
            <article class="cart-item">

                <img
                    src="${producto.imagen}"
                    alt="${producto.nombre}"
                >

                <div class="cart-details">

                    <h3>${producto.nombre}</h3>

                    <p>${moneda(producto.precio)} por pieza</p>

                    <p class="stock ${
                        cantidadInvalida
                        ? "stock-agotado"
                        : "stock-disponible"
                    }">

                        ${
                            producto.disponibles === 0
                            ? "Producto agotado"
                            : producto.disponibles + " piezas disponibles"
                        }

                    </p>

                    ${
                        cantidadInvalida
                        ? `<p class="stock-agotado">
                            Reduce la cantidad o elimina el producto.
                           </p>`
                        : ""
                    }

                    <div class="quantity">

                        <button
                            onclick="cambiarCantidad(${item.id}, -1)"
                        >
                            -
                        </button>

                        <span>${item.cantidad}</span>

                        <button
                            onclick="cambiarCantidad(${item.id}, 1)"
                            ${
                                item.cantidad >= producto.disponibles
                                ? "disabled"
                                : ""
                            }
                        >
                            +
                        </button>

                    </div>

                    <button
                        class="remove-btn"
                        onclick="eliminarProducto(${item.id})"
                    >
                        Eliminar
                    </button>

                </div>

                <strong>${moneda(subtotal)}</strong>

            </article>
        `;
    });

    document.getElementById("total").textContent =
        moneda(total);

    document.getElementById("cantidad-total").textContent =
        cantidadTotal;

    botonPedido.disabled =
        !catalogoCargado ||
        !pedidoValido ||
        procesando;
}

function cambiarCantidad(id, cambio) {

    if (procesando) return;

    let carrito = obtenerCarrito();

    const item = carrito.find(p => p.id === id);

    const producto = catalogo.find(p => p.id === id);

    if (!item || !producto) return;

    const nuevaCantidad = item.cantidad + cambio;

    if (
        cambio > 0 &&
        nuevaCantidad > producto.disponibles
    ) {

        alert("No hay más piezas disponibles.");

        return;
    }

    item.cantidad = nuevaCantidad;

    carrito = carrito.filter(
        p => p.cantidad > 0
    );

    guardarCarrito(carrito);

    mostrarCarrito();
}

function eliminarProducto(id) {

    if (procesando) return;

    const carrito = obtenerCarrito().filter(
        item => item.id !== id
    );

    guardarCarrito(carrito);

    mostrarCarrito();
}

formulario.addEventListener("submit", async function(evento) {

    evento.preventDefault();

    if (procesando || !catalogoCargado) return;

    const carrito = obtenerCarrito();

    const cliente = document
        .getElementById("cliente").value.trim();

    const observaciones = document
        .getElementById("observaciones").value.trim();

    if (carrito.length === 0) {

        alert("Tu pedido está vacío.");
        return;

    }

    if (!cliente) {

        alert("Escribe tu nombre.");
        return;

    }

    procesando = true;
    botonPedido.disabled = true;
    botonPedido.textContent = "Registrando pedido...";

    try {

        const productos = carrito.map(item => ({
            id: item.id,
            cantidad: item.cantidad
        })).sort((a, b) => a.id - b.id);

        const solicitud = {
            cliente: cliente,
            observaciones: observaciones,
            productos: productos
        };

        const firma = JSON.stringify(solicitud);

        let intento = JSON.parse(
            sessionStorage.getItem("solicitudPedido") || "null"
        );

        if (!intento || intento.firma !== firma) {

            intento = {
                firma: firma,
                clave: crypto.randomUUID()
            };

            sessionStorage.setItem(
                "solicitudPedido",
                JSON.stringify(intento)
            );
        }

        const pedido = await registrarPedido({

            ...solicitud,

            clave_solicitud: intento.clave

        });

        const folio = "DTV-" +
            String(pedido.pedido_id).padStart(5, "0");

        let mensaje =
            "*NUEVO PEDIDO*\n" +
            "Dulces Típicos Veracruzanos\n\n" +
            `*Folio: ${folio}*\n` +
            `Cliente: ${cliente}\n\n` +
            "*Productos solicitados:*\n";

        pedido.productos.forEach(producto => {

            mensaje +=
                `• ${producto.cantidad} x ${producto.nombre}` +
                ` - ${moneda(producto.subtotal)}\n`;

        });

        mensaje +=
            `\nCantidad total: ${pedido.cantidad_total} piezas\n` +
            `*Total: ${moneda(pedido.total)} MXN*\n\n`;

        if (observaciones) {

            mensaje +=
                `Observaciones: ${observaciones}\n\n`;

        }

        mensaje +=
            "Quedo pendiente de la confirmación. Gracias.";

        const enlace =
            `https://wa.me/${TELEFONO}?text=` +
            encodeURIComponent(mensaje);

        sessionStorage.setItem(

            "ultimoPedido",

            JSON.stringify({

                folio: folio,
                cliente: cliente,
                cantidad: pedido.cantidad_total,
                total: moneda(pedido.total),
                whatsapp: enlace

            })

        );

        guardarCarrito([]);

        sessionStorage.removeItem("solicitudPedido");

        window.location.href = "confirmacion.html";

    } catch (error) {

        console.error(error);

        alert(error.message);

        try {

            catalogo = await obtenerCatalogoPublico();

        } catch (errorCatalogo) {

            console.error(errorCatalogo);

            catalogoCargado = false;

        }

    } finally {

        procesando = false;

        botonPedido.textContent =
            "Realizar pedido por WhatsApp";

        mostrarCarrito();

    }
});

async function iniciarCarrito() {

    catalogoCargado = false;
    botonPedido.disabled = true;

    lista.innerHTML = `
        <p>Consultando existencias...</p>
    `;

    try {

        catalogo = await obtenerCatalogoPublico();

        catalogoCargado = true;

        mostrarCarrito();

    } catch (error) {

        console.error(error);

        lista.innerHTML = `
            <div class="empty">

                <h3>No se pudo cargar el pedido</h3>

                <p>Comprueba tu conexión a internet.</p>

                <button
                    class="btn"
                    onclick="iniciarCarrito()"
                >
                    Reintentar
                </button>

            </div>
        `;
    }
}

iniciarCarrito();