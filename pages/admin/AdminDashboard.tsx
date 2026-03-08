import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/Card.tsx';
import apiService from '../../services/apiService.ts';
import MarkdownRenderer from '../../components/MarkdownRenderer.tsx';

const QuestionExport: React.FC<{ topicsData: any }> = ({ topicsData }) => {
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedTopic, setSelectedTopic] = useState("");
    const [isExporting, setIsExporting] = useState(false);
    const [previewData, setPreviewData] = useState<any[] | null>(null);

    const subjects = topicsData ? Object.keys(topicsData).map(key => ({
        key,
        label: topicsData[key].label
    })) : [];

    const topics = selectedSubject && topicsData ? topicsData[selectedSubject].topics : [];

    const handleFetchPreview = async () => {
        if (!selectedTopic) return;
        setIsExporting(true);
        const topicLabel = topics.find((t: any) => t.slug === selectedTopic)?.label || "";
        console.log(`[AdminExport] Starting fetch for topic: ${selectedTopic} (${topicLabel})`);
        try {
            const data = await apiService<any[]>(`/admin/export-questions/${selectedTopic}?label=${encodeURIComponent(topicLabel)}`);
            console.log(`[AdminExport] Received ${data.length} questions`);
            setPreviewData(data);
        } catch (error: any) {
            console.error(`[AdminExport] Fetch failed:`, error);
            alert(`Fetch failed: ${error.message || 'Unknown error'}. Check console for details.`);
        } finally {
            setIsExporting(false);
        }
    };

    const handleDownload = () => {
        if (!previewData) return;
        const blob = new Blob([JSON.stringify(previewData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedTopic}_questions_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-grain">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Question Export & Preview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject</label>
                    <select
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary transition-all"
                        value={selectedSubject}
                        onChange={(e) => { setSelectedSubject(e.target.value); setSelectedTopic(""); setPreviewData(null); }}
                    >
                        <option value="">Select Subject</option>
                        {subjects.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Topic</label>
                    <select
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary transition-all disabled:opacity-50"
                        value={selectedTopic}
                        disabled={!selectedSubject}
                        onChange={(e) => { setSelectedTopic(e.target.value); setPreviewData(null); }}
                    >
                        <option value="">Select Topic</option>
                        {topics.map((t: any) => <option key={t.slug} value={t.slug}>{t.label}</option>)}
                    </select>
                </div>
                <div className="flex items-end">
                    <button
                        onClick={handleFetchPreview}
                        disabled={!selectedTopic || isExporting}
                        className="w-full bg-slate-800 hover:bg-black text-white font-bold py-2.5 px-4 rounded-lg transition-all disabled:bg-slate-400 flex items-center justify-center gap-2"
                    >
                        {isExporting ? "Fetching..." : "Preview Questions"}
                    </button>
                </div>
            </div>

            {previewData && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                            Found <span className="text-primary">{previewData.length}</span> questions for "{selectedTopic}"
                        </span>
                        <button
                            onClick={handleDownload}
                            className="bg-primary hover:bg-accent text-white font-bold py-1.5 px-6 rounded-md text-sm transition-all"
                        >
                            Download JSON
                        </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 divide-y divide-slate-50 dark:divide-slate-800">
                        {previewData.slice(0, 50).map((q, i) => (
                            <div key={q.id || i} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">
                                        {q.subject} • {q.year}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-mono">{q.id}</span>
                                </div>
                                <div className="text-sm p-4 bg-slate-50 dark:bg-slate-800/30 rounded-lg border border-slate-100 dark:border-slate-800/50">
                                    <MarkdownRenderer content={q.question} />
                                </div>
                            </div>
                        ))}
                        {previewData.length > 50 && (
                            <div className="p-4 text-center text-xs text-slate-400 italic">
                                ... and {previewData.length - 50} more questions
                            </div>
                        )}
                        {previewData.length === 0 && (
                            <div className="p-8 text-center text-slate-400 italic">
                                No questions found for this topic yet.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!previewData && (
                <p className="text-xs text-slate-500">
                    Select a topic and click "Preview" to see the questions before downloading the full dataset.
                </p>
            )}
        </div>
    );
};



const PaperExport: React.FC<{ topicsData: any }> = ({ topicsData }) => {
    const [selectedSubject, setSelectedSubject] = useState("");
    const [examType, setExamType] = useState("UTME");
    const [startYear, setStartYear] = useState("");
    const [endYear, setEndYear] = useState("");
    const [isExporting, setIsExporting] = useState(false);

    const subjects = topicsData ? Object.keys(topicsData).map(key => ({
        key,
        label: topicsData[key].label
    })) : [];

    const handleDownload = async () => {
        setIsExporting(true);
        try {
            const queryParams = new URLSearchParams();
            if (selectedSubject) queryParams.append('subject', selectedSubject);
            if (examType) queryParams.append('type', examType);
            if (startYear) queryParams.append('startYear', startYear);
            if (endYear) queryParams.append('endYear', endYear);

            const data = await apiService<any[]>(`/admin/export-papers?${queryParams.toString()}`);

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const fileName = `${selectedSubject || 'all'}_${examType}_${startYear || 'start'}_to_${endYear || 'end'}.json`.toLowerCase().replace(/\s+/g, '_');
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error: any) {
            console.error(`[AdminExport] Paper export failed:`, error);
            alert(`Export failed: ${error.message || 'Unknown error'}`);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-xl border border-dashed border-blue-200 dark:border-blue-800/50 mt-8">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Paper Batch Export (Full JSON)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject</label>
                    <select
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm"
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                    >
                        <option value="">All Subjects</option>
                        {subjects.map(s => <option key={s.key} value={s.label}>{s.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Exam Type</label>
                    <select
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm"
                        value={examType}
                        onChange={(e) => setExamType(e.target.value)}
                    >
                        <option value="UTME">UTME</option>
                        <option value="WASSCE">WASSCE</option>
                        <option value="NECO">NECO</option>
                        <option value="POST-UTME">POST-UTME</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Year</label>
                    <input
                        type="number"
                        placeholder="e.g. 2000"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm"
                        value={startYear}
                        onChange={(e) => setStartYear(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Year</label>
                    <input
                        type="number"
                        placeholder="e.g. 2025"
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-sm"
                        value={endYear}
                        onChange={(e) => setEndYear(e.target.value)}
                    />
                </div>
            </div>
            <button
                onClick={handleDownload}
                disabled={isExporting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isExporting ? "Processing Export..." : "Download Papers JSON"}
            </button>
            <p className="text-[10px] text-slate-500 mt-3 italic">
                This will export the complete paper structure including all questions, options, answers, and tags for the selected criteria.
            </p>
        </div>
    );
};

interface AdminStats {
    users: number;
    papers: number;
    questions: number;
    guides: number;
}

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <Card className={`relative overflow-hidden`}>
        <div className={`absolute -top-3 -right-3 w-16 h-16 ${color} rounded-full opacity-20 dark:opacity-30`}></div>
        <div className="relative flex items-center gap-4">
            <div className={`p-3 rounded-lg ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-4xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
                <p className="text-slate-500 dark:text-slate-400 font-semibold">{title}</p>
            </div>
        </div>
    </Card>
);

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<AdminStats>({
        users: 0,
        papers: 0,
        questions: 0,
        guides: 0,
    });
    const [topicsData, setTopicsData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, topicsResult] = await Promise.all([
                    apiService<AdminStats>('/admin/stats'),
                    apiService<any>('/admin/topics')
                ]);
                setStats(statsData);
                setTopicsData(topicsResult);
                setError('');
            } catch (error) {
                console.error("Failed to fetch admin data:", error);
                setError('Failed to load dashboard statistics.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Admin Dashboard</h1>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
                    <strong className="font-bold">Error:</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={isLoading ? '...' : stats.users}
                    color="bg-blue-200 dark:bg-blue-500/20"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-800 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.995 5.995 0 0112 13a5.995 5.995 0 01-3 5.197z" /></svg>}
                />
                <StatCard
                    title="Past Papers"
                    value={isLoading ? '...' : stats.papers}
                    color="bg-green-200 dark:bg-green-500/20"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-800 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                />
                <StatCard
                    title="Total Questions"
                    value={isLoading ? '...' : stats.questions}
                    color="bg-yellow-200 dark:bg-yellow-500/20"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-800 dark:text-yellow-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatCard
                    title="Study Guides"
                    value={isLoading ? '...' : stats.guides}
                    color="bg-purple-200 dark:bg-purple-500/20"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-800 dark:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
                />
            </div>

            <Card>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Quick Actions</h2>
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <Link to="/admin/users" className="flex-1 bg-slate-100 dark:bg-slate-700 p-4 rounded-lg font-semibold text-slate-700 dark:text-slate-200 text-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Manage Users</Link>
                    <Link to="/admin/papers" className="flex-1 bg-slate-100 dark:bg-slate-700 p-4 rounded-lg font-semibold text-slate-700 dark:text-slate-200 text-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Manage Papers</Link>
                    <Link to="/admin/guides" className="flex-1 bg-slate-100 dark:bg-slate-700 p-4 rounded-lg font-semibold text-slate-700 dark:text-slate-200 text-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Manage Guides</Link>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-700 pt-8 space-y-8">
                    <QuestionExport topicsData={topicsData} />
                    <PaperExport topicsData={topicsData} />
                </div>
            </Card>


        </div>
    );
};

export default AdminDashboard;