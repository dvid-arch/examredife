
import React from 'react';
import Card from './Card.tsx';

interface FeatureLockPromptProps {
    onLoginRequest: () => void;
    onClose: () => void;
    title: string;
    message: string;
    featureList: string[];
}

const FeatureLockPrompt: React.FC<FeatureLockPromptProps> = ({ onLoginRequest, onClose, title, message, featureList }) => (
    <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm flex items-center justify-center z-20 p-4">
        <Card className="text-center p-8 max-w-lg w-full shadow-2xl">
            <div className="bg-primary-light text-primary rounded-full p-4 inline-block mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
            <p className="text-slate-600 mt-2 mb-6">{message}</p>
            <ul className="text-left space-y-2 mb-6 inline-block">
                {featureList.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-slate-700">{feature}</span>
                    </li>
                ))}
            </ul>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button onClick={onClose} className="font-semibold text-slate-600 py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors">
                    Maybe Later
                </button>
                <button onClick={onLoginRequest} className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors">
                    Unlock Full Access
                </button>
            </div>
        </Card>
    </div>
);

export default FeatureLockPrompt;
