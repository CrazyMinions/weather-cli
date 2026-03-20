import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 百度地图API配置
const BAIDU_MAP_API_KEY = process.env.BAIDU_MAP_API_KEY || '';

/**
 * 使用百度地图地理编码API解析城市名称
 * @param city - 用户输入的城市名称
 * @returns 解析结果数组
 */
async function geocodeWithBaidu(city: string): Promise<Array<{
  cityName: string;
  country: string;
  province: string;
  formattedAddress: string;
}> | null> {
  if (!BAIDU_MAP_API_KEY || BAIDU_MAP_API_KEY === 'your_baidu_map_api_key_here') {
    return null;
  }

  try {
    // 百度地图地理编码API
    const url = `https://api.map.baidu.com/geocoding/v3/?address=${encodeURIComponent(city)}&output=json&ak=${BAIDU_MAP_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json() as any;
    
    // 检查API返回状态
    if (data.status !== 0) {
      // 状态240表示APP服务被禁用
      if (data.status === 240) {
        throw new Error(`百度地图API服务被禁用。请在百度地图开放平台启用"地理编码"服务。错误: ${data.message}`);
      }
      throw new Error(`百度地图API错误: ${data.message || '未知错误'} (状态码: ${data.status})`);
    }
    
    // 解析结果
    const results = [];
    if (data.result) {
      const result = data.result;
      const addressComponent = result.addressComponent || {};
      
      // 尝试从不同字段获取城市名
      const cityName = addressComponent.city || 
                      result.formatted_address?.split(' ')[0] || 
                      city;
      
      results.push({
        cityName: cityName,
        country: 'China', // 百度地图主要返回中国地址
        province: addressComponent.province || '',
        formattedAddress: result.formatted_address || city
      });
    }
    
    return results.length > 0 ? results : null;
  } catch (error) {
    console.warn(`百度地图API调用失败: ${error instanceof Error ? error.message : '未知错误'}`);
    return null;
  }
}

/**
 * 智能解析城市名称，支持中英文混合输入
 * @param city - 用户输入的城市名称（可以是中文、英文或混合）
 * @returns 标准化的英文城市名（带国家代码，如 "Beijing, China"）
 */
export async function resolveCity(city: string): Promise<string> {
  try {
    // 如果没有配置API key，直接返回原始输入
    if (!BAIDU_MAP_API_KEY || BAIDU_MAP_API_KEY === 'your_baidu_map_api_key_here') {
      console.warn('⚠️ 百度地图API Key未配置，使用原始输入');
      return city;
    }

    // 使用百度地图API解析城市
    const results = await geocodeWithBaidu(city);
    
    // 如果有结果，返回第一个匹配的城市名
    if (results && results.length > 0) {
      const result = results[0];
      
      // 返回解析后的城市名（如果成功解析）
      if (result.cityName && result.cityName !== city) {
        console.log(`✅ 城市解析成功: ${city} → ${result.cityName}`);
        // 返回解析后的城市名
        return result.cityName;
      }
    }
    
    // 如果没有结果，返回原始输入
    return city;
  } catch (error) {
    // 发生错误时回退到原始输入
    console.warn(`⚠️ 城市解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    return city;
  }
}

/**
 * 批量解析城市名称
 * @param cities - 城市名称数组
 * @returns 标准化的城市名称数组
 */
export async function resolveCities(cities: string[]): Promise<string[]> {
  return Promise.all(cities.map(city => resolveCity(city)));
}