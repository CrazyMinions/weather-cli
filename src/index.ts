#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { resolveCity } from './resolveCity.js';
import boxen from 'boxen';
import Gradient from 'gradient-string';
import Table from 'cli-table3';
import ora from 'ora';
import * as dotenv from 'dotenv';
import NodeCache from 'node-cache';


dotenv.config();

// 高德天气API Key
const GAODE_API_KEY = process.env.GAODE_MAP_API_KEY || '';

// 本地缓存（默认30分钟）
const weatherCache = new NodeCache({ stdTTL: 1800, checkperiod: 60 });

// ==================== 类型定义 ====================

// 高德天气API响应类型
interface GaodeLiveItem {
  city: string;
  adcode: string;
  province: string;
  weather: string;
  temperature: string;
  winddirection: string;
  windpower: string;
  humidity: string;
  reporttime: string;
}

interface GaodeLiveResponse {
  status: string;
  info: string;
  infocode: string;
  lives?: GaodeLiveItem[];
}

interface GaodeCastItem {
  date: string;
  week: string;
  dayweather: string;
  nightweather: string;
  daytemp: string;
  nighttemp: string;
  daywind: string;
  nightwind: string;
  daypower: string;
  nightpower: string;
}

interface GaodeForecastItem {
  city: string;
  adcode: string;
  province: string;
  reporttime: string;
  casts: GaodeCastItem[];
}

interface GaodeForecastResponse {
  status: string;
  info: string;
  infocode: string;
  forecasts?: GaodeForecastItem[];
}

// Open-Meteo API响应类型
interface OpenMeteoCurrent {
  temperature_2m: number;
  relative_humidity_2m: number;
  weather_code: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
}

interface OpenMeteoDaily {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  weather_code: number[];
  sunrise?: string[];
  sunset?: string[];
}

interface OpenMeteoHourly {
  time: string[];
  temperature_2m: number[];
  weather_code: number[];
  relative_humidity_2m: number[];
  wind_speed_10m: number[];
}

interface OpenMeteoResponse {
  current: OpenMeteoCurrent;
  daily: OpenMeteoDaily;
  hourly: OpenMeteoHourly;
}

// 空气质量API响应类型
interface AirQualityCurrent {
  european_aqi: number;
  pm10: number;
  pm2_5: number;
  carbon_monoxide: number;
  nitrogen_dioxide: number;
  sulphur_dioxide: number;
  ozone: number;
}

interface AirQualityResponse {
  current: AirQualityCurrent;
}

interface CurrentCondition {
  temp_C: string;
  humidity: string;
  weatherDesc: Array<{ value: string }>;
  windspeedKmph: string;
  FeelsLikeC: string;
  uvIndex: string;
  pressure: string;
  visibility: string;
  windDirection: string;
  reportTime: string;
  windLevel?: string; // 风力等级（如"3级"）
}

interface DailyForecast {
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
}

interface HourlyForecast {
  time: string;
  weather: string;
  temp: string;
  windDirection: string;
  windPower: string;
  humidity: string;
}

interface AirQuality {
  aqi: string;
  quality: string;
  pm25: string;
  pm10: string;
  so2: string;
  no2: string;
  co: string;
  o3: string;
}

interface WeatherWarning {
  title: string;
  type: string;
  level: string;
  content: string;
  publishTime: string;
}

interface WeatherData {
  current_condition: CurrentCondition[];
  weather: DailyForecast[];
  hourly?: HourlyForecast[];
  aqi?: AirQuality;
  warnings?: WeatherWarning[];
}

// ==================== 城市映射 ====================

