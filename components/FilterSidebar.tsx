import React from 'react';

interface FilterSidebarProps {
    subjects: string[];
    years: (string | number)[];
    selectedSubject: string;
    selectedYear: string;
    onSubjectChange: (subject: string) => void;
    onYearChange: (year: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({
    subjects,
    years,
    selectedSubject,
    selectedYear,
    onSubjectChange,
    onYearChange,
    isOpen,
    onClose
}) => {
    return (
        <div className={`fixed inset-0 z-40 lg:relative lg:z-0 lg:block lg:w-64 ${isOpen ? 'block' : 'hidden'}`}>
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm lg:hidden"
                onClick={onClose}
            ></div>

            <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 shadow-xl lg:shadow-none lg:w-64 flex flex-col h-full border-r border-slate-100 dark:border-slate-800 transition-transform duration-300 transform lg:translate-x-0">
                <div className="p-6 flex-1 overflow-y-auto">
                    <div className="flex items-center justify-between mb-8 lg:hidden">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Filters</h2>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Subject</h3>
                            <div className="space-y-2">
                                {subjects.map(subject => (
                                    <button
                                        key={subject}
                                        onClick={() => {
                                            onSubjectChange(subject);
                                            if (window.innerWidth < 1024) onClose();
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all ${selectedSubject === subject
                                            ? 'bg-primary text-white font-bold shadow-md shadow-primary/20'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                            }`}
                                    >
                                        {subject === 'all' ? 'All Subjects' : subject}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Year</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {years.map(year => (
                                    <button
                                        key={year}
                                        onClick={() => {
                                            onYearChange(year.toString());
                                            if (window.innerWidth < 1024) onClose();
                                        }}
                                        className={`px-3 py-2 rounded-xl text-xs transition-all border ${selectedYear === year.toString()
                                            ? 'bg-primary border-primary text-white font-bold'
                                            : 'border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-primary/50'
                                            }`}
                                    >
                                        {year === 'all' ? 'All' : year}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 lg:hidden text-center">
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl"
                    >
                        Apply Filters
                    </button>
                </div>
            </aside>
        </div>
    );
};

export default FilterSidebar;
