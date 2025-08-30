// === Données du quizz (exemple) ===
const QUESTIONS = [
  {
    q: "Qui a fondé la New Family ?",
    choices: ["ClaraStoneWall, Nexou31 et Red_Shadow_31", "Squeezie", "Amouranth", "Gotaga"],
    correct: 0
  },
  {
    q: "Notre valeur principale ?",
    choices: ["La compétition", "La bienveillance et l'entraide", "Le drama", "Le nombre d'abonnés"],
    correct: 1
  },
  {
    q: "Où se passe la rencontre 2026 ?",
    choices: ["Disneyland", "PortAventura", "Europa-Park", "Walibi"],
    correct: 1
  }
];

const DURATION = 20; // secondes par question

// === Etat ===
let index = 0;
let score = 0;
let timer = DURATION;
let interval = null;
const answersGiven = []; // {q, selected, isCorrect, timeLeft}

// === DOM ===
const elQTitle = document.getElementById("q-title");
const elTimer  = document.getElementById("timer");
const elBar    = document.getElementById("bar");
const elQ      = document.getElementById("question");
const elAns    = document.getElementById("answers");
const btnSkip  = document.getElementById("skip");
const btnNext  = document.getElementById("next");
const boxQuiz  = document.getElementById("quiz");
const boxRes   = document.getElementById("result");
const elScore  = document.getElementById("score-badge");
const elRecap  = document.getElementById("recap");
const formSend = document.getElementById("send-form");
const elPlayer = document.getElementById("player");

// === Affichage ===
function renderQuestion() {
  const total = QUESTIONS.length;
  const q = QUESTIONS[index];

  elQTitle.textContent = `Question ${index+1}/${total}`;
  elQ.textContent = q.q;
  elAns.innerHTML = "";
  btnNext.classList.add("hidden");

  q.choices.forEach((label, i) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.addEventListener("click", () => pickAnswer(i));
    elAns.appendChild(b);
  });

  // timer
  resetTimer();
}

function resetTimer() {
  clearInterval(interval);
  timer = DURATION;
  elTimer.textContent = timer;
  elBar.style.width = "0%";
  interval = setInterval(() => {
    timer -= 1;
    elTimer.textContent = timer;
    elBar.style.width = `${100 * (1 - (timer / DURATION))}%`;
    if (timer <= 0) {
      clearInterval(interval);
      lockQuestion(null); // pas de réponse
    }
  }, 1000);
}

function pickAnswer(i) {
  // si déjà répondu, ignore
  if (btnNext.classList.contains("hidden") === false) return;
  lockQuestion(i);
}

function lockQuestion(selectedIndex) {
  clearInterval(interval);
  const q = QUESTIONS[index];
  const buttons = [...elAns.querySelectorAll("button")];

  buttons.forEach((b, i) => {
    b.disabled = true;
    if (i === q.correct) b.classList.add("correct");
    if (selectedIndex !== null && i === selectedIndex && i !== q.correct) {
      b.classList.add("wrong");
    }
  });

  const isCorrect = selectedIndex === q.correct;
  if (isCorrect) score += 1;

  answersGiven.push({
    q: q.q,
    selected: selectedIndex,
    isCorrect,
    timeLeft: timer
  });

  btnNext.classList.remove("hidden");
}

// === Navigation ===
btnSkip.addEventListener("click", () => lockQuestion(null));
btnNext.addEventListener("click", () => {
  index += 1;
  if (index < QUESTIONS.length) {
    renderQuestion();
  } else {
    showResult();
  }
});

function showResult() {
  boxQuiz.classList.add("hidden");
  boxRes.classList.remove("hidden");
  elScore.textContent = `${score}/${QUESTIONS.length}`;

  // recap court
  elRecap.innerHTML = answersGiven
    .map((a, idx) => {
      const ch = QUESTIONS[idx].choices[a.selected] ?? "—";
      return `<p><strong>Q${idx+1}.</strong> ${QUESTIONS[idx].q}<br>
      <span style="color:${a.isCorrect ? '#2e7d32':'#b71c1c'}">${a.isCorrect ? "✔️ Bonne réponse":"❌ Mauvaise réponse"}</span>
      <span class="muted"> • (${a.timeLeft}s restantes)</span><br>
      <span class="muted">Ta réponse : ${ch}</span></p>`;
    }).join("");
}

// === Envoi côté serveur (Netlify Function) ===
formSend.addEventListener("submit", async (e) => {
  e.preventDefault();
  formSend.classList.add("muted");
  const payload = {
    player: elPlayer.value.trim() || null,
    score,
    total: QUESTIONS.length,
    answers: answersGiven,
    at: new Date().toISOString()
  };
  try {
    const res = await fetch("/.netlify/functions/quizSubmit", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error("submit failed");
    formSend.innerHTML = "✅ Score envoyé, merci !";
  } catch (err) {
    console.error(err);
    formSend.innerHTML = "⚠️ Impossible d’envoyer le score (réessaie plus tard).";
  }
});

// Go
renderQuestion();
