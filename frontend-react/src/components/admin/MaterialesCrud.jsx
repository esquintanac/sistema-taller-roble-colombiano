// src/components/admin/MaterialesCrud.jsx
// Modulo completo conectado al backend real (Material CRUD construido
// en las evidencias AA2-EV01/EV02 y AA3-EV01). Usa DataTable + axios
// para las 4 operaciones sobre la base de datos MySQL.

import { useEffect, useRef, useState } from "react";
import materialesService, {
    TIPOS_MATERIAL,
    UNIDADES_MEDIDA,
    LIMITES_MATERIAL,
    limitarNumero,
} from "../../services/materialesService";
// Formato de miles mientras se escribe: los tres campos numéricos del
// formulario guardan el texto ya visible ("9.999.999") y se limpian a
// solo dígitos al validar y al enviar al backend.
import { formatearMiles, soloDigitos } from "../../utils/numeros";
import DataTable from "../ui/DataTable";
import FormField from "../ui/FormField";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Card from "../ui/Card";
// pesos vive en utils/descargas para que el costo se vea igual en todo el
// sistema (aquí y en el detalle del administrador) sin duplicar el formato.
import { pesos, textoDivisa } from "../../utils/descargas";
import Spinner from "../ui/Spinner";
import { useTipoCambio } from "../../hooks/useDatosExternos";

const MATERIAL_VACIO = {
    nombre_material: "", tipo_material: "", unidad_medida: "",
    costo_unitario: "", stock: "", stock_minimo: "",
};

const COLUMNAS = [
    { key: "id_material", label: "ID" },
    { key: "nombre_material", label: "Nombre" },
    { key: "tipo_material", label: "Tipo" },
    { key: "unidad_medida", label: "Unidad" },
    { key: "costo_unitario", label: "Costo", render: (m) => pesos(m.costo_unitario) },
    { key: "stock", label: "Stock" },
]

// Materiales guardados antes de que existieran las listas cerradas pueden
// traer un tipo o una unidad que ya no está en las opciones. Al editar se
// agrega el valor actual a la lista para que el <select> lo muestre en vez
// de aparecer vacío; el backend valida que el valor guardado sea de la
// lista, así que cualquier dato heredado queda a la vista para corregirlo.
function opcionesConActual(actual, opciones) {
    if (!actual) return opciones;
    const existe = opciones.some((op) => op.value === actual);
    return existe ? opciones : [...opciones, { value: actual, label: `${actual} (valor actual)` }];
}

