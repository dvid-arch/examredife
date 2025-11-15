import React, { useState, useEffect } from 'react';
import Card from '../components/Card.tsx';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useNavigate } from 'react-router-dom';

// --- Icons ---
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536l12.232-12.232z" /></svg>;
const SaveIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const ProIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
const FreeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const CreditsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>;
const MessagesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;


const ProgressBar: React.FC<{ value: number, max: number }> = ({ value, max }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;
    return (
        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2.5">
            <div className="bg-primary h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
        </div>
    );
};

const StatItem: React.FC<{ icon: React.ReactNode, title: string, value: string | number, detail?: string, progressBar?: { value: number, max: number } }> = ({ icon, title, value, detail, progressBar }) => (
    <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
        <div className="text-primary dark:text-accent flex-shrink-0 mt-1">{icon}</div>
        <div className="flex-1">
            <p className="text-slate-600 dark:text-slate-400 text-sm">{title}</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{value}</p>
            {detail && <p className="text-xs text-slate-500 dark:text-slate-400">{detail}</p>}
            {progressBar && <div className="mt-2"><ProgressBar value={progressBar.value} max={progressBar.max} /></div>}
        </div>
    </div>
);


const Profile: React.FC = () => {
    const { user, updateUser, logout, requestUpgrade, isLoading } = useAuth();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user?.name || '');

    useEffect(() => {
        if (user) {
            setName(user.name);
        }
    }, [user]);

    const handleSave = async () => {
        if (name.trim() === '') return;
        if(updateUser) {
            await updateUser({ name });
        }
        setIsEditing(false);
    };

    const handleLogout = () => {
        logout();
        navigate('/dashboard');
    };

    if (isLoading) {
        return <Card><p className="p-8">Loading profile...</p></Card>;
    }

    if (!user) {
        return <Card><p className="p-8">Please log in to view your profile.</p></Card>;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const messagesUsedToday = user.lastMessageDate === today ? user.dailyMessageCount : 0;
    const freeMessagesRemaining = Math.max(0, 5 - messagesUsedToday);

    return (
        <div className="max-w-4xl mx-auto">
             <Card className="p-0 overflow-hidden">
                {/* Profile Header */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
                     <img
                        src="https://picsum.photos/128"
                        alt="profile"
                        className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-600 shadow-lg"
                    />
                    <div className="flex-1 text-center md:text-left">
                        {!isEditing ? (
                            <div className="flex items-center justify-center md:justify-start gap-3">
                                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">{user.name}</h1>
                                <button onClick={() => setIsEditing(true)} className="text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-accent transition-colors" aria-label="Edit name">
                                    <EditIcon />
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                    className="text-3xl font-bold bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary w-full"
                                    autoFocus
                                />
                                <button onClick={handleSave} className="bg-primary text-white font-bold p-2.5 rounded-lg hover:bg-accent" aria-label="Save name">
                                    <SaveIcon />
                                </button>
                            </div>
                        )}
                        <p className="text-slate-600 dark:text-slate-400 mt-1">{user.email}</p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white border-b dark:border-slate-700 pb-2">Account</h2>
                        
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-full ${user.subscription === 'pro' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                                {user.subscription === 'pro' ? <ProIcon /> : <FreeIcon />}
                            </div>
                            <div>
                                <p className="font-semibold text-slate-800 dark:text-white capitalize">{user.subscription} Plan</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    {user.subscription === 'pro' ? 'You have access to all premium features.' : 'Upgrade for unlimited access.'}
                                </p>
                            </div>
                        </div>

                        {user.subscription === 'free' && (
                             <button
                                onClick={() => requestUpgrade({
                                    title: "Upgrade to ExamRedi Pro",
                                    message: "Unlock your full potential and get the best results with our premium features.",
                                    featureList: [
                                        "Unlimited Practice Questions", "Unlimited AI Tutor Access", "Generate Custom Study Guides",
                                        "Save All Results & Track Performance", "Compete on the UTME Challenge Leaderboard"
                                    ]
                                })}
                                className="w-full bg-gradient-to-r from-primary to-accent text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity"
                            >
                                Upgrade to Pro
                            </button>
                        )}
                        
                        <div className="pt-6 border-t dark:border-slate-700">
                             <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-transparent border-2 border-red-500 text-red-500 font-bold py-2 px-4 rounded-lg hover:bg-red-500 hover:text-white transition-colors">
                                <LogoutIcon/>
                                <span>Logout</span>
                            </button>
                        </div>

                    </div>
                    {/* Right Column */}
                    <div className="space-y-6">
                         <h2 className="text-xl font-bold text-slate-800 dark:text-white border-b dark:border-slate-700 pb-2">Usage</h2>
                         
                         {user.subscription === 'pro' ? (
                            <>
                                <StatItem 
                                    icon={<CreditsIcon/>} 
                                    title="AI Credits Remaining" 
                                    value={user.aiCredits} 
                                    detail="Used for generating guides & research."
                                    progressBar={{value: user.aiCredits, max: 10}}
                                />
                                <StatItem 
                                    icon={<MessagesIcon/>} 
                                    title="AI Tutor Messages" 
                                    value="Unlimited" 
                                    detail="You have unlimited access to the AI Tutor."
                                />
                            </>
                         ) : (
                             <StatItem 
                                icon={<MessagesIcon/>} 
                                title="Free AI Tutor Messages" 
                                value={`${freeMessagesRemaining} left`} 
                                detail={`${messagesUsedToday} used today. Resets daily.`}
                                progressBar={{value: freeMessagesRemaining, max: 5}}
                            />
                         )}
                    </div>
                </div>
             </Card>
        </div>
    );
};
export default Profile;