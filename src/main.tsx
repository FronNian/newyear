import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { useAppStore } from './stores/appStore';
import { loadPhotos, migrateFromLocalStorage } from './services/photoStorageService';

// 初始化照片数据（从 IndexedDB 加载）
async function initPhotos() {
  try {
    // 先尝试迁移 localStorage 中的旧数据
    await migrateFromLocalStorage();
    
    // 从 IndexedDB 加载照片
    const photos = await loadPhotos();
    if (photos.length > 0) {
      useAppStore.setState({ photos });
    }
  } catch (error) {
    console.error('Failed to init photos:', error);
  }
}

// 初始化照片后渲染应用
initPhotos().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});
