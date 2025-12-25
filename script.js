/***********************
 * ГЛОБАЛЬНОЕ СОСТОЯНИЕ
 ***********************/

// Тексты интерфейса (ru / en)
let uiTexts = {};

// Корневой уровень дерева из files.json
let rootData = [];

// Стек навигации (храним предыдущие уровни)
let navigationStack = [];

// DOM-элементы
const container = document.getElementById('fileContainer');
const homeBtn = document.getElementById('homeBtn');
const backBtn = document.getElementById('backBtn');


/***********************
 * ЗАГРУЗКА ЯЗЫКА
 ***********************/
async function loadLanguage() {
    let lang = localStorage.getItem('lang');

    // Если язык ещё не сохранён — определяем по браузеру
    if (!lang) {
        lang = navigator.language.startsWith('ru') ? 'ru' : 'en';
        localStorage.setItem('lang', lang);
    }

    const response = await fetch(`languages/${lang}.json`);
    return await response.json();
}


/***********************
 * ЗАГРУЗКА FILES.JSON
 ***********************/
async function loadFiles() {
    try {
        // cache-busting (пока захардкожен)
        const commitHash = 'dev';
        const response = await fetch(`files.json?v=${commitHash}`);
        return await response.json();
    } catch (err) {
        console.error('Ошибка загрузки files.json', err);
        return null;
    }
}


/***********************
 * РЕНДЕР ТЕКУЩЕГО УРОВНЯ
 ***********************/
function renderLevel(level) {
    // Очищаем контейнер
    container.innerHTML = '';

    // Управление видимостью кнопок
    backBtn.style.display = navigationStack.length ? 'inline-block' : 'none';

    // Если папка пустая
    if (!level || level.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.textContent = uiTexts.empty_folder || 'No items in this folder';
        container.appendChild(emptyMsg);
        return;
    }

    // Создаём кнопки папок и файлов
    level.forEach(item => {
        const btn = document.createElement('button');
        btn.textContent = item.name;

        if (item.type === 'folder') {
            btn.onclick = () => {
                // Сохраняем текущий уровень в стек
                navigationStack.push(level);
                // Переходим внутрь папки
                renderLevel(item.children);
            };
        }

        if (item.type === 'file') {
            btn.onclick = () => {
                startGame(item);
            };
        }

        container.appendChild(btn);
    });
}


/***********************
 * НАВИГАЦИЯ
 ***********************/
homeBtn.onclick = () => {
    navigationStack = [];
    renderLevel(rootData);
};

backBtn.onclick = () => {
    const previousLevel = navigationStack.pop();
    renderLevel(previousLevel || rootData);
};


/***********************
 * ЗАГЛУШКА ИГРЫ
 ***********************/
function startGame(file) {
    alert(
        `${uiTexts.game_start_message || 'Starting mini-game!'}\n\nФайл: ${file.name}`
    );
}


/***********************
 * ИНИЦИАЛИЗАЦИЯ САЙТА
 ***********************/
window.addEventListener('DOMContentLoaded', async () => {
    // 1. Загружаем язык
    uiTexts = await loadLanguage();

    // 2. Загружаем структуру файлов
    const files = await loadFiles();

    if (!files) {
        container.textContent = uiTexts.load_error || 'Failed to load files';
        return;
    }

    // 3. Сохраняем корень и рендерим
    rootData = files;
    renderLevel(rootData);
});
