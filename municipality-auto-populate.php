<?php
/**
 * Municipality Auto-Population System
 * 市町村自動反映システム
 * 
 * 都道府県が選択されて市町村が空の場合、
 * その都道府県の全市町村を自動的に反映させます
 * 
 * @package Grant_Insight_Perfect
 */

if (!defined('ABSPATH')) {
    exit;
}

/**
 * 都道府県別市町村データ
 * 主要都道府県の市町村リスト
 */
function gi_get_municipalities_by_prefecture($prefecture_name) {
    $municipalities = array(
        
        // 東京都（23特別区 + 市部 + 町村部）
        '東京都' => array(
            // 特別区
            '千代田区', '中央区', '港区', '新宿区', '文京区', '台東区', '墨田区', '江東区', '品川区', '目黒区',
            '大田区', '世田谷区', '渋谷区', '中野区', '杉並区', '豊島区', '北区', '荒川区', '板橋区', '練馬区',
            '足立区', '葛飾区', '江戸川区',
            // 市部
            '八王子市', '立川市', '武蔵野市', '三鷹市', '青梅市', '府中市', '昭島市', '調布市', '町田市', '小金井市',
            '小平市', '日野市', '東村山市', '国分寺市', '国立市', '福生市', '狛江市', '東大和市', '清瀬市', '東久留米市',
            '武蔵村山市', '多摩市', '稲城市', '羽村市', 'あきる野市', '西東京市',
            // 町村部
            '瑞穂町', '日の出町', '檜原村', '奥多摩町'
        ),
        
        // 大阪府
        '大阪府' => array(
            '大阪市', '堺市', '岸和田市', '豊中市', '池田市', '吹田市', '泉大津市', '高槻市', '貝塚市', '守口市',
            '枚方市', '茨木市', '八尾市', '泉佐野市', '富田林市', '寝屋川市', '河内長野市', '松原市', '大東市', '和泉市',
            '箕面市', '柏原市', '羽曳野市', '門真市', '摂津市', '高石市', '藤井寺市', '東大阪市', '泉南市', '四條畷市',
            '交野市', '大阪狭山市', '阪南市', '島本町', '豊能町', '能勢町', '忠岡町', '熊取町', '田尻町', '岬町',
            '太子町', '河南町', '千早赤阪村'
        ),
        
        // 神奈川県
        '神奈川県' => array(
            '横浜市', '川崎市', '相模原市', '横須賀市', '平塚市', '鎌倉市', '藤沢市', '小田原市', '茅ヶ崎市', '逗子市',
            '三浦市', '秦野市', '厚木市', '大和市', '伊勢原市', '海老名市', '座間市', '南足柄市', '綾瀬市',
            '葉山町', '寒川町', '大磯町', '二宮町', '中井町', '大井町', '松田町', '山北町', '開成町', '箱根町',
            '真鶴町', '湯河原町', '愛川町', '清川村'
        ),
        
        // 愛知県
        '愛知県' => array(
            '名古屋市', '豊橋市', '岡崎市', '一宮市', '瀬戸市', '半田市', '春日井市', '豊川市', '津島市', '碧南市',
            '刈谷市', '豊田市', '安城市', '西尾市', '蒲郡市', '犬山市', '常滑市', '江南市', '小牧市', '稲沢市',
            '新城市', '東海市', '大府市', '知多市', '知立市', '尾張旭市', '高浜市', '岩倉市', '豊明市', '日進市',
            '田原市', '愛西市', '清須市', '北名古屋市', '弥富市', 'みよし市', 'あま市', '長久手市',
            '東郷町', '豊山町', '大口町', '扶桑町', '大治町', '蟹江町', '飛島村', '阿久比町', '東浦町',
            '南知多町', '美浜町', '武豊町', '幸田町', '設楽町', '東栄町', '豊根村'
        ),
        
        // 北海道（主要市町村）
        '北海道' => array(
            '札幌市', '函館市', '小樽市', '旭川市', '室蘭市', '釧路市', '帯広市', '北見市', '夕張市', '岩見沢市',
            '網走市', '留萌市', '苫小牧市', '稚内市', '美唄市', '芦別市', '江別市', '赤平市', '紋別市', '士別市',
            '名寄市', '三笠市', '根室市', '千歳市', '滝川市', '砂川市', '歌志内市', '深川市', '富良野市', '登別市',
            '恵庭市', '伊達市', '北広島市', '石狩市', '北斗市', '当別町', '新篠津村', '松前町', '福島町', '知内町',
            '木古内町', '七飯町', '鹿部町', '森町', '八雲町', '長万部町'
        ),
        
        // 福岡県  
        '福岡県' => array(
            '北九州市', '福岡市', '大牟田市', '久留米市', '直方市', '飯塚市', '田川市', '柳川市', '八女市', '筑後市',
            '大川市', '行橋市', '豊前市', '中間市', '小郡市', '筑紫野市', '春日市', '大野城市', '宗像市', '太宰府市',
            '古賀市', '福津市', 'うきは市', '宮若市', '嘉麻市', '朝倉市', 'みやま市', '糸島市',
            '那珂川市', '宇美町', '篠栗町', '志免町', '須恵町', '新宮町', '久山町', '粕屋町', '芦屋町', '水巻町',
            '岡垣町', '遠賀町', '小竹町', '鞍手町', '桂川町', '筑前町', '東峰村', '大刀洗町', '大木町',
            '広川町', '香春町', '添田町', '糸田町', '川崎町', '大任町', '赤村', '福智町', '苅田町', 'みやこ町',
            '吉富町', '上毛町', '築上町'
        ),
        
        // 兵庫県
        '兵庫県' => array(
            '神戸市', '姫路市', '尼崎市', '明石市', '西宮市', '洲本市', '芦屋市', '伊丹市', '相生市', '豊岡市',
            '加古川市', '赤穂市', '西脇市', '宝塚市', '三木市', '高砂市', '川西市', '小野市', '三田市', '加西市',
            '丹波篠山市', '養父市', '丹波市', '南あわじ市', '朝来市', '淡路市', '宍粟市', '加東市', 'たつの市',
            '猪名川町', '多可町', '稲美町', '播磨町', '市川町', '福崎町', '神河町', '太子町', '上郡町', '佐用町',
            '香美町', '新温泉町'
        ),
        
        // 埼玉県
        '埼玉県' => array(
            'さいたま市', '川越市', '熊谷市', '川口市', '行田市', '秩父市', '所沢市', '飯能市', '加須市', '本庄市',
            '東松山市', '春日部市', '狭山市', '羽生市', '鴻巣市', '深谷市', '上尾市', '草加市', '越谷市', '蕨市',
            '戸田市', '入間市', '朝霞市', '志木市', '和光市', '新座市', '桶川市', '久喜市', '北本市', '八潮市',
            '富士見市', '三郷市', '蓮田市', '坂戸市', '幸手市', '鶴ヶ島市', '日高市', '吉川市', 'ふじみ野市',
            '白岡市', '伊奈町', '三芳町', '毛呂山町', '越生町', '滑川町', '嵐山町', '小川町', '川島町', '吉見町',
            '鳩山町', 'ときがわ町', '横瀬町', '皆野町', '長瀞町', '小鹿野町', '東秩父村', '美里町', '神川町', '上里町',
            '寄居町', '宮代町', '杉戸町', '松伏町'
        ),
        
        // 千葉県
        '千葉県' => array(
            '千葉市', '銚子市', '市川市', '船橋市', '館山市', '木更津市', '松戸市', '野田市', '茂原市', '成田市',
            '佐倉市', '東金市', '旭市', '習志野市', '柏市', '勝浦市', '市原市', '流山市', '八千代市', '我孫子市',
            '鴨川市', '鎌ケ谷市', '君津市', '富津市', '浦安市', '四街道市', '袖ケ浦市', '八街市', '印西市', '白井市',
            '富里市', '南房総市', '匝瑳市', '香取市', '山武市', 'いすみ市', '大網白里市',
            '酒々井町', '栄町', '神崎町', '多古町', '東庄町', '九十九里町', '芝山町', '横芝光町', '一宮町',
            '睦沢町', '長生村', '白子町', '長柄町', '長南町', '大多喜町', '御宿町', '鋸南町'
        )
    );
    
    return isset($municipalities[$prefecture_name]) ? $municipalities[$prefecture_name] : array();
}

