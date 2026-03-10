
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';

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
    const { upgradeToPro } = useAuth();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

    if (!isOpen) return null;

    const defaultRequest: UpgradeRequest = {
        title: 'Upgrade to ExamRedi Pro',
        message: 'Unlock your full potential and pass your exams with confidence.',
        featureList: features.map(f => f.label),
    };

    const currentRequest = request || defaultRequest;
    const price = billingCycle === 'yearly' ? '₦2,000' : '₦2,500';
    const period = billingCycle === 'yearly' ? '/mo · billed yearly' : '/mo';

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
                                onClick={() => setBillingCycle('monthly')}
                                className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
                                style={billingCycle === 'monthly'
                                    ? { background: 'rgba(99,102,241,0.8)', color: 'white' }
                                    : { color: '#94a3b8' }}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingCycle('yearly')}
                                className="px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2"
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
                        <p className="text-xs text-slate-500 mt-1">Free to start · No credit card required</p>
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
                    <a
                        href={`https://wa.me/2349031608725?text=${encodeURIComponent('Hello, I want to upgrade my ExamRedi account to Pro.')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-white text-base transition-all hover:opacity-90 active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)', boxShadow: '0 4px 20px rgba(37,211,102,0.3)' }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                        </svg>
                        Chat on WhatsApp to Upgrade
                    </a>

                    <p className="text-center text-xs text-slate-500 mt-3">
                        💬 Manual activation · Admin will confirm within minutes
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;
