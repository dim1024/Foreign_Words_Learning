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



const myWordsFolder = {
    name: '',
    type: 'folder',
    children: []
};

function syncMyWordsFolder() {
    myWordsFolder.name = uiTexts.my_words || 'My Words';
    myWordsFolder.children = userFiles
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(f => ({
            name: f.name,
            type: 'file',
            userFile: f
        }));
}

const USER_WORDS_KEY = 'user_words';

function loadUserWords() {
    try {
        return JSON.parse(localStorage.getItem(USER_WORDS_KEY)) || [];
    } catch {
        return [];
    }
}

function saveUserWords(words) {
    localStorage.setItem(USER_WORDS_KEY, JSON.stringify(words));
}

// Пользовательские файлы
let userFiles = loadUserWords();

/***********************
 * ПРОВЕРКА ИМЕН ПОЛЬЗОВАТЕЛЬСКИХ ФАЙЛОВ НА ДУБЛИКАТЫ
 ***********************/
function getUniqueFileName(originalName, existingNames) {
    const dotIndex = originalName.lastIndexOf('.');
    const base = dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;
    const ext = dotIndex !== -1 ? originalName.slice(dotIndex) : '';

    let name = originalName;
    let counter = 2;

    while (existingNames.includes(name)) {
        name = `${base} (${counter})${ext}`;
        counter++;
    }

    return name;
}


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
        syncMyWordsFolder();
        displayLevel = [myWordsFolder, ...displayLevel];
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
                navigationStack.push(level);
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

        if (item.type === 'file') {
            // обёртка для файла + кнопки удаления
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'center';
            wrapper.style.gap = '6px';

            btn.onclick = () => {
                if (item.userFile) {
                    // Пользовательский файл
                    loadAndRunUserFile(item.userFile);
                } else {
                    loadAndRunGame(item);
                }
            };

            wrapper.appendChild(btn);

            // 🗑 только для пользовательских файлов
            if (item.userFile) {
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = '🗑';
                deleteBtn.title = uiTexts.delete_confirm || 'Delete';

                deleteBtn.onclick = (e) => {
                    e.stopPropagation(); // ⛔ чтобы не запускалась игра
                    deleteUserFile(item.userFile);
                };

                wrapper.appendChild(deleteBtn);
            }

            container.appendChild(wrapper);
            return;
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
    openUploadModal();
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
function loadAndRunUserFile(userFileObj) {
    if (!userFileObj.pairs || !userFileObj.pairs.length) {
        alert(uiTexts.file_empty || 'File is empty');
        return;
    }

    closeGame();
    window.startGame(
        { name: userFileObj.name },
        uiTexts,
        userFileObj.pairs
    );
}


/***********************
 * УДАЛЕНИЕ ПОЛЬЗОВАТЕЛЬСКИХ СЛОВ
 ***********************/
function deleteUserFile(userFileObj) {
    const confirmText =
        uiTexts.delete_confirm || 'Are you sure you want to delete this file?';

    if (!confirm(confirmText)) return;

    // удаляем файл из массива
    userFiles = userFiles.filter(f => f !== userFileObj);
    saveUserWords(userFiles);
    syncMyWordsFolder();

    closeGame();

    if (userFiles.length === 0) {
        navigationStack = [];
        renderLevel(rootData);
    } else {
        renderLevel(myWordsFolder.children);
    }
}

/***********************
 * Открытие / закрытие модалки для загрузки пользовательских слов
 ***********************/
function openUploadModal() {
    const modal = document.getElementById('uploadModal');
    modal.style.display = 'flex';

    // Сбрасываем DropZone, чтобы при повторном открытие не запоминалось предыдущего красного или зеленего состояния
    const dropZone = document.getElementById('dropZone');
    if (dropZone) {
        dropZone.className = '';    // убираем valid/invalid/dragging
        setDropIcon('idle');        // 📂
    }
}

function closeUploadModal() {
    document.getElementById('uploadModal').style.display = 'none';
}

/***********************
 * Проверка файла (формат + размер)
 ***********************/
function isValidUserFile(file) {
    const allowed = ['txt', 'csv', 'xlsx'];
    const ext = file.name.split('.').pop().toLowerCase();

    if (!allowed.includes(ext)) return false;
    if (file.size > 5 * 1024 * 1024) return false;

    return true;
}

/***********************
 * Drag & Drop значек
 ***********************/
function setDropIcon(state) {
    const icon = document.getElementById('dropIcon');
    if (!icon) return;

    if (state === 'valid') {
        icon.textContent = '✅';
    } else if (state === 'invalid') {
        icon.textContent = '❌';
    } else {
        icon.textContent = '📂';
    }
}

/***********************
 * Drag & Drop логика
 ***********************/
(function initDragAndDrop() {
    const dropZone = document.getElementById('dropZone');

    if (!dropZone) return;

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();

        const hasFiles = Array.from(e.dataTransfer.types).includes('Files');

        if (hasFiles) {
            dropZone.className = 'dragging';
            setDropIcon('idle'); // 📂
        } else {
            dropZone.className = 'invalid';
            setDropIcon('invalid'); // ❌
        }
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.className = '';
        setDropIcon('idle'); // 📂
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.className = '';

        const file = e.dataTransfer.files[0];

        if (!file) {
            setDropIcon('invalid');
            return;
        }

        if (!isValidUserFile(file)) {
            dropZone.className = 'invalid';
            setDropIcon('invalid'); // ❌
            setTimeout(() => {
                dropZone.className = '';
                setDropIcon('idle'); // сброс
            }, 500);
            return;
        }

        // ✅ только если файл валидный
        dropZone.className = 'valid';
        setDropIcon('valid');  // ✅

        // Через 0.8 сек сбрасываем в нормальное состояние
        setTimeout(() => {
            dropZone.className = '';
            setDropIcon('idle'); // 📂
        }, 1200);

        // Обработка файла
        setTimeout(() => {
            closeUploadModal();
            handleUserFiles([file]);
        }, 800);
    });
})();


