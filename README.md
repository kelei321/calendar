# 轻日历

一个本地优先的 PWA H5 日历应用，基于 Vite、React、TypeScript 和 IndexedDB 构建。应用支持月视图、周视图、日程管理、农历/节气/节假日展示，并可部署到 GitHub Pages。

## 功能特性

- PWA 支持：可添加到桌面，支持离线缓存
- 本地优先：日程数据存储在浏览器 IndexedDB 中
- 日历视图：支持月视图、周视图和日期摘要
- 日程管理：支持新增、编辑、删除日程
- 日期信息：展示农历、节气、节假日和调休标记
- 移动端优化：适配 H5 和手机安全区
- GitHub Pages 部署：内置 Pages 专用构建脚本和部署 workflow

## 技术栈

- Vite
- React
- TypeScript
- Day.js
- IndexedDB / idb
- vite-plugin-pwa
- lucide-react

## 本地开发

安装依赖：`npm ci`

启动开发服务：`npm run dev`

默认会以 `0.0.0.0` 启动，方便局域网手机访问。

## 构建与校验

- 普通生产构建：`npm run build`
- 类型检查：`npm run typecheck`
- 完整 CI 校验：`npm run ci`
- GitHub Pages 构建：`npm run build:pages`

`build:pages` 会使用 `/calendar/` 作为 Vite base，适配仓库 Pages 地址。

## 预览

运行 `npm run preview` 本地预览构建产物。

## GitHub Pages 部署

项目内置 `.github/workflows/pages.yml`，合并到 `main` 后会自动执行部署。

仓库设置中需要确认：

1. 打开 GitHub 仓库 Settings
2. 进入 Pages
3. Source 选择 `GitHub Actions`

部署成功后，应用会发布到仓库对应的 GitHub Pages 地址。

## 数据说明

当前日程数据存储在浏览器本地 IndexedDB 中，不会自动同步到云端。清除浏览器站点数据或更换浏览器后，本地日程数据可能不可见。

## 开发脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动本地开发服务 |
| `npm run typecheck` | 执行 TypeScript 类型检查 |
| `npm run build` | 执行普通生产构建 |
| `npm run build:pages` | 执行 GitHub Pages 构建 |
| `npm run ci` | 执行 typecheck 和 build |
| `npm run preview` | 本地预览构建产物 |
