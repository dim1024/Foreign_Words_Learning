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
    closeBtn.style.color = 'red';
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

    const learnBtn = document.createElement('button');
    learnBtn.textContent = uiTexts.study;
    learnBtn.onclick = () => {
        const activePairs = localPairs.filter(p => !p.disabled);
        if (!activePairs.length) {
            alert(uiTexts.no_selected_words);
            return;
        }
        startLearningGame(activePairs, uiTexts);
    };


    const memorizeBtn = document.createElement('button');
    memorizeBtn.textContent = uiTexts.memorize;
    memorizeBtn.onclick = () => {
        const activePairs = localPairs.filter(p => !p.disabled);
        if (!activePairs.length) {
            alert(uiTexts.no_selected_words);
            return;
        }
        startMemorizingGame(activePairs, uiTexts);
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
    let REQUIRED_QUESTIONS_REPEATS = Number(localStorage.getItem('memorizeRepeats')) || 2; // количество повторений слов или переводов в вопросах.

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
    settingsTitle.style.marginBottom = '6px';
    settingsTitle.style.textAlign = 'center';
    // settingsTitle.style.fontWeight = 'bold';
    settingsPanel.appendChild(settingsTitle);

    settingsBtn.onclick = () => {
        settingsPanel.classList.toggle('hidden');
    };

    // кнопки количества повторений
    const repeatRow = document.createElement('div');
    repeatRow.className = 'memorize-repeat-row';
    settingsPanel.appendChild(repeatRow);
    repeatRow.style.display = 'flex';
    repeatRow.style.justifyContent = 'center';
    repeatRow.style.gap = '6px';
    repeatRow.style.marginBottom = '10px';

    const repeatButtons = [];
    for (let i = 1; i <= 5; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;

        if (i === REQUIRED_QUESTIONS_REPEATS) {
            btn.classList.add('active');
        }

        btn.onclick = () => {
            REQUIRED_QUESTIONS_REPEATS = i;
            localStorage.setItem('memorizeRepeats', i); // Сохраняем выбор количества повторений в localStorage

            repeatButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 🔁 перезапуск игры с новым значением
            memorizeProgress = {};
            pairs.forEach(p => {
                memorizeProgress[`${p.term}|word`] = 0;
                memorizeProgress[`${p.translation}|translation`] = 0;
            });

            updateProgressBar();
            nextQuestion();
        };

        repeatButtons.push(btn);
        repeatRow.appendChild(btn);
    }

    // кнопка ОК для закрытия окна настроек
    const okBtn = document.createElement('button');
    okBtn.textContent = 'OK';
    okBtn.style.margin = '4px auto 0';
    okBtn.style.display = 'block';
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
    progressText.style.marginTop = '40px';
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
    progressWrapper.style.marginTop = '6px';
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

        const MAX_PROGRESS = pairs.length * 2 * REQUIRED_QUESTIONS_REPEATS; // размер прогресс бара

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
        launchConfetti();

        answersEl.innerHTML = '';
        questionEl.textContent = uiTexts.memorize_finished;

        const closeBtnFinish = document.createElement('button');
        closeBtnFinish.textContent = uiTexts.close;
        closeBtnFinish.style.padding = '10px';
        closeBtnFinish.style.borderRadius = '6px';
        closeBtnFinish.onclick = () => {
            document.removeEventListener('click', handleOutsideClick);
            closeGame();
        };


        const repeatBtn = document.createElement('button');
        repeatBtn.textContent = uiTexts.repeat;
        repeatBtn.style.padding = '10px';
        repeatBtn.style.borderRadius = '6px';
        repeatBtn.onclick = () => {
            startMemorizingGame(pairs, uiTexts);
        };

        answersEl.appendChild(repeatBtn);
        answersEl.appendChild(closeBtnFinish);
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
    const colors = ['#FFC107', '#4CAF50', '#2196F3', '#E91E63'];

    for (let i = 0; i < CONFETTI_COUNT; i++) {
        pieces.push({
            x: Math.random() * W,
            y: Math.random() * -H,
            size: 6 + Math.random() * 4,
            speed: 2 + Math.random() * 4,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.random() * 10
        });
    }

    let start = null;

    function draw(timestamp) {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;

        ctx.clearRect(0, 0, W, H);

        pieces.forEach(p => {
            p.y += p.speed;
            p.x += Math.sin(p.y * 0.05);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        });

        // время проигрывания анимации + плавное затухание в последние мс
        let fadeDuration = 350; // длительность плавного затухания в мс
        let confettiDuration = 2000;

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

    requestAnimationFrame(draw);
}
