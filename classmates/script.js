// script.js (module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase, ref, set, get, child, push, query,
  orderByChild, limitToFirst, onValue, update
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

/* =======================
   0) Firebase 設定 (請替換為你自己的設定)
   ======================= */
const firebaseConfig = {
  apiKey: "AIzaSyCgDcftkWaQu8tcdqKhog_Omzmlc6aXwDQ",
  authDomain: "classmates-a4344.firebaseapp.com",
  databaseURL: "https://classmates-a4344-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "classmates-a4344",
  storageBucket: "classmates-a4344.firebasestorage.app",
  messagingSenderId: "817844262053",
  appId: "1:817844262053:web:55864c83761ea006f4294c",
  measurementId: "G-VL3ESY2XJ3"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/* =======================
   1) 座號與姓名兩個清單（互相對應）
   ======================= */
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

const fullList = seatNumbers.map((_, i) => `${seatNumbers[i]} ${studentNames[i]}`);

/* =======================
   DOM references
   ======================= */
const seatSelect = document.getElementById("seatSelect");
const nameSelect = document.getElementById("nameSelect");
const goToStep2 = document.getElementById("goToStep2");
const stepEls = document.querySelectorAll(".step");

const fields = {
  nickname: document.getElementById("nickname"),
  birthday: document.getElementById("birthday"),
  dislike: document.getElementById("dislike"),
  like: document.getElementById("like"),
  keywords: document.getElementById("keywords"),
  ig: document.getElementById("ig"),
  note: document.getElementById("note"),
};

const introForm = document.getElementById("introForm");
const modeSelect = document.getElementById("modeSelect");
const gameArea = document.getElementById("gameArea");
const gamePrompt = document.getElementById("gamePrompt");
const answerArea = document.getElementById("answerArea");
const submitAnswerBtn = document.getElementById("submitAnswer");
const giveUpBtn = document.getElementById("giveUp");
const resultArea = document.getElementById("resultArea");
const lb1 = document.getElementById("lb1");
const lb2 = document.getElementById("lb2");

/* =======================
   init welcome selects
   ======================= */
function initWelcomeSelects() {
  seatNumbers.forEach((s, i) => {
    const o = document.createElement("option"); o.value = i; o.textContent = s; seatSelect.appendChild(o);
  });
  studentNames.forEach((n, i) => {
    const o = document.createElement("option"); o.value = i; o.textContent = n; nameSelect.appendChild(o);
  });
  seatSelect.value = "0"; nameSelect.value = "0";

  seatSelect.addEventListener("change", () => { nameSelect.value = seatSelect.value; });
  nameSelect.addEventListener("change", () => { seatSelect.value = nameSelect.value; });
}
initWelcomeSelects();

/* =======================
   show step
   ======================= */
function showStep(n) {
  stepEls.forEach(s => s.classList.add("hidden"));
  document.getElementById(`step${n}`).classList.remove("hidden");
}

/* =======================
   helper: current index
   ======================= */
function currentIndex() { return parseInt(seatSelect.value, 10); }

/* =======================
   Local cache (fallback)
   ======================= */
function localKey(idx){ return `intro_local_${idx}`; }
function saveLocal(idx, data){ localStorage.setItem(localKey(idx), JSON.stringify(data)); }
function loadLocal(idx){ const r = localStorage.getItem(localKey(idx)); return r ? JSON.parse(r) : null; }

/* =======================
   Firebase helpers: save/load introductions
   path: /introductions/{idx}
   ======================= */
async function saveIntroToDB(idx, data){
  try{
    await set(ref(db, `introductions/${idx}`), {
      ...data,
      updatedAt: Date.now()
    });
    // also save local cache
    saveLocal(idx, data);
    return true;
  }catch(err){
    console.warn("DB save failed, saved locally", err);
    saveLocal(idx, data);
    return false;
  }
}

async function loadIntroFromDB(idx){
  try{
    const snap = await get(child(ref(db), `introductions/${idx}`));
    if (snap.exists()) return snap.val();
    return null;
  }catch(err){
    console.warn("DB load failed, fallback to local", err);
    return loadLocal(idx);
  }
}

/* =======================
   auto-save draft (debounce)
   ======================= */
let draftTimer = null;
function saveIntroDraft() {
  const idx = parseInt(localStorage.getItem("currentIndex") ?? currentIndex(), 10);
  const data = {
    nickname: fields.nickname.value.trim(),
    birthday: fields.birthday.value.trim(),
    dislike: fields.dislike.value.trim(),
    like: fields.like.value.trim(),
    keywords: fields.keywords.value.trim(),
    ig: fields.ig.value.trim(),
    note: fields.note.value.trim()
  };
  // debounce to avoid too many writes
  if (draftTimer) clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    // first try DB, if fails stored locally in function
    saveIntroToDB(idx, data);
  }, 600);
}

