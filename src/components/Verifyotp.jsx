import { useState } from "react";
import  { useLocation, useNavigate } from "react-router-dom"; 

function Verifyotp() {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    const handleVerifyotp = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("/signup/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringfy({ otp }),
            });

            const data = await response.json();

            if (response.ok) {
                alert("User verified! JWT: " + data.token);
                // Navigate to dashboard or home page
                navigate("/dashboard"); 
            } else {
                setError(data.error || "OTP verification failed");
            }
        } catch (err) {
            setError("Something went wrong");
                console.error(err);
        }
    };

    return (
        <form onSubmit={handleVerifyotp}>
            <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter OTP" />
            <button typr="submit">Verify OTP</button>
            {error && <p style={{ color: "red" }}>{error}</p>}
        </form>
    );
}

export default VerifyOtp;