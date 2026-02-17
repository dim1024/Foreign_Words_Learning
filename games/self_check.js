let counter = 0;

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

    // QUICK CHECK: список вопросов
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
            counter++;
            startSelfCheckExam(pairs, uiTexts, fileData);
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
            if (counter % 2 == 1) {
                launchFireworks();
            } else {
                launchFireworks2();
            }
            

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

        // =========================
        // КНОПКА: СОХРАНИТЬ В ЧАСТЫЕ ОШИБКИ (SELF CHECK)
        // =========================
        const saveMistakesBtn = document.createElement('button');
        saveMistakesBtn.textContent = uiTexts.save_to_frequent_mistakes;

        // стили — 1 в 1 из MEMORIZE
        saveMistakesBtn.className = 'save-mistakes-btn';    

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
    const ROCKET_SPEED = -18;

    const EXPLOSION_PARTS = 130;
    const EXPLOSION_LIFE = 120;
    const FADE_TIME = 45;

    const COLORS = ['#fe3b3b','#f89b29','#fcde38','#3ffc3f','#41cfff','#2b94fc','#fa5baa','#c643ff'];
    // const COLORS = ['#FF0000','#FF8C00','#FFD700','#00FF00','#00BFFF','#1E90FF','#FF69B4','#9400D3'];
    // const COLORS = ['#fe3b3b','#f4a340','#f2dc5c','#6afa6a','#60d5fc','#2b94fc','#f684bd','#c659f4'];

    const backgroundOpacity = 0.7;
    const fadeDuration = 900;

    const FLASH_MAX_OPACITY = 0.35;   // яркость вспышки
    const FLASH_LIFE = 30;           // длительность жизни (кадры)

    // === Создаем затемняющий слой ===
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        inset: 0;
        background-color: rgba(0,0,0,0);
        pointer-events: none;
        z-index: 9997;
        transition: background-color ${fadeDuration}ms linear;
    `;
    document.body.appendChild(overlay);

    // Вспышка от взрыва ракеты
    const flash = document.createElement('div');
    flash.style.cssText = `
        position: fixed;
        inset: 0;
        background-color: white;
        opacity: 0;
        pointer-events: none;
        z-index: 9998;
    `;
    document.body.appendChild(flash);

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

    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    const W = canvas.width = window.innerWidth * DPR;
    const H = canvas.height = window.innerHeight * DPR;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(DPR, DPR);

    // === Pools ===
    const rockets = [];
    const particles = [];
    const particlePool = [];

    let rocketsLaunched = 0;
    let lastLaunchTime = performance.now();

    // === ⚡ СОСТОЯНИЕ ВСПЫШКИ ===
    let flashLife = 0; // 🔄 счетчик жизни вспышки

    // === Начинаем плавное затемнение ===
    requestAnimationFrame(() => {
        overlay.style.backgroundColor = `rgba(0,0,0,${backgroundOpacity})`;
    });

    // === Particle ===
    function Particle() {}

    Particle.prototype.reset = function (x, y, vx, vy, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = EXPLOSION_LIFE;
        this.alpha = 1;
        this.size = Math.random() * 2.5 + 2;
        this.color = color;
    };

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
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    };

    function getParticle() {
        return particlePool.pop() || new Particle();
    }

    function explode(x, y) {

        // === ⚡ АКТИВАЦИЯ ВСПЫШКИ В МОМЕНТ ВЗРЫВА ===
        flashLife = FLASH_LIFE;
        flash.style.opacity = FLASH_MAX_OPACITY;

        for (let i = 0; i < EXPLOSION_PARTS; i++) {
            const p = getParticle();
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;

            p.reset(
                x,
                y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                COLORS[Math.random() * COLORS.length | 0]
            );

            particles.push(p);
        }
    }

    // === Rocket ===
    function Rocket(x) {
        this.x = x;
        this.y = H;
        this.vy = ROCKET_SPEED;
        this.exploded = false;

        // 🎯 цель взрыва: 20% – 40% высоты экрана
        this.targetY = H * (0.20 + Math.random() * 0.20);
    }

    Rocket.prototype.update = function () {
        this.y += this.vy;
        this.vy += 0.2;

        ctx.fillStyle = '#b1eaf7';
        ctx.fillRect(this.x - 1, this.y, 2, 10);

        if (this.y <= this.targetY && !this.exploded) {
            this.exploded = true;
            explode(this.x, this.y);
        }
    };

    function launchRocket() {
        rockets.push(new Rocket(Math.random() * (W * 0.45) + W * 0.2));
        rocketsLaunched++;
    }

    function animate(now) {
        ctx.clearRect(0, 0, W, H);

        if (rocketsLaunched < ROCKET_COUNT && now - lastLaunchTime > ROCKET_INTERVAL) {
            launchRocket();
            lastLaunchTime = now;
        }

        for (let i = rockets.length - 1; i >= 0; i--) {
            rockets[i].update();
            if (rockets[i].exploded) {
                rockets.splice(i, 1);
            }
        }


        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.update();
            p.draw();

            if (p.life <= 0) {
                particlePool.push(p);
                particles.splice(i, 1);
            }
        }

        // === ⚡ ПЛАВНОЕ УГАСАНИЕ ВСПЫШКИ ===
        if (flashLife > 0) {
            flashLife--;
            const t = flashLife / FLASH_LIFE; // 1 → 0
            flash.style.opacity = FLASH_MAX_OPACITY * t;
        }

        ctx.globalAlpha = 1;

        if (rockets.length || particles.length || rocketsLaunched < ROCKET_COUNT || flashLife > 0) {
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

function launchFireworks2() {
    // === НАСТРОЙКИ ===
    const ROCKET_COUNT = 5;
    const ROCKET_INTERVAL = 450;
    const ROCKET_SPEED = -18;
    const FLIGHT_TIME = 1200

    const EXPLOSION_PARTS = 130;
    const EXPLOSION_LIFE = 120;
    const FADE_TIME = 45;

    const COLORS = ['#fe3b3b','#f89b29','#fcde38','#3ffc3f','#41cfff','#2b94fc','#fa5baa','#c643ff'];
    // const COLORS = ['#FF0000','#FF8C00','#FFD700','#00FF00','#00BFFF','#1E90FF','#FF69B4','#9400D3'];
    // const COLORS = ['#fe3b3b','#f4a340','#f2dc5c','#6afa6a','#60d5fc','#2b94fc','#f684bd','#c659f4'];

    const backgroundOpacity = 0.7;
    const fadeDuration = 900;

    // === FLASH SETTINGS ===
    const FLASH_RADIUS = 600;      // максимальный радиус
    const FLASH_LIFE = 10;         // время жизни (кадры)
    const FLASH_ALPHA = 0.65;      // максимальная яркость


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

    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    const W = canvas.width = window.innerWidth * DPR;
    const H = canvas.height = window.innerHeight * DPR;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(DPR, DPR);

    // === Pools ===
    const rockets = [];
    const particles = [];
    const particlePool = [];
    const flashes = []; // 💥 ДОБАВЛЕНО

    let rocketsLaunched = 0;
    let lastLaunchTime = performance.now();

    // === Начинаем плавное затемнение ===
    requestAnimationFrame(() => {
        overlay.style.backgroundColor = `rgba(0,0,0,${backgroundOpacity})`;
    });

    // === Particle ===
    function Particle() {}

    Particle.prototype.reset = function (x, y, vx, vy, color) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = EXPLOSION_LIFE;
        this.alpha = 1;
        this.size = Math.random() * 2.5 + 2;
        this.color = color;
    };

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
        ctx.globalAlpha = this.alpha;

        // включаем blur только пока частица яркая для экономии рендера
        if (this.life > FADE_TIME) {
            ctx.shadowBlur = 25;
            ctx.shadowColor = this.color;
        } else {
            ctx.shadowBlur = 0;
        }

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
    };


    function getParticle() {
        return particlePool.pop() || new Particle();
    }

    
    // ✨ === FLASH === begin ✨
    function Flash(x, y) {
        this.x = x;
        this.y = y;
        this.life = FLASH_LIFE;
    }

    Flash.prototype.update = function () {
        this.life--;
    };

    Flash.prototype.draw = function () {
        const t = this.life / FLASH_LIFE;
        const radius = FLASH_RADIUS;
        const alpha = FLASH_ALPHA * t;

        const g = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, radius
        );

        g.addColorStop(0, `rgba(255,255,255,${alpha})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fill();
    }; // ✨ === FLASH === end ✨


    function explode(x, y, isSecondary = false) {
        // 25% частиц взрывается чуть чуть позже
        const parts = isSecondary ? 25 : EXPLOSION_PARTS;

        for (let i = 0; i < parts; i++) {
            const p = getParticle();
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * (isSecondary ? 3 : 5) + 2;

            p.reset(
                x,
                y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                COLORS[Math.random() * COLORS.length | 0]
            );
            // эти строки чтобы размер был разный, но и так там выше размер через рандом задается
            // const depth = Math.random();

            // p.reset(
            //     x,
            //     y,
            //     Math.cos(angle) * speed * (0.6 + depth),
            //     Math.sin(angle) * speed * (0.6 + depth),
            //     COLORS[Math.random() * COLORS.length | 0]
            // );

            // p.size *= (0.8 + depth/2);

            p.isSecondary = false;
            particles.push(p);
        }

        // вторичный взрыв
        if (!isSecondary) {
            setTimeout(() => {
                explode(x, y, true);
            }, 120);
        }
    }

    // === Rocket ===
    function Rocket(x) {
        this.x = x;
        this.startY = H;
        // 🎯 цель взрыва: 20% – 40% высоты экрана
        this.targetY = H * (0.20 + Math.random() * 0.20);
        this.y = this.startY;

        this.duration = FLIGHT_TIME; // время полета в мс
        this.startTime = performance.now();

        this.exploded = false;
    }

    Rocket.prototype.update = function (now) {
        const progress = (now - this.startTime) / this.duration;

        if (progress >= 1 && !this.exploded) {
            this.y = this.targetY;
            this.exploded = true;
            explode(this.x, this.y);
            return;
        }

        // линейное движение
        // this.y = this.startY + (this.targetY - this.startY) * progress;
        // Легкое зависание перед взрывом
        const eased = 1 - Math.pow(1 - progress, 3);
        this.y = this.startY + (this.targetY - this.startY) * eased;

        // 🔥 ДЫМ от ракеты
        if (Math.random() < 0.6) {
            const p = getParticle();
            p.reset(
                this.x,
                this.y,
                (Math.random() - 0.5) * 0.5,
                Math.random() * 0.5,
                'rgba(200,200,200,0.4)'
            );
            p.life = 30;
            p.size = 3;
            particles.push(p);
        }

        // рисуем ракету
        ctx.fillStyle = '#b1eaf7';
        ctx.fillRect(this.x - 1, this.y, 2, 10);
    };

    // === ZONES ===
    const ZONES = ['left','left','center','right','right'];

    // shuffle
    for (let i = ZONES.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ZONES[i], ZONES[j]] = [ZONES[j], ZONES[i]];
    }

    let zoneIndex = 0;

    function launchRocket() {
        const zone = ZONES[zoneIndex++]; 

        const minX = W * 0.2;
        const maxX = W * 0.8;
        const width = maxX - minX;

        let x;

        if (zone === 'left') {
            x = minX + Math.random() * (width * 0.22);
        } 
        else if (zone === 'center') {
            x = minX + width * 0.22 + Math.random() * (width * 0.16);
        } 
        else { // right
            x = minX + width * (0.22 + 0.16) + Math.random() * (width * 0.22);
        }

        rockets.push(new Rocket(x));
        // rockets.push(new Rocket(Math.random() * (W * 0.45) + W * 0.2));
        rocketsLaunched++;
    }

    function animate(now) {
        ctx.clearRect(0, 0, W, H);

        // ✨ === FLASHES (ПОД ФЕЙЕРВЕРКОМ) === ✨
        for (let i = flashes.length - 1; i >= 0; i--) {
            const f = flashes[i];
            f.update();
            f.draw();
            if (f.life <= 0) flashes.splice(i, 1);
        }

        if (rocketsLaunched < ROCKET_COUNT && now - lastLaunchTime > ROCKET_INTERVAL) {
            launchRocket();
            lastLaunchTime = now;
        }

        for (let i = rockets.length - 1; i >= 0; i--) {
            rockets[i].update(now);
            if (rockets[i].exploded) {
                rockets.splice(i, 1);
            }
        }


        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.update();
            p.draw();

            if (p.life <= 0) {
                particlePool.push(p);
                particles.splice(i, 1);
            }
        }

        ctx.globalAlpha = 1;

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