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

    const DEBUG_QUICK_CHECK_FINISH = 0; // <-- включить дебаг
    const DEBUG_MODE = 'none'
    // const DEBUG_MODE = 'mistakes' 
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
        // Считаем ошибки
        if (!correct) {
            mistakesCount[key] = (mistakesCount[key] || 0) + 1;
        }

        // Блокировка кнопок, чтобы заблокировать выбор другого ответа и перейти к след вопросы
        Array.from(answersEl.children).forEach(btn => {
            btn.disabled = true;
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
        }, 500); // сокращен таймаут для экзамена
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
            // launchFireworks();

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
        
        //считаем ошибки (1 пара может дать только 1 ошибку)
        const totalPairs = pairs.length;

        let wrongPairs = 0;

        pairs.forEach(p => {
            const wordErrors = mistakesCount[`${p.term}|word`] || 0;
            const translationErrors = mistakesCount[`${p.translation}|translation`] || 0;

            if (wordErrors > 0 || translationErrors > 0) {
                wrongPairs++;
            }
        });

        const correctPairs = totalPairs - wrongPairs;
        const percent = Math.round((correctPairs / totalPairs) * 100);

        questionEl.textContent = uiTexts.self_check_result
            .replace('{correct}', correctPairs)
            .replace('{total}', totalPairs)
            .replace('{percent}', percent);

        questionEl.style.marginTop = '25px';
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
        mistakesBlock.style.marginBottom = '8px';

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

        // =========================
        // КНОПКА: СОХРАНИТЬ В ЧАСТЫЕ ОШИБКИ (SELF CHECK)
        // =========================
        const saveMistakesBtn = document.createElement('button');
        saveMistakesBtn.textContent = uiTexts.save_to_frequent_mistakes;

        // стили — 1 в 1 из MEMORIZE
        saveMistakesBtn.style.alignSelf = 'center';
        saveMistakesBtn.style.margin = '6px 0 10px';
        saveMistakesBtn.style.padding = '10px';
        saveMistakesBtn.style.borderRadius = '6px';
        saveMistakesBtn.style.width = '260px';
        saveMistakesBtn.style.height = '42px';
        saveMistakesBtn.style.display = 'flex';
        saveMistakesBtn.style.alignItems = 'center';
        saveMistakesBtn.style.justifyContent = 'center';
        saveMistakesBtn.style.whiteSpace = 'nowrap';

        // 👇 ВАЖНО: сохраняем ВСЕ слова из таблицы ошибок
        saveMistakesBtn.onclick = () => {

            // 1️⃣ анимация
            saveMistakesBtn.disabled = true;
            saveMistakesBtn.classList.add('save-animate', 'success');
            saveMistakesBtn.textContent = uiTexts.saved_success;

            // 2️⃣ СОХРАНЯЕМ (ВСЕ mistakesPairs)
            saveMistakesFile(
                mistakesPairs,
                fileData?.name || 'Self Check',
                'self_check'
            );

            // 3️⃣ меняем кнопку на "Открыть папку"
            setTimeout(() => {

                saveMistakesBtn.classList.remove('success');
                saveMistakesBtn.textContent = uiTexts.open_frequent_mistakes;
                saveMistakesBtn.disabled = false;

                saveMistakesBtn.onclick = () => {
                    closeGame();

                    navigationStack = [];
                    currentFolder = rootData;
                    renderLevel(rootData);

                    const frequentFolder = frequentMistakesFolder.children;
                    navigationStack.push(rootData);
                    currentFolder = frequentFolder;
                    renderLevel(frequentFolder);
                };

            }, 1600);
        };

        windowBox.appendChild(saveMistakesBtn);





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


function launchFireworks() {
    // === НАСТРОЙКИ ===
    const ROCKET_COUNT = 5;
    const ROCKET_INTERVAL = 450;
    const ROCKET_SPEED = -14;
    const EXPLOSION_PARTS = 170;
    const EXPLOSION_LIFE = 120;
    // const COLORS = ['#FF0000','#FF8C00','#FFD700','#00FF00','#00BFFF','#1E90FF','#FF69B4','#9400D3'];
    // const COLORS = ['#fe3b3b','#f4a340','#f2dc5c','#6afa6a','#60d5fc','#2b94fc','#f684bd','#c659f4'];
    const COLORS = ['#fe3b3b','#f89b29','#fcde38','#3ffc3f','#41cfff','#2b94fc','#fa5baa','#c643ff'];
    const backgroundOpacity = 0.6;
    const fadeDuration = 900; // скорость появления затемнения

    // === Создаем затемняющий слой ===
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background-color: rgba(0,0,0,0);
        pointer-events: none;
        z-index: 9998;
        transition: background-color ${fadeDuration}ms linear;
    `;
    document.body.appendChild(overlay);

    // === Канвас для салюта ===
    const canvas = document.createElement('canvas');
    canvas.style.cssText = `
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 9999;
    `;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const W = canvas.width = window.innerWidth;
    const H = canvas.height = window.innerHeight;

    const rockets = [];
    const particles = [];
    let rocketsLaunched = 0;
    let lastLaunchTime = performance.now();

    // === Начинаем плавное затемнение ===
    requestAnimationFrame(() => {
        overlay.style.backgroundColor = `rgba(0,0,0,${backgroundOpacity})`;
    });

    function Particle(x, y, vx, vy, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = EXPLOSION_LIFE;
        this.size = Math.random() * 3 + 2;
        this.color = color;
        this.alpha = 1; // прозрачность
    }

    Particle.prototype.update = function () {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.05;

        if (this.life <= FADE_TIME) {
            this.alpha = this.life / FADE_TIME; // плавное уменьшение прозрачности
        }

        this.life--;
    };

    Particle.prototype.draw = function () {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha; // применяем прозрачность
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1; // сброс прозрачности
    };

    function explode(x, y) {
        for (let i = 0; i < EXPLOSION_PARTS; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 6 + 2;
            const color = COLORS[Math.floor(Math.random() * COLORS.length)];
            particles.push(
                new Particle(
                    x,
                    y,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    color
                )
            );
        }
    }

    function Rocket(x) {
        this.x = x;
        this.y = H;
        this.vy = ROCKET_SPEED;
        this.exploded = false;
    }

    Rocket.prototype.update = function () {
        this.y += this.vy;
        this.vy += 0.2;

        ctx.fillStyle = '#b1eaf7';
        ctx.fillRect(this.x - 1, this.y, 2, 10);

        if (this.vy >= 0 && !this.exploded) {
            this.exploded = true;
            explode(this.x, this.y);
        }
    };

    function launchRocket() {
        const x = Math.random() * W * 0.6 + W * 0.2;
        rockets.push(new Rocket(x));
        rocketsLaunched++;
    }

    function animate(now) {
        ctx.clearRect(0, 0, W, H);

        if (rocketsLaunched < ROCKET_COUNT && now - lastLaunchTime > ROCKET_INTERVAL) {
            launchRocket();
            lastLaunchTime = now;
        }

        rockets.forEach((r, i) => {
            r.update();
            if (r.exploded) rockets.splice(i, 1);
        });

        particles.forEach((p, i) => {
            p.update();
            p.draw();
            if (p.life <= 0) particles.splice(i, 1);
        });

        if (rockets.length || particles.length || rocketsLaunched < ROCKET_COUNT) {
            requestAnimationFrame(animate);
        } else {
            // === Плавное исчезновение затемнения ===
            overlay.style.backgroundColor = 'rgba(0,0,0,0)';
            setTimeout(() => {
                canvas.remove();
                overlay.remove();
            }, fadeDuration);
        }
    }

    requestAnimationFrame(animate);
}








