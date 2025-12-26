// Контейнер для игры
let gameContainer = null;

// Функция закрытия игры
function closeGame() {
    if (gameContainer) {
        gameContainer.remove(); // полностью удаляем контейнер с игры
        gameContainer = null;
    }
}

// Заглушка мини-игры
async function startGame(fileData, uiTexts, pairs) {
    // Создаём контейнер для вывода игры
    gameContainer = document.getElementById('gameContainer');
    if (!gameContainer) {
        gameContainer = document.createElement('div');
        gameContainer.id = 'gameContainer';
        gameContainer.style.whiteSpace = 'pre-wrap';
        gameContainer.style.marginTop = '20px';
        gameContainer.style.background = '#f5f5f5';
        gameContainer.style.padding = '10px';
        gameContainer.style.border = '1px solid #ccc';
        document.body.appendChild(gameContainer);
    }

    // Заголовок
    gameContainer.innerHTML = `${uiTexts.game_start_message}\nFile: ${fileData.name}\n\n`;

    // Выводим пары слов
    gameContainer.innerHTML += JSON.stringify(pairs, null, 2);

    // Кнопка закрытия игры, чтобы вернуться к навигации
    const closeBtn = document.createElement('button');
    closeBtn.textContent = uiTexts.close_game || 'Close Game';
    closeBtn.style.display = 'block';
    closeBtn.style.marginTop = '10px';
    closeBtn.onclick = closeGame;
    gameContainer.appendChild(closeBtn);
}