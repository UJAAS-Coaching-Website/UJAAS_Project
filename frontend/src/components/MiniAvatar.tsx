import React from 'react';
import { AuthUser } from '../api/auth';

interface MiniAvatarProps {
  user: AuthUser;
  className?: string;
}

export function MiniAvatar({ user, className = "" }: MiniAvatarProps) {
  const baseClasses = "rounded-full flex items-center justify-center text-white font-semibold shadow-lg overflow-hidden bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-500";
  
  return (
    <div className={`${baseClasses} ${className}`}>
      {user.avatarUrl ? (
        <img 
          src={user.avatarUrl} 
          alt={user.name} 
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement!.innerHTML = `<span>${user.name.charAt(0).toUpperCase()}</span>`;
          }}
        />
      ) : (
        <span>{user.name.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
}
