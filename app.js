const DEFAULT_RECIPIENT = "ontvanger@example.com";
const DEFAULT_SUBJECT = "Ingesproken bericht";

const DOMAIN_CORRECTIONS = [
  ["las apparaat", "lasapparaat"],
  ["las aparaat", "lasapparaat"],
  ["las aparaten", "lasapparaten"],
  ["las apparaten", "lasapparaten"],
  ["las equipment", "las-equipment"],
  ["les equipment", "las-equipment"],
  ["las equipement", "las-equipment"],
  ["mig mag", "MIG/MAG"],
  ["mig-mag", "MIG/MAG"],
  ["mig", "MIG"],
  ["mag lassen", "MAG-lassen"],
  ["tig", "TIG"],
  ["tig lassen", "TIG-lassen"],
  ["electrode lassen", "elektrode lassen"],
  ["elektroden lassen", "elektrode lassen"],
  ["electrode apparaat", "elektrodeapparaat"],
  ["elektrode apparaat", "elektrodeapparaat"],
  ["plasma snijder", "plasmasnijder"],
  ["plasma snijden", "plasmasnijden"],
  ["snij brander", "snijbrander"],
  ["las toorts", "lastoorts"],
  ["las torch", "lastoorts"],
  ["aard kabel", "aardkabel"],
  ["massa kabel", "massakabel"],
  ["massa klem", "massaklem"],
  ["verleng kabel", "verlengkabel"],
  ["kracht stroom", "krachtstroom"],
  ["krachtstroom kabel", "krachtstroomkabel"],
  ["ce stekker", "CEE-stekker"],
  ["cee stekker", "CEE-stekker"],
  ["cee form", "CEE-form"],
  ["verdeel kast", "verdeelkast"],
  ["stroom verdeel kast", "stroomverdeelkast"],
  ["haspel", "kabelhaspel"],
  ["kabel haspel", "kabelhaspel"],
  ["slijp tol", "slijptol"],
  ["haakse slijper", "haakse slijper"],
  ["boor machine", "boormachine"],
  ["accu boor", "accuboormachine"],
  ["slag schroevendraaier", "slagschroevendraaier"],
  ["momentsleutel", "momentsleutel"],
  ["lucht slang", "luchtslang"],
  ["pers lucht", "perslucht"],
  ["compressor", "compressor"],
  ["hydrauliek slang", "hydrauliekslang"],
  ["hijs band", "hijsband"],
  ["hijs banden", "hijsbanden"],
  ["ketting takel", "kettingtakel"],
  ["takel", "takel"],
  ["hef truck", "heftruck"],
  ["hoogwerker", "hoogwerker"],
  ["steiger", "steiger"],
  ["verhuur artikel", "verhuurartikel"],
  ["verhuur artikelen", "verhuurartikelen"],
  ["huur artikel", "huurartikel"],
  ["huur artikelen", "huurartikelen"],
  ["retour melding", "retourmelding"],
  ["werk order", "werkorder"],
  ["project nummer", "projectnummer"],
  ["artikel nummer", "artikelnummer"],
  ["serienummer", "serienummer"],
  ["kalibratie", "kalibratie"],
  ["keurings datum", "keuringsdatum"],
  ["nen drie één vier nul", "NEN 3140"],
  ["nen 3140", "NEN 3140"],
  ["nen drie honderd veertien nul", "NEN 3140"],
  ["atex", "ATEX"],
  ["pbm", "PBM"],
  ["persoonlijke beschermings middelen", "persoonlijke beschermingsmiddelen"],
];

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

const recordButton = document.querySelector("#recordButton");
const recordButtonText = document.querySelector("#recordButtonText");
const recorderPanel = document.querySelector(".recorder-panel");
const statusText = document.querySelector("#statusText");
const supportStatus = document.querySelector("#supportStatus");
const transcriptText = document.querySelector("#transcriptText");
const clearButton = document.querySelector("#clearButton");
const emailButton = document.querySelector("#emailButton");
const recipientEmail = document.querySelector("#recipientEmail");
const emailSubject = document.querySelector("#emailSubject");

let recognition;
let isRecording = false;
let finalTranscript = "";

recipientEmail.value = localStorage.getItem("recipientEmail") || DEFAULT_RECIPIENT;
emailSubject.value = localStorage.getItem("emailSubject") || DEFAULT_SUBJECT;

function setStatus(message, type = "ready") {
  statusText.textContent = message;
  supportStatus.textContent = type === "blocked" ? "Niet ondersteund" : "Klaar";
  supportStatus.className = `status-pill ${type}`;
}

