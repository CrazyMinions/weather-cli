#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { resolveCity } from './resolveCity.js';
import stringWidth from 'string-width';
import boxen from 'boxen';
import Gradient from 'gradient-string';
import Table from 'cli-table3';
import ora from 'ora';
import * as dotenv from 'dotenv';

dotenv.config();

// 高德天气API Key
const GAODE_API_KEY = process.env.GAODE_MAP_API_KEY || '';

interface WeatherData {
  current_condition: Array<{
    temp_C: string;
    humidity: string;
    weatherDesc: Array<{ value: string }>;
    windspeedKmph: string;
    FeelsLikeC: string;
    uvIndex: string;
    pressure: string;
    visibility: string;
    windDirection: string;
  }>;
  weather: Array<{
    date: string;
    week: string;
    maxtempC: string;
    mintempC: string;
    dayweather: string;
    nightweather: string;
    daywind: string;
    nightwind: string;
    daypower: string;
    nightpower: string;
  }>;
}

// 城市名称到高德adcode的映射（常用城市）
const cityAdcodes: Record<string, string> = {
  'beijing': '110000',
  '北京': '110000',
  'shanghai': '310000',
  '上海': '310000',
  'guangzhou': '440100',
  '广州': '440100',
  'shenzhen': '440300',
  '深圳': '440300',
  'chengdu': '510100',
  '成都': '510100',
  'hangzhou': '330100',
  '杭州': '330100',
  'wuhan': '420100',
  '武汉': '420100',
  'xian': '610100',
  '西安': '610100',
  'nanjing': '320100',
  '南京': '320100',
  'tianjin': '120000',
  '天津': '120000',
  'chongqing': '500000',
  '重庆': '500000',
  'changsha': '430100',
  '长沙': '430100',
  'kunming': '530100',
  '昆明': '530100',
  'xiamen': '350200',
  '厦门': '350200',
  'qingdao': '370200',
  '青岛': '370200',
  'dalian': '210200',
  '大连': '210200',
  'shenyang': '210100',
  '沈阳': '210100',
  'harbin': '230100',
  '哈尔滨': '230100',
  'changchun': '220100',
  '长春': '220100',
  'zhengzhou': '410100',
  '郑州': '410100',
  'jinan': '370100',
  '济南': '370100',
  'fuzhou': '350100',
  '福州': '350100',
  'hefei': '340100',
  '合肥': '340100',
  'nanchang': '360100',
  '南昌': '360100',
  'guiyang': '520100',
  '贵阳': '520100',
  'lanzhou': '620100',
  '兰州': '620100',
  'yinchuan': '640100',
  '银川': '640100',
  'xining': '630100',
  '西宁': '630100',
  'hohhot': '150100',
  '呼和浩特': '150100',
  'urumqi': '650100',
  '乌鲁木齐': '650100',
  'lasa': '540100',
  '拉萨': '540100',
  'nanning': '450100',
  '南宁': '450100',
  'haikou': '460100',
  '海口': '460100',
  'taipei': '710000',
  '台北': '710000',
  'hongkong': '810000',
  '香港': '810000',
  'macau': '820000',
  '澳门': '820000',
};

// 获取城市的adcode
function getCityAdcode(city: string): string {
  const lowerCity = city.toLowerCase();
  return cityAdcodes[lowerCity] || '110000'; // 默认北京
}

// 风力级别转换（高德返回"≤3"、"4-5"等格式）
function parseWindPower(power: string): number {
  const match = power.match(/(\d+)/);
  return match ? parseInt(match[1]) : 3;
}

