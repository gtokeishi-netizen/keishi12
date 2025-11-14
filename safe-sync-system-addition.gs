/**
 * 🛡️ 安全同期システム - 追加機能
 * 既存のIntegratedSheetSync.gsに追加するコード
 */

// =============================================================================
// 🛡️ 安全同期システム - ユーティリティ関数
// =============================================================================

/**
 * 同期ステータスを設定
 */
function setSyncStatus(sheet, rowNumber, status, errorMessage = '') {
  try {
    const currentTime = new Date().toISOString();
    
    // AF列：ステータス
    sheet.getRange(rowNumber, SYNC_COLUMNS.STATUS).setValue(status);
    
    // AG列：エラーメッセージ
    if (errorMessage) {
      sheet.getRange(rowNumber, SYNC_COLUMNS.ERROR_MESSAGE).setValue(errorMessage);
    } else if (status === SYNC_STATUS.SUCCESS) {
      sheet.getRange(rowNumber, SYNC_COLUMNS.ERROR_MESSAGE).clearContent();
    }
    
    // AH列：最終同期日時
    sheet.getRange(rowNumber, SYNC_COLUMNS.LAST_SYNC).setValue(currentTime);
    
    // AI列：リトライ回数（必要に応じて）
    if (status === SYNC_STATUS.RETRY) {
      const currentRetryCount = sheet.getRange(rowNumber, SYNC_COLUMNS.RETRY_COUNT).getValue() || 0;
      sheet.getRange(rowNumber, SYNC_COLUMNS.RETRY_COUNT).setValue(currentRetryCount + 1);
    } else if (status === SYNC_STATUS.SUCCESS) {
      sheet.getRange(rowNumber, SYNC_COLUMNS.RETRY_COUNT).clearContent();
    }
    
  } catch (error) {
    console.error(`Failed to set sync status for row ${rowNumber}:`, error);
  }
}

/**
 * 処理待ちの行を取得
 */
function getPendingRows(sheet) {
  try {
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) return [];
    
    const statusRange = sheet.getRange(2, SYNC_COLUMNS.STATUS, lastRow - 1, 1);
    const statusValues = statusRange.getValues();
    
    const pendingRows = [];
    
    for (let i = 0; i < statusValues.length; i++) {
      const rowNumber = i + 2;
      const status = statusValues[i][0];
      
      // 処理待ち、リトライ待ち、または空のステータス
      if (!status || status === SYNC_STATUS.PENDING || status === SYNC_STATUS.RETRY) {
        pendingRows.push(rowNumber);
      }
    }
    
    return pendingRows;
  } catch (error) {
    console.error('Failed to get pending rows:', error);
    return [];
  }
}

/**
 * 事前検証チェック
 */
