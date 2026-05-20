'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword } from '@/utils/auth';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!token) {
        return (
            <div className="bg-brand-card/80 p-8 rounded-2xl backdrop-blur-xl border border-white/5 shadow-2xl w-full max-w-sm text-center relative z-10">
                <h1 className="text-2xl font-bold text-brand-danger mb-4">Ogiltig länk</h1>
                <p className="text-gray-300">Denna länk saknar ett återställningstoken. Vänligen använd den exakta länken du fick av administratören.</p>
            </div>
        );
    }

    if (success) {
        return (
            <div className="bg-brand-card/80 p-8 rounded-2xl backdrop-blur-xl border border-white/5 shadow-2xl w-full max-w-sm text-center space-y-4 relative z-10">
                <h1 className="text-2xl font-bold text-brand-primary">Lösenordet har ändrats!</h1>
                <p className="text-gray-300">Ditt lösenord har nu uppdaterats. Länken är förbrukad och kan inte användas igen.</p>
                <button onClick={() => router.push('/')} className="bg-brand-primary hover:bg-brand-primaryHover hover:shadow-[0_0_20px_rgba(5,150,105,0.4)] px-6 py-3 rounded-xl font-bold transition-all mt-4 inline-block text-white hover:scale-[1.02] active:scale-95 w-full">
                    Gå till startsidan och logga in
                </button>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        if (newPassword.length < 4) {
            setError('Lösenordet måste vara minst 4 tecken långt.');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            setError('Lösenorden matchar inte.');
            return;
        }

        setLoading(true);
        const res = await resetPassword(token, newPassword);
        if (res.success) {
            setSuccess(true);
        } else {
            setError(res.error || 'Något gick fel. Länken kan ha gått ut eller redan använts.');
        }
        setLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-brand-card/80 p-5 sm:p-8 rounded-2xl backdrop-blur-xl border border-white/5 shadow-2xl w-full max-w-md space-y-4 relative z-10">
            <h1 className="text-2xl font-bold text-center text-white mb-6">Välj Nytt Lösenord</h1>
            {error && <div className="bg-brand-danger/10 border border-brand-danger text-red-100 px-4 py-3 rounded-lg mb-4 text-sm font-medium">{error}</div>}
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Nytt Lösenord</label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full p-4 rounded-xl bg-black/40 border border-white/10 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all text-white font-medium"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Bekräfta Nytt Lösenord</label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full p-4 rounded-xl bg-black/40 border border-white/10 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all text-white font-medium"
                        required
                    />
                </div>
            </div>
            
            <button disabled={loading} type="submit" className={`w-full font-bold py-4 px-4 mt-4 rounded-xl transition-all shadow-lg ${loading ? 'bg-gray-800 text-gray-400 cursor-not-allowed border border-white/10' : 'bg-brand-primary hover:bg-brand-primaryHover hover:shadow-[0_0_20px_rgba(5,150,105,0.4)] hover:scale-[1.02] active:scale-95 text-white'}`}>
                {loading ? 'Sparar...' : 'Spara Nytt Lösenord'}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-8 bg-brand-dark text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(5,150,105,0.15),rgba(0,0,0,1)_60%)] pointer-events-none" />
            <Suspense fallback={<div className="text-gray-400 font-medium tracking-widest text-xs uppercase animate-pulse relative z-10">Laddar...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </main>
    );
}