async function fetchWeather(city: string): Promise<WeatherData> {
  if (!GAODE_API_KEY || GAODE_API_KEY === 'your_gaode_map_api_key_here') {
    throw new Error('请在 .env 文件中配置高德天气API Key (GAODE_MAP_API_KEY)');
  }

  const adcode = getCityAdcode(city);
  
  // 同时请求实况天气和预报天气
  const baseUrl = 'https://restapi.amap.com/v3/weather/weatherInfo';
  const liveUrl = `${baseUrl}?city=${adcode}&key=${GAODE_API_KEY}&extensions=base&output=JSON`;
  const forecastUrl = `${baseUrl}?city=${adcode}&key=${GAODE_API_KEY}&extensions=all&output=JSON`;
  
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    
    // 并发请求实况和预报
    const [liveResponse, forecastResponse] = await Promise.all([
      fetch(liveUrl, { signal: controller.signal }),
      fetch(forecastUrl, { signal: controller.signal }),
    ]);
    
    clearTimeout(timeout);
    
    if (!liveResponse.ok || !forecastResponse.ok) {
      throw new Error(`高德天气API请求失败`);
    }
    
    const liveData = await liveResponse.json() as any;
    const forecastData = await forecastResponse.json() as any;
    
    // 检查API返回状态
    if (liveData.status !== '1') {
      throw new Error(`高德天气API错误: ${liveData.info}`);
    }
    if (forecastData.status !== '1') {
      throw new Error(`高德天气API错误: ${forecastData.info}`);
    }
    
    // 解析实况天气
    const live = liveData.lives[0];
    
    // 解析预报天气
    const forecasts = forecastData.forecasts[0];
    const casts = forecasts.casts || [];
    
    // 构建weather数组（多日预报）
    const weatherArray = casts.map((cast: any) => ({
      date: cast.date,
      week: cast.week,
      maxtempC: cast.daytemp,
      mintempC: cast.nighttemp,
      dayweather: cast.dayweather,
      nightweather: cast.nightweather,
      daywind: cast.daywind,
      nightwind: cast.nightwind,
      daypower: cast.daypower,
      nightpower: cast.nightpower,
    }));
    
    const weatherData: WeatherData = {
      current_condition: [{
        temp_C: live.temperature,
        humidity: live.humidity,
        weatherDesc: [{ value: live.weather }],
        windspeedKmph: String(parseWindPower(live.windpower) * 5), // 转换为大致km/h
        FeelsLikeC: live.temperature, // 高德不提供体感温度，使用实际温度
        uvIndex: '0', // 高德不提供UV指数
        pressure: '1013', // 高德不提供气压
        visibility: '10', // 高德不提供能见度
        windDirection: live.winddirection,
      }],
      weather: weatherArray,
    };
    
    return weatherData;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`高德天气服务错误: ${error.message}`);
    }
    throw new Error('未知的天气服务错误');
  }
}

// 辅助函数：生成固定宽度的行，左右自动填充空格
function fixedLine(leftPart: string, rightPart = '', totalWidth = 31): string {
  const leftWidth = stringWidth(leftPart);
  const rightWidth = stringWidth(rightPart);
  const spaces = totalWidth - leftWidth - rightWidth;
  // 如果内容超出宽度，截断（可选）
  if (spaces < 0) {
    // 简单处理：截断左侧内容
    return `│${leftPart.slice(0, totalWidth - 2)}│`;
  }
  return `│${leftPart}${' '.repeat(spaces)}${rightPart}│`;
}

// 生成带左边框的行（右侧不留内容）
function leftLine(content: string, totalWidth = 31): string {
  const contentWidth = stringWidth(content);
  const spaces = totalWidth - contentWidth;
  if (spaces < 0) {
    // 截断内容以适应宽度
    return `│${content.slice(0, totalWidth - 2)}│`;
  }
  return `│${content}${' '.repeat(spaces)}│`;
}

