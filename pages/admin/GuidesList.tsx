import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card.tsx';
import apiService from '../../services/apiService.ts';
import { StudyGuide } from '../../types.ts';
import { allStudyGuides } from '../../data/studyGuides.ts';

// --- Guide Modal ---
interface GuideModalProps {
    guide: StudyGuide | null;
    onSave: (guide: StudyGuide) => void;
    onClose: () => void;
}
const GuideModal: React.FC<GuideModalProps> = ({ guide, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<StudyGuide>>({ subject: '', topics: [], ...guide });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const guideToSave = { createdAt: new Date().toISOString().split('T')[0], ...formData } as StudyGuide;
        onSave(guideToSave);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <Card className="w-full max-w-lg shadow-2xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{guide ? 'Edit Guide Meta' : 'Add New Guide'}</h2>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Guide ID (slug)</label>
                        <input type="text" name="id" value={formData.id ?? ''} onChange={handleChange} className="w-full mt-1 p-2 border dark:border-slate-600 rounded-md bg-slate-100 dark:bg-slate-700" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Subject</label>
                        <input type="text" name="subject" value={formData.subject ?? ''} onChange={handleChange} className="w-full mt-1 p-2 border dark:border-slate-600 rounded-md bg-slate-100 dark:bg-slate-700" required />
                    </div>
                    <div className="flex justify-end gap-4 pt-4 mt-4 border-t dark:border-slate-700">
                        <button type="button" onClick={onClose} className="font-semibold px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
                        <button type="submit" className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-accent transition-colors">Save Guide</button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

// --- GuidesList component ---
const GuidesList: React.FC = () => {
    const navigate = useNavigate();
    const [guides, setGuides] = useState<StudyGuide[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
    const [editingGuide, setEditingGuide] = useState<StudyGuide | null>(null);

    useEffect(() => {
        const fetchGuides = async () => {
            setIsLoading(true);
            try {
                const data = await apiService<StudyGuide[]>('/data/guides');
                setGuides(data.length > 0 ? data : allStudyGuides);
            } catch (error) {
                console.error("Failed to fetch guides", error);
                setGuides(allStudyGuides);
            } finally {
                setIsLoading(false);
            }
        };
        fetchGuides();
    }, []);

    const openGuideModal = (guide: StudyGuide | null) => {
        setEditingGuide(guide);
        setIsGuideModalOpen(true);
    };

    const closeGuideModal = () => {
        setEditingGuide(null);
        setIsGuideModalOpen(false);
    };

    const handleSaveGuide = async (guideToSave: StudyGuide) => {
        try {
            let savedGuide: StudyGuide;
            if (guideToSave.id && editingGuide) {
                savedGuide = await apiService<StudyGuide>(`/admin/guides/${guideToSave.id}`, {
                    method: 'PUT',
                    body: guideToSave
                });
                setGuides(guides.map(g => g.id === guideToSave.id ? savedGuide : g));
            } else {
                savedGuide = await apiService<StudyGuide>('/admin/guides', {
                    method: 'POST',
                    body: guideToSave
                });
                setGuides([savedGuide, ...guides]);
            }
            closeGuideModal();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to save guide');
        }
    };

    const handleDeleteGuide = async (guideId: string) => {
        if (window.confirm('Are you sure you want to delete this guide?')) {
            try {
                await apiService(`/admin/guides/${guideId}`, { method: 'DELETE' });
                setGuides(prev => prev.filter(g => g.id !== guideId));
            } catch (err) {
                alert(err instanceof Error ? err.message : 'Failed to delete guide');
            }
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Study Guides</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage all available study guides and topics.</p>
                </div>
                <button
                    onClick={() => openGuideModal(null)}
                    className="flex items-center gap-2 bg-primary text-white font-bold py-2 px-5 rounded-lg hover:bg-accent transition-colors shadow-md w-full md:w-auto justify-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    Create New Guide
                </button>
            </div>

            <Card className="shadow-sm border-t-4 border-t-primary">
                <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-lg">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Subject</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">ID (Slug)</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Chapters/Topics</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Created At</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500 font-medium">Loading guides...</td></tr>
                            ) : guides.length > 0 ? (
                                guides.map(guide => (
                                    <tr key={guide.id} className="border-b dark:border-slate-700 last:border-b-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="p-4 font-bold text-slate-800 dark:text-slate-100">
                                            {guide.subject}
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300 font-mono text-xs">
                                            {guide.id}
                                        </td>
                                        <td className="p-4 text-slate-600 dark:text-slate-300">
                                            <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-1 rounded-md font-semibold text-xs text-center inline-block min-w-[2rem]">
                                                {guide.topics?.length || 0}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-500 dark:text-slate-400 text-xs">
                                            {guide.lastUpdated || guide.createdAt || '—'}
                                        </td>
                                        <td className="p-4 flex gap-3 justify-end items-center">
                                            <button
                                                onClick={() => navigate(`/admin/guides/${guide.id}`)}
                                                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/50"
                                            >
                                                Builder
                                            </button>
                                            <button
                                                onClick={() => openGuideModal(guide)}
                                                className="font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors px-2"
                                            >
                                                Edit Meta
                                            </button>
                                            <button
                                                onClick={() => handleDeleteGuide(guide.id)}
                                                className="font-semibold text-red-600 dark:text-red-400 hover:text-red-800 transition-colors px-2"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">No study guides found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {isGuideModalOpen && (
                <GuideModal guide={editingGuide} onSave={handleSaveGuide} onClose={closeGuideModal} />
            )}
        </div>
    );
};

export default GuidesList;
