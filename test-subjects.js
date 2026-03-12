
const SUBJECTS = {
    biology: { name: 'Biology', aliases: ['Biology'] },
    english: { name: 'English', aliases: ['English Language', 'Use of English', 'English'] },
    accounting: { name: 'Financial Accounting', aliases: ['Financial Accounting', 'Accounting', 'Accounts - Principles of Accounts', 'Principles of Accounts'] },
    crs: { name: 'CRS', aliases: ['Christian Religious Studies', 'CRS', 'Christian Religious Knowledge (CRK)', 'CRK'] },
    literature: { name: 'Literature', aliases: ['Literature-in-English', 'Literature', 'Literature in English'] },
    agric: { name: 'Agricultural Science', aliases: ['Agricultural Science', 'Agric', 'Agriculture'] },
    phe: { name: 'Physical and Health Education', aliases: ['Physical and Health Education', 'Physical and Health Education (PHE)', 'PHE', 'Physical Education'] }
};

const getSubjectKey = (name) => {
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

const tests = [
    { input: 'Financial Accounting', expected: 'accounting' },
    { input: 'Accounts - Principles of Accounts', expected: 'accounting' },
    { input: 'Principles of Accounts', expected: 'accounting' },
    { input: 'Practice papers for Agriculture', expected: null }, // Just checking partial match isn't happening
    { input: 'Agriculture', expected: 'agric' },
    { input: 'Agric', expected: 'agric' },
    { input: 'Physical Education', expected: 'phe' },
    { input: 'PHE', expected: 'phe' },
    { input: 'English Language', expected: 'english' },
    { input: 'Literature in English', expected: 'literature' },
    { input: 'Christian Religious Knowledge (CRK)', expected: 'crs' }
];

tests.forEach(test => {
    const result = getSubjectKey(test.input);
    if (result === test.expected) {
        console.log(`PASS: "${test.input}" -> ${result}`);
    } else {
        console.log(`FAIL: "${test.input}" -> Expected ${test.expected}, got ${result}`);
    }
});
