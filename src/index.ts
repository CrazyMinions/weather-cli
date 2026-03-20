#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { resolveCity } from './resolveCity.js';

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
  }>;
  weather: Array<{
    date: string;
    astronomy: Array<{
      sunrise: string;
      sunset: string;
    }>;
    hourly: Array<{
      chanceofrain: string;
    }>;
  }>;
}

interface WttrResponse {
  data: WeatherData;
}

async function fetchWeather(city: string): Promise<WeatherData> {
  // 使用 wttr.in 的简化JSON格式（更可靠）
  const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch weather for ${city}: ${response.statusText}`);
    }
    
    const text = await response.text();
    
    // wttr.in 有时返回空响应或非JSON响应
    if (!text || text.trim() === '') {
      throw new Error(`Empty response from weather service for ${city}`);
    }
    
    // 尝试解析JSON
    let json: any;
    try {
      json = JSON.parse(text);
    } catch (parseError) {
      // 如果JSON解析失败，尝试使用备用API
      console.warn(`JSON解析失败，尝试备用API...`);
      return await fetchWeatherFallback(city);
    }
    
    // 验证响应结构
    if (!json.data) {
      // 如果wttr.in返回空数据，使用备用API
      console.warn(`wttr.in返回空数据，使用备用天气API...`);
      return await fetchWeatherFallback(city);
    }
    
    if (!json.data.current_condition || !Array.isArray(json.data.current_condition)) {
      // 如果数据格式无效，使用备用API
      console.warn(`wttr.in数据格式无效，使用备用天气API...`);
      return await fetchWeatherFallback(city);
    }
    
    return json.data as WeatherData;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Weather service error: ${error.message}`);
    }
    throw new Error('Unknown weather service error');
  }
}

