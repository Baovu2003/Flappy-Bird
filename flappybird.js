let board;
let boardWidth = 460;
let boardHeight = 650;
let context;

// bird
let birdWidth = 40;
let birdHeight = 40;
let birdX = boardWidth / 8; // Chim xuất hiện ở bên trái màn hình
let birdY = boardHeight / 2; // Ở giữa màn hình

let birdImgs = []; 
let birdImgsIndex = 0;

let bird = {
    x: birdX,
    y: birdY,
    width: birdWidth,
    height: birdHeight,
};

// pipes
let pipeArray = [];
let pipeWidth = 64;
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;

//physics
let velocityX = -2; // tốc độ ống nước di chuyển sang trái
let velocityY = 0; // tốc độ rơi của chim
let gravity = 0.3; // Trọng lực nhẹ giúp chim rơi từ từ
let jumpForce = -2; // Lực nhảy mạnh giúp chim bay lên nhanh
let maxFallSpeed = 5; // Giới hạn tốc độ rơi để chim không rơi quá nhanh

let gameStarted = false; 
let gameOver = false;
let score = 0;
let highScore = 0; // Variable to store the highest score

let fallingObjects = []; // Mảng để chứa các vật thể đang rơi
let hasFallenEffect = false; // Biến flag để kiểm tra xem hiệu ứng đã được thực hiện chưa

let wingSound = new Audio("./assets/Sound/sfx_wing.wav");
const hitSound = new Audio("./assets/Sound/sfx_hit.wav");
let bmg = new Audio("./assets/Sound/bgm_mario.mp3");

let dieSound = new Audio("./assets/Sound/sfx_die.wav");
bmg.loop = true;
window.onload = function () {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    // Load hình ảnh con chim
    for(let i=0; i < 4 ; i++) {
        let birdImg = new Image();
        birdImg.src = `./assets/images/bird/flappybird${i}.png`;
        birdImgs.push(birdImg);
    }

    // Load hình ảnh ống nước
    topPipeImg = new Image();
    topPipeImg.src = "./assets/images/toppipe.png";

    bottomPipeImg = new Image();
    bottomPipeImg.src = "./assets/images/bottompipe.png";
    document.getElementById("start-screen").addEventListener("click", startGame); // Start game on click
 
};
function startGame() {
    if (!gameStarted) {
        gameStarted = true; // Set flag to true
        document.getElementById("start-screen").style.display = "none"; // Hide start screen
        bmg.play(); // Play background music
        requestAnimationFrame(update); // Start the game loop
        setInterval(placePipes, 1500);
        setInterval(animateBird, 100);
        document.addEventListener("keydown", moveBird);
        document.addEventListener("click", moveBird);
    }
}

function update() {
    requestAnimationFrame(update); // Gọi lại chính nó để game chạy liên tục
    if (gameOver) {
        document.getElementById("game-over").style.display = "block"; // Show the Game Over screen

        // Update high score if the current score is higher than the high score
        if (score > highScore) {
            highScore = score;
        }

        // Display the current score with a different color
        context.fillStyle = "yellow"; // Set color for the current score
        context.font = "45px sans-serif";
        context.fillText("Score: " + score, 5, 45); // Display current score

        // Display the high score with a different color
        context.fillStyle = "cyan"; // Set color for the high score
        context.font = "45px sans-serif";
        context.fillText("High Score: " + highScore, 5, 90); // Display high score below current score

        return;
    }

    context.clearRect(0, 0, boardWidth, boardHeight); // Xóa canvas để vẽ lại

    // Vẽ chim
    velocityY += gravity;
    velocityY = Math.min(velocityY, maxFallSpeed);
    bird.y = Math.max(bird.y + velocityY, 0);
    context.drawImage(birdImgs[birdImgsIndex], bird.x, bird.y, bird.height, bird.width);

    if (bird.y > board.height) {
        gameOver = true;
        dieSound.play();
    }
    
    // Vẽ ống nước
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];
        pipe.x += velocityX; // Di chuyển ống nước sang trái
        context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

        if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            score += 0.5; //0.5 because there are 2 pipes! so 0.5*2 = 1, 1 for each set of pipes
            pipe.passed = true;
            if (score > highScore && !hasFallenEffect) {
                addFallingEffect();
                hasFallenEffect = true;
            }
        }

        if (fallingObjects.length > 0) {
            for (let i = 0; i < fallingObjects.length; i++) {
                let obj = fallingObjects[i];
                obj.y += obj.speed;
                context.fillStyle = obj.color;
                context.beginPath();
                context.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2); // Drawing as a circle
                context.fill();

                if (obj.y > boardHeight) {
                    fallingObjects.splice(i, 1);
                    i--;
                }
            }
        }

        if (detectCollision(bird, pipe)) {
            gameOver = true;
            hitSound.play();
        }
    }

    //clear pipes
    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
        pipeArray.shift(); //removes first element from the array
    }

    //score
    context.fillStyle = "white";
    context.font = "45px sans-serif";
    context.fillText("Score: " + score, 5, 45);

    if (gameOver) {
        bmg.pause();
        bmg.currentTime = 0;
        return;
    }
}

function animateBird() {
    birdImgsIndex++;
    birdImgsIndex %= birdImgs.length;
}

function placePipes() {
    if (gameOver) {
        document.getElementById("game-over").style.display = "block"; // Show Game Over screen
        return;
    }

    let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);
    let openingSpace = board.height / 4;

    let topPipe = {
        img: topPipeImg,
        x: pipeX,
        y: randomPipeY,
        width: pipeWidth,
        height: pipeHeight,
        passed: false,
    };
    pipeArray.push(topPipe);

    let bottomPipe = {
        img: bottomPipeImg,
        x: pipeX,
        y: randomPipeY + pipeHeight + openingSpace,
        width: pipeWidth,
        height: pipeHeight,
        passed: false,
    };
    pipeArray.push(bottomPipe); // Thêm vào mảng để vẽ trên màn hình
}

function moveBird(e) {
    if (e.type == "click" || e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyX") {
        if (bmg.paused) {
            bmg.play();
        }
        wingSound.play();
        velocityY = -6;

        if (gameOver) {
            setTimeout(() => {
                bird.y = birdY;
                pipeArray = [];
                score = 0;
                gameOver = false;
                document.getElementById("game-over").style.display = "none"; // Hide "Game Over" screen
                hasFallenEffect  = false;
            }, 100);
        }
    }
}

function detectCollision(a, b) {
    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}

function addFallingEffect() {
    let numberOfObjects = Math.floor(Math.random() * 5) + 3; // Số lượng vật thể ngẫu nhiên từ 3 đến 7

    for (let i = 0; i < numberOfObjects; i++) {
        let obj = {
            x: Math.random() * boardWidth, // Vị trí ngẫu nhiên trên màn hình
            y: 0, // Vật thể bắt đầu từ trên cùng của màn hình
            size: Math.random() * 10 + 5, // Kích thước ngẫu nhiên
            speed: Math.random() + 2, // Tốc độ rơi ngẫu nhiên
            color: getRandomColor(), // Màu sắc ngẫu nhiên
        };

        fallingObjects.push(obj); // Thêm vật thể vào mảng
    }
}

function getRandomColor() {
    let letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