export default function MaterialesCrud() {
    const [materiales, setMateriales] = useState([]);
    const [formulario, setFormulario] = useState(MATERIAL_VACIO);
    const [idEditando, setIdEditando] = useState(null);
    const [errores, setErrores] = useState({});
    const [mensaje, setMensaje] = useState(null);
    // Material pendiente de confirmación en el modal de eliminación.
    const [materialAEliminar, setMaterialAEliminar] = useState(null);
    const [cargando, setCargando] = useState(true);
    // Referencia al <form> del Card: al editar desde la tabla (que queda
    // debajo) la vista se desplaza sola hasta el formulario.
    const formularioRef = useRef(null);
    // Tipo de cambio del día (Fase 7). Solo se usa para una nota al pie; si el
    // servicio externo no responde, la tabla se muestra igual sin ella.
    const divisa = useTipoCambio();

    useEffect(() => {
        cargarMateriales();
    }, []);

    async function cargarMateriales() {
        try {
            setCargando(true);
            const datos = await materialesService.listar();
            setMateriales(datos);
        } catch {
            setMensaje({ tipo: "error", texto: "No se pudo conectar con el servidor. Verifica que el backend este corriendo." });
        } finally {
            setCargando(false);
        }
    }

    function handleChange(e) {
        // Los campos numéricos se muestran con formato de miles/millones
        // mientras se escribe ("9.999.999"): limitarNumero se queda solo con
        // los dígitos, aplica el tope del campo y devuelve el texto ya
        // formateado; si la entrada no tiene ni un dígito, devuelve null y el
        // campo conserva su valor anterior.
        const { name, value, selectionStart } = e.target;
        const valor = limitarNumero(name, value) ?? formulario[name];
        setFormulario({ ...formulario, [name]: valor });
        // Al insertarse o borrarse los puntos de miles, el cursor se
        // recoloca contando DÍGITOS hacia atrás (los puntos se ignoran),
        // para que siga justo donde el usuario estaba escribiendo.
        if (valor !== value && selectionStart != null) {
            const digitosAntes = (value.slice(0, selectionStart).match(/\d/g) || []).length;
            let posicion = 0;
            if (digitosAntes > 0) {
                posicion = valor.length;
                let vistos = 0;
                for (let i = 0; i < valor.length; i++) {
                    if (/\d/.test(valor[i])) {
                        vistos += 1;
                        if (vistos === digitosAntes) {
                            posicion = i + 1;
                            break;
                        }
                    }
                }
            }
            const input = e.target;
            requestAnimationFrame(() => input.setSelectionRange?.(posicion, posicion));
        }
        // El error de un campo desaparece en cuanto se corrige.
        if (errores[name]) {
            setErrores({ ...errores, [name]: undefined });
        }
    }

    // Valida el formulario antes de enviarlo. Los límites se replican en el
    // backend (MaterialService.validar_datos) por si alguien llama a la API
    // directamente, pero avisar aquí evita un viaje al servidor para nada.
    function validar() {
        const nuevos = {};
        ["nombre_material", "tipo_material", "unidad_medida", "costo_unitario", "stock", "stock_minimo"]
            .forEach((campo) => {
                if (!String(formulario[campo] ?? "").trim()) {
                    nuevos[campo] = "Este campo es obligatorio";
                }
            });

        if (String(formulario.nombre_material || "").length > LIMITES_MATERIAL.nombre) {
            nuevos.nombre_material = `Máximo ${LIMITES_MATERIAL.nombre} caracteres`;
        }

        // Los tres campos guardan el texto con formato de miles ("1.234.567");
        // para comparar contra los topes se reducen a solo dígitos.
        const costo = Number(soloDigitos(formulario.costo_unitario));
        if (formulario.costo_unitario !== "" && (!Number.isFinite(costo) || costo <= 0)) {
            nuevos.costo_unitario = "El costo debe ser un número mayor a 0";
        } else if (costo > LIMITES_MATERIAL.costoMaximo) {
            nuevos.costo_unitario = "El costo no puede superar 9.999.999";
        } else if (costo !== Math.trunc(costo)) {
            nuevos.costo_unitario = "El costo no admite decimales";
        }

        const stock = Number(soloDigitos(formulario.stock));
        if (formulario.stock !== "" && (!Number.isFinite(stock) || stock < 0)) {
            nuevos.stock = "El stock no puede ser negativo";
        } else if (stock > LIMITES_MATERIAL.stockMaximo) {
            nuevos.stock = "El stock no puede superar 999.999";
        } else if (stock !== Math.trunc(stock)) {
            nuevos.stock = "El stock no admite decimales";
        }

        const minimo = Number(soloDigitos(formulario.stock_minimo));
        if (formulario.stock_minimo !== "" && (!Number.isFinite(minimo) || minimo < 0)) {
            nuevos.stock_minimo = "El stock mínimo no puede ser negativo";
        } else if (minimo > LIMITES_MATERIAL.stockMinimoMaximo) {
            nuevos.stock_minimo = "El stock mínimo no puede superar 99.999";
        } else if (minimo !== Math.trunc(minimo)) {
            nuevos.stock_minimo = "El stock mínimo no admite decimales";
        }

        setErrores(nuevos);
        return Object.keys(nuevos).length === 0;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setMensaje(null);
        if (!validar()) {
            // El resultado también se informa en ventana emergente (así lo
            // pidió el instructor); los detalles de cada campo quedan en
            // rojo debajo de ellos, para corregir sin adivinar.
            setMensaje({
                tipo: "error",
                titulo: "Revisa el formulario",
                texto: "Hay campos vacíos o con errores. Corrígelos antes de guardar.",
            });
            return;
        }
        try {
            // El formulario conserva los números con formato de miles para
            // que el administrador los lea bien; el backend recibe solo
            // dígitos ("9.999.999" -> "9999999"), como siempre.
            const paraEnviar = {
                ...formulario,
                costo_unitario: soloDigitos(formulario.costo_unitario),
                stock: soloDigitos(formulario.stock),
                stock_minimo: soloDigitos(formulario.stock_minimo),
            };
            if (idEditando) {
                await materialesService.actualizar(idEditando, paraEnviar);
                setMensaje({ tipo: "success", texto: "Material actualizado correctamente." });
            } else {
                await materialesService.crear(paraEnviar);
                setMensaje({ tipo: "success", texto: "Material registrado correctamente." });
            }
            setFormulario(MATERIAL_VACIO);
            setIdEditando(null);
            setErrores({});
            cargarMateriales();
        } catch (error) {
            // El backend responde 400 con {exito:false, errores:[...]}: esos
            // mensajes (p. ej. un tipo fuera de la lista) se muestran tal cual.
            const lista = error?.response?.data?.errores;
            setMensaje({
                tipo: "error",
                texto: Array.isArray(lista) && lista.length
                    ? lista.join(" ")
                    : "Ocurrio un error al guardar el material.",
            });
        }
    }

    function iniciarEdicion(material) {
        // Los precios y stocks son enteros: si un registro heredado trae
        // decimales (o NULL en stock_minimo), al cargarlo se redondea y se
        // formatea con miles para que el formulario muestre exactamente lo
        // que se podrá guardar, con la misma lectura que al escribir.
        const entero = (v) => formatearMiles(String(Math.round(Number(v ?? 0))));
        setFormulario({
            ...material,
            costo_unitario: entero(material.costo_unitario),
            stock: entero(material.stock),
            stock_minimo: entero(material.stock_minimo),
        });
        setIdEditando(material.id_material);
        setErrores({});
        setMensaje(null);
        // La tabla queda debajo del formulario: sin este desplazamiento hay
        // que hacer scroll a mano para ver los datos cargados.
        formularioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // Eliminar ya no usa el window.confirm() del navegador (ese aviso
    // genérico es el de cualquier página): se pide confirmación en el
    // propio modal del sistema, con el nombre del material a la vista.
    function handleEliminar(material) {
        setMaterialAEliminar(material);
    }

    async function confirmarEliminacion() {
        const material = materialAEliminar;
        setMaterialAEliminar(null);
        try {
            await materialesService.eliminar(material.id_material);
            setMensaje({
                tipo: "success",
                titulo: "Material eliminado",
                texto: `El material "${material.nombre_material}" se eliminó correctamente.`,
            });
            cargarMateriales();
        } catch {
            setMensaje({ tipo: "error", texto: "No se pudo eliminar el material." });
        }
    }

    return (
        <div>
            <h2>Gestión de materiales</h2>



            <Card className="mb-md">
                <h3>{idEditando ? "Editar material": "Registrar nuevo material"}</h3>
                <form ref={formularioRef} onSubmit={handleSubmit} noValidate>
                    <FormField label="Nombre del material" name="nombre_material" value={formulario.nombre_material} onChange={handleChange} error={errores.nombre_material} requerido maxLength={LIMITES_MATERIAL.nombre}/>
                    <FormField label="Tipo del material" name="tipo_material" as="select" value={formulario.tipo_material} onChange={handleChange} error={errores.tipo_material} requerido opciones={opcionesConActual(formulario.tipo_material, TIPOS_MATERIAL)}/>
                    <FormField label="Unidad de medida" name="unidad_medida" as="select" value={formulario.unidad_medida} onChange={handleChange} error={errores.unidad_medida} requerido opciones={opcionesConActual(formulario.unidad_medida, UNIDADES_MEDIDA)}/>
                    <FormField label="Costo unitario" name="costo_unitario" value={formulario.costo_unitario} tipo="text" inputMode="numeric" onChange={handleChange} error={errores.costo_unitario} hint={`Sin decimales · máximo ${LIMITES_MATERIAL.costoMaximo.toLocaleString("es-CO")} · el formato de miles se aplica solo`} requerido/>
                    <FormField label="Stock" name="stock" value={formulario.stock} tipo="text" inputMode="numeric" onChange={handleChange} error={errores.stock} hint={`Sin decimales · máximo ${LIMITES_MATERIAL.stockMaximo.toLocaleString("es-CO")} · el formato de miles se aplica solo`} requerido/>
                    <FormField label="Stock minimo" name="stock_minimo" value={formulario.stock_minimo} tipo="text" inputMode="numeric" onChange={handleChange} error={errores.stock_minimo} hint={`Sin decimales · máximo ${LIMITES_MATERIAL.stockMinimoMaximo.toLocaleString("es-CO")} · el formato de miles se aplica solo`} requerido/>

                    <Button tipo="submit" variante="primary">
                        {idEditando ? "Guardar cambios" : "Registrar material"}
                    </Button>
                    {idEditando && (
                        <Button variante="secondary" onClick={() => { setFormulario(MATERIAL_VACIO); setIdEditando(null); setErrores({}); }}>
                            Cancelar edición
                        </Button>
                    )}
                </form>
            </Card>

            {cargando ? (
                <Spinner texto="Cargando materiales…" />
            ) : (
                <DataTable
                columnas={COLUMNAS}
                datos={materiales}
                tituloVacio="No hay materiales"
                mensajeVacio="Registra el primero con el formulario de arriba."
                renderAcciones={(m) => (
                    <div style={{ display: "flex", gap: 6 }}>
                        <Button tamano="sm" variante="secondary" onClick={() => iniciarEdicion(m)}>Editar</Button>
                        <Button tamano="sm" variante="danger" onClick={() => handleEliminar(m)}>Eliminar</Button>
                    </div>
                )}
                />
            )}

            {divisa && (
                <p className="nota-divisa">
                    Tipo de cambio de hoy: {textoDivisa(divisa)}. Los costos de la
                    tabla se muestran en pesos colombianos.
                </p>
            )}

            {/* Resultado de guardar/eliminar y confirmación de borrado:
                ventana emergente en lugar de la etiqueta de arriba del
                formulario (indicación del instructor). */}
            {mensaje && (
                <Modal
                    tipo={mensaje.tipo}
                    titulo={mensaje.titulo}
                    mensaje={mensaje.texto}
                    onAceptar={() => setMensaje(null)}
                />
            )}

            {materialAEliminar && (
                <Modal
                    tipo="confirm"
                    titulo="Eliminar material"
                    mensaje={`¿Seguro que quieres eliminar "${materialAEliminar.nombre_material}"? Esta acción no se puede deshacer.`}
                    textoConfirmar="Eliminar"
                    onConfirmar={confirmarEliminacion}
                    onCancelar={() => setMaterialAEliminar(null)}
                />
            )}
        </div>
    );
}