import * as dotenv from 'dotenv';

dotenv.config();

const BAIDU_MAP_API_KEY = process.env.BAIDU_MAP_API_KEY || '';

// 返回类型
export interface ResolveResult {
  resolvedName: string;  // 解析后的城市名
  fromApi: boolean;      // 是否通过API解析
}

async function geocodeWithBaidu(city: string): Promise<string | null> {
  if (!BAIDU_MAP_API_KEY || BAIDU_MAP_API_KEY === 'your_baidu_map_api_key_here') {
    return null;
  }

  try {
    const url = `https://api.map.baidu.com/geocoding/v3/?address=${encodeURIComponent(city)}&output=json&ak=${BAIDU_MAP_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json() as any;
    
    if (data.status !== 0) return null;
    
    if (data.result) {
      const addressComponent = data.result.addressComponent || {};
      const cityName = addressComponent.city || 
                      data.result.formatted_address?.split(' ')[0] || 
                      null;
      return cityName;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * 智能解析城市名称，返回对象包含解析结果和来源
 */
export async function resolveCity(city: string): Promise<ResolveResult> {
  // 尝试通过百度API解析
  const resolved = await geocodeWithBaidu(city);
  
  if (resolved && resolved !== city) {
    return { resolvedName: resolved, fromApi: true };
  }
  
  return { resolvedName: city, fromApi: false };
}

/**
 * 批量解析城市名称
 */
export async function resolveCities(cities: string[]): Promise<ResolveResult[]> {
  return Promise.all(cities.map(city => resolveCity(city)));
}
