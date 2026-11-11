// 1. CẤU HÌNH
const CONFIG = {
    password: '1111',

    launchInterval: 800,   // ms giữa các lần bắn
    trailAlpha: 0.15,      // độ đậm lớp phủ đen (càng nhỏ vệt đuôi càng dài)
    numberStars: 150,      // số lượng sao ở nền

    rocket: {
        minSpeed: 8,
        speedRange: 6,
        gravity: 0.15,
        drift: 1.5,
    },

    particle: {
        gravity: 0.05,
        fade: 0.012,
        minLife: 80,
        lifeRange: 40,
    },

    // Hạt thuộc hình vẽ rơi chậm hơn để giữ form
    shapeGravity: 0.008,

    // Kích thước từng hình
    shapeScale: {
        heart: 0.2,
        star: 3.2,
        smiley: 2.8,
        saturn: 2.6,
    },
    // Vành đai sao Thổ lệch hue so với hành tinh (độ, trên vòng màu 0-360)
    saturnRingHue: {
        min: 30,
        max: 60,
    },
        // Dải hue cho pháo, bỏ vùng 220-280 (xanh dương/tím) vì trùng màu nền
    hueRanges: [
        [0, 70],     // đỏ, cam, vàng
        [90, 200],   // lục, xanh ngọc, cyan
        [290, 360],  // hồng, đỏ tím
    ],
};
// ===== Thời gian chuyển cảnh (giây) =====
const TRANSITION = {
    leave: 0.9,        // cảnh cũ trôi lên
    enterDelay: 0.25,  // cảnh mới đợi một chút rồi mới nổi lên
    enter: 1.1,        // cảnh mới nổi lên
    textGap: 0.3,      // nghỉ một nhịp rồi chữ mới hiện
};

// Đẩy các số này sang CSS để chỉ cần sửa ở một nơi
const rootStyle = document.documentElement.style;
rootStyle.setProperty("--leave-dur", `${TRANSITION.leave}s`);
rootStyle.setProperty("--enter-dur", `${TRANSITION.enter}s`);
rootStyle.setProperty("--enter-delay", `${TRANSITION.enterDelay}s`);
// ===== Hiệu ứng chuyển cảnh 2 =====
const CHAR_STEP = 0.06; // giây giữa hai chữ liên tiếp

function splitText(el) {
    if (el.dataset.split) return;
    el.dataset.split = "1";

    const text = el.textContent.normalize("NFC").trim();
    el.setAttribute("aria-label", text);
    el.textContent = "";

    let i = 0;
    text.split(/\s+/).forEach((word, w, arr) => {
        const wordEl = document.createElement("span");
        wordEl.className = "word";
        wordEl.setAttribute("aria-hidden", "true");

        for (const ch of word) {
            const c = document.createElement("span");
            c.className = "char";
            c.style.setProperty("--i", i++);
            c.textContent = ch;
            wordEl.appendChild(c);
        }
        el.appendChild(wordEl);
        if (w < arr.length - 1) el.appendChild(document.createTextNode(" "));
    });
    el.dataset.count = i;
}

let isTransitioning = false;

function nextScene() {
    if (isTransitioning) return; // chặn bấm ✓ hai lần liên tiếp

    const scenes = document.querySelectorAll(".scene");
    const current = document.querySelector(".scene.active");
    const nextIndex = Array.from(scenes).indexOf(current) + 1;
    if (!current || nextIndex >= scenes.length) return;

    const next = scenes[nextIndex];

    // Cảnh 1 -> 2: cái cũ trôi lên, cái mới nổi lên
    if (next.id === "scene2") {
        riseTransition(current, next);
        return;
    }

    // Các cảnh khác: đổi ngay, cảnh mới mờ hiện (như cũ)
    current.classList.remove("active");
    next.classList.add("active");
    if (next.id === "scene3") startBookScene();
}

function riseTransition(current, next) {
    isTransitioning = true;

    current.classList.add("leaving");
    next.classList.add("active", "entering");

    // Chữ bắt đầu sau khi thiệp nổi lên xong, cộng thêm một nhịp nghỉ
    const textStart = TRANSITION.enterDelay + TRANSITION.enter + TRANSITION.textGap;
    playGreeting(textStart);

    // Khi cảnh cũ trôi xong thì mới ẩn hẳn
    let done = false;
    const finish = () => {
        if (done) return;
        done = true;
        current.classList.remove("active", "leaving");
        isTransitioning = false;
    };
    current.addEventListener("animationend", e => {
        if (e.target === current && e.animationName === "sceneLeave") finish();
    });
    setTimeout(finish, (TRANSITION.leave + 0.3) * 1000); // phòng khi animationend không chạy
}

// Tách chữ một lần ngay khi tải trang, để chữ ẩn sẵn trong lúc thiệp nổi lên
function prepareGreeting() {
    document
        .querySelectorAll(".greet-line1, .greet-line2, .greet-date")
        .forEach(splitText);
}

function playGreeting(startAt = 0.5) {
    const card = document.querySelector(".greeting-card");
    const lines = card.querySelectorAll(".greet-line1, .greet-line2, .greet-date");

    card.classList.remove("reveal");
    card.style.setProperty("--step", `${CHAR_STEP}s`);

    // startAt: thời điểm dòng đầu tiên bắt đầu hiện, các dòng sau nối tiếp
    let t = startAt;
    lines.forEach(line => {
        line.style.setProperty("--base", `${t}s`);
        t += line.dataset.count * CHAR_STEP + 0.2;
    });
    card.style.setProperty("--end", `${t + 0.3}s`); // đường kẻ và nút hiện sau cùng

    void card.offsetWidth; // reset để chạy lại được nhiều lần
    card.classList.add("reveal");
}

prepareGreeting();

window.nextScene = nextScene;

let enteredPassword = '';

function pressKey(num) {
    if (enteredPassword.length < 4) {
        enteredPassword += num;
        updateDisplay();
        createBalloon(num);
    }
}
window.pressKey = pressKey;
function deleteKey() {
    enteredPassword = enteredPassword.slice(0, -1);
    updateDisplay();
}
window.deleteKey = deleteKey;
function updateDisplay() {
    const display = document.getElementById('passwordDisplay');
    display.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        if (i < enteredPassword.length) {
            display.innerHTML += '<span></span>';
        } else {
            display.innerHTML += '<span style="background: transparent; border: 2px solid #ffb3d9;"></span>';
        }
    }
}

function createBalloon(num) {
    const balloon = document.createElement('div');
    balloon.className = 'floating-balloon';
    balloon.textContent = ['🎈', '🎉', '💕', '✨', '🎊'][Math.floor(Math.random() * 5)];
    
    const rect = document.querySelector(`.keypad .key${num}`).getBoundingClientRect();
    balloon.style.left = (rect.left + rect.width / 2 - 20) + 'px';
    balloon.style.top = (rect.top + rect.height / 2 - 20) + 'px';
    
    document.body.appendChild(balloon);
    setTimeout(() => balloon.remove(), 4000);
}

function checkPassword() {
    const errorMsg = document.getElementById('errorMsg');
    
    if (enteredPassword === CONFIG.password) {
        errorMsg.style.display = 'none';
        nextScene();
    } else {
        errorMsg.style.display = 'block';
        enteredPassword = '';
        const box = document.querySelector(".password-box");
        box.classList.remove("shake");
        void box.offsetWidth;          // reset animation
        box.classList.add("shake");
        updateDisplay();
    }
}
updateDisplay();
window.checkPassword = checkPassword;

// Scene 2------------------------------------------------------------------------------------------------------------
let loveSent = false;

function receiveLove() {
    if (loveSent) return; // chặn bấm nhiều lần
    loveSent = true;

    const btn = document.querySelector(".btn-love");
    btn.classList.add("sent");

    // Tâm của nút
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    // Bắn vòng tim, hoa, sao tỏa ra mọi hướng
    const icons = ["💖", "💗", "💕", "✨", "🌸"];
    const count = 18;
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
        const dist = 90 + Math.random() * 130;

        const el = document.createElement("div");
        el.className = "love-burst";
        el.textContent = icons[Math.floor(Math.random() * icons.length)];
        el.style.left = cx + "px";
        el.style.top = cy + "px";
        el.style.setProperty("--dx", Math.cos(angle) * dist + "px");
        el.style.setProperty("--dy", Math.sin(angle) * dist + "px");
        el.style.setProperty("--s", 16 + Math.random() * 14 + "px");

        document.body.appendChild(el);
        el.addEventListener("animationend", () => el.remove());
    }

    // Để người xem kịp thấy vòng tim rồi mới chuyển cảnh
    setTimeout(nextScene, 1300);
}
window.receiveLove = receiveLove;

// Scene 3------------------------------------------------------------------------------------------------------------

const SHAPE_TYPES = ["heart", "star", "smiley", "saturn"];

