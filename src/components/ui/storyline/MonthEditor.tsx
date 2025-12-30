import { useState } from 'react';
import { useStorylineStore } from '@/stores/storylineStore';
import { MONTH_NAMES, type BackgroundEffectType, DEFAULT_BACKGROUND_EFFECT } from '@/types';
import { createImageElement, createParticleTextElement } from '@/services/storylineService';
import ElementEditor from './ElementEditor';

interface MonthEditorProps {
  month: number;
  onClose: () => void;
}

const BACKGROUND_OPTIONS: { value: BackgroundEffectType; label: string }[] = [
  { value: 'none', label: '无' },
  { value: 'snow', label: '雪花' },
  { value: 'stars', label: '星空' },
  { value: 'hearts', label: '爱心' },
  { value: 'leaves', label: '落叶' },
  { value: 'rain', label: '雨滴' },
  { value: 'fireworks', label: '烟花' },
];

/** 单月编辑器组件 */
export default function MonthEditor({ month, onClose }: MonthEditorProps) {
  const { storyline, updateMonthSlide, addElement, removeElement, reorderElement } = useStorylineStore();
  const slide = storyline.slides[month];
  
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  
  const backgroundEffect = slide.backgroundEffect || DEFAULT_BACKGROUND_EFFECT;
  
  const handleAddImage = () => {
    const element = createImageElement('', {
      position: [0, 0, 0],
      scale: 1,
      frameStyle: 'polaroid',
      entranceAnimation: 'fade',
    });
    addElement(month, element);
    setEditingElementId(element.id);
  };
  
  const handleAddParticleText = () => {
    const element = createParticleTextElement('文字', {
      position: [0, 0, 0],
      scale: 1,
      colorTheme: 'golden',
      particleCount: 2000,
      fontSize: 1,
      entranceAnimation: 'fade',
    });
    addElement(month, element);
    setEditingElementId(element.id);
  };
  
  const editingElement = slide.elements.find(e => e.id === editingElementId);
  
  return (
    <div className="bg-white/5 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          编辑 {MONTH_NAMES[month]}
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* 基本信息 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-white/60 mb-1">标题</label>
          <input
            type="text"
            value={slide.title}
            onChange={(e) => updateMonthSlide(month, { title: e.target.value })}
            className="w-full bg-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={MONTH_NAMES[month]}
          />
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1">副标题</label>
          <input
            type="text"
            value={slide.subtitle || ''}
            onChange={(e) => updateMonthSlide(month, { subtitle: e.target.value })}
            className="w-full bg-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="可选副标题"
          />
        </div>
      </div>
      
      {/* 背景效果 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-white/60 mb-1">背景效果</label>
          <select
            value={backgroundEffect.type}
            onChange={(e) => updateMonthSlide(month, {
              backgroundEffect: { ...backgroundEffect, type: e.target.value as BackgroundEffectType }
            })}
            className="w-full bg-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [&>option]:bg-gray-800 [&>option]:text-white"
          >
            {BACKGROUND_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-white/60 mb-1">效果强度</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={backgroundEffect.intensity}
            onChange={(e) => updateMonthSlide(month, {
              backgroundEffect: { ...backgroundEffect, intensity: Number(e.target.value) }
            })}
            className="w-full"
          />
        </div>
      </div>
      
      {/* 元素列表 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm text-white/60">元素</label>
          <div className="flex gap-2">
            <button
              onClick={handleAddImage}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors"
            >
              + 图片
            </button>
            <button
              onClick={handleAddParticleText}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors"
            >
              + 粒子文字
            </button>
          </div>
        </div>
        
        {slide.elements.length === 0 ? (
          <div className="text-center py-8 text-white/40 text-sm">
            暂无元素，点击上方按钮添加
          </div>
        ) : (
          <div className="space-y-2">
            {slide.elements.map((element, index) => (
              <div
                key={element.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  editingElementId === element.id ? 'bg-blue-600/30' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                {/* 排序按钮 */}
                <div className="flex flex-col gap-0.5 mr-2">
                  <button
                    onClick={() => reorderElement(month, element.id, 'up')}
                    disabled={index === 0}
                    className={`p-0.5 rounded transition-colors ${
                      index === 0 ? 'text-white/20 cursor-not-allowed' : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                    title="上移"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => reorderElement(month, element.id, 'down')}
                    disabled={index === slide.elements.length - 1}
                    className={`p-0.5 rounded transition-colors ${
                      index === slide.elements.length - 1 ? 'text-white/20 cursor-not-allowed' : 'text-white/60 hover:bg-white/10 hover:text-white'
                    }`}
                    title="下移"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                
                <button
                  onClick={() => setEditingElementId(editingElementId === element.id ? null : element.id)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <span className="text-lg">
                    {element.type === 'image' ? '🖼️' : element.type === 'particle_text' ? '✨' : '🎄'}
                  </span>
                  <div>
                    <div className="text-white text-sm">
                      {element.type === 'image' ? '图片' : 
                       element.type === 'particle_text' ? (element as any).text : '装饰'}
                    </div>
                    <div className="text-white/40 text-xs">{element.type}</div>
                  </div>
                </button>
                <button
                  onClick={() => removeElement(month, element.id)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* 元素编辑器 */}
      {editingElement && (
        <ElementEditor
          month={month}
          element={editingElement}
          onClose={() => setEditingElementId(null)}
        />
      )}
    </div>
  );
}
