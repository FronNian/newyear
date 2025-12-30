import { useStorylineStore } from '@/stores/storylineStore';
import { getAllTemplates, applyTemplate, getTemplatePreview } from '@/services/storylineTemplates';

interface TemplateSelectorProps {
  onApply: () => void;
}

/** 模板选择器组件 */
export default function TemplateSelector({ onApply }: TemplateSelectorProps) {
  const { setStoryline, storyline } = useStorylineStore();
  const templates = getAllTemplates();
  
  const handleApplyTemplate = (templateId: string) => {
    const year = storyline.year;
    const newConfig = applyTemplate(templateId, year);
    setStoryline(newConfig);
    onApply();
  };
  
  return (
    <div className="space-y-6">
      <p className="text-white/60 text-sm">
        选择一个预设模板快速开始，模板会覆盖当前的故事线配置。
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {templates.map((template) => {
          const preview = getTemplatePreview(template.id);
          
          return (
            <div
              key={template.id}
              className="bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-colors"
            >
              {/* 模板头部 */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{template.thumbnail}</span>
                  <div>
                    <h3 className="text-white font-medium">{template.name}</h3>
                    <p className="text-white/50 text-xs">{template.description}</p>
                  </div>
                </div>
              </div>
              
              {/* 月份预览 */}
              <div className="p-4">
                <div className="grid grid-cols-4 gap-1 mb-4">
                  {preview?.monthPreviews.slice(0, 8).map((mp, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded bg-white/10 flex items-center justify-center text-xs text-white/60"
                      title={mp.title}
                    >
                      {getBackgroundEmoji(mp.background)}
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={() => handleApplyTemplate(template.id)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                >
                  应用模板
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* 自定义模板提示 */}
      <div className="bg-white/5 rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">🎨</div>
        <h3 className="text-white font-medium mb-2">自定义故事线</h3>
        <p className="text-white/50 text-sm mb-4">
          不使用模板，从头开始创建你的专属年度故事线
        </p>
        <button
          onClick={onApply}
          className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
        >
          开始自定义
        </button>
      </div>
    </div>
  );
}

/** 根据背景类型返回对应的 emoji */
function getBackgroundEmoji(type: string): string {
  switch (type) {
    case 'snow': return '❄️';
    case 'stars': return '⭐';
    case 'hearts': return '💕';
    case 'leaves': return '🍂';
    case 'rain': return '🌧️';
    case 'fireworks': return '🎆';
    default: return '✨';
  }
}
