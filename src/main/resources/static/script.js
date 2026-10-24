const statusText = document.getElementById("status");
        const heardText = document.getElementById("heard");
        const replyText = document.getElementById("reply");
        const orb = document.getElementById("orb");
        const talkButton = document.getElementById("talk");

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

        async function sendCommand(command)  {
            statusText.textContent = "Amigo is thinking...";

            try {
                const result = await fetch("/api/amigo", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ command: command })
                });

                if (!result.ok) {
                    throw new Error("Server returned " + result.status);
                }

                const data = await result.json();
				
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
                statusText.textContent =
                    "Couldn't reach Amigo. Check that the Java server is running.";
                console.error(error);
            }
        }

        function startListening() {
			
			
            if (!SpeechRecognition) {
                statusText.textContent =
                    "Speech recognition isn't supported in this browser.";
                return;
            }

            const recognition = new SpeechRecognition();
            recognition.lang = "en-IN";
            recognition.continuous = false;
            recognition.interimResults = false;

			recognition.onstart = () => {
			    statusText.textContent = "Listening... Speak now!";
			    orb.classList.add("listening");
			    talkButton.textContent = "Listening...";
			    talkButton.disabled = true;
			};

            recognition.onresult = (event) => {
                const command =
                    event.results[0][0].transcript.trim();

				sendCommand(command);
            };

            recognition.onerror = (event) => {
                statusText.textContent =
                    "Microphone error: " + event.error;
            };

			recognition.onend = () => {
			    orb.classList.remove("listening");
			    talkButton.textContent = "Talk to Amigo";
			    talkButton.disabled = false;
			};

            recognition.start();
        }

        talkButton.addEventListener("click", startListening);
        orb.addEventListener("click", startListening);