function preSyncValidation() {
  try {
    // WordPress接続テスト
    if (!testWordPressConnection()) {
      console.warn('WordPress connection test failed');
      return false;
    }
    
    // API制限チェック（簡易版）
    if (isNearRateLimit()) {
      console.warn('Near API rate limit, skipping sync');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Pre-sync validation error:', error);
    return false;
  }
}

/**
 * WordPress接続テスト
 */
function testWordPressConnection() {
  try {
    // 簡単な接続テスト（実際の実装では軽量なエンドポイントを使用）
    const testPayload = { action: 'connection_test', timestamp: Date.now() };
    const result = syncRowToWordPress('connection_test', testPayload);
    return result === true;
  } catch (error) {
    console.warn('WordPress connection test failed:', error);
    return false;
  }
}

/**
 * API制限近接チェック（簡易版）
 */
function isNearRateLimit() {
  // 実装例：最近のリクエスト数をチェック
  // 実際の実装では、PropertiesServiceでリクエスト履歴を管理
  const recentRequests = PropertiesService.getScriptProperties().getProperty('recent_requests_count') || '0';
  return parseInt(recentRequests) > 50; // 60リクエスト制限の85%
}

/**
 * 緊急停止状態チェック
 */
function isEmergencyStopActive() {
  const emergencyStop = PropertiesService.getScriptProperties().getProperty('emergency_stop');
  return emergencyStop === 'true';
}

/**
 * 緊急停止設定
 */
function setEmergencyStop(active = true) {
  PropertiesService.getScriptProperties().setProperty('emergency_stop', active ? 'true' : 'false');
  console.log(`Emergency stop ${active ? 'activated' : 'deactivated'}`);
}

/**
 * 安全な自動同期プロセス（メイン関数）
 * 定期実行またはトリガーから呼び出される
 */
function safeAutoSync() {
  try {
    console.log('Starting safe auto sync process...');
    
    if (!SAFE_SYNC_CONFIG.ENABLE_AUTO_SYNC) {
      console.log('Auto sync is disabled in configuration');
      return;
    }
    
    // 緊急停止チェック
    if (isEmergencyStopActive()) {
      console.log('Emergency stop is active, skipping auto sync');
      return;
    }
    
    // 事前検証
    if (!preSyncValidation()) {
      console.log('Pre-sync validation failed, skipping auto sync');
      return;
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      throw new Error('Target sheet not found: ' + CONFIG.SHEET_NAME);
    }
    
    // 処理待ちの行を取得
    const pendingRows = getPendingRows(sheet);
    
    if (pendingRows.length === 0) {
      console.log('No pending rows found for auto sync');
      return;
    }
    
    console.log(`Found ${pendingRows.length} pending rows for auto sync`);
    
    // バッチ処理で安全に同期
    const batchSize = Math.min(SAFE_SYNC_CONFIG.MAX_ROWS_PER_RUN, pendingRows.length);
    const currentBatch = pendingRows.slice(0, batchSize);
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const rowNumber of currentBatch) {
      try {
        const result = processSingleRow(sheet, rowNumber);
        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }
      } catch (error) {
        failureCount++;
        console.error(`Auto sync failed for row ${rowNumber}:`, error);
      }
      
      // API制限対策の小休憩
      Utilities.sleep(500);
    }
    
    const summary = `Auto sync batch completed: ${successCount} success, ${failureCount} failures`;
    console.log(summary);
    
    // 次回実行のスケジュール（残りがある場合）
    if (pendingRows.length > batchSize) {
      scheduleNextAutoSync();
    }
    
  } catch (error) {
    console.error('Safe auto sync error:', error);
    logError('Safe auto sync failed', error);
  }
}

/**
 * 単一行の同期処理
 */
function processSingleRow(sheet, rowNumber) {
  try {
    setSyncStatus(sheet, rowNumber, SYNC_STATUS.PROCESSING);
    
    const rowData = getRowDataDynamic(sheet, rowNumber);
    if (!rowData) {
      setSyncStatus(sheet, rowNumber, SYNC_STATUS.SKIPPED, 'Empty row data');
      return { success: false, reason: 'Empty row data' };
    }
    
    // 下書き状態のスキップチェック
    if (SAFE_SYNC_CONFIG.SKIP_DRAFT_ROWS && rowData[4] === 'draft') {
      setSyncStatus(sheet, rowNumber, SYNC_STATUS.SKIPPED, 'Draft status');
      return { success: false, reason: 'Draft status' };
    }
    
    // 構造化データに変換
    const structuredData = convertRowDataToStructured(rowData);
    
    // WordPress同期実行
    const success = syncRowToWordPressWithRetry(rowNumber, rowData, structuredData);
    
    if (success) {
      setSyncStatus(sheet, rowNumber, SYNC_STATUS.SUCCESS);
      return { success: true };
    } else {
      setSyncStatus(sheet, rowNumber, SYNC_STATUS.FAILED, 'Sync failed after retries');
      return { success: false, reason: 'Sync failed after retries' };
    }
    
  } catch (error) {
    setSyncStatus(sheet, rowNumber, SYNC_STATUS.FAILED, error.message);
    return { success: false, reason: error.message };
  }
}

/**
 * リトライ機能付きWordPress同期
 */
