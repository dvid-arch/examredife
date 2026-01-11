import { Request, Response } from 'express';
import { readData, writeData, FILE_NAMES } from '../repositories/dataStore';

// Stats
export const getAdminStats = (req: Request, res: Response) => {
    const users = readData<any>(FILE_NAMES.USERS);
    const papers = readData<any>(FILE_NAMES.PAPERS);
    const guides = readData<any>(FILE_NAMES.GUIDES);

    // In a real app we'd count questions across all papers
    const totalQuestions = papers.reduce((acc: number, p: any) => acc + (p.questions?.length || 0), 0);

    const stats = {
        users: users.length,
        papers: papers.length,
        questions: totalQuestions,
        guides: guides.length
    };
    res.json(stats);
};

// Users
export const getAllUsers = (req: Request, res: Response) => {
    const users = readData<any>(FILE_NAMES.USERS).map((u: any) => {
        const { password, ...rest } = u;
        return rest;
    });
    res.json(users);
};

export const updateUserSubscription = (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    const users = readData<any>(FILE_NAMES.USERS);
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
        users[index].subscriptionStatus = status;
        writeData(FILE_NAMES.USERS, users);
        const { password, ...rest } = users[index];
        res.json(rest);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

export const deleteUser = (req: Request, res: Response) => {
    const { id } = req.params;
    let users = readData<any>(FILE_NAMES.USERS);
    users = users.filter(u => u.id !== id);
    writeData(FILE_NAMES.USERS, users);
    res.json({ message: 'User deleted' });
};

export const saveUser = (req: Request, res: Response) => {
    // This is for admin creating/updating users directly
    const { id } = req.params; // If params has ID, it's update, else create (or body has ID)
    const userData = req.body;
    let users = readData<any>(FILE_NAMES.USERS);

    if (id || userData.id) {
        const targetId = id || userData.id;
        const index = users.findIndex(u => u.id === targetId);
        if (index !== -1) {
            users[index] = { ...users[index], ...userData };
            writeData(FILE_NAMES.USERS, users);
            const { password, ...rest } = users[index];
            res.json(rest);
            return;
        }
    }

    // Create new (simplified)
    const newUser = {
        id: Date.now().toString(),
        role: 'user',
        subscriptionStatus: 'free',
        createdAt: new Date().toISOString(),
        ...userData
    };
    users.push(newUser);
    writeData(FILE_NAMES.USERS, users);
    const { password, ...rest } = newUser;
    res.json(rest);
};

// Papers
export const getAllPapers = (req: Request, res: Response) => {
    const papers = readData(FILE_NAMES.PAPERS);
    res.json(papers);
};

export const savePaper = (req: Request, res: Response) => {
    const paper = req.body;
    let papers = readData<any>(FILE_NAMES.PAPERS);
    if (paper.id) {
        const index = papers.findIndex(p => p.id === paper.id);
        if (index !== -1) {
            papers[index] = { ...papers[index], ...paper };
        } else {
            papers.push(paper);
        }
    } else {
        paper.id = Date.now().toString();
        papers.push(paper);
    }
    writeData(FILE_NAMES.PAPERS, papers);
    res.json(paper);
};

export const deletePaper = (req: Request, res: Response) => {
    const { id } = req.params;
    let papers = readData<any>(FILE_NAMES.PAPERS);
    papers = papers.filter(p => p.id !== id);
    writeData(FILE_NAMES.PAPERS, papers);
    res.json({ message: 'Paper deleted' });
};

export const savePaperQuestion = (req: Request, res: Response) => {
    const { id } = req.params; // paperId
    const question = req.body;
    let papers = readData<any>(FILE_NAMES.PAPERS);
    const index = papers.findIndex(p => p.id === id);

    if (index !== -1) {
        if (!papers[index].questions) papers[index].questions = [];

        const qIndex = papers[index].questions.findIndex((q: any) => q.id === question.id);
        if (qIndex !== -1) {
            papers[index].questions[qIndex] = { ...papers[index].questions[qIndex], ...question };
        } else {
            if (!question.id) question.id = `${id}-q-${Date.now()}`;
            papers[index].questions.push(question);
        }

        writeData(FILE_NAMES.PAPERS, papers);
        res.json(papers[index]);
    } else {
        res.status(404).json({ message: 'Paper not found' });
    }
};

// Guides
export const getAllGuides = (req: Request, res: Response) => {
    const guides = readData(FILE_NAMES.GUIDES);
    res.json(guides);
};
export const saveGuide = (req: Request, res: Response) => {
    const guide = req.body;
    let guides = readData<any>(FILE_NAMES.GUIDES);
    if (guide.id) {
        const index = guides.findIndex(g => g.id === guide.id);
        if (index !== -1) {
            guides[index] = { ...guides[index], ...guide };
        } else {
            guides.push(guide);
        }
    } else {
        guide.id = Date.now().toString();
        guides.push(guide);
    }
    writeData(FILE_NAMES.GUIDES, guides);
    res.json(guide);
};

export const deleteGuide = (req: Request, res: Response) => {
    const { id } = req.params;
    let guides = readData<any>(FILE_NAMES.GUIDES);
    guides = guides.filter(g => g.id !== id);
    writeData(FILE_NAMES.GUIDES, guides);
    res.json({ message: 'Guide deleted' });
};
