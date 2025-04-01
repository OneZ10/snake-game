const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// 设置画布尺寸
canvas.width = 600;
canvas.height = 600;

const scoreDisplay = document.getElementById('score-display');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

// 特殊食物相关变量
let specialFood = { x: -1, y: -1 };
let specialFoodVisible = false;
let specialFoodTimer = null;
let specialFoodScore = 20; // 特殊食物的分数
const SPECIAL_FOOD_INTERVAL = 10000; // 特殊食物出现间隔（10秒）
const SPECIAL_FOOD_DURATION = 5000; // 特殊食物持续时间（5秒）

// 玩家1（方向键控制）
let snake1 = [
    { x: 5, y: 10 }
];
let dx1 = 0;
let dy1 = 0;
let score1 = 0;

// 玩家2（WASD控制）
let snake2 = [
    { x: tileCount - 6, y: 10 }
];
let dx2 = 0;
let dy2 = 0;
let score2 = 0;

let food = { x: Math.floor(tileCount/2), y: Math.floor(tileCount/2) };
let gameSpeed = 150;
let gameLoop;

// 游戏状态
let gameStarted = false;
let gameOver = false;

// 添加玩家状态
let player1Active = true;
let player2Active = true;

// 获取音频元素
const backgroundMusic = document.getElementById('background-music');
const eatSound = document.getElementById('eat-sound');
const gameOverSound = document.getElementById('game-over-sound');

// 设置音量
backgroundMusic.volume = 0.3;
eatSound.volume = 0.5;
gameOverSound.volume = 0.5;

document.addEventListener('keydown', handleKeyPress);

// 添加性能优化变量
let lastRenderTime = 0;
let frameCount = 0;
let lastTime = 0;
const FPS = 60;
const frameInterval = 1000 / FPS;

// 添加新的 UI 元素引用
const gameOverlay = document.getElementById('game-overlay');
const winnerInfo = document.querySelector('.winner-info');
const finalScores = document.querySelector('.final-scores');
const restartBtn = document.querySelector('.restart-btn');
const soundToggle = document.querySelector('.sound-toggle');
const pauseToggle = document.querySelector('.pause-toggle');

// 添加游戏状态变量
let isPaused = false;
let isSoundEnabled = true;

function handleKeyPress(event) {
    if (!gameStarted) {
        gameStarted = true;
        backgroundMusic.play().catch(error => console.log("音频播放失败:", error));
        return;
    }
    
    if (gameOver && event.keyCode === 32) {
        resetGame();
        return;
    }

    // 处理移动端按钮事件
    if (typeof event === 'number') {
        const keyCode = event;
        if (player1Active && [37, 38, 39, 40].includes(keyCode)) {
            changeDirection1({ keyCode: keyCode });
        } else if (player2Active && [65, 83, 68, 87].includes(keyCode)) {
            changeDirection2({ keyCode: keyCode });
        }
        return;
    }

    // 处理键盘事件
    if (player1Active && [37, 38, 39, 40].includes(event.keyCode)) {
        changeDirection1(event);
    } else if (player2Active && ['W', 'S', 'A', 'D'].includes(event.key.toUpperCase())) {
        changeDirection2(event);
    }
}

function changeDirection1(event) {
    const LEFT_KEY = 37;
    const RIGHT_KEY = 39;
    const UP_KEY = 38;
    const DOWN_KEY = 40;

    const keyPressed = event.keyCode;
    const goingUp = dy1 === -1;
    const goingDown = dy1 === 1;
    const goingRight = dx1 === 1;
    const goingLeft = dx1 === -1;

    if (keyPressed === LEFT_KEY && !goingRight) {
        dx1 = -1;
        dy1 = 0;
    }
    if (keyPressed === UP_KEY && !goingDown) {
        dx1 = 0;
        dy1 = -1;
    }
    if (keyPressed === RIGHT_KEY && !goingLeft) {
        dx1 = 1;
        dy1 = 0;
    }
    if (keyPressed === DOWN_KEY && !goingUp) {
        dx1 = 0;
        dy1 = 1;
    }
}

