let gameContainer = null;

function closeGame() { //Закрытие любого игрового окна
    if (window.__memorizeHandleOutsideClick) {
        document.removeEventListener('click', window.__memorizeHandleOutsideClick);
        window.__memorizeHandleOutsideClick = null;
    }

    if (gameContainer) {
        gameContainer.remove();
        gameContainer = null;
    }
}


function startGame(fileData, uiTexts, pairs) { //Точка входа (вызывается из script.js)
    // ⛔ создаём локальную копию пар, чтобы можно было отключать слова, не ломая оригинал
    const localPairs = pairs.map(p => ({
        ...p,
        disabled: false
    }));

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

    const list = document.createElement('div');
    list.className = 'words-list';

    localPairs.forEach(p => {
        const row = document.createElement('div');
        row.className = 'word-row';

        const term = document.createElement('div');
        term.textContent = p.term;
        term.className = 'word-cell';

        const translation = document.createElement('div');
        translation.textContent = p.translation;
        translation.className = 'word-cell';

        // кнопка удалить / вернуть
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'word-toggle-btn delete';
        // toggleBtn.innerHTML = '🗑';
        toggleBtn.innerHTML = '🗑️';
        
        toggleBtn.title = uiTexts.exclude_word;

        toggleBtn.onclick = () => {
            p.disabled = !p.disabled;

            if (p.disabled) {
                row.classList.add('word-disabled');
                // toggleBtn.innerHTML = '↩';
                toggleBtn.innerHTML = '↩️';
                toggleBtn.className = 'word-toggle-btn restore';
                toggleBtn.title = uiTexts.restore_word;
            } else {
                row.classList.remove('word-disabled');
                toggleBtn.innerHTML = '🗑️';
                toggleBtn.className = 'word-toggle-btn delete';
                toggleBtn.title = uiTexts.exclude_word;
            }
        };

        row.appendChild(term);
        row.appendChild(translation);
        row.appendChild(toggleBtn);

        list.appendChild(row);
    });

    tableWrapper.appendChild(list);

    // ─── Actions ──────────────────────────
    const actions = document.createElement('div');
    actions.className = 'game-actions';

    const studyBtn = document.createElement('button');
    studyBtn.textContent = uiTexts.study;
    studyBtn.className = 'answer-btn';
    studyBtn.onclick = () => {
        const activePairs = localPairs.filter(p => !p.disabled);
        if (!activePairs.length) {
            alert(uiTexts.no_selected_words);
            return;
        }
        startStudyGame(activePairs, uiTexts, fileData);
    };


    const memorizeBtn = document.createElement('button');
    memorizeBtn.textContent = uiTexts.memorize;
    memorizeBtn.className = 'answer-btn';
    memorizeBtn.onclick = () => {
        const activePairs = localPairs.filter(p => !p.disabled);
        if (!activePairs.length) {
            alert(uiTexts.no_selected_words);
            return;
        }
        startMemorizingGame(activePairs, uiTexts, fileData);
    };

    const quickCheckBtn = document.createElement('button');
    quickCheckBtn.textContent = uiTexts.quick_check;
    quickCheckBtn.className = 'answer-btn';
    quickCheckBtn.onclick = () => {
        const activePairs = localPairs.filter(p => !p.disabled);
        if (!activePairs.length) {
            alert(uiTexts.no_selected_words);
            return;
        }
        startQuickCheckGame(activePairs, uiTexts, fileData);
    };

    actions.appendChild(studyBtn);
    actions.appendChild(memorizeBtn);
    actions.appendChild(quickCheckBtn);

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

function startStudyGame(pairs, uiTexts, fileData) {
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
    closeBtn.className = 'memorize-close-btn';
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
    prevBtn.textContent = '<<';
    prevBtn.onclick = () => {
        index = (index - 1 + shuffled.length) % shuffled.length;
        renderCard();
    };

    const nextBtn = document.createElement('button');
    nextBtn.textContent = '>>';
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
    memorizeBtn.textContent = uiTexts.memorize;
    memorizeBtn.onclick = () => {
        startMemorizingGame(pairs, uiTexts, fileData);
    };

    bottom.appendChild(memorizeBtn);

    const quickCheckBtn = document.createElement('button');
    quickCheckBtn.textContent = uiTexts.quick_check;
    quickCheckBtn.onclick = () => {
        startQuickCheckGame(pairs, uiTexts, fileData);
    };

    bottom.appendChild(quickCheckBtn);


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

function startMemorizingGame(pairs, uiTexts, fileData) {
    closeGame();

    const DEBUG_MEMORIZE_FINISH = 0; // <-- включить дебаг
    // const DEBUG_MODE = 'none'
    // const DEBUG_MODE = 'mistakes'
    const DEBUG_MODE = 'frequent' 

    let lastQuestionKey = null;
    let lastPairTerm = null;
    let REQUIRED_CORRECT_ANSWERS_PER_ITEM = Number(localStorage.getItem('memorizeRepeats')) || 2; // количество повторений слов или переводов в вопросах.

    gameContainer = document.createElement('div');
    gameContainer.className = 'memorize-game';

    const windowBox = document.createElement('div');
    windowBox.className = 'game-window game-play-window';

    // Красный крестик
    const closeBtn = document.createElement('button');
    closeBtn.className = 'memorize-close-btn';
    closeBtn.textContent = '✖';
    closeBtn.onclick = () => {
        document.removeEventListener('click', handleOutsideClick);
        closeGame();
    };
    windowBox.appendChild(closeBtn);

    // ─── Настройка количества повторений (1–5) прямо в окне режима MEMORIZE

    // ⚙️ кнопка настроек
    const settingsBtn = document.createElement('button');
    settingsBtn.textContent = '⚙️';
    settingsBtn.className = 'memorize-settings-btn';
    windowBox.appendChild(settingsBtn);

    // ⚙️ панель настроек (скрыта)
    const settingsPanel = document.createElement('div');
    settingsPanel.className = 'memorize-settings-panel hidden';

    const settingsTitle = document.createElement('div');
    settingsTitle.textContent = uiTexts.word_repetitions;
    settingsTitle.className = 'word_repetitions_setting';
    settingsPanel.appendChild(settingsTitle);

    settingsBtn.onclick = () => {
        settingsPanel.classList.toggle('hidden');
    };

    // кнопки количества повторений
    const repeatRow = document.createElement('div');
    repeatRow.className = 'memorize-repeat-row';
    settingsPanel.appendChild(repeatRow);
 
    const repeatButtons = [];
    for (let i = 1; i <= 5; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;

        if (i === REQUIRED_CORRECT_ANSWERS_PER_ITEM) {
            btn.classList.add('active');
        }

        btn.onclick = () => {
            REQUIRED_CORRECT_ANSWERS_PER_ITEM = i;
            localStorage.setItem('memorizeRepeats', i);

            repeatButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
                    
            // 🔁 перезапуск игры с новым значением
            memorizeProgress = {};
            mistakesCount = {}; // <-- ВАЖНО

            pairs.forEach(p => {
                memorizeProgress[`${p.term}|word`] = 0;
                memorizeProgress[`${p.translation}|translation`] = 0;

                mistakesCount[`${p.term}|word`] = 0;
                mistakesCount[`${p.translation}|translation`] = 0;
            });

            updateProgressBar();
            nextQuestion();
        };


        repeatButtons.push(btn);
        repeatRow.appendChild(btn);
    }

    // кнопка ОК для закрытия окна настроек
    const okBtn = document.createElement('button');
    okBtn.textContent = uiTexts.ok;
    okBtn.className = 'word_repetitions_setting_ok';
    okBtn.onclick = () => {
        settingsPanel.classList.add('hidden');
    };
    settingsPanel.appendChild(okBtn);

    windowBox.appendChild(settingsPanel);

    // закрытие панели настроек ⚙️ по клику вне её
    document.addEventListener('click', handleOutsideClick);

    function handleOutsideClick(e) {
        // если панель скрыта — ничего не делаем
        if (settingsPanel.classList.contains('hidden')) return;

        // клик был по кнопке ⚙️ или внутри панели — игнорируем
        if (
            settingsPanel.contains(e.target) ||
            settingsBtn.contains(e.target)
        ) {
            return;
        }

        // иначе — закрываем панель
        settingsPanel.classList.add('hidden');
    }
    
    // сохраняем функцию, чтобы можно было удалить при закрытии
    window.__memorizeHandleOutsideClick = handleOutsideClick;

    // Вопрос
    const questionEl = document.createElement('div');
    questionEl.className = 'memorize-question';
    windowBox.appendChild(questionEl);

    // Кнопки 2x2
    const answersEl = document.createElement('div');
    answersEl.className = 'memorize-answers';
    windowBox.appendChild(answersEl);

    // ─── Progress бар цифры прогресса 4/12
    const progressText = document.createElement('div');
    progressText.className = 'memorize-progress-text';
    progressText.textContent = '0 / 0';
    windowBox.appendChild(progressText);

    // прогресс бар для вопросов в режиме memorize
    const progressWrapper = document.createElement('div');
    progressWrapper.className = 'progress-wrapper';

    const progressBar = document.createElement('div');
    progressBar.className = 'memorize-progress-bar';

    progressWrapper.appendChild(progressBar);
    windowBox.appendChild(progressWrapper);

    gameContainer.appendChild(windowBox);
    document.body.appendChild(gameContainer);

    // Счётчик правильных ответов
    let memorizeProgress = {}; // "слово|word" или "перевод|translation" -> 0..3
    // Счётчик ошибок
    let mistakesCount = {};

    pairs.forEach(p => {
        memorizeProgress[`${p.term}|word`] = 0;
        memorizeProgress[`${p.translation}|translation`] = 0;

        mistakesCount[`${p.term}|word`] = 0;
        mistakesCount[`${p.translation}|translation`] = 0; 

    });
    
    updateProgressBar();
 
    function getNextQuestion() {
        const pool = [];

        pairs.forEach(p => {
            const wordKey = `${p.term}|word`;
            const transKey = `${p.translation}|translation`;

            if (memorizeProgress[wordKey] < REQUIRED_CORRECT_ANSWERS_PER_ITEM) {
                pool.push({
                    pair: p,
                    direction: 'word',
                    key: wordKey,
                    score: memorizeProgress[wordKey]
                });
            }

            if (memorizeProgress[transKey] < REQUIRED_CORRECT_ANSWERS_PER_ITEM) {
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
            if (lastPairTerm) {
                const byPair = weakest.filter(x => x.pair !== lastPairTerm);
                if (byPair.length) {
                    weakest = byPair;
                }
            }
        }

        const chosen = weakest[Math.floor(Math.random() * weakest.length)];
        lastQuestionKey = chosen.key;
        lastPairTerm = chosen.pair;

        return chosen;
    }

    function updateProgressBar() {
        const current = Object.values(memorizeProgress)
            .reduce((sum, v) => sum + v, 0);

        const MAX_PROGRESS = pairs.length * 2 * REQUIRED_CORRECT_ANSWERS_PER_ITEM; // размер прогресс бара

        // полоска
        const percent = (current / MAX_PROGRESS) * 100;
        progressBar.style.width = percent + '%';

        // текст прогресса в цифрах 4/12
        progressText.textContent = `${uiTexts.correct_answers}: ${current}/${MAX_PROGRESS}`;
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
        questionEl.classList.remove('question-transition');
        void questionEl.offsetWidth; // перезапуск анимации
        questionEl.textContent = question;
        questionEl.classList.add('question-transition');

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
            btn.className = 'answer-btn';
            btn.onclick = () => handleAnswer(btn, opt === correctAnswer, key, correctAnswer, false);
            answersEl.appendChild(btn);
        });

        const dontKnowBtn = document.createElement('button');
        dontKnowBtn.textContent = uiTexts.dont_know;
        dontKnowBtn.className = 'answer-btn';
        dontKnowBtn.onclick = () => handleAnswer(dontKnowBtn, false, key, correctAnswer, true);
        answersEl.appendChild(dontKnowBtn);
    }

    function handleAnswer(button, correct, key, correctAnswer, isDontKnow) {
        if (correct) {
            button.style.backgroundColor = '#8BC34A';
            button.classList.add('correct-pop'); // правильный ответ подпрыгивает
            memorizeProgress[key] = Math.min(REQUIRED_CORRECT_ANSWERS_PER_ITEM, memorizeProgress[key] + 1);
            updateProgressBar();
        } else if (!isDontKnow) {
            button.style.backgroundColor = '#F44336';
        }

        if (!correct) {
            mistakesCount[key] = (mistakesCount[key] || 0) + 1;
        }


        Array.from(answersEl.children).forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === correctAnswer) btn.style.backgroundColor = '#8BC34A';
        });

        setTimeout(nextQuestion, 800);
    }

    function showFinished() {
        // убираем настройки в финальном окне
        settingsBtn.style.display = 'none';
        settingsPanel.style.display = 'none';

        // Убираем прогресс бар из последнего окна MEMORIZE
        progressText.style.display = 'none';
        progressWrapper.style.display = 'none';

        // Считаем ошибки
        const frequentMistakesPairs = []; // частые ошибки (2+)
        const rareMistakesPairs = []; // редкие ошибки (1)

        // =========================
        // DEBUG MODE: подменяем ошибки
        // =========================
        if (DEBUG_MEMORIZE_FINISH) {

            // сначала обнуляем сбрасываем все ошибки
            mistakesCount = {};

            if (DEBUG_MODE === 'frequent') { // 2 частые, 1 редкая
                pairs = [
                    { term: 'cat', translation: 'кот' },
                    { term: 'dog', translation: 'собака' },
                    { term: 'fox', translation: 'лиса' }
                ];

                mistakesCount['cat|word'] = 2;
                mistakesCount['кот|translation'] = 0;

                mistakesCount['dog|word'] = 1;
                mistakesCount['собака|translation'] = 1;

                mistakesCount['fox|word'] = 0;
                mistakesCount['лиса|translation'] = 1;

            } else if (DEBUG_MODE === 'mistakes') { // 2 редкие
                pairs = [
                    { term: 'HOME', translation: 'ДОМ' },
                    { term: 'SUN', translation: 'СОЛНЦЕ' }
                ];

                mistakesCount['HOME|word'] = 1;
                mistakesCount['ДОМ|translation'] = 0;

                mistakesCount['SUN|word'] = 0;
                mistakesCount['СОЛНЦЕ|translation'] = 1;

            } else if (DEBUG_MODE === 'none') {
                pairs = [
                    { term: 'sky', translation: 'небо' },
                    { term: 'water', translation: 'вода' }
                ];

                mistakesCount['sky|word'] = 0;
                mistakesCount['небо|translation'] = 0;

                mistakesCount['water|word'] = 0;
                mistakesCount['вода|translation'] = 0;
            }


        }

        pairs.forEach(p => {
            const wKey = `${p.term}|word`;
            const tKey = `${p.translation}|translation`;

            const wordErrors = mistakesCount[wKey] || 0;
            const translationErrors = mistakesCount[tKey] || 0;

            const totalErrorsInPair = wordErrors + translationErrors;

            if (totalErrorsInPair >= 2) { // Если есть частые ошибки
                frequentMistakesPairs.push({
                    term: p.term,
                    translation: p.translation,
                    errors: {
                        word: wordErrors,
                        translation: translationErrors
                    }
                });
            } else if (totalErrorsInPair === 1) { // Если есть редкие рошибки
                rareMistakesPairs.push({
                    term: p.term,
                    translation: p.translation,
                    errors: {
                        word: wordErrors,
                        translation: translationErrors
                    }
                });
            }
        });      

        answersEl.innerHTML = '';
        questionEl.textContent = uiTexts.memorize_finished;

        // =====================
        // КНОПКИ (2 варианта)
        // =====================

        const closeBtnFinish = document.createElement('button');
        closeBtnFinish.textContent = uiTexts.close;
        closeBtnFinish.className = 'answer-btn';
        closeBtnFinish.onclick = () => {
            document.removeEventListener('click', handleOutsideClick);
            closeGame();
        };

        const repeatBtn = document.createElement('button');
        repeatBtn.textContent = uiTexts.repeat;
        repeatBtn.className = 'answer-btn';
        repeatBtn.onclick = () => {
            startMemorizingGame(pairs, uiTexts, fileData);
        };

        // =======================
        // 1) Если есть частые ошибки
        // =======================
        if (frequentMistakesPairs.length > 0) {

            questionEl.textContent = uiTexts.words_with_frequent_mistakes; 

            const mistakesBlock = document.createElement('div');
            mistakesBlock.className = 'mistakes-list';

            frequentMistakesPairs.forEach(mp => {
                const row = document.createElement('div');
                row.className = 'mistakes-row';

                const term = document.createElement('div');
                term.className = 'mistakes-cell';
                term.textContent = mp.term;

                const translation = document.createElement('div');
                translation.className = 'mistakes-cell';
                translation.textContent = mp.translation;

                row.appendChild(term);
                row.appendChild(translation);
                mistakesBlock.appendChild(row);
            });

            windowBox.appendChild(mistakesBlock);

            // Кнопки
            const repeatMistakesBtn = document.createElement('button');
            repeatMistakesBtn.innerHTML = `
                <div>${uiTexts.repeat}</div>
                <div style="font-size: 11px; opacity: 0.7;">
                    ${uiTexts.only_mistakes}
                </div>
            `;
            repeatMistakesBtn.className = 'answer-btn';

            repeatMistakesBtn.onclick = () => {
                startMemorizingGame(
                    frequentMistakesPairs.map(x => ({ term: x.term, translation: x.translation })),
                    uiTexts,
                    fileData
                );
            };

            // кнопка сохранить ошибки в папку frequent Mistakes. С анимацией
            const saveMistakesBtn = document.createElement('button');
            saveMistakesBtn.textContent = uiTexts.save_to_frequent_mistakes;
            saveMistakesBtn.className = 'save-mistakes-btn';

            // ВАЖНО: кнопка будет "живой" и менять текст/функцию
            saveMistakesBtn.onclick = async () => {

                // 1) Включаем анимацию
                saveMistakesBtn.disabled = true;
                saveMistakesBtn.classList.add('save-animate', 'success');
                saveMistakesBtn.textContent = uiTexts.saved_success;

                // 2) сохраняем файл
                saveMistakesFile(frequentMistakesPairs, fileData.name, 'mistakes');

                // 3) через 0.8 секунды меняем кнопку на "Открыть папку"
                setTimeout(() => {

                    saveMistakesBtn.classList.remove('success');
                    saveMistakesBtn.textContent = uiTexts.open_frequent_mistakes;
                    saveMistakesBtn.disabled = false;

                    // меняем действие кнопки
                    saveMistakesBtn.onclick = () => {
                        // закрываем игру
                        document.removeEventListener('click', handleOutsideClick);
                        closeGame();

                        // открываем папку Frequent Mistakes
                        navigationStack = [];
                        currentFolder = rootData;
                        renderLevel(rootData);

                        // переходим в папку Frequent Mistakes
                        const frequentFolder = frequentMistakesFolder.children;
                        navigationStack.push(rootData);
                        currentFolder = frequentFolder;
                        renderLevel(frequentFolder);
                    };

                }, 1600);
            };




            windowBox.appendChild(saveMistakesBtn);

            const finishActions = document.createElement('div');
            finishActions.className = 'game-actions';
            
            finishActions.appendChild(repeatBtn);
            finishActions.appendChild(repeatMistakesBtn);
            finishActions.appendChild(closeBtnFinish);

            windowBox.appendChild(finishActions);

            return; // важно! чтобы дальше не выполнялось
        }

        // =======================
        // 2) Если частых ошибок нет
        // =======================

        // общий подсчёт ошибок
        const totalMistakes = Object.values(mistakesCount)
            .reduce((sum, v) => sum + v, 0);

        if (totalMistakes === 0) {
            questionEl.textContent = uiTexts.no_mistakes;;
            launchConfetti();
        } else {
            questionEl.textContent = uiTexts.rare_mistakes_count
                .replace('{count}', rareMistakesPairs.length);
        }

        const finishActions = document.createElement('div');
        finishActions.className = 'game-actions';
        finishActions.appendChild(repeatBtn);
        finishActions.appendChild(closeBtnFinish);

        windowBox.appendChild(finishActions);

    }

    if (DEBUG_MEMORIZE_FINISH) { //уудалить А ee
        showFinished();
        return;
    }
    nextQuestion();

}

