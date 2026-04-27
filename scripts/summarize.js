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

  // 1. 近期狀態與趨勢
  const recent20 = sessions.slice(0, 20);
  const past20 = sessions.slice(20, 40);
  const recentAvgSpeed = mean(recent20.map(s => s.speed));
  const pastAvgSpeed = mean(past20.map(s => s.speed));
  let speedTrend = "0%";
  if (pastAvgSpeed > 0) {
    const trendValue = ((recentAvgSpeed - pastAvgSpeed) / pastAvgSpeed) * 100;
    speedTrend = `${trendValue >= 0 ? '+' : ''}${trendValue.toFixed(1)}%`;
  }

  // 2. 時間切片：以「週」為單位進行統計
  const weeklyStats = {};
  sessions.forEach(s => {
    if (!weeklyStats[s.week]) {
      weeklyStats[s.week] = { speeds: [], errors: [], length: [] };
    }
    weeklyStats[s.week].speeds.push(s.speed);
    weeklyStats[s.week].errors.push(s.errors);
    weeklyStats[s.week].length.push(s.length);
  });

  const weeklySummary = {};
  Object.keys(weeklyStats).forEach(week => {
    const weekData = weeklyStats[week];
    const totalChars = weekData.length.reduce((a,b)=>a+b, 0);
    const totalErrors = weekData.errors.reduce((a,b)=>a+b, 0);
    const accuracy = totalChars > 0 ? ((totalChars - totalErrors) / totalChars) * 100 : 0;
    
    weeklySummary[week] = {
      session_count: weekData.speeds.length,
      avg_speed: parseFloat(mean(weekData.speeds).toFixed(2)),
      accuracy: parseFloat(accuracy.toFixed(2))
    };
  });

  // 3. 退步警告邏輯 (比較最近兩週)
  const warnings = [];
  const sortedWeeks = Object.keys(weeklySummary).sort((a, b) => b.localeCompare(a)); // 新到舊
  
  if (sortedWeeks.length >= 2) {
    const thisWeek = weeklySummary[sortedWeeks[0]];
    const lastWeek = weeklySummary[sortedWeeks[1]];
    
    if (thisWeek.avg_speed < lastWeek.avg_speed - 2) { // 容忍 2 WPM 的波動
      warnings.push(`⚠️ WPM 退步警告：本週 (${thisWeek.avg_speed}) 較上週 (${lastWeek.avg_speed}) 下滑。`);
    }
    if (thisWeek.accuracy < lastWeek.accuracy - 1.5) { // 容忍 1.5% 的準確度波動
      warnings.push(`⚠️ 準確度警告：本週 (${thisWeek.accuracy}%) 較上週 (${lastWeek.accuracy}%) 變差，請注意指法穩定度。`);
    }
  }

  // 4. 字母統計 (Histogram) - 找出最弱的 Keys
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
  }).filter(k => k.totalCount > 10);

  const worstKeys = [...analyzedKeys].sort((a, b) => b.errorRate - a.errorRate).slice(0, 5).map(k => k.char);
  const slowKeys = [...analyzedKeys].sort((a, b) => b.avgTime - a.avgTime).slice(0, 5).map(k => k.char);

  // 5. 產出 Summary
  return {
    meta: {
      total_sessions: sessions.length,
      sources: [...new Set(sessions.map(s => s.source))],
      last_update: new Date().toISOString()
    },
    performance: {
      all_time_avg_speed: parseFloat(mean(speeds).toFixed(2)),
      consistency: parseFloat(stdDev(speeds).toFixed(2))
    },
    trend: {
      recent_speed_trend: speedTrend
    },
    weekly_analysis: weeklySummary,
    insights: {
      warnings: warnings.length > 0 ? warnings : ["✅ 表現穩定，無明顯退步跡象。"],
      weak_keys: worstKeys,
      slow_keys: slowKeys,
      action_item: `建議本週加強練習這幾個字母的組合：${worstKeys.join(', ')}`
    }
  };
}

function calculateDelta(curr, prev) {
  if (!prev) return null;
  return {
    improved_keys: prev.insights.weak_keys.filter(k => !curr.insights.weak_keys.includes(k)),
    new_problem_keys: curr.insights.weak_keys.filter(k => !prev.insights.weak_keys.includes(k))
  };
}

module.exports = { summarize, calculateDelta };