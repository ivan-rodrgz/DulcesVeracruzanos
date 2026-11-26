const PRODUCTOS = [];

const formatoMoneda = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN"
});

function moneda(cantidad) {
    return formatoMoneda.format(Number(cantidad));
}

function obtenerCarrito() {
    try {
        const carrito = JSON.parse(
            localStorage.getItem("carrito")
        );

        if (!Array.isArray(carrito)) {
            return [];
        }

        return carrito.filter(item =>
            item &&
            Number.isSafeInteger(item.id) &&
            item.id > 0 &&
            Number.isSafeInteger(item.cantidad) &&
            item.cantidad > 0
        );

    } catch {
        return [];
    }
}

function guardarCarrito(carrito) {
    localStorage.setItem(
        "carrito",
        JSON.stringify(carrito)
    );

    actualizarContador();
}

function actualizarContador() {
    const contador = document.getElementById("contador");

    if (contador) {
        contador.textContent = obtenerCarrito().reduce(
            (total, item) => total + item.cantidad,
            0
        );
    }
}

document.addEventListener(
    "DOMContentLoaded",
    actualizarContador
);

window.addEventListener("storage", evento => {
    if (evento.key === "carrito" || evento.key === null) {
        actualizarContador();
    }
});