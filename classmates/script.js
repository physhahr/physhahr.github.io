/* =========================
   1) 兩個清單：座號與姓名（索引互相對應）
   ========================= */
const seatNumbers = [
  "01","02","03","04","05","06","07","08","09","10",
  "11","12","13","14","15","16","17","18","19","20",
  "21","22","23","24","25","26","27","28","29","30",
  "31","32","33","34","35","36","37"
];

const studentNames = [
  "余有容","吳羽涵","吳婕寧","呂若妘","徐海娜","翁芷妍","黃于瑄","王翊丞","丘昊永","李芮安",
  "李德謙","林智鈞","張宬睿","張凱鈞","張瀚元","許博安","連奕愷","郭桓睿","陳之一","陳光俊",
  "陳君岳","陳廷亮","陳邑翰","陳雍澄","傅裕家","馮又仁","黃雋凱","廖奕翔","蔡臣訓","蔡鼎棋",
  "蔡叡霆","鄭聿倫","鄭嘉愷","賴彥勳","賴賢峰","顏楷恩","蘇俊與"
];

// 工具：組合成 "座號 姓名"
const fullLabel = (i) => `${seatNumbers[i]} ${studentNames[i]}`;

// 供第三種玩法下拉用
const fullList = seatNumbers.map((_, i) => fullLabel(i));

/* =========================
   2) Welcome：兩個下拉互相對應
   ========================= */
const seatSelect = document.getElementById("seatSelect");
const nameSelect = document.getElementById("nameSelect");

function initWelcomeSelects() {
  // 填入座號與姓名選單
  seatNumbers.forEach((s, i) => {
    const opt = document.createElement("option");
    opt.value = i; // 用索引當 value
    opt.textContent = s;
    seatSelect.appendChild(opt);
  });
  studentNames.forEach((n, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = n;
    nameSelect.appendChild(opt);
  });

  // 預設同步（索引 0）
  seatSelect.value = "0";
  nameSelect.value = "0";

  // 互相對應：修改其一就更新另一個 value
  seatSelect.addEventListener("change", () => {
    nameSelect.value = seatSelect.value;
  });
  nameSelect.addEventListener("change", () => {
    seatSelect.value = nameSelect.value;
  });
}
initWelcomeSelects();

// 取得當前選到的學生索引
function currentIndex() {
  return parseInt(seatSelect.value, 10);
}

/* =========================
   3) 導頁邏輯
   ========================= */
const stepEls = document.querySelectorAll(".step");
function showStep(n) {
  stepEls.forEach(s => s.classList.add("hidden"));
  document.getElementById(`step${n}`).classList.remove("hidden");
}

document.getElementById("goToStep2").addEventListener("click", () => {
  const idx = currentIndex();
  localStorage.setItem("currentIndex", String(idx));
  const intro = loadIntro(idx);
  // 若已完成必填，直接進 Step3
  if (intro && intro.dislike && intro.like && intro.keywords) {
    showStep(3);
  } else {
    showStep(2);
    // 載回草稿
    fillIntroForm(intro);
  }
});

/* =========================
   4) 自我介紹（統一大小、驗證、IG 加@、生日 yyyy/mm/dd）
   ========================= */
const introForm = document.getElementById("introForm");
const fields = {
  nickname: document.getElementById("nickname"),
  birthday: document.getElementById("birthday"),
  dislike: document.getElementById("dislike"),
  like: document.getElementById("like"),
  keywords: document.getElementById("keywords"),
  ig: document.getElementById("ig"),
  note: document.getElementById("note"),
};

// IG 自動加 @
fields.ig.addEventListener("input", (e) => {
  const val = e.target.value.replace(/\s+/g, "");
  e.target.value = val.startsWith("@") ? val : ("@" + val.replace(/^@+/, ""));
});

// 自動儲存（雲端前的暫存）
Object.values(fields).forEach(el => {
  el.addEventListener("input", () => {
    saveIntroDraft();
    // 及時移除或加上錯誤樣式
    if (["dislike","like","keywords"].includes(el.id)) {
      toggleError(el, !el.value.trim());
    }
    if (el.id === "birthday" && el.value.trim() !== "") {
      toggleError(el, !isValidDate(el.value.trim()));
    }
  });
});