// 2. CANVAS
const canvas = document.getElementById("fireworksCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();
function createStars(count = numberStars) {
    const container = document.createElement("div");
    container.id = "stars";
    document.body.prepend(container);

    for (let i = 0; i < count; i++) {
        const star = document.createElement("div");
        star.className = "star";

        const size = Math.random() < 0.85
            ? Math.random() * 1 + 1      // sao nhỏ 1-2px (đa số)
            : Math.random() * 1.5 + 2;   // sao lớn 2-3.5px (ít)

        star.style.cssText = `
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            width: ${size}px;
            height: ${size}px;
            --dur: ${2 + Math.random() * 4}s;
            --delay: ${-Math.random() * 5}s;
            --peak: ${0.5 + Math.random() * 0.5};
        `;

        // Sao lớn thêm vầng sáng nhẹ
        if (size > 2) star.style.boxShadow = "0 0 4px rgba(255,255,255,0.8)";

        container.appendChild(star);
    }
}

createStars(150);

function spawnShootingStar() {
    const el = document.createElement("div");
    el.className = "shooting-star";

    const len = 80 + Math.random() * 100;           // độ dài vạch sáng
    const angle = 20 + Math.random() * 20;          // 20-40° (bay chéo xuống phải)
    const dur = 0.8 + Math.random() * 0.8;          // 0.8-1.6 giây
    const dist = 400 + Math.random() * 400;         // quãng bay

    el.style.cssText = `
        left: ${Math.random() * 70}%;
        top: ${Math.random() * 40}%;
        --len: ${len}px;
        --angle: ${angle}deg;
        --dur: ${dur}s;
        --dist: ${dist}px;
    `;

    document.body.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
}

function scheduleShootingStar() {
    // Mỗi 3-7 giây một sao băng
    setTimeout(() => {
        spawnShootingStar();
        scheduleShootingStar();
    }, 3000 + Math.random() * 4000);
}

scheduleShootingStar();


// 3. TRẠNG THÁI
const rockets = [];
const particles = [];

// 4. CÁC LỚP
class Rocket {
    constructor(x, color, type) {
        this.x = x;
        this.y = canvas.height;
        this.color = color;
        this.type = type;
        this.speed = -(Math.random() * CONFIG.rocket.speedRange + CONFIG.rocket.minSpeed);
        this.vx = (Math.random() - 0.5) * CONFIG.rocket.drift;
    }

    update() {
        this.y += this.speed;
        this.x += this.vx;
        this.speed += CONFIG.rocket.gravity;

        // Lên tới đỉnh thì nổ
        if (this.speed >= 0) {
            createExplosion(this.x, this.y, this.color, this.type);
            return false;
        }
        return true;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${this.color}, 100%, 70%)`;
        ctx.fill();
    }
}

class Particle {
    constructor(x, y, color, vx, vy, type) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.type = type;
        this.alpha = 1;
        this.size = Math.random() * 2 + 1;
        this.life = CONFIG.particle.minLife + Math.random() * CONFIG.particle.lifeRange;
        this.gravity = SHAPE_TYPES.includes(type)
            ? CONFIG.shapeGravity
            : CONFIG.particle.gravity;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.alpha -= CONFIG.particle.fade;
        this.life--;

        if (this.type === "colorShift") {
            this.color = (this.color + 2) % 360; // đổi màu liên tục
        }
        return this.life > 0 && this.alpha > 0;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${this.color}, 100%, 60%, ${this.alpha})`;
        ctx.fill();
    }
}

// 5. HÀM TẠO ĐIỂM CHO CÁC HÌNH (trả về danh sách {x, y})
function circlePoints(cx, cy, r, count) {
    const pts = [];
    for (let i = 0; i < count; i++) {
        const a = (Math.PI * 2 * i) / count;
        pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
    return pts;
}

function heartPoints(count = 120) {
    const pts = [];
    for (let i = 0; i < count; i++) {
        const t = (Math.PI * 2 * i) / count;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy =
            13 * Math.cos(t) -
            5 * Math.cos(2 * t) -
            2 * Math.cos(3 * t) -
            Math.cos(4 * t);
        pts.push({ x: hx, y: -hy }); // đảo dấu vì trục y của canvas hướng xuống
    }
    return pts;
}

function starPoints(R = 1, r = 0.42, perEdge = 12) {
    const verts = [];
    for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5; // mũi sao hướng lên
        const rad = i % 2 === 0 ? R : r;
        verts.push({ x: Math.cos(a) * rad, y: Math.sin(a) * rad });
    }

    const pts = [];
    for (let i = 0; i < verts.length; i++) {
        const A = verts[i];
        const B = verts[(i + 1) % verts.length];
        for (let j = 0; j < perEdge; j++) {
            const t = j / perEdge;
            pts.push({
                x: A.x + (B.x - A.x) * t,
                y: A.y + (B.y - A.y) * t,
            });
        }
    }
    return pts;
}

function smileyPoints() {
    // Viền mặt + hai mắt
    let pts = [
        ...circlePoints(0, 0, 1, 50),
        ...circlePoints(-0.35, -0.3, 0.08, 6),
        ...circlePoints(0.35, -0.3, 0.08, 6),
    ];

    // Miệng: cung tròn từ 20° đến 160°
    const start = (20 * Math.PI) / 180;
    const end = (160 * Math.PI) / 180;
    const mouthCount = 20;
    for (let i = 0; i <= mouthCount; i++) {
        const a = start + ((end - start) * i) / mouthCount;
        pts.push({
            x: Math.cos(a) * 0.6,
            y: Math.sin(a) * 0.6 - 0.05,
        });
    }
    return pts;
}

function saturnPoints() {
    // Hành tinh: 3 vòng đồng tâm
    const pts = [
        ...circlePoints(0, 0, 0.6, 30),
        ...circlePoints(0, 0, 0.4, 20),
        ...circlePoints(0, 0, 0.2, 10),
    ];
    // Độ lệch màu của vành đai, random mỗi lần nổ
    const { min, max } = CONFIG.saturnRingHue;
    const ringShift = min + Math.random() * (max - min);

    // Vành đai: elip 1.7 x 0.4 xoay nghiêng -20°
    const tilt = (-20 * Math.PI) / 180;
    const cos = Math.cos(tilt);
    const sin = Math.sin(tilt);
    const ringCount = 60;
    for (let i = 0; i < ringCount; i++) {
        const t = (Math.PI * 2 * i) / ringCount;
        const ex = Math.cos(t) * 1.7;
        const ey = Math.sin(t) * 0.4;
        pts.push({
            x: ex * cos - ey * sin,
            y: ex * sin + ey * cos,
            hueShift: ringShift
        });
    }
    return pts;
}

// 6. HIỆU ỨNG NỔ

// Nổ tỏa tròn (dùng cho "normal" và "colorShift")
function spawnBurst(x, y, color, type) {
    const count = 60 + Math.random() * 40;
    for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count;
        const speed = Math.random() * 4 + 2;
        particles.push(new Particle(
            x, y, color,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            type
        ));
    }
}

// Nổ theo hình: mỗi điểm thành một hạt bay theo hướng của điểm đó
function spawnShape(x, y, color, points, scale, type) {
    for (const p of points) {
        const hue = (color + (p.hueShift || 0)) % 360;
        particles.push(new Particle(x, y, hue, p.x * scale, p.y * scale, type));
    }
}

// Bảng tra: loại pháo -> hàm nổ
const EXPLOSIONS = {
    normal:     (x, y, color) => spawnBurst(x, y, color, "normal"),
    colorShift: (x, y, color) => spawnBurst(x, y, color, "colorShift"),
    heart:      (x, y, color) => spawnShape(x, y, color, heartPoints(),  CONFIG.shapeScale.heart,  "heart"),
    star:       (x, y, color) => spawnShape(x, y, color, starPoints(),   CONFIG.shapeScale.star,   "star"),
    smiley:     (x, y, color) => spawnShape(x, y, color, smileyPoints(), CONFIG.shapeScale.smiley, "smiley"),
    saturn:     (x, y, color) => spawnShape(x, y, color, saturnPoints(), CONFIG.shapeScale.saturn, "saturn"),
};

function createExplosion(x, y, color, type) {
    const explode = EXPLOSIONS[type] || EXPLOSIONS.normal;
    explode(x, y, color);
}

// 7. BẮN PHÁO
function randomHue() {
    const [min, max] = CONFIG.hueRanges[
        Math.floor(Math.random() * CONFIG.hueRanges.length)
    ];
    return min + Math.random() * (max - min);
}

function launchRocket() {
    const types = Object.keys(EXPLOSIONS);
    const type = types[Math.floor(Math.random() * types.length)];
    const x = Math.random() * canvas.width * 0.8 + canvas.width * 0.1;
    const color = randomHue();

    rockets.push(new Rocket(x, color, type));
}

// 8. VÒNG LẶP CHÍNH
function updateAndDraw(list) {
    for (let i = list.length - 1; i >= 0; i--) {
        if (!list[i].update()) list.splice(i, 1);
        else list[i].draw();
    }
}

