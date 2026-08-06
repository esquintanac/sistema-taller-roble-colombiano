// src/components/ui/DataTable.jsx
// Tabla generica con dos columnas configurables y slot de acciones por fila.
// Usada en el historial de diseños del administrador y en el listado
// de materiales (CRUD ya conectado con el backend)

export default function DataTable({ columnas, datos, renderAcciones }) {
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
                            <td colSpan={columnas.length + 1}> No hay registros para mostrar.</td>
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