import React from 'react';
import Card from './Card.tsx';

export const MetricSkeleton = () => (
    <Card className="text-center flex flex-col justify-center py-6 animate-pulse">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 mx-auto mb-2"></div>
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-16 mx-auto"></div>
    </Card>
);

export const ChartSkeleton = () => (
    <Card className="animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-6"></div>
        <div className="h-[300px] bg-slate-100 dark:bg-slate-800 rounded-lg w-full"></div>
    </Card>
);

export const DashboardSkeleton = () => (
    <div className="space-y-8">
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>

        <section>
            <div className="flex justify-between items-end mb-4">
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-40"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 animate-pulse">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-3/4"></div>
                                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-1/2"></div>
                            </div>
                        </div>
                        <div className="h-10 bg-slate-50 dark:bg-slate-900 rounded-lg w-full"></div>
                    </div>
                ))}
            </div>
        </section>

        <section>
            <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-4"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
                ))}
            </div>
        </section>
    </div>
);

export const PerformanceSkeleton = () => (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 animate-pulse">
            <div className="space-y-2">
                <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded w-64"></div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48"></div>
            </div>
            <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-2xl w-64"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <MetricSkeleton key={i} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartSkeleton />
            <div className="space-y-4">
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48 animate-pulse"></div>
                <div className="grid grid-cols-6 gap-2">
                    {[...Array(30)].map((_, i) => (
                        <div key={i} className="h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);
