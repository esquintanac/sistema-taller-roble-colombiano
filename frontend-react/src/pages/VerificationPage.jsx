import VerificationCodeForm from "../components/auth/VerificationCodeForm";

export default function VerificationPage() {
    return (
        <div className="container-sm" style={{ maxWidth: 420, margin: "80px auto" }}>
            <div className="card">
                <h1 style={{ fontSize: 22 }}>Verificación de seguridad</h1>
                <VerificationCodeForm/>
            </div>
        </div>
    );
}