function syncEmailButton() {
  const hasText = transcriptText.value.trim().length > 0;
  const hasRecipient = recipientEmail.value.trim().length > 0;
  emailButton.disabled = !hasText || !hasRecipient;
}

function setRecording(nextRecording) {
  isRecording = nextRecording;
  recordButton.classList.toggle("recording", isRecording);
  recorderPanel.classList.toggle("is-recording", isRecording);
  recordButton.setAttribute("aria-pressed", String(isRecording));
  recordButtonText.textContent = isRecording ? "Stop opname" : "Start opname";
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function preserveCapitalization(original, replacement) {
  if (!original) return replacement;
  if (original === original.toUpperCase()) return replacement.toUpperCase();
  if (original[0] === original[0].toUpperCase()) {
    return `${replacement[0].toUpperCase()}${replacement.slice(1)}`;
  }
  return replacement;
}

function applyDomainCorrections(text) {
  return DOMAIN_CORRECTIONS.reduce((correctedText, [spoken, replacement]) => {
    const pattern = new RegExp(`\\b${escapeRegExp(spoken)}\\b`, "gi");
    return correctedText.replace(pattern, (match) =>
      preserveCapitalization(match, replacement)
    );
  }, text)
    .replace(/\b([A-Z]{2,})\s*\/\s*([A-Z]{2,})\b/g, "$1/$2")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function appendTranscript(text) {
  const cleanText = applyDomainCorrections(text);
  if (!cleanText) return;

  const current = transcriptText.value.trim();
  transcriptText.value = current ? `${current}\n\n${cleanText}` : cleanText;
  transcriptText.focus();
  transcriptText.setSelectionRange(
    transcriptText.value.length,
    transcriptText.value.length
  );
  syncEmailButton();
}

function createRecognition() {
  const instance = new SpeechRecognition();
  instance.lang = "nl-NL";
  instance.continuous = true;
  instance.interimResults = true;
  instance.maxAlternatives = 3;

  instance.onstart = () => {
    finalTranscript = "";
    setRecording(true);
    setStatus("Opname loopt. Druk opnieuw om te stoppen.");
  };

  instance.onresult = (event) => {
    let interimTranscript = "";

    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const result = event.results[index];
      if (result.isFinal) {
        finalTranscript += `${result[0].transcript} `;
      } else {
        interimTranscript += result[0].transcript;
      }
    }

    const preview = interimTranscript.trim();
    statusText.textContent = preview
      ? `Luistert: ${preview}`
      : "Opname loopt. Druk opnieuw om te stoppen.";
  };

  instance.onerror = (event) => {
    setRecording(false);
    if (event.error === "not-allowed") {
      setStatus("Microfoontoegang is geweigerd. Sta microfoon toe in je browser.", "blocked");
      return;
    }

    setStatus(`Opname gestopt: ${event.error}.`, "blocked");
  };

  instance.onend = () => {
    setRecording(false);
    appendTranscript(finalTranscript);
    setStatus("Opname klaar. Vaktermen zijn automatisch gecorrigeerd.");
  };

  return instance;
}

function startRecording() {
  if (!recognition) return;
  finalTranscript = "";
  recognition.start();
}

function stopRecording() {
  if (!recognition) return;
  recognition.stop();
}

function openOutlookDraft() {
  const to = encodeURIComponent(recipientEmail.value.trim());
  const subject = encodeURIComponent(emailSubject.value.trim() || DEFAULT_SUBJECT);
  const body = encodeURIComponent(transcriptText.value.trim()).replace(/%0A/g, "%0D%0A");
  window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
}

if (!SpeechRecognition) {
  recordButton.disabled = true;
  setStatus("Deze browser ondersteunt spraakherkenning niet. Probeer Microsoft Edge of Chrome.", "blocked");
} else {
  recognition = createRecognition();
  setStatus("Klaar om op te nemen.");
}

recordButton.addEventListener("click", () => {
  if (isRecording) {
    stopRecording();
    return;
  }

  startRecording();
});

clearButton.addEventListener("click", () => {
  transcriptText.value = "";
  transcriptText.focus();
  syncEmailButton();
  setStatus("Tekst gewist. Je kunt opnieuw inspreken.");
});

emailButton.addEventListener("click", openOutlookDraft);

transcriptText.addEventListener("input", syncEmailButton);

recipientEmail.addEventListener("input", () => {
  localStorage.setItem("recipientEmail", recipientEmail.value.trim());
  syncEmailButton();
});

emailSubject.addEventListener("input", () => {
  localStorage.setItem("emailSubject", emailSubject.value.trim());
});

syncEmailButton();
