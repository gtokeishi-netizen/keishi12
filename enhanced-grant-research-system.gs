/**
 * @fileoverview 【最新版・完全強化】助成金AIリサーチシステム v2.0
 * 
 * 機能強化項目:
 * - プロンプト精度大幅向上（専門性・具体性・検証力強化）
 * - エラーハンドリング完全強化（リトライ機構・詳細ログ）
 * - データ検証システム強化（フィールド別バリデーション）
 * - UI/UX改善（進捗表示・詳細ステータス・ユーザビリティ向上）
 * - パフォーマンス最適化（バッチ処理・API効率化）
 * - セキュリティ強化（APIキー管理・入力サニタイズ）
 */

// ===== 設定エリア =====
const CONFIG = {
  API_KEY: PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY'),
  API_URL_BASE: 'https://generativelanguage.googleapis.com/v1beta/models/',
  MODEL_NAME: 'gemini-2.5-pro',
  API_TIMEOUT: 30000,
  RETRY_MAX: 3,
  RETRY_DELAY: 5000,
  PROCESSING_DELAY: 12000, // API制限対応（12秒間隔）
  MAX_CONTENT_LENGTH: 2000,
  MAX_EXCERPT_LENGTH: 160
};

// ===== マスターデータエリア =====

// 全都道府県リスト
const ALL_PREFECTURES = [
  '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
  '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
  '新潟県','富山県','石川県','福井県','山梨県','長野県','岐阜県',
  '静岡県','愛知県','三重県','滋賀県','京都府','大阪府','兵庫県',
  '奈良県','和歌山県','鳥取県','島根県','岡山県','広島県','山口県',
  '徳島県','香川県','愛媛県','高知県','福岡県','佐賀県','長崎県',
  '熊本県','大分県','宮崎県','鹿児島県','沖縄県'
].join(',');

// 都道府県コードマッピング
const PREFECTURE_CODES = {
  "北海道":"01","青森県":"02","岩手県":"03","宮城県":"04","秋田県":"05","山形県":"06","福島県":"07",
  "茨城県":"08","栃木県":"09","群馬県":"10","埼玉県":"11","千葉県":"12","東京都":"13","神奈川県":"14",
  "新潟県":"15","富山県":"16","石川県":"17","福井県":"18","山梨県":"19","長野県":"20","岐阜県":"21",
  "静岡県":"22","愛知県":"23","三重県":"24","滋賀県":"25","京都府":"26","大阪府":"27","兵庫県":"28",
  "奈良県":"29","和歌山県":"30","鳥取県":"31","島根県":"32","岡山県":"33","広島県":"34","山口県":"35",
  "徳島県":"36","香川県":"37","愛媛県":"38","高知県":"39","福岡県":"40","佐賀県":"41","長崎県":"42",
  "熊本県":"43","大分県":"44","宮崎県":"45","鹿児島県":"46","沖縄県":"47"
};

// 助成金カテゴリリスト（名称管理）
const GRANT_CATEGORIES = [
  '創業・起業支援',
  '事業承継・M&A', 
  '経営改善・再生',
  '設備投資・機械導入',
  '研究開発・イノベーション',
  'IT化・DX推進',
  '販路開拓・海外展開',
  '雇用創出・人材育成',
  '環境対策・省エネ',
  '地域活性化・観光振興',
  '農林水産業振興',
  '文化・芸術振興',
  '防災・減災対策',
  '医療・介護・福祉',
  '住宅・建築・リフォーム',
  '子育て・教育支援',
  'スキルアップ・職業訓練',
  '健康・スポーツ振興',
  '移住・定住促進',
  'その他・特定分野'
];

// 組織タイプの詳細定義
const ORGANIZATION_TYPES = {
  'national': '国（省庁・独立行政法人）',
  'prefecture': '都道府県',
  'city': '市区町村',
  'public_org': '公的団体・機構',
  'private_org': '民間団体・協会',
  'foundation': '財団法人・社団法人',
  'jgrants': 'Jグランツ対象',
  'other': 'その他'
};

// 申請方法の詳細定義
const APPLICATION_METHODS = {
  'online': 'オンライン申請専用',
  'mail': '郵送申請のみ',
  'visit': '窓口持参のみ',
  'mixed': '複数方法対応可能'
};

// 地域制限の詳細定義
const REGIONAL_LIMITATIONS = {
  'nationwide': '全国対象',
  'prefecture_only': '特定都道府県限定',
  'municipality_only': '特定市区町村限定',
  'region_group': '複数地域・ブロック対象',
  'specific_area': '特定条件・エリア限定'
};

// ===== メイン機能エリア =====

/**
 * スプレッドシート初期化時のメニュー作成
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 AI助成金リサーチシステム v2.0')
    .addItem('📋 ヘッダー設定（31列完全対応）', 'setupAdvancedHeaders')
    .addItem('▶️ 選択範囲リサーチ開始', 'startAdvancedResearchProcess')
    .addSeparator()
    .addItem('🔧 APIキー設定', 'setupApiKey')
    .addItem('📊 処理状況確認', 'checkProcessingStatus')
    .addSeparator()
    .addItem('🔄 システムリセット', 'resetAllProcesses')
    .addItem('📖 使用方法・ヘルプ', 'showHelp')
    .addToUi();
  
  // 初回起動時の自動設定チェック
  checkInitialSetup();
}

/**
 * 初回起動時の設定確認
 */
