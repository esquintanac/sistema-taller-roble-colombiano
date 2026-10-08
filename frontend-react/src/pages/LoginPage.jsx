// src/pages/LoginPage.jsx
// Réplica del login del prototipo (frontend/index.html): pantalla partida
// 50/50 con el hero de la marca a la izquierda y el formulario a la derecha.
// Solo cambia la presentación; la lógica de acceso sigue en LoginForm.
import { Link } from "react-router-dom";
import heroCarpinteria from "../assets/hero-carpinteria.jpg";
import LoginForm from "../components/auth/LoginForm";

// Beneficios del hero: título + descripción corta (refinamiento sobre el
// prototipo, que muestra una sola línea por ítem).
const BENEFICIOS = [
    { icono: "fa-couch", titulo: "Diseño de muebles y closets", desc: "Propuestas a medida para cada espacio." },
    { icono: "fa-cube", titulo: "Modelos 3D con medidas exactas", desc: "Visualiza el resultado antes de fabricarlo." },
    { icono: "fa-boxes-stacked", titulo: "Control de materiales", desc: "Inventario y costos siempre a la mano." },
    { icono: "fa-users-gear", titulo: "Roles y permisos", desc: "Cada persona ve solo lo que le corresponde." },
    { icono: "fa-clock-rotate-left", titulo: "Historial completo", desc: "Todos los diseños, ordenados por fecha." },
];

export default function LoginPage() {
    return (
        <div className="page-auth">
            {/* LADO IZQUIERDO: HERO CON LA IDENTIDAD DEL TALLER */}
            <div className="auth-hero">
                <img src={heroCarpinteria} alt="Taller de carpintería" className="hero-bg-image" />

                <div className="auth-hero-content">
                    <h1>
                        Taller del <span>Roble</span> Colombiano
                    </h1>
                    <p className="subtitle-hero">
                        Sistema integral de gestión para carpintería artesanal y
                        diseño de mobiliario a medida.
                    </p>
                    <ul className="auth-features">
                        {BENEFICIOS.map((item) => (
                            <li key={item.titulo}>
                                <i className={`fas ${item.icono}`} aria-hidden="true"></i>
                                <div className="feature-text">
                                    <span className="feature-title">{item.titulo}</span>
                                    <span className="feature-desc">{item.desc}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* LADO DERECHO: FORMULARIO DE ACCESO */}
            <div className="auth-form-side">
                <div className="auth-form-wrapper">
                    <h2>Iniciar sesión</h2>
                    <p className="subtitle">Ingresa tus credenciales para acceder al sistema</p>

                    <div className="card auth-card">
                        <LoginForm />
                    </div>

                    <p className="auth-footer">
                        ¿No tienes cuenta? <Link to="/registro">Regístrate aquí</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}