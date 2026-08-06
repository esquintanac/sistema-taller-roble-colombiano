// src/components/layout/Footer.jsx
// Pie de pagina con copyright, presente en todas las pantallas.

export default function Footer() {
    return (
        <footer style={{ background: "var(--seminegro)", color: "#7a8a87", fontSize: 12, textAlign: "center", padding: "15px 20px"}}>
            <div>
                &copy; 2026 Taller del Roble Colombiano · Sistema de Gestion de Inventarios y Diseño Grafico v1.0
            </div>
        </footer>
    );
}