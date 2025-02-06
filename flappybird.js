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

//  pipes
let pipeArray = [];
let pipeWidth = 64;
let pipeHeight = 512;
let pipeX = boardWidth;
let pipeY = 0;

let topPipeImg;
let bottomPipeImg;

//physics
let velocityX = -2; // tốc độ ống nước di chuyển sang trái
let velocityY = 0; // tốc độ rơi của chim
// let gravity = 0.15; // trọng lực kéo chim xuống

let gravity = 0.3; // Trọng lực nhẹ giúp chim rơi từ từ
let jumpForce = -2; // Lực nhảy mạnh giúp chim bay lên nhanh
let maxFallSpeed = 5; // Giới hạn tốc độ rơi để chim không rơi quá nhanh

let gameOver = false;
let score = 0;
let highScore = 0; // Variable to store the highest score

let fallingObjects = []; // Mảng để chứa các vật thể đang rơi
let hasFallenEffect = false; // Biến flag để kiểm tra xem hiệu ứng đã được thực hiện chưa

let wingSound = new Audio("./public/Sound/sfx_wing.wav");
const hitSound = new Audio("./public/Sound/sfx_hit.wav");
let bmg = new Audio("./public/Sound/bgm_mario.mp3");

let dieSound = new Audio("./public/Sound/sfx_die.wav");
bmg.loop =true; //
window.onload = function () {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    // Load hình ảnh con chim

    for(let i=0; i < 4 ; i++) {
        let birdImg = new Image();
         birdImg.src = `./public/images/bird/flappybird${i}.png`;
         birdImgs.push(birdImg)
    }
 
    // birdImg = new Image();
    // birdImg.src = "./public/images/flappybird.png";
    // birdImg.onload = function () {
    //     context.drawImage(birdImg, bird.x, bird.y, bird.height, bird.width);
    // };

    // Load hình ảnh ống nước
    topPipeImg = new Image();
    topPipeImg.src = "./public/images/toppipe.png";

    bottomPipeImg = new Image();
    bottomPipeImg.src = "./public/images/bottompipe.png";

    requestAnimationFrame(update); // Bắt đầu vẽ game
    setInterval(placePipes, 1500); // Mỗi 1.5 giây, tạo một cặp ống nước
    setInterval(animateBird, 100); // Mỗi 1.5 giây, tạo một cặp ống nước
    document.addEventListener("keydown", moveBird);
    document.addEventListener("click", moveBird);
    bmg.play();
};

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
    // Giới hạn tốc độ rơi để tránh chim rơi quá nhanh
    velocityY = Math.min(velocityY, maxFallSpeed);

    //   Nếu làm như dưới thì con chim sẽ bay lên cao mãi
    // bird.y += velocityY;
    bird.y = Math.max(bird.y + velocityY, 0);
    // context.drawImage(birdImg, bird.x, bird.y, bird.height, bird.width);
    context.drawImage(birdImgs[birdImgsIndex], bird.x, bird.y, bird.height, bird.width);
    // birdImgsIndex++;
    // birdImgsIndex %= birdImgs.length;

    if (bird.y > board.height) {
        gameOver = true;
        dieSound.play();
    }
    // Vẽ ống nước
    for (let i = 0; i < pipeArray.length; i++) {
        let pipe = pipeArray[i];

        // Vẽ các vật thể rơi xuống
        pipe.x += velocityX; // Di chuyển ống nước sang trái
        context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

        if (!pipe.passed && bird.x > pipe.x + pipe.width) {
            score += 0.5; //0.5 because there are 2 pipes! so 0.5*2 = 1, 1 for each set of pipes
            pipe.passed = true;
            if (score > highScore && !hasFallenEffect) { // Đảm bảo hiệu ứng chỉ thực hiện một lần
                addFallingEffect();
                hasFallenEffect = true; // Đặt flag thành true
              }
        }
        console.log(fallingObjects.length)
      
        if(fallingObjects.length > 0){
            for (let i = 0; i < fallingObjects.length; i++) {
                let obj = fallingObjects[i];
    
                // Move the falling object down
                obj.y += obj.speed;
    
                // Draw the falling object
                context.fillStyle = obj.color;
                context.beginPath();
                context.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2); // Drawing as a circle
                context.fill();
    
                // Xóa bỏ nếu rơi khỏi màn hìnhh
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
    for (let i = 0; i < fallingObjects.length; i++) {
        let obj = fallingObjects[i];

        // Move the falling object down
        obj.y += obj.speed;

        // Draw the falling object
        context.fillStyle = obj.color;
        context.beginPath();
        context.arc(obj.x, obj.y, obj.size, 0, Math.PI * 2); // Drawing as a circle
        context.fill();

        // Remove falling object if it's off-screen
        if (obj.y > boardHeight) {
            fallingObjects.splice(i, 1);
            i--;
        }
    }

    //score
    context.fillStyle = "white";
    context.font = "45px sans-serif";
    context.fillText("Score: " + score, 5, 45);

    if (gameOver) {
        bmg.pause();
        bmg.currentTime = 0
        return;
    }
}
function animateBird(){
    birdImgsIndex++;
    birdImgsIndex %= birdImgs.length;
}
function placePipes() {
    if (gameOver) {
        document.getElementById("game-over").style.display = "block"; // Show Game Over screen
        return;
    }

    //(0-1) * pipeHeight/2.
    // 0 -> -128 (pipeHeight/4)
    // 1 -> -128 - 256 (pipeHeight/4 - pipeHeight/2) = -3/4 pipeHeight
    // Tạo vị trí ngẫu nhiên cho ống nước trên

    let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);
    let openingSpace = board.height / 4;
    /* 
          pipeY = 0 (ban đầu ống nước trên sẽ xuất hiện ở đỉnh màn hình).
          pipeHeight / 4 là khoảng lệch cơ bản để tránh ống quá cao.
          Math.random() * (pipeHeight / 2) tạo một giá trị ngẫu nhiên để làm cho ống nước không ở cùng một vị trí mỗi lần xuất hiện.
          openingSpace = board.height / 4 là khoảng trống giữa ống nước trên và dưới, giúp chim bay qua. 
         */
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
        img: bottomPipeImg, // Hình ảnh của ống nước dưới
        x: pipeX, // Vị trí xuất hiện theo trục X (bên phải màn hình)
        y: randomPipeY + pipeHeight + openingSpace, // Vị trí theo trục Y
        width: pipeWidth, // Chiều rộng ống nước
        height: pipeHeight, // Chiều cao ống nước
        passed: false, // Trạng thái đã đi qua hay chưa
    };
    pipeArray.push(bottomPipe); // Thêm vào mảng để vẽ trên màn hình
}