function changeDirection2(event) {
    const keyCode = event.keyCode;
    const goingUp = dy2 === -1;
    const goingDown = dy2 === 1;
    const goingRight = dx2 === 1;
    const goingLeft = dx2 === -1;

    if (keyCode === 65 && !goingRight) { // A键
        dx2 = -1;
        dy2 = 0;
    }
    if (keyCode === 87 && !goingDown) { // W键
        dx2 = 0;
        dy2 = -1;
    }
    if (keyCode === 68 && !goingLeft) { // D键
        dx2 = 1;
        dy2 = 0;
    }
    if (keyCode === 83 && !goingUp) { // S键
        dx2 = 0;
        dy2 = 1;
    }
}

function drawGame() {
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制棋盘格背景
    drawCheckerboard();

    // 绘制普通食物
    drawFood();

    // 绘制特殊食物
    if (specialFoodVisible) {
        drawSpecialFood();
    }

    // 如果游戏已开始，移动蛇
    if (gameStarted && !gameOver && !isPaused) {
        moveSnakes();
    }

    // 绘制活着的蛇
    if (player1Active) {
        drawSnake(snake1, '#2ecc71', '#27ae60', dx1, dy1);
    }
    if (player2Active) {
        drawSnake(snake2, '#e74c3c', '#c0392b', dx2, dy2);
    }

    // 显示失败玩家的信息
    if (!player1Active || !player2Active) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.font = '20px "Noto Sans SC"';
        let y = 30;
        if (!player1Active) {
            ctx.fillText('玩家1已失败', 10, y);
            y += 30;
        }
        if (!player2Active) {
            ctx.fillText('玩家2已失败', 10, y);
        }
    }

    // 如果游戏暂停，显示暂停提示
    if (isPaused) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px "Noto Sans SC"';
        ctx.textAlign = 'center';
        ctx.fillText('游戏暂停', canvas.width/2, canvas.height/2);
        ctx.textAlign = 'left';
    }
}

function moveSnakes() {
    // 移动玩家1的蛇（如果还活着）
    if (player1Active) {
        const head1 = { x: snake1[0].x + dx1, y: snake1[0].y + dy1 };
        snake1.unshift(head1);
        
        // 检查玩家1是否吃到食物
        if (head1.x === food.x && head1.y === food.y) {
            score1 += 10;
            updateScores();
            generateFood();
            increaseSpeed();
            playSound(eatSound);
        } else if (specialFoodVisible && head1.x === specialFood.x && head1.y === specialFood.y) {
            // 吃到特殊食物
            score1 += specialFoodScore;
            updateScores();
            hideSpecialFood();
            playSound(eatSound);
            // 增加蛇的长度
            snake1.push({});
        } else {
            snake1.pop();
        }

        // 检查玩家1是否撞墙或撞到自己
        if (checkCollision(snake1, snake1)) {
            player1Active = false;
            if (!player2Active) {
                endGame();
                return;
            }
        }
    }

    // 移动玩家2的蛇（如果还活着）
    if (player2Active) {
        const head2 = { x: snake2[0].x + dx2, y: snake2[0].y + dy2 };
        snake2.unshift(head2);
        
        // 检查玩家2是否吃到食物
        if (head2.x === food.x && head2.y === food.y) {
            score2 += 10;
            updateScores();
            generateFood();
            increaseSpeed();
            playSound(eatSound);
        } else if (specialFoodVisible && head2.x === specialFood.x && head2.y === specialFood.y) {
            // 吃到特殊食物
            score2 += specialFoodScore;
            updateScores();
            hideSpecialFood();
            playSound(eatSound);
            // 增加蛇的长度
            snake2.push({});
        } else {
            snake2.pop();
        }

        // 检查玩家2是否撞墙或撞到自己
        if (checkCollision(snake2, snake2)) {
            player2Active = false;
            if (!player1Active) {
                endGame();
                return;
            }
        }
    }

    // 检查蛇之间的碰撞
    if (player1Active && player2Active) {
        if (checkSnakeCollision(snake1, snake2)) {
            player1Active = false;
        }
        if (checkSnakeCollision(snake2, snake1)) {
            player2Active = false;
        }
        if (!player1Active && !player2Active) {
            endGame();
            return;
        }
    }
}

