
const statusText = document.getElementById("status");
const heardText = document.getElementById("heard");
const replyText = document.getElementById("reply");
const orb = document.getElementById("orb");
const talkButton = document.getElementById("talk");

let conversationHistory = [];
let latestRequestId = 0;

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

function speak(text) {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 1;

    window.speechSynthesis.speak(utterance);
}

async function sendCommand(command) {
    const requestId = ++latestRequestId;

    window.speechSynthesis.cancel();
    statusText.textContent = "Amigo is thinking...";

    try {
        const result = await fetch("/api/amigo", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                command: command,
                history: conversationHistory
            })
        });

        if (!result.ok) {
            throw new Error("Server returned " + result.status);
        }

        const data = await result.json();

        // Ignore responses from older requests.
        if (requestId !== latestRequestId) {
            return;
        }

        conversationHistory.push({
            question: command,
            answer: data.response
        });

        // Keep only the latest 5 question-answer exchanges.
        if (conversationHistory.length > 5) {
            conversationHistory = conversationHistory.slice(-5);
        }

        // Handle YouTube commands separately.
        if (/\bopen\s+(my\s+)?(the\s+)?youtube\b/i.test(command)) {
            replyText.innerHTML =
                'Amigo: YouTube is ready. <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer">Open YouTube ↗</a>';

            statusText.textContent = "Website ready";
            return;
        }

        replyText.textContent = data.response;
        statusText.textContent = "Ready for your next command";

        speak(data.response);

    } catch (error) {
        // Ignore errors from older requests.
        if (requestId !== latestRequestId) {
            return;
        }

        statusText.textContent =
            "Couldn't reach Amigo. Check that the Java server is running.";

        console.error(error);
    }
}

function startListening() {
    window.speechSynthesis.cancel();

    if (!SpeechRecognition) {
        statusText.textContent =
            "Speech recognition isn't supported in this browser.";
        return;
    }

    const recognition = new SpeechRecognition();
	//recognition.onerror({ error: "audio-capture" });
	let speechReceived = false;
	let recognitionError = false;
	let errorMessage = "";

    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
		console.log("Listening started");
        statusText.textContent = "Listening... Speak now!";
        orb.classList.add("listening");
        talkButton.textContent = "Listening...";
        talkButton.disabled = true;
    };

	recognition.onresult = (event) => {
		
		speechReceived = true;
	    const command = event.results[0][0].transcript.trim();

	    if (command === "") {
	        statusText.textContent = "I didn't catch that. Please try again.";
	        return;
	    }

	    replyText.textContent = "I heard: " + command;

	    sendCommand(command);
	};

    recognition.onerror = (event) => {
		
		
		console.log("Error received:", event.error);
		recognitionError = true;
		    console.log("Speech recognition error:", event.error);
		
			errorMessage = event.error;
			
		switch(errorMessage)
		{
			case "not-allowed": 
			const notAllowedErrMsg = "Please allow microphone access to use Amigo.";
			replyText.textContent = notAllowedErrMsg;
			speak(notAllowedErrMsg);
			break;
			
			case "audio-capture":
			const audioCaptureErrMsg = "Unable to access your microphone.Please check your microphone connection.";
			replyText.textContent = audioCaptureErrMsg;
			speak(audioCaptureErrMsg);
			break;
			
			case "network":
			const networkErrMsg = "Network error. Please check your internet connection.";
			replyText.textContent = networkErrMsg;
			statusText.textContent = "";
			speak(networkErrMsg);
			break;
			
			default:
			const defaultErrMsg = "Something went wrong. Please try again.";
			replyText.textContent = defaultErrMsg;
			speak(defaultErrMsg);
			break;
		}
    };

    recognition.onend = () => {
		console.log("Listening ended");
        orb.classList.remove("listening");
        talkButton.textContent = "Talk to Amigo";
        talkButton.disabled = false;
			
		if(errorMessage === "no-speech")
			{
				if (!speechReceived) {
					const message = "I didn't hear anything. Please try again.";

					replyText.textContent = message;
					statusText.textContent = "Ready for your next command";
					speak(message);
					}
			}
		
    };

    recognition.start();
}

talkButton.addEventListener("click", startListening);
orb.addEventListener("click", startListening);

// Start a fresh conversation.
document
    .getElementById("newConversationBtn")
    .addEventListener("click", function () {
        latestRequestId++;

        window.speechSynthesis.cancel();
        conversationHistory = [];

        replyText.textContent = "Hello! How can I help you?";
        statusText.textContent = "Ready for your next command";
    });
