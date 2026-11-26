const CLAVE_SESION = "sesion_admin_dulces";

function obtenerToken() {
    return sessionStorage.getItem(CLAVE_SESION);
}

async function sesionActiva() {

    const token = obtenerToken();

    if (!token) {
        return false;
    }

    try {

        const resultado = await llamarFuncion("admin-auth", {
            accion: "validar",
            token: token
        });

        if (!resultado.ok) {
            sessionStorage.removeItem(CLAVE_SESION);
        }

        return resultado.ok === true;

    } catch (error) {

        console.error(error);
        return false;

    }
}

async function protegerPanel() {

    document.documentElement.style.visibility = "hidden";

    if (!(await sesionActiva())) {

        window.location.replace("login.html");
        return;

    }

    document.documentElement.style.visibility = "visible";
}

async function cerrarSesion() {

    const token = obtenerToken();

    try {

        if (token) {

            const resultado = await llamarFuncion("admin-auth", {
                accion: "logout",
                token: token
            });

            if (!resultado.ok) {
                throw new Error("No se pudo invalidar la sesión");
            }

        }

    } catch (error) {

        console.error(error);
        alert("No se pudo cerrar la sesión en el servidor. Intenta nuevamente.");
        return;

    }

    sessionStorage.removeItem(CLAVE_SESION);

    window.location.replace("login.html");
}

document.addEventListener("DOMContentLoaded", async () => {

    const formulario = document.getElementById("form-login");
    const pin = document.getElementById("pin");
    const mostrarPin = document.getElementById("mostrar-pin");
    const mensajeError = document.getElementById("mensaje-error");
    const botonCerrar = document.getElementById("cerrar-sesion");

    if (formulario) {

        const botonLogin = formulario.querySelector(
            'button[type="submit"]'
        );

        formulario.addEventListener("submit", async evento => {

            evento.preventDefault();

            mensajeError.textContent = "";
            botonLogin.disabled = true;
            botonLogin.textContent = "Verificando...";

            try {

                const resultado = await llamarFuncion("admin-auth", {
                    accion: "login",
                    pin: pin.value
                });

                if (resultado.ok) {

                    sessionStorage.setItem(
                        CLAVE_SESION,
                        resultado.token
                    );

                    window.location.replace("index.html");

                } else {

                    mensajeError.textContent = resultado.mensaje;
                    pin.value = "";
                    pin.focus();

                }

            } catch (error) {

                mensajeError.textContent =
                    "No se pudo conectar con el servidor.";

                console.error(error);

            } finally {

                botonLogin.disabled = false;
                botonLogin.textContent = "Iniciar sesión";

            }

        });

        pin.addEventListener("input", () => {

            pin.value = pin.value.replace(/[^0-9]/g, "");
            mensajeError.textContent = "";

        });

        mostrarPin.addEventListener("click", () => {

            if (pin.type === "password") {

                pin.type = "text";
                mostrarPin.textContent = "Ocultar";

            } else {

                pin.type = "password";
                mostrarPin.textContent = "Mostrar";

            }

        });

        if (await sesionActiva()) {

            window.location.replace("index.html");

        }

    }

    if (botonCerrar) {

        botonCerrar.addEventListener("click", cerrarSesion);

    }

});