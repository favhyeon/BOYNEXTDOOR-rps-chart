/* ==========================================
   BOYNEXTDOOR 취향표
========================================== */

const members = [
    "성호",
    "리우",
    "재현",
    "태산",
    "이한",
    "운학"
];

/* 멤버별 기본 아바타 색상 (사진 로드 실패 시 대체용) */
const memberColors = [
    "#ff9ec8",
    "#87d8ff",
    "#ffd54f",
    "#8bd66d",
    "#c9a4ff",
    "#ff8a65"
];

/* 멤버별 기본 프로필 사진 (members 배열과 순서 동일) */
const defaultPhotos = [
    "assets/sh.png",
    "assets/rw.png",
    "assets/jh.png",
    "assets/ts.png",
    "assets/lh.png",
    "assets/wh.png"
];

/*
 * 표에 표시할 커플명.
 * [행 멤버][열 멤버] 순서.
 * - 한탯 → 잏탯
 */
const pairNames = [
    ["—",   "성링", "성덍", "성탯", "성잏", "성학"],
    ["링성", "—",   "링멍", "류탯", "링잏", "링학"],
    ["댕성", "멍링", "—",   "멍산", "멍잏", "댕학"],
    ["탯성", "탯링", "탯재", "—",   "탯한", "탯운"],
    ["잏성", "잏링", "한덍", "잏탯", "—",   "맇학"],
    ["낙성", "낙링", "운덍", "운탯", "운잏", "—"]
];

const options = [
    { name: "OTP",      color: "#ff9ec8" },
    { name: "좋아함",   color: "#ff4d4d" },
    { name: "호감",     color: "#ffd54f" },
    { name: "관심있음", color: "#8bd66d" },
    { name: "관심없음", color: "#ffffff" },
    { name: "별로",     color: "#87d8ff" },
    { name: "지뢰",     color: "#999999" }
];

const STORAGE_KEY = "boynextdoor-yeop-rps";
const LR_STORAGE_KEY = "boynextdoor-lr-rps";
const LR_CELL_COUNT = 12;

const table = document.getElementById("chartTable");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const optionGrid = document.getElementById("optionGrid");
const closeModal = document.getElementById("closeModal");

const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");
const guideListRps = document.getElementById("guideListRps");
const guideListLr = document.getElementById("guideListLr");

const dateToggleWrap = document.getElementById("dateToggleWrap");
const dateToggle = document.getElementById("dateToggle");
const dateTextRps = document.getElementById("dateTextRps");
const dateTextLr = document.getElementById("dateTextLr");

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");

const saveModal = document.getElementById("saveModal");
const previewImage = document.getElementById("previewImage");
const closeSaveModal = document.getElementById("closeSaveModal");

const tabRps = document.getElementById("tabRps");
const tabLr = document.getElementById("tabLr");
const captureAreaRps = document.getElementById("captureArea");
const captureAreaLr = document.getElementById("captureAreaLr");
const lrGrid = document.getElementById("lrGrid");
const photoInput = document.getElementById("photoInput");
const scaleWrap = document.getElementById("scaleWrap");

/* CSS의 @media (max-width: 768px)과 동일한 기준.
   이 폭 이하에서는 JS로 축소하지 않고, 반응형 레이아웃을 그대로 사용한다. */
const MOBILE_BREAKPOINT = 768;
const DESKTOP_CAPTURE_WIDTH = 1400;

let currentTarget = null; // { type: "cell", td } | { type: "row", index } | { type: "col", index }
let currentTab = "rps";
let currentPhotoIndex = null;

const HISTORY_LIMIT = 50;
let historyStack = [];
let redoStack = [];

let saveData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

let lrData = JSON.parse(localStorage.getItem(LR_STORAGE_KEY)) || {
    texts: {},
    cells: {},
    photos: {}
};

const GUIDE_TEXT = {
    rps: [
        "셀을 선택하여 호감도를 표시해주세요.",
        "멤버 이름을 누르면 줄 전체선택이 가능해요."
    ],
    lr: [
        "L-R 사이에서 원하는 부분을 선택하고, 아래 칸에 취향을 적어보세요.",
        "각 멤버의 프로필을 선택하면 사진 변경이 가능해요."
    ]
};

function renderGuide(tab) {
    const target = tab === "rps" ? guideListRps : guideListLr;
    target.innerHTML = "";
    GUIDE_TEXT[tab].forEach(line => {
        const p = document.createElement("p");
        p.textContent = line;
        target.appendChild(p);
    });
}

/* ==========================================
   날짜 표시 (제목 옆 260810 ver. 형식)
========================================== */