// yyyy/mm/dd 驗證（選填，填了才驗）
function isValidDate(str) {
  // 僅允許 yyyy/mm/dd
  const m = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(str);
  if (!m) return false;
  const y = +m[1], mo = +m[2], d = +m[3];
  const dt = new Date(`${y}-${m[2]}-${m[3]}`);
  return dt.getFullYear() === y && (dt.getMonth()+1) === mo && dt.getDate() === d;
}

function toggleError(el, isErr) {
  el.classList.toggle("error", !!isErr);
  el.classList.toggle("ok", !isErr && el.value.trim() !== "");
}

// 載入 / 儲存本機草稿
function storageKey(idx) { return `intro_${idx}`; }
function saveIntroDraft() {
  const idx = parseInt(localStorage.getItem("currentIndex") ?? currentIndex(), 10);
  const data = {
    nickname: fields.nickname.value.trim(),
    birthday: fields.birthday.value.trim(),
    dislike:  fields.dislike.value.trim(),
    like:     fields.like.value.trim(),
    keywords: fields.keywords.value.trim(),
    ig:       fields.ig.value.trim(),
    note:     fields.note.value.trim(),
  };
  localStorage.setItem(storageKey(idx), JSON.stringify(data));
}
function loadIntro(idx) {
  const raw = localStorage.getItem(storageKey(idx));
  return raw ? JSON.parse(raw) : null;
}
function fillIntroForm(data) {
  const d = data || {};
  fields.nickname.value = d.nickname || "";
  fields.birthday.value = d.birthday || "";
  fields.dislike.value  = d.dislike  || "";
  fields.like.value     = d.like     || "";
  fields.keywords.value = d.keywords || "";
  fields.ig.value       = d.ig       || "";
  fields.note.value     = d.note     || "";

  // 重置驗證樣式
  ["dislike","like","keywords","birthday"].forEach(id => {
    const el = fields[id];
    if (id === "birthday" && el.value.trim() !== "") {
      toggleError(el, !isValidDate(el.value.trim()));
    } else if (id !== "birthday") {
      toggleError(el, !el.value.trim());
    }
  });
}

// 送出驗證
introForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // 必填檢查
  let ok = true;
  ["dislike","like","keywords"].forEach(id => {
    const el = fields[id];
    const empty = !el.value.trim();
    toggleError(el, empty);
    ok = ok && !empty;
  });

  // 生日若有填必須符合 yyyy/mm/dd
  if (fields.birthday.value.trim() !== "") {
    const bad = !isValidDate(fields.birthday.value.trim());
    toggleError(fields.birthday, bad);
    ok = ok && !bad;
  } else {
    fields.birthday.classList.remove("error");
  }

  if (!ok) return;

  // 存檔（LocalStorage）
  saveIntroDraft();
  showStep(3);
});

/* =========================
   5) 猜猜我是誰：沉浸式 + 驗證不過不進下一題
   ========================= */
const modeSelect = document.getElementById("modeSelect");
const gameArea = document.getElementById("gameArea");
const resultArea = document.getElementById("resultArea");
const gamePrompt = document.getElementById("gamePrompt");
const answerArea = document.getElementById("answerArea");
const submitAnswerBtn = document.getElementById("submitAnswer");

let currentGame = null;
let order = [];       // 出題順序（索引陣列）
let qIndex = 0;
let startTime = 0;

modeSelect.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-mode]");
  if (!btn) return;
  const mode = parseInt(btn.dataset.mode, 10);
  startGame(mode);
});

function startGame(mode) {
  currentGame = mode;
  order = seatNumbers.map((_, i) => i);
  shuffle(order);
  qIndex = 0;
  startTime = Date.now();

  // 沉浸式：隱藏標題與模式選單，只保留遊戲體驗
  modeSelect.classList.add("hidden");
  gameArea.classList.remove("hidden");
  resultArea.classList.add("hidden");

  loadQuestion();
}

