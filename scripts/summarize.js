// 數學小工具
const mean = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
const stdDev = (arr) => {
  if (arr.length === 0) return 0;
  const m = mean(arr);
  const variance = arr.reduce((a, b) => a + Math.pow(b - m, 2), 0) / arr.length;
  return Math.sqrt(variance);
};

function summarize(sessions) {
  if (sessions.length === 0) return null;

  // 確保依照時間排序（新 -> 舊）
  sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const speeds = sessions.map(s => s.speed);
  const errors = sessions.map(s => s.errors);

  // 1. 近期狀態
  const recent5 = sessions.slice(0, 5);
  
  // 2. 趨勢 (近 20 筆 vs 前 20 筆)
  const recent20 = sessions.slice(0, 20);
  const past20 = sessions.slice(20, 40);
  const recentAvgSpeed = mean(recent20.map(s => s.speed));
  const pastAvgSpeed = mean(past20.map(s => s.speed));
  let speedTrend = "0%";
  if (pastAvgSpeed > 0) {
    const trendValue = ((recentAvgSpeed - pastAvgSpeed) / pastAvgSpeed) * 100;
    speedTrend = `${trendValue >= 0 ? '+' : ''}${trendValue.toFixed(1)}%`;
  }

  // 3. 字母統計 (Histogram)
  const charStats = {};
  sessions.forEach(session => {
    session.histogram.forEach(h => {
      if (!charStats[h.char]) {
        charStats[h.char] = { hit: 0, miss: 0, time: 0 };
      }
      charStats[h.char].hit += h.hit;
      charStats[h.char].miss += h.miss;
      charStats[h.char].time += h.time;
    });
  });

  // 計算派生指標
  const analyzedKeys = Object.entries(charStats).map(([char, stats]) => {
    const totalHits = stats.hit + stats.miss;
    return {
      char,
      errorRate: totalHits > 0 ? stats.miss / totalHits : 0,
      avgTime: stats.hit > 0 ? stats.time / stats.hit : 0,
      totalCount: totalHits
    };
  }).filter(k => k.totalCount > 10); // 過濾掉樣本數太少的字

  const worstKeys = [...analyzedKeys].sort((a, b) => b.errorRate - a.errorRate).slice(0, 5).map(k => k.char);
  const slowKeys = [...analyzedKeys].sort((a, b) => b.avgTime - a.avgTime).slice(0, 5).map(k => k.char);

  // 4. 產出 Summary
  return {
    meta: {
      total_sessions: sessions.length,
      sources: [...new Set(sessions.map(s => s.source))],
      last_update: new Date().toISOString()
    },
    performance: {
      avg_speed: parseFloat(mean(speeds).toFixed(2)),
      avg_errors: parseFloat(mean(errors).toFixed(2)),
      consistency: parseFloat(stdDev(speeds).toFixed(2)) // 標準差越小越穩定
    },
    recent: {
      avg_speed: parseFloat(mean(recent5.map(s => s.speed)).toFixed(2)),
      avg_errors: parseFloat(mean(recent5.map(s => s.errors)).toFixed(2))
    },
    trend: {
      speed: speedTrend
    },
    analysis: {
      worst_keys: worstKeys,
      slow_keys: slowKeys
    }
  };
}

// module.exports = { summarize };

function calculateDelta(curr, prev) {
  if (!prev) return null;

  const delta = {
    speed: parseFloat((curr.performance.avg_speed - prev.performance.avg_speed).toFixed(2)),
    errors: parseFloat((curr.performance.avg_errors - prev.performance.avg_errors).toFixed(2)),
    // 弱點變化分析
    improved_keys: prev.analysis.worst_keys.filter(k => !curr.analysis.worst_keys.includes(k)),
    new_problem_keys: curr.analysis.worst_keys.filter(k => !prev.analysis.worst_keys.includes(k))
  };

  return delta;
}

module.exports = { summarize, calculateDelta };