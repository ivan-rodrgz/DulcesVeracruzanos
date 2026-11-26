const SUPABASE_URL = "https://ueokamoprzryjhhhdpjf.supabase.co";

const SUPABASE_KEY = "sb_publishable_YiMyIWvILByaE3i8fMopSQ_XYHixXqs";

async function llamarFuncion(nombre, datos = {}) {

    const respuesta = await fetch(
        `${SUPABASE_URL}/functions/v1/${nombre}`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_KEY
            },

            body: JSON.stringify(datos)
        }
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(
            resultado.mensaje || "Error de conexión con Supabase"
        );
    }

    return resultado;
}
async function obtenerCatalogoPublico() {

    const respuesta = await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/catalogo_publico`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": SUPABASE_KEY
            },
            body: JSON.stringify({})
        }
    );

    if (!respuesta.ok) {
        throw new Error("No se pudo consultar el catálogo.");
    }

    const productos = await respuesta.json();

    return productos.map(producto => ({
        id: Number(producto.id),
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: Number(producto.precio),
        imagen: producto.imagen,
        disponibles: Number(producto.disponibles)
    }));
}
async function registrarPedido(datos) {

    const resultado = await llamarFuncion(
        "registrar-pedido",
        datos
    );

    if (!resultado.ok) {

        throw new Error(
            resultado.mensaje ||
            "No se pudo registrar el pedido."
        );

    }

    return resultado;
}