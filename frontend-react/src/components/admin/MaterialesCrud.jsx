// src/components/admin/MaterialesCrud.jsx
// Modulo completo conectado al backend real (Material CRUD construido
// en las evidencias AA2-EV01/EV02 y AA3-EV01). Usa DataTable + axios
// para las 4 operaciones sobre la base de datos MySQL.

import { useState, useEffect, useEffectEvent } from "react";
import materialesService from "../../services/materialesService";
import DataTable from "../ui/DataTable";
import FormField from "../ui/FormField";
import Button from "../ui/Button";
import Alert from "../ui/Alert";
import Card from "../ui/Card";

const MATERIAL_VACIO = {
    nombre_material: "", tipo_material: "", unidad_medida: "",
    costo_unitario: "", stock: "", stock_minimo: "",
};

const COLUMNAS = [
    { key: "id_material", label: "ID" },
    { key: "nombre_material", label: "Nombre" },
    { key: "tipo_material", label: "Tipo" },
    { key: "unidad_medida", label: "Unidad" },
    { key: "costo_unitario", label: "Costo", render: (m) => '$${m.costo_unitario}' },
    { key: "stock", label: "Stock" },
]

export default function MaterialesCrud() {
    const [materiales, setMateriales] = useState([]);
    const [formulario, setFormulario] = useState(MATERIAL_VACIO);
    const [idEditando, setIdEditando] = useState(null);
    const [mensaje, setMensaje] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarMateriales();
    }, []);

    async function cargarMateriales() {
        try {
            setCargando(true);
            const datos = await materialesService.listar();
            setMateriales(datos);
        } catch (error) {
            setMensaje({ tipo: "error", texto: "No se pudo conectar con el servidor. Verifica que el backend este corriendo." });
        } finally {
            setCargando(false);
        }
    }

    function handleChange(e) {
        setFormulario({ ...formulario, [e.target.name]: e.target.value });
    }
    
    async function handleSubmit(e) {
        e.preventDefault();
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
            cargarMateriales();
        } catch (error) {
            setMensaje({ tipo: "error", texto: "Ocurrio un error al guardar el material." });
        }
    }

    function iniciarEdicion(material) {
        setFormulario(material);
        setIdEditando(material.id_material);
    }

    async function handleEliminar(id) {
        if (!window.confirm("¿Seguro que quieres eliminar este material?")) return;
        try {
            await materialesService.eliminar(id);
            setMensaje({ tipo: "success", texto: "Material eliminado correctamente." });
            cargarMateriales();
        } catch (error) {
            setMensaje({ tipo: "error", texto: "No se pudo eliminar el material." });
        }
    }

    return (
        <div>
            <h2>Gestión de materiales</h2>

            {mensaje && <Alert tipo={mensaje.tipo} mensaje={mensaje.texto} />}

            <Card className="mb-md">
                <h3>{idEditando ? "Editar material": "Registrar nuevo material"}</h3>
                <form onSubmit={handleSubmit} noValidate>
                    <FormField label="Nombre del material" name="nombre_material" value={formulario.nombre_material} onChange={handleChange} requerido/>
                    <FormField label="Tipo del material" name="tipo_material" value={formulario.tipo_material} onChange={handleChange} requerido/>
                    <FormField label="Unidad de medida" name="unidad_medida" value={formulario.unidad_medida} onChange={handleChange} requerido/>
                    <FormField label="Costo unitario" name="costo_unitario" value={formulario.costo_unitario} tipo="number" onChange={handleChange} requerido/>
                    <FormField label="Stock" name="stock" value={formulario.stock} tipo="number" onChange={handleChange} requerido/>
                    <FormField label="Stock minimo" name="stock_minimo" value={formulario.stock_minimo} tipo="number" onChange={handleChange} requerido/>

                    <Button tipo="submit" variante="primary">
                        {idEditando ? "Guardar cambios" : "Registrar material"}
                    </Button>
                    {idEditando && (
                        <Button variante="secondary" onClick={() => { setFormulario(MATERIAL_VACIO), setIdEditando(null); }}>
                            Cancelar edición
                        </Button>
                    )}
                </form>
            </Card>

            {cargando ? (
                <p>Cargando materiales...</p>
            ) : (
                <DataTable
                columnas={COLUMNAS}
                datos={materiales}
                renderAcciones={(m) => (
                    <div style={{ display: "flex", gap: 6 }}>
                        <Button tamano="sm" variante="secondary" onClick={() => iniciarEdicion(m)}>Editar</Button>
                        <Button tamano="sm" variante="danger" onClick={() => handleEliminar(m.id_material)}>Eliminar</Button>
                    </div>
                )}
                />
            )}
        </div>
    );
}