# 🎆 2026 新年倒计时

一个炫酷的 3D 新年倒计时网页应用，支持手势控制、音乐播放、烟花特效等丰富功能。

![License](https://img.shields.io/badge/license-CC%20BY--NC--SA%204.0-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![Three.js](https://img.shields.io/badge/Three.js-r160-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6)

## ✨ 功能特性

### 🎄 3D 场景
- 粒子形状：圣诞树、蛋糕、烟花、爱心
- 多种颜色主题：经典绿、冰蓝、浪漫粉、金色、彩虹
- 雪花飘落效果
- 星空背景
- 3D 装饰物系统

### ⏰ 倒计时
- 实时倒计时显示（文字/粒子模式）
- 最后 10 秒大数字倒计时
- 脉冲粒子特效
- 自动/手动触发庆祝
- 可配置目标年份

### 🎵 音乐播放器
- 内置多首新年歌曲
- 歌词同步显示
- 多种播放模式（单曲循环、列表循环、随机）
- 音频频谱可视化
- 色差效果跟随节拍

### 🖐️ 手势控制
- 五指张开：移动视角
- 握拳：聚合粒子
- 捏合：缩放
- 比心：触发爱心特效
- 基于 MediaPipe 手势识别

### 📸 照片功能
- 上传照片作为装饰
- 照片墙模式
- 照片悬浮在 3D 场景中

### 🎆 特效系统
- 烟花爆炸效果
- 爱心粒子
- 彩纸飘落
- 祝福语动画

### 📖 故事线模式
- 12 个月份回顾
- 自定义图片和文字
- 过渡动画效果
- 背景音乐配置

### 🔗 分享功能
- 生成分享链接
- 保存配置到云端
- 分享页面独立访问

### ⌨️ 快捷键支持
- `Space/Enter` - 开始倒计时
- `R` - 重置视角
- `F` - 全屏切换
- `M` - 音乐播放/暂停
- `H` - 爱心特效
- `W` - 烟花特效
- `?` - 显示帮助

## 🚀 快速开始

### 环境要求
- Node.js 18+
- pnpm

### 安装依赖
```bash
pnpm install
```

### 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 填写 R2 存储配置（可选，用于分享功能）
```

### 启动开发服务器
```bash
pnpm dev
```

### 构建生产版本
```bash
pnpm build
```

## 📁 项目结构

```
src/
├── components/
│   ├── 3d/           # 3D 场景组件
│   │   ├── Scene.tsx           # 主场景
│   │   ├── ParticleTree.tsx    # 粒子形状
│   │   ├── CountdownDisplay.tsx # 倒计时显示
│   │   ├── Fireworks.tsx       # 烟花效果
│   │   ├── Snowfall.tsx        # 雪花效果
│   │   └── storyline/          # 故事线组件
│   └── ui/           # UI 组件
│       ├── MusicPlayer.tsx     # 音乐播放器
│       ├── SettingsPanel.tsx   # 设置面板
│       ├── GestureController.tsx # 手势控制
│       └── ShareModal.tsx      # 分享弹窗
├── stores/           # Zustand 状态管理
├── services/         # 业务服务
├── hooks/            # 自定义 Hooks
├── utils/            # 工具函数
├── types/            # TypeScript 类型
└── fireworks/        # 烟花系统
```

## 🛠️ 技术栈

- **框架**: React 18 + TypeScript
- **3D 渲染**: Three.js + React Three Fiber + Drei
- **状态管理**: Zustand
- **样式**: Tailwind CSS
- **手势识别**: MediaPipe Tasks Vision
- **音频**: Howler.js
- **构建工具**: Vite

## 📄 许可证

本项目采用 [CC BY-NC-SA 4.0](LICENSE) 许可证。

- ✅ 允许分享和改编
- ✅ 需要署名
- ❌ 禁止商业使用
- ✅ 衍生作品需使用相同许可证

## 🙏 致谢

- [Three.js](https://threejs.org/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [MediaPipe](https://developers.google.com/mediapipe)
- [Howler.js](https://howlerjs.com/)
