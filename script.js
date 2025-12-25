// Функция определения языка пользователя
async function loadLanguage() {
    let lang = localStorage.getItem('lang');
    if (!lang) {
        // Определяем язык по браузеру
        lang = navigator.language.startsWith('ru') ? 'ru' : 'en';
        localStorage.setItem('lang', lang);
    }
    const response = await fetch(`languages/${lang}.json`);
    const uiTexts = await response.json();
    return uiTexts;
}


// Загрузка files.json
async function loadFiles() {
    try {
        // cache-busting через commit hash
        const commitHash = "123abc"; // можно временно захардкодить, потом брать автоматически
        const response = await fetch(`files.json?v=${commitHash}`);
        const files = await response.json();
        return files;
    } catch (err) {
        console.error(err);
        return null;
    }
}

// Рендер кнопок для текущего уровня дерева
function renderFiles(files, container, uiTexts) {
    container.innerHTML = ''; // очищаем контейнер
    if (!files || files.length === 0) {
        container.innerHTML = `<p>${uiTexts.empty_folder}</p>`;
        return;
    }

    files.forEach(item => {
        const btn = document.createElement('button');
        btn.textContent = item.name;
        if (item.type === 'folder') {
            btn.addEventListener('click', () => {
                renderFiles(item.children, container, uiTexts);
            });
        } else if (item.type === 'file') {
            btn.addEventListener('click', () => {
                startGame(item, uiTexts); // функция заглушки игры
            });
        }
        container.appendChild(btn);
    });
}

// Инициализация на старте сайта
window.addEventListener('DOMContentLoaded', async () => {
    const uiTexts = await loadLanguage();
    const files = await loadFiles();
    const container = document.getElementById('fileContainer'); // <div id="fileContainer"></div> в index.html
    if (!files) {
        container.innerHTML = `<p>${uiTexts.load_error}</p>`;
        return;
    }
    renderFiles(files, container, uiTexts);
});