function formatWeather(data: WeatherData, city: string, unit: string = 'metric', days: number = 3, advanced: boolean = false): string {
  const current = data.current_condition[0];
  
  const temp = current.temp_C;
  const humidity = current.humidity;
  const description = current.weatherDesc[0]?.value || '未知';
  const windSpeed = current.windspeedKmph;
  const windDirection = current.windDirection || '';

  // 单位转换函数
  const convertTemp = (celsius: number): number => {
    if (unit === 'imperial') {
      return Math.round((celsius * 9/5) + 32);
    }
    return celsius;
  };
  
  const convertWind = (kmh: number): number => {
    if (unit === 'imperial') {
      return Math.round(kmh * 0.621371);
    }
    return kmh;
  };
  
  const tempUnit = unit === 'imperial' ? '°F' : '°C';
  const windUnit = unit === 'imperial' ? 'mph' : 'km/h';
  
  // 温度颜色
  const tempColor = (t: number) => {
    const convertedTemp = convertTemp(t);
    const tempThreshold = unit === 'imperial' ? 86 : 30;
    const lowThreshold = unit === 'imperial' ? 41 : 5;
    return (convertedTemp > tempThreshold ? chalk.red : convertedTemp < lowThreshold ? chalk.blue : chalk.yellow)(`${convertedTemp}${tempUnit}`);
  };

  // 创建渐变色标题
  const titleGradient = Gradient(['cyan', 'blue']);
  const titleBox = boxen(titleGradient(' 🌤️  天气预报  🌤️ '), {
    padding: { left: 1, right: 1 },
    borderColor: 'cyan',
    borderStyle: 'double'
  });
  
  const lines: string[] = [];
  lines.push(titleBox);

  // 天气图标
  const weatherIcon = description.includes('晴') ? '☀️' :
                      description.includes('云') ? '☁️' :
                      description.includes('雨') ? '🌧️' :
                      description.includes('雪') ? '❄️' :
                      description.includes('雾') ? '🌫️' :
                      description.includes('雷') ? '⛈️' : '🌈';
  
  const convertedWindSpeed = convertWind(parseFloat(windSpeed));

  // 当前天气卡片
  const currentLines = [
    `${weatherIcon}  ${chalk.bold(description)}`,
    `🌡️ 温度: ${tempColor(parseInt(temp))}`,
    `💧 湿度: ${chalk.cyan(humidity)}%`,
    `🌬️ 风向: ${chalk.cyan(windDirection)}   风速: ${chalk.cyan(convertedWindSpeed)} ${windUnit}`
  ];
  const currentCard = boxen(currentLines.join('\n'), {
    padding: 1,
    borderColor: 'green',
    borderStyle: 'round',
    title: '实时天气',
    titleAlignment: 'center'
  });
  lines.push(currentCard);

  // 高级指标卡片（如果启用）- 显示风力信息
  if (advanced && data.weather.length > 0) {
    const todayWeather = data.weather[0];
    const advancedLines = [
      `🌅 白天: ${chalk.cyan(todayWeather.dayweather)}   🌇 夜间: ${chalk.cyan(todayWeather.nightweather)}`,
      `🌬️ 白天风力: ${chalk.cyan(todayWeather.daypower)}级   🌬️ 夜间风力: ${chalk.cyan(todayWeather.nightpower)}级`,
      `📅 更新时间: ${chalk.cyan(new Date().toLocaleString('zh-CN'))}`
    ];
    const advancedCard = boxen(advancedLines.join('\n'), {
      padding: 1,
      borderColor: 'yellow',
      borderStyle: 'round',
      title: '详细信息',
      titleAlignment: 'center'
    });
    lines.push(advancedCard);
  }

  // 多日预报表格
  if (data.weather && data.weather.length > 1) {
    const table = new Table({
      head: ['日期', '星期', '白天天气', '夜间天气', '温度范围'],
      colWidths: [12, 6, 10, 10, 18],
      style: { head: ['cyan'] }
    });
    const maxDays = Math.min(days, data.weather.length);
    for (let i = 0; i < maxDays; i++) {
      const dayWeather = data.weather[i];
      const dateStr = dayWeather.date.slice(5); // MM-DD格式
      const weekDay = ['日', '一', '二', '三', '四', '五', '六'][parseInt(dayWeather.week) - 1] || dayWeather.week;
      const maxTempC = parseInt(dayWeather.maxtempC) || 0;
      const minTempC = parseInt(dayWeather.mintempC) || 0;
      const displayMaxTemp = convertTemp(maxTempC);
      const displayMinTemp = convertTemp(minTempC);
      table.push([
        dateStr,
        `周${weekDay}`,
        dayWeather.dayweather,
        dayWeather.nightweather,
        chalk.yellow(`${displayMinTemp}${tempUnit} ~ ${displayMaxTemp}${tempUnit}`)
      ]);
    }
    lines.push(table.toString());
  }

  // 数据来源
  lines.push(chalk.gray('数据来源: 高德地图'));

  return lines.join('\n');
}

const program = new Command();

program
  .name('weather-cli')
  .description('CLI weather query tool')
  .version('1.0.0')
  .option('--unit <unit>', 'Unit system: imperial (°F, mph) or metric (°C, km/h)', 'metric')
  .option('--days <days>', 'Number of forecast days (1-5)', '3')
  .option('--advanced', 'Show advanced metrics (sunrise, sunset, pressure, etc.)', false);

program
  .argument('[city]', 'City name to query weather for')
  .action(async (city: string) => {
    const inputCity = city || 'Beijing';
    const options = program.opts();
    
    // 验证参数
    const unit = options.unit === 'imperial' ? 'imperial' : 'metric';
    const days = Math.min(5, Math.max(1, parseInt(options.days) || 3));
    const advanced = options.advanced;
    
    try {
      // 智能解析城市名称（支持中英文）
      const resolverSpinner = ora(`解析城市: ${inputCity}...`).start();
      const targetCity = await resolveCity(inputCity);
      
      if (targetCity !== inputCity) {
        resolverSpinner.succeed(`已解析为: ${targetCity}`);
      } else {
        resolverSpinner.succeed(`城市: ${targetCity}`);
      }
      
      const weatherSpinner = ora(`正在获取 ${targetCity} 天气数据...`).start();
      const weatherData = await fetchWeather(targetCity);
      weatherSpinner.succeed('天气数据获取成功');
      const formatted = formatWeather(weatherData, targetCity, unit, days, advanced);
      console.log('\n' + formatted);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          console.error(chalk.red('Error: Could not connect to weather service. Please check your internet connection.'));
        } else if (error.message.includes('404')) {
          console.error(chalk.red(`Error: City "${inputCity}" not found. Please check the spelling.`));
        } else {
          console.error(chalk.red(`Error: ${error.message}`));
        }
      } else {
        console.error(chalk.red('An unknown error occurred'));
      }
      process.exit(1);
    }
  });

program.parse();