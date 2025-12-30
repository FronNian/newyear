import * as THREE from 'three';
import type { DecorType } from '@/types';

/**
 * 创建宝石几何体 - 八面体形状
 */
export function createGemGeometry(): THREE.BufferGeometry {
  return new THREE.OctahedronGeometry(1, 0);
}

/**
 * 创建水晶几何体 - 六棱柱形状
 */
export function createCrystalGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.CylinderGeometry(0.5, 0.8, 2, 6, 1);
  // 添加顶部尖端
  const topCone = new THREE.ConeGeometry(0.5, 0.8, 6);
  topCone.translate(0, 1.4, 0);
  
  const merged = new THREE.BufferGeometry();
  merged.copy(geometry);
  
  return merged;
}

/**
 * 创建钻石几何体 - 钻石切割形状
 */
export function createDiamondGeometry(): THREE.BufferGeometry {
  // 使用八面体作为基础，稍微压扁
  const geometry = new THREE.OctahedronGeometry(1, 1);
  geometry.scale(1, 1.2, 1);
  return geometry;
}

/**
 * 创建星星几何体 - 五角星形状
 */
export function createStarGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const outerRadius = 1;
  const innerRadius = 0.4;
  const points = 5;
  
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  shape.closePath();
  
  const extrudeSettings = {
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 1,
  };
  
  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

/**
 * 创建铃铛几何体
 */
export function createBellGeometry(): THREE.BufferGeometry {
  const points = [];
  for (let i = 0; i < 10; i++) {
    const t = i / 9;
    const radius = 0.3 + Math.sin(t * Math.PI) * 0.5;
    points.push(new THREE.Vector2(radius, t * 1.5 - 0.75));
  }
  return new THREE.LatheGeometry(points, 16);
}


/**
 * 创建礼物盒几何体
 */
export function createGiftBoxGeometry(): THREE.BufferGeometry {
  return new THREE.BoxGeometry(1, 1, 1);
}

/**
 * 创建蝴蝶结几何体
 */
export function createRibbonGeometry(): THREE.BufferGeometry {
  // 简化的蝴蝶结 - 两个球体
  const geometry = new THREE.SphereGeometry(0.5, 8, 8);
  geometry.scale(1.5, 0.8, 0.5);
  return geometry;
}

/**
 * 创建糖果几何体 - 糖果棒形状
 */
export function createCandyGeometry(): THREE.BufferGeometry {
  return new THREE.CapsuleGeometry(0.3, 1.5, 4, 8);
}

/**
 * 创建花朵几何体
 */
export function createFlowerGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const petals = 5;
  const outerRadius = 1;
  const innerRadius = 0.3;
  
  for (let i = 0; i < petals * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / petals;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.quadraticCurveTo(
        Math.cos(angle - Math.PI / petals / 2) * (radius + 0.2),
        Math.sin(angle - Math.PI / petals / 2) * (radius + 0.2),
        x,
        y
      );
    }
  }
  shape.closePath();
  
  const extrudeSettings = {
    depth: 0.15,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 1,
  };
  
  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

/**
 * 创建叶子几何体
 */
export function createLeafGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, -1);
  shape.quadraticCurveTo(0.6, -0.3, 0.4, 0.5);
  shape.quadraticCurveTo(0.2, 1, 0, 1);
  shape.quadraticCurveTo(-0.2, 1, -0.4, 0.5);
  shape.quadraticCurveTo(-0.6, -0.3, 0, -1);
  
  const extrudeSettings = {
    depth: 0.05,
    bevelEnabled: false,
  };
  
  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}


/**
 * 创建蝴蝶几何体
 */