/* input listeners (IG auto @ and live validation) */
fields.ig.addEventListener("input", (e)=>{
  const v = e.target.value.replace(/\s+/g,"");
  e.target.value = v.startsWith("@") ? v : ("@" + v.replace(/^@+/, ""));
  saveIntroDraft();
});
Object.values(fields).forEach(el=>{
  el.addEventListener("input", ()=>{
    saveIntroDraft();
    if (["dislike","like","keywords"].includes(el.id)) {
      toggleError(el, !el.value.trim());
    }
    if (el.id==="birthday" && el.value.trim()!=="") {
      toggleError(el, !isValidDate(el.value.trim()));
    }
  });
});

/* birthday validation yyyy/mm/dd */
function isValidDate(str){
  const m = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(str);
  if(!m) return false;
  const y=+m[1], mo=+m[2], d=+m[3];
  const dt = new Date(`${y}-${m[2]}-${m[3]}`);
  return dt.getFullYear()===y && (dt.getMonth()+1)===mo && dt.getDate()===d;
}
function toggleError(el, isErr){
  el.classList.toggle("error", !!isErr);
  el.classList.toggle("ok", !isErr && el.value.trim()!=="");
}

/* fill intro form from DB/local */
async function fillIntroForm(data){
  const d = data || {};
  fields.nickname.value = d.nickname||"";
  fields.birthday.value = d.birthday||"";
  fields.dislike.value = d.dislike||"";
  fields.like.value = d.like||"";
  fields.keywords.value = d.keywords||"";
  fields.ig.value = d.ig||"";
  fields.note.value = d.note||"";

  ["dislike","like","keywords","birthday"].forEach(id=>{
    const el = fields[id];
    if(id==="birthday" && el.value.trim()!==""){
      toggleError(el, !isValidDate(el.value.trim()));
    } else if (id!=="birthday") {
      toggleError(el, !el.value.trim());
    }
  });
}

/* =======================
   Step1 -> Step2 logic (restore draft)
   ======================= */
goToStep2.addEventListener("click", async ()=>{
  const idx = currentIndex();
  localStorage.setItem("currentIndex", String(idx));
  // try DB then local
  const intro = await loadIntroFromDB(idx) || loadLocal(idx);
  await fillIntroForm(intro);
  // if already filled required fields -> go Step3
  if (intro && intro.dislike && intro.like && intro.keywords) {
    showStep(3);
    initLeaderboardListeners();
    loadLeaderboardsUI();
  } else {
    showStep(2);
  }
});

/* submit form */
introForm.addEventListener("submit", async (e)=>{
  e.preventDefault();
  let ok = true;
  ["dislike","like","keywords"].forEach(id=>{
    const el = fields[id];
    const empty = !el.value.trim();
    toggleError(el, empty);
    ok = ok && !empty;
  });
  if (fields.birthday.value.trim()!=="") {
    const bad = !isValidDate(fields.birthday.value.trim());
    toggleError(fields.birthday, bad);
    ok = ok && !bad;
  } else fields.birthday.classList.remove("error");

  if(!ok) return;

  const idx = parseInt(localStorage.getItem("currentIndex") ?? currentIndex(), 10);
  const data = {
    nickname: fields.nickname.value.trim(),
    birthday: fields.birthday.value.trim(),
    dislike: fields.dislike.value.trim(),
    like: fields.like.value.trim(),
    keywords: fields.keywords.value.trim(),
    ig: fields.ig.value.trim(),
    note: fields.note.value.trim()
  };
  await saveIntroToDB(idx, data);
  showStep(3);
  initLeaderboardListeners();
  loadLeaderboardsUI();
});

