const fs = require('fs');
const path = require('path');
const config = require('../config');
const { normalizeKeybr, normalizeMonkeytypeCSV } = require('./normalize');
const { summarize, calculateDelta } = require('./summarize');

function run() {
  console.log('🚀 開始處理打字資料...');

  // 1. 載入舊摘要 (用於計算 Delta)
  let prevSummary = null;
  if (fs.existsSync(config.paths.summaryOut)) {
    prevSummary = JSON.parse(fs.readFileSync(config.paths.summaryOut, 'utf8'));
  }

  // 2. 建立一個 Map 來存放所有練習紀錄 (Key 是 id)
  // 這可以確保不論檔案怎麼重疊，同一個 ID 的練習只會存一份
  const sessionMap = new Map();

  // 處理 Keybr 資料夾
  if (fs.existsSync(config.paths.keybrDir)) {
    const files = fs.readdirSync(config.paths.keybrDir).filter(f => f.endsWith('.json'));
    files.forEach(file => {
      const sessions = normalizeKeybr(path.join(config.paths.keybrDir, file));
      sessions.forEach(s => sessionMap.set(s.id, s));
    });
  }

  // 處理 Monkeytype 資料夾
  if (fs.existsSync(config.paths.monkeytypeDir)) {
    const files = fs.readdirSync(config.paths.monkeytypeDir).filter(f => f.endsWith('.csv'));
    files.forEach(file => {
      const sessions = normalizeMonkeytypeCSV(path.join(config.paths.monkeytypeDir, file));
      sessions.forEach(s => sessionMap.set(s.id, s));
    });
  }

  const allSessions = Array.from(sessionMap.values());

  if (allSessions.length === 0) {
    console.log('⚠️ 找不到資料。');
    return;
  }

  console.log(`📊 掃描完成。在所有檔案中發現了 ${allSessions.length} 筆不重複的紀錄。`);

  // 3. 產生新摘要
  const currentSummary = summarize(allSessions);

  // 4. 計算 Delta (與上一次分析結果比較)
  if (prevSummary) {
    currentSummary.delta = calculateDelta(currentSummary, prevSummary);
  }

  // 5. 備份舊摘要並寫入新摘要
  if (prevSummary && prevSummary.meta && prevSummary.meta.last_update) {
    if (!fs.existsSync(config.paths.historyDir)) fs.mkdirSync(config.paths.historyDir, { recursive: true });
    const backupName = `summary_${prevSummary.meta.last_update.replace(/:/g, '-')}.json`;
    fs.writeFileSync(path.join(config.paths.historyDir, backupName), JSON.stringify(prevSummary, null, 2));
  }

  fs.writeFileSync(config.paths.summaryOut, JSON.stringify(currentSummary, null, 2), 'utf8');
  
  console.log(`✅ 分析完成！新的 summary.json 已產生。`);
}

run();