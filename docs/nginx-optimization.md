# Nginx 优化配置（宝塔面板）

## 1. 启用 Gzip/Brotli 压缩

在宝塔面板 → 网站 → 设置 → 配置文件，添加以下配置：

```nginx
# Gzip 压缩
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_min_length 1024;
gzip_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/json
    application/javascript
    application/xml
    application/xml+rss
    application/wasm
    font/ttf
    font/otf
    font/woff
    font/woff2;

# Brotli 压缩（如果已安装 brotli 模块）
# brotli on;
# brotli_comp_level 6;
# brotli_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml application/wasm font/ttf font/otf;
```

## 2. 启用预压缩文件（推荐）

项目已生成 `.gz` 和 `.br` 文件，配置 Nginx 直接使用：

```nginx
# 优先使用预压缩的 .gz 文件
gzip_static on;

# 如果安装了 brotli 模块，优先使用 .br 文件
# brotli_static on;
```

## 3. 静态资源缓存

```nginx
# 静态资源长期缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|otf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary "Accept-Encoding";
}

# HTML 不缓存
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}

# WASM 文件
location ~* \.wasm$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    types {
        application/wasm wasm;
    }
}
```

## 4. HTTP/2 启用

宝塔面板 → 网站 → 设置 → SSL → 开启 HTTP/2

## 5. CDN 加速（推荐）

由于服务器在新加坡，建议使用 CDN 加速国内访问：

### 推荐 CDN 服务
- **Cloudflare**（免费，全球节点）
- **腾讯云 CDN**（国内节点多）
- **阿里云 CDN**（国内节点多）

### Cloudflare 配置
1. 将域名 DNS 托管到 Cloudflare
2. 开启代理（橙色云朵）
3. 设置缓存规则：
   - `*.js`, `*.css`, `*.woff2`, `*.ttf` → 缓存 1 年
   - `*.html` → 不缓存

### CDN 缓存规则
```
# 静态资源
/assets/* → 缓存 365 天
/fonts/* → 缓存 365 天
/wasm/* → 缓存 365 天
/music/* → 缓存 30 天
/models/* → 缓存 365 天

# HTML
/*.html → 不缓存
```

## 6. 字体优化

### 方案 A：使用 CDN 字体（推荐）
将字体托管到 CDN，或使用 Google Fonts 镜像：
- 国内镜像：`https://fonts.loli.net`
- 字节跳动：`https://fonts.bytedance.net`

### 方案 B：字体子集化
使用 fonttools 提取常用字符：
```bash
pip install fonttools brotli
pyftsubset NotoSansSC-Bold.ttf --text-file=chars.txt --output-file=NotoSansSC-Bold-subset.ttf
```

### 方案 C：字体预加载
在 `index.html` 中添加：
```html
<link rel="preload" href="/fonts/NotoSansSC-Bold.ttf" as="font" type="font/ttf" crossorigin>
```

## 7. 完整 Nginx 配置示例

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    # SSL 配置（宝塔自动生成）
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    root /www/wwwroot/your-site;
    index index.html;
    
    # Gzip
    gzip on;
    gzip_static on;
    gzip_vary on;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml application/wasm font/ttf font/woff font/woff2;
    
    # 静态资源缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /fonts/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /wasm/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        types {
            application/wasm wasm;
        }
    }
    
    location /models/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /music/ {
        expires 30d;
        add_header Cache-Control "public";
    }
    
    # SPA 路由
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # HTML 不缓存
    location = /index.html {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

## 性能检测工具

- [PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)
- [GTmetrix](https://gtmetrix.com/)
