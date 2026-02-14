import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authWithPassword, isAuthenticated } from '../lib/pb';
import { LogIn, Zap } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    if (isAuthenticated()) { navigate('/'); return null; }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await authWithPassword(email, password);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                    <div className="logo-icon" style={{ width: 56, height: 56, background: 'var(--gradient-primary)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
                        <Zap size={28} color="#fff" />
                    </div>
                </div>
                <h1>Marketing Hub</h1>
                <p className="login-subtitle">Sign in to manage your marketing operations</p>
                {error && <div className="login-error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <input className="form-input" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
                    <input className="form-input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                    <button className="btn btn-primary" type="submit" disabled={loading}>
                        {loading ? <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /> : <><LogIn size={18} /> Sign In</>}
                    </button>
                </form>
            </div>
        </div>
    );
}
