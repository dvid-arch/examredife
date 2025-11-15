
import React from 'react';
import { Link } from 'react-router-dom';

const PuzzleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>;
const StopwatchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const GameTile: React.FC<{ title: string; color: string; path: string; icon: React.ReactNode; description: string }> = ({ title, color, path, icon, description }) => (
    <Link to={path} className={`bg-${color} p-6 rounded-lg shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between`}>
        <div>
            <div className="w-16 h-16 mb-4 rounded-full bg-white flex items-center justify-center">
                 {icon}
            </div>
            <h3 className="font-bold text-xl text-slate-800 mb-2">{title}</h3>
            <p className="text-slate-700 text-sm">{description}</p>
        </div>
        <div className="mt-6 text-right">
             <span className="font-semibold text-primary">Play Now &rarr;</span>
        </div>
    </Link>
);


const EducationalGames: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Educational Games</h1>
      <p className="text-slate-600">Sharpen your mind and test your knowledge with these fun games.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GameTile 
            title="Memory Match"
            description="Test your knowledge by matching terms to their definitions. A fun way to reinforce key concepts."
            path="/games/memory-match"
            color="tile-blue"
            icon={<PuzzleIcon />}
          />
          <GameTile 
            title="Subject Sprint"
            description="Answer as many questions as you can against the clock in this fast-paced trivia challenge."
            path="/games/subject-sprint"
            color="tile-pink"
            icon={<StopwatchIcon />}
          />
      </div>
    </div>
  );
};

export default EducationalGames;