function syncRowToWordPressWithRetry(rowNumber, rowData, structuredData) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= SAFE_SYNC_CONFIG.MAX_RETRY_ATTEMPTS; attempt++) {
    try {
      console.log(`Sync attempt ${attempt}/${SAFE_SYNC_CONFIG.MAX_RETRY_ATTEMPTS} for row ${rowNumber}`);
      
      const success = syncRowToWordPress('row_updated', {
        row_number: rowNumber,
        row_data: rowData,
        structured_data: structuredData,
        attempt: attempt
      });
      
      if (success) {
        console.log(`Row ${rowNumber} synced successfully on attempt ${attempt}`);
        return true;
      }
      
    } catch (error) {
      lastError = error;
      console.warn(`Row ${rowNumber} sync attempt ${attempt} failed:`, error.message);
      
      // API制限エラーの場合は長めの待機
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        console.log('Rate limit detected, waiting longer...');
        Utilities.sleep(SAFE_SYNC_CONFIG.API_RATE_LIMIT_DELAY);
      } else {
        Utilities.sleep(1000 * attempt); // 指数バックオフ
      }
    }
  }
  
  console.error(`Row ${rowNumber} sync failed after ${SAFE_SYNC_CONFIG.MAX_RETRY_ATTEMPTS} attempts:`, lastError);
  return false;
}

// =============================================================================
// 🎛️ 管理メニュー機能追加
// =============================================================================

/**
 * 緊急停止アクティブ化
 */
function activateEmergencyStop() {
  setEmergencyStop(true);
  SpreadsheetApp.getUi().alert('🚨 緊急停止', '自動同期が停止されました。\n同期を再開するには「緊急停止（OFF）」を実行してください。', SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * 緊急停止解除
 */
function deactivateEmergencyStop() {
  setEmergencyStop(false);
  SpreadsheetApp.getUi().alert('✅ 緊急停止解除', '自動同期が再開されました。', SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * 同期ステータス表示
 */
function showSyncStatus() {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      SpreadsheetApp.getUi().alert('エラー', 'シートが見つかりません', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    const pendingRows = getPendingRows(sheet);
    const emergencyStop = isEmergencyStopActive();
    
    let statusMessage = `📊 同期ステータス\n\n`;
    statusMessage += `🔄 処理待ち行数: ${pendingRows.length}\n`;
    statusMessage += `🚨 緊急停止: ${emergencyStop ? 'アクティブ' : '非アクティブ'}\n`;
    statusMessage += `⚙️ 自動同期: ${SAFE_SYNC_CONFIG.ENABLE_AUTO_SYNC ? '有効' : '無効'}\n`;
    statusMessage += `📏 バッチサイズ: ${SAFE_SYNC_CONFIG.MAX_ROWS_PER_RUN}行/回\n`;
    statusMessage += `⏱️ 同期間隔: ${SAFE_SYNC_CONFIG.SYNC_INTERVAL_MINUTES}分\n\n`;
    
    if (pendingRows.length > 0) {
      statusMessage += `処理待ち行: ${pendingRows.slice(0, 10).join(', ')}${pendingRows.length > 10 ? '...' : ''}`;
    }
    
    SpreadsheetApp.getUi().alert('同期ステータス', statusMessage, SpreadsheetApp.getUi().ButtonSet.OK);
    
  } catch (error) {
    console.error('Failed to show sync status:', error);
    SpreadsheetApp.getUi().alert('エラー', 'ステータス取得に失敗しました', SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * 同期通知送信
 */
function sendSyncNotification(message, type = 'info') {
  try {
    // 実際の実装では、メール通知やSlack通知などを設定
    console.log(`Sync Notification [${type.toUpperCase()}]: ${message}`);
    
    // Google Apps Scriptのメール送信例（必要に応じて有効化）
    /*
    if (type === 'error' || type === 'warning') {
      const adminEmail = PropertiesService.getScriptProperties().getProperty('admin_email');
      if (adminEmail) {
        MailApp.sendEmail({
          to: adminEmail,
          subject: `Grant Sheets Sync ${type.toUpperCase()}`,
          body: message
        });
      }
    }
    */
  } catch (error) {
    console.error('Failed to send sync notification:', error);
  }
}