const cityAdcodes: Record<string, string> = {
  // 中国城市
  'beijing': '110000', '北京': '110000',
  'shanghai': '310000', '上海': '310000',
  'guangzhou': '440100', '广州': '440100',
  'shenzhen': '440300', '深圳': '440300',
  'chengdu': '510100', '成都': '510100',
  'hangzhou': '330100', '杭州': '330100',
  'wuhan': '420100', '武汉': '420100',
  'xian': '610100', '西安': '610100',
  'nanjing': '320100', '南京': '320100',
  'tianjin': '120000', '天津': '120000',
  'chongqing': '500000', '重庆': '500000',
  'changsha': '430100', '长沙': '430100',
  'kunming': '530100', '昆明': '530100',
  'xiamen': '350200', '厦门': '350200',
  'qingdao': '370200', '青岛': '370200',
  'dalian': '210200', '大连': '210200',
  'shenyang': '210100', '沈阳': '210100',
  'harbin': '230100', '哈尔滨': '230100',
  'changchun': '220100', '长春': '220100',
  'zhengzhou': '410100', '郑州': '410100',
  'jinan': '370100', '济南': '370100',
  'fuzhou': '350100', '福州': '350100',
  'hefei': '340100', '合肥': '340100',
  'nanchang': '360100', '南昌': '360100',
  'guiyang': '520100', '贵阳': '520100',
  'lanzhou': '620100', '兰州': '620100',
  'yinchuan': '640100', '银川': '640100',
  'xining': '630100', '西宁': '630100',
  'hohhot': '150100', '呼和浩特': '150100',
  'urumqi': '650100', '乌鲁木齐': '650100',
  'lasa': '540100', '拉萨': '540100',
  'nanning': '450100', '南宁': '450100',
  'haikou': '460100', '海口': '460100',
  'taipei': '710000', '台北': '710000',
  // 'hongkong': '810000', '香港': '810000',  // 港澳使用国际城市API（高德不支持）
  // 'macau': '820000', '澳门': '820000',
  'suzhou': '320500', '苏州': '320500',
  'wuxi': '320200', '无锡': '320200',
  'ningbo': '330200', '宁波': '330200',
  'foshan': '440600', '佛山': '440600',
  'dongguan': '441900', '东莞': '441900',
  'heze': '371700', '菏泽': '371700',
  'taizhou': '321200', '泰州': '321200',
  'weifang': '370700', '潍坊': '370700',
  'yantai': '370600', '烟台': '370600',
  'lianyungang': '320700', '连云港': '320700',
  'nantong': '320600', '南通': '320600',
  'xuzhou': '320300', '徐州': '320300',
  'wenzhou': '330300', '温州': '330300',
  'zhuhai': '440400', '珠海': '440400',
  'zhongshan': '442000', '中山': '442000',
  'huizhou': '441300', '惠州': '441300',
  'jiangmen': '440700', '江门': '440700',
  'shaoguan': '440200', '韶关': '440200',
  'zhanjiang': '440800', '湛江': '440800',
  'maoming': '440900', '茂名': '440900',
  'qingyuan': '441800', '清远': '441800',
  'jixi': '230300', '鸡西': '230300',
  'mudanjiang': '231000', '牡丹江': '231000',
  'qitaihe': '230900', '七台河': '230900',
  'hegang': '230400', '鹤岗': '230400',
  'yichun': '230700', '伊春': '230700',
  'jiamusi': '230800', '佳木斯': '230800',
  'daqing': '230600', '大庆': '230600',
  'heihe': '231100', '黑河': '231100',
  'suihua': '231200', '绥化': '231200',
  'daxinganling': '232700', '大兴安岭': '232700',
  'baicheng': '220800', '白城': '220800',
  'liaoyuan': '220400', '辽源': '220400',
  'baishan': '220600', '白山': '220600',
  'yanbian': '222400', '延边': '222400',
  'tonghua': '220500', '通化': '220500',
  'benxi': '210500', '本溪': '210500',
  'fushun': '210400', '抚顺': '210400',
  'liaoyang': '211000', '辽阳': '211000',
  'anshan': '210300', '鞍山': '210300',
  'yingkou': '210800', '营口': '210800',
  'jinzhou': '210700', '锦州': '210700',
  'chaoyang': '211300', '朝阳': '211300',
  'huludao': '211400', '葫芦岛': '211400',
  'dandong': '210600', '丹东': '210600',
  'tieling': '211200', '铁岭': '211200',
  'chengde': '130800', '承德': '130800',
  'zhangjiakou': '130700', '张家口': '130700',
  'qinhuangdao': '130300', '秦皇岛': '130300',
  'tangshan': '130200', '唐山': '130200',
  'langfang': '131000', '廊坊': '131000',
  'baoding': '130600', '保定': '130600',
  'cangzhou': '130900', '沧州': '130900',
  'hengshui': '131100', '衡水': '131100',
  'xingtai': '130500', '邢台': '130500',
  'handan': '130400', '邯郸': '130400',
  'shuozhou': '140600', '朔州': '140600',
  'datong': '140200', '大同': '140200',
  'yangquan': '140300', '阳泉': '140300',
  'changzhi': '140400', '长治': '140400',
  'jincheng': '140500', '晋城': '140500',
  'linfen': '141000', '临汾': '141000',
  'lvliang': '141100', '吕梁': '141100',
  'jinzhong': '140700', '晋中': '140700',
  'yuncheng': '140800', '运城': '140800',
  'xinzhou': '140900', '忻州': '140900',
  'bayannur': '150800', '巴彦淖尔': '150800',
  'wuhai': '150300', '乌海': '150300',
  'tongliao': '150500', '通辽': '150500',
  'chifeng': '150400', '赤峰': '150400',
  'ordos': '150600', '鄂尔多斯': '150600',
  'hulunbuir': '150700', '呼伦贝尔': '150700',
  'xilingol': '152500', '锡林郭勒': '152500',
  'alxa': '152900', '阿拉善': '152900',
  'xingan': '152200', '兴安': '152200',
  'pingdingshan': '410400', '平顶山': '410400',
  'luoyang': '410300', '洛阳': '410300',
  'kaifeng': '410200', '开封': '410200',
  'anyang': '410500', '安阳': '410500',
  'xinxiang': '410700', '新乡': '410700',
  'jiaozuo': '410800', '焦作': '410800',
  'puyang': '410900', '濮阳': '410900',
  'xuchang': '411000', '许昌': '411000',
  'luohe': '411100', '漯河': '411100',
  'sanmenxia': '411200', '三门峡': '411200',
  'nanyang': '411300', '南阳': '411300',
  'shangqiu': '411400', '商丘': '411400',
  'xinyang': '411500', '信阳': '411500',
  'zhoukou': '411600', '周口': '411600',
  'zhumadian': '411700', '驻马店': '411700',
  'yibin': '511500', '宜宾': '511500',
  'neijiang': '511000', '内江': '511000',
  'ziyang': '512000', '资阳': '512000',
  'leshan': '511100', '乐山': '511100',
  'luzhou': '510500', '泸州': '510500',
  'dazhou': '511700', '达州': '511700',
  'nanchong': '511300', '南充': '511300',
  'mianyang': '510700', '绵阳': '510700',
  'deyang': '510600', '德阳': '510600',
  'yaan': '511800', '雅安': '511800',
  'meishan': '511400', '眉山': '511400',
  'guangan': '511600', '广安': '511600',
  'panzhihua': '510400', '攀枝花': '510400',
  'guangyuan': '510800', '广元': '510800',
  'suining': '510900', '遂宁': '510900',
  'abazhou': '513200', '阿坝': '513200',
  'garze': '513300', '甘孜': '513300',
  'liangshan': '513400', '凉山': '513400',
  'quzhou': '330800', '衢州': '330800',
  'lishui': '331100', '丽水': '331100',
  'jinhua': '330700', '金华': '330700',
  'huzhou': '330500', '湖州': '330500',
  'jiaxing': '330400', '嘉兴': '330400',
  'shaoxing': '330600', '绍兴': '330600',
  'taizhou_zj': '331000', '台州': '331000',
};

