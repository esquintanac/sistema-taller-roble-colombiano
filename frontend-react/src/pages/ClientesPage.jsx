// src/pages/ClientesPage.jsx
// Gestión de clientes del taller (solo Administrador).
//
// El carpintero NO entra aquí: él necesita elegir un cliente al crear un
// modelo, pero crearlos o borrarlos es decisión del administrador. Esa
// separación la aplica ProtectedRoute en App.jsx y el backend la refuerza en
// cliente_controller.py (crear, editar y eliminar exigen rol Administrador).

import { useEffect, useMemo, useState } from "react";
import clientesService, { CLIENTE_VACIO, TIPOS_DOCUMENTO } from "../services/clientesService";
import { mensajeDeError } from "../utils/descargas";
import DataTable from "../components/ui/DataTable";
import FormField from "../components/ui/FormField";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import Card from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import Spinner from "../components/ui/Spinner";

// El backend también valida el correo, pero avisar al instante en el propio
// formulario es mejor que devolver un error de servidor.
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Se admiten los formatos que la gente escribe a diario en Colombia:
// "3001234567", "300 123 4567". El máximo de 15 caracteres no es arbitrario:
// es el tamaño de la columna Telefono_cliente en la base; si se aceptara más,
// MySQL rechazaría el INSERT con "Data too long" y el cliente se perdería.
// El prefijo internacional se escribe pegado ("+573001234567", 13 dígitos).
const TELEFONO_VALIDO = /^\+?\d[\d\s-]{5,13}$/;

// Cinco campos son obligatorios (ver ClienteService.validar_datos).
// El teléfono está entre ellos porque sin él no hay forma de contactar al
// cliente para coordinar la entrega del modelo.
const OBLIGATORIOS = [
  "nombre",
  "apellido",
  "tipo_documento_identificacion",
  "numero_documento_identificacion",
  "telefono_cliente",
];

const COLUMNAS = [
  { key: "id_cliente", label: "ID" },
  {
    key: "nombre",
    label: "Cliente",
    render: (c) => `${c.nombre} ${c.apellido}`,
  },
  {
    key: "documento",
    label: "Documento",
    render: (c) => `${c.tipo_documento_identificacion} ${c.numero_documento_identificacion}`,
  },
  { key: "telefono_cliente", label: "Teléfono", render: (c) => c.telefono_cliente || "—" },
  { key: "correo_cliente", label: "Correo", render: (c) => c.correo_cliente || "—" },
  // La dirección es lo que permite ubicar al cliente para entregar el modelo.
  { key: "direccion_cliente", label: "Dirección", render: (c) => c.direccion_cliente || "—" },
];

