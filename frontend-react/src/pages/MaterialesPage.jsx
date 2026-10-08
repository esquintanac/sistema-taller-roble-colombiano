import MaterialesCrud from "../components/admin/MaterialesCrud";
import ClimaTaller from "../components/admin/ClimaTaller";

export default function MaterialesPage() {
    return (
        <div className="container" style={{ paddingTop: 30 }}>
            {/* La humedad va antes que el inventario porque es justo el dato
                que condiciona cómo deben guardarse las láminas listadas. */}
            <ClimaTaller />
            <MaterialesCrud />
        </div>
    );
}