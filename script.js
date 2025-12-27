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

// Пользовательские файлы
let userFiles = []; // { name: string, file: File }

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
    const extension = file.path.split('.').pop().toLowerCase();
    const response = await fetch(`data/${file.path}`);          

    if (!response.ok) throw new Error('FILE_LOAD_ERROR');        

    // TXT / CSV
    if (extension === 'txt' || extension === 'csv') {            
        const text = await response.text();                      
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const pairs = [];

        lines.forEach(line => {
            const match = line.match(/^(.+?)[\s,;|:\-—]+(.+)$/);
            if (!match) return;
            pairs.push({
                term: match[1].trim(),
                translation: match[2].trim()
            });
        });

        if (!pairs.length) throw new Error('EMPTY_FILE');
        return pairs;
    }

    // XLSX
    if (extension === 'xlsx') {
        const buffer = await response.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const pairs = [];

        rows.forEach(row => {
            if (row.length < 2) return;
            pairs.push({ 
                term: String(row[0]).trim(),
                translation: String(row[1]).trim()
            });
        });

        if (!pairs.length) throw new Error('EMPTY_FILE');
        return pairs;    
    }

    throw new Error('UNSUPPORTED_FORMAT');
    
}







/***********************
 * РЕНДЕР ТЕКУЩЕГО УРОВНЯ
 ***********************/
function renderLevel(level) {

    // Создаём копию уровня, чтобы не мутировать оригинал
    let displayLevel = [...level];

    // Добавляем папку "Мои слова" на главном уровне, если есть пользовательские файлы
    if (level === rootData && userFiles.length) {
        const userFolder = {
            name: uiTexts.my_words || 'My Words',
            type: 'folder',
            children: userFiles.map(f => ({ name: f.name, type: 'file', userFile: f }))
        };
        displayLevel = [userFolder, ...displayLevel];
    }

    // Очищаем контейнер
    container.innerHTML = '';

    // Управление видимостью кнопок
    backBtn.style.display = navigationStack.length ? 'inline-block' : 'none';

    // Если папка пустая
    if (!displayLevel || level.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.textContent = uiTexts.empty_folder || 'No items in this folder';
        container.appendChild(emptyMsg);
        return;
    }

    // Создаём кнопки папок и файлов
    displayLevel.forEach(item => {
        const btn = document.createElement('button');
        btn.textContent = item.name;

        if (item.type === 'folder') {
            btn.onclick = () => {
                // Сохраняем текущий уровень в стек
                navigationStack.push(displayLevel);
                // Переходим внутрь папки
                renderLevel(item.children);
            };
        }

        if (item.type === 'file') {
            btn.onclick = () => {
                if (item.userFile) {
                    // Пользовательский файл
                    loadAndRunUserFile(item.userFile);
                } else {
                    loadAndRunGame(item);
                }
            };
        }

        container.appendChild(btn);
    });
}


/***********************
 * НАВИГАЦИЯ
 ***********************/
homeBtn.onclick = () => {
    closeGame();
    navigationStack = [];
    renderLevel(rootData);
};

backBtn.onclick = () => {
    closeGame();
    const previousLevel = navigationStack.pop();
    renderLevel(previousLevel || rootData);
};

const addWordsBtn = document.getElementById('addWordsBtn');

    addWordsBtn.onclick = () => {
        // Создаём невидимый input для выбора файла
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt,.csv,.xlsx';
        input.multiple = true;

        input.onchange = () => {
        if (!input.files) return;

        Array.from(input.files).forEach(file => {
            // Проверка размера файла (5 МБ)
            if (file.size > 5 * 1024 * 1024) {
                alert(uiTexts.file_too_large || 'File is too large');
                return;
            }
            // Добавляем файл в массив
            userFiles.push({ name: file.name, file });
        });

        // если файлов нет — ничего не делаем
        if (!userFiles.length) return;

        // виртуальная папка "Мои слова"
        const myWordsFolder = {
            name: uiTexts.my_words || 'My Words',
            type: 'folder',
            children: userFiles.map(f => ({
                name: f.name,
                type: 'file',
                userFile: f
            }))
        };

        // КЛЮЧЕВОЕ МЕСТО ДЛЯ ПОВЕДЕНИЯ: ЧТОБЫ ВСЕГДА ОТКРЫВАЛАСЬ ПАПКА "МОИ СЛОВА", ПРИ ДОБАВЛЕНИИ НОВЫХ СЛОВ.
        // Закрываем игру, если она была открыта, чтобы она не мешала навигации.
        closeGame();

        // всегда считаем, что "Мои слова" лежит в корне
        navigationStack = [rootData];

        // всегда открываем папку "Мои слова"
        renderLevel(myWordsFolder.children);
    };


    input.click();
};

