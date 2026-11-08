// 1. CẤU HÌNH
const CONFIG = {
    password: '2011',

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
        errorMsg.style.display = 'none';
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
function createStars(count = CONFIG.numberStars) {
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

createStars();

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
    document.getElementById("navNext").title = page === lastPage() ? "Đóng sách" : "Trang sau";
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

function turnPage(dir) {                 // dir: 1 = tới, -1 = lui
    if (zoomLb) return;
    if (backShut) { if (dir < 0) reopenBack(); return; }
    if (turning || !bookOpened) return;
    const next = page + dir;
    if (next < 0 || next > lastPage()) { closeBook(); return; }

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
        src: "music.m4a",
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