function loop() {
    // Làm mờ nét cũ thay vì phủ đen => canvas trong suốt, thấy được nền CSS
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = `rgba(0, 0, 0, ${CONFIG.trailAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-over";

    updateAndDraw(rockets);
    updateAndDraw(particles);

    requestAnimationFrame(loop);
}

let launchTimer = null;

function startFireworks(volley = true) {
    if (launchTimer) return;
    if (volley) for (let i = 0; i < 4; i++) setTimeout(launchRocket, i * 350); // loạt pháo chào
    launchTimer = setInterval(launchRocket, CONFIG.launchInterval);
}

function stopFireworks() {
    clearInterval(launchTimer);
    launchTimer = null;
}

// Chuyển tab thì dừng bắn, tránh dồn pháo rồi nổ hàng loạt khi quay lại
document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopFireworks();
    else if (document.getElementById("scene3").classList.contains("active")) startFireworks(false);
});
// ===== Cảnh 3: cuốn sách và bức thư =====
const BOOK = {
    lie: 1.1,      // sách ngả ra và nằm xuống bàn
    open: 1.6,     // bìa mở ra
    glowAt: 0.9,   // hào quang bắt đầu, tính từ lúc bìa bắt đầu mở
    letterAt: 1.5, // thư hiện, tính từ lúc bìa bắt đầu mở
};

let bookOpened = false;

function startBookScene() {
    const stage = document.getElementById("bookStage");
    stage.classList.remove("lying", "open", "glow", "show-letter");
    stage.style.setProperty("--lie-dur", `${BOOK.lie}s`);
    stage.style.setProperty("--open-dur", `${BOOK.open}s`);
    bookOpened = false;
    if (typeof setFlowerMode === "function") setFlowerMode("calm");   // cảnh 3: hoa ít đi, nhường pháo hoa
    startFireworks();
}

function openBook() {
    if (bookOpened || turning) return;
    bookOpened = true;
    page = 0;
    renderPage();

    const stage = document.getElementById("bookStage");
    const ms = s => s * 1000;
    const openAt = stage.classList.contains("lying") ? 0 : ms(BOOK.lie) - 100;

    stage.classList.remove("closed", "rise-in");
    stage.classList.add("lying");
    setTimeout(() => stage.classList.add("open"), openAt);

    setTimeout(() => {
        stage.classList.add("glow");
        spawnMotes();
        for (let i = 0; i < 3; i++) setTimeout(launchRocket, i * 300);
    }, openAt + ms(BOOK.glowAt));

    setTimeout(() => stage.classList.add("show-letter"), openAt + ms(BOOK.letterAt));
    setTimeout(() => stage.classList.add("show-nav"),    openAt + ms(BOOK.letterAt) + 1500);
}
window.openBook = openBook;
// ===== Các trang: trang 0 là bức thư, các trang sau là khung ảnh =====
const PHOTOS = [
    { src: "images/anh1.jpg", caption: "Kỷ niệm 1" },
    { src: "images/anh2.jpg", caption: "Kỷ niệm 2" },
    { src: "images/anh3.jpg", caption: "Kỷ niệm 3" },
    { src: "images/anh4.jpg", caption: "Kỷ niệm 4" },
    { src: "images/anh5.jpg", caption: "Kỷ niệm 5" },
    { src: "images/anh6.jpg", caption: "Kỷ niệm 6" },
];
PHOTOS.forEach(p => { if (p.src) new Image().src = p.src; });

const FLIP = {
    dur: 1.1,     // trang giấy lật (nội dung bị quét mất trong cùng khoảng này)
    after: 1.0,   // sau khi hiệu ứng trang mới bắt đầu, còn khoá nút thêm bấy lâu
};
const stageEl = document.getElementById("bookStage");
stageEl.style.setProperty("--flip-dur", `${FLIP.dur}s`);

let page = 0;
let turning = false;
let backShut = false;      // sách đang gập về mặt sau
const lastPage = () => PHOTOS.length;

function renderPage() {
    stageEl.classList.toggle("page-letter", page === 0);
    stageEl.classList.toggle("page-photo",  page > 0);

    document.getElementById("navPrev").title = page === 0 ? "Đóng sách" : "Trang trước";
    const navNext = document.getElementById("navNext");
    navNext.title = page === lastPage() ? "Đến trang kết" : "Trang sau";
    navNext.textContent = page === lastPage() ? "✦" : "›";   // trang ảnh cuối: nút tới là ✦
    if (page === 0) return;

    const p = PHOTOS[page - 1];
    const frame = document.getElementById("photoFrame");
    const img = document.getElementById("photoImg");
    document.getElementById("photoNum").textContent = `Ảnh ${page}`;
    document.getElementById("photoCaption").textContent = p.caption || "";

    frame.classList.remove("has-img");
    if (p.src) {
    img.onload = () => {
        frame.style.setProperty("--ar", img.naturalWidth / img.naturalHeight);   // khung theo tỉ lệ ảnh
        frame.classList.add("has-img");
    };
    img.onerror = () => {
        frame.classList.remove("has-img");
        frame.style.removeProperty("--ar");
    };
    img.src = p.src;
    } else {
        img.removeAttribute("src");
        frame.style.removeProperty("--ar");
    }
}
function playIntro() {
    stageEl.classList.remove("show-letter", "show-photo");
    stageEl.classList.add("rise-in");
    void stageEl.offsetWidth;                    
    stageEl.classList.add("glow", page === 0 ? "show-letter" : "show-photo");
}

function turnPage(dir) {                            // dir: 1 = tới, -1 = lui
    if (backShut) { if (dir < 0) reopenBack(); return; }
    if (turning || !bookOpened) return;
    const next = page + dir;
    if (next < 0) { closeBook(); return; }
    if (next > lastPage()) { startFinale(); return; }   // sau ảnh cuối: các trang bay ra, sang trang kết

    turning = true;
    const leaf = document.querySelector(".pages-f");
    const wipe = dir > 0 ? "wipe-next" : "wipe-prev";
    stageEl.style.setProperty("--wipe-dur", `${FLIP.dur}s`);
    stageEl.classList.add("busy", wipe);
    leaf.className = `pages pages-r pages-f on ${dir > 0 ? "flip-next" : "flip-prev"}`;

    // trang lật xong: nội dung cũ đã bị quét hết -> đổi trang rồi chạy lại hiệu ứng như trang đầu
    setTimeout(() => {
        stageEl.classList.remove("show-letter", "show-photo", wipe);
        leaf.className = "pages pages-r pages-f";
        page = next;
        renderPage();
        playIntro();
    }, FLIP.dur * 1000);

    setTimeout(() => {
        stageEl.classList.remove("busy");
        turning = false;
    }, (FLIP.dur + FLIP.after) * 1000);
}
window.turnPage = turnPage;

function closeBook() {
    if (turning) return;
    turning = true;
    const front = page === 0;                       // trang đầu: gập về bìa trước, trang cuối: gập về bìa sau

    stageEl.style.setProperty("--wipe-dur", `${BOOK.open}s`);
    stageEl.classList.remove("show-nav", "open");   // bỏ "open" để bìa và các trang cùng gập
    stageEl.classList.add("busy", front ? "wipe-prev" : "wipe-next");
    if (!front) stageEl.classList.add("shut-back");

    setTimeout(() => {
        document.querySelectorAll(".mote").forEach(m => m.remove());
        stageEl.classList.remove("glow", "show-letter", "show-photo", "wipe-prev", "wipe-next", "busy", 'rise-in');
        if (front) {
            bookOpened = false;
            page = 0;
            renderPage();
            stageEl.classList.add("closed");        // hiện lại nút "Mở sách"
        } else {
            backShut = true;
            stageEl.classList.add("show-reopen");   // hiện nút mũi tên mở lại
        }
        turning = false;
    }, BOOK.open * 1000);
}
function reopenBack() {
    if (turning) return;
    turning = true;
    backShut = false;
    stageEl.classList.remove("show-reopen", "shut-back");
    stageEl.classList.add("open", "busy");
    page = lastPage();
    renderPage();

    // sách mở gần xong thì hologram + khung ảnh cuối hiện lại như trang đầu tiên
    setTimeout(() => { spawnMotes(); playIntro(); }, BOOK.open * 1000 * 0.75);
    setTimeout(() => {
        stageEl.classList.remove("busy");
        stageEl.classList.add("show-nav");
        turning = false;
    }, BOOK.open * 1000 + 600);
}

// Các hạt sáng bay lên từ cuốn sách về phía bức thư
function spawnMotes(count = 18) {
    const area = document.querySelector(".book-area");
    if (area.querySelector(".mote")) return;

    for (let i = 0; i < count; i++) {
        const m = document.createElement("span");
        m.className = "mote";
        m.style.cssText = `
            left: ${34 + Math.random() * 32}%;
            --dx: ${(Math.random() - 0.5) * 70}px;
            --rise: ${110 + Math.random() * 150}px;
            --size: ${2 + Math.random() * 3}px;
            animation-duration: ${3 + Math.random() * 3}s;
            animation-delay: ${Math.random() * 4}s;
        `;
        area.appendChild(m);
    }
}
loop();

// ===== Trang giấy cong =====
const PAGE = {
    strips: 12,   // số dải mỗi trang (nhiều hơn thì cong mượt hơn, nặng hơn)
    rise: 28,     // độ dốc ngay tại rãnh giữa (độ), càng lớn trang càng vồng
    step: 5,      // mỗi dải kế tiếp bớt dốc bao nhiêu độ
};

const PAGE_TEXT = {
    left:  "",
    right: "",
};

// Hình dạng đường cong của trang (đơn vị: tỉ lệ so với bề rộng trang)
function pageProfile() {
    const N = PAGE.strips, w = 1 / N;
    const pts = [{ x: 0, z: 0 }];
    for (let i = 0; i < N; i++) {
        const phi = ((PAGE.rise - PAGE.step * i) * Math.PI) / 180;
        const p = pts[i];
        pts.push({ x: p.x + w * Math.cos(phi), z: p.z + w * Math.sin(phi) });
    }
    return pts;
}

// Mép giấy ở cạnh gần: một tấm cắt theo đúng đường cong của trang
function buildSkirt(side) {
    const pts = pageProfile();
    const N = PAGE.strips;
    const m = Math.max(...pts.map(p => p.z)) + 0.03;
    const U = v => `calc(var(--pw) * ${v.toFixed(4)})`;
    const X = x => (side === "right" ? U(x) : U(1 - x));

    const bottom  = `calc(var(--pw) * ${m.toFixed(4)} + var(--bt) * 0.5 - 1px)`;
    const flatTop = `calc(var(--pw) * ${m.toFixed(4)} - var(--bt) * 0.5 + 1px)`;

    const openTop   = pts.map(p => `${X(p.x)} ${U(m - p.z)}`);
    const closedTop = pts.map((p, k) => `${X(k / N)} ${flatTop}`);
    const openBase   = [`${X(pts[N].x)} ${bottom}`, `${X(0)} ${bottom}`];
    const closedBase = [`${X(1)} ${bottom}`, `${X(0)} ${bottom}`];

    const el = document.createElement("div");
    el.className = "skirt";
    el.style.setProperty("--m", m.toFixed(4));
    el.style.setProperty("--poly-open",   `polygon(${[...openTop, ...openBase].join(",")})`);
    el.style.setProperty("--poly-closed", `polygon(${[...closedTop, ...closedBase].join(",")})`);
    return el;
}

function buildCurvedPage(side, html) {
    const right = side === "right";
    const sign = right ? -1 : 1;  // phải xoay ngược chiều nhau ở hai nửa

    const root = document.createElement("div");
    root.className = `pages ${right ? "pages-r" : "pages-l"}`;
    root.style.setProperty("--n", PAGE.strips);
    root.setAttribute("aria-hidden", "true");

    // độ đậm bóng: đậm ở rãnh giữa, nhạt dần ra phía ngoài
    const shade = i => Math.max(0, 1 - i / 6) * 0.3;

    let parent = root;
    for (let i = 0; i < PAGE.strips; i++) {
        const strip = document.createElement("div");
        strip.className = "strip";
        strip.style.setProperty("--i", i);
        strip.style.setProperty("--a", `${i === 0 ? sign * PAGE.rise : -sign * PAGE.step}deg`);
        strip.style.setProperty("--s1", shade(i).toFixed(3));
        strip.style.setProperty("--s2", shade(i + 1).toFixed(3));

        const face = document.createElement("div");
        face.className = "strip-face";

        const content = document.createElement("div");
        content.className = "strip-content";
        content.innerHTML = `<div class="page-art">${html ? `<p>${html}</p>` : ""}</div>`;
        face.appendChild(content);

        strip.appendChild(face);
        parent.appendChild(strip);
        parent = strip;
    }
    parent.classList.add("last"); // dải ngoài cùng: bo tròn góc

    root.appendChild(buildSkirt(side));
    return root;
}

function buildBookPages() {
    const book = document.querySelector(".book");
    if (!book || book.querySelector(".pages")) return;

    const half = document.createElement("div");     // nửa phải của sách
    half.className = "half-r";
    half.appendChild(book.querySelector(".b-back"));
    half.appendChild(buildCurvedPage("right", PAGE_TEXT.right));
    half.appendChild(buildLeaf());
    book.insertBefore(half, book.firstChild);

    book.appendChild(buildCurvedPage("left", PAGE_TEXT.left));
}
buildBookPages();
function buildLeaf() {
    const leaf = buildCurvedPage("right", "");
    leaf.classList.add("pages-f");
    leaf.style.setProperty("--rise", PAGE.rise + "deg");
    leaf.style.setProperty("--step", PAGE.step + "deg");
    leaf.querySelector(".skirt").remove();               // trang đang bay không cần mép dày
    return leaf;
}

// ===== Phóng to ảnh: nhấn vào ảnh để xem lớn, nhấn ra ngoài để thu nhỏ lại =====
const ZOOM = {
    dur: 480,        // ms phóng to / thu nhỏ
    margin: 20,      // chừa mép màn hình (px)
    maxWidth: 1400,  // khung ảnh phóng to tối đa (px)
};

let zoomLb = null;
let zoomBusy = false;

function openPhotoZoom() {
    if (zoomLb || zoomBusy || turning || !bookOpened || page === 0) return;

    const card = document.getElementById("photoCard");
    const frame = document.getElementById("photoFrame");
    const from = card.getBoundingClientRect();

    // Bản sao của khung ảnh + chú thích
    const lb = document.createElement("div");
    lb.className = "photo-zoom";
    const box = document.createElement("div");
    box.className = "photo-zoom-card";

    const f = frame.cloneNode(true);
    f.querySelectorAll("[id]").forEach(e => e.removeAttribute("id"));
    f.removeAttribute("id");
    const ar = parseFloat(frame.style.getPropertyValue("--ar")) || 4 / 3;
    f.style.setProperty("--ar", ar);

    const cap = document.createElement("div");
    cap.className = "photo-zoom-caption";
    cap.textContent = document.getElementById("photoCaption").textContent;

    box.append(f, cap);
    lb.appendChild(box);

    // Tính kích thước khung ảnh sao cho vừa màn hình
    const padX = 36, padY = 30 + 52;          // padding của thẻ + chỗ cho chú thích
    const maxW = Math.min(ZOOM.maxWidth, window.innerWidth - ZOOM.margin * 2 - padX);
    const maxH = window.innerHeight - ZOOM.margin * 2 - padY;
    f.style.setProperty("--zw", Math.max(120, Math.min(maxW, maxH * ar)) + "px");

    document.body.appendChild(lb);
    zoomLb = lb;
    zoomBusy = true;
    card.style.visibility = "hidden";         // ẩn thẻ gốc, thẻ phóng to thay vào chỗ đó

    // FLIP: từ vị trí/kích thước thẻ gốc -> giữa màn hình
    const to = box.getBoundingClientRect();
    const scale = from.width / to.width;
    const dx = (from.left + from.width / 2) - (to.left + to.width / 2);
    const dy = (from.top + from.height / 2) - (to.top + to.height / 2);
    const ease = "cubic-bezier(0.2, 0.8, 0.2, 1)";

    lb.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ZOOM.dur, easing: "ease", fill: "both" });
    box.animate(
        [{ transform: `translate(${dx}px, ${dy}px) scale(${scale})` }, { transform: "none" }],
        { duration: ZOOM.dur, easing: ease, fill: "both" }
    ).onfinish = () => { zoomBusy = false; };

    lb.addEventListener("click", e => {
        if (!box.contains(e.target)) closePhotoZoom();
    });
}

function closePhotoZoom(instant = false) {
    if (!zoomLb || (zoomBusy && !instant)) return;
    const lb = zoomLb;
    const box = lb.querySelector(".photo-zoom-card");
    const card = document.getElementById("photoCard");

    const finish = () => {
        lb.remove();
        card.style.visibility = "";
        zoomLb = null;
        zoomBusy = false;
    };
    if (instant) { finish(); return; }

    zoomBusy = true;
    const from = card.getBoundingClientRect();   // lấy lại vị trí hiện tại của thẻ gốc (nó đang bồng bềnh)
    const to = box.getBoundingClientRect();
    const scale = from.width / to.width;
    const dx = (from.left + from.width / 2) - (to.left + to.width / 2);
    const dy = (from.top + from.height / 2) - (to.top + to.height / 2);

    lb.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ZOOM.dur, easing: "ease", fill: "both" });
    box.animate(
        [{ transform: "none" }, { transform: `translate(${dx}px, ${dy}px) scale(${scale})` }],
        { duration: ZOOM.dur, easing: "cubic-bezier(0.5, 0, 0.8, 0.4)", fill: "both" }
    ).onfinish = finish;
}

document.getElementById("photoFrame").addEventListener("click", openPhotoZoom);
document.addEventListener("keydown", e => { if (e.key === "Escape") closePhotoZoom(); });
window.addEventListener("resize", () => closePhotoZoom(true));

// ===== Thư: chữ hiện dần từng ký tự =====
const LETTER_TYPE = {
    start: 1.3,       // giây, tính từ lúc thư bắt đầu hiện
    step: 0.026,      // giây giữa hai ký tự (tăng lên thì chữ hiện chậm hơn)
    linePause: 0.3,   // nghỉ thêm sau mỗi đoạn
};

function splitLetterNode(node, state) {
    [...node.childNodes].forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
            const frag = document.createDocumentFragment();
            child.textContent.normalize("NFC").split(/(\s+)/).forEach(part => {
                if (!part) return;
                if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
                const word = document.createElement("span");
                word.className = "l-word";
                for (const ch of part) {
                    const c = document.createElement("span");
                    c.className = "l-char";
                    c.style.setProperty("--d", `${(LETTER_TYPE.start + state.t).toFixed(3)}s`);
                    c.textContent = ch;
                    word.appendChild(c);
                    state.t += LETTER_TYPE.step;
                }
                frag.appendChild(word);
            });
            child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== "BR") {
            splitLetterNode(child, state);
        }
    });
}

function prepareLetter() {
    const state = { t: 0 };
    document.querySelectorAll(".letter .l-line").forEach(line => {
        if (line.dataset.typed) return;
        line.dataset.typed = "1";
        splitLetterNode(line, state);
        if (line.classList.contains("l-title")) {
            line.style.setProperty("--orn-at", `${(LETTER_TYPE.start + state.t).toFixed(2)}s`);
        }
        state.t += LETTER_TYPE.linePause;
    });
    // dấu ♥ đóng triện hiện sau khi chữ cuối đã hiện xong
    const card = document.querySelector(".letter-card");
    if (card) card.style.setProperty("--seal-at", `${(LETTER_TYPE.start + state.t + 0.2).toFixed(2)}s`);
}
prepareLetter();
// ===== Nhắc xoay ngang màn hình =====
// Chỉ hiện ở màn hình mật khẩu (cảnh 1), trên thiết bị cảm ứng đang ở chế độ dọc.
// Xoay ngang thì modal tự tắt; xoay lại dọc khi vẫn ở cảnh 1 thì modal hiện lại.
(function () {
    const ROTATE = {
        onlyFirstScene: true,   // true: chỉ nhắc ở cảnh mật khẩu; false: nhắc ở mọi cảnh
        allowSkip: true,        // true: có nút "Vẫn xem ở chế độ dọc" (phòng khi máy đang khóa xoay)
    };

    const portraitQuery = window.matchMedia("(orientation: portrait) and (pointer: coarse)");
    const scene1 = document.getElementById("scene1");
    let dismissed = false;

    const modal = document.createElement("div");
    modal.className = "rotate-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "rotateTitle");
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
        <div class="rotate-card">
            <div class="rotate-phone" aria-hidden="true"><span>🎓</span></div>
            <h2 id="rotateTitle">Xoay ngang màn hình nhé</h2>
            <p>Trang này đẹp nhất khi xem ở chế độ ngang. Bạn hãy xoay điện thoại rồi cùng xem tiếp nha 💕</p>
            ${ROTATE.allowSkip ? '<button type="button" class="rotate-skip">Vẫn xem ở chế độ dọc</button>' : ""}
        </div>`;
    document.body.appendChild(modal);

    const skip = modal.querySelector(".rotate-skip");
    if (skip) skip.addEventListener("click", () => { dismissed = true; update(); });

    function inScope() {
        return !ROTATE.onlyFirstScene || scene1.classList.contains("active");
    }

    function update() {
        const open = !dismissed && inScope() && portraitQuery.matches;
        modal.classList.toggle("is-open", open);
        modal.setAttribute("aria-hidden", open ? "false" : "true");
        scene1.inert = open;   // chặn bấm bàn phím / Tab vào phía sau modal
    }

    if (portraitQuery.addEventListener) portraitQuery.addEventListener("change", update);
    else portraitQuery.addListener(update);                // Safari cũ
    window.addEventListener("orientationchange", update);
    new MutationObserver(update).observe(scene1, { attributes: true, attributeFilter: ["class"] });

    update();
})();
// Nhấn vào thân sách (không phải nút) khi sách đang nằm đóng -> sách nổi lên như lúc đầu cảnh 3
document.querySelector(".cover-front").addEventListener("click", e => {
    if (e.target.closest(".cover-btn")) return;                 // nút "Mở sách" vẫn làm việc riêng
    if (!stageEl.classList.contains("lying")) return;
    if (bookOpened || turning || backShut) return;              // đang mở / đang lật / đang gập mặt sau thì bỏ qua
    stageEl.classList.remove("lying");
});
// ===== Nhạc nền =====
// Trình duyệt chặn tự phát nhạc khi người dùng chưa chạm vào trang, nên:
//  1. Thử phát ngay khi tải trang (có thể được nếu trình duyệt cho phép).
//  2. Nếu bị chặn, nhạc sẽ tự phát ở lần chạm / bấm đầu tiên (thường là lúc bấm phím nhập mật khẩu).
(function () {
    const MUSIC = {
        src: "music.m4a",   // đường dẫn file nhạc (đặt file vào thư mục music/)
        volume: 0.6,             // 0 - 1
        fadeIn: 2000,            // ms nhạc to dần khi bắt đầu
        fadeOut: 600,            // ms nhạc nhỏ dần khi tắt
    };

    const audio = new Audio(MUSIC.src);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;

    // Nút bật/tắt nhạc (góc trên bên phải, hiện ở mọi cảnh)
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "music-toggle";
    document.body.appendChild(btn);

    let fadeTimer = null;
    let userPaused = false;     // người xem chủ động tắt nhạc
    let resumeAfterHide = false;

    function render() {
        const on = !audio.paused;
        btn.textContent = on ? "🔊" : "🔇";
        btn.classList.toggle("is-on", on);
        btn.setAttribute("aria-pressed", String(on));
        btn.setAttribute("aria-label", on ? "Tắt nhạc" : "Bật nhạc");
        btn.title = on ? "Tắt nhạc" : "Bật nhạc";
    }

    function fadeTo(target, ms, done) {
        clearInterval(fadeTimer);
        const from = audio.volume;
        const t0 = performance.now();
        fadeTimer = setInterval(() => {
            const k = Math.min(1, (performance.now() - t0) / ms);
            audio.volume = from + (target - from) * k;
            if (k >= 1) { clearInterval(fadeTimer); if (done) done(); }
        }, 40);
    }

    function play() {
        return audio.play().then(() => {
            fadeTo(MUSIC.volume, MUSIC.fadeIn);
            removeGestureListeners();
            render();
        }).catch(() => { /* chưa được phép phát, chờ lần chạm đầu tiên */ });
    }

    function pause() {
        fadeTo(0, MUSIC.fadeOut, () => { audio.pause(); render(); });
    }

    // Lần chạm đầu tiên ở bất kỳ đâu (trừ nút nhạc) sẽ khởi động nhạc
    const GESTURES = ["click", "touchend", "keydown"];
    function onGesture(e) {
        if (userPaused || btn.contains(e.target)) return;
        play();
    }
    function removeGestureListeners() {
        GESTURES.forEach(g => document.removeEventListener(g, onGesture, true));
    }
    GESTURES.forEach(g => document.addEventListener(g, onGesture, true));

    btn.addEventListener("click", () => {
        if (audio.paused) { userPaused = false; play(); }
        else { userPaused = true; pause(); }
    });

    // Chuyển tab / khóa màn hình thì tạm dừng, quay lại thì phát tiếp
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            resumeAfterHide = !audio.paused;
            if (resumeAfterHide) { clearInterval(fadeTimer); audio.pause(); render(); }
        } else if (resumeAfterHide && !userPaused) {
            resumeAfterHide = false;
            audio.play().then(() => fadeTo(MUSIC.volume, 800)).catch(() => {});
            render();
        }
    });

    // Không tìm thấy file nhạc thì ẩn nút, không báo lỗi ra màn hình
    audio.addEventListener("error", () => {
        console.warn("Không tải được file nhạc:", MUSIC.src);
        btn.hidden = true;
        removeGestureListeners();
    });

    render();
    play();   // thử phát ngay khi tải trang
})();

