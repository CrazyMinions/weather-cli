# 🌤️ weather-cli

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)

美化的命令行天气查询工具，支持高德天气API和Open-Meteo。

## ✨ 功能特性

| 功能 | 命令 | 说明 |
|------|------|------|
| 多日预报 | `--days 1-5` | 1-5天天气预报 |
| 详细信息 | `--advanced` | 风力、更新时间等 |
| 24小时预报 | `--hourly` | 逐小时天气变化 |
| 空气质量 | `--aqi` | AQI、PM2.5、PM10等 |
| JSON输出 | `--json` | 适合脚本集成 |
| 壁纸模式 | `--wallpaper` | 简洁美观的卡片样式 |
| 单位切换 | `--unit` | 公制(°C) / 英制(°F) |
| 本地缓存 | 自动 | 30分钟缓存减少API调用 |

## 📦 安装

### 全局安装

```bash
npm install -g .
```

### 本地使用

```bash
git clone https://github.com/CrazyMinions/weather-cli.git
cd weather-cli
npm install
```

## ⚙️ 配置

在项目根目录创建 `.env` 文件：

```env
# 高德地图天气API Key（必填）
# 申请地址: https://lbs.amap.com/
# 选择"Web服务"类型
GAODE_MAP_API_KEY=your_key_here

# 百度地图API Key（可选，用于城市解析）
BAIDU_MAP_API_KEY=your_key_here
```

## 🚀 使用方法

### 基本用法

```bash
# 查询北京天气
weather 北京

# 查询上海天气
weather 上海

# 使用英文城市名
weather Beijing
weather Shanghai
```

### 命令选项

```bash
# 5天预报
weather 北京 --days 5

# 显示详细信息
weather 北京 --advanced

# 24小时逐时预报
weather 北京 --hourly

# 显示空气质量
weather 北京 --aqi

# 英制单位（°F, mph）
weather 北京 --unit imperial

# JSON格式输出
weather 北京 --json

# 壁纸模式
weather 北京 --wallpaper

# 禁用缓存
weather 北京 --no-cache

# 组合使用
weather 广州 --days 5 --advanced --hourly --aqi
```

## 📸 效果预览

### 标准模式

```
╔═════════════════════════╗
║  🌤️  北京 天气预报  🌤️  ║
╚═════════════════════════╝
╭─────── 实时天气 ───────╮
│                        │
│   ☀️  晴               │
│   🌡️ 温度: 12°C        │
│   💧 湿度: 25%         │
│   🌬️ 东南风  15 km/h   │
│                        │
╰────────────────────────╯

┌────────────┬──────┬──────────┬──────────┬──────────────────┐
│ 日期       │ 星期 │ 白天     │ 夜间     │ 温度范围         │
├────────────┼──────┼──────────┼──────────┼──────────────────┤
│ 03-20      │ 周四 │ 晴       │ 晴       │ 1°C ~ 16°C       │
│ 03-21      │ 周五 │ 多云     │ 多云     │ 7°C ~ 16°C       │
│ 03-22      │ 周六 │ 晴       │ 多云     │ 8°C ~ 21°C       │
└────────────┴──────┴──────────┴──────────┴──────────────────┘
数据来源: 高德地图
```

### 壁纸模式

```
╔══════════════════════════════════════════════╗
║                                              ║
║                   ☀️ 北京                    ║
║                                              ║
║                     12°C                     ║
║                      晴                      ║
║                                              ║
║               💧25%  🌬️东南风                ║
║                                              ║
╚══════════════════════════════════════════════╝
```

## 🌍 支持城市

### 国内城市（100+）

北京、上海、广州、深圳、成都、杭州、武汉、西安、南京、天津、重庆、长沙、昆明、厦门、青岛、大连、沈阳、哈尔滨、长春、郑州、济南、福州、合肥、南昌、贵阳、兰州、银川、西宁、呼和浩特、乌鲁木齐、拉萨、南宁、海口、台北、香港、澳门...

### 国际城市

东京、纽约、伦敦、巴黎、首尔、新加坡、悉尼、洛杉矶、旧金山、柏林、莫斯科、迪拜、曼谷、孟买、多伦多...

## 📊 数据来源

| 数据类型 | 来源 | 说明 |
|----------|------|------|
| 中国城市天气 | 高德天气API | 实时 + 4天预报 |
| 国际城市天气 | Open-Meteo | 免费，无需API Key |
| 空气质量 | Open-Meteo Air Quality | 免费，无需API Key |

## 🛠️ 开发

```bash
# 安装依赖
npm install

# 开发模式运行
npm run dev

# 构建
npm run build

# 类型检查
npm run typecheck
```

## 📄 License

MIT License

## 🤝 Contributing

欢迎提交 Pull Request！

## 🤖 关于

本项目由 OpenCode 使用 MiMo V2 Omni Free 模型自主开发。
