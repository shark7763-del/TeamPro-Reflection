# TeamPro Google Sheet 共同後台設定

## 1. 建立 Google Sheet

1. 到 Google Drive 建立一份新的 Google 試算表。
2. 檔名可命名為：`TeamPro 團隊反思資料庫`。
3. 在試算表上方選單點選：`擴充功能` → `Apps Script`。

## 2. 貼上 Apps Script

1. 刪除 Apps Script 編輯器中原本的內容。
2. 複製本專案的 `google-apps-script/Code.gs` 全部內容貼上。
3. 儲存專案。

## 3. 部署 Web App

1. 點右上角 `部署` → `新增部署作業`。
2. 類型選擇：`網頁應用程式`。
3. 執行身分選擇：`我`。
4. 存取權選擇：`任何人`。
5. 按 `部署`。
6. 第一次會要求授權，依畫面授權。
7. 複製產生的 Web App URL，格式類似：

```text
https://script.google.com/macros/s/xxxxxxxxxxxxxxxx/exec
```

## 4. 回到 TeamPro 設定

1. 打開 TeamPro 網站。
2. 進入 `教練查看`。
3. 密碼輸入：`1234`。
4. 在 `Google Sheet 共同後台` 貼上 Web App URL。
5. 按 `儲存同步網址`。
6. 按 `同步到 Google Sheet`，會把目前名單與紀錄寫進試算表。

## 重要限制

- 沒有設定 Web App URL 的裝置，仍然只會存在本機 localStorage。
- 若要學生自己的手機都能直接同步，需要把 Web App URL 寫進正式程式設定後重新部署。
- Google Sheet 是共同資料來源；請不要手動改欄位名稱，避免同步格式錯誤。