// ===== Trang kết: các trang bay ra, gấp thành thuyền giấy và cập bến =====
const FIN = {
    // Mốc thời gian (giây, tính từ lúc bấm ✦)
    sheetsAt: 0.5,       // các tờ giấy bay ra khỏi sách
    bookOutAt: 1.6,      // sách mờ dần, lặn xuống đáy
    seaAt: 2.4,          // biển dâng lên
    assembleAt: 3.4,     // thuyền được gấp lại
    sailAt: 5.0,         // thuyền bắt đầu chạy, câu chúc 1 hiện
    line2At: 8.4,        // câu 2 + hải đăng bừng sáng
    line3At: 10.6,       // câu 3
    travel: 9,           // thuyền chạy mất bao lâu (giây)
    endAt: 15.6,         // hiện chữ ký + nút "Xem lại từ đầu"

    sheets: 8,           // số tờ giấy
    sheetStagger: 0.09,  // lệch nhau giữa các tờ
    sheetScatter: 1.4,   // bay tản ra
    sheetGather: 1.5,    // bay tụ về thuyền
};
FIN.arriveAt = FIN.sailAt + FIN.travel;   // thuyền cập bến -> pháo hoa nổ

const finaleEl = document.getElementById("finale");
const finBoat = document.getElementById("finBoat");
const finIsland = finaleEl.querySelector(".fin-island");
const finReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
finaleEl.style.setProperty("--fin-travel", `${FIN.travel}s`);

