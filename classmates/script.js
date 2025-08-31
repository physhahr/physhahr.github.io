// ===== 學生清單 (座號+姓名) =====
const studentList = [
  "01 余有容", "02 吳羽涵", "03 吳婕寧", "04 呂若妘",
  "05 徐海娜", "06 翁芷妍", "07 黃于瑄", "08 王翊丞",
  "09 丘昊永", "10 李芮安", "11 李德謙", "12 林智鈞",
  "13 張宬睿", "14 張凱鈞", "15 張瀚元", "16 許博安",
  "17 連奕愷", "18 郭桓睿", "19 陳之一", "20 陳光俊",
  "21 陳君岳", "22 陳廷亮", "23 陳邑翰", "24 陳雍澄",
  "25 傅裕家", "26 馮又仁", "27 黃雋凱", "28 廖奕翔",
  "29 蔡臣訓", "30 蔡鼎棋", "31 蔡叡霆", "32 鄭聿倫",
  "33 鄭嘉愷", "34 賴彥勳", "35 賴賢峰", "36 顏楷恩",
  "37 蘇俊與"
];

// 載入學生選單
const studentSelect = document.getElementById("studentSelect");
studentList.forEach(name => {
  let opt = document.createElement("option");
  opt.value = name;
  opt.textContent = name;
  studentSelect.appendChild(opt);
});

document.getElementById("goToStep2").addEventListener("click", () => {
  const student = studentSelect.value;
  localStorage.setItem("currentStudent", student);
  const intro = localStorage.getItem(`intro_${student}`);
  if (intro) {
    showStep(3);
  } else {
    showStep(2);
  }
});

// IG 自動加上 @
document.getElementById("ig").addEventListener("input", e => {
  if (!e.target.value.startsWith("@")) {
    e.target.value = "@" + e.target.value.replace(/^@+/, "");
  }
});

// 表單送出 + 驗證
document.getElementById("introForm").addEventListener("submit", e => {
  e.preventDefault();
  let valid = true;

  const requiredFields = ["dislike", "like", "keywords"];
  requiredFields.forEach(id => {
    const el = document.getElementById(id);
    if (!el.value.trim()) {
      el.classList.add("error");
      valid = false;
    } else {
      el.classList.remove("error");
    }
  });

  if (!valid) return; // 停止

  const student = localStorage.getItem("currentStudent");
  const data = {
    nickname: document.getElementById("nickname").value,
    birthday: document.getElementById("birthday").value,
    dislike: document.getElementById("dislike").value,
    like: document.getElementById("like").value,
    keywords: document.getElementById("keywords").value,
    ig: document.getElementById("ig").value,
    note: document.getElementById("note").value,
  };
  localStorage.setItem(`intro_${student}`, JSON.stringify(data));
  showStep(3);
});

// 顯示步驟
function showStep(num) {
  document.querySelectorAll(".step").forEach(s => s.classList.add("hidden"));
  document.getElementById(`step${num}`).classList.remove("hidden");
}

/* ===== 猜猜我是誰 ===== */
let currentGame = null;
let questionIndex = 0;
let startTime = 0;
let questions = [];

function startGame(mode) {
  currentGame = mode;
  questions = [...studentList];
  shuffleArray(questions);
  questionIndex = 0;
  startTime = Date.now();

  // 進入沉浸模式
  document.getElementById("modeSelect").classList.add("hidden");
  document.getElementById("gameArea").classList.remove("hidden");
  document.getElementById("resultArea").classList.add("hidden");

  loadQuestion();
}

function loadQuestion() {
  if (questionIndex >= questions.length) {
    finishGame();
    return;
  }
  const student = questions[questionIndex];
  const data = JSON.parse(localStorage.getItem(`intro_${student}`) || "{}");
  document.getElementById("gamePrompt").innerText = "";

  // 顯示頭像
  document.getElementById("gameImage").src = `images/${student.replace(" ", "")}.webp`;

  let answerArea = document.getElementById("answerArea");
  answerArea.innerHTML = "";

  if (currentGame === 1) {
    document.getElementById("gamePrompt").innerText = `名字提示：${student}`;
    let input = document.createElement("input");
    input.type = "number";
    input.placeholder = "輸入座號";
    answerArea.appendChild(input);
  } else if (currentGame === 2) {
    let seat = student.split(" ")[0];
    document.getElementById("gamePrompt").innerText = `座號提示：${seat}`;
    let input = document.createElement("input");
    input.type = "text";
    input.placeholder = "輸入名字";
    answerArea.appendChild(input);
  } else if (currentGame === 3) {
    document.getElementById("gamePrompt").innerText = `自介提示：${data.like || "未填寫"}`;
    let select = document.createElement("select");
    studentList.forEach(n => {
      let opt = document.createElement("option");
      opt.value = n;
      opt.textContent = n;
      select.appendChild(opt);
    });
    answerArea.appendChild(select);
  }
}

document.getElementById("submitAnswer").addEventListener("click", () => {
  questionIndex++;
  loadQuestion();
});

function finishGame() {
  let usedTime = (Date.now() - startTime) / 1000;
  document.getElementById("gameArea").classList.add("hidden");
  document.getElementById("resultArea").classList.remove("hidden");
  document.getElementById("resultArea").innerText = 
    currentGame < 3 ? `完成！耗時 ${usedTime} 秒` : "完成！";

  // 回復模式選擇
  document.getElementById("modeSelect").classList.remove("hidden");
}

// 打亂陣列
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
