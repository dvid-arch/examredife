export interface SubjectMetadata {
    name: string;
    color: string;
    icon?: string;
    aliases?: string[]; // Different names used in data (e.g. "English Language" vs "English")
}

export const SUBJECTS: Record<string, SubjectMetadata> = {
    biology: {
        name: 'Biology',
        color: '#22c55e', // Green
        aliases: ['Biology']
    },
    chemistry: {
        name: 'Chemistry',
        color: '#3b82f6', // Blue
        aliases: ['Chemistry']
    },
    physics: {
        name: 'Physics',
        color: '#f59e0b', // Amber
        aliases: ['Physics']
    },
    mathematics: {
        name: 'Mathematics',
        color: '#ef4444', // Red
        aliases: ['Mathematics', 'Maths']
    },
    english: {
        name: 'English',
        color: '#8b5cf6', // Violet
        aliases: ['English Language', 'Use of English', 'English']
    },
    economics: {
        name: 'Economics',
        color: '#06b6d4', // Cyan
        aliases: ['Economics']
    },
    government: {
        name: 'Government',
        color: '#ec4899', // Pink
        aliases: ['Government']
    },
    literature: {
        name: 'Literature',
        color: '#f97316', // Orange
        aliases: ['Literature-in-English', 'Literature']
    },
    crs: {
        name: 'CRS',
        color: '#6366f1', // Indigo
        aliases: ['Christian Religious Studies', 'CRS']
    },
    geography: {
        name: 'Geography',
        color: '#10b981', // Emerald
        aliases: ['Geography']
    },
    commerce: {
        name: 'Commerce',
        color: '#14b8a6', // Teal
        aliases: ['Commerce']
    },
    accounting: {
        name: 'Financial Accounting',
        color: '#6b7280', // Gray
        aliases: ['Financial Accounting', 'Accounting']
    },
    agric: {
        name: 'Agricultural Science',
        color: '#4ade80', // Light Green
        aliases: ['Agricultural Science', 'Agric']
    }
};

/**
 * Helper to get normalized subject key from any string name
 */
export const getSubjectKey = (name: string): string | null => {
    if (!name) return null;
    const lowerName = name.toLowerCase().trim();
    for (const [key, meta] of Object.entries(SUBJECTS)) {
        if (key === lowerName || meta.name.toLowerCase() === lowerName || meta.aliases?.some(a => a.toLowerCase() === lowerName)) {
            return key;
        }
    }
    return null;
};

/**
 * Helper to check if a string is a recognized subject
 */
export const isSubject = (name: string): boolean => !!getSubjectKey(name);

/**
 * Standard Subjects List (ordered)
 */
export const STANDARD_SUBJECTS = Object.values(SUBJECTS).map(s => s.name);
