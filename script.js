const homePage = document.getElementById('homePage');
const playButton = document.getElementById('playButton');
const settingsButton = document.getElementById('settingsButton');
const highScoresButton = document.getElementById('highScoresButton');
const gameContainer = document.getElementById('gameContainer');
const gameCanvas = document.getElementById('gameCanvas');
const settingsPage = document.getElementById('settingsPage');
const highScoresPage = document.getElementById('highScoresPage');
const backToHomeFromSettings = document.getElementById('backToHomeFromSettings');
const backToHomeFromScores = document.getElementById('backToHomeFromScores');
const settingsForm = document.getElementById('settingsForm');
const gravityInput = document.getElementById('gravity');
const birdVelocityInput = document.getElementById('birdVelocity');
const backgroundThemeSelect = document.getElementById('backgroundTheme');
const birdAvatarSelect = document.getElementById('birdAvatar');
const backgroundMusicSelect = document.getElementById('backgroundMusic');
const uploadMusicInput = document.getElementById('uploadMusic');
const saveSettingsButton = document.getElementById('saveSettings');
const scoreList = document.getElementById('scoreList');
const ctx = gameCanvas.getContext('2d');

let game;
let highScores = JSON.parse(localStorage.getItem('highScores')) || [];

function showHomePage() {
    homePage.style.display = 'block';
    gameContainer.style.display = 'none';
    settingsPage.style.display = 'none';
    highScoresPage.style.display = 'none';
}

function showGamePage() {
    homePage.style.display = 'none';
    gameContainer.style.display = 'block';
    settingsPage.style.display = 'none';
    highScoresPage.style.display = 'none';
    startGame();
}

function showSettingsPage() {
    homePage.style.display = 'none';
    gameContainer.style.display = 'none';
    settingsPage.style.display = 'block';
    highScoresPage.style.display = 'none';
    loadSettings();
}

function showHighScoresPage() {
    homePage.style.display = 'none';
    gameContainer.style.display = 'none';
    settingsPage.style.display = 'none';
    highScoresPage.style.display = 'block';
    displayHighScores();
}

function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('flappyBirdSettings')) || {
        gravity: 1.5,
        birdVelocity: -6,
        backgroundTheme: 'default',
        birdAvatar: 'default',
        backgroundMusic: 'default'
    };
    gravityInput.value = settings.gravity;
    birdVelocityInput.value = settings.birdVelocity;
    backgroundThemeSelect.value = settings.backgroundTheme;
    birdAvatarSelect.value = settings.birdAvatar;
    backgroundMusicSelect.value = settings.backgroundMusic;
}

function saveSettings() {
    const settings = {
        gravity: parseFloat(gravityInput.value),
        birdVelocity: parseFloat(birdVelocityInput.value),
        backgroundTheme: backgroundThemeSelect.value,
        birdAvatar: birdAvatarSelect.value,
        backgroundMusic: backgroundMusicSelect.value
    };
    localStorage.setItem('flappyBirdSettings', JSON.stringify(settings));
    alert('Settings saved!');
}