/* =======================
   Game logic (沉浸式、答錯不過、不進下一題、綠紅框反饋)
   ======================= */
const imgWebp = document.getElementById("imgWebp");
const imgJpg = document.getElementById("imgJpg");
const imgTag = document.getElementById("gameImage");
let currentGame = null;
let order = [];
let qIndex = 0;
let startTime = 0;

modeSelect.addEventListener("click", (e)=>{
  const btn = e.target.closest("button[data-mode]");
  if(!btn) return;
  startGame(parseInt(btn.dataset.mode,10));
});

function startGame(mode){
  currentGame = mode;
  order = seatNumbers.map((_,i)=>i);
  shuffle(order);
  qIndex = 0;
  startTime = Date.now();

  modeSelect.classList.add("hidden");
  gameArea.classList.remove("hidden");
  resultArea.classList.add("hidden");
  loadQuestion();
}

async function loadQuestion(){
  if(qIndex >= order.length){
    await finishGame();
    return;
  }
  const idx = order[qIndex];
  const seat = seatNumbers[idx];
  const name = studentNames[idx];
  const intro = (await loadIntroFromDB(idx)) || loadLocal(idx) || {};

  let tip = "";
  if (currentGame === 1) {
    tip = `名字提示：${seat} ${name}` + (intro && (intro.like||intro.dislike||intro.keywords) ? `\n\n（自介：${intro.like||intro.dislike||intro.keywords}）` : "");
  } else if (currentGame === 2) {
    tip = `座號提示：${seat}` + (intro && (intro.like||intro.dislike||intro.keywords) ? `\n\n（自介：${intro.like||intro.dislike||intro.keywords}）` : "");
  } else {
    const s = composeIntroSnippet(intro);
    tip = `自介提示：${s || "（尚未填寫）"}`;
  }
  gamePrompt.textContent = tip;

  // avatar sources (webp -> jpg -> png fallback)
  setAvatarSources(seat, name);

  // answer input
  answerArea.innerHTML = "";
  let inputEl;
  if (currentGame === 1) {
    inputEl = document.createElement("input");
    inputEl.type = "text";
    inputEl.inputMode = "numeric";
    inputEl.placeholder = "輸入座號（可 1 或 01）";
    inputEl.className = "input";
  } else if (currentGame === 2) {
    inputEl = document.createElement("input");
    inputEl.type = "text";
    inputEl.placeholder = "輸入姓名";
    inputEl.className = "input";
  } else {
    inputEl = document.createElement("select");
    inputEl.className = "input";
    fullList.forEach((label,i)=>{
      const opt = document.createElement("option"); opt.value = i; opt.textContent = label; inputEl.appendChild(opt);
    });
  }
  inputEl.id = "answerInput";
  answerArea.appendChild(inputEl);
  inputEl.classList.remove("error"); inputEl.classList.add("ok");
  inputEl.focus();

  inputEl.addEventListener("keydown", (ev)=>{
    if(ev.key === "Enter"){ ev.preventDefault(); submitAnswerBtn.click(); }
  });
}

submitAnswerBtn.addEventListener("click", async ()=>{
  const idx = order[qIndex];
  const seat = seatNumbers[idx];
  const name = studentNames[idx];
  const ansEl = document.getElementById("answerInput");
  let correct = false;

  if (currentGame === 1) {
    const raw = (ansEl.value||"").trim();
    const parsed = parseInt(raw,10);
    const norm = isNaN(parsed) ? "" : String(parsed).padStart(2,"0");
    correct = (norm === seat);
  } else if (currentGame === 2) {
    const raw = (ansEl.value||"").trim();
    correct = (raw === name);
  } else {
    const chosen = parseInt(ansEl.value,10);
    correct = (chosen === idx);
  }

  if (!correct) {
    ansEl.classList.remove("ok"); ansEl.classList.add("error");
    ansEl.animate([{transform:"translateX(0)"},{transform:"translateX(-6px)"},{transform:"translateX(6px)"},{transform:"translateX(0)"}], {duration:180, easing:"ease-out"});
    return;
  }

  // 答對 -> 綠框 -> 下一題
  ansEl.classList.remove("error"); ansEl.classList.add("ok");
  qIndex++;
  loadQuestion();
});

