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
    try {
        let lang = localStorage.getItem('lang');

        // Если язык ещё не сохранён — определяем по браузеру
        if (!lang) {
            lang = navigator.language.startsWith('ru') ? 'ru' : 'en';
            localStorage.setItem('lang', lang);
        }
        const response = await fetch(`languages/${lang}.json`);
        if (!response.ok) throw new Error('Fetch failed');
        return await response.json();
    } catch (err) {
        console.error('Ошибка загрузки языкового файла', err);
        return {}; // возвращаем пустой объект, чтобы UI не ломался
    }
}

/***********************
 * ЗАГРУЗКА FILES.JSON
 ***********************/
async function loadFileTree() {
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
 * ЗАГРУЗКА КОНКРЕТНОГО ФАЙЛА
 ***********************/
async function loadFile(file) {
    try {
        const extension = file.path.split('.').pop().toLowerCase();

        // Загружаем файл как ArrayBuffer
        const response = await fetch(`data/${file.path}`);
        if (!response.ok) throw new Error('Fetch failed');

        // TXT или CSV
        if (extension === 'txt' || extension === 'csv') {
            const text = await response.text();
            const words = text.split(/\r?\n|,/).map(w => w.trim()).filter(Boolean);
            if (!words.length) throw new Error('EMPTY_FILE');
            return words;
        }

        // XLSX
        if (extension === 'xlsx') {
            const buffer = await response.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            const words = rows.flat().map(w => String(w).trim()).filter(Boolean);
            if (!words.length) throw new Error('EMPTY_FILE');
            return words;
        }

        throw new Error('UNSUPPORTED_FORMAT');

    } catch (err) {
        console.error('Ошибка загрузки файла:', err);
        throw err;
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
async function startGame(file) {
    try {
        const words = await loadFile(file); // загружаем слова из файла
        if (!words.length) throw new Error('EMPTY_FILE');

        // Собираем все слова в одну строку для вывода
        const content = words.join(', '); 

        // Показываем alert с содержимым
        alert(`${uiTexts.game_start_message}\nFile: ${file.name}\nWords:\n${content}`);
        
        // TODO: позже можно передавать words в мини-игру
        console.log('Words loaded:', words);

    } catch (err) {
        if (err.message === 'EMPTY_FILE') {
            alert('Файл пустой!');
        } else if (err.message === 'UNSUPPORTED_FORMAT') {
            alert('Неподдерживаемый формат файла!');
        } else {
            alert('Ошибка при загрузке файла.');
        }
    }
}




/***********************
 * ИНИЦИАЛИЗАЦИЯ САЙТА
 ***********************/
window.addEventListener('DOMContentLoaded', async () => {
    // 1. Загружаем язык
    uiTexts = await loadLanguage();

    // 2. Загружаем структуру файлов
    const files = await loadFileTree();

    if (!files) {
        container.textContent = uiTexts.load_error || 'Failed to load files';
        return;
    }

    // 3. Сохраняем корень и рендерим
    rootData = files;
    renderLevel(rootData);
});
