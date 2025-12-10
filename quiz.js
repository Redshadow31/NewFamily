// ====== Options ======
const DURATION = 20;                 // secondes par question
const SHUFFLE_QUESTIONS = true;      // mélanger l'ordre des questions
const SHUFFLE_CHOICES   = true;      // mélanger les choix

// ====== Données brutes avec ✅ devant la bonne réponse ======
const RAW_SECTIONS = [
  {
    cat: "A. Origines & Dates",
    items: [
      { q: "En quelle année TENF a-t-il été créé ?", choices: ["2050","2018","✅ 2024","2023"] },
      { q: "Que signifie l’acronyme TENF ?", choices: ["Tacos Extra Nachos Fromage","✅ Twitch Entraide New Family","Tu Énerves Nos Fondateurs","Tous Ensemble Nos Forces"] },
      { q: "Combien de fondateurs ont lancé TENF ?", choices: ["0 il a pop tout seul !","✅ 3","12","2"] },
      { q: "Quel réseau social a fortement boosté les arrivées ?", choices: ["✅ TikTok","Instagram","Minitel","Skyblog"] },
      { q: "Quelle ville est mentionnée pour le voyage communautaire ?", choices: ["Ibiza","✅ L’Ametlla de Mar","Barcelone","Toulouse"] },
      { q: "Quel mois a lieu l’anniversaire du serveur ?", choices: ["Juin","Avril","✅ Septembre","Décembre"] }
    ]
  },
  {
    cat: "B. Fonctionnement & Règles",
    items: [
      { q: "Que faut-il faire pour s’intégrer complètement après l’arrivée ?", choices: ["Offrir un kebab à Clara","✅ Assister à une réunion d’intégration","Demander son rôle en MP","Rester actif une semaine sans rien dire"] },
      { q: "Quelle est la commande pour le bonus quotidien ?", choices: ["/cadeau","/points","✅ /journalier","/abracadabra"] },
      { q: "Où poster la preuve d’un follow Insta/TikTok ?", choices: ["Sur un pigeon voyageur","✅ Dans #preuves-réseaux","Dans #spam","En message privé au staff"] },
      { q: "Combien de live gagnants par mois peut-on demander ?", choices: ["7","Vers l’infini et au-delà","4","✅ 1"] },
      { q: "Quelle action donne 500 pts tous les 3 niveaux ?", choices: ["Réciter l’alphabet à l’envers","✅ Monter en exp","Réagir avec des emojis en boucle","Vendre son âme au bot"] },
      { q: "Quel rôle est conçu pour les streamers mineurs ?", choices: ["Streamer en couches","✅ Créateur Junior","Créateur Affilié","P’tit Chou"] },
      { q: "Quelle règle est expliquée en douceur en réunion d’intégration ?", choices: ["✅ Suivre toutes les chaînes","Ne pas spammer Clara à 3h du matin","Toujours rire aux blagues de Nexou","Toujours applaudir Clara"] },
      { q: "Qui valide les récompenses boutique ?", choices: ["✅ Les modérateurs ou admins","La roue de la fortune","Jeff Bezos","Le bot"] }
    ]
  },
  {
    cat: "C. Événements & Activités",
    items: [
      { q: "Quel événement a lieu le lundi ?", choices: ["✅ Ciné Clara","Soirée Sims","Lâcher de licornes","Blind Test"] },
      { q: "Quel est l’événement le plus prisé par les membres ?", choices: ["Mariokart IRL sur autoroute","✅ Apéro Discord","Blind Test","Réunion staff"] },
      { q: "Combien de temps est recommandé pour un Live gagnant ?", choices: ["✅ 2 heures","1 heure","30 secondes","24 heures"] },
      { q: "Quelle activité a été ajoutée via la boutique avec Clara ?", choices: ["Karaoké imposé","✅ Interview","Séance psy gratuite","Feedback visuel"] },
      { q: "Quel est le but de la Boost Live Team ?", choices: ["Lancer une secte de streamers","✅ S’entraider et se faire des retours","Dominer le monde","Tester de nouveaux jeux"] },
      { q: "Quelle est la durée maximale d’un rôle VIP acheté en boutique ?", choices: ["✅ 1 semaine","1 an","48h chrono","1 jour"] },
      { q: "À quelle heure finissent généralement les apéros ?", choices: ["Quand les chips sont finies","✅ À pas d’heure","Minuit","Quand le bot s’endort"] },
      { q: "Quel jeu n’est pas régulier dans les jeux communautaires TENF ?", choices: ["✅ Peppa Pig","Call of Duty","Fortnite","Mario Kart 8"] },
      { q: "Comment sont récompensés les gagnants de quizz ou jeux ?", choices: ["Une pizza offerte par Nexou","200 points","✅ 500 points","Un câlin virtuel de Red"] },
      { q: "Combien de réunions d’intégration ont lieu par semaine ?", choices: ["✅ 3","Uniquement quand la lune est pleine","1 par mois","7"] }
    ]
  },
  {
    cat: "D. Le Staff TENF",
    items: [
      { q: "Quel membre du staff s’endort parfois en réunion ?", choices: ["✅ TheDark_Sand","Jenny31200","Bob l’Éponge","Red_Shadow_31"] },
      { q: "Qui parmi les fondateurs aime tourner les dramas en mode RP ?", choices: ["Batman","✅ Clara","Red","Un lama"] },
      { q: "Qui coupe souvent son micro et parle via celui de Red ?", choices: ["Dark Vador","✅ Nexou","Saiko","Clara"] },
      { q: "Qui s’est déjà assoupi plusieurs fois en vocal général ?", choices: ["Gilbert","Dora l’exploratrice","✅ Jenny31200","Saiko"] },
      { q: "Qui a rejoint comme admin adjoint aux côtés de Selena ?", choices: ["Mahyurah","Shrek","✅ Nangel","Yaya"] },
      { q: "Parmi ces modérateurs, qui est fan de Pokémon et Yu-Gi-Oh ?", choices: ["✅ TheDark_Sand","Doraemon","Livio","Sangoku"] },
      { q: "Qui est connu pour être très actif sur Disney Dreamlight Valley ?", choices: ["✅ LeviaCarpe","Olaf","Jenny","Livio"] },
      { q: "Complète la phrase : “TENF, c’est avant tout _____.”", choices: ["Un élevage de licornes","✅ Une famille","Des dramas","Apéro"] }
    ]
  },
  {
    cat: "E. Croissance & Chiffres",
    items: [
      { q: "Combien de membres actifs au dernier bilan ?", choices: ["✅ 134","500","300","100"] },
      { q: "Combien de membres au total environ aujourd’hui ?", choices: ["✅ 377","500","250","300"] },
      { q: "Combien de nouveaux membres rejoignent en moyenne chaque jour ?", choices: ["4–5","✅ 2–3","0 (personne n’aime les serveurs Discord)","1"] },
      { q: "En quelle année est prévu le voyage PortAventura ?", choices: ["✅ 2026","2025","2077","2027"] },
      { q: "Combien de jours doit durer ce voyage ?", choices: ["3 jours","15 jours de camping sauvage","✅ 5–7 jours","1h chrono"] }
    ]
  },
  {
    cat: "F. Divers / Anecdotes",
    items: [
      { q: "Quel site officiel TENF affiche les lives des membres ?", choices: ["✅ NewFamily.app.netlify","Doctissimo.fr","OnlyFans.fr","TENF.fr"] },
      { q: "Quels rôles n’ont pas accès aux salons de promotion ?", choices: ["Fantômes invisibles","Membres actifs","✅ Communauté","VIP"] },
      { q: "Quelle valeur est mise en avant dans tous les textes TENF ?", choices: ["✅ La bienveillance","Le fun","La performance","La dictature des chats"] }
    ]
  }
];

