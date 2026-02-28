import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/Card.tsx';
import apiService from '../../services/apiService.ts';
import { PastPaper } from '../../types.ts';

const PapersList: React.FC = () => {
    const [papers, setPapers] = useState<PastPaper[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isPaperModalOpen, setIsPaperModalOpen] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    const navigate = useNavigate();

    useEffect(() => {
        const fetchPapers = async () => {
            setIsLoading(true);
            try {
                const data = await apiService<PastPaper[]>('/data/papers');
                setPapers(data || []);
            } catch (error) {
                console.error("Failed to fetch papers", error);
                setPapers([]);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPapers();
    }, []);

    const handleDeletePaper = async (paperId: string) => {
        if (window.confirm('Are you sure you want to delete this paper?')) {
            try {
                await apiService(`/admin/papers/${paperId}`, { method: 'DELETE' });
                setPapers(prev => prev.filter(p => p.id !== paperId || (p as any)._id !== paperId));
            } catch (err) {
                alert(err instanceof Error ? err.message : 'Failed to delete paper');
            }
        }
    };

    // Filter logic
    const filteredPapers = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        return papers.filter(p =>
            (p.subject || '').toLowerCase().includes(lowerSearch) ||
            (p.exam || '').toLowerCase().includes(lowerSearch) ||
            (p.year || '').toString().includes(searchTerm)
        );
    }, [papers, searchTerm]);

    // Pagination logic
    const totalPages = Math.ceil(filteredPapers.length / itemsPerPage);
    const paginatedPapers = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredPapers.slice(start, start + itemsPerPage);
    }, [filteredPapers, currentPage]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Past Papers</h1>
                <button onClick={() => setIsPaperModalOpen(true)} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-accent w-full md:w-auto">
                    Add New Paper
                </button>
            </div>

            <Card>
                <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <input
                        type="text"
                        placeholder="Search by subject, year or exam..."
                        className="w-full sm:w-80 p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1); // reset to page 1 on search
                        }}
                    />
                    <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                        Total Papers: {filteredPapers.length}
                    </div>
                </div>

                <div className="overflow-x-auto border border-gray-200 dark:border-slate-700 rounded-lg">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-800">
                            <tr>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Subject</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Exam</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Year</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Questions</th>
                                <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading papers...</td></tr>
                            ) : paginatedPapers.length > 0 ? (
                                paginatedPapers.map(paper => {
                                    const paperId = paper.id || (paper as any)._id;
                                    return (
                                        <tr key={paperId} className="border-b dark:border-slate-700 last:border-b-0">
                                            <td className="p-4 font-medium text-slate-800 dark:text-slate-100">{paper.subject}</td>
                                            <td className="p-4 text-slate-600 dark:text-slate-300">{paper.exam}</td>
                                            <td className="p-4 text-slate-600 dark:text-slate-300">{paper.year}</td>
                                            <td className="p-4 text-slate-600 dark:text-slate-300">{paper.questions?.length || 0}</td>
                                            <td className="p-4 flex gap-4 justify-end">
                                                <button onClick={() => navigate(`/admin/papers/${paperId}`)} className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline hover:text-indigo-800 transition-colors">Manage Questions</button>
                                                <button onClick={() => handleDeletePaper(paperId)} className="font-semibold text-red-600 dark:text-red-400 hover:underline hover:text-red-800 transition-colors">Delete</button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-500">No papers found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="mt-4 flex justify-between items-center px-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                            className="px-3 py-1 font-semibold border rounded-md border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Page {currentPage} of {totalPages}</span>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
                            className="px-3 py-1 font-semibold border rounded-md border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </Card>

            {/* TODO: Add PaperModal creation here next logic if needed, or redirect to a creation page */}
        </div>
    );
};

export default PapersList;
