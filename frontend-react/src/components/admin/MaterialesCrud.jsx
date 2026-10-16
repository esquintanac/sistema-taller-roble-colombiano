// src/components/admin/MaterialesCrud.jsx
// Modulo completo conectado al backend real (Material CRUD construido
// en las evidencias AA2-EV01/EV02 y AA3-EV01). Usa DataTable + axios
// para las 4 operaciones sobre la base de datos MySQL.

import { useEffect, useRef, useState } from "react";
import materialesService, {
    TIPOS_MATERIAL,
    UNIDADES_MEDIDA,
    LIMITES_MATERIAL,
} from "../../services/materialesService";
import DataTable from "../ui/DataTable";
import FormField from "../ui/FormField";
import Button from "../ui/Button";
import Alert from "../ui/Alert";
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
        setFormulario({ ...formulario, [e.target.name]: e.target.value });
        // El error de un campo desaparece en cuanto se corrige.
        if (errores[e.target.name]) {
            setErrores({ ...errores, [e.target.name]: undefined });
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

        const costo = Number(formulario.costo_unitario);
        if (formulario.costo_unitario !== "" && (!Number.isFinite(costo) || costo <= 0)) {
            nuevos.costo_unitario = "El costo debe ser un número mayor a 0";
        } else if (costo > LIMITES_MATERIAL.costoMaximo) {
            nuevos.costo_unitario = "El costo no puede superar 9.999.999,99";
        }

        const stock = Number(formulario.stock);
        if (formulario.stock !== "" && (!Number.isFinite(stock) || stock < 0)) {
            nuevos.stock = "El stock no puede ser negativo";
        } else if (stock > LIMITES_MATERIAL.stockMaximo) {
            nuevos.stock = "El stock no puede superar 999.999,99";
        }

        const minimo = Number(formulario.stock_minimo);
        if (formulario.stock_minimo !== "" && (!Number.isFinite(minimo) || minimo < 0)) {
            nuevos.stock_minimo = "El stock mínimo no puede ser negativo";
        } else if (minimo > LIMITES_MATERIAL.stockMinimoMaximo) {
            nuevos.stock_minimo = "El stock mínimo no puede superar 9.999,99";
        }

        setErrores(nuevos);
        return Object.keys(nuevos).length === 0;
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setMensaje(null);
        if (!validar()) return;
        try {
            if (idEditando) {
                await materialesService.actualizar(idEditando, formulario);
                setMensaje({ tipo: "success", texto: "Material actualizado correctamente." });
            } else {
                await materialesService.crear(formulario);
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
        setFormulario(material);
        setIdEditando(material.id_material);
        setErrores({});
        setMensaje(null);
        // La tabla queda debajo del formulario: sin este desplazamiento hay
        // que hacer scroll a mano para ver los datos cargados.
        formularioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    async function handleEliminar(id) {
        if (!window.confirm("¿Seguro que quieres eliminar este material?")) return;
        try {
            await materialesService.eliminar(id);
            setMensaje({ tipo: "success", texto: "Material eliminado correctamente." });
            cargarMateriales();
        } catch {
            setMensaje({ tipo: "error", texto: "No se pudo eliminar el material." });
        }
    }

    return (
        <div>
            <h2>Gestión de materiales</h2>

            {mensaje && <Alert tipo={mensaje.tipo} mensaje={mensaje.texto} />}

            <Card className="mb-md">
                <h3>{idEditando ? "Editar material": "Registrar nuevo material"}</h3>
                <form ref={formularioRef} onSubmit={handleSubmit} noValidate>
                    <FormField label="Nombre del material" name="nombre_material" value={formulario.nombre_material} onChange={handleChange} error={errores.nombre_material} requerido maxLength={LIMITES_MATERIAL.nombre}/>
                    <FormField label="Tipo del material" name="tipo_material" as="select" value={formulario.tipo_material} onChange={handleChange} error={errores.tipo_material} requerido opciones={opcionesConActual(formulario.tipo_material, TIPOS_MATERIAL)}/>
                    <FormField label="Unidad de medida" name="unidad_medida" as="select" value={formulario.unidad_medida} onChange={handleChange} error={errores.unidad_medida} requerido opciones={opcionesConActual(formulario.unidad_medida, UNIDADES_MEDIDA)}/>
                    <FormField label="Costo unitario" name="costo_unitario" value={formulario.costo_unitario} tipo="number" min="0.01" max={LIMITES_MATERIAL.costoMaximo} paso="0.01" onChange={handleChange} error={errores.costo_unitario} requerido/>
                    <FormField label="Stock" name="stock" value={formulario.stock} tipo="number" min="0" max={LIMITES_MATERIAL.stockMaximo} paso="0.01" onChange={handleChange} error={errores.stock} requerido/>
                    <FormField label="Stock minimo" name="stock_minimo" value={formulario.stock_minimo} tipo="number" min="0" max={LIMITES_MATERIAL.stockMinimoMaximo} paso="0.01" onChange={handleChange} error={errores.stock_minimo} requerido/>

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
                        <Button tamano="sm" variante="danger" onClick={() => handleEliminar(m.id_material)}>Eliminar</Button>
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
        </div>
    );
}