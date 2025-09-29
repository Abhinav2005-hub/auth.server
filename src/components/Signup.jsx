import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringfy({ name, email, password }),
            });
            const data = await response.json();

            if (response.ok) {
                // Go to Verify OTP page
                navigate("/verify-otp", { stste: { email } });
            } else {
                setError(data.error || "Signup failed");
            }
        } catch (err) {
            setError("Something went wrong");
            console.error(err);
        }
    };

    return (
        <form onSubmit={handleSignup}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
            <button type="submit">Signup</button>
            {error && <p style={{ color: "red" }}>{error}</p>}
        </form>
    );
}

export default Signup;