const estiloBuscador = {
  height: 44,
  padding: "0 14px",
  fontSize: 14,
  background: "var(--surface)",
  border: "1.5px solid var(--border)",
  borderRadius: "var(--r-md)",
  flex: "1 1 260px",
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [formulario, setFormulario] = useState(CLIENTE_VACIO);
  const [idEditando, setIdEditando] = useState(null);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargarClientes() {
    try {
      setCargando(true);
      setClientes(await clientesService.listar());
    } catch (error) {
      setMensaje({
        tipo: "error",
        titulo: "No se pudieron cargar los clientes",
        texto: mensajeDeError(error, "los clientes"),
      });
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarClientes();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormulario({ ...formulario, [name]: value });
    // El error de un campo desaparece en cuanto se corrige.
    setErrores({ ...errores, [name]: undefined });
  }

  function validar() {
    const nuevos = {};
    OBLIGATORIOS.forEach((campo) => {
      if (!String(formulario[campo] || "").trim()) {
        nuevos[campo] = "Este campo es obligatorio";
      }
    });
    if (formulario.correo_cliente && !CORREO_VALIDO.test(formulario.correo_cliente.trim())) {
      nuevos.correo_cliente = "El correo no tiene un formato válido";
    }
    // El teléfono solo admite dígitos y los separadores que la gente escribe
    // de verdad ("300 123 4567", "+57 3001234567"), no letras sueltas.
    if (formulario.telefono_cliente && !TELEFONO_VALIDO.test(formulario.telefono_cliente.trim())) {
      nuevos.telefono_cliente =
        "Escribe solo números (máx. 15 caracteres). Ej: 300 123 4567 o +573001234567";
    }
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMensaje(null);
    if (!validar()) return;

    setGuardando(true);
    try {
      if (idEditando) {
        await clientesService.actualizar(idEditando, formulario);
        setMensaje({ tipo: "success", texto: "Cliente actualizado correctamente." });
      } else {
        await clientesService.crear(formulario);
        setMensaje({ tipo: "success", texto: "Cliente registrado correctamente." });
      }
      setFormulario(CLIENTE_VACIO);
      setIdEditando(null);
      cargarClientes();
    } catch (error) {
      // El backend responde 400 con {exito:false, errores:[...]}.
      const lista = error?.response?.data?.errores;
      setMensaje({
        tipo: "error",
        titulo: "No se pudo guardar el cliente",
        texto: Array.isArray(lista) ? lista.join(" ") : mensajeDeError(error, "el cliente"),
      });
    } finally {
      setGuardando(false);
    }
  }

  function iniciarEdicion(cliente) {
    // Se copian uno a uno solo los campos editables: el objeto que llega del
    // DataTable trae además id y fecha de registro, que no son del formulario.
    setFormulario({
      nombre: cliente.nombre || "",
      apellido: cliente.apellido || "",
      tipo_documento_identificacion: cliente.tipo_documento_identificacion || "",
      numero_documento_identificacion: cliente.numero_documento_identificacion || "",
      telefono_cliente: cliente.telefono_cliente || "",
      correo_cliente: cliente.correo_cliente || "",
      direccion_cliente: cliente.direccion_cliente || "",
    });
    setIdEditando(cliente.id_cliente);
    setErrores({});
    setMensaje(null);
  }

  function cancelarEdicion() {
    setFormulario(CLIENTE_VACIO);
    setIdEditando(null);
    setErrores({});
  }

  async function handleEliminar(cliente) {
    const nombre = `${cliente.nombre} ${cliente.apellido}`;
    if (!window.confirm(`¿Eliminar a ${nombre}? Esta acción no se puede deshacer.`)) return;

    try {
      await clientesService.eliminar(cliente.id_cliente);
      setMensaje({ tipo: "success", texto: `${nombre} fue eliminado.` });
      // Si se estaba editando justo a ese cliente, el formulario se limpia.
      if (idEditando === cliente.id_cliente) cancelarEdicion();
      cargarClientes();
    } catch (error) {
      setMensaje({
        tipo: "error",
        titulo: "No se pudo eliminar",
        texto: mensajeDeError(error, "el cliente"),
      });
    }
  }

  // El buscador se resuelve en el navegador: la API no trae paginación.
  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return clientes;
    return clientes.filter((c) =>
      [
        c.id_cliente,
        c.nombre,
        c.apellido,
        c.numero_documento_identificacion,
        c.correo_cliente,
        c.telefono_cliente,
        // También se busca por dirección: es como se localiza al cliente
        // cuando hay que ir a entregarle el modelo.
        c.direccion_cliente,
      ].some((valor) => String(valor || "").toLowerCase().includes(texto))
    );
  }, [clientes, busqueda]);

  const conCorreo = clientes.filter((c) => c.correo_cliente).length;
  const conTelefono = clientes.filter((c) => c.telefono_cliente).length;

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 40 }}>
      <h1>Clientes</h1>
      <p style={{ color: "var(--tx-sec)", marginBottom: 20 }}>
        Registro de los clientes a los que se les construye muebles. Los carpinteros los
        seleccionan al crear un modelo; solo el administrador puede crearlos o borrarlos.
      </p>

      <div className="stats-grid">
        <StatCard icono="👥" etiqueta="Clientes registrados" valor={clientes.length} />
        <StatCard icono="✉️" etiqueta="Con correo" valor={conCorreo} />
        <StatCard icono="📞" etiqueta="Con teléfono" valor={conTelefono} />
      </div>

      {mensaje && (
        <Alert tipo={mensaje.tipo} titulo={mensaje.titulo} mensaje={mensaje.texto} />
      )}

      <Card className="mb-md">
        <h3>{idEditando ? `Editando cliente #${idEditando}` : "Registrar nuevo cliente"}</h3>

        <form onSubmit={handleSubmit} noValidate>
          <div className="grid-2">
            <FormField
              label="Nombre" name="nombre" value={formulario.nombre}
              onChange={handleChange} error={errores.nombre} requerido
            />
            <FormField
              label="Apellidos" name="apellido" value={formulario.apellido}
              onChange={handleChange} error={errores.apellido} requerido
            />
            <FormField
              label="Tipo de documento" name="tipo_documento_identificacion"
              as="select" value={formulario.tipo_documento_identificacion}
              onChange={handleChange} error={errores.tipo_documento_identificacion}
              requerido opciones={TIPOS_DOCUMENTO}
            />
            <FormField
              label="Número de documento" name="numero_documento_identificacion"
              value={formulario.numero_documento_identificacion}
              onChange={handleChange} error={errores.numero_documento_identificacion} requerido
            />
            <FormField
              label="Teléfono" name="telefono_cliente" tipo="tel"
              value={formulario.telefono_cliente} onChange={handleChange}
              error={errores.telefono_cliente} placeholder="300 123 4567" requerido maxLength={15}
            />
            <FormField
              label="Correo electrónico" name="correo_cliente" tipo="email"
              value={formulario.correo_cliente} onChange={handleChange}
              error={errores.correo_cliente} placeholder="cliente@correo.com"
            />
          </div>

          <FormField
            label="Dirección" name="direccion_cliente" value={formulario.direccion_cliente}
            onChange={handleChange} error={errores.direccion_cliente}
            placeholder="Calle 10 # 20-30, Bogotá"
          />

          <div style={{ display: "flex", gap: 10 }}>
            <Button tipo="submit" variante="primary" disabled={guardando}>
              {guardando ? "Guardando…" : idEditando ? "Guardar cambios" : "Registrar cliente"}
            </Button>
            {idEditando && (
              <Button variante="secondary" onClick={cancelarEdicion}>
                Cancelar edición
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card className="mb-md">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, documento, teléfono, correo o dirección…"
            aria-label="Buscar clientes"
            style={estiloBuscador}
          />
          <span style={{ fontSize: 12, color: "var(--tx-muted)" }}>
            {clientes.length} cliente(s) en total
            {filtrados.length !== clientes.length && ` · mostrando ${filtrados.length}`}
          </span>
        </div>
      </Card>

      {cargando ? (
        <Card>
          <Spinner texto="Cargando clientes…" />
        </Card>
      ) : (
        <DataTable
          columnas={COLUMNAS}
          datos={filtrados}
          tituloVacio={busqueda ? "Ningún cliente coincide" : "Aún no hay clientes"}
          mensajeVacio={
            busqueda
              ? "Prueba con otro nombre o número de documento."
              : "Registra al primer cliente con el formulario de arriba."
          }
          renderAcciones={(cliente) => (
            <div style={{ display: "flex", gap: 6 }}>
              <Button tamano="sm" variante="secondary" onClick={() => iniciarEdicion(cliente)}>
                Editar
              </Button>
              <Button tamano="sm" variante="danger" onClick={() => handleEliminar(cliente)}>
                Eliminar
              </Button>
            </div>
          )}
        />
      )}
    </div>
  );
}