// 国际城市到坐标的映射（使用Open-Meteo）
const internationalCities: Record<string, { lat: number; lon: number; name: string }> = {
  'tokyo': { lat: 35.6762, lon: 139.6503, name: '东京' },
  '东京': { lat: 35.6762, lon: 139.6503, name: '东京' },
  'new york': { lat: 40.7128, lon: -74.0060, name: '纽约' },
  'newyork': { lat: 40.7128, lon: -74.0060, name: '纽约' },
  '纽约': { lat: 40.7128, lon: -74.0060, name: '纽约' },
  'london': { lat: 51.5074, lon: -0.1278, name: '伦敦' },
  '伦敦': { lat: 51.5074, lon: -0.1278, name: '伦敦' },
  'paris': { lat: 48.8566, lon: 2.3522, name: '巴黎' },
  '巴黎': { lat: 48.8566, lon: 2.3522, name: '巴黎' },
  'seoul': { lat: 37.5665, lon: 126.9780, name: '首尔' },
  '首尔': { lat: 37.5665, lon: 126.9780, name: '首尔' },
  'singapore': { lat: 1.3521, lon: 103.8198, name: '新加坡' },
  '新加坡': { lat: 1.3521, lon: 103.8198, name: '新加坡' },
  'sydney': { lat: -33.8688, lon: 151.2093, name: '悉尼' },
  '悉尼': { lat: -33.8688, lon: 151.2093, name: '悉尼' },
  'los angeles': { lat: 34.0522, lon: -118.2437, name: '洛杉矶' },
  'losangeles': { lat: 34.0522, lon: -118.2437, name: '洛杉矶' },
  '洛杉矶': { lat: 34.0522, lon: -118.2437, name: '洛杉矶' },
  'san francisco': { lat: 37.7749, lon: -122.4194, name: '旧金山' },
  'sanfrancisco': { lat: 37.7749, lon: -122.4194, name: '旧金山' },
  '旧金山': { lat: 37.7749, lon: -122.4194, name: '旧金山' },
  'berlin': { lat: 52.5200, lon: 13.4050, name: '柏林' },
  '柏林': { lat: 52.5200, lon: 13.4050, name: '柏林' },
  'moscow': { lat: 55.7558, lon: 37.6173, name: '莫斯科' },
  '莫斯科': { lat: 55.7558, lon: 37.6173, name: '莫斯科' },
  'dubai': { lat: 25.2048, lon: 55.2708, name: '迪拜' },
  '迪拜': { lat: 25.2048, lon: 55.2708, name: '迪拜' },
  'hong kong': { lat: 22.3193, lon: 114.1694, name: '香港' },
  'hongkong': { lat: 22.3193, lon: 114.1694, name: '香港' },
  '香港': { lat: 22.3193, lon: 114.1694, name: '香港' },
  'macau': { lat: 22.1987, lon: 113.5439, name: '澳门' },
  '澳门': { lat: 22.1987, lon: 113.5439, name: '澳门' },
  'bangkok': { lat: 13.7563, lon: 100.5018, name: '曼谷' },
  '曼谷': { lat: 13.7563, lon: 100.5018, name: '曼谷' },
  'mumbai': { lat: 19.0760, lon: 72.8777, name: '孟买' },
  '孟买': { lat: 19.0760, lon: 72.8777, name: '孟买' },
  'toronto': { lat: 43.6532, lon: -79.3832, name: '多伦多' },
  '多伦多': { lat: 43.6532, lon: -79.3832, name: '多伦多' },
};

// ==================== 城市坐标映射（用于AQI） ====================

const cityCoordinates: Record<string, { lat: number; lon: number }> = {
  '北京': { lat: 39.9042, lon: 116.4074 },
  '上海': { lat: 31.2304, lon: 121.4737 },
  '广州': { lat: 23.1291, lon: 113.2644 },
  '深圳': { lat: 22.5431, lon: 114.0579 },
  '成都': { lat: 30.5728, lon: 104.0668 },
  '杭州': { lat: 30.2741, lon: 120.1551 },
  '武汉': { lat: 30.5928, lon: 114.3055 },
  '西安': { lat: 34.3416, lon: 108.9398 },
  '南京': { lat: 32.0603, lon: 118.7969 },
  '天津': { lat: 39.3434, lon: 117.3616 },
  '重庆': { lat: 29.4316, lon: 106.9123 },
  '长沙': { lat: 28.2280, lon: 112.9388 },
  '昆明': { lat: 25.0389, lon: 102.7183 },
  '厦门': { lat: 24.4798, lon: 118.0894 },
  '青岛': { lat: 36.0671, lon: 120.3826 },
  '大连': { lat: 38.9140, lon: 121.6147 },
  '沈阳': { lat: 41.8057, lon: 123.4315 },
  '哈尔滨': { lat: 45.8038, lon: 126.5350 },
  '长春': { lat: 43.8171, lon: 125.3235 },
  '郑州': { lat: 34.7472, lon: 113.6249 },
  '济南': { lat: 36.6512, lon: 116.9972 },
  '福州': { lat: 26.0745, lon: 119.2965 },
  '合肥': { lat: 31.8206, lon: 117.2272 },
  '南昌': { lat: 28.6820, lon: 115.8579 },
  '贵阳': { lat: 26.6470, lon: 106.6302 },
  '兰州': { lat: 36.0611, lon: 103.8343 },
  '银川': { lat: 38.4872, lon: 106.2309 },
  '西宁': { lat: 36.6171, lon: 101.7782 },
  '呼和浩特': { lat: 40.8424, lon: 111.7490 },
  '乌鲁木齐': { lat: 43.8256, lon: 87.6168 },
  '拉萨': { lat: 29.6500, lon: 91.1000 },
  '南宁': { lat: 22.8170, lon: 108.3665 },
  '海口': { lat: 20.0174, lon: 110.3492 },
  '太原': { lat: 37.8706, lon: 112.5489 },
  '石家庄': { lat: 38.0428, lon: 114.5149 },
  '苏州': { lat: 31.2990, lon: 120.5853 },
  '无锡': { lat: 31.4912, lon: 120.3119 },
  '宁波': { lat: 29.8683, lon: 121.5440 },
  '佛山': { lat: 23.0218, lon: 113.1218 },
  '东莞': { lat: 23.0430, lon: 113.7633 },
  '珠海': { lat: 22.2710, lon: 113.5767 },
  '惠州': { lat: 23.1116, lon: 114.4164 },
  '温州': { lat: 27.9939, lon: 120.6993 },
  '徐州': { lat: 34.2044, lon: 117.2854 },
  '烟台': { lat: 37.4638, lon: 121.4479 },
  '潍坊': { lat: 36.7069, lon: 119.1618 },
  '绍兴': { lat: 30.0302, lon: 120.5802 },
  '台州': { lat: 28.6561, lon: 121.4208 },
  '嘉兴': { lat: 30.7523, lon: 120.7585 },
  '金华': { lat: 29.0790, lon: 119.6474 },
  '常州': { lat: 31.8106, lon: 119.9741 },
  '唐山': { lat: 39.6305, lon: 118.1802 },
  '保定': { lat: 38.8740, lon: 115.4646 },
  '临沂': { lat: 35.0653, lon: 118.3565 },
  '济宁': { lat: 35.4148, lon: 116.5871 },
  '洛阳': { lat: 34.6197, lon: 112.4540 },
  '泉州': { lat: 24.8741, lon: 118.6755 },
  '漳州': { lat: 24.5130, lon: 117.6473 },
  '襄阳': { lat: 32.0420, lon: 112.1448 },
  '宜昌': { lat: 30.6920, lon: 111.2865 },
  '株洲': { lat: 27.8343, lon: 113.1340 },
  '湘潭': { lat: 27.8297, lon: 112.9440 },
  '岳阳': { lat: 29.3570, lon: 113.1290 },
  '衡阳': { lat: 26.8935, lon: 112.5720 },
  '柳州': { lat: 24.3260, lon: 109.4280 },
  '桂林': { lat: 25.2742, lon: 110.2900 },
  '三亚': { lat: 18.2528, lon: 109.5120 },
  '大理': { lat: 25.6065, lon: 100.2676 },
  '丽江': { lat: 26.8721, lon: 100.2299 },
  '连云港': { lat: 34.5967, lon: 119.2219 },
};