function updateScores() {
    const player1Score = document.querySelector('.player1 .score-value');
    const player2Score = document.querySelector('.player2 .score-value');
    player1Score.textContent = score1;
    player2Score.textContent = score2;
}

function increaseSpeed() {
    if (gameSpeed > 50) {
        gameSpeed -= 2;
        clearInterval(gameLoop);
        gameLoop = setInterval(drawGame, gameSpeed);
    }
}

function drawCheckerboard() {
    // 先绘制白色背景
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制灰色格子
    ctx.fillStyle = '#f0f0f0';
    for (let i = 0; i < tileCount; i++) {
        for (let j = 0; j < tileCount; j++) {
            if ((i + j) % 2 === 0) {
                ctx.fillRect(
                    i * gridSize,
                    j * gridSize,
                    gridSize,
                    gridSize
                );
            }
        }
    }

    // 绘制边框
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

function drawFood() {
    const centerX = food.x * gridSize + gridSize / 2;
    const centerY = food.y * gridSize + gridSize / 2;
    const radius = gridSize / 2 - 2;
    
    // 创建径向渐变
    const gradient = ctx.createRadialGradient(
        centerX - radius/3,
        centerY - radius/3,
        radius/4,
        centerX,
        centerY,
        radius
    );
    gradient.addColorStop(0, '#f1c40f');
    gradient.addColorStop(1, '#f39c12');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 添加高光效果
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(centerX - radius/3, centerY - radius/3, radius/4, 0, Math.PI * 2);
    ctx.fill();
}

function drawSnake(snake, headColor, bodyColor, dx, dy) {
    // 绘制蛇身
    for (let i = 1; i < snake.length; i++) {
        const segment = snake[i];
        const gradient = ctx.createLinearGradient(
            segment.x * gridSize,
            segment.y * gridSize,
            (segment.x + 1) * gridSize,
            (segment.y + 1) * gridSize
        );
        gradient.addColorStop(0, bodyColor);
        gradient.addColorStop(1, adjustColor(bodyColor, -20));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(
            segment.x * gridSize + 1,
            segment.y * gridSize + 1,
            gridSize - 2,
            gridSize - 2
        );
    }

    // 绘制蛇头
    const head = snake[0];
    const headGradient = ctx.createLinearGradient(
        head.x * gridSize,
        head.y * gridSize,
        (head.x + 1) * gridSize,
        (head.y + 1) * gridSize
    );
    headGradient.addColorStop(0, headColor);
    headGradient.addColorStop(1, adjustColor(headColor, -20));
    
    ctx.fillStyle = headGradient;
    ctx.fillRect(
        head.x * gridSize + 1,
        head.y * gridSize + 1,
        gridSize - 2,
        gridSize - 2
    );

    // 添加眼睛
    ctx.fillStyle = '#ffffff';
    const eyeSize = 4;
    const eyeOffset = 4;
    
    if (dx === 1) { // 向右
        ctx.fillRect(head.x * gridSize + gridSize - eyeOffset - 2, head.y * gridSize + eyeOffset, eyeSize, eyeSize);
        ctx.fillRect(head.x * gridSize + gridSize - eyeOffset - 2, head.y * gridSize + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
    } else if (dx === -1) { // 向左
        ctx.fillRect(head.x * gridSize + eyeOffset, head.y * gridSize + eyeOffset, eyeSize, eyeSize);
        ctx.fillRect(head.x * gridSize + eyeOffset, head.y * gridSize + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
    } else if (dy === -1) { // 向上
        ctx.fillRect(head.x * gridSize + eyeOffset, head.y * gridSize + eyeOffset, eyeSize, eyeSize);
        ctx.fillRect(head.x * gridSize + gridSize - eyeOffset - eyeSize, head.y * gridSize + eyeOffset, eyeSize, eyeSize);
    } else if (dy === 1) { // 向下
        ctx.fillRect(head.x * gridSize + eyeOffset, head.y * gridSize + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
        ctx.fillRect(head.x * gridSize + gridSize - eyeOffset - eyeSize, head.y * gridSize + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
    } else { // 初始状态
        ctx.fillRect(head.x * gridSize + gridSize - eyeOffset - 2, head.y * gridSize + eyeOffset, eyeSize, eyeSize);
        ctx.fillRect(head.x * gridSize + gridSize - eyeOffset - 2, head.y * gridSize + gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
    }
}

function adjustColor(color, amount) {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function drawStartScreen() {
    // 绘制棋盘格背景
    drawCheckerboard();
    
    // 绘制半透明遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Noto Sans SC"';
    ctx.textAlign = 'center';
    ctx.fillText('按任意键开始游戏', canvas.width/2, canvas.height/2 - 30);
    
    ctx.font = '16px "Noto Sans SC"';
    ctx.fillText('玩家1：使用方向键控制', canvas.width/2, canvas.height/2 + 10);
    ctx.fillText('玩家2：使用WASD键控制', canvas.width/2, canvas.height/2 + 40);
    
    // 添加移动端提示
    if (window.innerWidth <= 768) {
        ctx.fillText('移动端用户请使用屏幕按钮控制', canvas.width/2, canvas.height/2 + 70);
    }
    
    ctx.textAlign = 'left';
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 30px Arial';
    ctx.fillText('游戏结束!', canvas.width/2, canvas.height/2 - 50);
    
    ctx.font = '20px Arial';
    let winner = '';
    if (score1 > score2) {
        winner = '玩家1获胜！';
    } else if (score2 > score1) {
        winner = '玩家2获胜！';
    } else {
        winner = '平局！';
    }
    
    ctx.fillText(winner, canvas.width/2, canvas.height/2 - 20);
    ctx.fillText(`玩家1得分: ${score1}`, canvas.width/2, canvas.height/2 + 10);
    ctx.fillText(`玩家2得分: ${score2}`, canvas.width/2, canvas.height/2 + 40);
    
    // 根据设备类型显示不同的重新开始提示
    if (window.innerWidth <= 768) {
        ctx.fillText('点击屏幕任意位置重新开始', canvas.width/2, canvas.height/2 + 80);
    } else {
        ctx.fillText('按空格键重新开始', canvas.width/2, canvas.height/2 + 80);
    }
    
    ctx.textAlign = 'left';
}

function generateFood() {
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
        food.x = Math.floor(Math.random() * tileCount);
        food.y = Math.floor(Math.random() * tileCount);
        attempts++;
    } while ((checkSnake(snake1) || checkSnake(snake2)) && attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
        // 如果找不到合适的位置，重置游戏
        resetGame();
    }
}

function checkCollision(snake, selfSnake) {
    const head = snake[0];
    
    // 检查是否撞墙
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        return true;
    }

    // 检查是否撞到自己
    for (let i = 1; i < selfSnake.length; i++) {
        if (head.x === selfSnake[i].x && head.y === selfSnake[i].y) {
            return true;
        }
    }

    return false;
}

function checkSnakeCollision(snake1, snake2) {
    const head = snake1[0];
    return snake2.some(segment => head.x === segment.x && head.y === segment.y);
}

function endGame() {
    gameOver = true;
    if (isSoundEnabled) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        gameOverSound.play().catch(error => console.log("音频播放失败:", error));
    }
    
    // 更新游戏结束界面
    let winner = '';
    if (score1 > score2) {
        winner = '玩家1获胜！';
    } else if (score2 > score1) {
        winner = '玩家2获胜！';
    } else {
        winner = '平局！';
    }
    
    winnerInfo.textContent = winner;
    finalScores.innerHTML = `
        <div>玩家1得分: ${score1}</div>
        <div>玩家2得分: ${score2}</div>
    `;
    
    gameOverlay.style.display = 'flex';
    
    // 更新排行榜
    updateLeaderboard(Math.max(score1, score2));
}

// 添加排行榜相关函数
function getLeaderboard() {
    const leaderboard = localStorage.getItem('snakeLeaderboard');
    return leaderboard ? JSON.parse(leaderboard) : [];
}

function saveLeaderboard(leaderboard) {
    localStorage.setItem('snakeLeaderboard', JSON.stringify(leaderboard));
}

function updateLeaderboard(score) {
    let leaderboard = getLeaderboard();
    // 添加带时间的记录
    const now = new Date();
    const record = {
        score: score,
        date: now.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        })
    };
    leaderboard.push(record);
    // 按分数排序
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10); // 只保留前10名
    saveLeaderboard(leaderboard);
    displayLeaderboard();
}

function displayLeaderboard() {
    const leaderboard = getLeaderboard();
    const leaderboardList = document.getElementById('leaderboard-list');
    leaderboardList.innerHTML = '';

    leaderboard.forEach((record, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.innerHTML = `
            <div class="leaderboard-info">
                <span class="leaderboard-rank">#${index + 1}</span>
                <span class="leaderboard-score">${record.score}</span>
            </div>
            <div class="leaderboard-date">${record.date || '无记录'}</div>
        `;
        leaderboardList.appendChild(item);
    });
}

function resetGame() {
    snake1 = [{ x: 5, y: 10 }];
    snake2 = [{ x: tileCount - 6, y: 10 }];
    dx1 = 0;
    dy1 = 0;
    dx2 = 0;
    dy2 = 0;
    score1 = 0;
    score2 = 0;
    gameSpeed = 150;
    gameOver = false;
    gameStarted = false;
    player1Active = true;
    player2Active = true;
    isPaused = false;
    lastTime = 0;
    frameCount = 0;
    
    updateScores();
    generateFood();
    
    // 隐藏游戏结束界面
    gameOverlay.style.display = 'none';
    
    // 重新开始背景音乐
    if (isSoundEnabled) {
        backgroundMusic.currentTime = 0;
        backgroundMusic.play().catch(error => console.log("音频播放失败:", error));
    }
}

// 修改移动端控制初始化函数
function initMobileControls() {
    const controlButtons = document.querySelectorAll('.control-btn');
    
    controlButtons.forEach(button => {
        // 触摸开始事件
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const keyCode = parseInt(button.dataset.key);
            handleKeyPress(keyCode);
            
            // 添加视觉反馈
            button.style.transform = 'scale(0.95)';
            button.style.opacity = '0.8';
        });

        // 触摸结束事件
        button.addEventListener('touchend', (e) => {
            e.preventDefault();
            // 恢复按钮状态
            button.style.transform = 'scale(1)';
            button.style.opacity = '1';
        });

        // 触摸取消事件
        button.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            // 恢复按钮状态
            button.style.transform = 'scale(1)';
            button.style.opacity = '1';
        });
    });

    // 添加设备方向检测
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleOrientation);
    }
}

