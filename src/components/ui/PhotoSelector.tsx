import { usePhotos } from '@/stores/appStore';

interface PhotoSelectorProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export default function PhotoSelector({ selectedIds, onSelectionChange }: PhotoSelectorProps) {
  const photos = usePhotos();
  
  const toggleSelection = (photoId: string) => {
    const isSelected = selectedIds.includes(photoId);
    if (isSelected) {
      onSelectionChange(selectedIds.filter(id => id !== photoId));
    } else {
      onSelectionChange([...selectedIds, photoId]);
    }
  };
  
  const selectAll = () => {
    onSelectionChange(photos.map(p => p.id));
  };
  
  const clearSelection = () => {
    onSelectionChange([]);
  };
  
  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <div className="text-4xl mb-2">📷</div>
        <p>还没有上传照片</p>
        <p className="text-sm mt-1">请先在"上传照片"中添加照片</p>
      </div>
    );
  }
  
  return (
    <div>
      {/* 操作按钮 */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={selectAll}
          className="px-3 py-1 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded transition-colors"
        >
          全选
        </button>
        <button
          onClick={clearSelection}
          className="px-3 py-1 text-xs bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 rounded transition-colors"
        >
          清除
        </button>
        <span className="text-xs text-gray-500 ml-auto self-center">
          已选 {selectedIds.length}/{photos.length}
        </span>
      </div>
      
      {/* 照片网格 */}
      <div className="grid grid-cols-4 gap-2">
        {photos.map((photo) => {
          const isSelected = selectedIds.includes(photo.id);
          return (
            <div
              key={photo.id}
              onClick={() => toggleSelection(photo.id)}
              className={`relative cursor-pointer rounded-lg overflow-hidden transition-all ${
                isSelected 
                  ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900' 
                  : 'hover:opacity-80'
              }`}
            >
              <img
                src={photo.url}
                alt=""
                className="w-full aspect-square object-cover"
              />
              {/* 选中指示器 */}
              {isSelected && (
                <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