const F = { on: false, final: false, celebrated: false, restarting: false, timers: [], celebTimers: [], anims: [] };

function finAt(sec, fn) { F.timers.push(setTimeout(fn, sec * 1000)); }
function finCelebAt(sec, fn) { F.celebTimers.push(setTimeout(fn, sec * 1000)); }   // pháo hoa ăn mừng chạy tiếp cả khi vào trạng thái cuối
const finRand = (a, b) => a + Math.random() * (b - a);

// Tách câu chúc thành từng ký tự để hiện dần
function splitFinaleLine(el) {
    const text = el.textContent.normalize("NFC");
    el.textContent = "";
    let i = 0;
    text.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(" ")); return; }
        const word = document.createElement("span");
        word.className = "f-word";
        for (const ch of part) {
            const c = document.createElement("span");
            c.className = "f-char";
            c.style.setProperty("--i", i++);
            c.textContent = ch;
            word.appendChild(c);
        }
        el.appendChild(word);
    });
}
finaleEl.querySelectorAll(".fin-line").forEach(splitFinaleLine);

// Điểm xuất phát / đích của thuyền (px), tính theo kích thước màn hình hiện tại
function layoutFinale() {
    const W = window.innerWidth;
    const x0 = Math.max(10, W * 0.07);
    const x1 = finIsland.offsetLeft - finBoat.offsetWidth - W * 0.015;   // dừng sát bờ đảo
    finaleEl.style.setProperty("--bx0", `${x0}px`);
    finaleEl.style.setProperty("--bx1", `${Math.max(x0 + 40, x1)}px`);
}

layoutFinale();   // đặt sẵn --bx0 / --bx1 để thuyền không bị trượt khi tính lại lúc bắt đầu

