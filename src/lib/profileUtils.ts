/**
 * Utility functions for handling user profile pictures from various providers
 */

/**
 * Get a higher quality Google profile picture URL
 * @param photoURL - The original Firebase photoURL
 * @param size - Desired size (default: 200)
 * @returns Enhanced photo URL or original if not Google
 */
export function getEnhancedGooglePhotoURL(photoURL: string | null, size: number = 200): string | null {
  if (!photoURL) return null;
  
  // Check if it's a Google profile picture
  if (photoURL.includes('googleusercontent.com')) {
    // Replace size parameter for higher quality
    // Google Photos URLs typically end with =s96-c (96px) or similar
    // We can replace this with our desired size
    const enhancedURL = photoURL.replace(/=s\d+-c?$/, `=s${size}-c`);
    return enhancedURL;
  }
  
  // Check if it's a Google user content URL (lh3.googleusercontent.com)
  if (photoURL.includes('lh3.googleusercontent.com') || photoURL.includes('lh4.googleusercontent.com')) {
    // For these URLs, we can add size parameter if not present
    if (!photoURL.includes('=s')) {
      return `${photoURL}=s${size}-c`;
    } else {
      return photoURL.replace(/=s\d+-c?$/, `=s${size}-c`);
    }
  }
  
  // Return original URL if not Google or if we can't enhance it
  return photoURL;
}

/**
 * Get user initials from display name for fallback avatar
 * @param displayName - User's display name
 * @returns Initials (max 2 characters)
 */
export function getUserInitials(displayName: string | null): string {
  if (!displayName) return 'U';
  
  const names = displayName.trim().split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

/**
 * Generate a consistent background color based on user email
 * @param email - User's email
 * @returns Tailwind CSS background color class
 */
export function getUserAvatarColor(email: string | null): string {
  if (!email) return 'bg-violet-600';
  
  const colors = [
    'bg-violet-600',
    'bg-blue-600',
    'bg-green-600',
    'bg-yellow-600',
    'bg-red-600',
    'bg-indigo-600',
    'bg-pink-600',
    'bg-teal-600',
  ];
  
  // Simple hash function to get consistent color for same email
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash) + email.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return colors[Math.abs(hash) % colors.length];
}