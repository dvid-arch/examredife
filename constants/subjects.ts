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
        aliases: ['Literature-in-English', 'Literature', 'Literature in English']
    },
    crs: {
        name: 'CRS',
        color: '#6366f1', // Indigo
        aliases: ['Christian Religious Studies', 'CRS', 'Christian Religious Knowledge (CRK)', 'CRK']
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
        aliases: ['Financial Accounting', 'Accounting', 'Accounts - Principles of Accounts', 'Principles of Accounts']
    },
    agric: {
        name: 'Agricultural Science',
        color: '#4ade80', // Light Green
        aliases: ['Agricultural Science', 'Agric', 'Agriculture']
    },
    irk: {
        name: 'Islamic Religious Knowledge (IRK)',
        color: '#6366f1', // Indigo sharing CRS color
        aliases: ['Islamic Religious Knowledge (IRK)', 'Islamic Religious Studies', 'IRS', 'IRK']
    },
    fine_arts: {
        name: 'Fine Arts',
        color: '#f43f5e', // Rose
        aliases: ['Fine Arts', 'Fine Art']
    },
    phe: {
        name: 'Physical and Health Education',
        color: '#0ea5e9', // Sky Blue
        aliases: ['Physical and Health Education', 'Physical and Health Education (PHE)', 'PHE', 'Physical Education']
    },
    history: {
        name: 'History',
        color: '#b45309', // Amber-Amber
        aliases: ['History']
    },
    computer: {
        name: 'Computer Studies',
        color: '#64748b', // Slate
        aliases: ['Computer Studies', 'Computer']
    },
    french: {
        name: 'French',
        color: '#d946ef', // Fuchsia
        aliases: ['French']
    },
    home_ecu: {
        name: 'Home Economics',
        color: '#fbbf24', // Amber/Yellow
        aliases: ['Home Economics']
    },
    music: {
        name: 'Music',
        color: '#a855f7', // Purple
        aliases: ['Music']
    }
};

/**
 * Helper to get normalized subject key from any string name
 */
export const getSubjectKey = (name: string): string | null => {
    if (!name) return null;
    const lowerName = name.toLowerCase().trim()
        .replace(/[^a-z0-9\s]/g, '') // remove special chars but keep spaces
        .replace(/\s+/g, ' '); // normalize spaces

    for (const [key, meta] of Object.entries(SUBJECTS)) {
        if (key === lowerName) return key;

        const normalizedMetaName = meta.name.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
        if (normalizedMetaName === lowerName) return key;

        if (meta.aliases?.some(a => {
            const normalizedAlias = a.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ');
            return normalizedAlias === lowerName;
        })) {
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
