
const mouth = document.getElementById("mouth");
const instruction = document.getElementById("instruction");
const statusText = document.getElementById("statusText");
const camera = document.getElementById("camera");
const leftPupil = document.querySelector(".left-eye .pupil");
const rightPupil = document.querySelector(".right-eye .pupil");
const robotFace = document.querySelector(".robot-face");
const visitorCountDisplay = document.getElementById("visitorCount");

const GREETING = "Welcome to INSET! Let's learn, explore, and innovate!";
const PERSON_CONFIDENCE = 0.60;
const DETECTION_INTERVAL = 350;
const PERSON_LOST_DELAY = 1800;
const GREETING_COOLDOWN = 4000;

let model = null;
let personPresent = false;
let robotSpeaking = false;
let visitorCount = 0;
let lastGreetingTime = 0;
let lastPersonSeen = 0;
let detectionBusy = false;

function lookAtPerson() {
    if (leftPupil) leftPupil.style.transform = "translate(8px, 5px)";
    if (rightPupil) rightPupil.style.transform = "translate(8px, 5px)";
}

function returnEyesToNormal() {
    if (leftPupil) leftPupil.style.transform = "translate(0, 0)";
    if (rightPupil) rightPupil.style.transform = "translate(0, 0)";
}

function reactToPerson() {
    if (!robotFace) return;
    robotFace.classList.add("person-detected");
    setTimeout(() => robotFace.classList.remove("person-detected"), 700);
}

function startTalking() {
    if (mouth) mouth.classList.add("talking");
}

function stopTalking() {
    if (mouth) mouth.classList.remove("talking");
}

function registerVisitor() {
    visitorCount++;

    if (visitorCountDisplay) {
        visitorCountDisplay.textContent = String(visitorCount).padStart(2, "0");
        visitorCountDisplay.classList.add("updated");

        setTimeout(() => {
            visitorCountDisplay.classList.remove("updated");
        }, 400);
    }
}

function speakGreeting() {
    if (robotSpeaking || !("speechSynthesis" in window)) return;

    const now = Date.now();
    if (now - lastGreetingTime < GREETING_COOLDOWN) return;

    lastGreetingTime = now;
    robotSpeaking = true;

    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(GREETING);
    speech.rate = 0.88;
    speech.pitch = 1.02;
    speech.volume = 1;

    if (statusText) statusText.textContent = "WELCOME — SPEAKING";
    if (instruction) instruction.textContent = "Welcome! Great to see you.";

    startTalking();

    // Word-boundary events help the mouth react to actual speech progress.
    // The CSS animation provides continuous movement between these events.
    speech.onboundary = () => {
        if (mouth) {
            mouth.classList.remove("speech-beat");
            void mouth.offsetWidth;
            mouth.classList.add("speech-beat");
        }
    };

    const finishSpeaking = () => {
        robotSpeaking = false;
        stopTalking();

        if (mouth) mouth.classList.remove("speech-beat");
        if (statusText) statusText.textContent = "AI VISION ACTIVE";
        if (instruction) instruction.textContent = "Ready for the next guest";
    };

    speech.onend = finishSpeaking;
    speech.onerror = finishSpeaking;

    window.speechSynthesis.speak(speech);
}

async function startCamera() {
    try {
        if (!navigator.mediaDevices?.getUserMedia) {
            throw new Error("Camera access is unavailable. Open the website in HTTPS Chrome.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: "user",
                width: { ideal: 480 },
                height: { ideal: 360 },
                frameRate: { ideal: 12, max: 15 }
            },
            audio: false
        });

        camera.srcObject = stream;
        camera.muted = true;
        camera.playsInline = true;

        if (instruction) instruction.textContent = "Camera connected — starting AI vision...";
        if (statusText) statusText.textContent = "LOADING AI MODEL";

        await camera.play();
        await loadAIModel();
    } catch (error) {
        console.error("Camera startup error:", error);
        if (statusText) statusText.textContent = "CAMERA ACCESS REQUIRED";
        if (instruction) instruction.textContent = "Allow camera access in Chrome and reload the page.";
    }
}

async function loadAIModel() {
    try {
        if (instruction) instruction.textContent = "Loading computer vision...";
        if (statusText) statusText.textContent = "LOADING AI MODEL";

        model = await cocoSsd.load({ base: "lite_mobilenet_v2" });

        if (statusText) statusText.textContent = "AI VISION ACTIVE";
        if (instruction) instruction.textContent = "Step closer and meet your AI assistant";

        console.log("AI model loaded.");
        detectPerson();
    } catch (error) {
        console.error("AI model error:", error);
        if (statusText) statusText.textContent = "AI MODEL ERROR";
        if (instruction) instruction.textContent = "Check your internet connection and reload.";
    }
}

async function detectPerson() {
    if (!model || detectionBusy) {
        setTimeout(detectPerson, DETECTION_INTERVAL);
        return;
    }

    detectionBusy = true;

    try {
        const predictions = await model.detect(camera);

        const detected = predictions.some(
            prediction =>
                prediction.class === "person" &&
                prediction.score >= PERSON_CONFIDENCE
        );

        const now = Date.now();

        if (detected) {
            lastPersonSeen = now;
            lookAtPerson();

            if (!personPresent) {
                personPresent = true;
                registerVisitor();
                reactToPerson();

                if (statusText) statusText.textContent = "PERSON DETECTED";
                if (instruction) instruction.textContent = "Hello! I see you.";

                speakGreeting();
            }
        } else if (
            personPresent &&
            now - lastPersonSeen >= PERSON_LOST_DELAY
        ) {
            personPresent = false;
            returnEyesToNormal();

            if (!robotSpeaking) {
                if (statusText) statusText.textContent = "AI VISION ACTIVE";
                if (instruction) instruction.textContent = "Ready for the next guest";
            }
        }
    } catch (error) {
        console.error("Person detection error:", error);
    } finally {
        detectionBusy = false;
        setTimeout(detectPerson, DETECTION_INTERVAL);
    }
}

window.addEventListener("load", () => {
    if (statusText) statusText.textContent = "STARTING AI VISION...";
    if (instruction) instruction.textContent = "Starting camera...";
    startCamera();
});

window.addEventListener("beforeunload", () => {
    if (camera?.srcObject) {
        camera.srcObject.getTracks().forEach(track => track.stop());
    }
    window.speechSynthesis?.cancel();
});