function getDateVerText() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yy}${mm}${dd} ver.`;
}

function updateDateDisplay() {
    const text = dateToggle.checked ? getDateVerText() : "";
    dateTextRps.textContent = text;
    dateTextLr.textContent = text;
}

dateToggle.addEventListener("change", updateDateDisplay);

createTable();
createLrGrid();
updateNavButtons();
renderGuide(currentTab);
updateDateDisplay();

/* ==========================================
   탭 전환
========================================== */

function switchTab(tab) {
    currentTab = tab;

    if (tab === "rps") {
        captureAreaRps.classList.remove("hidden");
        captureAreaLr.classList.add("hidden");
        tabRps.classList.add("active");
        tabLr.classList.remove("active");
    } else {
        captureAreaLr.classList.remove("hidden");
        captureAreaRps.classList.add("hidden");
        tabLr.classList.add("active");
        tabRps.classList.remove("active");
    }

    renderGuide(tab);
    fitCaptureArea();
}

tabRps.addEventListener("click", () => switchTab("rps"));
tabLr.addEventListener("click", () => switchTab("lr"));

/* ==========================================
   옆페스 취향표 - 표 생성
========================================== */

function createTable() {
    table.innerHTML = "";

    const head = document.createElement("tr");
    const empty = document.createElement("th");
    empty.className = "corner";
    head.appendChild(empty);

    members.forEach((member, colIndex) => {
        const th = document.createElement("th");
        th.textContent = member;
        th.classList.add("clickable-header");

        th.addEventListener("click", () => {
            currentTarget = { type: "col", index: colIndex };
            openModal(member);
        });

        head.appendChild(th);
    });

    table.appendChild(head);

    members.forEach((row, rowIndex) => {
        const tr = document.createElement("tr");

        const rowHead = document.createElement("th");
        rowHead.textContent = row;
        rowHead.classList.add("clickable-header");

        rowHead.addEventListener("click", () => {
            currentTarget = { type: "row", index: rowIndex };
            openModal(row);
        });

        tr.appendChild(rowHead);

        members.forEach((col, colIndex) => {
            const td = document.createElement("td");
            td.dataset.key = `${rowIndex}-${colIndex}`;

            if (rowIndex === colIndex) {
                td.textContent = "—";
                td.classList.add("diagonal");
            } else {
                td.textContent = pairNames[rowIndex][colIndex];

                if (saveData[td.dataset.key]) {
                    td.style.backgroundColor = saveData[td.dataset.key];
                }

                td.addEventListener("click", () => {
                    currentTarget = { type: "cell", td };
                    openModal(pairNames[rowIndex][colIndex]);
                });
            }

            tr.appendChild(td);
        });

        table.appendChild(tr);
    });
}

/* ==========================================
   옆페스 취향표 - 이전/이후 (실행 취소)
========================================== */

function pushHistory() {
    historyStack.push(JSON.stringify(saveData));
    if (historyStack.length > HISTORY_LIMIT) {
        historyStack.shift();
    }
    redoStack = [];
    updateNavButtons();
}

function updateNavButtons() {
    undoBtn.disabled = historyStack.length === 0;
    redoBtn.disabled = redoStack.length === 0;
}

undoBtn.addEventListener("click", () => {
    if (historyStack.length === 0) return;

    redoStack.push(JSON.stringify(saveData));
    saveData = JSON.parse(historyStack.pop());

    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    createTable();
    updateNavButtons();
});

redoBtn.addEventListener("click", () => {
    if (redoStack.length === 0) return;

    historyStack.push(JSON.stringify(saveData));
    saveData = JSON.parse(redoStack.pop());

    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    createTable();
    updateNavButtons();
});

/* ==========================================
   색상 선택 모달
========================================== */

function openModal(titleText) {
    modalTitle.textContent = titleText;
    optionGrid.innerHTML = "";

    options.forEach(option => {
        const item = document.createElement("div");
        item.className = "option-card";

        const isNone = option.color.toLowerCase() === "#ffffff";

        item.innerHTML = `
            <span class="option-dot${isNone ? " dashed" : ""}" style="background:${option.color}"></span>
            <span class="option-label">${option.name}</span>
        `;

        item.addEventListener("click", () => applySelection(option.color));

        optionGrid.appendChild(item);
    });

    const clearItem = document.createElement("div");
    clearItem.className = "option-card clear-card";
    clearItem.innerHTML = `
        <span class="option-dot">&#128465;</span>
        <span class="option-label">선택 지우기</span>
    `;
    clearItem.addEventListener("click", () => applySelection(null));
    optionGrid.appendChild(clearItem);

    modal.classList.remove("hidden");
}

function setCellColor(td, color) {
    if (!td) return;

    if (color) {
        td.style.backgroundColor = color;
        saveData[td.dataset.key] = color;
    } else {
        td.style.backgroundColor = "#ffffff";
        delete saveData[td.dataset.key];
    }
}

function applySelection(color) {
    if (!currentTarget) return;

    pushHistory();

    if (currentTarget.type === "cell") {
        setCellColor(currentTarget.td, color);
    } else if (currentTarget.type === "row") {
        const rowIndex = currentTarget.index;
        members.forEach((_, colIndex) => {
            if (colIndex === rowIndex) return;
            const td = table.querySelector(`td[data-key="${rowIndex}-${colIndex}"]`);
            setCellColor(td, color);
        });
    } else if (currentTarget.type === "col") {
        const colIndex = currentTarget.index;
        members.forEach((_, rowIndex) => {
            if (rowIndex === colIndex) return;
            const td = table.querySelector(`td[data-key="${rowIndex}-${colIndex}"]`);
            setCellColor(td, color);
        });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    modal.classList.add("hidden");
}

closeModal.addEventListener("click", () => {
    modal.classList.add("hidden");
});

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.classList.add("hidden");
    }

    if (e.target === saveModal) {
        saveModal.classList.add("hidden");
    }
});

/* ==========================================
   공수 취향표 - 기본 아바타 생성 (SVG)
========================================== */

function defaultAvatar(name, color) {
    const initial = name.charAt(0);
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">
            <rect width="160" height="160" fill="${color}" />
            <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
                font-family="Pretendard, Noto Sans KR, sans-serif"
                font-size="64" font-weight="800" fill="#ffffff">${initial}</text>
        </svg>
    `;
    return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
}