function displayHighScores() {
    scoreList.innerHTML = '';
    highScores.sort((a, b) => b - a).slice(0, 10).forEach(score => {
        const li = document.createElement('li');
        li.textContent = score;
        scoreList.appendChild(li);
    });
}

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        // this.bird = {
        //     x: 50,
        //     y: this.height / 2 - 15,
        //     size: 30,
        //     velocity: 0,
        //     gravity: 1.5,
        //     jumpStrength: -6
        // };
        this.bird = {
            x: 50,
            y: this.height / 2 - 25,
            size: 50,       // Increase the bird’s size
            velocity: 0,
            gravity: 1.5,
            jumpStrength: -6
        };
        this.pipes = [];
        this.pipeWidth = 50;
        this.pipeGap = 150;
        this.score = 0;
        this.isGameOver = false;
        this.animationFrameId = null;
        this.backgroundImage = new Image();
        this.backgroundImage.src = 'assets/img/background.png'; // Placeholder
        this.birdImage = new Image();
        this.birdImage.src = 'assets/img/bird.png'; // Placeholder
        this.pipeImage = new Image();
        this.pipeImage.src = 'assets/img/pipe.png'; // Placeholder
        this.flapSound = new Audio('assets/audio/flap.wav'); // Placeholder
        this.hitSound = new Audio('assets/audio/hit.wav');   // Placeholder
        this.scoreSound = new Audio('assets/audio/score.wav'); // Placeholder
        this.backgroundMusic = new Audio('assets/audio/background_music.mp3'); // Placeholder
        this.backgroundMusic.loop = true;
        this.isPlayingMusic = false;
        this.loadSettings();
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('flappyBirdSettings')) || {
            gravity: 1.5,
            birdVelocity: -6,
            backgroundTheme: 'default',
            birdAvatar: 'default',
            backgroundMusic: 'default'
        };
        this.bird.gravity = settings.gravity;
        this.bird.jumpStrength = settings.birdVelocity;
        // Apply theme and avatar if you have more assets
        if (settings.backgroundMusic === 'default' && !this.isPlayingMusic) {
            this.playBackgroundMusic();
        } else if (settings.backgroundMusic !== 'default' && !this.isPlayingMusic) {
            // Handle uploaded music if needed
        }
    }

    playBackgroundMusic() {
        this.backgroundMusic.play().catch(() => {
            // Autoplay prevented, maybe show a message or button to start
        });
        this.isPlayingMusic = true;
    }

    stopBackgroundMusic() {
        this.backgroundMusic.pause();
        this.backgroundMusic.currentTime = 0;
        this.isPlayingMusic = false;
    }

    reset() {
        this.bird.y = this.height / 2 - 15;
        this.bird.velocity = 0;
        this.pipes = [];
        this.pipes.push({
            x: this.width,
            topHeight: 0,
            bottomHeight: 0,
            passed: false
        });
        this.score = 0;
        this.isGameOver = false;
        this.loadSettings();
        this.gameLoop();
    }

    addPipe() {
        const topPipeHeight = Math.random() * (this.height / 2) + 60;
        const bottomPipeHeight = this.height - topPipeHeight - this.pipeGap;
        this.pipes.push({
            x: this.width,
            topHeight: topPipeHeight,
            bottomHeight: bottomPipeHeight,
            passed: false
        });
    }

    update() {
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;

        if (this.bird.y < 0 || this.bird.y + this.bird.size > this.height) {
            this.gameOver();
        }

        if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].x < this.width - 200) {
            this.addPipe();
        }

        for (let i = 0; i < this.pipes.length; i++) {
            this.pipes[i].x -= 2;

            // Scoring logic
            if (this.pipes[i].x + this.pipeWidth < this.bird.x && !this.pipes[i].passed) {
                this.score++;
                this.pipes[i].passed = true;
                this.scoreSound.play();
            }

            // Collision detection
            if (
                this.bird.x < this.pipes[i].x + this.pipeWidth &&
                this.bird.x + this.bird.size > this.pipes[i].x &&
                (this.bird.y < this.pipes[i].topHeight ||
                 this.bird.y + this.bird.size > this.height - this.pipes[i].bottomHeight)
            ) {
                this.gameOver();
            }

            if (this.pipes[i].x < -this.pipeWidth) {
                this.pipes.splice(i, 1);
                i--;
            }
        }
    }

    draw() {
        this.ctx.drawImage(this.backgroundImage, 0, 0, this.width, this.height);

        for (const pipe of this.pipes) {
            this.ctx.drawImage(this.pipeImage, 0, 0, 52, 320, pipe.x, 0, this.pipeWidth, pipe.topHeight); // Top pipe
            this.ctx.drawImage(this.pipeImage, 0, 0, 52, 320, pipe.x, this.height - pipe.bottomHeight, this.pipeWidth, pipe.bottomHeight); // Bottom pipe (consider flipping)
        }

        this.ctx.drawImage(this.birdImage, this.bird.x, this.bird.y, this.bird.size, this.bird.size);

        this.ctx.fillStyle = '#000';
        this.ctx.font = '20px sans-serif';
        this.ctx.fillText(`Score: ${this.score}`, 10, 20);
    }

    gameLoop() {
        if (this.isGameOver) {
            return;
        }
        this.update();
        this.draw();
        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }

    jump() {
        this.bird.velocity = this.bird.jumpStrength;
        this.flapSound.play();
    }

    gameOver() {
        this.isGameOver = true;
        this.hitSound.play();
        this.stopBackgroundMusic();
        highScores.push(this.score);
        highScores.sort((a, b) => b - a);
        if (highScores.length > 10) {
            highScores = highScores.slice(0, 10);
        }
        localStorage.setItem('highScores', JSON.stringify(highScores));
        alert(`Game Over! Your score: ${this.score}`);
        cancelAnimationFrame(this.animationFrameId);
        showHomePage();
    }
}

function startGame() {
    game = new Game(gameCanvas);
    game.reset();
}

gameCanvas.addEventListener('mousedown', () => {
    if (game && !game.isGameOver) {
        game.jump();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === ' ' && game && !game.isGameOver) {
        game.jump();
    }
});

playButton.addEventListener('click', showGamePage);
settingsButton.addEventListener('click', showSettingsPage);
highScoresButton.addEventListener('click', showHighScoresPage);
backToHomeFromSettings.addEventListener('click', showHomePage);
backToHomeFromScores.addEventListener('click', showHomePage);
saveSettingsButton.addEventListener('click', saveSettings);

uploadMusicInput.addEventListener('change', (event) => {
    const file = event.target.files;
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            game.backgroundMusic.src = e.target.result;
            game.playBackgroundMusic();
            localStorage.setItem('flappyBirdSettings', JSON.stringify({
                ...JSON.parse(localStorage.getItem('flappyBirdSettings') || '{}'),
                backgroundMusic: 'uploaded'
            }));
            backgroundMusicSelect.value = 'uploaded';
        };
        reader.readAsDataURL(file);
    }
});

window.onload = showHomePage;

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js');
    });
}
// Existing mouse event
gameCanvas.addEventListener('mousedown', () => {
    if (game && !game.isGameOver) {
        game.jump();
    }
});

// Add a touch event listener
gameCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevents any unwanted default behavior like scrolling
    if (game && !game.isGameOver) {
        game.jump();
    }
});
