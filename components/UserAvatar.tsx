import React from 'react';

interface UserAvatarProps {
    name?: string;
    photoURL?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ name = 'User', photoURL, size = 'md', className = '' }) => {
    const getSizeClass = () => {
        switch (size) {
            case 'sm': return 'w-8 h-8 text-xs';
            case 'lg': return 'w-12 h-12 text-lg';
            case 'xl': return 'w-32 h-32 text-4xl';
            default: return 'w-10 h-10 text-base';
        }
    };

    const getInitials = (userName: string) => {
        const parts = userName.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
        }
        return userName.charAt(0).toUpperCase();
    };

    // Generate a consistent color based on the name
    const getBgColor = (userName: string) => {
        const colors = [
            'bg-blue-500',
            'bg-emerald-500',
            'bg-violet-500',
            'bg-amber-500',
            'bg-rose-500',
            'bg-cyan-500',
            'bg-indigo-500'
        ];

        let hash = 0;
        for (let i = 0; i < userName.length; i++) {
            hash = userName.charCodeAt(i) + ((hash << 5) - hash);
        }

        const index = Math.abs(hash) % colors.length;
        return colors[index];
    };

    if (photoURL) {
        return (
            <img
                src={photoURL}
                alt={name}
                className={`${getSizeClass()} rounded-full object-cover shadow-sm ${className}`}
                onError={(e) => {
                    // Fallback to initials if image fails to load
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                }}
            />
        );
    }

    return (
        <div className={`${getSizeClass()} ${getBgColor(name)} rounded-full flex items-center justify-center text-white font-bold shadow-md select-none ${className}`}>
            {getInitials(name)}
        </div>
    );
};

export default UserAvatar;
