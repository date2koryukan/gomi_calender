document.addEventListener("DOMContentLoaded", async () => {
    try {
        // 各種JSONデータの読み込み
        const [calendarResponse, areaResponse] = await Promise.all([
            fetch('gomi_calender2026.json'),
            fetch('big_gomi_area.json')
        ]);
        
        const calendarData = await calendarResponse.json();
        const areaData = await areaResponse.json();
        
        // カレンダーデータのマップ化 (高速ルックアップ用)
        const calendarMap = new Map();
        calendarData.forEach(item => {
            const formattedKey = formatDateString(item.date);
            calendarMap.set(formattedKey, item);
        });

        // 粗大ごみエリアデータのマップ化
        const areaMap = new Map();
        areaData.forEach(item => {
            areaMap.set(String(item.no), item.s_area);
        });

        // 「明日」の基準日を設定 (2026年5月25日を現在日として基準に設定)
        const baseDate = new Date(2026, 4, 25); // 月は0から始まるため 4 = 5月
        
        const gridContainer = document.getElementById("calendarGrid");
        gridContainer.innerHTML = "";

        // 明日から数えて6日間を表示
        for (let i = 1; i <= 6; i++) {
            const targetDate = new Date(baseDate);
            targetDate.setDate(baseDate.getDate() + i);

            const year = targetDate.getFullYear();
            const month = targetDate.getMonth() + 1;
            const date = targetDate.getDate();
            const dayOfWeekNum = targetDate.getDay();
            const dayOfWeekStr = ["日", "月", "火", "水", "木", "金", "土"][dayOfWeekNum];

            // 日付文字列キーの作成 (YYYY/MM/DD 形式)
            const lookupKey = `${year}/${String(month).padStart(2, '0')}/${String(date).padStart(2, '0')}`;
            const lookupKeyShort = `${year}/${month}/${date}`;

            // カレンダーから該当日のデータを取得
            const gomiInfo = calendarMap.get(lookupKey) || calendarMap.get(lookupKeyShort) || { type: "", area: "" };

            // カラム要素の生成
            const columnIdx = i - 1;
            const columnEl = document.createElement("div");
            columnEl.className = "calendar-column";

            // 最初の日（明日）に「あした」マーカーを設置
            if (columnIdx === 0) {
                const marker = document.createElement("div");
                marker.className = "tomorrow-marker";
                marker.textContent = "あした";
                columnEl.appendChild(marker);
            }

            // 曜日に応じたCSSクラスの決定
            let dayClass = "weekday";
            if (dayOfWeekNum === 6) dayClass = "sat";
            if (dayOfWeekNum === 0) dayClass = "sun";

            // 日付ヘッダーの追加
            const headerEl = document.createElement("div");
            headerEl.className = `date-header ${dayClass}`;
            headerEl.textContent = `${month}月${date}日(${dayOfWeekStr})`;
            columnEl.appendChild(headerEl);

            // ゴミ種別の判定と表示名の調整、および配色の決定
            let displayType = gomiInfo.type || "(収集なし)";
            let cardClass = "none";

            if (displayType.includes("ガラスびん")) {
                cardClass = "glass-pet";
            } else if (displayType === "粗大ごみ") {
                cardClass = "big-gomi";
            } else if (displayType === "もやせるごみ" || displayType === "もやせるごom") {
                displayType = "もやせるごみ";
                cardClass = "burnable";
            } else if (displayType.includes("古紙")) {
                displayType = "古紙類";
                cardClass = "paper";
            } else if (displayType === "もやせないごみ") {
                cardClass = "unburnable"; // 新設：青色の背景
            } else if (displayType === "プラスチック") {
                cardClass = "plastic";   // 新設：薄い紫色の背景
            }

            // カード要素の追加
            const cardEl = document.createElement("div");
            cardEl.className = `gomi-card ${cardClass}`;
            cardEl.textContent = displayType;
            columnEl.appendChild(cardEl);

            // 粗大ごみの場合の追加地域情報
            if (gomiInfo.type === "粗大ごみ" && gomiInfo.area) {
                const areaInfoEl = document.createElement("div");
                areaInfoEl.className = "area-info";
                
                const sAreaName = areaMap.get(String(gomiInfo.area)) || "";
                
                areaInfoEl.innerHTML = `
                    <div class="area-title">【区域：${gomiInfo.area}】</div>
                    <div>${sAreaName}</div>
                `;
                columnEl.appendChild(areaInfoEl);
            }

            gridContainer.appendChild(columnEl);
        }

    } catch (error) {
        console.error("データの読み込みまたは処理中にエラーが発生しました:", error);
    }
});

// 日付文字列のフォーマットを統一する補助関数
function formatDateString(dateStr) {
    if (!dateStr) return "";
    const parts = dateStr.split('/');
    if (parts.length !== 3) return dateStr;
    const y = parts[0];
    const m = String(parts[1]).padStart(2, '0');
    const d = String(parts[2]).padStart(2, '0');
    return `${y}/${m}/${d}`;
}