// --- Pháo hoa dạng chữ: vẽ chữ lên canvas nhỏ rồi lấy mẫu điểm ---
function textPoints(text) {
    const size = 96;
    const font = `800 ${size}px "Baloo 2", "Be Vietnam Pro", sans-serif`;
    const c = document.createElement("canvas");
    const g = c.getContext("2d");
    g.font = font;
    const w = Math.ceil(g.measureText(text).width) + 24;
    const h = Math.ceil(size * 1.5);
    c.width = w;
    c.height = h;
    g.font = font;                       // đổi kích thước canvas thì font bị reset
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = "#fff";
    g.fillText(text, w / 2, h / 2);

    const data = g.getImageData(0, 0, w, h).data;
    const pts = [];
    const step = 4;
    for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
            if (data[(y * w + x) * 4 + 3] > 140) {
                const nx = (x - w / 2) / (w / 2);
                pts.push({ x: nx, y: (y - h / 2) / (w / 2), hueShift: (nx + 1) * 25 });
            }
        }
    }
    return pts;
}

// Quả pháo bay lên rồi nổ thành chữ (dùng lại Rocket và spawnShape có sẵn)
class TextRocket extends Rocket {
    constructor(x, hue, text, apexFrac) {
        super(x, hue, "normal");
        this.pts = textPoints(text);
        const rise = canvas.height * (1 - apexFrac);                  // độ cao cần lên tới
        this.speed = -Math.sqrt(2 * CONFIG.rocket.gravity * rise);
        this.vx = 0;
    }
    update() {
        this.y += this.speed;
        this.x += this.vx;
        this.speed += CONFIG.rocket.gravity;
        if (this.speed >= 0) {
            spawnShape(this.x, this.y, this.color, this.pts, canvas.width * 0.0032, "heart");
            return false;
        }
        return true;
    }
}
function launchTextRocket(text, xFrac, hue, apexFrac = 0.24) {
    rockets.push(new TextRocket(canvas.width * xFrac, hue, text, apexFrac));
}

// --- Các tờ giấy bay ra khỏi sách rồi tụ về chỗ chiếc thuyền ---
function flySheets() {
    const book = document.querySelector(".book").getBoundingClientRect();
    const cx = book.left + book.width / 2;
    const cy = book.top + book.height / 2;
    const boat = finBoat.getBoundingClientRect();
    const tx = boat.left + boat.width / 2;
    const ty = boat.top + boat.height * 0.55;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const sw = Math.max(46, Math.min(W * 0.075, 90));
    const total = (FIN.sheetScatter + FIN.sheetGather) * 1000;

    const pose = (p, rx, ry, rz, sc, o, easing) => ({
        transform: `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${sc})`,
        opacity: o,
        easing,
    });
    const ease = "cubic-bezier(0.3, 0.6, 0.3, 1)";

    for (let i = 0; i < FIN.sheets; i++) {
        const s = document.createElement("div");
        s.className = "fin-sheet";
        s.style.setProperty("--sw", `${sw}px`);
        finaleEl.appendChild(s);

        const mid = { x: cx + finRand(-0.35, 0.35) * W, y: cy - H * finRand(0.18, 0.54) };
        const drift = { x: mid.x + finRand(-30, 30), y: mid.y + finRand(-12, 20) };

        const anim = s.animate([
            { ...pose({ x: cx, y: cy }, 70, 0, finRand(-20, 20), 0.3, 0, ease), offset: 0 },
            { ...pose(mid, finRand(-40, 40), finRand(-200, 200), finRand(-90, 90), 1, 1, ease), offset: 0.42 },
            { ...pose(drift, finRand(-30, 30), finRand(-160, 160), finRand(-60, 60), 1, 1, ease), offset: 0.62 },
            { ...pose({ x: tx, y: ty }, 0, 0, finRand(-20, 20), 0.35, 1, "linear"), offset: 0.92 },
            { ...pose({ x: tx, y: ty }, 0, 0, 0, 0.25, 0, "linear"), offset: 1 },
        ], { duration: total, delay: i * FIN.sheetStagger * 1000, easing: "linear", fill: "both" });

        anim.onfinish = () => s.remove();
        F.anims.push(anim);
    }
}

function showFinLine(n) {
    finaleEl.querySelector(`.fl${n}`).classList.add("show");
}

function lightLamp() {
    finaleEl.classList.add("lit");
    [0, 0.35, 0.7].forEach(d => finAt(d, launchRocket));
}

// Thuyền cập bến: pháo hoa nổ rộ, hai lần dạng chữ
function celebrateFinale() {
    if (F.celebrated) return;
    F.celebrated = true;
    finCelebAt(0, () => launchTextRocket("Tri ân", 0.5, 45));
    finCelebAt(1.9, () => launchTextRocket("Thầy Cô", 0.5, 330));
    for (let i = 0; i < 6; i++) finCelebAt(0.4 + i * 0.45, launchRocket);
}

// Trạng thái cuối: mọi thứ đã xong. Dùng cho cả lúc chạy hết hoạt cảnh lẫn lúc bấm bỏ qua
function finalizeFinale(skipped = false) {
    if (F.final) return;
    F.timers.forEach(clearTimeout);
    F.timers = [];
    F.anims.forEach(a => { a.onfinish = null; a.cancel(); });
    F.anims = [];
    finaleEl.querySelectorAll(".fin-sheet").forEach(s => s.remove());
    document.querySelectorAll(".mote").forEach(m => m.remove());

    stageEl.classList.add("busy", "wipe-next", "finale-out");
    if (typeof setFlowerMode === "function") setFlowerMode("off");
    layoutFinale();
    finaleEl.classList.remove("running");
    finaleEl.classList.add("on", "sea-on", "assemble", "approach", "lit", "is-final");
    F.final = true;

    finAt(skipped ? 0.4 : 0, () => finaleEl.classList.add("show-end"));
    celebrateFinale();
}

function startFinale() {
    if (F.on || turning || !bookOpened || page !== lastPage()) return;
    F.on = true;
    F.final = false;
    F.celebrated = false;
    turning = true;
    closePhotoZoom(true);
    if (typeof setFlowerMode === "function") setFlowerMode("off");   // trang kết: không còn hoa

    stageEl.classList.remove("show-nav");
    stageEl.classList.add("busy", "wipe-next");          // ảnh cuối chìm vào sách
    document.querySelectorAll(".mote").forEach(m => m.remove());

    layoutFinale();
    finaleEl.classList.add("on", "running");
    finaleEl.setAttribute("aria-hidden", "false");

    if (finReduce.matches) { finalizeFinale(true); return; }   // người dùng tắt hiệu ứng: vào thẳng trang kết

    finAt(FIN.sheetsAt,   flySheets);
    finAt(FIN.bookOutAt,  () => stageEl.classList.add("finale-out"));
    finAt(FIN.seaAt,      () => finaleEl.classList.add("sea-on"));
    finAt(FIN.assembleAt, () => finaleEl.classList.add("assemble"));
    finAt(FIN.sailAt,     () => { finaleEl.classList.add("approach"); showFinLine(1); });
    finAt(FIN.line2At,    () => { showFinLine(2); lightLamp(); });
    finAt(FIN.line3At,    () => showFinLine(3));
    finAt(FIN.arriveAt,   celebrateFinale);
    finAt(FIN.endAt,      () => finalizeFinale(false));
}

// Chạm vào bất kỳ đâu (hoặc bấm Esc) để bỏ qua hoạt cảnh
finaleEl.addEventListener("click", e => {
    if (!F.on || F.final) return;
    finalizeFinale(true);
});
document.addEventListener("keydown", e => {
    if (e.key === "Escape" && F.on && !F.final) finalizeFinale(true);
});

// Xoay màn hình / đổi kích thước: tính lại vị trí thuyền, đang chạy dở thì nhảy tới trạng thái cuối
window.addEventListener("resize", () => {
    if (!F.on) return;
    layoutFinale();
    if (!F.final) finalizeFinale(true);
});

// --- "Xem lại từ đầu": quay về cuốn sách đóng ở cảnh 3 ---
function restartFromBook() {
    if (!F.final || F.restarting) return;
    F.restarting = true;
    finaleEl.classList.add("fin-out");

    setTimeout(() => {
        F.timers.forEach(clearTimeout);
        F.celebTimers.forEach(clearTimeout);
        F.timers = [];
        F.celebTimers = [];

        // gỡ mọi trạng thái của trang kết, không để hiệu ứng chạy ngược khi đã ẩn
        finaleEl.className = "finale no-anim";
        void finaleEl.offsetWidth;
        finaleEl.classList.remove("no-anim");
        finaleEl.setAttribute("aria-hidden", "true");

        // đưa cuốn sách về lúc đầu cảnh 3
        const area = document.querySelector(".book-area");
        area.style.transition = "none";
        stageEl.classList.remove(
            "lying", "closed", "open", "glow", "show-letter", "show-photo", "show-nav",
            "busy", "wipe-next", "wipe-prev", "rise-in", "shut-back", "show-reopen", "finale-out"
        );
        void area.offsetWidth;
        area.style.transition = "";

        bookOpened = false;
        backShut = false;
        turning = false;
        page = 0;
        renderPage();

        // sách nổi lên từ phía dưới như lúc mới vào cảnh 3, nút "Mở sách" hiện lại
        [".book-enter", ".cover-btn"].forEach(sel => {
            const el = document.querySelector(sel);
            el.style.animation = "none";
            void el.offsetWidth;
            el.style.animation = "";
        });

        if (typeof setFlowerMode === "function") setFlowerMode("calm");   // về lại cảnh 3: hoa ít

        F.on = false;
        F.final = false;
        F.celebrated = false;
        F.restarting = false;
    }, 800);
}
window.restartFromBook = restartFromBook;