function startQuickCheckGame(pairs, uiTexts, fileData) {
    closeGame();

    const DEBUG_QUICK_CHECK_FINISH = 0; // <-- включить дебаг
    // const DEBUG_MODE = 'none'
    // const DEBUG_MODE = 'mistakes' 
    const DEBUG_MODE = 'all_mistakes';

    gameContainer = document.createElement('div');
    gameContainer.className = 'memorize-game';

    const windowBox = document.createElement('div');
    windowBox.className = 'game-window game-play-window';

    // Красный крестик
    const closeBtn = document.createElement('button');
    closeBtn.className = 'memorize-close-btn';
    closeBtn.textContent = '✖';
    closeBtn.onclick = closeGame;
    windowBox.appendChild(closeBtn);

    // Вопрос
    const questionEl = document.createElement('div');
    questionEl.className = 'memorize-question';
    windowBox.appendChild(questionEl);

    // Кнопки 2x2
    const answersEl = document.createElement('div');
    answersEl.className = 'memorize-answers';
    windowBox.appendChild(answersEl);

    // ─── Progress бар цифры прогресса 4/12
    const progressText = document.createElement('div');
    progressText.className = 'memorize-progress-text';
    progressText.textContent = '0 / 0';
    windowBox.appendChild(progressText);

    // прогресс бар для вопросов в режиме memorize
    const progressWrapper = document.createElement('div');
    progressWrapper.className = 'progress-wrapper';

    const progressBar = document.createElement('div');
    progressBar.className = 'memorize-progress-bar';

    progressWrapper.appendChild(progressBar);
    windowBox.appendChild(progressWrapper);

    gameContainer.appendChild(windowBox);
    document.body.appendChild(gameContainer);

    // Счётчик ошибок
    let mistakesCount = {};

    // ============================
    // QUICK CHECK: список вопросов
    // ============================
    let questions = [];

    pairs.forEach(p => {
        questions.push({
            pair: p,
            direction: 'word'
        });
        questions.push({
            pair: p,
            direction: 'translation'
        });
    });

    // полный шафл
    questions = shuffleArray(questions);

    let currentQuestionIndex = 0;
    let lastPair = null;

    const TOTAL_QUESTIONS = questions.length;

    pairs.forEach(p => {
        mistakesCount[`${p.term}|word`] = 0;
        mistakesCount[`${p.translation}|translation`] = 0; 
    });
    
    updateProgressBar();
 
    function updateProgressBar() {
        const current = currentQuestionIndex;
        const percent = (current / TOTAL_QUESTIONS) * 100;

        progressBar.style.width = percent + '%';
        progressText.textContent = `${current} / ${TOTAL_QUESTIONS}`;
    }

    function nextQuestion() {

        if (currentQuestionIndex >= TOTAL_QUESTIONS) {
            showFinishedQuickCheck();
            return;
        }

        updateProgressBar();

        let q = questions[currentQuestionIndex];

        // ❗ защита: не даём подряд вопрос из той же пары
        if (lastPair && q.pair === lastPair) {
            // ищем следующий подходящий
            const swapIndex = questions.findIndex(
                (x, i) => i > currentQuestionIndex && x.pair !== lastPair
            );

            if (swapIndex !== -1) {
                [questions[currentQuestionIndex], questions[swapIndex]] =
                [questions[swapIndex], questions[currentQuestionIndex]];
                q = questions[currentQuestionIndex];
            }
        }

        lastPair = q.pair;

        const p = q.pair;
        const direction = q.direction;

        let question, correctAnswer, key;

        if (direction === 'word') {
            question = p.term;
            correctAnswer = p.translation;
            key = `${p.term}|word`;
        } else {
            question = p.translation;
            correctAnswer = p.term;
            key = `${p.translation}|translation`;
        }

        questionEl.classList.remove('question-transition');
        void questionEl.offsetWidth; // перезапуск анимации
        questionEl.textContent = question;
        questionEl.classList.add('question-transition');


        let options = [correctAnswer];

        const otherOptions = pairs
            .map(x => direction === 'word' ? x.translation : x.term)
            .filter(x => x !== correctAnswer);

        while (options.length < 3 && otherOptions.length > 0) {
            const idx = Math.floor(Math.random() * otherOptions.length);
            options.push(otherOptions.splice(idx, 1)[0]);
        }

        options = shuffleArray(options);

        answersEl.innerHTML = '';

        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.textContent = opt;
            btn.className = 'answer-btn';
            btn.onclick = () =>
                handleAnswer(btn, opt === correctAnswer, key, correctAnswer, false);
            answersEl.appendChild(btn);
        });

        // dont know — НУЖЕН
        const dontKnowBtn = document.createElement('button');
        dontKnowBtn.textContent = uiTexts.dont_know;
        dontKnowBtn.className = 'answer-btn';
        dontKnowBtn.onclick = () =>
            handleAnswer(dontKnowBtn, false, key, correctAnswer, true);

        answersEl.appendChild(dontKnowBtn);
    }


    function handleAnswer(button, correct, key, correctAnswer, isDontKnow) {
        if (correct) {
            button.style.backgroundColor = '#8BC34A';
            button.classList.add('correct-pop'); // правильный ответ подпрыгивает
        } else if (!isDontKnow) {
            button.style.backgroundColor = '#F44336';
        }

        if (!correct) {
            mistakesCount[key] = (mistakesCount[key] || 0) + 1;
        }


        Array.from(answersEl.children).forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === correctAnswer) btn.style.backgroundColor = '#8BC34A';
        });

        // ✅ ВАЖНО: увеличиваем индекс СРАЗУ
        currentQuestionIndex++;

        // ✅ И СРАЗУ обновляем прогресс
        updateProgressBar();

        setTimeout(() => {
            if (currentQuestionIndex >= TOTAL_QUESTIONS) {
                showFinishedQuickCheck();
            } else {
                nextQuestion();
            }
        }, 800);
    }

    function showFinishedQuickCheck() {
        progressText.classList.add('hidden');
        progressWrapper.classList.add('hidden');

        answersEl.innerHTML = '';

        // =========================
        // DEBUG MODE (QUICK CHECK)
        // =========================
        if (DEBUG_QUICK_CHECK_FINISH) {
            mistakesCount = {};

            if (DEBUG_MODE === 'mistakes') {
                pairs = [
                    { term: 'CAT', translation: 'КОТ' },
                    { term: 'DOG', translation: 'СОБАКА' },
                    { term: 'HOME', translation: 'ДОМ' },
                    { term: 'SUN', translation: 'СОЛНЦЕ' },
                    { term: 'FOX', translation: 'ЛИСА' }
                ];

                mistakesCount['CAT|word'] = 1;
                mistakesCount['КОТ|translation'] = 0;

                mistakesCount['DOG|word'] = 0;
                mistakesCount['СОБАКА|translation'] = 1;

                mistakesCount['FOX|word'] = 0;
                mistakesCount['ЛИСА|translation'] = 0;

                mistakesCount['HOME|word'] = 11;
                mistakesCount['ДОМ|translation'] = 11;

                mistakesCount['SUN|word'] = 0;
                mistakesCount['СОЛНЦЕ|translation'] = 11;

            } 

            if (DEBUG_MODE === 'none') {
                pairs = [
                    { term: 'SUN', translation: 'СОЛНЦЕ' },
                    { term: 'MOON', translation: 'ЛУНА' }
                ];

                mistakesCount['SUN|word'] = 0;
                mistakesCount['СОЛНЦЕ|translation'] = 0;
                mistakesCount['MOON|word'] = 0;
                mistakesCount['ЛУНА|translation'] = 0;
            }

            if (DEBUG_MODE === 'all_mistakes') {
                pairs.forEach(p => {
                    // искусственно "делаем вид", что ВСЁ было с ошибками
                    mistakesCount[`${p.term}|word`] = 1;
                    mistakesCount[`${p.translation}|translation`] = 1;
                });
            }
        }

        // Из слова ошибок mistakesCount считаем общее количество ошибок 
        const totalMistakes = Object.values(mistakesCount)
            .reduce((sum, v) => sum + v, 0);

        // --- кнопки ---
        const repeatBtn = document.createElement('button');
        repeatBtn.textContent = uiTexts.repeat;
        repeatBtn.className = 'answer-btn';
        repeatBtn.onclick = () => {
            startQuickCheckGame(pairs, uiTexts, fileData);
        };

        const okBtn = document.createElement('button');
        okBtn.textContent = uiTexts.ok;
        okBtn.className = 'answer-btn';
        okBtn.onclick = closeGame;      

        // =========================
        // 🟢 НЕТ ОШИБОК
        // =========================
        if (totalMistakes === 0) {
            questionEl.textContent = uiTexts.no_mistakes;
            launchConfetti();

            // кнопки
            const actions = document.createElement('div');
            actions.className = 'game-actions';
            actions.appendChild(repeatBtn);
            actions.appendChild(okBtn);

            windowBox.appendChild(actions);
            return;
        }

        // =========================
        // 🔴 ЕСТЬ ОШИБКИ
        // =========================
        questionEl.textContent = uiTexts.quick_check_mistakes;
        questionEl.classList.add('memorize-result');

        const mistakesPairs = [];

        pairs.forEach(p => {
            const wErr = mistakesCount[`${p.term}|word`] || 0;
            const tErr = mistakesCount[`${p.translation}|translation`] || 0;

            if (wErr + tErr > 0) {
                mistakesPairs.push({
                    term: p.term,
                    translation: p.translation
                });
            }
        });

        const mistakesBlock = document.createElement('div');
        mistakesBlock.className = 'mistakes-list';

        mistakesPairs.forEach(mp => {
            const row = document.createElement('div');
            row.className = 'mistakes-row';

            const term = document.createElement('div');
            term.className = 'mistakes-cell';
            term.textContent = mp.term;

            const translation = document.createElement('div');
            translation.className = 'mistakes-cell';
            translation.textContent = mp.translation;

            // Подсветка ошибок в финальном окне
            const wordErrors = mistakesCount[`${mp.term}|word`] || 0;
            const translationErrors = mistakesCount[`${mp.translation}|translation`] || 0;

            if (wordErrors > 0) {
                term.classList.add('has-mistake');
            }

            if (translationErrors > 0) {
                translation.classList.add('has-mistake');
            }

            row.appendChild(term);
            row.appendChild(translation);
            mistakesBlock.appendChild(row);
        });

        windowBox.appendChild(mistakesBlock);


        // кнопка запуска MEMORIZE со всеми словами
        const memorizeBtn = document.createElement('button');
        memorizeBtn.textContent = uiTexts.memorize;
        memorizeBtn.className = 'answer-btn';
        memorizeBtn.onclick = () => {
            startMemorizingGame(pairs, uiTexts, fileData);
        };

        // кнопки
        const actions = document.createElement('div');
        actions.className = 'game-actions';
        actions.appendChild(memorizeBtn); // 1
        actions.appendChild(repeatBtn);   // 2
        actions.appendChild(okBtn);       // 3

        windowBox.appendChild(actions);
    }

    if (DEBUG_QUICK_CHECK_FINISH) { //уудалить А ee
        showFinishedQuickCheck();
        return;
    }
    nextQuestion();

}

