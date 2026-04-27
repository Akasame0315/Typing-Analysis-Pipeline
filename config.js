const path = require('path');

module.exports = {
  paths: {
    keybrDir: path.join(__dirname, 'data/raw/keybr'),
    monkeytypeDir: path.join(__dirname, 'data/raw/monkeytype'),
    summaryOut: path.join(__dirname, 'data/summary.json'),
    historyDir: path.join(__dirname, 'data/history') // 新增：存放舊摘要的地方
  }
};