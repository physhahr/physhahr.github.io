const studentList = [];
for (let i = 1; i <= 37; i++) {
  let num = i.toString().padStart(2, "0");
  studentList.push(`${num} 同學${i}`);
}

// 預載學生清單
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

// 自我介紹儲存
document.getElementById("introForm").addEventListener("submit", e => {
  e.preventDefault();
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
}

// 打亂陣列
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
