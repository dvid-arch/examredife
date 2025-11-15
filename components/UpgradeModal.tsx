
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
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                <Card className="p-6 md:p-8">
                    <div className="text-center">
                        <div className="inline-block p-3 bg-primary-light rounded-full mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{currentRequest.title}</h1>
                        <p className="text-slate-600 mt-2">{currentRequest.message}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                        <ul className="space-y-3">
                            {currentRequest.featureList.slice(0, Math.ceil(currentRequest.featureList.length / 2)).map((feature, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <CheckIcon /> <span className="text-slate-700">{feature}</span>
                                </li>
                            ))}
                        </ul>
                         <ul className="space-y-3">
                            {currentRequest.featureList.slice(Math.ceil(currentRequest.featureList.length / 2)).map((feature, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <CheckIcon /> <span className="text-slate-700">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    
                    <div className="bg-slate-50 p-2 rounded-lg flex max-w-sm mx-auto border">
                        <button onClick={() => setBillingCycle('monthly')} className={`flex-1 p-2 rounded text-sm font-semibold ${billingCycle === 'monthly' ? 'bg-white shadow' : 'text-slate-600'}`}>Monthly</button>
                        <button onClick={() => setBillingCycle('yearly')} className={`flex-1 p-2 rounded text-sm font-semibold relative ${billingCycle === 'yearly' ? 'bg-white shadow' : 'text-slate-600'}`}>
                            Yearly
                            <span className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">Save 20%</span>
                        </button>
                    </div>
                    
                    <div className="mt-6">
                        <button onClick={upgradeToPro} className="w-full bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-accent transition-colors text-lg">
                            {billingCycle === 'yearly' ? 'Upgrade Now (₦10,000/year)' : 'Upgrade Now (₦1,000/month)'}
                        </button>
                        <p className="text-center text-xs text-slate-500 mt-2">This is a simulation. No payment will be processed.</p>
                    </div>

                </Card>
            </div>
        </div>
    );
};

export default UpgradeModal;
