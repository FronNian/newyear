import { useCallback, useRef, useState } from 'react';
import { useAppStore, usePhotos, useSettings } from '@/stores/appStore';
import { validatePhoto, createPhotoData, canAddMorePhotos } from '@/utils/photoUtils';
import { MAX_PHOTO_COUNT } from '@/types';
import { X, Trash2, Upload, Image } from 'lucide-react';

export default function PhotoUploader() {
  const photos = usePhotos();
  const settings = useSettings();
  const addPhoto = useAppStore((state) => state.addPhoto);
  const removePhoto = useAppStore((state) => state.removePhoto);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setError(null);
    setUploading(true);
    
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // 检查是否还能添加更多照片
        if (!canAddMorePhotos(photos.length + i)) {
          setError(`最多只能上传 ${MAX_PHOTO_COUNT} 张照片`);
          break;
        }
        
        // 验证文件
        const validation = validatePhoto(file);
        if (!validation.valid) {
          setError(validation.message || '文件验证失败');
          continue;
        }
        
        // 创建照片数据（使用当前粒子形状生成随机位置）
        const photoData = await createPhotoData(file, settings.particleShape);
        
        // 添加到 store
        const success = addPhoto(photoData);
        if (!success) {
          setError('添加照片失败');
        }
      }
    } catch (err) {
      setError('上传失败，请重试');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [photos.length, addPhoto, settings.particleShape]);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);
  
  return (
    <>
      {/* 触发按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 sm:bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs sm:text-sm backdrop-blur-sm transition-colors z-20 flex items-center gap-1.5"
      >
        <Image className="w-4 h-4" />
        <span>上传照片 ({photos.length}/{MAX_PHOTO_COUNT})</span>
      </button>
      
      {/* 上传面板 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="relative bg-gray-900/95 rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 w-full sm:max-w-md sm:mx-4 max-h-[85vh] flex flex-col">
            {/* 头部 */}
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Image className="w-5 h-5" />
                照片管理
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* 上传区域 */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-600 rounded-xl p-4 sm:p-8 text-center mb-4 hover:border-gray-400 transition-colors flex-shrink-0"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 mb-2" />
                <div className="text-gray-300 text-sm sm:text-base mb-1">
                  {uploading ? '上传中...' : '点击或拖拽上传照片'}
                </div>
                <div className="text-gray-500 text-xs sm:text-sm">
                  支持 JPG、PNG、WebP，最大 50MB
                </div>
              </label>
            </div>
            
            {/* 错误提示 */}
            {error && (
              <div className="bg-red-500/20 text-red-400 px-3 py-2 rounded-lg mb-4 text-xs sm:text-sm flex-shrink-0">
                {error}
              </div>
            )}
            
            {/* 已上传照片列表 */}
            {photos.length > 0 && (
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="flex justify-between items-center mb-2 flex-shrink-0">
                  <h3 className="text-xs sm:text-sm text-gray-400">
                    已上传 ({photos.length}/{MAX_PHOTO_COUNT})
                  </h3>
                </div>
                <div className="overflow-y-auto flex-1 space-y-2 pb-2">
                  {photos.map((photo) => (
                    <div 
                      key={photo.id} 
                      className="flex items-center gap-3 bg-white/5 rounded-lg p-2 hover:bg-white/10 transition-colors"
                    >
                      <img
                        src={photo.url}
                        alt=""
                        className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white/80 text-sm truncate">
                          照片 {photos.indexOf(photo) + 1}
                        </p>
                        <p className="text-gray-500 text-xs">
                          点击右侧按钮删除
                        </p>
                      </div>
                      <button
                        onClick={() => removePhoto(photo.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 提示 */}
            <p className="text-gray-500 text-xs text-center mt-3 pt-3 border-t border-white/10 flex-shrink-0">
              上传的照片将显示在场景中作为装饰
            </p>
          </div>
        </div>
      )}
    </>
  );
}
