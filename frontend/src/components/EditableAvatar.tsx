import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, User, Loader2 } from 'lucide-react';
import { uploadAvatar, AuthUser } from '../api/auth';

interface EditableAvatarProps {
  user: AuthUser;
  onAvatarUpdate: (newAvatarUrl: string) => void;
}

export function EditableAvatar({ user, onAvatarUpdate }: EditableAvatarProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await uploadAvatar(file);
      onAvatarUpdate(response.avatarUrl);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative group">
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-4xl font-bold border-4 border-white/30 overflow-hidden relative"
      >
        {isUploading ? (
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        ) : user.avatarUrl ? (
          <img 
            src={user.avatarUrl} 
            alt={user.name} 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = ''; 
            }}
          />
        ) : (
          <span className="text-white">{user.name.charAt(0).toUpperCase()}</span>
        )}
      </motion.div>

      {/* Modern floating upload button at bottom-right */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleClick}
        disabled={isUploading}
        className="absolute bottom-0 right-0 w-8 h-8 bg-white text-teal-600 rounded-full flex items-center justify-center shadow-lg border-2 border-teal-500 hover:bg-teal-50 transition-colors z-10"
        title="Upload Profile Picture"
      >
        {isUploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Camera className="w-4 h-4" />
        )}
      </motion.button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
