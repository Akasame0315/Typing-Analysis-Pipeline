const fs = require('fs');

function normalizeKeybr(filePath) {
  const rawData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return rawData.map(session => ({
    // 使用 timestamp 作為 keybr 的 ID (keybr 通常沒有內建 ID)
    id: `keybr-${session.timeStamp}`, 
    source: 'keybr',
    timestamp: session.timeStamp,
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
  }));
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

    return {
      // 使用 Monkeytype 內建的 _id 欄位
      id: `mt-${getCol('_id')}`, 
      source: 'monkeytype',
      timestamp: new Date(parseInt(getCol('timestamp'))).toISOString(),
      speed: parseFloat(getCol('wpm')),
      errors: errors,
      length: parseInt(charStats[0] || 0) + errors,
      time: parseFloat(getCol('testDuration')) * 1000,
      histogram: []
    };
  });
}

module.exports = { normalizeKeybr, normalizeMonkeytypeCSV };