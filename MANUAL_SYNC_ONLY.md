# 🚫 自動同期機能削除済み - 手動同期のみ

このテーマでは **自動同期機能が完全に削除** されています。すべての同期は **手動で実行** する必要があります。

## 🎯 削除された機能

### ❌ 無効化された自動同期
- **投稿保存時の自動同期**: 投稿を保存してもGoogle Sheetsは更新されません
- **投稿削除時の自動同期**: 投稿を削除してもGoogle Sheetsは更新されません  
- **ステータス変更時の自動同期**: 公開状態を変更してもGoogle Sheetsは更新されません
- **定期自動同期**: 背景でのスケジュール同期は一切行われません
- **Cronジョブ**: すべての自動同期関連のスケジュールタスクが削除されています

### ❌ 削除された管理画面設定
- **自動同期有効/無効設定**: 設定項目自体が削除されています
- **同期間隔設定**: 自動同期間隔の設定は削除されています
- **スケジュール同期設定**: すべての自動スケジュール設定が削除されています

## ✅ 利用可能な機能

### 🔄 手動同期（管理画面から）
```
WordPress管理画面 → 設定 → Sheets連携
```

**利用可能なボタン:**
- **完全同期（双方向）**: WordPress ⇄ Google Sheets の両方向同期
- **WordPress → Sheets**: WordPressからGoogle Sheetsへ一方向同期
- **Sheets → WordPress**: Google SheetsからWordPressへ一方向同期

### 🌐 Webhook同期（Google Apps Scriptから）
- **Google Apps Scriptのトリガー**: 手動実行またはスクリプトトリガーからの同期
- **REST API経由**: `wp-json/gi/v1/sheets-webhook` エンドポイント
- **従来のWebhook**: `?gi_sheets_webhook=true` パラメータ

## 📋 使用方法

### **1. WordPress管理画面から手動同期**
```bash
1. WordPress管理画面にログイン
2. 設定 → Sheets連携 を開く
3. 必要な同期ボタンをクリック
4. 完了メッセージを確認
```

### **2. Google Apps Scriptから同期トリガー**
```javascript
// Google Apps Script例
function triggerWordPressSync() {
  const webhookUrl = 'https://your-site.com/wp-json/gi/v1/sheets-webhook';
  const secretKey = 'your-secret-key';
  
  const payload = {
    action: 'manual_sync',
    timestamp: Math.floor(Date.now() / 1000),
    signature: generateSignature(payload, secretKey)
  };
  
  UrlFetchApp.fetch(webhookUrl, {
    method: 'POST',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  });
}
```

## 🔧 テーマ有効化時の自動クリーンアップ

テーマを有効化すると、既存の自動同期設定が自動的にクリーンアップされます：

- ✅ 既存のCronスケジュールを削除
- ✅ 自動同期設定オプションを無効化
- ✅ 古いスケジュールタスクをクリア
- ✅ データベースから不要な設定を削除

## ⚠️ 重要な注意点

### **データの更新タイミング**
```
❌ 投稿を保存 → Google Sheetsは更新されない
❌ 投稿を削除 → Google Sheetsは更新されない
❌ 自動バックグラウンド更新なし

✅ 手動同期ボタンクリック → 即座に同期実行
✅ Google Apps Scriptトリガー → 即座に同期実行
```

### **データ整合性の管理**
- **手動管理が必要**: データの整合性は手動で管理する必要があります
- **定期的な同期推奨**: 定期的に手動同期を実行することを推奨します
- **編集前の同期**: 大きな変更前には双方向同期を推奨します

## 🛠️ 高度な使用方法

### **WP-CLI からの同期**
```bash
# 手動同期コマンド（開発環境）
wp gi disable-auto-sync  # 自動同期を強制無効化（確認用）
```

### **カスタム同期スクリプト**
```php
// カスタムフックでの手動同期トリガー
if (class_exists('GoogleSheetsSync')) {
    $sync = GoogleSheetsSync::getInstance();
    
    // WordPressからSheetsへ
    $sync->sync_all_posts_to_sheets();
    
    // SheetsからWordPressへ  
    $sync->sync_sheets_to_wp();
    
    // 双方向同期
    $sync->full_bidirectional_sync();
}
```

## 📞 サポート

### **同期が動作しない場合**
1. **接続テスト**: 管理画面で「接続をテスト」ボタンをクリック
2. **手動同期テスト**: 「完全同期（双方向）」ボタンをクリック  
3. **エラーログ確認**: WordPress Debug.logでエラーを確認
4. **Webhook設定確認**: Google Apps ScriptのURL・シークレットキー確認

### **よくある質問**
- **Q: 投稿を保存してもSheetsが更新されない**  
  A: 手動同期のみのため、管理画面から手動同期を実行してください

- **Q: 自動同期を再有効化したい**  
  A: このテーマでは自動同期は完全に削除されています。必要であればカスタム開発が必要です

- **Q: バックグラウンドで同期したい**  
  A: Google Apps Scriptのトリガー機能を使用してスケジュール同期を実装できます

---

🎯 **結論**: このテーマは **完全に手動制御** の同期システムです。データの同期タイミングを完全にコントロールできますが、手動管理が必要になります。