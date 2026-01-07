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
        startLearningStub(pairs, uiTexts);
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
 * ЗАГЛУШКИ ИГР
 *********************************/

function startLearningStub(pairs, uiTexts) {
    closeGame();

    gameContainer = document.createElement('div');
    gameContainer.id = 'gameContainer';
    gameContainer.className = 'game-stub';

    gameContainer.innerHTML = `
        <h3>${uiTexts.study || 'Study mode'}</h3>
        <p>${uiTexts.game_start_message || 'Game started'}</p>
        <p>Words count: ${pairs.length}</p>
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = uiTexts.close_game || 'Close';
    closeBtn.onclick = closeGame;

    gameContainer.appendChild(closeBtn);
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
