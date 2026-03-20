// 单元测试 - 使用ES模块导入已导出的函数
import { parseWindPower, localizeErrorMessage, getCityAdcode, getInternationalCity } from '../dist/index.js';
import assert from 'assert';

console.log('🧪 天气CLI工具函数单元测试');
console.log('='.repeat(50));

// parseWindPower 测试
console.log('\n🔬 测试 parseWindPower:');
try {
  assert.strictEqual(parseWindPower('东北风3级'), '3级');
  console.log('  ✓ parseWindPower("东北风3级") = "3级"');
} catch (e) {
  console.log('  ✗ 失败:', e.message);
}

try {
  assert.strictEqual(parseWindPower('东风4-5级'), '4级');
  console.log('  ✓ parseWindPower("东风4-5级") = "4级" (匹配第一个数字)');
} catch (e) {
  console.log('  ✗ 失败:', e.message);
}

try {
  assert.strictEqual(parseWindPower('微风'), '0级');
  console.log('  ✓ parseWindPower("微风") = "0级"');
} catch (e) {
  console.log('  ✗ 失败:', e.message);
}

try {
  assert.strictEqual(parseWindPower(''), '0级');
  console.log('  ✓ parseWindPower("") = "0级"');
} catch (e) {
  console.log('  ✗ 失败:', e.message);
}

try {
  assert.strictEqual(parseWindPower('3'), '3级');
  console.log('  ✓ parseWindPower("3") = "3级" (纯数字)');
} catch (e) {
  console.log('  ✗ 失败:', e.message);
}

// localizeErrorMessage 测试
console.log('\n🔬 测试 localizeErrorMessage:');
try {
  const result = localizeErrorMessage('Failed to fetch');
  assert.strictEqual(result, '无法连接到天气服务，请检查网络连接');
  console.log('  ✓ localizeErrorMessage("Failed to fetch") = "无法连接到天气服务，请检查网络连接"');
} catch (e) {
  console.log('  ✗ 失败:', e.message);
}

try {
  const result = localizeErrorMessage('Request timeout');
  assert.strictEqual(result, '请求超时');
  console.log('  ✓ localizeErrorMessage("Request timeout") = "请求超时"');
} catch (e) {
  console.log('  ✗ 失败:', e.message);
}

try {
  const result = localizeErrorMessage('Connection ECONNREFUSED');
  assert.strictEqual(result, '网络连接被拒绝');
  console.log('  ✓ localizeErrorMessage("Connection ECONNREFUSED") = "网络连接被拒绝"');
} catch (e) {
  console.log('  ✗ 失败:', e.message);
}

try {
  const result = localizeErrorMessage('无效的API密钥');
  assert.strictEqual(result, '无效的API密钥');
  console.log('  ✓ 中文错误消息保持不变');
} catch (e) {
  console.log('  ✗ 失败:', e.message);
}

// getCityAdcode 测试
console.log('\n🔬 测试 getCityAdcode:');
try {
  const result = getCityAdcode('北京');
  assert.strictEqual(result, '110000');
  console.log('  ✓ getCityAdcode("北京") = "110000"');
} catch (e) {
  console.log('  ✗ 失败:', e.message);
}

try {
  const result = getCityAdcode('beijing');
  assert.strictEqual(result, '110000');
  console.log('  ✓ getCityAdcode("beijing") = "110000" (不区分大小写)');
} catch (e) {
  console.log('  ✗ 失败:', e.message);
}

try {
  const result = getCityAdcode('上海');
  assert.strictEqual(result, '310000');
  console.log('  ✓ getCityAdcode("上海") = "310000"');
} catch (e) {
  console.log('  ✗ 失败:', e.message);
}

try {
  const result = getCityAdcode(' unknown city ');
  assert.strictEqual(result, null);
  console.log('  ✓ getCityAdcode(" unknown city ") = null (未知城市+空格)');
} catch (e) {
  console.log('  ✗ 失败:', e.message);
}

try {
  const result = getCityAdcode('NEWYORK');
  assert.strictEqual(result, null);
  console.log('  ✓ getCityAdcode("NEWYORK") = null (未知城市大写)');
} catch (e) {
  console.log('  ✗ 失败:', e.message);
}

try {
  const result = getCityAdcode(' 北 京 '); // 有空格但可规范化
  assert.strictEqual(result, '110000');
  console.log('  ✓ getCityAdcode(" 北 京 ") = "110000" (带空格但可匹配)');
} catch (e) {
  console.log('  ✗ 失败:', e.message);
}

// getInternationalCity 测试
console.log('\n🔬 测试 getInternationalCity:');
try {
  const result = getInternationalCity('new york');
  assert(result !== null);
  assert(result.lat === 40.7128);
  console.log('  ✓ getInternationalCity("new york") 返回纽约坐标');
} catch (e) {
  console.log('  ✗ 失败:', e.message);
}

try {
  const result = getInternationalCity('伦敦');
  assert(result !== null);
  console.log('  ✓ getInternationalCity("伦敦") 返回伦敦坐标');
} catch (e) {
  console.log('  ✗ 失败:', e.message);
}

try {
  const result = getInternationalCity('unknown city');
  assert(result === null);
  console.log('  ✓ 未知城市返回 null');
} catch (e) {
  console.log('  ✗ 失败:', e.message);
}

console.log('\n' + '='.repeat(50));
console.log('✅ 所有测试完成！');