/**
 * 市町村自動反映メイン関数
 * 
 * @param int $post_id 投稿ID
 * @return bool 反映したかどうか
 */
function gi_auto_populate_municipalities($post_id) {
    // 助成金投稿タイプのみ対象
    if (get_post_type($post_id) !== 'grant') {
        return false;
    }
    
    // 都道府県タクソノミーを取得
    $prefectures = wp_get_post_terms($post_id, 'grant_prefecture', array('fields' => 'names'));
    if (is_wp_error($prefectures) || empty($prefectures)) {
        return false;
    }
    
    // 既存の市町村タクソノミーを確認
    $existing_municipalities = wp_get_post_terms($post_id, 'grant_municipality', array('fields' => 'names'));
    if (is_wp_error($existing_municipalities)) {
        $existing_municipalities = array();
    }
    
    // 既に市町村が設定されている場合はスキップ
    if (!empty($existing_municipalities)) {
        return false;
    }
    
    $all_municipalities = array();
    
    // 各都道府県の市町村を取得
    foreach ($prefectures as $prefecture_name) {
        $municipalities = gi_get_municipalities_by_prefecture($prefecture_name);
        if (!empty($municipalities)) {
            $all_municipalities = array_merge($all_municipalities, $municipalities);
        }
    }
    
    // 重複を除去
    $all_municipalities = array_unique($all_municipalities);
    
    if (!empty($all_municipalities)) {
        // 市町村タクソノミーに設定
        $result = wp_set_post_terms($post_id, $all_municipalities, 'grant_municipality');
        
        if (!is_wp_error($result)) {
            // ログ記録
            error_log("Municipality auto-populated for post {$post_id}: " . implode(', ', $all_municipalities));
            return true;
        }
    }
    
    return false;
}

