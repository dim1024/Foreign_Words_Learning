console.log('SELF_CHECK.JS LOADED');

// // ⬇⬇⬇ ВСТАВИТЬ СРАЗУ ПОСЛЕ ЭТОГО ⬇⬇⬇
// window.startSelfCheckExam = function (pairs, uiTexts, fileData) {
//     console.log('✅ startSelfCheckExam CALLED');
//     console.log('pairs:', pairs);
//     console.log('uiTexts:', uiTexts);
//     console.log('fileData:', fileData);
// };


// let gameContainer = null;

// function closeGame() { //Закрытие любого игрового окна
//     if (gameContainer) {
//         gameContainer.remove();
//         gameContainer = null;

//     }
// }



function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

window.startSelfCheckExam = function (pairs, uiTexts, fileData) {
    closeGame();

    const DEBUG_QUICK_CHECK_FINISH = false; // <-- включить дебаг
    // const DEBUG_MODE = 'none'
    const DEBUG_MODE = 'mistakes' 
    // const DEBUG_MODE = 'all_mistakes';

    gameContainer = document.createElement('div');
    gameContainer.className = 'memorize-game quick-check';

    const windowBox = document.createElement('div');
    windowBox.className = 'game-window';
    windowBox.style.padding = '20px';
    windowBox.style.borderRadius = '10px';
    windowBox.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
    windowBox.style.backgroundColor = '#fff';
    windowBox.style.display = 'flex';
    windowBox.style.flexDirection = 'column';
    windowBox.style.position = 'relative';

    // Красный крестик
    const closeBtn = document.createElement('button');
    closeBtn.className = 'memorize-close-btn';
    closeBtn.textContent = '✖';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '10px';
    closeBtn.style.right = '10px';
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
    progressText.style.marginTop = '40px';
    progressText.style.fontSize = '14px';
    progressText.style.color = '#555';
    progressText.style.textAlign = 'center';
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

        questionEl.textContent = question;

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
            btn.style.padding = '10px';
            btn.style.borderRadius = '6px';
            btn.onclick = () =>
                handleAnswer(btn, opt === correctAnswer, key, correctAnswer, false);
            answersEl.appendChild(btn);
        });

        // dont know — НУЖЕН
        const dontKnowBtn = document.createElement('button');
        dontKnowBtn.textContent = uiTexts.dont_know;
        dontKnowBtn.style.padding = '10px';
        dontKnowBtn.style.borderRadius = '6px';
        dontKnowBtn.onclick = () =>
            handleAnswer(dontKnowBtn, false, key, correctAnswer, true);

        answersEl.appendChild(dontKnowBtn);
    }


    function handleAnswer(button, correct, key, correctAnswer, isDontKnow) {
        if (correct) {
            button.style.backgroundColor = '#8BC34A';
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
        progressText.style.display = 'none';
        progressWrapper.style.display = 'none';

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
        repeatBtn.onclick = () => {
            startSelfCheckExam(pairs, uiTexts, fileData);
        };

        const okBtn = document.createElement('button');
        okBtn.textContent = uiTexts.ok;
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
        questionEl.style.marginTop = '10px';
        questionEl.style.marginBottom = '5px';


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
        mistakesBlock.style.maxHeight = '200px';
        mistakesBlock.style.overflowY = 'auto';

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

        // кнопки
        const actions = document.createElement('div');
        actions.className = 'game-actions';
        actions.appendChild(repeatBtn);   // 1
        actions.appendChild(okBtn);       // 2

        windowBox.appendChild(actions);
    }

    if (DEBUG_QUICK_CHECK_FINISH) { //уудалить А ee
        showFinishedQuickCheck();
        return;
    }
    nextQuestion();
}

// function launchConfetti() {
//     const canvas = document.createElement('canvas');
//     canvas.style.position = 'fixed';
//     canvas.style.top = 0;
//     canvas.style.left = 0;
//     canvas.style.width = '100%';
//     canvas.style.height = '100%';
//     canvas.style.pointerEvents = 'none';
//     canvas.style.zIndex = 9999;

//     document.body.appendChild(canvas);
//     const ctx = canvas.getContext('2d');
//     const W = canvas.width = window.innerWidth;
//     const H = canvas.height = window.innerHeight;

//     const CONFETTI_COUNT = 360; // <- здесь можно менять количество частиц
//     const pieces = [];
//     const colors = ['#ffde07', '#3ae340', '#2196F3', '#E91E63'];

//     for (let i = 0; i < CONFETTI_COUNT; i++) {
//         pieces.push({
//             x: Math.random() * W,
//             y: Math.random() * -H,
//             size: 6 + Math.random() * 4,
//             speed: 2 + Math.random() * 4,
//             color: colors[Math.floor(Math.random() * colors.length)],
//             tilt: Math.random() * 10
//         });
//     }

//     let start = null;

//     function draw(timestamp) {
//         if (!start) start = timestamp;
//         const elapsed = timestamp - start;

//         ctx.clearRect(0, 0, W, H);

//         pieces.forEach(p => {
//             p.y += p.speed;
//             p.x += Math.sin(p.y * 0.05);
//             ctx.fillStyle = p.color;
//             ctx.fillRect(p.x, p.y, p.size, p.size);
//         });

//         // время проигрывания анимации + плавное затухание в последние мс
//         let fadeDuration = 350; // длительность плавного затухания в мс
//         let confettiDuration = 2000;

//         if (elapsed < confettiDuration - fadeDuration) {
//             canvas.style.opacity = '1';
//             requestAnimationFrame(draw);
//         } else if (elapsed < confettiDuration) {
//             canvas.style.opacity = `${1 - (elapsed - confettiDuration + fadeDuration) / fadeDuration}`;
//             requestAnimationFrame(draw);
//         } else {
//             canvas.remove();
//         }

//     }

//     requestAnimationFrame(draw);
// }

