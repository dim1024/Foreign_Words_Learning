/*********************************
 * GAME HUB (выбор режима)
 *********************************/

let gameContainer = null;

/**
 * Закрытие любого игрового окна
 */
function closeGame() {
    if (gameContainer) {
        gameContainer.remove();
        gameContainer = null;
    }
}

/**
 * Точка входа (вызывается из script.js)
 * Теперь это НЕ игра, а окно выбора режима
 */
function startGame(fileData, uiTexts, pairs) {
    closeGame();

    gameContainer = document.createElement('div');
    gameContainer.id = 'gameContainer';
    gameContainer.className = 'game-modal';

    // ─── Header ───────────────────────────
    const header = document.createElement('div');
    header.className = 'game-modal-header';

    const title = document.createElement('h3');
    title.textContent = fileData.name || '';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'game-close-btn';
    closeBtn.textContent = '✖';
    closeBtn.onclick = closeGame;

    header.appendChild(title);
    header.appendChild(closeBtn);

    // ─── Words table ───────────────────────
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'words-table-wrapper';

    const table = document.createElement('table');
    table.className = 'words-table';

    pairs.forEach(p => {
        const row = document.createElement('tr');

        const tdTerm = document.createElement('td');
        tdTerm.textContent = p.term;

        const tdTranslation = document.createElement('td');
        tdTranslation.textContent = p.translation;

        row.appendChild(tdTerm);
        row.appendChild(tdTranslation);
        table.appendChild(row);
    });

    tableWrapper.appendChild(table);

    // ─── Actions ──────────────────────────
    const actions = document.createElement('div');
    actions.className = 'game-actions';

    const learnBtn = document.createElement('button');
    learnBtn.textContent = uiTexts.study || 'Study';
    learnBtn.onclick = () => {
        startLearningGame(pairs, uiTexts);
    };

    const memorizeBtn = document.createElement('button');
    memorizeBtn.textContent = uiTexts.memorize || 'Memorize';
    memorizeBtn.onclick = () => {
        startMemorizingStub(pairs, uiTexts);
    };

    actions.appendChild(learnBtn);
    actions.appendChild(memorizeBtn);

    // ─── Compose ──────────────────────────
    // ─── Window wrapper ──────────────────
    const windowBox = document.createElement('div');
    windowBox.className = 'game-window';

    windowBox.appendChild(header);
    windowBox.appendChild(tableWrapper);
    windowBox.appendChild(actions);

    gameContainer.appendChild(windowBox);


    document.body.appendChild(gameContainer);
}

/*********************************
 * ИГРЫ на ознакомление и заучивание
 *********************************/

function startLearningGame(pairs, uiTexts) {
    closeGame();

    // 🔀 перемешиваем слова
    const shuffled = [...pairs].sort(() => Math.random() - 0.5);
    let index = 0;

    gameContainer = document.createElement('div');
    gameContainer.className = 'study-game';
    // клик по тёмному фону — закрыть
    gameContainer.onclick = closeGame;

    // карточка
    const card = document.createElement('div');
    card.className = 'study-card';

    // красный крестик закрытия (внутри окна)
    const closeBtn = document.createElement('button');
    closeBtn.className = 'study-close-btn';
    closeBtn.textContent = '✖';
    closeBtn.onclick = closeGame;

    card.appendChild(closeBtn);

    // клик по карточке — не закрывает окно
    card.onclick = e => e.stopPropagation();


    const termEl = document.createElement('div');
    termEl.className = 'study-term';

    const translationEl = document.createElement('div');
    translationEl.className = 'study-translation';

    card.appendChild(termEl);
    card.appendChild(translationEl);

    // обновление карточки
    function renderCard() {
        const p = shuffled[index];
        termEl.textContent = p.term;
        translationEl.textContent = p.translation;
    }

    renderCard();

    // кнопки листания
    const controls = document.createElement('div');
    controls.className = 'study-controls';

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '◀';
    prevBtn.onclick = () => {
        index = (index - 1 + shuffled.length) % shuffled.length;
        renderCard();
    };

    const nextBtn = document.createElement('button');
    nextBtn.textContent = '▶';
    nextBtn.onclick = () => {
        index = (index + 1) % shuffled.length;
        renderCard();
    };

    controls.appendChild(prevBtn);
    controls.appendChild(nextBtn);

    // нижние кнопки
    const bottom = document.createElement('div');
    bottom.className = 'study-bottom';

    const memorizeBtn = document.createElement('button');
    memorizeBtn.textContent = uiTexts.memorize || 'Memorize';
    memorizeBtn.onclick = () => {
        startMemorizingStub(pairs, uiTexts);
    };

    bottom.appendChild(memorizeBtn);

    // свайпы
    let startX = null;

    card.addEventListener('touchstart', e => {
        startX = e.touches[0].clientX;
    });

    card.addEventListener('touchend', e => {
        if (startX === null) return;
        const diff = e.changedTouches[0].clientX - startX;

        if (Math.abs(diff) > 50) {
            if (diff > 0) prevBtn.click();
            else nextBtn.click();
        }

        startX = null;
    });

    card.appendChild(controls);
    card.appendChild(bottom);

    gameContainer.appendChild(card);

    document.body.appendChild(gameContainer);
}

function startMemorizingStub(pairs, uiTexts) {
    closeGame();

    gameContainer = document.createElement('div');
    gameContainer.id = 'gameContainer';
    gameContainer.className = 'game-stub';

    gameContainer.innerHTML = `
        <h3>${uiTexts.memorize || 'Memorize mode'}</h3>
        <p>${uiTexts.game_start_message || 'Game started'}</p>
        <p>Words count: ${pairs.length}</p>
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = uiTexts.close_game || 'Close';
    closeBtn.onclick = closeGame;

    gameContainer.appendChild(closeBtn);
    document.body.appendChild(gameContainer);
}
