import fs from 'fs';
import path from 'path';

const papersPath = path.join('c:/Users/derri/Desktop/codes/myproj/be/examredi-backend/src/db/papers.json');

try {
    const data = fs.readFileSync(papersPath, 'utf8');
    const papers = JSON.parse(data);
    const idMap = new Map();
    const duplicates = [];

    papers.forEach(paper => {
        paper.questions.forEach(q => {
            if (idMap.has(q.id)) {
                duplicates.push({ id: q.id, paper1: idMap.get(q.id), paper2: paper.id });
            } else {
                idMap.set(q.id, paper.id);
            }
        });
    });

    if (duplicates.length > 0) {
        console.log(`Found ${duplicates.length} duplicate IDs!`);
        console.log('Sample duplicates:', duplicates.slice(0, 5));
    } else {
        console.log('No duplicate question IDs found.');
    }
} catch (error) {
    console.error('Error reading or parsing papers.json:', error);
}