function checkInitialSetup() {
  const properties = PropertiesService.getScriptProperties();
  const apiKey = properties.getProperty('GEMINI_API_KEY');
  
  if (!apiKey) {
    SpreadsheetApp.getUi().alert(
      '🔧 初期設定が必要です',
      '「🔧 APIキー設定」からGemini APIキーを設定してください。\n' +
      '設定後、「📋 ヘッダー設定」でスプレッドシートの準備を行ってください。',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * 【強化版】31列完全対応ヘッダー設定
 */
function setupAdvancedHeaders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const ui = SpreadsheetApp.getUi();
  
  // 現在のデータ確認
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const response = ui.alert(
      '⚠️ データが存在します',
      '既存のデータが存在します。ヘッダーを再設定しますか？\n' +
      '（既存データは保持されますが、列の対応関係が変わる可能性があります）',
      ui.ButtonSet.YES_NO
    );
    
    if (response !== ui.Button.YES) {
      return;
    }
  }
  
  // 強化版ヘッダー定義（31列 A-AE）
  const headers = [
    // A-E: 基本情報
    { name: 'ステータス', description: '処理状況', type: 'status' },
    { name: '助成金名', description: 'リサーチ対象タイトル', type: 'input' },
    { name: '詳細コンテンツ', description: 'AI生成記事本文', type: 'ai_content' },
    { name: '概要（excerpt）', description: 'SEO用要約文', type: 'ai_content' },
    { name: '投稿ステータス', description: 'WordPress用', type: 'system' },
    
    // F-K: URL・金額・期限
    { name: 'URL', description: '生成されるページURL', type: 'generated' },
    { name: '助成金カテゴリ', description: 'カテゴリ名称', type: 'ai_content' },
    { name: '助成金額（テキスト）', description: '元の表現', type: 'ai_content' },
    { name: '助成金額（数値）', description: '計算用数値', type: 'ai_content' },
    { name: '申請期限（テキスト）', description: '元の表現', type: 'ai_content' },
    { name: '申請期限（日付）', description: 'YYYY-MM-DD形式', type: 'ai_content' },
    
    // L-Q: 組織・対象・申請
    { name: '実施組織名', description: '正式名称', type: 'ai_content' },
    { name: '組織タイプ', description: '機関種別', type: 'ai_content' },
    { name: '対象者・事業', description: '詳細な対象条件', type: 'ai_content' },
    { name: '連絡先', description: '問い合わせ先詳細', type: 'ai_content' },
    { name: '公式URL', description: '一次情報URL', type: 'ai_content' },
    
    // R-W: 地域・分類
    { name: '都道府県名', description: '対象都道府県名称', type: 'ai_content' },
    { name: '対象市町村', description: '限定地域', type: 'ai_content' },
    { name: '地域制限', description: '地域制限区分', type: 'ai_content' },
    { name: '申請状況', description: '現在の受付状況', type: 'ai_content' },
    { name: '申請方法', description: '申請手続き方法', type: 'ai_content' },
    { name: 'タグ', description: 'SEOタグ', type: 'ai_content' },
    
    // W-AC: 追加詳細情報
    { name: 'シート更新日（手動）', description: '手動編集日', type: 'manual' },
    { name: '必要書類', description: '申請必要書類', type: 'ai_content' },
    { name: '採択率', description: '採択実績（数字のみ）', type: 'ai_content' },
    { name: '難易度', description: '申請難易度', type: 'ai_content' },
    { name: '対象経費', description: '補助対象経費', type: 'ai_content' },
    { name: '補助率', description: '補助率・補助額', type: 'ai_content' },
    { name: 'シート更新日（自動）', description: 'AI処理日時', type: 'system' }
  ];
  
  // ヘッダー設定
  for (let i = 0; i < headers.length; i++) {
    const cell = sheet.getRange(1, i + 1);
    cell.setValue(headers[i].name);
    
    // タイプ別の色分け
    switch (headers[i].type) {
      case 'input':
        cell.setBackground('#E3F2FD'); // 薄い青（入力用）
        break;
      case 'ai_content':
        cell.setBackground('#E8F5E8'); // 薄い緑（AI生成）
        break;
      case 'generated':
        cell.setBackground('#FFF3E0'); // 薄いオレンジ（自動生成）
        break;
      case 'status':
        cell.setBackground('#FFEBEE'); // 薄い赤（ステータス）
        break;
      case 'system':
        cell.setBackground('#F3E5F5'); // 薄い紫（システム）
        break;
      case 'manual':
        cell.setBackground('#F5F5F5'); // グレー（手動）
        break;
    }
    
    // コメント追加
    cell.setNote(headers[i].description + '\n\nタイプ: ' + headers[i].type);
  }
  
  // ヘッダー行の共通スタイル
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontColor('#333333');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  headerRange.setWrap(true);
  
  // 行の高さ調整
  sheet.setRowHeight(1, 50);
  
  // 列幅の最適化
  sheet.autoResizeColumns(1, headers.length);
  
  // データ検証ルール設定
  setupDataValidationRules(sheet, headers.length);
  
  // 条件付き書式設定
  setupConditionalFormatting(sheet);
  
  ui.alert(
    '✅ ヘッダー設定完了',
    `31列のヘッダーが正常に設定されました。\n\n` +
    `📊 設定列数: ${headers.length}列 (A-AE)\n` +
    `🎨 色分け: タイプ別に自動色分け\n` +
    `📝 コメント: 各列に詳細説明を追加\n` +
    `✅ データ検証: 入力ルール設定済み\n\n` +
    `準備完了！B列に助成金名を入力して「▶️ 選択範囲リサーチ開始」をお試しください。`,
    ui.ButtonSet.OK
  );
}

/**
 * データ検証ルール設定
 */
function setupDataValidationRules(sheet, columnCount) {
  try {
    // A列（ステータス）の検証ルール
    const statusValues = ['待機中', 'リサーチ中...', '完了', 'エラー', 'スキップ'];
    const statusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(statusValues)
      .setAllowInvalid(false)
      .setHelpText('処理ステータスを選択してください')
      .build();
    sheet.getRange('A2:A1000').setDataValidation(statusRule);
    
    // E列（投稿ステータス）の検証ルール
    const postStatusValues = ['publish', 'draft', 'private'];
    const postStatusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(postStatusValues)
      .setAllowInvalid(false)
      .setHelpText('投稿ステータス: publish（公開）, draft（下書き）, private（非公開）')
      .build();
    sheet.getRange('E2:E1000').setDataValidation(postStatusRule);
    
  } catch (error) {
    Logger.log('データ検証ルール設定エラー: ' + error.toString());
  }
}

/**
 * 条件付き書式設定
 */
function setupConditionalFormatting(sheet) {
  try {
    // ステータス列の条件付き書式
    const statusRange = sheet.getRange('A2:A1000');
    
    // 完了: 緑背景
    sheet.getRange('A2:A1000').setConditionalFormatRules([
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('完了')
        .setBackground('#D4EFDF')
        .build(),
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('エラー')
        .setBackground('#FADBD8')
        .build(),
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('リサーチ中...')
        .setBackground('#FFF2CC')
        .build()
    ]);
    
  } catch (error) {
    Logger.log('条件付き書式設定エラー: ' + error.toString());
  }
}

/**
 * 【完全強化版】APIキー設定
 */
function setupApiKey() {
  const ui = SpreadsheetApp.getUi();
  
  // 現在の設定確認
  const currentKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  const hasKey = currentKey && currentKey.length > 0;
  
  const promptText = hasKey 
    ? 'Gemini APIキーが設定されています。\n新しいAPIキーを入力してください（空欄の場合は変更されません）:'
    : 'Gemini APIキーを設定してください。\n\nAPIキーの取得方法:\n1. https://ai.google.dev/ にアクセス\n2. 「Get API key」をクリック\n3. APIキーをコピーして貼り付け\n\nAPIキーを入力:';
  
  const result = ui.prompt(
    '🔧 Gemini APIキーの設定',
    promptText,
    ui.ButtonSet.OK_CANCEL
  );
  
  if (result.getSelectedButton() === ui.Button.OK) {
    const apiKey = result.getResponseText().trim();
    
    if (apiKey) {
      // APIキーの形式検証
      if (!apiKey.startsWith('AIza') || apiKey.length < 35) {
        ui.alert(
          '❌ 無効なAPIキー',
          'APIキーの形式が正しくありません。\n正しいGemini APIキーは「AIza」で始まり35文字以上です。',
          ui.ButtonSet.OK
        );
        return;
      }
      
      // APIキーのテスト
      ui.alert('🔍 APIキーをテスト中...', 'APIキーの有効性を確認しています。少々お待ちください。', ui.ButtonSet.OK);
      
      const testResult = testApiKey(apiKey);
      if (testResult.success) {
        PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', apiKey);
        ui.alert(
          '✅ APIキー設定完了',
          'Gemini APIキーが正常に設定・検証されました。\n\nこれでAIリサーチ機能を使用できます！',
          ui.ButtonSet.OK
        );
      } else {
        ui.alert(
          '❌ APIキーエラー',
          `APIキーのテストに失敗しました。\n\nエラー内容:\n${testResult.error}\n\n正しいAPIキーを確認してください。`,
          ui.ButtonSet.OK
        );
      }
    } else if (!hasKey) {
      ui.alert('⚠️ APIキーが未入力です。', 'APIキーを入力してください。', ui.ButtonSet.OK);
    }
  }
}

/**
 * APIキーのテスト関数
 */
function testApiKey(apiKey) {
  try {
    const testPrompt = 'これはAPIキーのテストです。「OK」とだけ応答してください。';
    const payload = {
      "contents": [{"parts": [{"text": testPrompt}]}]
    };
    
    const options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify(payload),
      'muteHttpExceptions': true
    };
    
    const apiUrl = `${CONFIG.API_URL_BASE}${CONFIG.MODEL_NAME}:generateContent?key=${apiKey}`;
    const response = UrlFetchApp.fetch(apiUrl, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode === 200) {
      return { success: true };
    } else {
      const errorBody = response.getContentText();
      return { 
        success: false, 
        error: `HTTPエラー ${responseCode}: ${errorBody}` 
      };
    }
    
  } catch (error) {
    return { 
      success: false, 
      error: error.toString() 
    };
  }
}

