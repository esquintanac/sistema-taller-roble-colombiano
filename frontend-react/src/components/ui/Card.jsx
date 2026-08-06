// src/components/ui/Card.jsx
// Contenedor visual con borde y padding estandar, usado en todas las pantallas

export default function Card({ children, className = "" }) {
    return <div className={'card ${className}'}>{children}</div>;
}