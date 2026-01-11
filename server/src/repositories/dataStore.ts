import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const PAPERS_FILE = path.join(DATA_DIR, 'papers.json');
const GUIDES_FILE = path.join(DATA_DIR, 'guides.json');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');
const PERFORMANCE_FILE = path.join(DATA_DIR, 'performance.json');

export const initializeData = () => {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    // Seed initial users if not exists
    if (!fs.existsSync(USERS_FILE)) {
        const initialUsers: any[] = [];
        fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2));
    }

    if (!fs.existsSync(PAPERS_FILE)) fs.writeFileSync(PAPERS_FILE, JSON.stringify([], null, 2));
    if (!fs.existsSync(GUIDES_FILE)) fs.writeFileSync(GUIDES_FILE, JSON.stringify([], null, 2));
    if (!fs.existsSync(LEADERBOARD_FILE)) fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify([], null, 2));
    if (!fs.existsSync(PERFORMANCE_FILE)) fs.writeFileSync(PERFORMANCE_FILE, JSON.stringify([], null, 2));

    console.log('Data store initialized.');
};

export const readData = <T>(file: string): T[] => {
    try {
        const filePath = path.join(DATA_DIR, file);
        if (!fs.existsSync(filePath)) return [];
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data) as T[];
    } catch (error) {
        console.error(`Error reading ${file}:`, error);
        return [];
    }
};

export const writeData = <T>(file: string, data: T[]): void => {
    try {
        const filePath = path.join(DATA_DIR, file);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error writing ${file}:`, error);
    }
};

export const FILE_NAMES = {
    USERS: 'users.json',
    PAPERS: 'papers.json',
    GUIDES: 'guides.json',
    LEADERBOARD: 'leaderboard.json',
    PERFORMANCE: 'performance.json'
};
