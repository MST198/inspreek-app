const DEFAULT_RECIPIENT = "ontvanger@example.com";
const DEFAULT_SUBJECT = "Ingesproken bericht";

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

function appendTranscript(text) {
  const cleanText = text.trim();
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
    setStatus("Opname klaar. Je kunt de tekst aanpassen of mailen.");
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
  const body = encodeURIComponent(transcriptText.value.trim());
  const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${to}&subject=${subject}&body=${body}`;
  window.open(outlookUrl, "_blank", "noopener,noreferrer");
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