/* ==========================================
   공수 취향표 - 그리드 생성
========================================== */

function createLrGrid() {
    lrGrid.innerHTML = "";

    members.forEach((member, index) => {
        const row = document.createElement("div");
        row.className = "lr-row";

        /* 아바타 */
        const avatar = document.createElement("div");
        avatar.className = "lr-avatar";
        avatar.dataset.index = index;

        const img = document.createElement("img");
        img.src = lrData.photos[index] || defaultPhotos[index];
        img.alt = member;
        img.onerror = () => {
            img.onerror = null;
            img.src = defaultAvatar(member, memberColors[index % memberColors.length]);
        };
        avatar.appendChild(img);

        const editHint = document.createElement("div");
        editHint.className = "avatar-edit";
        editHint.textContent = "사진 변경";
        avatar.appendChild(editHint);

        avatar.addEventListener("click", () => {
            currentPhotoIndex = index;
            photoInput.value = "";
            photoInput.click();
        });

        row.appendChild(avatar);

        /* 오른쪽 내용 (바 + 텍스트) */
        const content = document.createElement("div");
        content.className = "lr-content";

        const barWrap = document.createElement("div");
        barWrap.className = "lr-bar-wrap";

        const labelL = document.createElement("span");
        labelL.className = "lr-label-l";
        labelL.textContent = "L";

        const bar = document.createElement("div");
        bar.className = "lr-bar";
        bar.dataset.index = index;

        const filledCells = lrData.cells[index] || [];

        for (let c = 0; c < LR_CELL_COUNT; c++) {
            const cell = document.createElement("div");
            cell.className = "lr-cell";
            cell.dataset.cell = c;

            if (filledCells[c]) {
                cell.classList.add("filled");
            }

            cell.addEventListener("click", () => {
                toggleLrCell(index, c, cell);
            });

            bar.appendChild(cell);
        }

        const labelR = document.createElement("span");
        labelR.className = "lr-label-r";
        labelR.textContent = "R";

        barWrap.appendChild(labelL);
        barWrap.appendChild(bar);
        barWrap.appendChild(labelR);

        const textWrap = document.createElement("div");
        textWrap.className = "lr-text-wrap";

        const text = document.createElement("textarea");
        text.className = "lr-text";
        text.rows = 3;
        text.maxLength = 150;
        text.placeholder = "자유롭게 적어보세요";
        text.value = lrData.texts[index] || "";
        text.dataset.index = index;

        const charCount = document.createElement("span");
        charCount.className = "lr-char-count";
        charCount.textContent = `${text.value.length}/150`;

        text.addEventListener("input", () => {
            lrData.texts[index] = text.value;
            charCount.textContent = `${text.value.length}/150`;
            saveLrData();
        });

        textWrap.appendChild(text);
        textWrap.appendChild(charCount);

        content.appendChild(barWrap);
        content.appendChild(textWrap);

        row.appendChild(content);

        lrGrid.appendChild(row);
    });
}

function toggleLrCell(memberIndex, cellIndex, cellEl) {
    if (!lrData.cells[memberIndex]) {
        lrData.cells[memberIndex] = [];
    }

    lrData.cells[memberIndex][cellIndex] = !lrData.cells[memberIndex][cellIndex];
    cellEl.classList.toggle("filled");

    saveLrData();
}

