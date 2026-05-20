'use client';
import { useState, useEffect } from 'react';
import { 
    adminLogin, fetchAllUsers, deleteUser, resetUserGames, clearAllGames, 
    generateResetLink, fetchWords, addWord, deleteWord, fetchSystemStats, 
    renameUser, fetchUserStats 
} from '@/utils/admin_api';

export default function AdminPage() {
    const [token, setToken] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [words, setWords] = useState<string[]>([]);
    const [systemStats, setSystemStats] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Tab state
    const [activeTab, setActiveTab] = useState<'users' | 'words'>('users');
    
    // Search states
    const [userSearch, setUserSearch] = useState('');
    const [wordSearch, setWordSearch] = useState('');
    
    // New Word state
    const [newWord, setNewWord] = useState('');
    
    // Modals state
    const [editingUser, setEditingUser] = useState<any>(null);
    const [newUsername, setNewUsername] = useState('');
    
    const [viewingStatsFor, setViewingStatsFor] = useState<any>(null);
    const [userDetailedStats, setUserDetailedStats] = useState<any>(null);

    // Filtered lists
    const filteredUsers = users.filter(u => u.username.toLowerCase().includes(userSearch.toLowerCase()));
    const filteredWords = words.filter(w => w.toLowerCase().includes(wordSearch.toLowerCase()));

    useEffect(() => {
        const storedToken = sessionStorage.getItem('adminToken');
        if (storedToken) {
            setToken(storedToken);
            loadData(storedToken);
        }
    }, []);

    const loadData = async (authToken: string) => {
        setLoading(true);
        try {
            const [usersRes, wordsRes, statsRes] = await Promise.all([
                fetchAllUsers(authToken),
                fetchWords(authToken),
                fetchSystemStats(authToken)
            ]);
            
            if (usersRes.success && usersRes.users) setUsers(usersRes.users);
            if (wordsRes.success && wordsRes.words) setWords(wordsRes.words);
            if (statsRes.success && statsRes.stats) setSystemStats(statsRes.stats);
            
            if (!usersRes.success && (usersRes.error === 'Invalid admin token' || usersRes.error === 'Unauthorized')) {
                handleLogout();
            }
        } catch (err) {
            setError('Kunde inte hämta data från servern.');
        }
        setLoading(false);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        const res = await adminLogin(password);
        if (res.success && res.token) {
            setToken(res.token);
            sessionStorage.setItem('adminToken', res.token);
            loadData(res.token);
        } else {
            setError(res.error || 'Inloggning misslyckades.');
        }
        setLoading(false);
    };

    const handleLogout = () => {
        setToken(null);
        sessionStorage.removeItem('adminToken');
        setUsers([]);
        setWords([]);
        setSystemStats(null);
    };

    // User Actions
    const handleDeleteUser = async (username: string) => {
        if (!confirm(`Är du säker på att du vill radera ${username}?`)) return;
        const res = await deleteUser(token!, username);
        if (res.success) {
            setMessage(`Raderade användare ${username}.`);
            loadData(token!);
        } else setError(res.error || `Kunde inte radera ${username}.`);
    };

    const handleResetGames = async (username: string) => {
        if (!confirm(`Är du säker på att du vill nollställa spelen för ${username}?`)) return;
        const res = await resetUserGames(token!, username);
        if (res.success) {
            setMessage(`Nollställde spelen för ${username}.`);
            loadData(token!);
        } else setError(res.error || `Kunde inte nollställa spelen för ${username}.`);
    };

    const handleGenerateResetLink = async (username: string) => {
        const res = await generateResetLink(token!, username);
        if (res.success && res.reset_token) {
            const url = `${window.location.origin}/reset-password?token=${res.reset_token}`;
            setMessage(`Återställningslänk för ${username} (Kopiera denna):\n\n${url}`);
        } else setError(res.error || `Kunde inte skapa länk för ${username}.`);
    };

    const handleRenameUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser || !newUsername) return;
        const res = await renameUser(token!, editingUser.username, newUsername);
        if (res.success) {
            setMessage(`Bytte namn från ${editingUser.username} till ${newUsername}.`);
            setEditingUser(null);
            loadData(token!);
        } else {
            setError(res.error || `Kunde inte byta namn.`);
        }
    };

    const handleViewStats = async (user: any) => {
        setViewingStatsFor(user);
        setUserDetailedStats(null);
        const res = await fetchUserStats(token!, user.username);
        if (res.success && res.stats) {
            setUserDetailedStats(res.stats);
        } else {
            setError(res.error || `Kunde inte hämta statistik för ${user.username}.`);
            setViewingStatsFor(null);
        }
    };

    const handleClearAllGames = async () => {
        if (!confirm(`VARNING: Är du säker på att du vill radera ALLA aktiva spel från databasen?`)) return;
        const res = await clearAllGames(token!);
        if (res.success) setMessage('Alla aktiva spel har raderats från databasen.');
        else setError(res.error || 'Kunde inte radera alla spel.');
    };

    // Word Actions
    const handleAddWord = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newWord) return;
        const wordUpper = newWord.toUpperCase().trim();
        const res = await addWord(token!, wordUpper);
        if (res.success) {
            setMessage(`Lade till ordet: ${wordUpper}`);
            setNewWord('');
            loadData(token!);
        } else setError(res.error || `Kunde inte lägga till ordet.`);
    };

    const handleDeleteWord = async (word: string) => {
        if (!confirm(`Är du säker på att du vill radera ordet ${word}?`)) return;
        const res = await deleteWord(token!, word);
        if (res.success) {
            setMessage(`Raderade ordet ${word}.`);
            loadData(token!);
        } else setError(res.error || `Kunde inte radera ordet.`);
    };

    if (!token) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-8 bg-brand-dark text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(5,150,105,0.15),rgba(0,0,0,1)_60%)] pointer-events-none" />
                <form onSubmit={handleLogin} className="bg-brand-card/80 p-5 sm:p-8 rounded-2xl backdrop-blur-xl border border-white/5 shadow-2xl w-full max-w-sm space-y-4 relative z-10">
                    <h1 className="text-2xl font-bold text-center text-white mb-4">Admin Login</h1>
                    {error && <div className="bg-brand-danger/10 border border-brand-danger text-red-100 px-4 py-3 rounded-lg text-sm font-medium text-center">{error}</div>}
                    <div>
                        <input
                            type="password"
                            placeholder="Admin Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 rounded-xl bg-black/40 border border-white/10 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all text-white font-medium"
                        />
                    </div>
                    <button disabled={loading} type="submit" className={`w-full font-bold py-4 px-4 rounded-xl transition-all shadow-lg ${loading ? 'bg-gray-800 text-gray-400 cursor-not-allowed border border-white/10' : 'bg-brand-primary hover:bg-brand-primaryHover hover:shadow-[0_0_20px_rgba(5,150,105,0.4)] hover:scale-[1.02] active:scale-95 text-white'}`}>
                        {loading ? 'Loggar in...' : 'Logga in'}
                    </button>
                </form>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-brand-dark text-white p-4 md:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(5,150,105,0.15),rgba(0,0,0,1)_60%)] pointer-events-none" />
            
            <div className="max-w-6xl mx-auto space-y-6 relative z-10">
                
                {/* Header & System Stats */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-brand-card/80 p-5 rounded-2xl backdrop-blur-xl border border-white/5 shadow-xl gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
                        {systemStats && (
                            <div className="flex gap-4 text-sm font-medium text-brand-primary">
                                <span className="bg-brand-primary/10 px-3 py-1 rounded-lg border border-brand-primary/20">Aktiva Spel i Minne: {systemStats.active_games_in_memory}</span>
                                <span className="bg-brand-primary/10 px-3 py-1 rounded-lg border border-brand-primary/20">Anslutna Spelare: {systemStats.online_players}</span>
                            </div>
                        )}
                    </div>
                    <button onClick={handleLogout} className="bg-brand-danger/80 hover:bg-brand-danger px-6 py-2 rounded-xl font-bold transition-all shadow-lg hover:shadow-[0_0_15px_rgba(239,68,68,0.4)] text-white w-full md:w-auto">
                        Logga ut
                    </button>
                </div>

                {/* Notifications */}
                {error && <div className="bg-brand-danger/10 border border-brand-danger text-red-100 p-4 rounded-xl text-sm font-medium flex justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300">✕</button>
                </div>}
                {message && (
                    <div className="bg-brand-primary/10 border border-brand-primary text-brand-primary p-4 rounded-xl whitespace-pre-wrap break-all text-sm font-medium flex justify-between">
                        <span>{message}</span>
                        <button onClick={() => setMessage(null)} className="text-brand-primary hover:text-green-300">✕</button>
                    </div>
                )}

                {/* Tab Navigation */}
                <div className="flex gap-2">
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-3 rounded-t-xl font-bold transition-colors ${activeTab === 'users' ? 'bg-brand-card/80 text-brand-primary border-t border-x border-white/5' : 'bg-black/20 text-gray-400 hover:text-white'}`}
                    >
                        Användare
                    </button>
                    <button 
                        onClick={() => setActiveTab('words')}
                        className={`px-6 py-3 rounded-t-xl font-bold transition-colors ${activeTab === 'words' ? 'bg-brand-card/80 text-brand-primary border-t border-x border-white/5' : 'bg-black/20 text-gray-400 hover:text-white'}`}
                    >
                        Ordhantering
                    </button>
                </div>

                {/* Tabs Content Container */}
                <div className="bg-brand-card/80 p-6 rounded-b-2xl rounded-tr-2xl backdrop-blur-xl border border-white/5 shadow-xl -mt-6 z-20 relative">
                    
                    {/* TAB: USERS */}
                    {activeTab === 'users' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <h2 className="text-xl font-bold text-white">Användare ({users.length})</h2>
                                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                                    <input 
                                        type="text" 
                                        placeholder="Sök användare..." 
                                        value={userSearch}
                                        onChange={(e) => setUserSearch(e.target.value)}
                                        className="w-full sm:w-64 p-2 rounded-lg bg-black/40 border border-white/10 focus:border-brand-primary outline-none text-white text-sm transition-all"
                                    />
                                    <button onClick={handleClearAllGames} className="bg-orange-600/80 hover:bg-orange-600 px-4 py-2 rounded-lg font-bold transition-all shadow-lg text-sm text-white shrink-0 w-full sm:w-auto">
                                        Rensa DB-Spel
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-white/5">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 bg-black/20">
                                            <th className="p-4 font-semibold text-gray-300">Namn</th>
                                            <th className="p-4 font-semibold text-gray-300">Spel</th>
                                            <th className="p-4 font-semibold text-gray-300">Skapad</th>
                                            <th className="p-4 font-semibold text-right text-gray-300">Åtgärder</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-black/10">
                                        {loading ? (
                                            <tr><td colSpan={4} className="p-6 text-center text-gray-400 font-medium">Laddar...</td></tr>
                                        ) : filteredUsers.length === 0 ? (
                                            <tr><td colSpan={4} className="p-6 text-center text-gray-400 font-medium">Inga användare hittades.</td></tr>
                                        ) : (
                                            filteredUsers.map(u => (
                                                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                    <td className="p-4 font-bold text-white">{u.username}</td>
                                                    <td className="p-4 font-medium">{u.games ? u.games.length : 0}</td>
                                                    <td className="p-4 text-sm text-gray-400 font-medium">{new Date(u.created_at).toLocaleDateString()}</td>
                                                    <td className="p-4 text-right space-x-2">
                                                        <button onClick={() => handleViewStats(u)} className="bg-purple-600/80 hover:bg-purple-500 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all text-white shadow-md">
                                                            Statistik
                                                        </button>
                                                        <button onClick={() => { setEditingUser(u); setNewUsername(u.username); }} className="bg-blue-600/80 hover:bg-blue-500 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all text-white shadow-md">
                                                            Byt Namn
                                                        </button>
                                                        <button onClick={() => handleGenerateResetLink(u.username)} className="bg-brand-primary/80 hover:bg-brand-primary px-3 py-1.5 rounded-lg text-sm font-semibold transition-all text-white shadow-md">
                                                            Lösenordslänk
                                                        </button>
                                                        <button onClick={() => handleResetGames(u.username)} className="bg-yellow-600/80 hover:bg-yellow-500 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all text-white shadow-md">
                                                            Nollställ Spel
                                                        </button>
                                                        <button onClick={() => handleDeleteUser(u.username)} className="bg-brand-danger/80 hover:bg-brand-danger px-3 py-1.5 rounded-lg text-sm font-semibold transition-all text-white shadow-md">
                                                            Radera
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TAB: WORDS */}
                    {activeTab === 'words' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <h2 className="text-xl font-bold text-white">Godkända Ord ({words.length})</h2>
                                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                                    <input 
                                        type="text" 
                                        placeholder="Sök ord..." 
                                        value={wordSearch}
                                        onChange={(e) => setWordSearch(e.target.value)}
                                        className="w-full sm:w-48 p-2 rounded-lg bg-black/40 border border-white/10 focus:border-brand-primary outline-none text-white text-sm transition-all"
                                    />
                                    <form onSubmit={handleAddWord} className="flex gap-2 w-full sm:w-auto">
                                        <input 
                                            type="text" 
                                            placeholder="Nytt ord..." 
                                            value={newWord}
                                            onChange={(e) => setNewWord(e.target.value)}
                                            className="w-full sm:w-40 p-2 rounded-lg bg-black/40 border border-white/10 focus:border-brand-primary outline-none text-white text-sm uppercase transition-all"
                                        />
                                        <button type="submit" className="bg-brand-primary/80 hover:bg-brand-primary px-4 py-2 rounded-lg font-bold transition-all shadow-lg text-sm text-white shrink-0">
                                            Lägg Till
                                        </button>
                                    </form>
                                </div>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-white/5">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-white/10 bg-black/20">
                                            <th className="p-4 font-semibold text-gray-300">Ord</th>
                                            <th className="p-4 font-semibold text-right text-gray-300">Åtgärder</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-black/10">
                                        {loading && words.length === 0 ? (
                                            <tr><td colSpan={2} className="p-6 text-center text-gray-400 font-medium">Laddar...</td></tr>
                                        ) : filteredWords.length === 0 ? (
                                            <tr><td colSpan={2} className="p-6 text-center text-gray-400 font-medium">Inga ord hittades.</td></tr>
                                        ) : (
                                            filteredWords.map(w => (
                                                <tr key={w} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                                    <td className="p-4 font-bold text-white tracking-widest">{w}</td>
                                                    <td className="p-4 text-right space-x-2">
                                                        <button onClick={() => handleDeleteWord(w)} className="bg-brand-danger/80 hover:bg-brand-danger px-3 py-1.5 rounded-lg text-sm font-semibold transition-all text-white shadow-md">
                                                            Radera
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Rename Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <form onSubmit={handleRenameUser} className="bg-brand-card/95 p-6 rounded-2xl border border-white/10 shadow-2xl w-full max-w-sm">
                        <h2 className="text-xl font-bold mb-4 text-white">Byt namn på {editingUser.username}</h2>
                        <input
                            type="text"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            className="w-full p-4 rounded-xl bg-black/40 border border-white/10 focus:border-brand-primary outline-none text-white mb-6 font-medium"
                            placeholder="Nytt användarnamn"
                            required
                        />
                        <div className="flex gap-3">
                            <button type="submit" className="flex-1 bg-brand-primary hover:bg-brand-primaryHover py-3 rounded-xl font-bold transition-all text-white shadow-lg">
                                Spara
                            </button>
                            <button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-gray-600 hover:bg-gray-500 py-3 rounded-xl font-bold transition-all text-white shadow-lg">
                                Avbryt
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Stats Modal */}
            {viewingStatsFor && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-brand-card/95 p-6 rounded-2xl border border-white/10 shadow-2xl w-full max-w-sm text-center">
                        <h2 className="text-xl font-bold mb-6 text-white">Statistik för <span className="text-brand-primary">{viewingStatsFor.username}</span></h2>
                        {userDetailedStats ? (
                            <div className="space-y-4 mb-6">
                                <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-1 font-semibold">Totalt Antal Spel</p>
                                    <p className="text-4xl font-black text-white">{userDetailedStats.total_games}</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1 bg-black/30 p-4 rounded-xl border border-white/5 border-b-4 border-b-brand-primary">
                                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1 font-semibold">Vinster</p>
                                        <p className="text-3xl font-black text-brand-primary">{userDetailedStats.wins}</p>
                                    </div>
                                    <div className="flex-1 bg-black/30 p-4 rounded-xl border border-white/5 border-b-4 border-b-brand-danger">
                                        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1 font-semibold">Förluster</p>
                                        <p className="text-3xl font-black text-brand-danger">{userDetailedStats.losses}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 text-brand-primary animate-pulse font-bold tracking-widest uppercase text-sm">Hämtar data...</div>
                        )}
                        <button onClick={() => setViewingStatsFor(null)} className="w-full bg-gray-600 hover:bg-gray-500 py-3 rounded-xl font-bold transition-all text-white shadow-lg">
                            Stäng
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
