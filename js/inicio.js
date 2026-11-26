const favoritos = document.getElementById("productos-favoritos");

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

async function cargarFavoritos() {

    try {

        const catalogo = await obtenerCatalogoPublico();

        const idsFavoritos = [1, 2, 6];

        const productos = idsFavoritos
            .map(id => catalogo.find(
                producto => Number(producto.id) === id
            ))
            .filter(Boolean);

        if (productos.length === 0) {

            favoritos.innerHTML = `
                <p>No hay productos destacados por el momento.</p>
            `;

            return;
        }

        favoritos.innerHTML = productos.map(producto => `

            <article class="product-card">

                <img
                    src="${escaparHTML(producto.imagen)}"
                    alt="${escaparHTML(producto.nombre)}"
                    loading="lazy"
                >

                <div class="product-info">

                    <h3>
                        ${escaparHTML(producto.nombre)}
                    </h3>

                    <p>
                        ${escaparHTML(producto.descripcion)}
                    </p>

                    <strong class="price">
                        ${moneda(producto.precio)}
                    </strong>

                </div>

            </article>

        `).join("");

    } catch (error) {

        console.error(error);

        favoritos.innerHTML = `

            <div>

                <p>No fue posible cargar los productos.</p>

                <button
                    class="btn"
                    onclick="cargarFavoritos()"
                >
                    Reintentar
                </button>

            </div>

        `;

    }
}

cargarFavoritos();