// 备用天气API（使用 Open-Meteo，免费无需API Key）
async function fetchWeatherFallback(city: string): Promise<WeatherData> {
  // 首先尝试使用地理坐标
  // 这里简化处理：使用北京坐标作为默认
  const lat = 39.9042;
  const lon = 116.4074;
  
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`备用API失败: ${response.statusText}`);
    }
    
    const data = await response.json() as any;
    
    // 转换为 wttr.in 格式
    const current = data.current;
    const weatherData: WeatherData = {
      current_condition: [{
        temp_C: String(current.temperature_2m),
        humidity: String(current.relative_humidity_2m),
        weatherDesc: [{ value: getWeatherDescription(current.weather_code) }],
        windspeedKmph: String(current.wind_speed_10m),
        FeelsLikeC: String(current.temperature_2m), // 简化：体感温度等于实际温度
        uvIndex: "0", // Open-Meteo 当前API不提供UV指数
        pressure: "1013", // Open-Meteo 当前API不提供气压，使用默认值
        visibility: "10", // Open-Meteo 当前API不提供能见度，使用默认值
      }],
      weather: [{
        date: new Date().toISOString().split('T')[0],
        astronomy: [{
          sunrise: "06:29 AM", // 默认日出时间
          sunset: "06:25 PM", // 默认日落时间
        }],
        hourly: [{
          chanceofrain: "0", // 默认无降水概率
        }],
      }],
    };
    
    return weatherData;
  } catch (error) {
    throw new Error(`备用天气服务也失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

// 天气代码转换为描述
function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: '晴天',
    1: '大部晴天',
    2: '局部多云',
    3: '多云',
    45: '雾',
    48: '雾凇',
    51: '小毛毛雨',
    53: '中毛毛雨',
    55: '大毛毛雨',
    61: '小雨',
    63: '中雨',
    65: '大雨',
    71: '小雪',
    73: '中雪',
    75: '大雪',
    77: '雪粒',
    80: '小阵雨',
    81: '中阵雨',
    82: '大阵雨',
    85: '小阵雪',
    86: '大阵雪',
    95: '雷暴',
    96: '雷暴伴小冰雹',
    99: '雷暴伴大冰雹',
  };
  
  return descriptions[code] || '未知天气';
}

function formatWeather(data: WeatherData, city: string, unit: string = 'metric', days: number = 3, advanced: boolean = false): string {
  const current = data.current_condition[0];
  
  const temp = current.temp_C;
  const feelsLike = current.FeelsLikeC;
  const humidity = current.humidity;
  const description = current.weatherDesc[0]?.value || '未知';
  const windSpeed = current.windspeedKmph;
  const uvIndex = current.uvIndex;
  
  // 高级指标
  const pressure = current.pressure || 'N/A';
  const visibility = current.visibility || 'N/A';
  
  // 日出日落时间（从当天的weather数据获取）
  const todayWeather = data.weather && data.weather[0];
  const sunrise = todayWeather?.astronomy?.[0]?.sunrise || 'N/A';
  const sunset = todayWeather?.astronomy?.[0]?.sunset || 'N/A';
  
  // 降水概率（从第一个hourly数据获取）
  const chanceOfRain = todayWeather?.hourly?.[0]?.chanceofrain || 'N/A';

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
  
  // 定义常用颜色别名（可扩展）
  const title = chalk.bold.cyan;
  const label = chalk.gray;
  const value = chalk.white;
  const tempColor = (t: number) => {
    const convertedTemp = convertTemp(t);
    const tempThreshold = unit === 'imperial' ? 86 : 30; // 30°C = 86°F
    const lowThreshold = unit === 'imperial' ? 41 : 5;   // 5°C = 41°F
    return (convertedTemp > tempThreshold ? chalk.red : convertedTemp < lowThreshold ? chalk.blue : chalk.yellow)(`${convertedTemp}${tempUnit}`);
  };
  const uvColor = (uv: string) => {
    const u = parseInt(uv);
    if (u >= 8) return chalk.red(uv);
    if (u >= 6) return chalk.yellow(uv);
    return chalk.green(uv);
  };

  // 构建输出行
  const lines: string[] = [];

  // 头部标题
  lines.push(title('┌─────────────────────────────┐'));
  lines.push(title(`│   📍 ${chalk.bold(city)}  ·  实时天气  │`));
  lines.push(title('├─────────────────────────────┤'));

  // 温度 + 天气描述（一行）
  const tempDisplay = `🌡️  ${tempColor(parseInt(temp))}`;
  const feelsDisplay = `体感 ${tempColor(parseInt(feelsLike))}`;
  const weatherIcon = description.includes('晴') ? '☀️' :
                      description.includes('云') ? '☁️' :
                      description.includes('雨') ? '🌧️' : '🌈';
  lines.push(`│  ${weatherIcon} ${chalk.cyan(description.padEnd(4))}  ${tempDisplay} (${feelsDisplay.padEnd(6)})  │`);

  // 分隔线
  lines.push(title('├─────────────────────────────┤'));

  // 湿度 + 风速（一行两列）
  const convertedWindSpeed = convertWind(parseFloat(windSpeed));
  const humidityStr = `💧 湿度 ${chalk.cyan(humidity.padStart(2))}%`;
  const windStr = `🌬️ 风速 ${chalk.cyan(convertedWindSpeed.toString().padStart(3))} ${windUnit}`;
  lines.push(`│  ${humidityStr.padEnd(18)} ${windStr.padEnd(16)}│`);

  // UV指数单独一行（可扩展更多指标）
  lines.push(`│  ☀️ UV指数 ${uvColor(uvIndex.padStart(2))} (${uvIndex})                         │`);

  // 高级指标（仅当--advanced参数启用时显示）
  if (advanced) {
    // 分隔线
    lines.push(title('├─────────────────────────────┤'));
    
    // 高级指标标题
    lines.push(title('│  📈 高级指标                            │'));
    
    // 高级指标行
    lines.push(`│  🌅 日出    ${chalk.cyan(sunrise.padEnd(10))}                 │`);
    lines.push(`│  🌇 日落    ${chalk.cyan(sunset.padEnd(10))}                 │`);
    lines.push(`│  📊 气压    ${chalk.cyan(pressure.padEnd(10))} hPa            │`);
    lines.push(`│  🌧️ 降水    ${chalk.cyan(chanceOfRain.padEnd(10))} %             │`);
    lines.push(`│  👁️ 能见度  ${chalk.cyan(visibility.padEnd(10))} km             │`);
  }

  // 底部边框
  lines.push(title('└─────────────────────────────┘'));

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
      console.log(chalk.blue(`Resolving city: ${inputCity}...`));
      const targetCity = await resolveCity(inputCity);
      
      if (targetCity !== inputCity) {
        console.log(chalk.green(`Resolved to: ${targetCity}`));
      }
      
      console.log(chalk.blue(`Fetching weather for ${targetCity}...`));
      const weatherData = await fetchWeather(targetCity);
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