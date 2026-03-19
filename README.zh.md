# 🌤️ weather-cli

一个用 TypeScript 构建的命令行天气查询工具。

## ✨ 功能特性

- 查询全球任何城市的天气
- 使用颜色和表情符号的精美终端输出
- 使用 wttr.in API 快速响应
- 简单直观的命令行界面

## 📦 安装

### 前提条件

- Node.js（v20 或更高版本）
- npm

### 全局安装

```bash
npm install -g .
```

或者克隆到本地运行：

```bash
git clone https://github.com/CrazyMinions/weather-cli.git
cd weather-cli
npm install
npm run start
```

## 🚀 使用方法

### 查询特定城市的天气

```bash
weather-cli Beijing
```

### 查询默认城市（北京）的天气

```bash
weather-cli
```

### 输出示例

```
🌤️  Weather Report
Location: Beijing
Temperature: 25°C (Feels like 27°C)
Condition: Sunny
Humidity: 45%
Wind: 12 km/h
UV Index: 6
```

## 🛠️ 开发

### 安装依赖

```bash
npm install
```

### 开发模式运行

```bash
npm run start
```

### 类型检查

```bash
npm run typecheck
```

### 代码检查

```bash
npm run lint
```

## 📄 许可证

MIT 许可证

## 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

## 📞 支持

如果您遇到任何问题，请在 GitHub 上提交 Issue。