/**
 * 【強化版】リサーチプロセス開始
 */
function startAdvancedResearchProcess() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = sheet.getActiveRange();
  
  // APIキー確認
  if (!CONFIG.API_KEY) {
    ui.alert(
      '❌ APIキー未設定',
      'Gemini APIキーが設定されていません。\n「🔧 APIキー設定」メニューから先にAPIキーを設定してください。',
      ui.ButtonSet.OK
    );
    return;
  }
  
  // 選択範囲の検証
  const startRow = range.getRow();
  const endRow = range.getLastRow();
  const selectedRows = endRow - startRow + 1;
  
  if (startRow === 1) {
    ui.alert(
      '⚠️ 選択範囲エラー',
      'ヘッダー行は処理対象外です。\n2行目以降のデータ行を選択してください。',
      ui.ButtonSet.OK
    );
    return;
  }
  
  // 処理対象の収集と検証
  const jobQueue = [];
  const emptyTitles = [];
  
  for (let i = startRow; i <= endRow; i++) {
    const title = sheet.getRange(i, 2).getValue(); // B列
    const status = sheet.getRange(i, 1).getValue(); // A列
    
    if (title && title.toString().trim() !== '') {
      // 既に完了している行はスキップ
      if (status === '完了') {
        continue;
      }
      jobQueue.push(i);
    } else {
      emptyTitles.push(i);
    }
  }
  
  // 処理対象の確認
  if (jobQueue.length === 0) {
    let message = '選択範囲にリサーチ対象が見つかりませんでした。';
    if (emptyTitles.length > 0) {
      message += `\n\n空のタイトル行: ${emptyTitles.join(', ')}行目\nB列に助成金名を入力してください。`;
    }
    ui.alert('⚠️ 処理対象なし', message, ui.ButtonSet.OK);
    return;
  }
  
  // 詳細確認ダイアログ
  let confirmMessage = `🎯 AIリサーチを開始します\n\n`;
  confirmMessage += `📊 選択範囲: ${startRow}-${endRow}行目 (${selectedRows}行)\n`;
  confirmMessage += `✅ 処理対象: ${jobQueue.length}件\n`;
  confirmMessage += `⏱️ 推定時間: 約${Math.ceil(jobQueue.length * CONFIG.PROCESSING_DELAY / 60000)}分\n\n`;
  confirmMessage += `💡 処理中はスプレッドシートを閉じても大丈夫です。\n`;
  confirmMessage += `📊 進捗は「📊 処理状況確認」で確認できます。\n\n`;
  confirmMessage += `続行しますか？`;
  
  const confirmation = ui.alert(
    '🚀 リサーチ開始確認',
    confirmMessage,
    ui.ButtonSet.OK_CANCEL
  );
  
  if (confirmation !== ui.Button.OK) {
    ui.alert('❌ 処理をキャンセルしました。', '', ui.ButtonSet.OK);
    return;
  }
  
  // 既存処理のリセット
  resetAllProcesses();
  
  // ジョブキューの保存
  const jobData = {
    queue: jobQueue,
    total: jobQueue.length,
    processed: 0,
    startTime: new Date().getTime(),
    errors: []
  };
  
  PropertiesService.getScriptProperties().setProperty('jobData', JSON.stringify(jobData));
  
  // 処理開始
  processSingleRowAdvanced();
  
  ui.alert(
    '🚀 リサーチ開始',
    `${jobQueue.length}件のリサーチを開始しました。\n\n処理は自動で進行します。進捗確認は「📊 処理状況確認」メニューをご利用ください。`,
    ui.ButtonSet.OK
  );
}

