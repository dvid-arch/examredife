import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../../components/Card.tsx';
import apiService from '../../services/apiService.ts';
import { StudyGuide, Topic } from '../../types.ts';
import { allStudyGuides } from '../../data/studyGuides.ts';

const GuideBuilder: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [guide, setGuide] = useState<StudyGuide | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

    // Fetch the guide
    useEffect(() => {
        const fetchGuide = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                // Try from API first, then fallback to local static data
                let fetchedGuide = null;
                try {
                    const allGuides = await apiService<StudyGuide[]>('/data/guides');
                    fetchedGuide = allGuides.find(g => g.id.toLowerCase() === id.toLowerCase());
                } catch (e) {
                    fetchedGuide = allStudyGuides.find(g => g.id.toLowerCase() === id.toLowerCase());
                }

                if (fetchedGuide) {
                    setGuide(JSON.parse(JSON.stringify(fetchedGuide))); // Deep clone for safe editing
                    if (fetchedGuide.topics && fetchedGuide.topics.length > 0) {
                        setSelectedTopicId(fetchedGuide.topics[0].id);
                    }
                }
            } catch (err) {
                console.error("Failed to load guide", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchGuide();
    }, [id]);

    const activeTopic = guide?.topics?.find(t => t.id === selectedTopicId) || null;

    const handleSave = async () => {
        if (!guide) return;
        setIsSaving(true);
        try {
            await apiService(`/admin/guides/${guide.id}`, {
                method: 'PUT',
                body: { ...guide, lastUpdated: new Date().toISOString().split('T')[0] }
            });
            alert('Guide saved successfully!');
        } catch (err) {
            console.error(err);
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            alert(`Failed to save guide: ${errorMsg}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleTopicContentChange = (content: string) => {
        if (!guide || !selectedTopicId) return;
        setGuide(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                topics: prev.topics.map(t => t.id === selectedTopicId ? { ...t, content } : t)
            };
        });
    };

    const handleTopicTitleChange = (title: string) => {
        if (!guide || !selectedTopicId) return;
        setGuide(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                topics: prev.topics.map(t => t.id === selectedTopicId ? { ...t, title } : t)
            };
        });
    };

    const addNewTopic = () => {
        if (!guide) return;
        const newTopicId = `new-topic-${Date.now()}`;
        const newTopic: Topic = {
            id: newTopicId,
            title: 'New Topic',
            content: '# New Topic Content\n\nWrite your content here...',
            order: (guide.topics?.length || 0) + 1
        };

        setGuide(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                topics: [...(prev.topics || []), newTopic]
            };
        });
        setSelectedTopicId(newTopicId);
    };

    const deleteTopic = (topicId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!guide || !window.confirm('Delete this topic permanently?')) return;

        setGuide(prev => {
            if (!prev) return prev;
            const newTopics = prev.topics.filter(t => t.id !== topicId);
            return { ...prev, topics: newTopics };
        });

        if (selectedTopicId === topicId) {
            setSelectedTopicId(null);
        }
    };

    const moveTopic = (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
        e.stopPropagation();
        if (!guide || !guide.topics) return;

        const newTopics = [...guide.topics];
        if (direction === 'up' && index > 0) {
            [newTopics[index], newTopics[index - 1]] = [newTopics[index - 1], newTopics[index]];
        } else if (direction === 'down' && index < newTopics.length - 1) {
            [newTopics[index], newTopics[index + 1]] = [newTopics[index + 1], newTopics[index]];
        } else {
            return;
        }

        setGuide({ ...guide, topics: newTopics });
    };

    if (isLoading) {
        return <div className="p-8 text-center text-slate-500">Loading Guide Builder...</div>;
    }

    if (!guide) {
        return (
            <div className="p-8 text-center">
                <p className="text-red-500 mb-4">Guide not found.</p>
                <button onClick={() => navigate('/admin/guides')} className="btn-primary">Back to Guides</button>
            </div>
        );
    }

    return (
        <div className="space-y-4 md:h-[calc(100vh-100px)] flex flex-col md:overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
                <div className="flex flex-col gap-1 w-full sm:w-auto">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/admin/guides')} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                            Back
                        </button>
                        {activeTopic && (
                            <button
                                onClick={() => setSelectedTopicId(null)}
                                className="md:hidden flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                                Topic List
                            </button>
                        )}
                    </div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        Guide Builder
                        <span className="text-xs font-normal px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                            {guide.subject}
                        </span>
                    </h1>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 sm:flex-none bg-primary text-white font-bold py-2 px-6 rounded-lg shadow-md hover:bg-accent disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0">
                {/* Sidebar: Topics structure */}
                <Card className={`w-full md:w-72 flex flex-col shrink-0 p-0 overflow-hidden border-t-4 border-t-indigo-500 ${activeTopic ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b dark:border-slate-700 font-bold bg-slate-50 dark:bg-slate-800 flex justify-between items-center text-slate-800 dark:text-slate-100">
                        Topics ({guide.topics?.length || 0})
                        <button
                            onClick={addNewTopic}
                            className="text-primary hover:bg-primary/10 p-1.5 rounded-md transition-colors"
                            title="Add New Topic"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-50/50 dark:bg-slate-800/20 max-h-[40vh] md:max-h-none">
                        {guide.topics?.map((topic, index) => (
                            <div
                                key={topic.id}
                                onClick={() => setSelectedTopicId(topic.id)}
                                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${selectedTopicId === topic.id
                                    ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-800/50 shadow-sm'
                                    : 'bg-white border-transparent hover:border-slate-200 dark:bg-transparent dark:hover:bg-slate-800'
                                    }`}
                            >
                                <div className="flex-1 min-w-0 pr-2">
                                    <p className={`text-sm font-semibold truncate ${selectedTopicId === topic.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {topic.title || 'Untitled Topic'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                    <div className="flex flex-col">
                                        <button onClick={(e) => moveTopic(index, 'up', e)} disabled={index === 0} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
                                        </button>
                                        <button onClick={(e) => moveTopic(index, 'down', e)} disabled={index === (guide.topics?.length || 0) - 1} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                        </button>
                                    </div>
                                    <button onClick={(e) => deleteTopic(topic.id, e)} className="text-red-400 hover:text-red-600 p-1 ml-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                        {(!guide.topics || guide.topics.length === 0) && (
                            <div className="p-4 text-center text-slate-500 text-sm italic">
                                No topics yet. Add one to start building.
                            </div>
                        )}
                    </div>
                </Card>

                {/* Main Content Area: Editor */}
                <Card className={`flex-1 flex flex-col min-w-0 p-0 overflow-hidden shadow-lg border-t-4 border-t-primary ${activeTopic ? 'flex' : 'hidden md:flex'}`}>
                    {activeTopic ? (
                        <>
                            <div className="p-4 border-b dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Topic Title</label>
                                <input
                                    type="text"
                                    value={activeTopic.title}
                                    onChange={(e) => handleTopicTitleChange(e.target.value)}
                                    className="w-full text-lg md:text-xl font-bold p-2 bg-transparent border-b-2 border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-primary dark:focus:border-primary transition-colors outline-none text-slate-800 dark:text-slate-100"
                                    placeholder="Enter topic title..."
                                />
                            </div>
                            <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-900">
                                {/* Raw Markdown Editor */}
                                <div className="flex-1 flex flex-col border-r dark:border-slate-700 min-h-[300px]">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 uppercase flex justify-between items-center">
                                        <span>Markdown Content</span>
                                        <span className="text-[10px] font-normal italic">Markdown supported</span>
                                    </div>
                                    <textarea
                                        value={activeTopic.content || ''}
                                        onChange={(e) => handleTopicContentChange(e.target.value)}
                                        className="flex-1 w-full p-4 resize-none bg-transparent text-sm font-mono text-slate-700 dark:text-slate-300 outline-none leading-relaxed"
                                        placeholder="# Start writing your Markdown content here..."
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-500 bg-slate-50 dark:bg-slate-800/50 py-20">
                            <div className="text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Select a topic from the sidebar to edit its content.
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default GuideBuilder;
