
import React from 'react';
import Card from './Card.tsx';

interface LoginPromptProps {
    onLogin: () => void;
    title: string;
    message: string;
}

const LoginPrompt: React.FC<LoginPromptProps> = ({ onLogin, title, message }) => (
    <Card className="text-center p-8 flex flex-col items-center justify-center h-full">
         <div className="bg-primary-light text-primary rounded-full p-4 inline-block mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        <p className="text-slate-600 mt-2 mb-6 max-w-md">{message}</p>
        <button onClick={onLogin} className="bg-primary text-white font-bold py-3 px-8 rounded-lg hover:bg-green-700 transition-colors">
            Login / Sign Up
        </button>
    </Card>
);

export default LoginPrompt;
