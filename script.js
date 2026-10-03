// ============================================
// INSET AI WELCOME ROBOT
// COMPUTER VISION + EXPRESSIVE ROBOT
// VISITOR COUNTER
// ============================================


// ============================================
// ROBOT ELEMENTS
// ============================================

const mouth =
    document.getElementById("mouth");


const instruction =
    document.getElementById("instruction");


const statusText =
    document.getElementById("statusText");


const camera =
    document.getElementById("camera");


const leftPupil =
    document.querySelector(
        ".left-eye .pupil"
    );


const rightPupil =
    document.querySelector(
        ".right-eye .pupil"
    );


const robotFace =
    document.querySelector(
        ".robot-face"
    );


const visitorCountDisplay =
    document.getElementById(
        "visitorCount"
    );


// ============================================
// SETTINGS
// ============================================

const GREETING =
    "Welcome to INSET! Let's learn, explore, and innovate!";


// Person detection confidence

const PERSON_CONFIDENCE =
    0.60;


// ============================================
// AI MODEL
// ============================================

let model = null;


// ============================================
// PERSON STATE
// ============================================

let personPresent = false;


// ============================================
// ROBOT SPEAKING STATE
// ============================================

let robotSpeaking = false;


// ============================================
// VISITOR COUNTER
// ============================================

let visitorCount = 0;


// ============================================
// EYE MOVEMENT
// ============================================

function lookAtPerson() {

    leftPupil.style.transform =
        "translate(8px, 5px)";


    rightPupil.style.transform =
        "translate(8px, 5px)";

}


// ============================================
// RETURN EYES TO NORMAL
// ============================================

function returnEyesToNormal() {

    leftPupil.style.transform =
        "translate(0px, 0px)";


    rightPupil.style.transform =
        "translate(0px, 0px)";

}


// ============================================
// ROBOT DETECTION REACTION
// ============================================

function reactToPerson() {

    robotFace.classList.add(
        "person-detected"
    );


    setTimeout(() => {

        robotFace.classList.remove(
            "person-detected"
        );

    }, 900);

}


// ============================================
// TALKING ANIMATION
// ============================================

function startTalking() {

    mouth.classList.add(
        "talking"
    );

}


// ============================================
// STOP TALKING ANIMATION
// ============================================

function stopTalking() {

    mouth.classList.remove(
        "talking"
    );

}


// ============================================
// REGISTER VISITOR
// ============================================

function registerVisitor() {

    visitorCount++;


    visitorCountDisplay.textContent =
        String(visitorCount).padStart(
            2,
            "0"
        );


    visitorCountDisplay.classList.add(
        "updated"
    );


    setTimeout(() => {

        visitorCountDisplay.classList.remove(
            "updated"
        );

    }, 500);

}


// ============================================
// SPEAK GREETING
// ============================================

function speakGreeting() {

    if (robotSpeaking) {

        return;

    }


    robotSpeaking = true;


    window.speechSynthesis.cancel();


    const speech =
        new SpeechSynthesisUtterance(
            GREETING
        );


    speech.rate =
        0.9;


    speech.pitch =
        1.05;


    speech.volume =
        1;


    statusText.textContent =
        "AI ASSISTANT SPEAKING";


    instruction.textContent =
        "Welcome! Great to see you.";


    startTalking();


    speech.onend =
        function () {

            robotSpeaking =
                false;


            stopTalking();


            statusText.textContent =
                "AI VISION ACTIVE";


            instruction.textContent =
                "Ready for the next guest";

        };


    speech.onerror =
        function () {

            robotSpeaking =
                false;


            stopTalking();


            statusText.textContent =
                "AI VISION ACTIVE";


            instruction.textContent =
                "Ready for the next guest";

        };


    window.speechSynthesis.speak(
        speech
    );

}


// ============================================
// CAMERA
// ============================================

async function startCamera() {

    try {

        const stream =
            await navigator.mediaDevices
                .getUserMedia({

                    video: {

                        facingMode:
                            "user"

                    },

                    audio: false

                });


        camera.srcObject =
            stream;


        instruction.textContent =
            "Camera connected — starting AI vision...";


        statusText.textContent =
            "LOADING AI MODEL";


        await camera.play();


        loadAIModel();

    }

    catch (error) {

        console.error(
            "Camera error:",
            error
        );


        statusText.textContent =
            "CAMERA ACCESS REQUIRED";


        instruction.textContent =
            "Please allow camera access in Chrome.";

    }

}


// ============================================
// LOAD AI MODEL
// ============================================

async function loadAIModel() {

    try {

        instruction.textContent =
            "Loading computer vision...";


        statusText.textContent =
            "LOADING AI MODEL";


        model =
            await cocoSsd.load();


        statusText.textContent =
            "AI VISION ACTIVE";


        instruction.textContent =
            "Step closer and meet your AI assistant";


        console.log(
            "COCO-SSD model loaded successfully."
        );


        detectPerson();

    }

    catch (error) {

        console.error(
            "AI model error:",
            error
        );


        statusText.textContent =
            "AI MODEL ERROR";


        instruction.textContent =
            "Please check your internet connection.";

    }

}


// ============================================
// PERSON DETECTION
// ============================================

async function detectPerson() {

    if (!model) {

        return;

    }


    try {

        const predictions =
            await model.detect(
                camera
            );


        const personDetected =
            predictions.some(

                prediction =>

                    prediction.class ===
                        "person"

                    &&

                    prediction.score >
                        PERSON_CONFIDENCE

            );


        // ====================================
        // NEW PERSON DETECTED
        // ====================================

        if (
            personDetected
            &&
            !personPresent
        ) {

            personPresent =
                true;


            // Register visitor

            registerVisitor();


            // Look towards visitor

            lookAtPerson();


            // Visual reaction

            reactToPerson();


            // Update status

            statusText.textContent =
                "PERSON DETECTED";


            instruction.textContent =
                "Hello! I see you.";


            // Speak greeting

            speakGreeting();

        }


        // ====================================
        // PERSON REMAINS
        // ====================================

        if (
            personDetected
            &&
            personPresent
        ) {

            lookAtPerson();

        }


        // ====================================
        // PERSON LEAVES
        // ====================================

        if (
            !personDetected
            &&
            personPresent
            &&
            !robotSpeaking
        ) {

            personPresent =
                false;


            returnEyesToNormal();


            statusText.textContent =
                "AI VISION ACTIVE";


            instruction.textContent =
                "Ready for the next guest";

        }

    }

    catch (error) {

        console.error(
            "Detection error:",
            error
        );

    }


    requestAnimationFrame(
        detectPerson
    );

}


// ============================================
// START ROBOT
// ============================================

window.addEventListener(
    "load",
    () => {

        statusText.textContent =
            "STARTING AI VISION...";


        instruction.textContent =
            "Starting camera...";


        startCamera();

    }
);