/***********************
 * Кнопка Upload (обычный input)
 ***********************/
document.getElementById('uploadFileBtn').onclick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.csv,.xlsx';
    input.multiple = true;

    input.onchange = () => {
        if (!input.files) return;
        closeUploadModal();
        handleUserFiles(Array.from(input.files));
    };

    input.click();
};

//Кнопка Cancel
document.getElementById('closeUploadModal').onclick = closeUploadModal;


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
    syncMyWordsFolder();
    renderLevel(rootData);

    // 4. Добавляем кнопки для скачивания примеров
    renderExampleDownloads();
});


function parsePairsFromText(text) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const pairs = [];

    // const separators = [';', ',', '|', '*', '/', ':', '\t'];
    const separators = ['=>', '->'];

    lines.forEach(line => {
        let separator = separators.find(sep => line.includes(sep));

        // если разделитель не найден — вся строка идет в "term"
        if (!separator) {
            pairs.push({ term: line, translation: '' });
            return;
        }

        const parts = line.split(separator);
        if (parts.length < 2) return;

        const left = parts[0].trim();
        const right = parts.slice(1).join(separator).trim();

        // добавляем строки, где пустое слово или перевод
        if (left || right) {
            pairs.push({ term: left || '', translation: right || '' });
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
        if (!row) return; ///

        //  проверяем на null и undefined
        const left = row[0] != null ? String(row[0]).trim() : '';
        const right = row[1] != null ? String(row[1]).trim() : '';

        // добавляем строки, где пустое слово или перевод
        if (left || right) {
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

function handleUserFiles(files) {
    files.forEach(file => {

        if (file.size > 5 * 1024 * 1024) { // 5 мб
            alert(uiTexts.file_too_large || 'File is too large');
            return;
        }

        const existingNames = userFiles.map(f => f.name);
        const uniqueName = getUniqueFileName(file.name, existingNames);

        (async () => {
            let parsed;

            try {
                if (file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
                    parsed = parsePairsFromText(await file.text());
                } else if (file.name.endsWith('.xlsx')) {
                    parsed = parsePairsFromXLSX(await file.arrayBuffer());
                } else {
                    return;
                }
            } catch {
                alert(uiTexts.file_empty || 'File is empty');
                return;
            }

            showUserWordsPreview(parsed.pairs, () => {

                const newUserFile = {
                    name: uniqueName,
                    pairs: parsed.pairs,
                    meta: parsed.meta
                };

                const temp = [...userFiles, newUserFile];
                const totalSize = new Blob([JSON.stringify(temp)]).size;

                if (totalSize > 5 * 1024 * 1024) {
                    alert(uiTexts.storage_full);
                    return;
                }

                userFiles.push(newUserFile);
                saveUserWords(userFiles);
                syncMyWordsFolder();

                closeGame();
                navigationStack = [rootData];
                renderLevel(myWordsFolder.children);
            });
        })();
    });
}

/***********************
 * для генерации кнопок
 ***********************/
function renderExampleDownloads() {
    const exampleFiles = [
        { name: 'example.txt', label: 'Пример TXT' },
        { name: 'example.xlsx', label: 'Пример XLSX' },
    ];

    const container = document.getElementById('downloadExamples');
    if (!container) return;

    // удаляем старые кнопки (если есть)
    container.querySelectorAll('button').forEach(btn => btn.remove());

    exampleFiles.forEach(file => {
        const btn = document.createElement('button');
        btn.textContent = file.label;

        btn.onclick = () => {
            const link = document.createElement('a');
            link.href = `assets/examples/${file.name}`;
            link.download = file.name;
            link.click();
        };

        container.appendChild(btn);
    });
}



/***********************
 * ПОКАЗЫВАЕТ ПРЕВЬЮ ОКНО ПЕРЕД ЗАГРУЗКОЙ СВОИХ СЛОВ
 ***********************/
function showUserWordsPreview(pairs, onConfirm) {
    const modal = document.getElementById('previewModal');
    const list = document.getElementById('previewList');
    const count = document.getElementById('previewCount');
    const confirmBtn = document.getElementById('confirmPreview');

    list.innerHTML = '';

    // Считаем успешные и ошибочные строки
    const validPairs = pairs.filter(p => p.term && p.translation);
    const invalidPairs = pairs.filter(p => !p.term || !p.translation);

    // Счётчик
    count.textContent = uiTexts.preview_count
        .replace('{total}', pairs.length)
        .replace('{valid}', validPairs.length)
        .replace('{invalid}', invalidPairs.length);

    if (invalidPairs.length > 0) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = uiTexts.fix_empty_rows_to_load; // "Исправьте все пустые строки, чтобы загрузить"
    } else {
        confirmBtn.disabled = false;
        confirmBtn.textContent = uiTexts.confirm_upload; // "Все ок, загрузить"
    }

    pairs.forEach(p => {
        const row = document.createElement('div');
        row.className = 'preview-row';

        const left = document.createElement('span');
        left.textContent = p.term || uiTexts.empty_term;

        const right = document.createElement('span');
        right.textContent = p.translation || uiTexts.empty_translation;

        // Подсветка подозрительных строк (пустой перевод)
        if (!p.translation) {
            right.style.backgroundColor = '#fe8a8aff';
            right.title = 'Пустой перевод!';
        }

        if (!p.term) {
            left.style.backgroundColor = '#f6dd92ff';
            left.title = 'Пустое слово!';
        }

        row.appendChild(left);
        row.appendChild(right);
        list.appendChild(row);
    });

    modal.style.display = 'flex';

    document.getElementById('cancelPreview').onclick = () => {
        modal.style.display = 'none';
    };

    document.getElementById('confirmPreview').onclick = () => {
        if (invalidPairs.length > 0) return; // на всякий случай
        modal.style.display = 'none';
        onConfirm();
    };
}