// ===== Cánh đồng hoa =====
// Nền chung nằm dưới các cảnh (CSS ở cuối style.css). Đổi chế độ theo cảnh bằng setFlowerMode():
//   "full": cảnh 1 và 2 - hoa ở đáy, hai góc dưới và hai góc trên (rủ xuống)
//   "calm": cảnh 3      - chỉ còn vài hàng hoa thấp ở đáy, nhường điểm nhấn cho pháo hoa
//   "off" : cảnh 4      - không có hoa
(function () {
    const field = document.getElementById("flowerField");
    if (!field) return;

    const FIELD = {
        bg: "#1a1a4e",
        // Hoa ở đáy, 3 lớp độ sâu
        // spacing: px giữa hai cây (nhỏ hơn = dày hơn) | min: số cây tối thiểu
        // hv: [độ cao ở giữa, ở mép] (vh) | fade: pha màu nền (xa thì tối hơn)
        // t: khoảng thời gian bắt đầu mọc (giây) | keep: tỉ lệ cây còn lại ở cảnh 3
        layers: [
            { name: "far",  spacing: 24, min: 22, hv: [4, 13], fade: 0.45, t: [0, 1.4],   keep: 0.5,
              types: { blossom: 3, daisy: 3, bud: 2, grass: 3, tulip: 1, rose: 1, lotus: 1 } },
            { name: "mid",  spacing: 40, min: 14, hv: [6, 24], fade: 0.18, t: [0.3, 2],   keep: 0.3,
              types: { rose: 3, daisy: 3, tulip: 2, blossom: 2, lotus: 2, bud: 1, grass: 3 } },
            { name: "near", spacing: 80, min: 8,  hv: [4, 34], fade: 0,    t: [0.6, 2.4], keep: 0,
              types: { lotus: 3, rose: 3, tulip: 2, daisy: 2, blossom: 1, grass: 2 } },
        ],
        // Hai góc trên: hoa rủ xuống (chỉ có ở cảnh 1 và 2)
        top: {
            name: "top",
            spacing: 150,          // px; số cây mỗi góc = chiều rộng / spacing
            min: 4,
            reach: 0.2,            // góc rộng bao nhiêu (tỉ lệ bề ngang màn hình)
            hv: [2, 18],           // độ dài rủ ở sát trong -> sát góc (vh)
            fade: 0.1,
            t: [0.8, 2.4],
            keep: 0,
            types: { blossom: 3, daisy: 2, bud: 3, rose: 1, lotus: 1, grass: 2 },
        },
        fireflies: 12,
    };

    const PALETTES = [
        { petal: "#ffb3cd", light: "#ffd9e6", dark: "#f58cb0", core: "#ffd54a" }, // hồng
        { petal: "#fff0d2", light: "#fffaf0", dark: "#f0d29a", core: "#ffc247" }, // kem
        { petal: "#ffe27a", light: "#fff3b0", dark: "#f2c43c", core: "#d9803a" }, // vàng
        { petal: "#b8f0dc", light: "#e2fff4", dark: "#86d8b8", core: "#ffd54a" }, // bạc hà
        { petal: "#d9c8ff", light: "#efe7ff", dark: "#b79df0", core: "#ffd54a" }, // oải hương
        { petal: "#a8e8ff", light: "#dbf7ff", dark: "#78cdee", core: "#fff3b0" }, // xanh lơ
    ];
    // mỗi loại hoa dùng những bảng màu nào (số lặp lại = hay gặp hơn)
    const TYPE_PALETTES = {
        lotus: [0, 0, 1], rose: [0, 1, 2, 4, 5], daisy: [1, 1, 2, 0],
        tulip: [0, 2, 3, 4], blossom: [0, 4, 1, 5], bud: [0, 2, 4, 3], grass: [0],
    };

    const frand = (a, b) => a + Math.random() * (b - a);
    const fpick = arr => arr[Math.floor(Math.random() * arr.length)];
    const fx = n => +n.toFixed(1);
    const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const mixHex = (a, b, t) => {
        const A = hex2rgb(a), B = hex2rgb(b);
        return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
    };
    function fpickWeighted(map) {
        const e = Object.entries(map);
        let r = Math.random() * e.reduce((s, [, w]) => s + w, 0);
        for (const [k, w] of e) if ((r -= w) < 0) return k;
        return e[0][0];
    }

    /* ---------- Hình cánh hoa (gốc ở 0,0, hướng lên) ---------- */
    const pointedPetal = (len, w) =>
        `M0 0C${fx(-w)} ${fx(-len * .3)} ${fx(-w * .8)} ${fx(-len * .85)} 0 ${fx(-len)}C${fx(w * .8)} ${fx(-len * .85)} ${fx(w)} ${fx(-len * .3)} 0 0Z`;
    const roundPetal = (len, w) =>
        `M0 0C${fx(-w)} ${fx(-len * .2)} ${fx(-w)} ${fx(-len * .95)} 0 ${fx(-len)}C${fx(w)} ${fx(-len * .95)} ${fx(w)} ${fx(-len * .2)} 0 0Z`;
    const notchedPetal = (len, w) =>
        `M0 0C${fx(-w)} ${fx(-len * .35)} ${fx(-w * 1.15)} ${fx(-len * .88)} ${fx(-w * .28)} ${fx(-len)}L0 ${fx(-len * .88)}L${fx(w * .28)} ${fx(-len)}C${fx(w * 1.15)} ${fx(-len * .88)} ${fx(w)} ${fx(-len * .35)} 0 0Z`;
    const petalEl = (d, fill, rot = 0, extra = "") =>
        `<path d="${d}" fill="${fill}" transform="rotate(${fx(rot)})" ${extra}/>`;

    /* ---------- Đầu hoa ---------- */
    function headLotus(c) {
        let s = "";
        [-68, -34, 0, 34, 68].forEach(a => s += petalEl(pointedPetal(46, 13), c.dark, a));
        [-51, -17, 17, 51].forEach(a => s += petalEl(pointedPetal(42, 14), c.petal, a));
        [-26, 0, 26].forEach(a => {
            s += petalEl(pointedPetal(37, 15), c.light, a);
            s += petalEl(pointedPetal(27, 7), c.petal, a, 'opacity=".55"');
        });
        return s;
    }

    function headRose(c) {
        const st = `stroke="${c.dark}" stroke-opacity=".5" stroke-width="1"`;
        let s = `<circle r="27" fill="${c.dark}"/>`;
        for (let i = 0; i < 5; i++) {
            const a = i * 72 * Math.PI / 180;
            s += `<circle cx="${fx(Math.sin(a) * 15)}" cy="${fx(-Math.cos(a) * 15)}" r="15" fill="${c.petal}" ${st}/>`;
        }
        for (let i = 0; i < 4; i++) {
            const a = (i * 90 + 25) * Math.PI / 180;
            s += `<circle cx="${fx(Math.sin(a) * 8)}" cy="${fx(-Math.cos(a) * 8)}" r="11" fill="${c.light}" ${st}/>`;
        }
        s += `<circle r="6.5" fill="${c.petal}" ${st}/>`;
        s += `<path d="M-4 0a4 4 0 1 1 4 4M-8 2a8 8 0 0 1 7-8M2 -8a8 8 0 0 1 7 5" fill="none" stroke="${c.dark}" stroke-width="1.5" stroke-linecap="round" opacity=".8"/>`;
        return s;
    }

    function headDaisy(c) {
        let s = "";
        for (let i = 0; i < 14; i++) s += petalEl(roundPetal(32, 6.2), i % 2 ? c.petal : c.light, i * 360 / 14);
        for (let i = 0; i < 14; i++) s += petalEl(roundPetal(25, 5), c.light, i * 360 / 14 + 360 / 28);
        s += `<circle r="9" fill="${c.core}"/><circle r="9" fill="none" stroke="#d9803a" stroke-opacity=".5" stroke-width="2"/>`;
        s += `<circle cx="-2.5" cy="-2.5" r="3" fill="#fff" opacity=".6"/>`;
        return s;
    }

    function headTulip(c) {
        return petalEl(pointedPetal(48, 15), c.dark, -17) + petalEl(pointedPetal(48, 15), c.dark, 17)
            + petalEl(pointedPetal(46, 19), c.petal, 0)
            + petalEl(pointedPetal(34, 8), c.light, 0, 'opacity=".5"');
    }

    function headBlossom(c) {
        let s = "";
        for (let i = 0; i < 5; i++) s += petalEl(notchedPetal(27, 14), c.petal, i * 72);
        for (let i = 0; i < 5; i++) s += petalEl(pointedPetal(19, 4), c.light, i * 72, 'opacity=".6"');
        s += `<circle r="4.5" fill="${c.core}"/>`;
        for (let i = 0; i < 8; i++) {
            const a = i * 45 * Math.PI / 180;
            s += `<circle cx="${fx(Math.sin(a) * 9)}" cy="${fx(-Math.cos(a) * 9)}" r="1.4" fill="${c.core}"/>`;
        }
        return s;
    }

    function headBud(c, g) {
        return `<ellipse cy="-9" rx="7.5" ry="12" fill="${c.petal}"/>`
            + `<path d="M0 -21C-4 -14 -4 -6 0 0C4 -6 4 -14 0 -21Z" fill="${c.light}" opacity=".6"/>`
            + `<path d="M-9 -3C-9 -12 -3 -8 0 0Z" fill="${g}"/><path d="M9 -3C9 -12 3 -8 0 0Z" fill="${g}"/>`;
    }

    const HEADS = { lotus: headLotus, rose: headRose, daisy: headDaisy, tulip: headTulip, blossom: headBlossom };

    /* ---------- Cả cây: thân + lá + đầu hoa ---------- */
    function plantParts(type, pi, fade, H) {
        const c = {};
        for (const k in PALETTES[pi]) c[k] = mixHex(PALETTES[pi][k], FIELD.bg, fade);
        const stemC = mixHex("#4fb592", FIELD.bg, fade);
        const leafA = mixHex("#46b08a", FIELD.bg, fade);
        const leafB = mixHex("#79d8b0", FIELD.bg, fade);

        if (type === "grass") {
            let s = "";
            const n = 4 + Math.floor(Math.random() * 3);
            for (let i = 0; i < n; i++) {
                const x0 = (i - (n - 1) / 2) * 6 + frand(-2, 2);
                const h = H * frand(0.55, 1);
                const tip = x0 + frand(-20, 20);
                s += `<path d="M${fx(x0 - 3.2)} 0Q${fx(x0)} ${fx(-h * .55)} ${fx(tip)} ${fx(-h)}Q${fx(x0 + 2)} ${fx(-h * .5)} ${fx(x0 + 3.2)} 0Z" fill="${i % 2 ? leafA : leafB}"/>`;
            }
            return { top: H + 6, body: s };
        }

        const ex = frand(-10, 10);   // đầu hoa lệch ngang so với gốc
        const b = frand(-16, 16);    // độ cong của thân
        const stem = `M0 0C${fx(b)} ${fx(-H * .35)} ${fx(ex - b * .6)} ${fx(-H * .7)} ${fx(ex)} ${fx(-H)}`;
        const pt = t => [
            3 * (1 - t) ** 2 * t * b + 3 * (1 - t) * t * t * (ex - b * .6) + t ** 3 * ex,
            3 * (1 - t) ** 2 * t * (-H * .35) + 3 * (1 - t) * t * t * (-H * .7) + t ** 3 * (-H),
        ];
        const leaf = (t, dir, sc) => {
            const [x, y] = pt(t);
            return `<g transform="translate(${fx(x)} ${fx(y)}) scale(${fx(dir * sc)} ${fx(sc)}) rotate(-28)">`
                + `<path d="M0 0C8 -10 24 -11 34 -2C24 7 8 7 0 0Z" fill="${dir > 0 ? leafA : leafB}"/>`
                + `<path d="M2 -1C12 -4 22 -4 30 -2" fill="none" stroke="${leafB}" stroke-width="1" opacity=".7"/></g>`;
        };
        const dir = Math.random() < 0.5 ? 1 : -1;
        const leaves = leaf(0.28, dir, frand(0.75, 1.2)) + leaf(0.52, -dir, frand(0.7, 1.1));

        const tall = type === "lotus" || type === "tulip";
        const gy = tall ? -16 : 0;
        const glow = `<circle cy="${gy}" r="${type === "bud" ? 30 : 52}" fill="url(#fglow${pi})" opacity="${fx(1 - fade)}"/>`;
        const head = type === "bud" ? headBud(c, leafA) : HEADS[type](c);
        const rot = tall ? frand(-8, 8) : frand(-18, 18);

        // <g> ngoài đặt vị trí, <g class="head"> trong để CSS làm hiệu ứng nở
        const body = `<path d="${stem}" fill="none" stroke="${stemC}" stroke-width="3.4" stroke-linecap="round"/>`
            + leaves
            + `<g transform="translate(${fx(ex)} ${fx(-H)}) rotate(${fx(rot)})"><g class="head">${glow}${head}</g></g>`;
        return { top: H + 60, body };
    }

    // vầng sáng mềm quanh mỗi bông, một gradient cho mỗi bảng màu
    function fieldDefs() {
        return `<svg class="field-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>`
            + PALETTES.map((p, i) =>
                `<radialGradient id="fglow${i}"><stop offset="0" stop-color="${p.petal}" stop-opacity=".55"/><stop offset="1" stop-color="${p.petal}" stop-opacity="0"/></radialGradient>`).join("")
            + `</defs></svg>`;
    }

    /* ---------- Vị trí và độ cao ---------- */
    function placeX(i, n) {
        const t = ((i + Math.random()) / n) * 2 - 1;
        return 0.5 + Math.sign(t) * Math.pow(Math.abs(t), 0.7) * 0.5;   // dồn ra hai mép (số mũ 1 = rải đều)
    }
    function heightAt(x, [lo, hi]) {
        return lo + (hi - lo) * Math.pow(Math.abs(x * 2 - 1), 1.2);     // thấp ở giữa, cao ở mép
    }

    /* ---------- Ghép vào trang ---------- */
    function plantHTML(L, it) {
        const type = fpickWeighted(L.types);
        const pi = fpick(TYPE_PALETTES[type]);
        const H = frand(90, 150);
        const { top, body } = plantParts(type, pi, L.fade, H);
        const hv = type === "grass" ? it.hv * 0.6 : it.hv;
        const d = frand(L.t[0], L.t[1]);
        return `<svg class="plant" viewBox="-62 ${fx(-top)} 124 ${fx(top)}" aria-hidden="true" `
            + `style="left:${fx(it.x * 100)}%;--hv:${fx(hv)};--ar:${fx(124 / top)};--d:${fx(d)}s;`
            + `--sw:${fx(frand(1.4, 3.4))}deg;--st:${fx(frand(3.2, 5.8))}s">${body}</svg>`;
    }

    // Một lớp gồm 2 nhóm: "keep" (còn ở cảnh 3) và "extra" (biến mất ở cảnh 3)
    function makeLayer(parent, L, items) {
        items.sort((a, b) => a.hv - b.hv);   // cây cao vẽ sau, nằm trên
        const keep = items.filter(it => it.keep).map(it => plantHTML(L, it)).join("");
        const extra = items.filter(it => !it.keep).map(it => plantHTML(L, it)).join("");
        const layer = document.createElement("div");
        layer.className = `field-layer layer-${L.name}`;
        layer.innerHTML = `<div class="fgrp fgrp-keep">${keep}</div><div class="fgrp fgrp-extra">${extra}</div>`;
        parent.appendChild(layer);
    }

    let builtW = 0;
    function buildField() {
        // giữ lại .field-ground, dựng lại phần còn lại
        [...field.children].forEach(c => { if (!c.classList.contains("field-ground")) c.remove(); });
        field.insertAdjacentHTML("afterbegin", fieldDefs());
        const W = builtW = window.innerWidth;

        // đáy + hai góc dưới: thấp ở giữa, cao dần ra hai mép
        FIELD.layers.forEach(L => {
            const n = Math.max(L.min, Math.round(W / L.spacing));
            const items = [];
            for (let i = 0; i < n; i++) {
                const x = placeX(i, n);
                const hv = heightAt(x, L.hv) * frand(0.6, 1);
                // cảnh 3 chỉ giữ lại cây thấp
                items.push({ x, hv, keep: Math.random() < L.keep && hv < L.hv[1] * 0.7 });
            }
            makeLayer(field, L, items);
        });

        // hai góc trên: hoa rủ xuống, dài nhất ở sát góc; cả cụm lật ngược trong CSS (.field-top)
        const T = FIELD.top;
        const topBox = document.createElement("div");
        topBox.className = "field-top";
        field.appendChild(topBox);
        const per = Math.max(T.min, Math.round(W / T.spacing));
        const items = [];
        for (const side of [0, 1]) {
            for (let i = 0; i < per; i++) {
                const u = Math.pow(Math.random(), 1.5) * T.reach;           // khoảng cách tới mép
                const hv = (T.hv[0] + (T.hv[1] - T.hv[0]) * Math.pow(1 - u / T.reach, 1.2)) * frand(0.6, 1);
                items.push({ x: side ? 1 - u : u, hv, keep: false });
            }
        }
        makeLayer(topBox, T, items);

        // đom đóm: nửa số con (ff-extra) biến mất ở cảnh 3
        for (let i = 0; i < FIELD.fireflies; i++) {
            const el = document.createElement("span");
            el.className = "firefly" + (i % 2 ? " ff-extra" : "");
            el.style.cssText = `
                left: ${frand(3, 97)}%;
                bottom: ${frand(3, 34)}vh;
                --dx: ${frand(-70, 70)}px;
                --dy: ${frand(-90, 40)}px;
                --t: ${frand(5, 9)}s;
                --b: ${frand(2, 4)}s;
                animation-delay: ${-frand(0, 8)}s, ${-frand(0, 4)}s;
            `;
            field.appendChild(el);
        }
    }

    // Đổi chế độ theo cảnh: "full" | "calm" | "off"
    window.setFlowerMode = mode => {
        field.classList.toggle("calm", mode === "calm");
        field.classList.toggle("off", mode === "off");
    };

    buildField();
    setTimeout(() => field.classList.add("bloom"), 250);   // hoa bắt đầu mọc ngay khi vào trang

    // Xoay màn hình / đổi cỡ cửa sổ nhiều: dựng lại cho đủ độ dày theo bề rộng mới
    let rt = null;
    window.addEventListener("resize", () => {
        clearTimeout(rt);
        rt = setTimeout(() => {
            if (Math.abs(window.innerWidth - builtW) / builtW > 0.25) buildField();
        }, 400);
    });
})();
