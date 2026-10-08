// src/components/ui/DataTable.jsx
// Tabla generica con columnas configurables y slot de acciones por fila.
// Usada en el historial de diseños del administrador y en el listado
// de materiales (CRUD ya conectado con el backend)

export default function DataTable({
    columnas,
    datos,
    renderAcciones,
    tituloVacio = "No hay registros",
    mensajeVacio = "Todavía no hay nada para mostrar aquí.",
}) {
    // El colspan debe contar SOLO las columnas que realmente se pintan. Antes
    // era siempre columnas.length + 1, así que en las tablas sin acciones
    // (por ejemplo una que se pinte sin renderAcciones) sobraba una celda.
    const totalColumnas = columnas.length + (renderAcciones ? 1 : 0);

    return (
        <div className="table-wrap">
            <table>
                <thead>
                    <tr>
                        {columnas.map((col) => (
                            <th key={col.key}>{col.label}</th>
                        ))}

                        {renderAcciones && (
                            <th>Acciones</th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {datos.length === 0 && (
                        <tr>
                            <td colSpan={totalColumnas}>
                                {/* Estado vacío: una celda vacía con texto suelto
                                    parece un fallo de carga. */}
                                <div className="tabla-vacia">
                                    <span className="tabla-vacia-icono" aria-hidden="true">📭</span>
                                    <strong>{tituloVacio}</strong>
                                    <span>{mensajeVacio}</span>
                                </div>
                            </td>
                        </tr>
                    )}
                    {datos.map((fila, i) => (
                        <tr key={fila.id ?? i}>
                            {columnas.map((col) => (
                                <td key={col.key}>{col.render ? col.render(fila) : fila[col.key]}</td>
                            ))}
                            {renderAcciones && <td>{renderAcciones(fila)}</td>}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}