async function finishGame(){
  const usedSec = Math.round((Date.now() - startTime) / 1000);
  gameArea.classList.add("hidden");
  resultArea.classList.remove("hidden");
  resultArea.textContent = (currentGame < 3) ? `完成！耗時 ${usedSec} 秒` : "完成！";

  // 若是玩法1或2，把成績存入 leaderboards
  if (currentGame === 1 || currentGame === 2) {
    const mode = currentGame;
    const idx = parseInt(localStorage.getItem("currentIndex") ?? currentIndex(), 10);
    const payload = {
      idx, name: studentNames[idx], seat: seatNumbers[idx], time: usedSec, ts: Date.now()
    };
    try {
      await push(ref(db, `leaderboards/mode${mode}`), payload);
    } catch (err) {
      console.warn("push leaderboard failed", err);
    }
    loadLeaderboardsUI();
  }

  // restore UI
  modeSelect.classList.remove("hidden");
}

/* =======================
   Leaderboard UI: 顯示前5名（按 time 升冪）
   ======================= */
async function loadLeaderboardsUI(){
  // mode1
  try {
    const q1 = query(ref(db, "leaderboards/mode1"), orderByChild("time"), limitToFirst(5));
    const snap1 = await get(q1);
    renderLB(snap1, lb1, "玩法一 (名字→座號)");
  } catch (e) {
    // fallback: no data
    lb1.innerHTML = `<h4>玩法一</h4><ol><li>無資料</li></ol>`;
  }

  try {
    const q2 = query(ref(db, "leaderboards/mode2"), orderByChild("time"), limitToFirst(5));
    const snap2 = await get(q2);
    renderLB(snap2, lb2, "玩法二 (座號→名字)");
  } catch (e) {
    lb2.innerHTML = `<h4>玩法二</h4><ol><li>無資料</li></ol>`;
  }
}

function renderLB(snap, container, title){
  container.innerHTML = "";
  const h = document.createElement("h4"); h.textContent = title; container.appendChild(h);
  const ol = document.createElement("ol");
  if(!snap.exists()){
    ol.innerHTML = "<li>無資料</li>";
  } else {
    const arr = [];
    snap.forEach(s=>{
      arr.push(s.val());
    });
    // arr already ordered by time asc due to query
    arr.slice(0,5).forEach((it)=> {
      const li = document.createElement("li");
      li.textContent = `${it.seat} ${it.name} — ${it.time} 秒`;
      ol.appendChild(li);
    });
  }
  container.appendChild(ol);
}

/* attach live listeners to keep LB updated (optional) */
function initLeaderboardListeners(){
  // keep it simple: when any leaderboard changes, refresh UI
  onValue(ref(db, "leaderboards/mode1"), ()=>loadLeaderboardsUI());
  onValue(ref(db, "leaderboards/mode2"), ()=>loadLeaderboardsUI());
}

/* avatar loader tries webp -> jpg -> png -> fallback */
function setAvatarSources(seat, name){
  const base = `images/${seat}${name}`;
  const webpSrc = `${base}.webp`;
  const jpgSrc = `${base}.jpg`;
  const pngSrc = `${base}.png`;
  const img = document.getElementById("gameImage");
  const tryLoad = (srcs, idx=0) => {
    if(idx>=srcs.length){ img.src = "images/fallback.png"; return; }
    img.src = srcs[idx];
    img.onerror = ()=> tryLoad(srcs, idx+1);
  };
  tryLoad([webpSrc, jpgSrc, pngSrc]);
}

/* tiny util */
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }

/* compose intro snippet */
function composeIntroSnippet(d){
  if(!d) return "";
  const parts = [];
  if(d.nickname) parts.push(`暱稱:${d.nickname}`);
  if(d.like) parts.push(`喜歡:${d.like}`);
  if(d.dislike) parts.push(`討厭:${d.dislike}`);
  if(d.keywords) parts.push(`關鍵字:${d.keywords}`);
  return parts.join(" | ");
}

/* =======================
   On boot: restore selected student if any
   ======================= */
(function boot(){
  const savedIdx = localStorage.getItem("currentIndex");
  if(savedIdx!=null){
    seatSelect.value = savedIdx; nameSelect.value = savedIdx;
  }
  // load leaderboards on boot
  loadLeaderboardsUI();
})();