function moveBird(e) {
    if (
        e.type == "click" ||
        e.code == "Space" ||
        e.code == "ArrowUp" ||
        e.code == "KeyX"
    ) {
        //jump
        if(bmg.paused) {
            bmg.play();
        }
        wingSound.play()
        velocityY = -6;

        // Check if the game is over and handle "Play Again" logic
        if (gameOver) {
            setTimeout(() => {
                // Reset game state after 2 seconds
                bird.y = birdY;
                pipeArray = [];
                score = 0;
                gameOver = false;
                document.getElementById("game-over").style.display = "none"; // Hide "Game Over" screen
                hasFallenEffect  = false;
            }, 100); // Delay of 2 seconds
        }
    }
}

function detectCollision(a, b) {
    return (
        a.x < b.x + b.width && // Nếu góc trái trên của a nằm bên trái góc phải trên của b (a chưa đi qua hoàn toàn b)
        a.x + a.width > b.x && // Nếu góc phải trên của a nằm bên phải góc trái trên của b (a đã lấn vào b)
        a.y < b.y + b.height && // Nếu góc trái trên của a nằm bên trên góc trái dưới của b (a chưa rơi qua b)
        a.y + a.height > b.y
    ); // Nếu góc trái dưới của a nằm bên dưới góc trái trên của b (a đã lấn vào b)
}function addFallingEffect() {
    let numberOfObjects = Math.floor(Math.random() * 5) + 3; // Số lượng vật thể ngẫu nhiên từ 3 đến 7

    for (let i = 0; i < numberOfObjects; i++) {
        let obj = {
            x: Math.random() * boardWidth, // Vị trí ngẫu nhiên trên màn hình
            y: 0, // Vật thể bắt đầu từ trên cùng của màn hình
            size: Math.random() * 10 + 5, // Kích thước ngẫu nhiên
            speed: Math.random()  + 2, // Tốc độ rơi ngẫu nhiên
            color: getRandomColor(), // Màu sắc ngẫu nhiên
        };

        fallingObjects.push(obj); // Thêm vật thể vào mảng
    }
}

function getRandomColor() {
    // Hàm để tạo màu sắc ngẫu nhiên
    let letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}