// ====== Utilitaires ======
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function parseChoices(rawChoices) {
  // Détecte ✅ et renvoie {choices:[...], correct:index}
  let correctIndex = -1;
  const cleaned = rawChoices.map((c, i) => {
    const m = c.match(/^\s*✅\s*(.*)$/u);
    if (m) { correctIndex = i; return m[1]; }
    return c;
  });
  if (correctIndex === -1) {
    console.warn("Question sans ✅ détecté :", rawChoices);
    correctIndex = 0;
  }
  return { choices: cleaned, correct: correctIndex };
}
function buildQuestions(rawSections) {
  const out = [];
  rawSections.forEach(sec => {
    sec.items.forEach(it => {
      const { choices, correct } = parseChoices(it.choices);
      let finalChoices = choices, finalCorrect = correct;
      if (SHUFFLE_CHOICES) {
        const paired = choices.map((label, i) => ({ label, ok: i === correct }));
        const mixed  = shuffle(paired);
        finalChoices = mixed.map(x => x.label);
        finalCorrect = mixed.findIndex(x => x.ok);
      }
      out.push({ q: it.q, choices: finalChoices, correct: finalCorrect, category: sec.cat });
    });
  });
  return SHUFFLE_QUESTIONS ? shuffle(out) : out;
}

// ====== État ======
const QUESTIONS = buildQuestions(RAW_SECTIONS);
let index = 0, score = 0, timer = DURATION, interval = null;
const answersGiven = []; // {q, category, selected, isCorrect, timeLeft}

