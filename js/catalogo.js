const contenedor = document.getElementById("productos");
const buscador = document.getElementById("buscador");

let catalogo = [];

function mostrarProductos(productos) {

    if (productos.length === 0) {

        contenedor.innerHTML = `
            <p>No se encontraron productos.</p>
        `;

        return;
    }

    const carrito = obtenerCarrito();

    contenedor.innerHTML = productos.map(producto => {

        const item = carrito.find(
            p => p.id === producto.id
        );

        const cantidadCarrito = item ? item.cantidad : 0;

        const agotado = producto.disponibles <= 0;

        const limiteAlcanzado =
            cantidadCarrito >= producto.disponibles;

        return `
            <article class="product-card">

                <img
                    src="${producto.imagen}"
                    alt="${producto.nombre}"
                >

                <div class="product-info">

                    <h3>${producto.nombre}</h3>

                    <p>${producto.descripcion}</p>

                    <strong class="price">
                        ${moneda(producto.precio)}
                    </strong>

                    <p class="stock ${
                        agotado ? "stock-agotado" : "stock-disponible"
                    }">

                        ${
                            agotado
                            ? "Agotado"
                            : producto.disponibles + " piezas disponibles"
                        }

                    </p>

                    <button
                        class="btn"
                        onclick="agregarProducto(${producto.id})"
                        ${limiteAlcanzado ? "disabled" : ""}
                    >

                        ${
                            agotado
                            ? "Agotado"
                            : limiteAlcanzado
                            ? "Límite alcanzado"
                            : "Agregar al pedido"
                        }

                    </button>

                </div>

            </article>
        `;

    }).join("");
}

function agregarProducto(id) {

    const producto = catalogo.find(
        p => p.id === id
    );

    if (!producto) return;

    const carrito = obtenerCarrito();

    const existente = carrito.find(
        item => item.id === id
    );

    const cantidadActual =
        existente ? existente.cantidad : 0;

    if (cantidadActual >= producto.disponibles) {

        mostrarNotificacion(
            "No hay más piezas disponibles."
        );

        return;
    }

    if (existente) {

        existente.cantidad++;

    } else {

        carrito.push({
            id: id,
            cantidad: 1
        });

    }

    guardarCarrito(carrito);

    filtrarProductos();

    mostrarNotificacion(
        "Producto agregado al pedido"
    );
}

function mostrarNotificacion(mensaje) {

    document.querySelector(".toast")?.remove();

    const aviso = document.createElement("div");

    aviso.className = "toast";
    aviso.textContent = mensaje;

    document.body.appendChild(aviso);

    setTimeout(() => {
        aviso.remove();
    }, 2500);
}

function filtrarProductos() {

    const texto = buscador.value
        .toLowerCase()
        .trim();

    const resultados = catalogo.filter(producto =>
        producto.nombre.toLowerCase().includes(texto)
    );

    mostrarProductos(resultados);
}

buscador.addEventListener("input", filtrarProductos);

async function iniciarCatalogo() {

    buscador.disabled = true;

    contenedor.innerHTML = `
        <p>Cargando productos...</p>
    `;

    try {

        catalogo = await obtenerCatalogoPublico();

        buscador.disabled = false;

        filtrarProductos();

    } catch (error) {

        console.error(error);

        contenedor.innerHTML = `
            <div class="empty">

                <h3>No se pudo cargar el catálogo</h3>

                <p>
                    Comprueba tu conexión e inténtalo nuevamente.
                </p>

                <button
                    class="btn"
                    onclick="iniciarCatalogo()"
                >
                    Reintentar
                </button>

            </div>
        `;

    }
}

iniciarCatalogo();