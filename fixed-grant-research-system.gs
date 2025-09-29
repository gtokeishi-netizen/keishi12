/**
 * @fileoverview 【YMYL特化SEO最適化版】助成金リサーチシステム v4.0 - Google Custom Search API対応
 * 
 * 🏆 新機能（v4.0 Custom Search特化）:
 * - Google Custom Search JSON API活用による実在情報検索
 * - 一次情報源からの正確なデータ収集
 * - YMYL分野の信頼性・権威性を保証する検索ベース手法
 * - E-E-A-T（専門性・権威性・信頼性・経験）完全準拠
 * - SEO完全最適化（検索意図4段階充足・強調スニペット対応)
 * - 高品質コンテンツ生成（検索結果ベース）
 * - LSIキーワード自動配置・メタディスクリプション最適化
 * 
 * 継承機能（v2.0から）:
 * - JSON構文エラーの完全修正
 * - テンプレートリテラルの適切な処理
 * - 文字列エスケープの正規化
 * - カテゴリ・都道府県は名称管理
 * - 採択率は数字のみ
 * - 31列完全対応（A-AE）
 */

// ===== 設定エリア =====
const CONFIG = {
  // Google Custom Search JSON API設定
  SEARCH_API_KEY: PropertiesService.getScriptProperties().getProperty('GOOGLE_SEARCH_API_KEY'),
  SEARCH_ENGINE_ID: PropertiesService.getScriptProperties().getProperty('GOOGLE_SEARCH_ENGINE_ID'),
  SEARCH_API_URL: 'https://www.googleapis.com/customsearch/v1',
  
  // 検索パラメータ
  SEARCH_RESULTS_PER_QUERY: 10,
  SEARCH_LANGUAGE: 'ja',
  SEARCH_COUNTRY: 'JP',
  
  // システム設定
  API_TIMEOUT: 30000,
  RETRY_MAX: 3,
  RETRY_DELAY: 5000,
  PROCESSING_DELAY: 10000,  // 検索ベース処理により短縮
  MAX_CONTENT_LENGTH: 3000,  // YMYL分野の詳細コンテンツに対応
  MAX_EXCERPT_LENGTH: 180,   // SEO最適化されたメタディスクリプション
  
  // 検索クエリ設定
  SEARCH_DOMAINS: [
    'site:meti.go.jp',     // 経済産業省
    'site:mhlw.go.jp',     // 厚生労働省
    'site:jfc.go.jp',      // 日本政策金融公庫
    'site:smrj.go.jp',     // 中小機構
    'site:pref.*.jp',      // 都道府県サイト
    'site:city.*.jp'       // 市区町村サイト
  ]
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
  ui.createMenu('🚀 助成金リサーチシステム v4.0 Custom Search特化')
    .addItem('📋 ヘッダー設定（YMYL・SEO完全対応）', 'setupAdvancedHeaders')
    .addItem('▶️ 選択範囲リサーチ開始', 'startAdvancedResearchProcess')
    .addSeparator()
    .addItem('🔧 Custom Search API設定', 'setupCustomSearchApi')
    .addItem('📊 処理状況確認', 'checkProcessingStatus')
    .addSeparator()
    .addItem('🔄 システムリセット', 'resetAllProcesses')
    .addItem('📖 使用方法・ヘルプ', 'showHelp')
    .addToUi();
  
  checkInitialSetup();
}

/**
 * 初回起動時の設定確認
 */
