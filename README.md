# Typing Analysis Pipeline

這是一個輕量化的打字練習數據分析工具，支援從 **Keybr** 與 **Monkeytype** 匯出的資料進行自動整合、去重、以及進步趨勢分析。

## 特色
- **零依賴**：僅需 Node.js，不需安裝繁重的資料庫或框架。
- **智慧去重**：自動處理重疊的歷史紀錄檔案。
- **進步追蹤**：自動計算速度與錯誤率的 Delta（差異）。
- **LLM 友善**：產出的 `summary.json` 格式極度精簡，適合直接丟給 AI 進行分析並獲取練習建議。

## 安裝與使用
1. **環境需求**：安裝 [Node.js](https://nodejs.org/)。
2. **複製專案**：
   ```bash
   git clone https://github.com/Akasame0315/Typing-Analysis-Pipeline.git
   cd typing-analysis
   ```
3. **準備資料**：
   - 將 Keybr 的 JSON 匯出檔放入 `data/raw/keybr/`。
   - 將 Monkeytype 的 CSV 匯出檔放入 `data/raw/monkeytype/`。
4. **執行分析**：
   ```bash
   node scripts/run.js
   ```
5. **檢視結果**：分析結果將儲存於 `data/summary.json`。

## 資料結構
- `data/raw/`: 放置原始數據。
- `data/summary.json`: 最新的分析摘要。
- `data/history/`: 每次執行的歷史快照。

### Develop by me, GPT and Gemini