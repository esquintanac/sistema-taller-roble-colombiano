import RegisterForm from "../components/auth/RegisterForm";

export default function RegisterPage() {
    return (
        <div className="container-sm" style={{ maxWidth: 480, margin: "40px auto" }}>
            <h1>Unete al nuevo sistema</h1>
            <div className="card">
                <RegisterForm />
            </div>
        </div>
    );
}