// ====== DOM ======
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

// Sécurité : vérifier que les éléments existent
if (!elQ || !elAns) {
  console.error("Quiz: éléments DOM manquants (question/answers). Vérifie les IDs dans le HTML.");
}

// ====== Rendu ======
function renderQuestion() {
  const total = QUESTIONS.length;
  const q = QUESTIONS[index];

  elQTitle.textContent = `${q.category} — Question ${index+1}/${total}`;
  elQ.textContent = q.q;
  elAns.innerHTML = "";
  btnNext.classList.add("hidden");

  q.choices.forEach((label, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = `${String.fromCharCode(65+i)}) ${label}`; // A) B) C) D)
    b.addEventListener("click", () => pickAnswer(i));
    elAns.appendChild(b);
  });

  resetTimer();
}

function resetTimer() {
  clearInterval(interval);
  timer = DURATION;
  elTimer.textContent = timer;
  elBar.style.width = "0%";
  interval = setInterval(() => {
    timer -= 1;
    elTimer.textContent = Math.max(0, timer);
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
    category: q.category,
    selected: selectedIndex,
    isCorrect,
    timeLeft: Math.max(0, timer)
  });

  btnNext.classList.remove("hidden");
}

// ====== Navigation ======
btnSkip.addEventListener("click", () => lockQuestion(null));
btnNext.addEventListener("click", () => {
  index += 1;
  if (index < QUESTIONS.length) {
    renderQuestion();
  } else {
    showResult();
  }
});

// ====== Résultat ======
function showResult() {
  boxQuiz.classList.add("hidden");
  boxRes.classList.remove("hidden");
  elScore.textContent = `${score}/${QUESTIONS.length}`;

  elRecap.innerHTML = answersGiven
    .map((a, idx) => {
      const q = QUESTIONS[idx];
      const chosen = (a.selected !== null && a.selected !== undefined)
        ? q.choices[a.selected] ?? "—"
        : "—";
      const correctLabel = q.choices[q.correct];
      return `<p>
        <strong>${q.category}</strong><br>
        <strong>Q${idx+1}.</strong> ${q.q}<br>
        <span style="color:${a.isCorrect ? '#2e7d32':'#b71c1c'}">
          ${a.isCorrect ? "✔️ Bonne réponse" : "❌ Mauvaise réponse"}
        </span>
        <span class="muted"> • (${a.timeLeft}s restantes)</span><br>
        <span class="muted">Ta réponse : ${chosen}</span><br>
        <span class="muted">Bonne réponse : ${correctLabel}</span>
      </p>`;
    }).join("");
}

// ====== Envoi Netlify Function ======
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

// ====== Lancement ======
document.addEventListener("DOMContentLoaded", () => {
  if (!Array.isArray(QUESTIONS) || QUESTIONS.length === 0) {
    console.error("Aucune question chargée.");
    elQ.textContent = "Aucune question disponible.";
    return;
    }
  renderQuestion();
});