function loadQuestion() {
  if (qIndex >= order.length) {
    finishGame();
    return;
  }
  const idx = order[qIndex];
  const seat = seatNumbers[idx];
  const name = studentNames[idx];
  const intro = loadIntro(idx) || {};

  // 提示內容
  let tip = "";
  if (currentGame === 1) {
    tip = `名字提示：${seat} ${name}`;
  } else if (currentGame === 2) {
    tip = `座號提示：${seat}`;
  } else {
    const selfText = composeIntroSnippet(intro);
    tip = `自介提示：${selfText || "（尚未填寫）"}`;
  }
  gamePrompt.textContent = tip;

  // 頭像（嘗試 webp -> jpg -> png）
  setAvatarSources(seat, name);

  // 作答區
  answerArea.innerHTML = "";
  let inputEl;
  if (currentGame === 1) {
    inputEl = document.createElement("input");
    inputEl.type = "text";
    inputEl.inputMode = "numeric";   // 行動裝置數字鍵盤
    inputEl.pattern = "[0-9]*";
    inputEl.placeholder = "請輸入座號（兩位數也可輸入1或01）";
    inputEl.className = "input";
  } else if (currentGame === 2) {
    inputEl = document.createElement("input");
    inputEl.type = "text";
    inputEl.placeholder = "請輸入姓名";
    inputEl.className = "input";
  } else {
    inputEl = document.createElement("select");
    inputEl.className = "input";
    fullList.forEach((label, i) => {
      const opt = document.createElement("option");
      opt.value = i;      // 答案索引
      opt.textContent = label;
      inputEl.appendChild(opt);
    });
  }
  inputEl.id = "answerInput";
  answerArea.appendChild(inputEl);

  // 讓輸入框初始為綠框（聚焦狀態）
  inputEl.classList.remove("error");
  inputEl.classList.add("ok");
  inputEl.focus();

  // Enter 也能送出
  inputEl.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") {
      ev.preventDefault();
      submitAnswerBtn.click();
    }
  });
}

submitAnswerBtn.addEventListener("click", () => {
  const idx = order[qIndex];
  const seat = seatNumbers[idx];
  const name = studentNames[idx];
  const ansEl = document.getElementById("answerInput");

  let correct = false;

  if (currentGame === 1) {
    // 答座號：接受 "1" 或 "01" 都算對
    const raw = (ansEl.value || "").trim();
    const norm = String(parseInt(raw, 10)).padStart(2, "0");
    correct = (norm === seat);
  } else if (currentGame === 2) {
    const raw = (ansEl.value || "").trim();
    correct = (raw === name);
  } else {
    // 下拉：值為索引
    const chosen = parseInt(ansEl.value, 10);
    correct = (chosen === idx);
  }

  if (!correct) {
    // 提示錯誤，不進下一題；紅框直到答對
    ansEl.classList.remove("ok");
    ansEl.classList.add("error");
    // 小小抖動
    ansEl.animate([
      { transform: "translateX(0)" },
      { transform: "translateX(-6px)" },
      { transform: "translateX(6px)" },
      { transform: "translateX(0)" }
    ], { duration: 180, easing: "ease-out" });
    return;
  }

  // 答對→恢復綠框→下一題
  ansEl.classList.remove("error");
  ansEl.classList.add("ok");

  qIndex++;
  loadQuestion();
});

function finishGame() {
  const usedSec = Math.round((Date.now() - startTime) / 1000);
  gameArea.classList.add("hidden");
  resultArea.classList.remove("hidden");
  resultArea.textContent = (currentGame < 3)
    ? `完成！耗時 ${usedSec} 秒`
    : "完成！";

  // 離開沉浸式：回到模式選單
  modeSelect.classList.remove("hidden");
}

/* =========================
   6) 小工具
   ========================= */
function shuffle(a) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
}

function composeIntroSnippet(d) {
  const parts = [];
  if (d.nickname) parts.push(`暱稱：${d.nickname}`);
  if (d.like) parts.push(`喜歡／擅長：${d.like}`);
  if (d.dislike) parts.push(`討厭／困惑：${d.dislike}`);
  if (d.keywords) parts.push(`關鍵字：${d.keywords}`);
  return parts.join("　|　");
}

function setAvatarSources(seat, name) {
  const base = `images/${seat}${name}`;
  const img = document.getElementById("gameImage");
  const webp = document.getElementById("imgWebp");
  const jpg  = document.getElementById("imgJpg");

  webp.srcset = `${base}.webp`;
  jpg.srcset  = `${base}.jpg`;
  img.src     = `${base}.png`;

  // 若 webp/jpg 都失敗，img.png 也失敗時顯示備用圖
  img.onerror = () => {
    img.onerror = null;
    img.src = "images/fallback.png";
  };
}

/* =========================
   7) 首次載入：若有已選學生與草稿，帶回
   ========================= */
(function boot() {
  const savedIdx = localStorage.getItem("currentIndex");
  if (savedIdx != null) {
    // 同步 Welcome 兩個選單
    seatSelect.value = savedIdx;
    nameSelect.value = savedIdx;
  }
})();