function launchConfetti() {
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = 9999;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const W = canvas.width = window.innerWidth;
    const H = canvas.height = window.innerHeight;

    const CONFETTI_COUNT = 360; // <- здесь можно менять количество частиц
    const pieces = [];
    const colors = ['#ffde07', '#3ae340', '#2196F3', '#E91E63'];

    // Используем пул объектов для частиц
    function createParticle() {
        return {
            x: Math.random() * W,
            y: Math.random() * -H,
            size: 6 + Math.random() * 4,
            speed: 2 + Math.random() * 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.random() * 10
        };
    }

    // Инициализация частиц
    for (let i = 0; i < CONFETTI_COUNT; i++) {
        pieces.push(createParticle());
    }

    let start = null;

    // Функция рисования
    function draw(timestamp) {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;

        // Очищаем канвас
        ctx.clearRect(0, 0, W, H);

        // Обновляем и рисуем частицы
        for (let i = 0; i < pieces.length; i++) {
            const p = pieces[i];

            // Двигаем частицу
            p.y += p.speed;
            p.x += Math.sin(p.y * 0.05);

            // Если частица ушла за пределы экрана, переназначаем её позицию
            if (p.y > H) {
                pieces[i] = createParticle();
            } else {
                // Рисуем частицу
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x, p.y, p.size, p.size);
            }
        }

        // Длительность анимации + плавное затухание в последние мс
        let fadeDuration = 350; // длительность плавного затухания в мс
        let confettiDuration = 2000;

        // Анимация с плавным затуханием
        if (elapsed < confettiDuration - fadeDuration) {
            canvas.style.opacity = '1';
            requestAnimationFrame(draw);
        } else if (elapsed < confettiDuration) {
            canvas.style.opacity = `${1 - (elapsed - confettiDuration + fadeDuration) / fadeDuration}`;
            requestAnimationFrame(draw);
        } else {
            canvas.remove();
        }
    }

    // Запуск анимации
    requestAnimationFrame(draw);
}
