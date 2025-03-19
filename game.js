const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// Game constants
const GRAVITY = 0.23;
const FLAP_STRENGTH = -7;
const PIPE_SPEED = 2;
const PIPE_GAP = 150;
const PIPE_WIDTH = 50;
const MAX_ROTATION = 25;
const FIREBALL_SPEED = 4;
const POWERUP_SPEED = 2;
const POWERUP_SIZE = 30;
const INVINCIBILITY_DURATION = 5000; // 5 seconds

// Game state
let bird = {
    x: canvas.width / 3,
    y: canvas.height / 2,
    velocity: 0,
    rotation: 0,
    width: 40,
    height: 30,
    isInvincible: false
};

let pipes = [];
let fireballs = [];
let powerups = [];
let score = 0;
let gameOver = false;
let lastPipeTime = 0;
let lastFireballTime = 0;
let lastPowerupTime = 0;
let gameStarted = false;

// Load images
const herringImage = new Image();
herringImage.src = 'assets/herring.png';

const fireballImage = new Image();
fireballImage.src = 'assets/fireball.svg';

const powerupImage = new Image();
powerupImage.src = 'assets/powerup.svg';

// Event listeners
function handleInput(e) {
    // Prevent default behavior for space key
    if (e.code === 'Space') {
        e.preventDefault();
    }
    
    if (!gameStarted) {
        gameStarted = true;
    }
    
    if (gameOver) {
        resetGame();
    } else {
        bird.velocity = FLAP_STRENGTH;
    }
}

// Add multiple event listeners for better compatibility
document.addEventListener('keydown', handleInput);
document.addEventListener('keypress', handleInput);
canvas.addEventListener('click', handleInput);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent scrolling on mobile
    handleInput(e);
});

// Prevent scrolling on mobile
document.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

// Game functions
function createPipe() {
    const gapY = Math.random() * (canvas.height - PIPE_GAP - 100) + 50;
    pipes.push({
        x: canvas.width,
        gapY: gapY,
        passed: false
    });
}

function createFireball() {
    const y = Math.random() * (canvas.height - 50);
    fireballs.push({
        x: canvas.width,
        y: y,
        width: 30,
        height: 30
    });
}

function createPowerup() {
    const y = Math.random() * (canvas.height - POWERUP_SIZE);
    powerups.push({
        x: canvas.width,
        y: y,
        width: POWERUP_SIZE,
        height: POWERUP_SIZE,
        collected: false
    });
}

function update() {
    if (gameOver || !gameStarted) return;

    // Update bird
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;
    bird.rotation = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, bird.velocity * 2));

    // Generate pipes
    const currentTime = Date.now();
    if (currentTime - lastPipeTime > 1500) {
        createPipe();
        lastPipeTime = currentTime;
    }

    // Generate fireballs
    if (currentTime - lastFireballTime > 2000) {
        createFireball();
        lastFireballTime = currentTime;
    }

    // Generate powerups
    if (currentTime - lastPowerupTime > 8000) {
        createPowerup();
        lastPowerupTime = currentTime;
    }

    // Update pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        const pipe = pipes[i];
        pipe.x -= PIPE_SPEED;

        // Check for score
        if (!pipe.passed && pipe.x < bird.x) {
            score++;
            scoreElement.textContent = `Score: ${score}`;
            pipe.passed = true;
        }

        // Remove off-screen pipes
        if (pipe.x < -PIPE_WIDTH) {
            pipes.splice(i, 1);
        }

        // Check collisions
        if (!bird.isInvincible) {
            if (bird.x + bird.width > pipe.x && 
                bird.x < pipe.x + PIPE_WIDTH) {
                if (bird.y < pipe.gapY - PIPE_GAP/2 || 
                    bird.y + bird.height > pipe.gapY + PIPE_GAP/2) {
                    gameOver = true;
                }
            }
        }
    }

    // Update fireballs
    for (let i = fireballs.length - 1; i >= 0; i--) {
        const fireball = fireballs[i];
        fireball.x -= FIREBALL_SPEED;

        // Remove off-screen fireballs
        if (fireball.x < -fireball.width) {
            fireballs.splice(i, 1);
        }

        // Check collision with bird
        if (!bird.isInvincible) {
            if (bird.x + bird.width > fireball.x && 
                bird.x < fireball.x + fireball.width &&
                bird.y + bird.height > fireball.y && 
                bird.y < fireball.y + fireball.height) {
                gameOver = true;
            }
        }
    }

    // Update powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        powerup.x -= POWERUP_SPEED;

        // Remove off-screen powerups
        if (powerup.x < -powerup.width) {
            powerups.splice(i, 1);
        }

        // Check collision with bird
        if (!powerup.collected) {
            if (bird.x + bird.width > powerup.x && 
                bird.x < powerup.x + powerup.width &&
                bird.y + bird.height > powerup.y && 
                bird.y < powerup.y + powerup.height) {
                powerup.collected = true;
                activatePowerup();
                powerups.splice(i, 1);
            }
        }
    }

    // Check boundaries
    if (bird.y < 0 || bird.y + bird.height > canvas.height) {
        gameOver = true;
    }
}

function activatePowerup() {
    bird.isInvincible = true;
    setTimeout(() => {
        bird.isInvincible = false;
    }, INVINCIBILITY_DURATION);
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#4A90E2';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw pipes
    ctx.fillStyle = '#2ecc71';
    pipes.forEach(pipe => {
        // Top pipe
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY - PIPE_GAP/2);
        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.gapY + PIPE_GAP/2, PIPE_WIDTH, canvas.height);
    });

    // Draw fireballs
    fireballs.forEach(fireball => {
        ctx.drawImage(fireballImage, fireball.x, fireball.y, fireball.width, fireball.height);
    });

    // Draw powerups
    powerups.forEach(powerup => {
        if (!powerup.collected) {
            ctx.drawImage(powerupImage, powerup.x, powerup.y, powerup.width, powerup.height);
        }
    });

    // Draw bird
    ctx.save();
    ctx.translate(bird.x + bird.width/2, bird.y + bird.height/2);
    ctx.rotate(bird.rotation * Math.PI / 180);
    
    // Add invincibility effect
    if (bird.isInvincible) {
        ctx.globalAlpha = 0.7;
        ctx.shadowColor = 'yellow';
        ctx.shadowBlur = 20;
    }
    
    ctx.drawImage(herringImage, -bird.width/2, -bird.height/2, bird.width, bird.height);
    ctx.restore();

    // Draw start message
    if (!gameStarted) {
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Press SPACE or Click to Start', canvas.width/2, canvas.height/2);
    }

    // Draw game over message
    if (gameOver) {
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width/2, canvas.height/2);
        ctx.font = '20px Arial';
        ctx.fillText('Click or press SPACE to restart', canvas.width/2, canvas.height/2 + 40);
    }
}

function resetGame() {
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    bird.rotation = 0;
    bird.isInvincible = false;
    pipes = [];
    fireballs = [];
    powerups = [];
    score = 0;
    scoreElement.textContent = `Score: ${score}`;
    gameOver = false;
    gameStarted = true;
    lastPipeTime = Date.now();
    lastFireballTime = Date.now();
    lastPowerupTime = Date.now();
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start the game
gameLoop(); 