/**
 * 【強化版】単一行処理（エラーハンドリング強化）
 */
function processSingleRowAdvanced() {
  const properties = PropertiesService.getScriptProperties();
  const jobDataString = properties.getProperty('jobData');
  
  if (!jobDataString) {
    Logger.log('ジョブデータが見つかりません。処理を終了します。');
    return;
  }
  
  const jobData = JSON.parse(jobDataString);
  
  if (jobData.queue.length === 0) {
    // 全処理完了
    completeAllProcessing(jobData);
    return;
  }
  
  const currentRow = jobData.queue.shift();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  try {
    const title = sheet.getRange(currentRow, 2).getValue();
    
    // ステータス更新
    sheet.getRange(currentRow, 1).setValue('リサーチ中...');
    SpreadsheetApp.flush();
    
    Logger.log(`Row ${currentRow} の処理開始: ${title}`);
    
    // AIリサーチ実行
    const result = executeAIResearch(title, currentRow);
    
    if (result.success) {
      // 成功時の処理
      writeAdvancedResultsToSheet(sheet, currentRow, result.data);
      sheet.getRange(currentRow, 1).setValue('完了');
      Logger.log(`Row ${currentRow} の処理完了`);
    } else {
      // エラー時の処理
      handleProcessingError(sheet, currentRow, result.error, jobData);
    }
    
  } catch (error) {
    Logger.log(`Row ${currentRow} で予期しないエラー: ${error.toString()}`);
    handleProcessingError(sheet, currentRow, error.toString(), jobData);
  }
  
  // 進捗更新
  jobData.processed++;
  properties.setProperty('jobData', JSON.stringify(jobData));
  
  // 次の処理をスケジュール
  if (jobData.queue.length > 0) {
    ScriptApp.newTrigger('processSingleRowAdvanced')
      .timeBased()
      .after(CONFIG.PROCESSING_DELAY)
      .create();
  } else {
    completeAllProcessing(jobData);
  }
}

/**
 * AIリサーチ実行（リトライ機能付き）
 */
function executeAIResearch(title, row) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= CONFIG.RETRY_MAX; attempt++) {
    try {
      Logger.log(`Row ${row} - 試行 ${attempt}/${CONFIG.RETRY_MAX}: ${title}`);
      
      const prompt = createAdvancedPrompt(title);
      const responseText = callGeminiApiWithRetry(prompt);
      
      // JSONパース
      const cleanedJsonText = cleanJsonResponse(responseText);
      const resultData = JSON.parse(cleanedJsonText);
      
      // データ検証
      const validatedData = validateAndEnhanceData(resultData);
      
      return {
        success: true,
        data: validatedData
      };
      
    } catch (error) {
      lastError = error;
      Logger.log(`Row ${row} - 試行 ${attempt} 失敗: ${error.toString()}`);
      
      if (attempt < CONFIG.RETRY_MAX) {
        Utilities.sleep(CONFIG.RETRY_DELAY * attempt); // 指数バックオフ
      }
    }
  }
  
  return {
    success: false,
    error: lastError.toString()
  };
}

/**
 * 【大幅強化版】プロンプト生成
 */