/**
 * 市町村タクソノミーターム初期化
 * 都道府県別に市町村タームを事前作成
 */
function gi_init_municipality_terms() {
    if (!taxonomy_exists('grant_municipality')) {
        return;
    }
    
    $prefecture_names = array('東京都', '大阪府', '神奈川県', '愛知県', '北海道', '福岡県', '兵庫県', '埼玉県', '千葉県');
    
    foreach ($prefecture_names as $prefecture_name) {
        $municipalities = gi_get_municipalities_by_prefecture($prefecture_name);
        
        foreach ($municipalities as $municipality_name) {
            if (!term_exists($municipality_name, 'grant_municipality')) {
                $result = wp_insert_term(
                    $municipality_name,
                    'grant_municipality',
                    array(
                        'slug' => sanitize_title($municipality_name),
                        'description' => $prefecture_name . 'の' . $municipality_name
                    )
                );
                
                if (!is_wp_error($result)) {
                    // error_log("Created municipality term: {$municipality_name} ({$prefecture_name})");
                }
            }
        }
    }
}

/**
 * 管理画面での市町村自動反映表示
 */
function gi_show_municipality_auto_populate_notice($post) {
    if ($post->post_type !== 'grant') {
        return;
    }
    
    $prefectures = wp_get_post_terms($post->ID, 'grant_prefecture', array('fields' => 'names'));
    $municipalities = wp_get_post_terms($post->ID, 'grant_municipality', array('fields' => 'names'));
    
    if (!empty($prefectures) && empty($municipalities)) {
        echo '<div class="notice notice-info"><p>';
        echo '<strong>💡 市町村自動反映:</strong> ';
        echo '都道府県が選択されていますが市町村が未設定です。保存時に「' . implode(', ', $prefectures) . '」の全市町村が自動的に反映されます。';
        echo '</p></div>';
    }
}

/**
 * WordPressフック登録
 */
function gi_register_municipality_hooks() {
    // 投稿保存時の市町村自動反映
    add_action('save_post_grant', 'gi_auto_populate_municipalities_on_save', 20, 1);
    
    // 市町村ターム初期化
    add_action('after_setup_theme', 'gi_init_municipality_terms');
    
    // 管理画面での通知
    add_action('edit_form_after_title', 'gi_show_municipality_auto_populate_notice');
}

/**
 * save_post時のラッパー関数
 */
function gi_auto_populate_municipalities_on_save($post_id) {
    // 自動保存やリビジョンをスキップ
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (wp_is_post_revision($post_id)) return;
    
    // 権限チェック
    if (!current_user_can('edit_post', $post_id)) return;
    
    // 市町村自動反映を実行
    gi_auto_populate_municipalities($post_id);
}

// フックを登録
gi_register_municipality_hooks();

echo "Municipality auto-population system loaded successfully!\n";
echo "Supported prefectures: 東京都, 大阪府, 神奈川県, 愛知県, 北海道, 福岡県, 兵庫県, 埼玉県, 千葉県\n";
echo "Total municipalities: " . array_sum(array_map('count', array_map('gi_get_municipalities_by_prefecture', array('東京都', '大阪府', '神奈川県', '愛知県', '北海道', '福岡県', '兵庫県', '埼玉県', '千葉県')))) . "\n";
?>