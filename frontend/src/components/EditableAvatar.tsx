import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Loader2, Trash2, Image as ImageIcon, X } from 'lucide-react';
import { uploadAvatar, deleteAvatar, AuthUser } from '../api/auth';
import Cropper from 'react-easy-crop';

interface EditableAvatarProps {
  user: AuthUser;
  onAvatarUpdate: (newAvatarUrl: string | null) => void;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: any): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}

export function EditableAvatar({ user, onAvatarUpdate }: EditableAvatarProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Options modal
  const [showOptions, setShowOptions] = useState(false);

  // Cropper modal
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (user.avatarUrl) {
      setShowOptions(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleDelete = async () => {
    setShowOptions(false);
    setIsUploading(true);
    setError(null);
    try {
      await deleteAvatar();
      onAvatarUpdate(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShowOptions(false);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageToCrop(reader.result as string);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });
    reader.readAsDataURL(file);
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    setIsUploading(true);
    setError(null);
    try {
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (!croppedBlob) throw new Error('Failed to crop image');
      
      const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
      const response = await uploadAvatar(file);
      onAvatarUpdate(response.avatarUrl);
      setImageToCrop(null);
    } catch (err: any) {
      setError(err.message || 'Failed to upload cropped image');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="relative group inline-block">
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
          title={user.avatarUrl ? "Manage Profile Picture" : "Upload Profile Picture"}
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

      {/* Options Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showOptions && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                onClick={() => setShowOptions(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-white rounded-2xl overflow-hidden shadow-2xl p-6"
                style={{ width: '100%', maxWidth: '384px' }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">Profile Photo</h3>
                
                <div className="flex justify-center mb-6">
                   <img src={user.avatarUrl!} alt="Current Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 shadow-sm" />
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-teal-50 text-teal-700 hover:bg-teal-100 font-semibold rounded-xl transition-colors"
                  >
                    <ImageIcon className="w-5 h-5" /> Change Profile Photo
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 hover:bg-red-100 font-semibold rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" /> Remove Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOptions(false)}
                    className="w-full py-3 text-gray-500 hover:bg-gray-50 font-semibold rounded-xl transition-colors mt-2"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Cropper Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {imageToCrop && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center px-4 py-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-gray-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[600px] max-h-full"
                style={{ width: '100%', maxWidth: '512px' }}
              >
                <div className="flex justify-between items-center p-4 border-b border-gray-800 shrink-0">
                  <h3 className="text-white font-semibold">Crop Image</h3>
                  <button onClick={() => setImageToCrop(null)} className="text-gray-400 hover:text-white transition">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="relative flex-1 bg-black" style={{ minHeight: '400px' }}>
                  <Cropper
                    image={imageToCrop}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                </div>

                <div className="p-6 border-t border-gray-800 shrink-0">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setImageToCrop(null)}
                      className="flex-1 py-3 px-4 rounded-xl border border-gray-700 text-white font-medium hover:bg-gray-800 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCropSave}
                      disabled={isUploading}
                      className="flex-1 py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Photo"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
