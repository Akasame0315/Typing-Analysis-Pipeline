const fs = require('fs');

// 計算 ISO 週數的 Helper 函數
function getISOWeekString(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function normalizeKeybr(filePath) {
  const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return rawData.map(session => {
    // Keybr 的 timeStamp 需要轉成毫秒 (視原始資料格式而定，通常是秒或毫秒)
    const dateObj = new Date(session.timeStamp); 
    
    return {
      id: `keybr-${session.timeStamp}`, 
      source: 'keybr',
      timestamp: dateObj.toISOString(),
      week: getISOWeekString(dateObj), // 加入週數標籤
      speed: session.speed,
      errors: session.errors,
      length: session.length,
      time: session.time,
      histogram: session.histogram ? session.histogram.map(h => ({
        char: String.fromCharCode(h.codePoint),
        hit: h.hitCount,
        miss: h.missCount,
        time: h.timeToType
      })) : []
    };
  });
}

function normalizeMonkeytypeCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8').trim().split('\n');
  if (content.length <= 1) return [];

  const headers = content[0].split(',');
  
  return content.slice(1).map(line => {
    const cols = line.split(',');
    const getCol = (name) => cols[headers.indexOf(name)];
    
    const charStats = getCol('charStats') ? getCol('charStats').split(';') : ['0','0','0','0'];
    const errors = parseInt(charStats[1] || 0) + parseInt(charStats[3] || 0);
    const dateObj = new Date(parseInt(getCol('timestamp')));

    return {
      id: `mt-${getCol('_id')}`, 
      source: 'monkeytype',
      timestamp: dateObj.toISOString(),
      week: getISOWeekString(dateObj), // 加入週數標籤
      speed: parseFloat(getCol('wpm')),
      errors: errors,
      length: parseInt(charStats[0] || 0) + errors,
      time: parseFloat(getCol('testDuration')) * 1000,
      histogram: []
    };
  });
}

module.exports = { normalizeKeybr, normalizeMonkeytypeCSV };