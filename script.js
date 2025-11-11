document.addEventListener('DOMContentLoaded', () => {

    // === 1. 初始化 Firebase ===
    // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
    // !! 警告：請貼上您在階段一取得的 firebaseConfig !!
    // !! 這裡是唯一需要您手動修改的地方 !!
    // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
    const firebaseConfig = {
      apiKey: "AIza...YOUR...KEY",
      authDomain: "YOUR-PROJECT-ID.firebaseapp.com",
      projectId: "YOUR-PROJECT-ID",
      storageBucket: "YOUR-PROJECT-ID.appspot.com",
      messagingSenderId: "123456789",
      appId: "1:12345...web...67890"
    };
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    // 初始化 Firebase
    // 我們使用的是 v9 compat (相容模式)，比較容易上手
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore(); // 取得 Firestore 資料庫實例
    const templatesCol = db.collection('templates'); // 取得 'templates' 集合的引用

    // === 2. 獲取頁面元素 ===
    const searchBox = document.getElementById('searchBox');
    const resultsContainer = document.getElementById('resultsContainer');
    let templates = []; // 儲存從 Firebase 載入的模板

    // === 3. 新增模板 (寫入 Firestore) ===
    const saveTemplateBtn = document.getElementById('saveTemplateBtn');
    const newTitle = document.getElementById('newTitle');
    const newKeywords = document.getElementById('newKeywords');
    const newContent = document.getElementById('newContent');
    const saveStatus = document.getElementById('saveStatus');

    saveTemplateBtn.addEventListener('click', async () => {
        const title = newTitle.value.trim();
        const keywordsStr = newKeywords.value.trim();
        const content = newContent.value.trim();

        if (!title || !keywordsStr || !content) {
            alert('標題、關鍵字和內容皆不可為空！');
            return;
        }

        // 將逗號分隔的關鍵字字串，轉換為陣列
        const keywords = keywordsStr.split(',').map(k => k.trim());
        
        const newTemplateObject = {
            title: title,
            keywords: keywords,
            content: content
        };

        try {
            saveTemplateBtn.disabled = true;
            saveStatus.innerText = '儲存中...';

            // ★★★ 核心：將物件寫入 Firestore ★★★
            const docRef = await templatesCol.add(newTemplateObject);
            
            saveStatus.innerText = `儲存成功! (ID: ${docRef.id})`;
            
            // 清空表單
            newTitle.value = '';
            newKeywords.value = '';
            newContent.value = '';
            
            // 即時更新畫面 (將新模板加入陣列並重新顯示)
            templates.push(newTemplateObject);
            displayTemplates(templates);

            setTimeout(() => { saveStatus.innerText = ''; }, 3000);

        } catch (error) {
            console.error("儲存失敗: ", error);
            saveStatus.innerText = '儲存失敗，請查看 Console。';
            alert('儲存失敗！');
        } finally {
            saveTemplateBtn.disabled = false;
        }
    });


    // === 4. 讀取模板 (從 Firestore 讀取) ===
    async function loadTemplatesFromFirestore() {
        try {
            // ★★★ 核心：從 Firestore 讀取集合 ★★★
            const querySnapshot = await templatesCol.get();

            if (querySnapshot.empty) {
                resultsContainer.innerHTML = '<p>資料庫中尚無模板。請新增您的第一個模板！</p>';
                return;
            }

            templates = []; // 清空本地陣列
            querySnapshot.forEach((doc) => {
                // doc.data() 是不包含 ID 的文件內容
                templates.push(doc.data());
            });

            // 初始顯示所有模板
            displayTemplates(templates);

        } catch (error) {
            console.error("讀取模板資料時發生錯誤:", error);
            resultsContainer.innerHTML = '<p class="error">無法載入模板資料庫。請檢查 Firebase 設定或 Console 錯誤。</p>';
        }
    }

    // === 5. 監聽搜尋框的輸入 (此功能不變) ===
    searchBox.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            displayTemplates(templates); // 如果搜尋框為空，顯示所有模板
            return;
        }

        // 篩選模板 (從已載入的 templates 陣列中)
        const filteredTemplates = templates.filter(template => {
            const titleMatch = template.title.toLowerCase().includes(searchTerm);
            // 確保 keywords 是陣列
            const keywordMatch = Array.isArray(template.keywords) && template.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm));
            return titleMatch || keywordMatch;
        });

        // 顯示篩選結果
        displayTemplates(filteredTemplates);
    });

    // === 6. 負責將模板顯示在畫面上 (此功能不變) ===
    function displayTemplates(templatesToDisplay) {
        if (templatesToDisplay.length === 0) {
            resultsContainer.innerHTML = '<p>找不到符合條件的模板。</p>';
            return;
        }

        resultsContainer.innerHTML = ''; // 清空舊結果
        templatesToDisplay.forEach(template => {
            const templateElement = document.createElement('div');
            templateElement.className = 'template-card';
            
            // 確保 keywords 是陣列再 join
            const keywordsText = Array.isArray(template.keywords) ? template.keywords.join(', ') : '無';

            templateElement.innerHTML = `
                <h2>${template.title}</h2>
                <div class="keywords">
                    <strong>關鍵字:</strong> ${keywordsText}
                </div>
                <div class="content-wrapper">
                    <pre class="template-content">${template.content}</pre>
                </div>
                <button class="copy-btn">複製內容</button>
            `;
            
            resultsContainer.appendChild(templateElement);
        });

        // 為所有「複製內容」按鈕加上事件
        addCopyListeners();
    }

    // === 7. 複製「模板內容」功能的邏輯 (此功能不變) ===
    function addCopyListeners() {
        document.querySelectorAll('.copy-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const content = e.target.previousElementSibling.querySelector('.template-content').innerText;
                
                navigator.clipboard.writeText(content).then(() => {
                    e.target.innerText = '已複製!';
                    e.target.classList.add('copied');
                    setTimeout(() => {
                        e.target.innerText = '複製內容';
                        e.target.classList.remove('copied');
                    }, 1500);
                }).catch(err => {
                    console.error('複製失敗:', err);
                    alert('複製失敗，請手動選取。');
                });
            });
        });
    }

    // === 8. 程式進入點 ===
    loadTemplatesFromFirestore(); // 網頁載入時，自動從 Firebase 讀取資料

});