// 添加设备方向检测
function handleOrientation(event) {
    if (window.innerWidth <= 768) {
        const orientation = event.alpha;
        if (orientation !== null) {
            // 根据设备方向调整控制按钮的显示
            const controls = document.querySelector('.mobile-controls');
            if (orientation > 45 && orientation < 135) {
                controls.style.transform = 'rotate(90deg)';
            } else {
                controls.style.transform = 'rotate(0deg)';
            }
        }
    }
}

// 修改触摸事件处理
function initTouchEvents() {
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (gameOver) {
            resetGame();
        } else if (!gameStarted) {
            gameStarted = true;
            if (isSoundEnabled) {
                backgroundMusic.play().catch(error => console.log("音频播放失败:", error));
            }
        }
    });
}

// 修改游戏循环函数
function gameLoop(currentTime) {
    if (!gameStarted) {
        drawStartScreen();
        requestAnimationFrame(gameLoop);
        return;
    }

    if (lastTime === 0) {
        lastTime = currentTime;
    }

    const deltaTime = currentTime - lastTime;

    if (deltaTime >= frameInterval) {
        lastTime = currentTime;
        drawGame();
    }

    requestAnimationFrame(gameLoop);
}

// 添加事件监听器
restartBtn.addEventListener('click', resetGame);

