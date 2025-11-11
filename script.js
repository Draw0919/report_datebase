document.addEventListener('DOMContentLoaded', () => {
    const searchBox = document.getElementById('searchBox');
    const resultsContainer = document.getElementById('resultsContainer');
    let templates = []; // 用來儲存所有模板

    // 1. 讀取 JSON 檔案
    fetch('templates.json')
        .then(response => response.json())
        .then(data => {
            templates = data;
            displayTemplates(templates); // 初始顯示所有模板
        })
        .catch(error => {
            console.error('讀取模板資料時發生錯誤:', error);
            resultsContainer.innerHTML = '<p class="error">無法載入模板資料庫。</p>';
        });

    // 2. 監聽搜尋框的輸入
    searchBox.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            displayTemplates(templates); // 如果搜尋框為空，顯示所有模板
            return;
        }

        // 3. 篩選模板
        const filteredTemplates = templates.filter(template => {
            const titleMatch = template.title.toLowerCase().includes(searchTerm);
            const keywordMatch = template.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm));
            return titleMatch || keywordMatch;
        });

        // 4. 顯示篩選結果
        displayTemplates(filteredTemplates);
    });

    // 5. 負責將模板顯示在畫面上
    function displayTemplates(templatesToDisplay) {
        if (templatesToDisplay.length === 0) {
            resultsContainer.innerHTML = '<p>找不到符合條件的模板。</p>';
            return;
        }

        resultsContainer.innerHTML = ''; // 清空舊結果
        templatesToDisplay.forEach(template => {
            const templateElement = document.createElement('div');
            templateElement.className = 'template-card';
            
            // 處理模板內容中的換行符號 (\n) 轉換為 <br>
            const formattedContent = template.content.replace(/\n/g, '<br>');

            templateElement.innerHTML = `
                <h2>${template.title}</h2>
                <div class="keywords">
                    <strong>關鍵字:</strong> ${template.keywords.join(', ')}
                </div>
                <div class="content-wrapper">
                    <pre class="template-content">${template.content}</pre>
                </div>
                <button class="copy-btn">複製內容</button>
            `;
            
            resultsContainer.appendChild(templateElement);
        });

        // 6. 為所有複製按鈕加上事件
        addCopyListeners();
    }

    // 7. 複製功能的邏輯
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
});