function saveLrData() {
    localStorage.setItem(LR_STORAGE_KEY, JSON.stringify(lrData));
}

/* 사진 업로드 */
photoInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file || currentPhotoIndex === null) return;

    const reader = new FileReader();

    reader.onload = () => {
        lrData.photos[currentPhotoIndex] = reader.result;
        saveLrData();

        const avatarEl = lrGrid.querySelector(`.lr-avatar[data-index="${currentPhotoIndex}"] img`);
        if (avatarEl) {
            avatarEl.src = reader.result;
        }
    };

    reader.readAsDataURL(file);
});

/* ==========================================
   초기화
========================================== */

resetBtn.addEventListener("click", () => {
    if (!confirm("현재 화면의 모든 선택을 초기화할까요?")) return;

    if (currentTab === "rps") {
        localStorage.removeItem(STORAGE_KEY);
        saveData = {};
        historyStack = [];
        redoStack = [];
        updateNavButtons();
        createTable();
    } else {
        localStorage.removeItem(LR_STORAGE_KEY);
        lrData = { texts: {}, cells: {}, photos: {} };
        createLrGrid();
    }
});

/* ==========================================
   이미지 저장
========================================== */

saveBtn.addEventListener("click", async () => {
    const buttonWrap = document.querySelector(".button-wrap");
    const tabWrap = document.querySelector(".tab-wrap");
    const area = currentTab === "rps" ? captureAreaRps : captureAreaLr;

    buttonWrap.style.display = "none";
    tabWrap.style.display = "none";
    dateToggleWrap.style.display = "none";

    /* 안내 문구, 이전/이후 버튼은 이미지에는 나오지 않도록 캡처 중에만 숨김 */
    area.classList.add("capturing");

    /* 화면(특히 모바일)에 적용돼 있던 축소/반응형 스타일을 잠시 걷어내고,
       항상 PC 버전과 동일한 1400px 레이아웃으로 저장되도록 한다. */
    const prevTransform = area.style.transform;
    area.style.transform = "none";

    try {
        const canvas = await html2canvas(area, {
            backgroundColor: "#ffffff",
            scale: 4,
            useCORS: true,
            logging: false,
            windowWidth: DESKTOP_CAPTURE_WIDTH,
            windowHeight: Math.max(area.scrollHeight, 1600)
        });

        const image = canvas.toDataURL("image/png");

        previewImage.src = image;
        saveModal.classList.remove("hidden");

        const fileLabel = currentTab === "rps" ? "옆페스_취향표" : "공수_취향표";

        const link = document.createElement("a");
        link.href = image;
        link.download = `BOYNEXTDOOR_${fileLabel}.png`;
        link.click();
    } catch (error) {
        console.error(error);
        alert("이미지 저장 중 문제가 발생했습니다.");
    } finally {
        area.classList.remove("capturing");
        area.style.transform = prevTransform;
        buttonWrap.style.display = "flex";
        tabWrap.style.display = "flex";
        dateToggleWrap.style.display = "flex";
    }
});

closeSaveModal.addEventListener("click", () => {
    saveModal.classList.add("hidden");
});

/* ==========================================
   ESC
========================================== */

document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        modal.classList.add("hidden");
        saveModal.classList.add("hidden");
    }
});

/* ==========================================
   모바일 자동 축소
========================================== */

function fitCaptureArea() {
    const area = currentTab === "rps" ? captureAreaRps : captureAreaLr;
    const wrap = scaleWrap;

    if (!area || !wrap) return;

    const screenWidth = Math.min(
        window.innerWidth,
        document.documentElement.clientWidth
    );

    if (screenWidth <= MOBILE_BREAKPOINT) {
        /* 모바일: 축소 대신 CSS 반응형 레이아웃을 그대로 사용하고,
           세로로 길어진 내용은 화면을 드래그해서 내려보는 방식으로 확인한다. */
        area.style.transform = "none";
        area.style.transformOrigin = "";
        wrap.style.width = "";
        wrap.style.height = "";
        return;
    }

    const scale = Math.min(1, screenWidth / DESKTOP_CAPTURE_WIDTH);

    area.style.transformOrigin = "top left";
    area.style.transform = `scale(${scale})`;

    wrap.style.width = `${DESKTOP_CAPTURE_WIDTH * scale}px`;
    wrap.style.height = `${area.scrollHeight * scale}px`;
}

fitCaptureArea();

window.addEventListener("load", fitCaptureArea);
window.addEventListener("resize", fitCaptureArea);

window.addEventListener("orientationchange", () => {
    setTimeout(fitCaptureArea, 200);
});
