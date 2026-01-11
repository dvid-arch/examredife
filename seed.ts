import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'server/data');

const pastPapersData = [
    {
        id: 'jamb-english-2014',
        exam: 'JAMB',
        subject: 'English',
        year: 2014,
        questions: [
            {
                id: 'eng1-14',
                question: 'Choose the option that is nearest in meaning to the word "ephemeral".',
                options: {
                    A: { text: 'Everlasting' },
                    B: { text: 'Short-lived' },
                    C: { text: 'Beautiful' },
                    D: { text: 'Powerful' }
                },
                answer: 'B',
            },
            {
                id: 'eng2-14',
                question: 'From the words lettered A to D, choose the word that best completes the sentence: The suspect was ____ of all charges.',
                options: {
                    A: { text: 'acquitted' },
                    B: { text: 'convicted' },
                    C: { text: 'accused' },
                    D: { text: 'sentenced' }
                },
                answer: 'A',
            }
            // ... more questions will be added via script or manual copy if needed, 
            // but for now I'll just put a few and the user can use the admin panel
        ],
    }
];

const allStudyGuides = [
    {
        id: 'sg1',
        title: 'Cellular Respiration',
        subject: 'Biology',
        createdAt: '2024-05-20',
        content: '# Cellular Respiration\nContent here...'
    }
];

const initialLeaderboard = [
    { name: 'GlobalTopScorer', score: 100, totalQuestions: 100, date: Date.now() },
    { name: 'StudyMaster', score: 95, totalQuestions: 100, date: Date.now() }
];

const seed = () => {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

    fs.writeFileSync(path.join(DATA_DIR, 'papers.json'), JSON.stringify(pastPapersData, null, 2));
    fs.writeFileSync(path.join(DATA_DIR, 'guides.json'), JSON.stringify(allStudyGuides, null, 2));
    fs.writeFileSync(path.join(DATA_DIR, 'leaderboard.json'), JSON.stringify(initialLeaderboard, null, 2));
    console.log('Backend seeded with initial data.');
};

seed();