soundToggle.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    if (isSoundEnabled) {
        soundToggle.querySelector('.icon').textContent = '🔊';
        soundToggle.querySelector('.label').textContent = '音效';
    } else {
        soundToggle.querySelector('.icon').textContent = '🔈';
        soundToggle.querySelector('.label').textContent = '静音';
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }
});

pauseToggle.addEventListener('click', () => {
    isPaused = !isPaused;
    if (isPaused) {
        pauseToggle.querySelector('.icon').textContent = '▶️';
        pauseToggle.querySelector('.label').textContent = '继续';
    } else {
        pauseToggle.querySelector('.icon').textContent = '⏸️';
        pauseToggle.querySelector('.label').textContent = '暂停';
    }
});

// 修改音频播放处理
function playSound(sound) {
    if (isSoundEnabled) {
        sound.currentTime = 0;
        sound.play().catch(error => console.log("音频播放失败:", error));
    }
}

// 修改游戏初始化函数
function initGame() {
    // 初始化游戏状态
    snake1 = [{ x: 5, y: 10 }];
    snake2 = [{ x: tileCount - 6, y: 10 }];
    dx1 = 0;
    dy1 = 0;
    dx2 = 0;
    dy2 = 0;
    score1 = 0;
    score2 = 0;
    gameSpeed = 150;
    gameOver = false;
    gameStarted = false;
    player1Active = true;
    player2Active = true;
    isPaused = false;
    lastTime = 0;
    frameCount = 0;

    // 重置特殊食物状态
    hideSpecialFood();
    if (specialFoodTimer) {
        clearInterval(specialFoodTimer);
    }

    // 生成初始食物
    generateFood();
    
    // 初始化移动端控制
    initMobileControls();
    
    // 初始化触摸事件
    initTouchEvents();
    
    // 初始化显示排行榜
    displayLeaderboard();

    // 立即绘制开始屏幕
    drawStartScreen();
    
    // 开始游戏循环
    requestAnimationFrame(gameLoop);

    // 设置特殊食物定时生成
    specialFoodTimer = setInterval(() => {
        if (gameStarted && !gameOver && !isPaused) {
            generateSpecialFood();
        }
    }, SPECIAL_FOOD_INTERVAL);
}