/***********************
 * ЗАГЛУШКА ИГРЫ
 ***********************/
async function loadAndRunGame(file) {
    try {
        const pairs = await loadFile(file); // загружаем слова из файла
        if (!pairs.length) throw new Error('EMPTY_FILE');

        // Закрываем игру, если она открыта, чтобы навигация работала
        closeGame();

        // Вызываем игру-заглушку с данными
        window.startGame(file, uiTexts, pairs);
        
        // Лог для разработчика
        console.log('Pairs:', pairs);

    } catch (err) {
        if (err.message === 'EMPTY_FILE') {
            alert(uiTexts.file_empty || 'File is empty');
        } else {
            alert(uiTexts.file_load_error || 'Failed to load file');
        }
    }
}


/***********************
 * ЗАГРУЗКА ПОЛЬЗОВАТЕЛЬСКИХ СЛОВ и другое
 ***********************/
async function loadAndRunUserFile(userFileObj) {
    try {
        const file = userFileObj.file;
        const extension = file.name.split('.').pop().toLowerCase();

        let pairs;

        if (extension === 'txt' || extension === 'csv') {
            const text = await file.text();
            pairs = parsePairsFromText(text).pairs;
        } else if (extension === 'xlsx') {
            const buffer = await file.arrayBuffer();
            pairs = parsePairsFromXLSX(buffer).pairs;
        } else {
            throw new Error('UNSUPPORTED_FORMAT');
        }

        if (!pairs.length) throw new Error('EMPTY_FILE');

        closeGame();
        window.startGame({ name: file.name }, uiTexts, pairs);

    } catch (err) {
        if (err.message === 'EMPTY_FILE') {
            alert(uiTexts.file_empty || 'File is empty');
        } else {
            alert(uiTexts.upload_error || 'Failed to upload file');
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


function parsePairsFromText(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const pairs = [];

    const separators = [';', ',', '|', '—', '-', ':', '\t'];

    lines.forEach(line => {
        let separator = separators.find(sep => line.includes(sep));

        // если разделитель не найден — используем первый пробел
        if (!separator) {
            const firstSpaceIndex = line.indexOf(' ');
            if (firstSpaceIndex === -1) return;

            const left = line.slice(0, firstSpaceIndex).trim();
            const right = line.slice(firstSpaceIndex + 1).trim();
            if (left && right) {
                pairs.push({ term: left, translation: right });
            }
            return;
        }

        const parts = line.split(separator);
        if (parts.length < 2) return;

        const left = parts[0].trim();
        const right = parts.slice(1).join(separator).trim();

        if (left && right) {
            pairs.push({ term: left, translation: right });
        }
    });

    if (!pairs.length) throw new Error('EMPTY_FILE');

    return {
        pairs,
        meta: {
            source: 'txt',
            count: pairs.length
        }
    };
}

function parsePairsFromXLSX(buffer) {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const pairs = [];

    rows.forEach(row => {
        if (!row || row.length < 2) return;

        const left = String(row[0]).trim();
        const right = String(row[1]).trim();

        if (left && right) {
            pairs.push({ term: left, translation: right });
        }
    });

    if (!pairs.length) throw new Error('EMPTY_FILE');

    return {
        pairs,
        meta: {
            source: 'xlsx',
            count: pairs.length
        }
    };
}


