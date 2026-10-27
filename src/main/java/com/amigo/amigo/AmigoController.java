
package com.amigo.amigo;

import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.web.client.RestClientException;

@CrossOrigin(origins = "*")
@RestController
public class AmigoController {

    private final GeminiService geminiService;

    public AmigoController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @GetMapping("/api/amigo")
    public String greet() {
        return "Hello! I am Amigo, your personal voice assistant.";
    }

    @PostMapping("/api/amigo")
    public Map<String, String> processCommand(
            @RequestBody Map<String, Object> request) {
    	
    	List<Map<String, String>> history =
    	        (List<Map<String, String>>) request.getOrDefault(
    	                "history", List.of());

    	String command = String.valueOf(
    	        request.getOrDefault("command", "")
    	).trim();

        if (command.isBlank()) {
            return Map.of("response", "Hey bro, what would you like to ask?");
        }

        try {
            String response = geminiService.askGemini(command, history);
            return Map.of("response", response);

        } catch (RestClientException | IllegalStateException e) {
            e.printStackTrace();
            return Map.of(
                    "response",
                    "Sorry bro, I'm having trouble connecting to my AI brain. Please try again."
            );
        }
    }
}