// 在游戏开始时初始化
initGame();

// 添加特殊食物绘制函数
function drawSpecialFood() {
    const centerX = specialFood.x * gridSize + gridSize / 2;
    const centerY = specialFood.y * gridSize + gridSize / 2;
    const radius = gridSize / 2 - 2;
    
    // 创建闪烁效果
    const alpha = 0.5 + Math.sin(Date.now() / 200) * 0.5;
    
    // 创建径向渐变
    const gradient = ctx.createRadialGradient(
        centerX - radius/3,
        centerY - radius/3,
        radius/4,
        centerX,
        centerY,
        radius
    );
    gradient.addColorStop(0, `rgba(255, 0, 255, ${alpha})`);
    gradient.addColorStop(1, `rgba(128, 0, 255, ${alpha})`);
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 添加星星效果
    const starPoints = 5;
    const outerRadius = radius * 0.8;
    const innerRadius = radius * 0.4;
    
    ctx.beginPath();
    for (let i = 0; i < starPoints * 2; i++) {
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / starPoints;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fill();
}

// 添加特殊食物生成函数
function generateSpecialFood() {
    if (gameOver || !gameStarted || isPaused) return;
    
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
        specialFood.x = Math.floor(Math.random() * tileCount);
        specialFood.y = Math.floor(Math.random() * tileCount);
        attempts++;
    } while ((
        checkSnake(snake1) || 
        checkSnake(snake2) || 
        (specialFood.x === food.x && specialFood.y === food.y)
    ) && attempts < maxAttempts);
    
    if (attempts < maxAttempts) {
        specialFoodVisible = true;
        // 设置特殊食物消失定时器
        setTimeout(hideSpecialFood, SPECIAL_FOOD_DURATION);
    }
}

// 添加特殊食物隐藏函数
function hideSpecialFood() {
    specialFoodVisible = false;
    specialFood.x = -1;
    specialFood.y = -1;
}

// 确保在页面加载完成后初始化游戏
window.addEventListener('load', () => {
    initGame();
    requestAnimationFrame(gameLoop);
});