// Заглушка мини-игры
function startGame(fileData, uiTexts) {
    // fileData = { name, type, path }
    // uiTexts = объект с текстами интерфейса из языка

    alert(`${uiTexts.game_start_message}\n\nFile: ${fileData.name}`);
}
