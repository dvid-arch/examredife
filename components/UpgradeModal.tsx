
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import apiService from '../services/apiService.ts';

export interface UpgradeRequest {
    title: string;
    message: string;
    featureList: string[];
}

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: UpgradeRequest | null;
}

const features = [
    { icon: '✦', label: 'Unlimited Practice Questions' },
    { icon: '🤖', label: 'Unlimited AI Tutor Access' },
    { icon: '📚', label: 'Generate Custom Study Guides' },
    { icon: '📊', label: 'Save All Results & Track Performance' },
    { icon: '🏆', label: 'Compete on the UTME Challenge Leaderboard' },
    { icon: '🔔', label: 'Priority Support & Updates' },
];

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, request }) => {
    const { user } = useAuth();
    const [billingCycle, setBillingCycle] = useState<'day' | 'monthly' | 'yearly'>('yearly');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleUpgrade = () => {
        const phoneNumber = "2348123456789"; // Replace with your actual WhatsApp number
        const planNames: Record<string, string> = {
            'day': 'Day Pass (₦200)',
            'monthly': 'Monthly Plan (₦2,500)',
            'yearly': 'Yearly Plan (₦24,000)' // Adjusted display price logic in file says 2000/mo * 12? No, 2000 is price shown.
        };
        const selectedPlanName = billingCycle === 'yearly' ? 'Yearly Plan (₦24,000 total)' : planNames[billingCycle];
        const message = `Hi ExamRedi, I would like to upgrade my account to the ${selectedPlanName}. My email is ${user?.email || 'not provided'}.`;
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
    };

    const defaultRequest: UpgradeRequest = {
        title: 'Upgrade to ExamRedi Pro',
        message: 'Unlock your full potential and pass your exams with confidence.',
        featureList: features.map(f => f.label),
    };

    const currentRequest = request || defaultRequest;
    const price = billingCycle === 'yearly' ? '₦2,000' : billingCycle === 'monthly' ? '₦2,500' : '₦200';
    const period = billingCycle === 'yearly' ? '/mo · billed yearly' : billingCycle === 'monthly' ? '/mo' : '/day pass';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(10, 15, 30, 0.75)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)', border: '1px solid rgba(99,102,241,0.3)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Glow accent */}
                <div style={{
                    position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                    width: '60%', height: '2px',
                    background: 'linear-gradient(90deg, transparent, #6366f1, #a78bfa, #6366f1, transparent)'
                }} />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
                    aria-label="Close"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>

                <div className="p-6 sm:p-8">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
                            style={{ background: 'rgba(99,102,241,0.15)', color: '#a78bfa', border: '1px solid rgba(99,102,241,0.3)' }}>
                            <span>✦</span> PRO PLAN
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{currentRequest.title}</h2>
                        <p className="text-slate-400 text-sm">{currentRequest.message}</p>
                    </div>

                    {/* Billing toggle */}
                    <div className="flex justify-center mb-6">
                        <div className="flex gap-1 rounded-lg p-1" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <button
                                onClick={() => setBillingCycle('day')}
                                className="px-3 py-1.5 rounded-md text-sm font-medium transition-all"
                                style={billingCycle === 'day'
                                    ? { background: 'rgba(99,102,241,0.8)', color: 'white' }
                                    : { color: '#94a3b8' }}
                            >
                                Day Pass
                            </button>
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className="px-3 py-1.5 rounded-md text-sm font-medium transition-all"
                                style={billingCycle === 'monthly'
                                    ? { background: 'rgba(99,102,241,0.8)', color: 'white' }
                                    : { color: '#94a3b8' }}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingCycle('yearly')}
                                className="px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2"
                                style={billingCycle === 'yearly'
                                    ? { background: 'rgba(99,102,241,0.8)', color: 'white' }
                                    : { color: '#94a3b8' }}
                            >
                                Yearly
                                <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                                    style={{ background: '#fbbf24', color: '#713f12' }}>-20%</span>
                            </button>
                        </div>
                    </div>

                    {/* Price */}
                    <div className="text-center mb-6">
                        <div className="flex items-end justify-center gap-1">
                            <span className="text-4xl font-extrabold text-white">{price}</span>
                            <span className="text-slate-400 text-sm mb-1">{period}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Instant Activation · Safe & Secure</p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 mb-6">
                        {features.map((f, i) => (
                            <li key={i} className="flex items-center gap-3">
                                <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full text-xs"
                                    style={{ background: 'rgba(99,102,241,0.2)', color: '#a78bfa' }}>✓</span>
                                <span className="text-slate-300 text-sm">{f.label}</span>
                            </li>
                        ))}
                    </ul>

                    {/* CTA */}
                    <button
                        onClick={handleUpgrade}
                        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-95 shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', boxShadow: '0 4px 20px rgba(37,211,102,0.3)' }}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        Upgrade via WhatsApp
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;