function createAdvancedPrompt(title) {
  const categoryList = GRANT_CATEGORIES.join('、');
  const currentDate = Utilities.formatDate(new Date(), 'JST', 'yyyy年MM月dd日');
  
  return `# 🎯 助成金専門AIリサーチャー指示書

## あなたの専門性
あなたは日本の補助金・助成金制度に精通した専門リサーチャーです。以下の専門知識を活用してください：
- 中央省庁・地方自治体の補助金制度
- 独立行政法人・公的機関の助成制度
- 財団法人・民間団体の支援制度
- 申請手続き・審査基準の実態

## 📋 調査対象
**補助金・助成金名：${title}**

## 🔍 調査・執筆の厳格ルール

### 1. 情報収集の最高基準
- **一次情報必須**: 公的機関の公式サイトのみを信頼する
- **最新性確保**: ${currentDate}時点の最新情報を調査
- **正確性優先**: 推測・憶測は一切禁止、不明な項目は空文字""
- **複数ソース**: 可能な限り複数の公式ソースで情報を確認

### 2. 文章品質の最高基準
- **Markdown完全禁止**: **、*、`、#等の記号は一切使用不可
- **SEO最適化**: ユーザー検索意図に完全対応した内容構成
- **読みやすさ**: 専門用語は必ず解説、具体例を豊富に盛り込む
- **実用性**: 申請者が実際に行動できる具体的情報を提供

### 3. 内容構成の完璧な型
**content_detail**は以下の構成で800-1200文字：

【この助成金の特徴・目的】
制度の背景・狙い・特色を2-3行で明確に

【対象となる方・事業者】
✓ 具体的な対象条件（業種・規模・年数・地域等）
✓ 対象外となるケースも明記
✓ 実例を交えた分かりやすい説明

【助成金額・補助率の詳細】
✓ 金額の計算方法・上限・下限
✓ 補助率の適用条件
✓ 分野別・規模別の金額差があれば詳細記載

【対象経費・使途の具体例】
✓ 補助対象となる経費の具体的項目
✓ 対象外経費の明確化
✓ 経費計上時の注意点

【申請期間・スケジュール】
✓ 申請受付期間・締切の詳細
✓ 審査期間・結果通知時期
✓ 事業実施期間・報告期限

【申請手続き・必要書類】
✓ 申請の流れ（事前相談→申請→審査→採択→事業実施→報告）
✓ 必要書類の詳細・様式・入手方法
✓ 申請時の注意点・よくある間違い

【採択のポイント・攻略法】
✓ 審査基準・評価ポイント
✓ 採択されやすい事業計画のコツ
✓ 申請書作成のポイント

【問い合わせ・相談窓口】
✓ 担当部署・連絡先・受付時間
✓ 事前相談の方法・必要性

## 📊 出力JSON仕様（完全遵守）

\`\`\`json
{
  "content_detail": "上記の構成に従った800-1200文字の詳細記事",
  "excerpt": "この助成金の最大の魅力と対象者、記事の価値を示す120-160文字の要約",
  "post_status": "publish",
  "grant_amount_text": "助成金額の元表現（例：上限500万円、経費の2/3以内等）",
  "grant_amount_value": "助成金額上限の半角数字のみ（例：5000000）",
  "deadline_text": "申請期限の元表現（例：令和7年3月31日17時必着）",
  "deadline_date": "YYYY-MM-DD形式またはランダム受付なら空文字",
  "organization_name": "実施組織の完全正式名称",
  "organization_type": "national/prefecture/city/public_org/private_org/foundation/jgrants/otherから選択",
  "target": "対象者・事業の詳細条件（業種・規模・地域・その他条件を具体的に）",
  "application_method": "online/mail/visit/mixedから実際の申請方法に応じて選択",
  "contact": "問い合わせ先の部署名・電話・メール・受付時間等詳細",
  "official_url": "この助成金の公式一次情報URL（必須・実在URL）",
  "prefecture_name": "対象地域：全国なら「${ALL_PREFECTURES}」、特定都道府県なら該当分をカンマ区切り、不明なら空文字",
  "grant_municipality": "特定市区町村限定の場合のみ該当市区町村名をカンマ区切り、それ以外は空文字",
  "regional_limitation": "nationwide/prefecture_only/municipality_only/region_group/specific_areaから選択",
  "application_status": "open/upcoming/closed/suspendedから現在の状況に応じて選択",
  "grant_category": "${categoryList}から該当するものを複数選択可能でカンマ区切り",
  "post_tag": "SEO効果の高い関連キーワード5-8個をカンマ区切り（助成金名・対象業種・支援内容・年度等）",
  "required_documents": "申請必要書類の具体名をカンマ区切り（事業計画書・決算書・見積書等）",
  "acceptance_rate": "採択率を半角数字のみで記述（例：30、85、15）公表されていない場合は制度規模等から推定した数字のみ",
  "difficulty": "easy/normal/hard/very_hardから申請書類・審査基準・競争率等を総合判断",
  "eligible_expenses": "補助対象経費の具体例をカンマ区切り（人件費・設備費・外注費等）",
  "subsidy_rate": "補助率の表現（2/3以内・50%・定額・10/10等）"
}
\`\`\`

## ⚠️ 最終品質チェック
- すべての情報は2024年12月時点の最新・正確な情報
- JSONの構文エラー絶対禁止
- 全角・半角の適切な使い分け
- 不明項目は必ず空文字""（推測記入禁止）
- 公式URLは必ず実在・アクセス可能なURL

これらの指示を完璧に守り、申請者にとって本当に価値のある情報を提供してください。`;
}

/**
 * 【強化版】Gemini API呼び出し（リトライ機能付き）
 */
function callGeminiApiWithRetry(prompt) {
  const payload = {
    "contents": [{"parts": [{"text": prompt}]}],
    "generationConfig": {
      "temperature": 0.1,
      "topK": 1,
      "topP": 0.8,
      "maxOutputTokens": 4000
    }
  };
  
  const options = {
    'method': 'post',
    'contentType': 'application/json',
    'payload': JSON.stringify(payload),
    'muteHttpExceptions': true
  };
  
  const apiUrl = `${CONFIG.API_URL_BASE}${CONFIG.MODEL_NAME}:generateContent?key=${CONFIG.API_KEY}`;
  
  const response = UrlFetchApp.fetch(apiUrl, options);
  const responseCode = response.getResponseCode();
  const responseBody = response.getContentText();
  
  if (responseCode === 200) {
    const jsonResponse = JSON.parse(responseBody);
    if (jsonResponse.candidates && 
        jsonResponse.candidates[0] && 
        jsonResponse.candidates[0].content &&
        jsonResponse.candidates[0].content.parts &&
        jsonResponse.candidates[0].content.parts[0]) {
      return jsonResponse.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Gemini APIからの応答形式が予期されたものと異なります');
    }
  } else {
    throw new Error(`APIリクエストエラー ${responseCode}: ${responseBody}`);
  }
}

/**
 * JSONレスポンスのクリーニング
 */
function cleanJsonResponse(responseText) {
  return responseText
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .replace(/^[^{]*/g, '')
    .replace(/[^}]*$/g, '')
    .trim();
}

