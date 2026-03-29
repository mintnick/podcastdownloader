# 小宇宙下载助手

一个 Chrome 扩展，用于在小宇宙网页单集页面中增加“下载音频”按钮，直接下载节目音频文件。

项目页面：<https://www.nickning.me/projects/xyzdl>

## 功能

- 在小宇宙单集页面显示下载按钮
- 自动识别真实音频地址并调用浏览器下载
- 支持常见音频格式：
  `mp3`、`m4a`、`aac`、`mp4`、`wav`、`flac`、`ogg`
- 兼容小宇宙页面静态数据和运行时动态注入的音频地址

当前版本：`1.2.0`

## 安装

### 方式一：Chrome Web Store

适合可以正常访问 Chrome Web Store 的用户。

上传包使用：

`小宇宙下载助手-v1.2.0-store-upload.zip`

### 方式二：离线安装

适合无法正常访问 Chrome Web Store 的用户。

离线分发包使用：

`xyzdownloader-v1.2.0.zip`

安装步骤：

1. 解压离线包
2. 打开 `chrome://extensions`
3. 开启右上角“开发者模式”
4. 点击“加载已解压的扩展程序”
5. 选择包含 `manifest.json` 的目录

更详细说明见：[离线安装说明.md](/Users/nick/Desktop/Projects/podcastdownloader/离线安装说明.md)

## 使用方法

1. 打开小宇宙单集页面，地址形如：
   `https://www.xiaoyuzhoufm.com/episode/...`
2. 在节目封面上方找到“下载音频”按钮
3. 点击后浏览器会开始下载对应音频

测试页面示例：

<https://www.xiaoyuzhoufm.com/episode/6960e332e235ea65bcf89e8d>

## 抓取逻辑

扩展会按以下顺序查找音频地址：

1. `meta[property="og:audio"]`
2. JSON-LD 中的 `associatedMedia.contentUrl`
3. `__NEXT_DATA__` 中的音频字段
4. 页面里的 `audio.currentSrc` / `audio.src`
5. 页面运行时请求和播放器赋值产生的音频地址
6. 浏览器 `performance` 资源记录

## 项目结构

- [manifest.json](/Users/nick/Desktop/Projects/podcastdownloader/manifest.json)
  扩展配置
- [scripts/content.js](/Users/nick/Desktop/Projects/podcastdownloader/scripts/content.js)
  页面按钮注入与音频地址提取
- [scripts/page-hook.js](/Users/nick/Desktop/Projects/podcastdownloader/scripts/page-hook.js)
  页面上下文中的运行时音频地址捕获
- [scripts/background.js](/Users/nick/Desktop/Projects/podcastdownloader/scripts/background.js)
  下载任务创建与文件扩展名推断
- [css/content.css](/Users/nick/Desktop/Projects/podcastdownloader/css/content.css)
  下载按钮样式
- [popup/popup.html](/Users/nick/Desktop/Projects/podcastdownloader/popup/popup.html)
  扩展弹窗页面

## 本地开发

1. 修改源码
2. 打开 `chrome://extensions`
3. 开启“开发者模式”
4. 选择“加载已解压的扩展程序”
5. 指向当前项目目录
6. 每次改完后点击“重新加载”

## 打包

### Web Store 上传包

只包含扩展运行必需文件：

`小宇宙下载助手-v1.2.0-store-upload.zip`

### 离线分发包

包含扩展运行文件和离线安装说明：

`xyzdownloader-v1.2.0.zip`

### CRX

`.crx` 仅适合特定场景分发。现代 Chrome 对非 Chrome Web Store 来源的 `.crx` 安装限制较多，普通用户更推荐使用：

- Chrome Web Store
- 或“加载已解压的扩展程序”

## 说明

- 本地打包 `.crx` 时使用私钥 `podcastdownloader.pem`
- 私钥不应包含在扩展目录最终打包内容中
- 仓库中的 `.gitignore` 已排除私钥和本地产物