export function createButterflyGeometry(): THREE.BufferGeometry {
  // 简化的蝴蝶翅膀
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(1, 0.5, 0.8, 1);
  shape.quadraticCurveTo(0.3, 0.8, 0, 0);
  
  const extrudeSettings = {
    depth: 0.02,
    bevelEnabled: false,
  };
  
  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

/**
 * 创建萤火虫几何体 - 小发光球体
 */
export function createFireflyGeometry(): THREE.BufferGeometry {
  return new THREE.SphereGeometry(1, 8, 8);
}

/**
 * 创建爱心几何体
 */
export function createHeartGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const x = 0, y = 0;
  
  shape.moveTo(x, y);
  shape.bezierCurveTo(x, y - 0.5, x - 1, y - 0.5, x - 1, y);
  shape.bezierCurveTo(x - 1, y + 0.6, x, y + 1.2, x, y + 1.5);
  shape.bezierCurveTo(x, y + 1.2, x + 1, y + 0.6, x + 1, y);
  shape.bezierCurveTo(x + 1, y - 0.5, x, y - 0.5, x, y);
  
  const extrudeSettings = {
    depth: 0.4,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.1,
    bevelSegments: 2,
  };
  
  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

/**
 * 创建月亮几何体 - 新月形状
 */
export function createMoonGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const outerRadius = 1;
  const innerRadius = 0.7;
  const offset = 0.4;
  
  // 外圆弧
  for (let i = 0; i <= 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const x = Math.cos(angle) * outerRadius;
    const y = Math.sin(angle) * outerRadius;
    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }
  
  // 内圆弧（偏移）
  const hole = new THREE.Path();
  for (let i = 0; i <= 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const x = Math.cos(angle) * innerRadius + offset;
    const y = Math.sin(angle) * innerRadius;
    if (i === 0) {
      hole.moveTo(x, y);
    } else {
      hole.lineTo(x, y);
    }
  }
  shape.holes.push(hole);
  
  const extrudeSettings = {
    depth: 0.15,
    bevelEnabled: false,
  };
  
  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

/**
 * 创建云朵几何体
 */
export function createCloudGeometry(): THREE.BufferGeometry {
  // 使用多个球体组合的简化云朵
  const geometry = new THREE.SphereGeometry(1, 8, 8);
  geometry.scale(1.5, 0.8, 0.8);
  return geometry;
}

/**
 * 创建气球几何体
 */
export function createBalloonGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.SphereGeometry(1, 16, 16);
  geometry.scale(0.8, 1, 0.8);
  return geometry;
}

// 几何类
export function createSphereGeometry(): THREE.BufferGeometry {
  return new THREE.SphereGeometry(1, 16, 16);
}

export function createCubeGeometry(): THREE.BufferGeometry {
  return new THREE.BoxGeometry(1, 1, 1);
}

export function createPyramidGeometry(): THREE.BufferGeometry {
  return new THREE.ConeGeometry(1, 1.5, 4);
}

export function createTorusGeometry(): THREE.BufferGeometry {
  return new THREE.TorusGeometry(0.7, 0.3, 8, 16);
}

/**
 * 几何体创建函数映射
 */
const geometryCreators: Record<DecorType, () => THREE.BufferGeometry> = {
  gem: createGemGeometry,
  crystal: createCrystalGeometry,
  diamond: createDiamondGeometry,
  star: createStarGeometry,
  bell: createBellGeometry,
  giftbox: createGiftBoxGeometry,
  ribbon: createRibbonGeometry,
  candy: createCandyGeometry,
  flower: createFlowerGeometry,
  leaf: createLeafGeometry,
  butterfly: createButterflyGeometry,
  firefly: createFireflyGeometry,
  sphere: createSphereGeometry,
  cube: createCubeGeometry,
  pyramid: createPyramidGeometry,
  torus: createTorusGeometry,
  'heart-decor': createHeartGeometry,
  moon: createMoonGeometry,
  cloud: createCloudGeometry,
  balloon: createBalloonGeometry,
};

/**
 * 根据装饰类型获取几何体
 * @param type 装饰类型
 * @returns 对应的几何体，如果创建失败则返回默认球体
 */
export function getGeometryForType(type: DecorType): THREE.BufferGeometry {
  try {
    const creator = geometryCreators[type];
    if (creator) {
      return creator();
    }
    console.warn(`Unknown decor type: ${type}, falling back to sphere`);
    return new THREE.SphereGeometry(0.1, 8, 8);
  } catch (error) {
    console.warn(`Failed to create geometry for ${type}, falling back to sphere`, error);
    return new THREE.SphereGeometry(0.1, 8, 8);
  }
}