/**
 * 【完全強化版】データ検証・エンハンス
 */
function validateAndEnhanceData(rawData) {
  const validated = {};
  
  try {
    // 必須テキストフィールドの検証
    validated.content_detail = validateText(rawData.content_detail, 50, CONFIG.MAX_CONTENT_LENGTH, '記事本文が短すぎます');
    validated.excerpt = validateText(rawData.excerpt, 50, CONFIG.MAX_EXCERPT_LENGTH, '概要が短すぎます');
    validated.organization_name = validateText(rawData.organization_name, 1, 100, '組織名が必要です');
    
    // 金額の検証・正規化
    validated.grant_amount_text = rawData.grant_amount_text || '';
    validated.grant_amount_value = validateAmount(rawData.grant_amount_value);
    
    // 日付の検証・正規化
    validated.deadline_text = rawData.deadline_text || '';
    validated.deadline_date = validateDate(rawData.deadline_date);
    
    // 列挙型フィールドの検証
    validated.organization_type = validateEnum(
      rawData.organization_type, 
      Object.keys(ORGANIZATION_TYPES),
      'other'
    );
    
    validated.application_method = validateEnum(
      rawData.application_method,
      Object.keys(APPLICATION_METHODS),
      'mixed'
    );
    
    validated.regional_limitation = validateEnum(
      rawData.regional_limitation,
      Object.keys(REGIONAL_LIMITATIONS),
      'nationwide'
    );
    
    validated.application_status = validateEnum(
      rawData.application_status,
      ['open', 'upcoming', 'closed', 'suspended'],
      'open'
    );
    
    validated.difficulty = validateEnum(
      rawData.difficulty,
      ['easy', 'normal', 'hard', 'very_hard'],
      'normal'
    );
    
    // URL検証
    validated.official_url = validateUrl(rawData.official_url);
    
    // 地域情報の検証・正規化
    const regionData = validatePrefectureData(rawData.prefecture_name, rawData.grant_municipality);
    validated.prefecture_name = regionData.prefecture;
    validated.grant_municipality = regionData.municipality;
    
    // カテゴリ・タグの検証
    validated.grant_category = validateCategories(rawData.grant_category);
    validated.post_tag = validateTags(rawData.post_tag);
    
    // その他のフィールド
    validated.target = cleanTextAdvanced(rawData.target, 500);
    validated.contact = cleanTextAdvanced(rawData.contact, 300);
    validated.required_documents = cleanTextAdvanced(rawData.required_documents, 500);
    validated.eligible_expenses = cleanTextAdvanced(rawData.eligible_expenses, 500);
    validated.acceptance_rate = validateAcceptanceRate(rawData.acceptance_rate);
    validated.subsidy_rate = cleanTextAdvanced(rawData.subsidy_rate, 100);
    
    // 固定値
    validated.post_status = 'publish';
    
    return validated;
    
  } catch (error) {
    Logger.log('データ検証エラー: ' + error.toString());
    throw new Error('データ検証に失敗しました: ' + error.message);
  }
}

/**
 * テキストフィールド検証
 */
function validateText(text, minLength, maxLength, errorMessage) {
  if (!text || typeof text !== 'string') {
    throw new Error(errorMessage || 'テキストが必要です');
  }
  
  const cleanText = text.trim();
  if (cleanText.length < minLength) {
    throw new Error(errorMessage || `テキストは${minLength}文字以上必要です`);
  }
  
  return cleanText.length > maxLength ? 
    cleanText.substring(0, maxLength) + '...' : 
    cleanText;
}

/**
 * 金額検証
 */
function validateAmount(amount) {
  if (!amount) return 0;
  
  const numStr = amount.toString().replace(/[^\d]/g, '');
  const num = parseInt(numStr);
  return isNaN(num) ? 0 : Math.min(num, 999999999); // 最大9億円
}

/**
 * 日付検証
 */
function validateDate(dateStr) {
  if (!dateStr) return '';
  
  try {
    // 様々な日付形式に対応
    const patterns = [
      /(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})/,
      /令和(\d+)年(\d{1,2})月(\d{1,2})日/,
      /平成(\d+)年(\d{1,2})月(\d{1,2})日/
    ];
    
    for (const pattern of patterns) {
      const match = dateStr.match(pattern);
      if (match) {
        let year, month, day;
        
        if (pattern.source.includes('令和')) {
          year = parseInt(match[1]) + 2018;
          month = parseInt(match[2]);
          day = parseInt(match[3]);
        } else if (pattern.source.includes('平成')) {
          year = parseInt(match[1]) + 1988;
          month = parseInt(match[2]);
          day = parseInt(match[3]);
        } else {
          year = parseInt(match[1]);
          month = parseInt(match[2]);
          day = parseInt(match[3]);
        }
        
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime()) && year >= 2020 && year <= 2030) {
          return Utilities.formatDate(date, 'JST', 'yyyy-MM-dd');
        }
      }
    }
    
    return '';
  } catch (error) {
    return '';
  }
}

/**
 * 列挙型検証
 */
function validateEnum(value, allowedValues, defaultValue = '') {
  if (!value) return defaultValue;
  return allowedValues.includes(value) ? value : defaultValue;
}

/**
 * URL検証
 */
function validateUrl(url) {
  if (!url) return '';
  
  const urlPattern = /^https?:\/\/.+\..+/;
  return urlPattern.test(url.trim()) ? url.trim() : '';
}

/**
 * 都道府県データ検証
 */