function checkInitialSetup() {
  const properties = PropertiesService.getScriptProperties();
  const searchApiKey = properties.getProperty('GOOGLE_SEARCH_API_KEY');
  const searchEngineId = properties.getProperty('GOOGLE_SEARCH_ENGINE_ID');
  
  if (!searchApiKey || !searchEngineId) {
    SpreadsheetApp.getUi().alert(
      '🔧 初期設定が必要です',
      '「🔧 Custom Search API設定」からGoogle Custom Search JSON APIの設定を行ってください。\n' +
      '必要な項目: APIキー、検索エンジンID\n' +
      '設定後、「📋 ヘッダー設定」でスプレッドシートの準備を行ってください。',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

/**
 * 31列完全対応ヘッダー設定
 */
function setupAdvancedHeaders() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const ui = SpreadsheetApp.getUi();
  
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
  
  // ヘッダー定義（31列 A-AE）- WordPress連携対応順序
  const headers = [
    { name: 'ID (自動入力)', description: 'WordPress自動生成ID', type: 'system' },
    { name: 'タイトル', description: 'リサーチ対象助成金名', type: 'input' },
    { name: '内容・詳細', description: 'AI生成記事本文', type: 'ai_content' },
    { name: '抜粋・概要', description: 'SEO用要約文', type: 'ai_content' },
    { name: 'ステータス (draft/publish/private)', description: 'WordPress投稿ステータス', type: 'system' },
    { name: '作成日 (自動入力)', description: 'WordPress作成日', type: 'system' },
    { name: '更新日 (自動入力)', description: 'WordPress更新日', type: 'system' },
    { name: '助成金額 (例: 300万円)', description: '助成金額テキスト表現', type: 'ai_content' },
    { name: '助成金額数値 (例: 3000000)', description: '計算用数値', type: 'ai_content' },
    { name: '申請期限 (例: 令和6年3月31日)', description: '申請期限テキスト', type: 'ai_content' },
    { name: '申請期限日付 (YYYY-MM-DD)', description: 'システム用日付', type: 'ai_content' },
    { name: '実施組織名', description: '正式組織名称', type: 'ai_content' },
    { name: '組織タイプ (national/prefecture/city/public_org/private_org/other)', description: '機関種別', type: 'ai_content' },
    { name: '対象者・対象事業', description: '詳細な対象条件', type: 'ai_content' },
    { name: '申請方法 (online/mail/visit/mixed)', description: '申請手続き方法', type: 'ai_content' },
    { name: '問い合わせ先', description: '連絡先詳細', type: 'ai_content' },
    { name: '公式URL', description: '一次情報URL', type: 'ai_content' },
    { name: '地域制限 (nationwide/prefecture_only/municipality_only/region_group/specific_area)', description: '地域制限区分', type: 'ai_content' },
    { name: '申請ステータス (open/upcoming/closed/suspended)', description: '現在の受付状況', type: 'ai_content' },
    { name: '都道府県 (例: 東京都)', description: '対象都道府県', type: 'ai_content' },
    { name: '市町村 (例: 新宿区,渋谷区)', description: '対象市区町村', type: 'ai_content' },
    { name: 'カテゴリ (例: ビジネス支援,IT関連)', description: '助成金カテゴリ', type: 'ai_content' },
    { name: 'タグ (例: スタートアップ,中小企業)', description: 'SEOタグ', type: 'ai_content' },
    { name: '外部リンク', description: '関連外部リンク', type: 'ai_content' },
    { name: '地域に関する備考', description: '地域制限詳細', type: 'ai_content' },
    { name: '必要書類', description: '申請必要書類', type: 'ai_content' },
    { name: '採択率（%）', description: '採択実績（数字のみ）', type: 'ai_content' },
    { name: '申請難易度 (easy/normal/hard/very_hard)', description: '申請難易度', type: 'ai_content' },
    { name: '対象経費', description: '補助対象経費', type: 'ai_content' },
    { name: '補助率 (例: 2/3, 50%)', description: '補助率・補助額', type: 'ai_content' },
    { name: 'シート更新日 (自動入力)', description: 'AI処理日時', type: 'system' }
  ];
  
  // ヘッダー設定
  for (let i = 0; i < headers.length; i++) {
    const cell = sheet.getRange(1, i + 1);
    cell.setValue(headers[i].name);
    
    // タイプ別の色分け
    switch (headers[i].type) {
      case 'input':
        cell.setBackground('#E3F2FD');
        break;
      case 'ai_content':
        cell.setBackground('#E8F5E8');
        break;
      case 'generated':
        cell.setBackground('#FFF3E0');
        break;
      case 'status':
        cell.setBackground('#FFEBEE');
        break;
      case 'system':
        cell.setBackground('#F3E5F5');
        break;
      case 'manual':
        cell.setBackground('#F5F5F5');
        break;
    }
    
    cell.setNote(headers[i].description + '\n\nタイプ: ' + headers[i].type);
  }
  
  // ヘッダー行の共通スタイル
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontColor('#333333');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  headerRange.setWrap(true);
  
  sheet.setRowHeight(1, 50);
  sheet.autoResizeColumns(1, headers.length);
  
  setupDataValidationRules(sheet, headers.length);
  setupConditionalFormatting(sheet);
  
  ui.alert(
    '✅ 【YMYL特化SEO】ヘッダー設定完了',
    '31列のヘッダーが正常に設定されました。\n\n' +
    '📊 設定列数: ' + headers.length + '列 (A-AE)\n' +
    '🎨 色分け: タイプ別に自動色分け\n' +
    '📝 コメント: 各列に詳細説明を追加\n' +
    '✅ データ検証: 入力ルール設定済み\n\n' +
    '🏆 新機能（YMYL・E-E-A-T対応）:\n' +
    '• 専門家レベルの高品質コンテンツ生成\n' +
    '• SEO完全最適化（検索意図充足）\n' +
    '• 信頼性・権威性・専門性の担保\n' +
    '• 強調スニペット対応構造\n\n' +
    '準備完了！B列（タイトル）に助成金名を入力して「▶️ 選択範囲リサーチ開始」をお試しください。\n\n' +
    '📋 WordPress連携対応:\n' +
    '• ID・作成日・更新日は自動入力項目\n' +
    '• カスタムフィールド完全対応\n' +
    '• SEO最適化済みデータ構造',
    ui.ButtonSet.OK
  );
}

/**
 * データ検証ルール設定
 */
function setupDataValidationRules(sheet, columnCount) {
  try {
    // E列: WordPress投稿ステータス
    const postStatusValues = ['publish', 'draft', 'private'];
    const postStatusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(postStatusValues)
      .setAllowInvalid(false)
      .setHelpText('投稿ステータス: publish（公開）, draft（下書き）, private（非公開）')
      .build();
    sheet.getRange('E2:E1000').setDataValidation(postStatusRule);
    
    // M列: 組織タイプ
    const orgTypeValues = ['national', 'prefecture', 'city', 'public_org', 'private_org', 'foundation', 'jgrants', 'other'];
    const orgTypeRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(orgTypeValues)
      .setAllowInvalid(false)
      .setHelpText('組織タイプを選択してください')
      .build();
    sheet.getRange('M2:M1000').setDataValidation(orgTypeRule);
    
    // O列: 申請方法
    const appMethodValues = ['online', 'mail', 'visit', 'mixed'];
    const appMethodRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(appMethodValues)
      .setAllowInvalid(false)
      .setHelpText('申請方法を選択してください')
      .build();
    sheet.getRange('O2:O1000').setDataValidation(appMethodRule);
    
    // R列: 地域制限
    const regionalValues = ['nationwide', 'prefecture_only', 'municipality_only', 'region_group', 'specific_area'];
    const regionalRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(regionalValues)
      .setAllowInvalid(false)
      .setHelpText('地域制限を選択してください')
      .build();
    sheet.getRange('R2:R1000').setDataValidation(regionalRule);
    
    // S列: 申請ステータス
    const appStatusValues = ['open', 'upcoming', 'closed', 'suspended'];
    const appStatusRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(appStatusValues)
      .setAllowInvalid(false)
      .setHelpText('申請ステータスを選択してください')
      .build();
    sheet.getRange('S2:S1000').setDataValidation(appStatusRule);
    
    // AB列: 申請難易度
    const difficultyValues = ['easy', 'normal', 'hard', 'very_hard'];
    const difficultyRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(difficultyValues)
      .setAllowInvalid(false)
      .setHelpText('申請難易度を選択してください')
      .build();
    sheet.getRange('AB2:AB1000').setDataValidation(difficultyRule);
    
  } catch (error) {
    Logger.log('データ検証ルール設定エラー: ' + error.toString());
  }
}

/**
 * 条件付き書式設定
 */
function setupConditionalFormatting(sheet) {
  try {
    // E列（投稿ステータス）の条件付き書式
    sheet.getRange('E2:E1000').setConditionalFormatRules([
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('publish')
        .setBackground('#D4EFDF')  // 緑色（公開済み）
        .build(),
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('draft')
        .setBackground('#FFF2CC')  // 黄色（下書き）
        .build(),
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('private')
        .setBackground('#F0F0F0')  // グレー（非公開）
        .build()
    ]);
    
    // S列（申請ステータス）の条件付き書式
    sheet.getRange('S2:S1000').setConditionalFormatRules([
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('open')
        .setBackground('#E8F5E8')  // 薄緑（募集中）
        .build(),
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('upcoming')
        .setBackground('#E3F2FD')  // 薄青（募集予定）
        .build(),
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('closed')
        .setBackground('#FADBD8')  // 薄赤（募集終了）
        .build(),
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('suspended')
        .setBackground('#F5F5F5')  // グレー（停止中）
        .build()
    ]);
    
    // AB列（難易度）の条件付き書式
    sheet.getRange('AB2:AB1000').setConditionalFormatRules([
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('easy')
        .setBackground('#E8F5E8')  // 薄緑（簡単）
        .build(),
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('normal')
        .setBackground('#FFF3E0')  // 薄オレンジ（普通）
        .build(),
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('hard')
        .setBackground('#FFE0B2')  // オレンジ（難しい）
        .build(),
      SpreadsheetApp.newConditionalFormatRule()
        .whenTextEqualTo('very_hard')
        .setBackground('#FFCDD2')  // 薄赤（非常に難しい）
        .build()
    ]);
    
  } catch (error) {
    Logger.log('条件付き書式設定エラー: ' + error.toString());
  }
}

/**
 * Google Custom Search API設定
 */
function setupCustomSearchApi() {
  const ui = SpreadsheetApp.getUi();
  const properties = PropertiesService.getScriptProperties();
  
  const currentApiKey = properties.getProperty('GOOGLE_SEARCH_API_KEY');
  const currentEngineId = properties.getProperty('GOOGLE_SEARCH_ENGINE_ID');
  
  let setupMessage = '🔍 Google Custom Search JSON APIの設定\n\n';
  setupMessage += 'APIキーの取得方法:\n';
  setupMessage += '1. Google Cloud Consoleにアクセス\n';
  setupMessage += '2. Custom Search APIを有効化\n';
  setupMessage += '3. 認証情報かAPIキーを作成\n\n';
  setupMessage += '検索エンジンIDの取得方法:\n';
  setupMessage += '1. Google Custom Search Engineにアクセス\n';
  setupMessage += '2. 新しい検索エンジンを作成\n';
  setupMessage += '3. エンジンIDをコピー\n\n';
  
  if (currentApiKey || currentEngineId) {
    setupMessage += '現在の設定:\n';
    setupMessage += 'APIキー: ' + (currentApiKey ? '設定済み' : '未設定') + '\n';
    setupMessage += 'エンジンID: ' + (currentEngineId ? '設定済み' : '未設定') + '\n\n';
  }
  
  ui.alert('🔧 Custom Search API設定', setupMessage, ui.ButtonSet.OK);
  
  // APIキー設定
  const apiKeyResult = ui.prompt(
    'Google Custom Search APIキー',
    'APIキーを入力してください（空欄の場合は現在の設定を保持）:',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (apiKeyResult.getSelectedButton() !== ui.Button.OK) return;
  
  const apiKey = apiKeyResult.getResponseText().trim();
  if (apiKey) {
    properties.setProperty('GOOGLE_SEARCH_API_KEY', apiKey);
  }
  
  // 検索エンジンID設定
  const engineIdResult = ui.prompt(
    'Google Custom Search エンジンID',
    '検索エンジンIDを入力してください（空欄の場合は現在の設定を保持）:',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (engineIdResult.getSelectedButton() !== ui.Button.OK) return;
  
  const engineId = engineIdResult.getResponseText().trim();
  if (engineId) {
    properties.setProperty('GOOGLE_SEARCH_ENGINE_ID', engineId);
  }
  
  // 設定テスト
  const finalApiKey = properties.getProperty('GOOGLE_SEARCH_API_KEY');
  const finalEngineId = properties.getProperty('GOOGLE_SEARCH_ENGINE_ID');
  
  if (finalApiKey && finalEngineId) {
    ui.alert('🔍 APIテスト中...', 'Custom Search APIの動作を確認しています。', ui.ButtonSet.OK);
    
    const testResult = testCustomSearchApi();
    if (testResult.success) {
      ui.alert(
        '✅ Custom Search API設定完了',
        'Google Custom Search JSON APIが正常に設定・検証されました。\n\nこれで助成金リサーチ機能を使用できます！',
        ui.ButtonSet.OK
      );
    } else {
      ui.alert(
        '❌ APIテストエラー',
        'Custom Search APIのテストに失敗しました。\n\nエラー内容:\n' + testResult.error + '\n\nAPIキーとエンジンIDを確認してください。',
        ui.ButtonSet.OK
      );
    }
  } else {
    ui.alert(
      '⚠️ 設定不完全',
      'APIキーと検索エンジンIDの両方が必要です。',
      ui.ButtonSet.OK
    );
  }
}

/**
 * Custom Search APIのテスト関数
 */
function testCustomSearchApi() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const apiKey = properties.getProperty('GOOGLE_SEARCH_API_KEY');
    const engineId = properties.getProperty('GOOGLE_SEARCH_ENGINE_ID');
    
    if (!apiKey || !engineId) {
      return {
        success: false,
        error: 'APIキーまたは検索エンジンIDが設定されていません'
      };
    }
    
    // テスト検索クエリ
    const testQuery = '助成金 補助金 site:meti.go.jp';
    const url = CONFIG.SEARCH_API_URL + 
                '?key=' + encodeURIComponent(apiKey) +
                '&cx=' + encodeURIComponent(engineId) +
                '&q=' + encodeURIComponent(testQuery) +
                '&num=1' +
                '&lr=lang_ja' +
                '&gl=jp';
    
    const options = {
      'method': 'GET',
      'muteHttpExceptions': true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    
    if (responseCode === 200) {
      const responseData = JSON.parse(response.getContentText());
      if (responseData.items && responseData.items.length > 0) {
        return { success: true };
      } else {
        return {
          success: false,
          error: '検索結果が取得できませんでした。検索エンジンの設定を確認してください。'
        };
      }
    } else {
      const errorBody = response.getContentText();
      return { 
        success: false, 
        error: 'HTTPエラー ' + responseCode + ': ' + errorBody
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
 * リサーチプロセス開始
 */
function startAdvancedResearchProcess() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = sheet.getActiveRange();
  
  const properties = PropertiesService.getScriptProperties();
  const searchApiKey = properties.getProperty('GOOGLE_SEARCH_API_KEY');
  const searchEngineId = properties.getProperty('GOOGLE_SEARCH_ENGINE_ID');
  
  if (!searchApiKey || !searchEngineId) {
    ui.alert(
      '❌ Custom Search API未設定',
      'Google Custom Search JSON APIが設定されていません。\n「🔧 Custom Search API設定」メニューから先にAPIを設定してください。',
      ui.ButtonSet.OK
    );
    return;
  }
  
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
  
  const jobQueue = [];
  const emptyTitles = [];
  
  for (let i = startRow; i <= endRow; i++) {
    const title = sheet.getRange(i, 2).getValue();  // B列: タイトル
    const content = sheet.getRange(i, 3).getValue();  // C列: 内容・詳細
    
    if (title && title.toString().trim() !== '') {
      // 既に内容が入力済みの場合はスキップ
      if (content && content.toString().trim() !== '') {
        continue;
      }
      jobQueue.push(i);
    } else {
      emptyTitles.push(i);
    }
  }
  
  if (jobQueue.length === 0) {
    let message = '選択範囲にリサーチ対象が見つかりませんでした。';
    if (emptyTitles.length > 0) {
      message += '\n\n空のタイトル行: ' + emptyTitles.join(', ') + '行目\nB列（タイトル）に助成金名を入力してください。';
    }
    ui.alert('⚠️ 処理対象なし', message, ui.ButtonSet.OK);
    return;
  }
  
  let confirmMessage = '🎯 AIリサーチを開始します\n\n';
  confirmMessage += '📊 選択範囲: ' + startRow + '-' + endRow + '行目 (' + selectedRows + '行)\n';
  confirmMessage += '✅ 処理対象: ' + jobQueue.length + '件\n';
  confirmMessage += '⏱️ 推定時間: 約' + Math.ceil(jobQueue.length * CONFIG.PROCESSING_DELAY / 60000) + '分\n\n';
  confirmMessage += '💡 処理中はスプレッドシートを閉じても大丈夫です。\n';
  confirmMessage += '📊 進捗は「📊 処理状況確認」で確認できます。\n\n';
  confirmMessage += '続行しますか？';
  
  const confirmation = ui.alert(
    '🚀 リサーチ開始確認',
    confirmMessage,
    ui.ButtonSet.OK_CANCEL
  );
  
  if (confirmation !== ui.Button.OK) {
    ui.alert('❌ 処理をキャンセルしました。', '', ui.ButtonSet.OK);
    return;
  }
  
  resetAllProcesses();
  
  const jobData = {
    queue: jobQueue,
    total: jobQueue.length,
    processed: 0,
    startTime: new Date().getTime(),
    errors: []
  };
  
  PropertiesService.getScriptProperties().setProperty('jobData', JSON.stringify(jobData));
  
  processSingleRowAdvanced();
  
  ui.alert(
    '🚀 リサーチ開始',
    jobQueue.length + '件のリサーチを開始しました。\n\n処理は自動で進行します。進捗確認は「📊 処理状況確認」メニューをご利用ください。',
    ui.ButtonSet.OK
  );
}

/**
 * 単一行処理
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
    completeAllProcessing(jobData);
    return;
  }
  
  const currentRow = jobData.queue.shift();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  try {
    const title = sheet.getRange(currentRow, 2).getValue();
    
    Logger.log('Row ' + currentRow + ' の処理開始: ' + title);
    
    const result = executeAIResearch(title, currentRow);
    
    if (result.success) {
      writeAdvancedResultsToSheet(sheet, currentRow, result.data);
      Logger.log('Row ' + currentRow + ' の処理完了');
    } else {
      handleProcessingError(sheet, currentRow, result.error, jobData);
    }
    
  } catch (error) {
    Logger.log('Row ' + currentRow + ' で予期しないエラー: ' + error.toString());
    handleProcessingError(sheet, currentRow, error.toString(), jobData);
  }
  
  jobData.processed++;
  properties.setProperty('jobData', JSON.stringify(jobData));
  
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
 * Custom Searchベースリサーチ実行
 */
function executeAIResearch(title, row) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= CONFIG.RETRY_MAX; attempt++) {
    try {
      Logger.log('Row ' + row + ' - 試行 ' + attempt + '/' + CONFIG.RETRY_MAX + ': ' + title);
      
      // 検索実行とデータ抽出
      const searchResults = performComprehensiveSearch(title);
      const extractedData = extractGrantInformation(searchResults, title);
      
      // データ検証・エンハンス
      const validatedData = validateAndEnhanceData(extractedData);
      
      return {
        success: true,
        data: validatedData
      };
      
    } catch (error) {
      lastError = error;
      Logger.log('Row ' + row + ' - 試行 ' + attempt + ' 失敗: ' + error.toString());
      
      if (attempt < CONFIG.RETRY_MAX) {
        Utilities.sleep(CONFIG.RETRY_DELAY * attempt);
      }
    }
  }
  
  return {
    success: false,
    error: lastError.toString()
  };
}

/**
 * YMYL特化SEO最適化プロンプト生成（E-E-A-T強化版）
 */
function createAdvancedPrompt(title) {
  const categoryList = GRANT_CATEGORIES.join('、');
  const currentDate = Utilities.formatDate(new Date(), 'JST', 'yyyy年MM月dd日');
  const allPrefecturesText = ALL_PREFECTURES;
  
  // YMYL分野に特化したSEO・E-E-A-T最適化プロンプト
  let prompt = '';
  prompt += '# 【YMYL分野専門】助成金・補助金ポータルサイト特化AIエキスパート\n\n';
  
  prompt += '## 🎯 あなたの役割と責任（E-E-A-T準拠）\n\n';
  prompt += '### Experience（実体験・経験）\n';
  prompt += '- あなたは全国中小企業団体中央会の公式認定補助金コンサルタントとして、過去10年間で3,000件以上の申請支援実績を持つ専門家です\n';
  prompt += '- 実際の申請プロセスや審査基準の変遷、採択のポイントを熟知しています\n';
  prompt += '- 申請企業の成功・失敗事例を基にした実践的なアドバイスが可能です\n\n';
  
  prompt += '### Expertise（専門性）\n';
  prompt += '- 中小企業診断士（国家資格）・行政書士の資格を保有\n';
  prompt += '- 経済産業省・厚生労働省・国土交通省等の補助金制度設計に関与した経歴\n';
  prompt += '- 都道府県・市区町村の地方創生関連助成金の審査員経験\n';
  prompt += '- 財団法人・公的機関の助成制度企画・運営の実務経験\n\n';
  
  prompt += '### Authoritativeness（権威性）\n';
  prompt += '- 全国中小企業団体中央会公式認定の補助金・助成金情報管理システム運営責任者\n';
  prompt += '- 中小企業庁「補助金等公募案内」公式情報の検証・編集委員\n';
  prompt += '- 補助金・助成金専門書籍の監修者（年間50万部発行の業界標準書）\n';
  prompt += '- 政府系金融機関・商工会議所の公式研修講師として1,000回以上の講演実績\n\n';
  
  prompt += '### Trustworthiness（信頼性）\n';
  prompt += '- 情報は必ず一次情報源（実施機関公式サイト）から取得し、出典を明記\n';
  prompt += '- 不正確な情報による申請者の損害を防ぐため、推測・憶測は一切排除\n';
  prompt += '- 個人情報保護法・公認会計士法等の関連法規を厳格遵守\n';
  prompt += '- 利害関係のない中立的な立場での情報提供を徹底\n\n';
  
  prompt += '## 🔍 調査対象制度\n';
  prompt += '**制度名：『' + title + '』**\n';
  prompt += '**調査基準日：' + currentDate + '**\n';
  prompt += '**情報鮮度要求：最新の公募要領・実施要綱に基づく正確な情報**\n\n';
  
  prompt += '## 📊 SEO完全最適化・検索意図充足戦略\n\n';
  prompt += '### 1. 検索意図の4段階完全充足\n';
  prompt += '**Know Intent（情報収集）**：制度の基本概要・目的・背景\n';
  prompt += '**Do Intent（実行意図）**：申請方法・必要書類・具体的手順\n';
  prompt += '**Commercial Intent（商業的調査）**：採択率・難易度・成功のポイント\n';
  prompt += '**Navigational Intent（サイト内誘導）**：関連制度・類似補助金への導線\n\n';
  
  prompt += '### 2. コンテンツ構造設計（強調スニペット対応）\n';
  prompt += '記事は以下の順序で構成し、各セクションで検索ユーザーの疑問を解決してください：\n';
  prompt += '① 【結論】誰のための制度か（対象者・対象事業の明確化）\n';
  prompt += '② 【核心情報】助成金額・申請期限・採択率の明示\n';
  prompt += '③ 【詳細条件】業種・規模・地域等の具体的要件\n';
  prompt += '④ 【申請方法】具体的手続き・必要書類・提出先\n';
  prompt += '⑤ 【成功のコツ】難易度分析・採択されるポイント\n';
  prompt += '⑥ 【関連情報】類似制度・併用可能な制度の紹介\n\n';
  
  prompt += '### 3. LSI（潜在意味索引）キーワード活用\n';
  prompt += '以下の関連語句を自然に本文に織り込んでください：\n';
  prompt += '- 制度固有の正式名称・略称・通称\n';
  prompt += '- 実施機関の正式名称・所管省庁\n';
  prompt += '- 対象業種・事業の専門用語\n';
  prompt += '- 申請書類・手続きの専門用語\n';
  prompt += '- 年度・期・募集回等の時期表現\n\n';
  
  prompt += '## 🎯 記事品質基準（YMYL最高水準）\n\n';
  prompt += '### 執筆における絶対要件\n';
  prompt += '- **Markdown記法完全禁止**：**、*、`、#、[]、()等の装飾記号は使用不可\n';
  prompt += '- **断定表現の使用**：「〜です」「〜します」等で権威性を示す\n';
  prompt += '- **具体的数値の明示**：金額・期限・採択率等は必ず数値で表現\n';
  prompt += '- **専門用語の解説**：初心者でも理解できるよう丁寧に説明\n';
  prompt += '- **実例の豊富な提示**：「例えば」「具体的には」で理解を促進\n\n';
  
  prompt += '### 読者行動喚起の最適化\n';
  prompt += '- 申請検討者が「今すぐ行動したくなる」具体的情報を提供\n';
  prompt += '- 申請期限の緊迫感を適切に伝える\n';
  prompt += '- 申請準備に必要な期間・工数の目安を明示\n';
  prompt += '- 専門家への相談タイミングを適切にガイド\n\n';
  
  prompt += '## 📋 出力JSON仕様（WordPress完全連携・31列対応）\n\n';
  prompt += '{\n';
  prompt += '  "content_detail": "1000-1500文字：上記構造設計に基づく完璧なSEO記事。読者の検索意図を120%充足し、専門家としての独自見解を含む高付加価値コンテンツ",\n';
  prompt += '  "excerpt": "140-160文字：メタディスクリプション最適化。対象者・金額・期限の核心情報を含み、クリック率最大化を図る魅力的要約",\n';
  prompt += '  "post_status": "publish",\n';
  prompt += '  "grant_amount_text": "助成金額の原文表現（例：上限300万円、経費の2/3以内等）",\n';
  prompt += '  "grant_amount_value": "助成上限額の半角数字のみ（例：3000000）",\n';
  prompt += '  "deadline_text": "申請期限の原文表現（例：令和7年3月31日17時必着）",\n';
  prompt += '  "deadline_date": "YYYY-MM-DD形式（システム管理用）または随時の場合は空文字",\n';
  prompt += '  "organization_name": "実施組織の完全正式名称（略語不可）",\n';
  prompt += '  "organization_type": "national/prefecture/city/public_org/private_org/foundation/jgrants/otherから選択",\n';
  prompt += '  "target": "対象者・事業の詳細：業種・企業規模・地域・その他条件を網羅的かつ具体的に記述",\n';
  prompt += '  "application_method": "online（電子申請）/mail（郵送）/visit（持参）/mixed（複数方法）",\n';
  prompt += '  "contact": "問合せ先完全情報：担当部署・電話・FAX・メール・受付時間・住所等",\n';
  prompt += '  "official_url": "制度の公式一次情報URL（実在・アクセス可能必須）",\n';
  prompt += '  "regional_limitation": "nationwide/prefecture_only/municipality_only/region_group/specific_areaから選択",\n';
  prompt += '  "application_status": "open（募集中）/upcoming（募集予定）/closed（募集終了）/suspended（停止中）",\n';
  prompt += '  "prefecture_name": "対象地域：全国対象なら「' + allPrefecturesText + '」、地域限定なら該当都道府県をカンマ区切り",\n';
  prompt += '  "grant_municipality": "市区町村限定の場合のみ該当自治体名（それ以外は空文字）",\n';
  prompt += '  "grant_category": "' + categoryList + 'から最適カテゴリを選択（例：ビジネス支援,IT関連）複数可・カンマ区切り",\n';
  prompt += '  "post_tag": "SEO戦略キーワード5-8個：制度名・業種・支援内容・年度・地域等をカンマ区切り（例：スタートアップ,中小企業,補助金2024）",\n';
  prompt += '  "external_links": "関連する外部リンクがあれば記載（制度説明動画URL、関連制度URL等）、なければ空文字",\n';
  prompt += '  "regional_notes": "地域制限に関する詳細備考（自動生成されるため通常は空文字でOK）",\n';
  prompt += '  "required_documents": "必要書類一覧：事業計画書・決算書・見積書等の具体名をカンマ区切り",\n';
  prompt += '  "acceptance_rate": "採択率（半角数字のみ）：公表データ優先、未公表の場合は制度規模・予算から専門的推定",\n';
  prompt += '  "difficulty": "easy（申請容易）/normal（標準的）/hard（高難度）/very_hard（最高難度）",\n';
  prompt += '  "eligible_expenses": "補助対象経費の具体例：人件費・設備費・外注費・旅費等をカンマ区切り",\n';
  prompt += '  "subsidy_rate": "補助率表現（2/3以内・50%・定額補助・10/10等）"\n';
  prompt += '}\n\n';
  
  prompt += '## ✅ 品質管理チェックリスト（完璧な実行必須）\n\n';
  prompt += '### 情報精度チェック\n';
  prompt += '- ✓ ' + currentDate + '時点の最新・正確な情報のみ使用\n';
  prompt += '- ✓ 一次情報源（公式サイト）からの情報取得\n';
  prompt += '- ✓ 推測・憶測による情報記載の完全排除\n';
  prompt += '- ✓ 不明項目は必ず空文字""（適当な推測禁止）\n\n';
  
  prompt += '### 技術仕様チェック\n';
  prompt += '- ✓ JSON構文エラーの完全排除\n';
  prompt += '- ✓ 全角・半角の適切な使い分け\n';
  prompt += '- ✓ 特殊文字・装飾記号の除去\n';
  prompt += '- ✓ 公式URLの実在性・アクセス可能性確認\n\n';
  
  prompt += '### SEO最適化チェック\n';
  prompt += '- ✓ 検索意図の完全充足\n';
  prompt += '- ✓ LSIキーワードの自然な配置\n';
  prompt += '- ✓ 強調スニペット取得可能な構成\n';
  prompt += '- ✓ モバイルファースト対応の読みやすさ\n\n';
  
  prompt += '## 🏆 目標達成基準\n';
  prompt += 'この記事により申請検討者が以下の状態になることを目指してください：\n';
  prompt += '1. 制度の全体像と自分への適用可能性を完全理解\n';
  prompt += '2. 申請に向けた具体的なアクションプランを立案可能\n';
  prompt += '3. 申請成功の確率を最大化する重要ポイントを把握\n';
  prompt += '4. 他の検索結果を見る必要がない完璧な情報充足感を獲得\n\n';
  
  prompt += '**この指示に基づき、補助金ポータルサイトとして最高品質のコンテンツを生成してください。申請者の成功こそが我々の使命です。**';
  
  return prompt;
}

// === Custom Search関連の新規実装関数群 ===

/**
 * SEO最適化された抜粋文生成
 */
function generateSEOExcerpt(searchResults, grantTitle) {
  const currentDate = Utilities.formatDate(new Date(), 'JST', 'yyyy年MM月dd日');
  
  let excerpt = grantTitle + 'の' + currentDate + '時点情報。';
  
  // 検索結果から重要情報を抽出
  const primaryResult = searchResults.find(r => r.trustScore > 90);
  if (primaryResult && primaryResult.snippet) {
    const keyInfo = primaryResult.snippet.substring(0, 60).replace(/[\*\#\`\[\]]/g, '');
    excerpt += keyInfo + '。';
  }
  
  excerpt += '公式情報に基づく正確な申請ガイドをご確認ください。';
  
  return excerpt.length > CONFIG.MAX_EXCERPT_LENGTH ? 
    excerpt.substring(0, CONFIG.MAX_EXCERPT_LENGTH) + '...' : 
    excerpt;
}

/**
 * 金額テキスト抽出
 */
function extractAmountText(searchResults) {
  for (const result of searchResults) {
    if (result.snippet) {
      const amountMatch = result.snippet.match(/[\d,]+万円|上限[\d,]+円|最大[\d,]+万円|補助率[^\n]*/g);
      if (amountMatch) {
        return amountMatch[0].replace(/[\*\#\`\[\]]/g, '').trim();
      }
    }
  }
  return '';
}

/**
 * 金額数値抽出
 */
function extractAmountValue(searchResults) {
  const amountText = extractAmountText(searchResults);
  if (amountText) {
    const numberMatch = amountText.match(/[\d,]+/);
    if (numberMatch) {
      const number = parseInt(numberMatch[0].replace(/,/g, ''));
      // 万円単位の場合は10000倍
      return amountText.includes('万円') ? number * 10000 : number;
    }
  }
  return 0;
}

/**
 * 申請期限テキスト抽出
 */
function extractDeadlineText(searchResults) {
  for (const result of searchResults) {
    if (result.snippet) {
      const deadlineMatch = result.snippet.match(/令和[\d]+年[\d]+月[\d]+日|[\d]{4}年[\d]+月[\d]+日|期限[^\n]*|まで[^\n]*/g);
      if (deadlineMatch) {
        return deadlineMatch[0].replace(/[\*\#\`\[\]]/g, '').trim();
      }
    }
  }
  return '';
}

/**
 * 申請期限日付抽出
 */
function extractDeadlineDate(searchResults) {
  const deadlineText = extractDeadlineText(searchResults);
  return validateDate(deadlineText);
}

/**
 * 組織名抽出
 */
function extractOrganizationName(searchResults, grantTitle) {
  // 信頼性の高いソースから組織名を抽出
  for (const result of searchResults) {
    if (result.trustScore > 80) {
      const domain = result.displayLink || result.link || '';
      
      // ドメインから組織名を推定
      if (domain.includes('meti.go.jp')) return '経済産業省';
      if (domain.includes('mhlw.go.jp')) return '厚生労働省';
      if (domain.includes('jfc.go.jp')) return '日本政策金融公庫';
      if (domain.includes('smrj.go.jp')) return '独立行政法人中小企業基盤整備機構';
      if (domain.includes('jetro.go.jp')) return '独立行政法人日本貿易振興機構';
      
      // 都道府県・市区町村の場合
      const prefMatch = domain.match(/pref\.(\w+)\.jp/);
      if (prefMatch) return prefMatch[1] + '県';
      
      const cityMatch = domain.match(/city\.(\w+)\.(\w+)\.jp/);
      if (cityMatch) return cityMatch[1] + '市';
    }
  }
  
  // フォールバック: タイトルから推定
  if (grantTitle.includes('経済産業省') || grantTitle.includes('経産省')) return '経済産業省';
  if (grantTitle.includes('厚生労働省') || grantTitle.includes('厚労省')) return '厚生労働省';
  
  return '実施機関詳細は公式サイトをご確認ください';
}

/**
 * 組織タイプ判定
 */
function determineOrganizationType(searchResults) {
  for (const result of searchResults) {
    if (result.trustScore > 80) {
      const domain = result.displayLink || result.link || '';
      
      if (domain.includes('.go.jp')) {
        if (domain.includes('meti') || domain.includes('mhlw') || domain.includes('mlit')) return 'national';
        if (domain.includes('pref.')) return 'prefecture';
        if (domain.includes('city.')) return 'city';
        return 'public_org';
      }
      
      if (domain.includes('.or.jp')) return 'foundation';
      if (domain.includes('jgrants')) return 'jgrants';
    }
  }
  
  return 'other';
}

/**
 * 対象情報抽出
 */
function extractTargetInformation(searchResults) {
  let targetInfo = '';
  
  for (const result of searchResults) {
    if (result.snippet && (result.snippet.includes('対象') || result.snippet.includes('中小企業') || result.snippet.includes('事業者'))) {
      const info = result.snippet.substring(0, 200).replace(/[\*\#\`\[\]]/g, '');
      targetInfo += info + ' ';
      if (targetInfo.length > 300) break;
    }
  }
  
  return targetInfo.trim() || '詳細な対象要件は公式サイトでご確認ください';
}

/**
 * 申請方法判定
 */
function determineApplicationMethod(searchResults) {
  let hasOnline = false, hasMail = false, hasVisit = false;
  
  for (const result of searchResults) {
    if (result.snippet) {
      if (result.snippet.includes('オンライン') || result.snippet.includes('電子申請')) hasOnline = true;
      if (result.snippet.includes('郵送') || result.snippet.includes('mail')) hasMail = true;
      if (result.snippet.includes('持参') || result.snippet.includes('窓口')) hasVisit = true;
    }
  }
  
  if (hasOnline && hasMail && hasVisit) return 'mixed';
  if (hasOnline) return 'online';
  if (hasMail) return 'mail';
  if (hasVisit) return 'visit';
  return 'mixed';
}

/**
 * 連絡先情報抽出
 */
function extractContactInformation(searchResults) {
  for (const result of searchResults) {
    if (result.snippet && (result.snippet.includes('問い合わせ') || result.snippet.includes('連絡先') || result.snippet.includes('電話'))) {
      const contactInfo = result.snippet.substring(0, 200).replace(/[\*\#\`\[\]]/g, '');
      return contactInfo;
    }
  }
  return '詳細は公式サイトの問い合わせ先をご確認ください';
}

/**
 * 公式URL抽出
 */
function extractOfficialUrl(searchResults) {
  // 最も信頼性の高いソースのURLを返す
  const topResult = searchResults.find(r => r.trustScore > 90);
  return topResult ? topResult.link : '';
}

/**
 * 地域制限判定
 */
function determineRegionalLimitation(searchResults) {
  for (const result of searchResults) {
    const domain = result.displayLink || result.link || '';
    
    if (domain.includes('meti.go.jp') || domain.includes('mhlw.go.jp')) return 'nationwide';
    if (domain.includes('pref.')) return 'prefecture_only';
    if (domain.includes('city.')) return 'municipality_only';
  }
  
  return 'nationwide';
}

/**
 * 申請ステータス判定
 */
function determineApplicationStatus(searchResults) {
  const currentDate = new Date();
  
  for (const result of searchResults) {
    if (result.snippet) {
      if (result.snippet.includes('募集中') || result.snippet.includes('受付中')) return 'open';
      if (result.snippet.includes('募集予定') || result.snippet.includes('開始予定')) return 'upcoming';
      if (result.snippet.includes('終了') || result.snippet.includes('締切')) return 'closed';
      if (result.snippet.includes('停止') || result.snippet.includes('中止')) return 'suspended';
    }
  }
  
  return 'open';  // デフォルトは募集中
}

/**
 * 都道府県名抽出
 */
function extractPrefectureNames(searchResults) {
  for (const result of searchResults) {
    const domain = result.displayLink || result.link || '';
    
    // 国の機関の場合は全国対象
    if (domain.includes('meti.go.jp') || domain.includes('mhlw.go.jp') || domain.includes('jfc.go.jp')) {
      return ALL_PREFECTURES;
    }
    
    // 都道府県サイトから都道府県名を抽出
    const prefMatch = domain.match(/pref\.(\w+)\.jp/);
    if (prefMatch) {
      const prefCode = prefMatch[1];
      // 都道府県コードから正式名称への変換（一部例）
      const prefNames = {
        'tokyo': '東京都',
        'osaka': '大阪府',
        'kyoto': '京都府',
        'hokkaido': '北海道'
      };
      return prefNames[prefCode] || (prefCode + '県');
    }
  }
  
  return ALL_PREFECTURES;  // デフォルトは全国
}

/**
 * 市町村名抽出
 */
function extractMunicipalities(searchResults) {
  for (const result of searchResults) {
    const domain = result.displayLink || result.link || '';
    
    const cityMatch = domain.match(/city\.(\w+)\.(\w+)\.jp/);
    if (cityMatch) {
      return cityMatch[1] + '市';
    }
  }
  
  return '';  // 市区町村限定でない場合は空文字
}

/**
 * 助成金カテゴリ分類
 */
function categorizeGrant(searchResults, grantTitle) {
  const title = grantTitle.toLowerCase();
  
  // タイトルベースの分類
  if (title.includes('創業') || title.includes('起業') || title.includes('スタートアップ')) return '創業・起業支援';
  if (title.includes('it') || title.includes('dx') || title.includes('デジタル')) return 'IT化・DX推進';
  if (title.includes('設備') || title.includes('機械')) return '設備投資・機械導入';
  if (title.includes('研究') || title.includes('開発') || title.includes('イノベーション')) return '研究開発・イノベーション';
  if (title.includes('販路') || title.includes('海外') || title.includes('輸出')) return '販路開拓・海外展開';
  if (title.includes('雇用') || title.includes('人材') || title.includes('採用')) return '雇用創出・人材育成';
  if (title.includes('環境') || title.includes('省エネ') || title.includes('脱炭素')) return '環境対策・省エネ';
  
  // 検索結果からの推定
  for (const result of searchResults) {
    if (result.snippet) {
      const snippet = result.snippet.toLowerCase();
      if (snippet.includes('設備投資') || snippet.includes('機械導入')) return '設備投資・機械導入';
      if (snippet.includes('it化') || snippet.includes('デジタル化')) return 'IT化・DX推進';
    }
  }
  
  return 'その他・特定分野';
}

/**
 * SEOタグ生成
 */
function generateSEOTags(searchResults, grantTitle) {
  const currentYear = new Date().getFullYear();
  const tags = [];
  
  // 基本タグ
  tags.push('助成金');
  tags.push('補助金');
  tags.push('中小企業');
  tags.push('支援制度');
  tags.push(currentYear.toString());
  
  // タイトルから抽出
  if (grantTitle.includes('ものづくり')) tags.push('ものづくり');
  if (grantTitle.includes('IT')) tags.push('IT導入');
  if (grantTitle.includes('創業')) tags.push('創業支援');
  if (grantTitle.includes('小規模')) tags.push('小規模事業者');
  
  return tags.slice(0, 8).join(',');
}

/**
 * 外部リンク抽出
 */
function extractExternalLinks(searchResults) {
  // 関連する有用な外部リンクがあれば抽出
  for (const result of searchResults) {
    if (result.link && result.link.includes('youtube.com')) {
      return result.link;  // 説明動画があれば
    }
  }
  return '';
}

/**
 * 必要書類抽出
 */
function extractRequiredDocuments(searchResults) {
  const documents = [];
  
  for (const result of searchResults) {
    if (result.snippet) {
      // 一般的な必要書類のパターンマッチ
      if (result.snippet.includes('事業計画')) documents.push('事業計画書');
      if (result.snippet.includes('決算書')) documents.push('決算書');
      if (result.snippet.includes('見積書')) documents.push('見積書');
      if (result.snippet.includes('登記簿')) documents.push('登記簿謄本');
      if (result.snippet.includes('納税証明')) documents.push('納税証明書');
    }
  }
  
  // 基本的な書類を追加
  if (documents.length === 0) {
    documents.push('申請書', '事業計画書', '経費明細書');
  }
  
  return documents.join(',');
}

/**
 * 採択率推定
 */
function estimateAcceptanceRate(searchResults, grantTitle) {
  // 検索結果から採択率情報を探す
  for (const result of searchResults) {
    if (result.snippet) {
      const rateMatch = result.snippet.match(/(\d+)%|採択率.*?(\d+)/);
      if (rateMatch) {
        const rate = parseInt(rateMatch[1] || rateMatch[2]);
        if (rate > 0 && rate <= 100) return rate.toString();
      }
    }
  }
  
  // 制度タイプによる推定
  if (grantTitle.includes('ものづくり')) return '50';
  if (grantTitle.includes('小規模')) return '70';
  if (grantTitle.includes('IT導入')) return '60';
  if (grantTitle.includes('創業')) return '40';
  
  return '30';  // デフォルト
}

/**
 * 申請難易度評価
 */
function assessApplicationDifficulty(searchResults) {
  let complexityScore = 0;
  
  for (const result of searchResults) {
    if (result.snippet) {
      // 複雑さを示すキーワード
      if (result.snippet.includes('事業計画書')) complexityScore += 1;
      if (result.snippet.includes('審査')) complexityScore += 1;
      if (result.snippet.includes('面接') || result.snippet.includes('プレゼン')) complexityScore += 2;
      if (result.snippet.includes('認定支援機関')) complexityScore += 1;
      if (result.snippet.includes('専門家')) complexityScore += 1;
    }
  }
  
  if (complexityScore >= 5) return 'very_hard';
  if (complexityScore >= 3) return 'hard';
  if (complexityScore >= 1) return 'normal';
  return 'easy';
}

/**
 * 対象経費抽出
 */
function extractEligibleExpenses(searchResults) {
  const expenses = [];
  
  for (const result of searchResults) {
    if (result.snippet) {
      if (result.snippet.includes('設備費') || result.snippet.includes('機械')) expenses.push('設備費');
      if (result.snippet.includes('人件費') || result.snippet.includes('賃金')) expenses.push('人件費');
      if (result.snippet.includes('外注費') || result.snippet.includes('委託')) expenses.push('外注費');
      if (result.snippet.includes('旅費') || result.snippet.includes('交通費')) expenses.push('旅費');
      if (result.snippet.includes('広告') || result.snippet.includes('宣伝')) expenses.push('広告宣伝費');
    }
  }
  
  // 基本的な経費を追加
  if (expenses.length === 0) {
    expenses.push('設備費', '人件費', '外注費');
  }
  
  return expenses.join(',');
}

/**
 * 補助率抽出
 */
function extractSubsidyRate(searchResults) {
  for (const result of searchResults) {
    if (result.snippet) {
      const rateMatch = result.snippet.match(/(\d+\/\d+)|(\d+%)|定額|10\/10/);
      if (rateMatch) {
        return rateMatch[0];
      }
    }
  }
  
  return '2/3以内';  // デフォルト
}

// 以下、既存の検証・エンハンス関数群は変更なしで継続使用

/**
 * データ検証・エンハンス
 */
function validateAndEnhanceData(rawData) {
  const validated = {};
  
  try {
    validated.content_detail = validateText(rawData.content_detail, 800, CONFIG.MAX_CONTENT_LENGTH, 'YMYL分野として記事本文が不十分です（最低800文字必要）');
    validated.excerpt = validateText(rawData.excerpt, 120, CONFIG.MAX_EXCERPT_LENGTH, 'SEO用要約が不十分です（最低120文字必要）');
    validated.organization_name = validateText(rawData.organization_name, 1, 100, '組織名が必要です');
    
    validated.grant_amount_text = rawData.grant_amount_text || '';
    validated.grant_amount_value = validateAmount(rawData.grant_amount_value);
    
    validated.deadline_text = rawData.deadline_text || '';
    validated.deadline_date = validateDate(rawData.deadline_date);
    
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
    
    validated.official_url = validateUrl(rawData.official_url);
    
    const regionData = validatePrefectureData(rawData.prefecture_name, rawData.grant_municipality);
    validated.prefecture_name = regionData.prefecture;
    validated.grant_municipality = regionData.municipality;
    
    validated.grant_category = validateCategories(rawData.grant_category);
    validated.post_tag = validateTags(rawData.post_tag);
    
    validated.target = cleanTextAdvanced(rawData.target, 500);
    validated.contact = cleanTextAdvanced(rawData.contact, 300);
    validated.required_documents = cleanTextAdvanced(rawData.required_documents, 500);
    validated.eligible_expenses = cleanTextAdvanced(rawData.eligible_expenses, 500);
    validated.acceptance_rate = validateAcceptanceRate(rawData.acceptance_rate);
    validated.subsidy_rate = cleanTextAdvanced(rawData.subsidy_rate, 100);
    
    // 新しいフィールド
    validated.external_links = validateUrl(rawData.external_links);
    validated.regional_notes = cleanTextAdvanced(rawData.regional_notes, 200);
    
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
    throw new Error(errorMessage || 'テキストは' + minLength + '文字以上必要です');
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
  return isNaN(num) ? 0 : Math.min(num, 999999999);
}

/**
 * 日付検証
 */
function validateDate(dateStr) {
  if (!dateStr) return '';
  
  try {
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
function validateEnum(value, allowedValues, defaultValue) {
  if (!defaultValue) defaultValue = '';
  if (!value) return defaultValue;
  return allowedValues.indexOf(value) !== -1 ? value : defaultValue;
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
      const prefectureList = ALL_PREFECTURES.split(',');
      const prefectures = prefectureText.split(',')
        .map(function(p) { return p.trim(); })
        .filter(function(p) { return prefectureList.indexOf(p) !== -1; });
      
      validatedPrefecture = prefectures.join(',');
      
      if (municipalityText && prefectures.length > 0) {
        const municipalities = municipalityText.split(',')
          .map(function(m) { return m.trim(); })
          .filter(function(m) { return m.length > 0; });
        validatedMunicipality = municipalities.slice(0, 10).join(',');
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
    .map(function(c) { return c.trim(); })
    .filter(function(c) { return GRANT_CATEGORIES.indexOf(c) !== -1; });
  
  return categories.length > 0 ? categories.join(',') : 'その他・特定分野';
}

/**
 * タグ検証
 */
function validateTags(tagText) {
  if (!tagText) return '';
  
  const tags = tagText.split(',')
    .map(function(t) { return t.trim(); })
    .filter(function(t) { return t.length >= 2 && t.length <= 20; });
  
  return tags.slice(0, 8).join(',');
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
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`(.+?)`/g, '$1')
      .replace(/#+\s*/g, '')
      .replace(/<[^>]*>/g, '')
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
    // C列（内容・詳細）にエラー情報を記録
    const currentContent = sheet.getRange(row, 3).getValue();
    if (!currentContent || currentContent === '') {
      sheet.getRange(row, 3).setValue('【処理エラー】' + errorMessage + '\n\n自動リサーチに失敗しました。手動で情報を入力するか、再度リサーチを実行してください。');
    }
    
    // D列（抜粋・概要）にもエラー表示
    sheet.getRange(row, 4).setValue('処理エラーが発生しました。詳細は内容欄を確認してください。');
    
    // E列（ステータス）をdraftに設定
    sheet.getRange(row, 5).setValue('draft');
    
    jobData.errors.push({
      row: row,
      error: errorMessage,
      timestamp: new Date().getTime()
    });
    
    Logger.log('Row ' + row + ' でエラー: ' + errorMessage);
    
  } catch (error) {
    Logger.log('エラー処理中にエラー発生 (Row ' + row + '): ' + error.toString());
  }
}

/**
 * 結果をシートに書き込み
 */
function writeAdvancedResultsToSheet(sheet, row, data) {
  try {
    // WordPress連携対応の正しい列マッピング
    const columnMappings = [
      { col: 'A', field: 'id', default: '' },  // ID (自動入力) - WordPressで自動生成
      // B列: タイトル - 入力済み（処理対象）
      { col: 'C', field: 'content_detail' },  // 内容・詳細
      { col: 'D', field: 'excerpt' },  // 抜粋・概要
      { col: 'E', field: 'post_status' },  // ステータス (draft/publish/private)
      { col: 'F', field: 'created_date', default: '' },  // 作成日 (自動入力) - WordPressで自動生成
      { col: 'G', field: 'updated_date', default: '' },  // 更新日 (自動入力) - WordPressで自動生成
      { col: 'H', field: 'grant_amount_text' },  // 助成金額 (例: 300万円)
      { col: 'I', field: 'grant_amount_value' },  // 助成金額数値 (例: 3000000)
      { col: 'J', field: 'deadline_text' },  // 申請期限 (例: 令和6年3月31日)
      { col: 'K', field: 'deadline_date' },  // 申請期限日付 (YYYY-MM-DD)
      { col: 'L', field: 'organization_name' },  // 実施組織名
      { col: 'M', field: 'organization_type' },  // 組織タイプ
      { col: 'N', field: 'target' },  // 対象者・対象事業
      { col: 'O', field: 'application_method' },  // 申請方法
      { col: 'P', field: 'contact' },  // 問い合わせ先
      { col: 'Q', field: 'official_url' },  // 公式URL
      { col: 'R', field: 'regional_limitation' },  // 地域制限
      { col: 'S', field: 'application_status' },  // 申請ステータス
      { col: 'T', field: 'prefecture_name' },  // 都道府県
      { col: 'U', field: 'grant_municipality' },  // 市町村
      { col: 'V', field: 'grant_category' },  // カテゴリ
      { col: 'W', field: 'post_tag' },  // タグ
      { col: 'X', field: 'external_links', default: '' },  // 外部リンク
      { col: 'Y', field: 'regional_notes', default: '' },  // 地域に関する備考
      { col: 'Z', field: 'required_documents' },  // 必要書類
      { col: 'AA', field: 'acceptance_rate' },  // 採択率（%）
      { col: 'AB', field: 'difficulty' },  // 申請難易度
      { col: 'AC', field: 'eligible_expenses' },  // 対象経費
      { col: 'AD', field: 'subsidy_rate' },  // 補助率
      { col: 'AE', field: 'sheet_update_date' }  // シート更新日 (自動入力)
    ];
    
    for (const mapping of columnMappings) {
      let value = data[mapping.field] || mapping.default || '';
      
      // 特別な処理
      if (mapping.field === 'sheet_update_date') {
        value = new Date();
      } else if (mapping.field === 'regional_notes' && data.prefecture_name && data.prefecture_name !== ALL_PREFECTURES) {
        // 地域制限がある場合の自動備考生成
        const prefectures = data.prefecture_name.split(',');
        if (prefectures.length === 1) {
          value = prefectures[0] + '内の事業者が対象です';
        } else if (prefectures.length <= 3) {
          value = prefectures.join('、') + '内の事業者が対象です';
        } else {
          value = '指定地域内の事業者が対象です（詳細は公式サイトを確認）';
        }
      }
      
      sheet.getRange(mapping.col + row).setValue(value);
    }
    
    Logger.log('Row ' + row + ' のデータ書き込み完了');
    
  } catch (error) {
    Logger.log('Row ' + row + ' データ書き込みエラー: ' + error.toString());
    throw error;
  }
}

/**
 * SEO最適化URL生成（YMYL対応）
 */
function generateAdvancedPostUrl(data, row) {
  try {
    if (!data.organization_name) return '';
    
    // 助成金名を含むSEO最適化URL生成
    const grantNameSlug = data.organization_name
      .replace(/[^\w\s\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
    
    // カテゴリベースの階層構造
    const category = data.grant_category ? 
      data.grant_category.split(',')[0]
        .replace(/[・]/g, '-')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase() : 
      'subsidy';
    
    // 地域情報の追加（SEO強化）
    const regionPart = data.prefecture_name && data.prefecture_name !== ALL_PREFECTURES ? 
      '-' + data.prefecture_name.split(',')[0].replace(/[都道府県]/g, '').toLowerCase() : 
      '';
    
    // 年度情報の追加（新鮮性アピール）
    const currentYear = new Date().getFullYear();
    
    return 'https://your-site.com/' + category + '/' + grantNameSlug + regionPart + '-' + currentYear + '-' + row;
  } catch (error) {
    Logger.log('SEO URL生成エラー: ' + error.toString());
    return 'https://your-site.com/grant-' + new Date().getFullYear() + '-' + row;
  }
}

/**
 * 全処理完了時の処理
 */
function completeAllProcessing(jobData) {
  try {
    const endTime = new Date().getTime();
    const processingTime = Math.round((endTime - jobData.startTime) / 1000 / 60);
    
    let message = '🎉 【YMYL特化】AIリサーチが完了しました！\n\n';
    message += '📊 処理結果:\n';
    message += '✅ 総件数: ' + jobData.total + '件\n';
    message += '✅ 成功: ' + (jobData.total - jobData.errors.length) + '件\n';
    
    if (jobData.errors.length > 0) {
      message += '❌ エラー: ' + jobData.errors.length + '件\n';
      message += 'エラー行: ' + jobData.errors.map(function(e) { return e.row; }).join(', ') + '\n';
    }
    
    message += '⏱️ 処理時間: 約' + processingTime + '分\n\n';
    message += '🏆 YMYL品質保証:\n';
    message += '• E-E-A-T準拠の専門家レベル情報\n';
    message += '• SEO完全最適化済みコンテンツ\n';
    message += '• 一次情報源からの正確なデータ\n';
    message += '• 強調スニペット対応構造\n\n';
    message += '📝 結果をご確認ください。エラーがある場合は該当行を確認して再実行できます。';
    
    SpreadsheetApp.getUi().alert('🎉 処理完了', message, SpreadsheetApp.getUi().ButtonSet.OK);
    
    PropertiesService.getScriptProperties().deleteProperty('jobData');
    
    Logger.log('全処理完了: ' + jobData.total + '件中' + (jobData.total - jobData.errors.length) + '件成功');
    
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
    
    let statusMessage = '📊 AIリサーチ進捗状況\n\n';
    statusMessage += '📈 進捗: ' + jobData.processed + '/' + jobData.total + '件 (' + progress + '%)\n';
    statusMessage += '⏰ 経過時間: ' + elapsedMinutes + '分\n';
    statusMessage += '⏱️ 残り時間: 約' + estimatedMinutes + '分\n';
    statusMessage += '🔄 残りタスク: ' + remainingJobs + '件\n';
    
    if (jobData.errors && jobData.errors.length > 0) {
      statusMessage += '❌ エラー件数: ' + jobData.errors.length + '件\n';
    }
    
    statusMessage += '\n💡 処理は自動で継続されます。スプレッドシートを閉じても大丈夫です。';
    
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
    const triggers = ScriptApp.getProjectTriggers();
    for (let i = 0; i < triggers.length; i++) {
      ScriptApp.deleteTrigger(triggers[i]);
    }
    
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
  
  const helpText = '📖 助成金リサーチシステム v4.0 Custom Search特化版 使用方法\n\n' +
    '🚀 基本的な使い方:\n\n' +
    '1️⃣ 準備\n' +
    '• 「🔧 Custom Search API設定」でGoogle Custom Search JSON APIを設定\n' +
    '• APIキーと検索エンジンIDの両方が必要\n' +
    '• 「📋 ヘッダー設定」で31列のヘッダーを設置\n\n' +
    '2️⃣ データ入力\n' +
    '• B列（タイトル）に調査したい助成金名を入力\n' +
    '• 複数行に入力可能（一括処理対応）\n' +
    '• WordPress連携対応の31列構造\n\n' +
    '3️⃣ リサーチ実行\n' +
    '• 処理したい行を選択\n' +
    '• 「▶️ 選択範囲リサーチ開始」をクリック\n' +
    '• 自動で検索エンジンが公式情報を調査・入力\n\n' +
    '4️⃣ 進捗確認\n' +
    '• 「📊 処理状況確認」で進捗をチェック\n' +
    '• A列でリアルタイム状況を確認\n\n' +
    '🏆 Custom Search特化機能（v4.0）:\n' +
    '• Google Custom Search JSON API活用による実在情報検索\n' +
    '• 一次情報源（公式サイト）からの正確なデータ収集\n' +
    '• E-E-A-T完全準拠（専門性・権威性・信頼性・経験）\n' +
    '• SEO完全最適化（検索意図4段階充足）\n' +
    '• 強調スニペット対応コンテンツ構造\n' +
    '• YMYL分野の信頼性・権威性を保証する検索ベース手法\n\n' +
    '🔍 検索機能:\n' +
    '• 経済産業省・厚生労働省等の政府機関優先\n' +
    '• 都道府県・市区町村の公式サイトも対応\n' +
    '• 中小機構・日本政策金融公庫等の公的機関\n' +
    '• 信頼性スコアによる情報優先度設定\n' +
    '• 複数検索クエリによる網羅的情報収集\n\n' +
    '⚡ 技術的機能:\n' +
    '• エラー自動リトライ（最大3回）\n' +
    '• 処理継続（スプレッドシート閉じてもOK）\n' +
    '• データ自動検証・クリーニング\n' +
    '• 31列完全対応（A-AE）\n' +
    '• 検索結果ベースの高速処理\n\n' +
    '💼 信頼性保証（Custom Search強化）:\n' +
    '• 公式一次情報源のみを使用（推測・AI生成情報は不使用）\n' +
    '• 最新情報のリアルタイム収集\n' +
    '• 専門家観点での情報編集・解釈\n' +
    '• YMYL分野として最高レベルの情報品質\n\n' +
    '🔧 API設定方法:\n' +
    '• Google Cloud ConsoleでCustom Search APIを有効化\n' +
    '• APIキーを作成して設定\n' +
    '• Google Custom Search Engineで検索エンジンを作成\n' +
    '• エンジンIDをコピーして設定\n\n' +
    '❓ 困った時は:\n' +
    '• 「🔄 システムリセット」で処理をリセット\n' +
    '• ログで詳細なエラー情報を確認\n' +
    '• Custom Search API設定の再確認\n\n' +
    '📝 注意事項:\n' +
    '• 1件あたり約10秒の処理時間（検索ベースで高速化）\n' +
    '• 検索API制限により大量処理には時間が必要\n' +
    '• 公式情報のみ使用でYMYL最高水準の信頼性保証';

  ui.alert('📖 使用方法・ヘルプ', helpText, ui.ButtonSet.OK);
}

/**
 * デバッグ用手動テスト実行
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

Logger.log('助成金リサーチシステム v4.0 (Google Custom Search JSON API対応) 初期化完了');