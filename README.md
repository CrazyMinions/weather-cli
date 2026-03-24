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

本项目由 OpenCode AI 在以下模型辅助下开发：

- **主要模型**: SiliconFlow CN Pro/DeepSeek-V3.2
- **模型ID**: siliconflow-cn/Pro/deepseek-ai/DeepSeek-V3.2
- **AI代理**: Sisyphus - OhMyOpenCode 高级架构师代理

> 💡 本项目展示了AI辅助开发的完整工作流程：需求分析、代码实现、测试、文档和持续改进。


---


## English Version

# 🌤️ weather-cli

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)

A beautifully styled command-line weather query tool supporting Gaode Weather API and Open-Meteo.

## ✨ Features

| Feature | Command | Description |
|---------|---------|-------------|
| Multi-day Forecast | `--days 1-5` | 1-5 day weather forecast |
| Detailed Information | `--advanced` | Wind speed, update time, etc. |
| 24-hour Forecast | `--hourly` | Hour-by-hour weather changes |
| Air Quality | `--aqi` | AQI, PM2.5, PM10, etc. |
| JSON Output | `--json` | Suitable for script integration |
| Wallpaper Mode | `--wallpaper` | Clean, aesthetic card style |
| Unit Switch | `--unit` | Metric (°C) / Imperial (°F) |
| Local Cache | Automatic | 30-minute cache reduces API calls |

## 📦 Installation

### Global Installation

```bash
npm install -g .
```

### Local Usage

```bash
git clone https://github.com/CrazyMinions/weather-cli.git
cd weather-cli
npm install
```

## ⚙️ Configuration

Create a `.env` file in the project root:

```env
# Gaode Map Weather API Key (Required)
# Application URL: https://lbs.amap.com/
# Select "Web Service" type
GAODE_MAP_API_KEY=your_key_here

# Baidu Map API Key (Optional, for city resolution)
BAIDU_MAP_API_KEY=your_key_here
```

## 🚀 Usage

### Basic Usage

```bash
# Query Beijing weather
weather 北京

# Query Shanghai weather
weather 上海

# Use English city names
weather Beijing
weather Shanghai
```

## 🌍 Supported Cities

### Chinese Cities (100+)

Beijing, Shanghai, Guangzhou, Shenzhen, Chengdu, Hangzhou, Wuhan, Xi'an, Nanjing, Tianjin, Chongqing, Changsha, Kunming, Xiamen, Qingdao, Dalian, Shenyang, Harbin, Changchun, Zhengzhou, Jinan, Fuzhou, Hefei, Nanchang, Guiyang, Lanzhou, Yinchuan, Xining, Hohhot, Urumqi, Lhasa, Nanning, Haikou, Taipei, Hong Kong, Macau...

### International Cities

Tokyo, New York, London, Paris, Seoul, Singapore, Sydney, Los Angeles, San Francisco, Berlin, Moscow, Dubai, Bangkok, Mumbai, Toronto...

## 📊 Data Sources

| Data Type | Source | Notes |
|-----------|--------|-------|
| Chinese City Weather | Gaode Weather API | Real-time + 4-day forecast |
| International City Weather | Open-Meteo | Free, no API Key required |
| Air Quality | Open-Meteo Air Quality | Free, no API Key required |

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build
npm run build

# Type checking
npm run typecheck
```

## 📄 License

MIT License

## 🤝 Contributing

Pull Requests are welcome!

## 🤖 About

This project was developed with assistance from OpenCode AI using the following models:

- **Primary Model**: SiliconFlow CN Pro/DeepSeek-V3.2
- **Model ID**: siliconflow-cn/Pro/deepseek-ai/DeepSeek-V3.2
- **AI Agent**: Sisyphus - OhMyOpenCode Senior Architect Agent

> 💡 This project demonstrates the complete workflow of AI-assisted development: requirements analysis, code implementation, testing, documentation, and continuous improvement.