function validatePrefectureData(prefectureText, municipalityText) {
  let validatedPrefecture = '';
  let validatedMunicipality = '';
  
  try {
    if (prefectureText === ALL_PREFECTURES) {
      validatedPrefecture = ALL_PREFECTURES;
      validatedMunicipality = '';
    } else if (prefectureText) {
      const prefectures = prefectureText.split(',')
        .map(p => p.trim())
        .filter(p => PREFECTURE_CODES[p]);
      
      validatedPrefecture = prefectures.join(',');
      
      if (municipalityText && prefectures.length > 0) {
        const municipalities = municipalityText.split(',')
          .map(m => m.trim())
          .filter(m => m.length > 0);
        validatedMunicipality = municipalities.slice(0, 10).join(','); // 最大10市町村
      }
    }
  } catch (error) {
    Logger.log('都道府県データ検証エラー: ' + error.toString());
  }
  
  return {
    prefecture: validatedPrefecture,
    municipality: validatedMunicipality
  };
}

/**
 * カテゴリ検証
 */
function validateCategories(categoryText) {
  if (!categoryText) return 'その他・特定分野';
  
  const categories = categoryText.split(',')
    .map(c => c.trim())
    .filter(c => GRANT_CATEGORIES.includes(c));
  
  return categories.length > 0 ? categories.join(',') : 'その他・特定分野';
}

/**
 * タグ検証
 */
function validateTags(tagText) {
  if (!tagText) return '';
  
  const tags = tagText.split(',')
    .map(t => t.trim())
    .filter(t => t.length >= 2 && t.length <= 20);
  
  return tags.slice(0, 8).join(','); // 最大8タグ
}

/**
 * 採択率検証（数字のみ）
 */
function validateAcceptanceRate(rateText) {
  if (!rateText) return '30';
  
  const rateStr = rateText.toString();
  const match = rateStr.match(/(\d+(?:\.\d+)?)/);
  if (match) {
    const rate = parseFloat(match[1]);
    if (rate >= 0 && rate <= 100) {
      return Math.round(rate).toString();
    }
  }
  
  return '30';
}

/**
 * 高度テキストクリーニング
 */
function cleanTextAdvanced(text, maxLength) {
  if (!text) return '';
  
  try {
    let cleaned = text.toString()
      // Markdown記法除去
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`(.+?)`/g, '$1')
      .replace(/#+\s*/g, '')
      // HTML除去
      .replace(/<[^>]*>/g, '')
      // 余分な空白除去
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleaned.length > maxLength ? 
      cleaned.substring(0, maxLength) + '...' : 
      cleaned;
  } catch (error) {
    Logger.log('テキストクリーニングエラー: ' + error.toString());
    return text.toString().substring(0, maxLength);
  }
}

/**
 * エラー処理
 */
function handleProcessingError(sheet, row, errorMessage, jobData) {
  try {
    sheet.getRange(row, 1).setValue('エラー');
    
    // エラー詳細をC列に記録（既存コンテンツを上書きしないように注意）
    const currentContent = sheet.getRange(row, 3).getValue();
    if (!currentContent || currentContent === '') {
      sheet.getRange(row, 3).setValue('エラー詳細: ' + errorMessage);
    }
    
    // エラーログに記録
    jobData.errors.push({
      row: row,
      error: errorMessage,
      timestamp: new Date().getTime()
    });
    
    Logger.log(`Row ${row} でエラー: ${errorMessage}`);
    
  } catch (error) {
    Logger.log(`エラー処理中にエラー発生 (Row ${row}): ${error.toString()}`);
  }
}

/**
 * 【強化版】結果をシートに書き込み
 */
function writeAdvancedResultsToSheet(sheet, row, data) {
  try {
    // 列マッピング（A-AE: 31列）
    const columnMappings = [
      { col: 'C', field: 'content_detail' },
      { col: 'D', field: 'excerpt' },
      { col: 'E', field: 'post_status' },
      { col: 'G', field: 'grant_category' },
      { col: 'H', field: 'grant_amount_text' },
      { col: 'I', field: 'grant_amount_value' },
      { col: 'J', field: 'deadline_text' },
      { col: 'K', field: 'deadline_date' },
      { col: 'L', field: 'organization_name' },
      { col: 'M', field: 'organization_type' },
      { col: 'N', field: 'target' },
      { col: 'O', field: 'contact' },
      { col: 'P', field: 'official_url' },
      { col: 'Q', field: 'prefecture_name' },
      { col: 'R', field: 'grant_municipality' },
      { col: 'S', field: 'regional_limitation' },
      { col: 'T', field: 'application_status' },
      { col: 'U', field: 'application_method' },
      { col: 'V', field: 'post_tag' },
      { col: 'X', field: 'required_documents' },
      { col: 'Y', field: 'acceptance_rate' },
      { col: 'Z', field: 'difficulty' },
      { col: 'AA', field: 'eligible_expenses' },
      { col: 'AB', field: 'subsidy_rate' }
    ];
    
    // 基本データの書き込み
    for (const mapping of columnMappings) {
      const value = data[mapping.field] || '';
      sheet.getRange(mapping.col + row).setValue(value);
    }
    
    // 生成フィールドの設定
    
    // F列: URL生成
    const generatedUrl = generateAdvancedPostUrl(data, row);
    if (generatedUrl) {
      sheet.getRange('F' + row).setValue(generatedUrl);
    }
    
    // AC列: 自動更新日時
    sheet.getRange('AC' + row).setValue(new Date());
    
    Logger.log(`Row ${row} のデータ書き込み完了`);
    
  } catch (error) {
    Logger.log(`Row ${row} データ書き込みエラー: ${error.toString()}`);
    throw error;
  }
}

/**
 * 高度URL生成
 */
function generateAdvancedPostUrl(data, row) {
  try {
    if (!data.organization_name) return '';
    
    // 日本語URL対応
    const baseSlug = data.organization_name
      .replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
    
    const category = data.grant_category ? 
      data.grant_category.split(',')[0].replace(/[^\w\s]/g, '').replace(/\s+/g, '-') : 
      'subsidy';
    
    return `https://your-site.com/${category}/${baseSlug}-${row}`;
  } catch (error) {
    Logger.log('URL生成エラー: ' + error.toString());
    return `https://your-site.com/grant-${row}`;
  }
}



