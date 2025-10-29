"use client";

import { useState } from 'react';
import { User } from 'lucide-react';
import { getEnhancedGooglePhotoURL, getUserInitials, getUserAvatarColor } from '@/lib/profileUtils';

interface UserAvatarProps {
  user: {
    photoURL?: string | null;
    displayName?: string | null;
    email?: string | null;
  } | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTooltip?: boolean;
  tooltipContent?: string;
}

const sizeClasses = {
  sm: 'size-6 text-xs',
  md: 'size-8 text-sm',
  lg: 'size-12 text-base',
  xl: 'size-16 text-lg',
};

export function UserAvatar({ 
  user, 
  size = 'md', 
  className = '', 
  showTooltip = false,
  tooltipContent 
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  const enhancedPhotoURL = getEnhancedGooglePhotoURL(user?.photoURL || null, 200);
  const userInitials = getUserInitials(user?.displayName || null);
  const avatarColor = getUserAvatarColor(user?.email || null);
  const sizeClass = sizeClasses[size];
  
  const tooltip = tooltipContent || (user ? `${user.displayName || "User"}${user.email ? ` - ${user.email}` : ''}` : '');

  const avatarElement = (
    <>
      {enhancedPhotoURL && !imageError ? (
        <img 
          src={enhancedPhotoURL} 
          alt={user?.displayName || user?.email || "User"} 
          className={`${sizeClass} rounded-full object-cover ring-2 ring-violet-200 dark:ring-violet-800 ${className}`}
          onError={(e) => {
            // First try original URL if enhanced fails
            if (user?.photoURL && e.currentTarget.src !== user.photoURL) {
              e.currentTarget.src = user.photoURL;
            } else {
              // If both fail, show initials
              setImageError(true);
            }
          }}
        />
      ) : (
        <div 
          className={`${sizeClass} rounded-full ${avatarColor} flex items-center justify-center ring-2 ring-violet-200 dark:ring-violet-800 ${className}`}
        >
          {user ? (
            <span className="font-medium text-white">
              {userInitials}
            </span>
          ) : (
            <User className="size-4 text-white" />
          )}
        </div>
      )}
    </>
  );

  if (showTooltip) {
    return (
      <div title={tooltip}>
        {avatarElement}
      </div>
    );
  }

  return avatarElement;
}