// ==================== 工具函数 ====================

function getCityAdcode(city: string): string | null {
  const normalized = city.toLowerCase().replace(/\s+/g, '');
  return cityAdcodes[normalized] || null;
}

function getInternationalCity(city: string): { lat: number; lon: number; name: string } | null {
  const normalized = city.toLowerCase().replace(/\s+/g, '');
  return internationalCities[normalized] || null;
}

function getCityCoords(city: string): { lat: number; lon: number } | null {
  // 先检查国内城市
  if (cityCoordinates[city]) {
    return cityCoordinates[city];
  }
  // 检查国际城市
  const intl = getInternationalCity(city);
  if (intl) {
    return { lat: intl.lat, lon: intl.lon };
  }
  return null;
}

async function getCityAQI(city: string): Promise<AirQuality | undefined> {
  const coords = getCityCoords(city);
  if (coords) {
    const aqi = await fetchAirQuality(coords.lat, coords.lon);
    return aqi || undefined;
  }
  return undefined;
}

function parseWindPower(power: string): string {
  const level = power.match(/(\d+)/)?.[1] || '0';
  return `${level}级`;
}

// 错误消息本地化函数
function localizeErrorMessage(errorMsg: string): string {
  // 高德API特定错误信息检测
  // 先检查是否包含高德API的特定错误信息
  if (errorMsg.includes('高德天气API错误:')) {
    const apiError = errorMsg.replace('高德天气API错误:', '').trim();
    
    // 高德API常见错误信息映射
    const gaodeErrors: Record<string, string> = {
      'INVALID_USER_KEY': 'API密钥无效或格式不正确',
      'INSUFFICIENT_PRIVILEGES': 'API权限不足',
      'OVER_QUOTA': '请求次数超限（API配额已用尽）',
      'INVALID_PARAMS': '参数错误',
      'SERVICE_NOT_AVAILABLE': '服务暂时不可用',
      'DAILY_QUERY_OVER_LIMIT': '日调用量超限（今日次数已用完）',
      'ACCESS_TOO_FREQUENT': '访问频率超限（请稍后再试）',
      'INVALID_USER_IP': 'IP白名单验证失败',
      'INVALID_USER_SIGNATURE': '数字签名验证失败',
      '逾期的用户': '用户账户已过期',
      '未知的用户': '用户账户不存在',
      '请求超时': 'API请求超时',
    };

    for (const [key, message] of Object.entries(gaodeErrors)) {
      if (apiError.includes(key) || apiError.toLowerCase().includes(key.toLowerCase())) {
        return `高德天气API错误: ${message}`;
      }
    }

    // 尝试从info字段提取更友好的错误信息
    if (apiError.includes('超过每日') || apiError.includes('配额') || apiError.includes('次数')) {
      return '高德天气API错误: API调用配额可能已用尽，建议等待次日重置或升级API套餐';
    }
  }

  const translations: Record<string, string> = {
    // 网络错误
    'Failed to fetch': '无法连接到天气服务，请检查网络连接',
    'ECONNREFUSED': '网络连接被拒绝',
    'ECONNRESET': '网络连接被重置',
    'ETIMEDOUT': '网络连接超时',
    'timeout': '请求超时',
    // API错误
    'Invalid API key': 'API密钥无效',
    'Quota exceeded': 'API配额已用尽',
    'Invalid parameters': '参数无效',
    'Service unavailable': '服务暂时不可用',
    'Internal server error': '服务器内部错误',
    // 其他常见错误
    'ENOTFOUND': '域名解析失败',
    'Unexpected token': '服务器返回数据格式错误',
    'SyntaxError': '数据解析错误',
    'TypeError': '类型错误',
  };

  for (const [en, zh] of Object.entries(translations)) {
    if (errorMsg.toLowerCase().includes(en.toLowerCase())) {
      return zh;
    }
  }

  // 如果没有匹配的翻译，返回原错误消息（可能是中文）
  return errorMsg;
}