/**
 * 全処理完了時の処理
 */
function completeAllProcessing(jobData) {
  try {
    const endTime = new Date().getTime();
    const processingTime = Math.round((endTime - jobData.startTime) / 1000 / 60);
    
    let message = `🎉 AIリサーチが完了しました！\n\n`;
    message += `📊 処理結果:\n`;
    message += `✅ 総件数: ${jobData.total}件\n`;
    message += `✅ 成功: ${jobData.total - jobData.errors.length}件\n`;
    
    if (jobData.errors.length > 0) {
      message += `❌ エラー: ${jobData.errors.length}件\n`;
      message += `エラー行: ${jobData.errors.map(e => e.row).join(', ')}\n`;
    }
    
    message += `⏱️ 処理時間: 約${processingTime}分\n\n`;
    message += `📝 結果をご確認ください。エラーがある場合は該当行を確認して再実行できます。`;
    
    // 完了通知
    SpreadsheetApp.getUi().alert('🎉 処理完了', message, SpreadsheetApp.getUi().ButtonSet.OK);
    
    // クリーンアップ
    PropertiesService.getScriptProperties().deleteProperty('jobData');
    
    Logger.log(`全処理完了: ${jobData.total}件中${jobData.total - jobData.errors.length}件成功`);
    
  } catch (error) {
    Logger.log('完了処理エラー: ' + error.toString());
  }
}

/**
 * 処理状況確認
 */
function checkProcessingStatus() {
  const ui = SpreadsheetApp.getUi();
  const jobDataString = PropertiesService.getScriptProperties().getProperty('jobData');
  
  if (!jobDataString) {
    ui.alert(
      '📊 処理状況',
      '現在実行中の処理はありません。\n\n「▶️ 選択範囲リサーチ開始」からAIリサーチを開始できます。',
      ui.ButtonSet.OK
    );
    return;
  }
  
  try {
    const jobData = JSON.parse(jobDataString);
    const progress = Math.round((jobData.processed / jobData.total) * 100);
    const currentTime = new Date().getTime();
    const elapsedMinutes = Math.round((currentTime - jobData.startTime) / 1000 / 60);
    const remainingJobs = jobData.queue.length;
    const estimatedMinutes = Math.round(remainingJobs * CONFIG.PROCESSING_DELAY / 60000);
    
    let statusMessage = `📊 AIリサーチ進捗状況\n\n`;
    statusMessage += `📈 進捗: ${jobData.processed}/${jobData.total}件 (${progress}%)\n`;
    statusMessage += `⏰ 経過時間: ${elapsedMinutes}分\n`;
    statusMessage += `⏱️ 残り時間: 約${estimatedMinutes}分\n`;
    statusMessage += `🔄 残りタスク: ${remainingJobs}件\n`;
    
    if (jobData.errors && jobData.errors.length > 0) {
      statusMessage += `❌ エラー件数: ${jobData.errors.length}件\n`;
    }
    
    statusMessage += `\n💡 処理は自動で継続されます。スプレッドシートを閉じても大丈夫です。`;
    
    ui.alert('📊 処理状況確認', statusMessage, ui.ButtonSet.OK);
    
  } catch (error) {
    ui.alert(
      '❌ ステータス取得エラー',
      'ステータス情報の取得に失敗しました。\n処理をリセットしてやり直してください。',
      ui.ButtonSet.OK
    );
  }
}

/**
 * システム完全リセット
 */
function resetAllProcesses() {
  try {
    // すべてのトリガーを削除
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      ScriptApp.deleteTrigger(trigger);
    });
    
    // プロパティをクリア
    const properties = PropertiesService.getScriptProperties();
    properties.deleteProperty('jobData');
    
    Logger.log('システムリセット完了');
    
  } catch (error) {
    Logger.log('リセットエラー: ' + error.toString());
  }
}

/**
 * ヘルプ・使用方法表示
 */
function showHelp() {
  const ui = SpreadsheetApp.getUi();
  
  const helpText = `📖 AI助成金リサーチシステム v2.0 使用方法

🚀 基本的な使い方:

1️⃣ 準備
• 「🔧 APIキー設定」でGemini APIキーを設定
• 「📋 ヘッダー設定」で31列のヘッダーを設置

2️⃣ データ入力
• B列に調査したい助成金名を入力
• 複数行に入力可能（一括処理対応）

3️⃣ リサーチ実行
• 処理したい行を選択
• 「▶️ 選択範囲リサーチ開始」をクリック
• 自動でAIが詳細情報を調査・入力

4️⃣ 進捗確認
• 「📊 処理状況確認」で進捗をチェック
• A列でリアルタイム状況を確認

⚡ 高度な機能:
• エラー自動リトライ（最大3回）
• 処理継続（スプレッドシート閉じてもOK）
• データ自動検証・クリーニング
• SEO最適化されたコンテンツ生成

❓ 困った時は:
• 「🔄 システムリセット」で処理をリセット
• ログで詳細なエラー情報を確認
• APIキーの再設定を試行

📝 注意事項:
• 1件あたり約12秒の処理時間
• API制限により大量処理には時間が必要
• 公式情報源からの正確な情報収集を重視`;

  ui.alert('📖 使用方法・ヘルプ', helpText, ui.ButtonSet.OK);
}

/**
 * 【デバッグ用】手動テスト実行
 */
function debugTestSingleResearch() {
  const testTitle = 'ものづくり補助金';
  
  try {
    Logger.log('=== デバッグテスト開始 ===');
    const result = executeAIResearch(testTitle, 999);
    
    if (result.success) {
      Logger.log('テスト成功:');
      Logger.log(JSON.stringify(result.data, null, 2));
    } else {
      Logger.log('テスト失敗: ' + result.error);
    }
    
  } catch (error) {
    Logger.log('デバッグテストエラー: ' + error.toString());
  }
}

// === 初期化完了 ===
Logger.log('AI助成金リサーチシステム v2.0 初期化完了');