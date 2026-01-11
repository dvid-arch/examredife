
import React, { useState } from 'react';
import Card from './Card.tsx';
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

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, request }) => {
    const { upgradeToPro } = useAuth();
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

    if (!isOpen) return null;

    const defaultRequest: UpgradeRequest = {
        title: "Upgrade to ExamRedi Pro",
        message: "Unlock your full potential and get the best results with our premium features.",
        featureList: [
            "Unlimited Practice Questions",
            "Unlimited AI Tutor Access",
            "Generate Custom Study Guides",
            "Save All Results & Track Performance",
            "Compete on the UTME Challenge Leaderboard"
        ]
    };

    const currentRequest = request || defaultRequest;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-3 sm:p-4 overflow-y-auto" onClick={onClose}>
            <div className="max-w-2xl w-full my-4 sm:my-0" onClick={e => e.stopPropagation()}>
                <Card className="p-5 sm:p-6 md:p-8">
                    <div className="text-center">
                        <div className="inline-block p-3 bg-primary-light rounded-full mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200">{currentRequest.title}</h1>
                        <p className="text-slate-600 dark:text-slate-300 mt-2">{currentRequest.message}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                        <ul className="space-y-3">
                            {currentRequest.featureList.slice(0, Math.ceil(currentRequest.featureList.length / 2)).map((feature, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <CheckIcon /> <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <ul className="space-y-3">
                            {currentRequest.featureList.slice(Math.ceil(currentRequest.featureList.length / 2)).map((feature, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <CheckIcon /> <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg flex max-w-sm mx-auto border">
                        <button onClick={() => setBillingCycle('monthly')} className={`flex-1 p-2 rounded text-sm font-semibold ${billingCycle === 'monthly' ? 'bg-white dark:bg-slate-700 shadow' : 'text-slate-600 dark:text-slate-400'}`}>Monthly</button>
                        <button onClick={() => setBillingCycle('yearly')} className={`flex-1 p-2 rounded text-sm font-semibold relative ${billingCycle === 'yearly' ? 'bg-white dark:bg-slate-700 shadow' : 'text-slate-600 dark:text-slate-400'}`}>
                            Yearly
                            <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">Save 20%</span>
                        </button>
                    </div>

                    <div className="mt-6">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg mb-4 text-center">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>Manual Activation Required:</strong><br />
                                To upgrade your account, please chat with our admin on WhatsApp to complete your payment and activation.
                            </p>
                        </div>
                        <a
                            href={`https://wa.me/2348000000000?text=${encodeURIComponent('Hello, I want to upgrade my ExamRedi account to Pro.')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full bg-[#25D366] text-white font-bold py-3 px-6 rounded-lg hover:bg-[#128C7E] transition-colors text-lg flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
                            Chat on WhatsApp to Upgrade
                        </a>
                    </div>

                </Card>
            </div>
        </div>
    );
};

export default UpgradeModal;