// 带超时的fetch辅助函数
async function fetchWithTimeout(url: string, timeoutMs: number = 10000, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

// 天气图标映射
function getWeatherIcon(description: string): string {
  if (description.includes('晴')) return '☀️';
  if (description.includes('云') || description.includes('阴')) return '☁️';
  if (description.includes('雨')) return '🌧️';
  if (description.includes('雪')) return '❄️';
  if (description.includes('雾') || description.includes('霾')) return '🌫️';
  if (description.includes('雷')) return '⛈️';
  if (description.includes('风')) return '💨';
  return '🌈';
}

// 天气描述中文转英文（用于国际城市）
function translateWeather(desc: string): string {
  const translations: Record<string, string> = {
    '晴': 'Clear',
    '多云': 'Cloudy',
    '阴': 'Overcast',
    '小雨': 'Light Rain',
    '中雨': 'Moderate Rain',
    '大雨': 'Heavy Rain',
    '小雪': 'Light Snow',
    '中雪': 'Moderate Snow',
    '大雪': 'Heavy Snow',
    '雾': 'Fog',
    '霾': 'Haze',
    '雷阵雨': 'Thunderstorm',
  };
  return translations[desc] || desc;
}

// ==================== API函数 ====================

async function fetchGaodeWeather(city: string): Promise<WeatherData> {
  if (!GAODE_API_KEY || GAODE_API_KEY === 'your_gaode_map_api_key_here') {
    throw new Error('请在 .env 文件中配置高德天气API Key (GAODE_MAP_API_KEY)');
  }

  const adcode = getCityAdcode(city);
  if (adcode === null) {
    throw new Error(`未知城市: ${city}`);
  }
  const baseUrl = 'https://restapi.amap.com/v3/weather/weatherInfo';
  
  
  
  try {
    // 并发请求，每个请求有独立的超时
    const [liveResponse, forecastResponse] = await Promise.allSettled([
      fetchWithTimeout(`${baseUrl}?city=${adcode}&key=${GAODE_API_KEY}&extensions=base&output=JSON`, 10000),
      fetchWithTimeout(`${baseUrl}?city=${adcode}&key=${GAODE_API_KEY}&extensions=all&output=JSON`, 10000),
    ]);

    // 检查这两个请求的结果
    let liveData: GaodeLiveResponse | null = null;
    let forecastData: GaodeForecastResponse | null = null;
    let hasError = false;

    if (liveResponse.status === 'fulfilled' && liveResponse.value.ok) {
      liveData = await liveResponse.value.json() as GaodeLiveResponse;
    } else {
      console.error(chalk.yellow(`⚠️  实时天气请求失败: ${liveResponse.status}`));
      if (liveResponse.status === 'rejected') {
        console.error(chalk.yellow(`  错误: ${liveResponse.reason}`));
      } else if (liveResponse.status === 'fulfilled' && !liveResponse.value.ok) {
        console.error(chalk.yellow(`  状态码: ${liveResponse.value.status}`));
      }
      hasError = true;
    }

    if (forecastResponse.status === 'fulfilled' && forecastResponse.value.ok) {
      forecastData = await forecastResponse.value.json() as GaodeForecastResponse;
    } else {
      console.error(chalk.yellow(`⚠️  天气预报请求失败: ${forecastResponse.status}`));
      if (forecastResponse.status === 'rejected') {
        console.error(chalk.yellow(`  错误: ${forecastResponse.reason}`));
      } else if (forecastResponse.status === 'fulfilled' && !forecastResponse.value.ok) {
        console.error(chalk.yellow(`  状态码: ${forecastResponse.value.status}`));
      }
      hasError = true;
    }

    if (hasError) {
      // 如果两个请求都失败，抛出错误
      if (!liveData && !forecastData) {
        throw new Error('高德天气API请求失败: 实时和预报数据均无法获取');
      }
      // 如果只有一个失败，继续处理可用的数据
      console.error(chalk.yellow('⚠️  部分数据获取失败，继续使用可用数据'));
    }

    // 检查API返回的状态码
    if (liveData && liveData.status !== '1') {
      console.error(chalk.red(`🚨 高德API错误（实时）: ${liveData.info}`));
      throw new Error(`高德天气API错误: ${liveData.info}`);
    }
    if (forecastData && forecastData.status !== '1') {
      console.error(chalk.red(`🚨 高德API错误（预报）: ${forecastData.info}`));
      throw new Error(`高德天气API错误: ${forecastData.info}`);
    }

    // 如果没有数据，抛出错误
    if (!liveData || !forecastData) {
      throw new Error('高德天气API返回数据不完整');
    }
    
    const live = liveData.lives![0];
    const forecasts = forecastData.forecasts![0];
    const casts = forecasts.casts || [];
    
    const weatherArray: DailyForecast[] = casts.map((cast: GaodeCastItem) => ({
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
    
    // 解析风力等级并转换为大致风速
    const windLevel = parseWindPower(live.windpower);
    const windNum = parseInt(live.windpower?.match(/(\d+)/)?.[1] || '3');
    const windSpeedKmh = String(windNum * 5); // 风力等级 * 5 ≈ km/h
    
    return {
      current_condition: [{
        temp_C: live.temperature,
        humidity: live.humidity,
        weatherDesc: [{ value: live.weather }],
        windspeedKmph: windSpeedKmh,
        FeelsLikeC: live.temperature,
        uvIndex: '0',
        pressure: '1013',
        visibility: '10',
        windDirection: live.winddirection,
        reportTime: live.reporttime,
        windLevel: windLevel, // 风力等级（如"3级"）
      }],
      weather: weatherArray,
    };
  } catch (error) {
    if (error instanceof Error) {
      const localizedMsg = localizeErrorMessage(error.message);
      throw new Error(`高德天气服务错误: ${localizedMsg}`);
    }
    throw new Error('未知的天气服务错误');
  }
}

async function fetchOpenMeteoWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m&daily=temperature_2m_max,temperature_2m_min,weather_code&hourly=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&timezone=auto&forecast_days=5`;
  
  try {
    const response = await fetchWithTimeout(url, 10000);
    
    if (!response.ok) throw new Error('Open-Meteo API请求失败');
    
    const data = await response.json() as OpenMeteoResponse;
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;
    
    const weatherDescriptions: Record<number, string> = {
      0: '晴', 1: '晴间多云', 2: '多云', 3: '阴',
      45: '雾', 48: '雾凇',
      51: '小毛毛雨', 53: '毛毛雨', 55: '大毛毛雨',
      61: '小雨', 63: '中雨', 65: '大雨',
      71: '小雪', 73: '中雪', 75: '大雪', 77: '雪粒',
      80: '小阵雨', 81: '阵雨', 82: '大阵雨',
      85: '小阵雪', 86: '大阵雪',
      95: '雷暴', 96: '雷暴伴冰雹', 99: '强雷暴',
    };
    
    const weatherArray: DailyForecast[] = [];
    for (let i = 0; i < daily.time.length; i++) {
      const date = new Date(daily.time[i]);
      const weekDay = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
      weatherArray.push({
        date: daily.time[i],
        week: String(date.getDay() + 1),
        maxtempC: String(Math.round(daily.temperature_2m_max[i])),
        mintempC: String(Math.round(daily.temperature_2m_min[i])),
        dayweather: weatherDescriptions[daily.weather_code[i]] || '未知',
        nightweather: weatherDescriptions[daily.weather_code[i]] || '未知',
        daywind: '',
        nightwind: '',
        daypower: '',
        nightpower: '',
      });
    }
    
    // 构建24小时预报
    const hourlyArray: HourlyForecast[] = [];
    const currentHour = new Date().getHours();
    for (let i = currentHour; i < Math.min(currentHour + 24, hourly.time.length); i++) {
      const time = new Date(hourly.time[i]);
      hourlyArray.push({
        time: `${String(time.getHours()).padStart(2, '0')}:00`,
        weather: weatherDescriptions[hourly.weather_code[i]] || '未知',
        temp: String(Math.round(hourly.temperature_2m[i])),
        windDirection: '',
        windPower: '',
        humidity: String(hourly.relative_humidity_2m[i]),
      });
    }
    
    const windDegrees = current.wind_direction_10m || 0;
    const windDirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
    const windDir = windDirs[Math.round(windDegrees / 45) % 8];
    
    return {
      current_condition: [{
        temp_C: String(Math.round(current.temperature_2m)),
        humidity: String(current.relative_humidity_2m),
        weatherDesc: [{ value: weatherDescriptions[current.weather_code] || '未知' }],
        windspeedKmph: String(Math.round(current.wind_speed_10m)),
        FeelsLikeC: String(Math.round(current.temperature_2m)),
        uvIndex: '0',
        pressure: '1013',
        visibility: '10',
        windDirection: windDir,
        reportTime: new Date().toISOString(),
      }],
      weather: weatherArray,
      hourly: hourlyArray,
    };
  } catch (error) {
    if (error instanceof Error) {
      const localizedMsg = localizeErrorMessage(error.message);
      throw new Error(`Open-Meteo服务错误: ${localizedMsg}`);
    }
    throw new Error('未知的天气服务错误');
  }
}

// 生成统一的缓存键
function getCacheKey(city: string): string {
  // 国内城市用adcode
  const adcode = cityAdcodes[city.toLowerCase().replace(/\s+/g, '')];
  if (adcode) {
    return `weather_${adcode}`;
  }
  
  // 国际城市用坐标
  const intl = getInternationalCity(city);
  if (intl) {
    return `weather_${intl.lat.toFixed(2)}_${intl.lon.toFixed(2)}`;
  }
  
  // 兜底：标准化城市名
  return `weather_${city.toLowerCase().replace(/\s+/g, '')}`;
}

async function fetchWeather(city: string, useCache: boolean = true): Promise<WeatherData> {
  // 检查缓存
  const cacheKey = getCacheKey(city);
  if (useCache) {
    const cached = weatherCache.get<WeatherData>(cacheKey);
    if (cached) {
      return cached;
    }
  }
  
  let data: WeatherData;
  
  // 先检查国内城市（根据6.txt建议#1：优先使用高德API）
  const adcode = getCityAdcode(city);
  if (adcode !== null) {
    data = await fetchGaodeWeather(city);
  } else {
    // 检查国际城市
    const intlCity = getInternationalCity(city);
    if (intlCity) {
      data = await fetchOpenMeteoWeather(intlCity.lat, intlCity.lon);
    } else {
      throw new Error(`未知城市: ${city}`);
    }
  }
  
  // 存入缓存
  weatherCache.set(cacheKey, data);
  
  return data;
}

// 获取空气质量（使用Open-Meteo空气质量API）
async function fetchAirQuality(lat: number, lon: number): Promise<AirQuality | null> {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`;
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json() as AirQualityResponse;
    const current = data.current;
    
    const aqi = current.european_aqi || 0;
    let quality = '优';
    if (aqi > 50) quality = '良';
    if (aqi > 100) quality = '轻度污染';
    if (aqi > 150) quality = '中度污染';
    if (aqi > 200) quality = '重度污染';
    if (aqi > 300) quality = '严重污染';
    
    return {
      aqi: String(aqi),
      quality,
      pm25: String(Math.round(current.pm2_5 || 0)),
      pm10: String(Math.round(current.pm10 || 0)),
      so2: String(Math.round(current.sulphur_dioxide || 0)),
      no2: String(Math.round(current.nitrogen_dioxide || 0)),
      co: String((current.carbon_monoxide || 0).toFixed(1)),
      o3: String(Math.round(current.ozone || 0)),
    };
  } catch {
    return null;
  }
}

// ==================== 格式化函数 ====================

function formatWeather(data: WeatherData, city: string, options: {
  unit: string;
  days: number;
  advanced: boolean;
  hourly: boolean;
  aqi: boolean;
  json: boolean;
  wallpaper: boolean;
}): string {
  const { unit, days, advanced, hourly, aqi, json, wallpaper } = options;
  
  const current = data.current_condition[0];
  const temp = parseInt(current.temp_C);
  const humidity = current.humidity;
  const description = current.weatherDesc[0]?.value || '未知';
  const windSpeed = current.windspeedKmph;
  const windDirection = current.windDirection || '';
  
  // JSON输出
  if (json) {
    return JSON.stringify({
      city,
      current: {
        temperature: temp,
        humidity: parseInt(humidity),
        weather: description,
        windSpeed: parseInt(windSpeed),
        windDirection,
        reportTime: current.reportTime,
      },
      forecast: data.weather.slice(0, days).map(d => ({
        date: d.date,
        dayWeather: d.dayweather,
        nightWeather: d.nightweather,
        maxTemp: parseInt(d.maxtempC),
        minTemp: parseInt(d.mintempC),
      })),
      hourly: data.hourly,
    }, null, 2);
  }
  
  // 壁纸模式
  if (wallpaper) {
    return formatWallpaper(data, city, unit);
  }
  
  // 单位转换
  const convertTemp = (c: number) => unit === 'imperial' ? Math.round((c * 9/5) + 32) : c;
  const convertWind = (k: number) => unit === 'imperial' ? Math.round(k * 0.621371) : k;
  const tempUnit = unit === 'imperial' ? '°F' : '°C';
  const windUnit = unit === 'imperial' ? 'mph' : 'km/h';
  
  const tempColor = (t: number) => {
    const ct = convertTemp(t);
    if (ct > (unit === 'imperial' ? 86 : 30)) return chalk.red(`${ct}${tempUnit}`);
    if (ct < (unit === 'imperial' ? 41 : 5)) return chalk.blue(`${ct}${tempUnit}`);
    return chalk.yellow(`${ct}${tempUnit}`);
  };
  
  const lines: string[] = [];
  
  // 标题
  const titleGradient = Gradient(['cyan', 'blue']);
  lines.push(boxen(titleGradient(` 🌤️  ${city} 天气预报  🌤️ `), {
    padding: { left: 1, right: 1 },
    borderColor: 'cyan',
    borderStyle: 'double',
  }));
  
  // 当前天气卡片
  const icon = getWeatherIcon(description);
  const windLevel = current.windLevel || `${Math.round(parseInt(windSpeed) / 5)}级`;
  const currentCard = boxen([
    `${icon}  ${chalk.bold(description)}`,
    `🌡️ 温度: ${tempColor(temp)}`,
    `💧 湿度: ${chalk.cyan(humidity)}%`,
    `🌬️ ${windDirection}风  ${chalk.cyan(windLevel)}`,
  ].join('\n'), {
    padding: 1,
    borderColor: 'green',
    borderStyle: 'round',
    title: '实时天气',
    titleAlignment: 'center',
  });
  lines.push(currentCard);
  
  // 高级信息
  if (advanced && data.weather.length > 0) {
    const today = data.weather[0];
    const advCard = boxen([
      `🌅 白天: ${chalk.cyan(today.dayweather)}  🌇 夜间: ${chalk.cyan(today.nightweather)}`,
      `🌬️ 白天风力: ${chalk.cyan(today.daypower || 'N/A')}级  夜间: ${chalk.cyan(today.nightpower || 'N/A')}级`,
      `📅 更新: ${chalk.gray(current.reportTime?.slice(0, 16) || 'N/A')}`,
    ].join('\n'), {
      padding: 1,
      borderColor: 'yellow',
      borderStyle: 'round',
      title: '详细信息',
      titleAlignment: 'center',
    });
    lines.push(advCard);
  }
  
  // 空气质量
  if (aqi && data.aqi) {
    const aqiColor = parseInt(data.aqi.aqi) <= 50 ? chalk.green :
                     parseInt(data.aqi.aqi) <= 100 ? chalk.yellow :
                     parseInt(data.aqi.aqi) <= 150 ? chalk.hex('#FFA500') : chalk.red;
    const aqiCard = boxen([
      `🏭 AQI: ${aqiColor(data.aqi.aqi)} (${data.aqi.quality})`,
      ` PM2.5: ${chalk.cyan(data.aqi.pm25)}  PM10: ${chalk.cyan(data.aqi.pm10)}`,
      ` NO₂: ${chalk.cyan(data.aqi.no2)}  O₃: ${chalk.cyan(data.aqi.o3)}`,
    ].join('\n'), {
      padding: 1,
      borderColor: 'magenta',
      borderStyle: 'round',
      title: '空气质量',
      titleAlignment: 'center',
    });
    lines.push(aqiCard);
  }
  
  // 24小时预报
  if (hourly && data.hourly && data.hourly.length > 0) {
    lines.push(chalk.bold.cyan('\n📊 24小时预报:'));
    const hourlyTable = new Table({
      head: ['时间', '天气', '温度', '湿度'],
      colWidths: [8, 10, 8, 8],
      style: { head: ['cyan'] },
    });
    
    data.hourly.slice(0, 12).forEach((h: HourlyForecast) => {
      hourlyTable.push([
        h.time,
        h.weather,
        `${convertTemp(parseInt(h.temp))}${tempUnit}`,
        `${h.humidity}%`,
      ]);
    });
    lines.push(hourlyTable.toString());
  }
  
  // 多日预报
  if (data.weather && data.weather.length > 1) {
    const table = new Table({
      head: ['日期', '星期', '白天', '夜间', '温度范围'],
      colWidths: [12, 6, 10, 10, 18],
      style: { head: ['cyan'] },
    });
    
    const maxDays = Math.min(days, data.weather.length);
    for (let i = 0; i < maxDays; i++) {
      const d = data.weather[i];
      const dateStr = d.date.slice(5);
      const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
      const week = weekDays[(parseInt(d.week) - 1) % 7] || d.week;
      
      table.push([
        dateStr,
        `周${week}`,
        d.dayweather,
        d.nightweather,
        chalk.yellow(`${convertTemp(parseInt(d.mintempC))}${tempUnit} ~ ${convertTemp(parseInt(d.maxtempC))}${tempUnit}`),
      ]);
    }
    lines.push(table.toString());
  }
  
  // 数据来源
  const intlCity = getInternationalCity(city);
  lines.push(chalk.gray(intlCity ? '数据来源: Open-Meteo' : '数据来源: 高德地图'));
  
  return lines.join('\n');
}

function formatWallpaper(data: WeatherData, city: string, unit: string): string {
  const current = data.current_condition[0];
  const temp = parseInt(current.temp_C);
  const description = current.weatherDesc[0]?.value || '未知';
  
  const tempUnit = unit === 'imperial' ? '°F' : '°C';
  const displayTemp = unit === 'imperial' ? Math.round((temp * 9/5) + 32) : temp;
  
  // 构建显示内容
  const lines = [
    chalk.cyan.bold(city),
    '',
    chalk.whiteBright.bold(`${displayTemp}${tempUnit}`),
    chalk.white(description),
    '',
    chalk.gray(`湿度: ${current.humidity}%  风向: ${current.windDirection}风`)
  ];
  
  const content = lines.join('\n');
  
  return boxen(content, {
    padding: 1,
    margin: 0,
    borderStyle: 'round',
    borderColor: 'cyan',
    align: 'center',
    title: '天气信息',
    titleAlignment: 'center',
    backgroundColor: '#1a1a1a'
  });
}

// ==================== 主程序 ====================

const program = new Command();

program
  .name('weather')
  .description('🌤️ 美化版天气查询CLI工具 - 支持高德天气API')
  .version('2.0.0')
  .option('-u, --unit <unit>', '温度单位: metric(°C) 或 imperial(°F)', 'metric')
  .option('-d, --days <days>', '预报天数 (1-5)', '3')
  .option('-a, --advanced', '显示详细信息', false)
  .option('--hourly', '显示24小时预报', false)
  .option('--aqi', '显示空气质量', false)
  .option('-j, --json', 'JSON格式输出', false)
  .option('-w, --wallpaper', '壁纸风格输出', false)
  .option('--no-cache', '禁用缓存', false);

program
  .argument('[city]', '城市名称')
  .action(async (city: string) => {
    const inputCity = city || '北京';
    const opts = program.opts();
    
    const options = {
      unit: opts.unit === 'imperial' ? 'imperial' : 'metric',
      days: Math.min(5, Math.max(1, parseInt(opts.days) || 3)),
      advanced: opts.advanced,
      hourly: opts.hourly,
      aqi: opts.aqi,
      json: opts.json,
      wallpaper: opts.wallpaper,
      cache: opts.cache !== false,
    };
    
    try {
      // 解析城市
      if (!options.json) {
        const resolverSpinner = ora(`解析城市: ${inputCity}...`).start();
        const resolveResult = await resolveCity(inputCity);
        const targetCity = resolveResult.resolvedName;
        
        if (resolveResult.fromApi) {
          resolverSpinner.succeed(`已解析: ${inputCity} → ${targetCity}`);
        } else {
          resolverSpinner.succeed(`城市: ${targetCity}`);
        }
        
        const weatherSpinner = ora(`正在获取 ${targetCity} 天气数据...`).start();
        const weatherData = await fetchWeather(targetCity, options.cache);
        
        // 获取空气质量
        if (options.aqi) {
          weatherData.aqi = await getCityAQI(targetCity);
          if (!weatherData.aqi) {
            console.log(chalk.yellow('⚠️  该城市的空气质量数据暂时不可用'));
          }
        }
        
        weatherSpinner.succeed('天气数据获取成功');
        
        const formatted = formatWeather(weatherData, targetCity, options);
        console.log('\n' + formatted);
      } else {
        // JSON模式不显示spinner，不输出日志
        const resolveResult = await resolveCity(inputCity);
        const targetCity = resolveResult.resolvedName;
        const weatherData = await fetchWeather(targetCity, options.cache);
        
        if (options.aqi) {
          weatherData.aqi = await getCityAQI(targetCity);
          // JSON模式下不输出警告，但可以在返回对象中添加字段
        }
        
        const formatted = formatWeather(weatherData, targetCity, options);
        console.log(formatted);
      }
    } catch (error) {
      if (error instanceof Error) {
        const localizedMsg = localizeErrorMessage(error.message);
        console.error(chalk.red(`❌ ${localizedMsg}`));
      } else {
        console.error(chalk.red('❌ 发生未知错误'));
      }
      process.exit(1);
    }
  });

// 仅在直接执行时才运行CLI
function isMainModule(): boolean {
  // 简化的检查：只要不是在测试环境或作为模块导入，都认为是主模块
  // 实际检查：查看是否有城市参数或其他CLI选项
  const hasCliArgs = process.argv.length > 2;
  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID;
  
  if (isTestEnv) {
    return false;
  }
  
  // 如果有CLI参数，就认为是直接执行
  return hasCliArgs;
}

if (isMainModule()) {
  program.parse();
}

// ==================== 导出供测试使用的函数 ====================
export {
  parseWindPower,
  localizeErrorMessage,
  getCityAdcode,
  getInternationalCity,
};

// ==================== 导出类型定义 ====================
export type {
  DailyForecast,
  HourlyForecast,
  CurrentCondition,
  WeatherData,
  AirQuality,
};
