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
        startMemorizingGame(pairs, uiTexts);
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
    // // клик по тёмному фону — закрыть
    // gameContainer.onclick = closeGame;

    // карточка
    const card = document.createElement('div');
    card.className = 'study-card';

    // красный крестик закрытия (внутри окна)
    const closeBtn = document.createElement('button');
    closeBtn.className = 'study-close-btn';
    closeBtn.textContent = '✖';
    closeBtn.onclick = closeGame;

    card.appendChild(closeBtn);

    // // клик по карточке — не закрывает окно
    // card.onclick = e => e.stopPropagation();


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
        startMemorizingGame(pairs, uiTexts);
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

function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function startMemorizingGame(pairs, uiTexts) {
    closeGame();
    let lastQuestionKey = null;
    let lastPairId = null;
    const REQUIRED_QUESTIONS_REPEATS = 2; // количество повторений слов или переводов в вопросах

    gameContainer = document.createElement('div');
    gameContainer.className = 'memorize-game';

    const windowBox = document.createElement('div');
    windowBox.className = 'memorize-window';
    windowBox.style.width = '400px';
    windowBox.style.padding = '20px';
    windowBox.style.borderRadius = '10px';
    windowBox.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    windowBox.style.backgroundColor = '#fff';
    windowBox.style.display = 'flex';
    windowBox.style.flexDirection = 'column';
    windowBox.style.alignItems = 'center';

    // Красный крестик
    const closeBtn = document.createElement('button');
    closeBtn.className = 'memorize-close-btn';
    closeBtn.textContent = '✖';
    closeBtn.style.alignSelf = 'flex-end';
    closeBtn.style.backgroundColor = 'transparent';
    closeBtn.style.border = 'none';
    closeBtn.style.color = 'red';
    closeBtn.style.fontSize = '20px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = closeGame;
    windowBox.appendChild(closeBtn);

    // Вопрос
    const questionEl = document.createElement('div');
    questionEl.className = 'memorize-question';
    questionEl.style.textAlign = 'center';
    questionEl.style.fontSize = '24px';
    questionEl.style.margin = '20px 0';
    windowBox.appendChild(questionEl);

    // Кнопки 2x2
    const answersEl = document.createElement('div');
    answersEl.className = 'memorize-answers';
    answersEl.style.display = 'grid';
    answersEl.style.gridTemplateColumns = '1fr 1fr';
    answersEl.style.gap = '10px';
    windowBox.appendChild(answersEl);

    // ─── Progress бар цифры прогресса 4/12
    const progressText = document.createElement('div');
    progressText.style.marginTop = '12px';
    progressText.style.fontSize = '14px';
    progressText.style.color = '#555';
    progressText.textContent = '0 / 0';
    windowBox.appendChild(progressText);

    // прогресс бар для вопросов в режиме memorize
    const progressWrapper = document.createElement('div');
    progressWrapper.style.width = '100%';
    progressWrapper.style.height = '10px';
    progressWrapper.style.backgroundColor = '#eee';
    progressWrapper.style.borderRadius = '5px';
    progressWrapper.style.overflow = 'hidden';
    progressWrapper.style.marginBottom = '15px';

    const progressBar = document.createElement('div');
    progressBar.style.height = '100%';
    progressBar.style.width = '0%';
    progressBar.style.backgroundColor = '#4CAF50';
    progressBar.style.transition = 'width 0.3s';

    progressWrapper.appendChild(progressBar);
    windowBox.appendChild(progressWrapper);

    gameContainer.appendChild(windowBox);
    document.body.appendChild(gameContainer);

    // Счётчик правильных ответов
    let memorizeProgress = {}; // "слово|word" или "перевод|translation" -> 0..3

    pairs.forEach(p => {
        memorizeProgress[`${p.term}|word`] = 0;
        memorizeProgress[`${p.translation}|translation`] = 0;
    });
    
    const MAX_PROGRESS = pairs.length * 2 * REQUIRED_QUESTIONS_REPEATS; // размер прогресс бара
    updateProgressBar();
 
    function getNextQuestion() {
        const pool = [];

        pairs.forEach(p => {
            const wordKey = `${p.term}|word`;
            const transKey = `${p.translation}|translation`;

            if (memorizeProgress[wordKey] < REQUIRED_QUESTIONS_REPEATS) {
                pool.push({
                    pair: p,
                    direction: 'word',
                    key: wordKey,
                    score: memorizeProgress[wordKey]
                });
            }

            if (memorizeProgress[transKey] < REQUIRED_QUESTIONS_REPEATS) {
                pool.push({
                    pair: p,
                    direction: 'translation',
                    key: transKey,
                    score: memorizeProgress[transKey]
                });
            }
        });

        if (!pool.length) return null;

        // сортируем по наименьшему прогрессу
        pool.sort((a, b) => a.score - b.score);

        // берём всех с минимальным score
        let weakest = pool.filter(x => x.score === pool[0].score);

        // ❗ защита от повтора того же вопроса подряд
        if (weakest.length > 1) {

            // 1. не тот же самый вопрос
            if (lastQuestionKey) {
                const byKey = weakest.filter(x => x.key !== lastQuestionKey);
                if (byKey.length) {
                    weakest = byKey;
                }
            }

            // 2. не то же самое слово (даже в другом направлении)
            if (lastPairId) {
                const byPair = weakest.filter(x => x.pair !== lastPairId);
                if (byPair.length) {
                    weakest = byPair;
                }
            }
        }

        const chosen = weakest[Math.floor(Math.random() * weakest.length)];
        lastQuestionKey = chosen.key;
        lastPairId = chosen.pair;

        return chosen;
    }

    function updateProgressBar() {
        const current = Object.values(memorizeProgress)
            .reduce((sum, v) => sum + v, 0);

        // полоска
        const percent = (current / MAX_PROGRESS) * 100;
        progressBar.style.width = percent + '%';

        // текст прогресса в цифрах 4/12
        progressText.textContent = `${current} / ${MAX_PROGRESS}`;
    }

    function nextQuestion() {
        const next = getNextQuestion();
        if (!next) return showFinished();

        const { pair: p, direction } = next;


        let question, correctAnswer, key;
        if (direction === 'word') {
            // слово → перевод
            question = p.term;
            correctAnswer = p.translation;
            key = `${p.term}|word`;
        } else {
            // перевод → слово
            question = p.translation;
            correctAnswer = p.term;
            key = `${p.translation}|translation`;
        }
        questionEl.textContent = question;

        

        // 3 варианта + "не знаю"
        let options = [correctAnswer];

        const otherOptions = pairs
            .map(x => direction === 'word' ? x.translation : x.term)
            .filter(x => x !== correctAnswer);

        while (options.length < 3 && otherOptions.length > 0) {
            const idx = Math.floor(Math.random() * otherOptions.length);
            options.push(otherOptions.splice(idx, 1)[0]);
        }

        options = shuffleArray(options); // перемешиваем

        answersEl.innerHTML = '';

        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.textContent = opt;
            btn.style.padding = '10px';
            btn.style.borderRadius = '6px';
            btn.style.cursor = 'pointer';
            btn.onclick = () => handleAnswer(btn, opt === correctAnswer, key, correctAnswer, false);
            answersEl.appendChild(btn);
        });

        const dontKnowBtn = document.createElement('button');
        dontKnowBtn.textContent = uiTexts.dont_know;
        dontKnowBtn.style.padding = '10px';
        dontKnowBtn.style.borderRadius = '6px';
        dontKnowBtn.style.cursor = 'pointer';
        dontKnowBtn.onclick = () => handleAnswer(dontKnowBtn, false, key, correctAnswer, true);
        answersEl.appendChild(dontKnowBtn);
    }

    function handleAnswer(button, correct, key, correctAnswer, isDontKnow) {
        if (correct) {
            button.style.backgroundColor = '#8BC34A';
            memorizeProgress[key] = Math.min(REQUIRED_QUESTIONS_REPEATS, memorizeProgress[key] + 1);
            updateProgressBar();
        } else if (!isDontKnow) {
            button.style.backgroundColor = '#F44336';
        }

        Array.from(answersEl.children).forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === correctAnswer) btn.style.backgroundColor = '#8BC34A';
        });

        setTimeout(nextQuestion, 800);
    }

    function showFinished() {
      

        answersEl.innerHTML = '';
        questionEl.textContent = uiTexts.memorize_finished;

        const closeBtnFinish = document.createElement('button');
        closeBtnFinish.textContent = uiTexts.close;
        closeBtnFinish.style.padding = '10px';
        closeBtnFinish.style.borderRadius = '6px';
        closeBtnFinish.onclick = closeGame;

        const repeatBtn = document.createElement('button');
        repeatBtn.textContent = uiTexts.repeat;
        repeatBtn.style.padding = '10px';
        repeatBtn.style.borderRadius = '6px';
        repeatBtn.onclick = () => {
            memorizeProgress = {};
            nextQuestion();
        };

        answersEl.appendChild(closeBtnFinish);
        answersEl.appendChild(repeatBtn);
    }

    nextQuestion();
}


