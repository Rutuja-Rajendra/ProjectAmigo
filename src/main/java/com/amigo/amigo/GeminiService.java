
package com.amigo.amigo;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

@Service
public class GeminiService {

	private final RestClient restClient =
	        RestClient.create("https://generativelanguage.googleapis.com");

	public GeminiService() {
	}

    @SuppressWarnings("unchecked")
    public String askGemini(String question, List<String> history) {

        String apiKey = System.getenv("GEMINI_API_KEY");

        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "GEMINI_API_KEY environment variable is missing.");
        }

        String conversation = String.join("\n", history);

        String prompt = """
                You are Amigo, a friendly personal AI voice assistant.
                Answer naturally, clearly, and conversationally.
                Keep answers concise unless more detail is requested.

                Previous conversation:
                %s

                Current question:
                %s
                """.formatted(conversation, question);

        Map<String, Object> requestBody = Map.of(
        	    "contents", List.of(
        	        Map.of("parts", List.of(
        	            Map.of("text", prompt)
        	        ))
        	    ),
        	    "generationConfig", Map.of(
        	        "thinkingConfig", Map.of(
        	            "thinkingLevel", "LOW"
        	        )
        	    )
        	);
        
        long startTime = System.currentTimeMillis();

     // Keep your existing Gemini API call here.
        
        Map<String, Object> result = restClient.post()
        		.uri("/v1beta/models/gemini-3.5-flash-lite:generateContent")
                .header("x-goog-api-key", apiKey)
                .body(requestBody)
                .retrieve()
                .body(Map.class);

        if (result == null) {
            throw new IllegalStateException(
                    "Gemini returned an empty response.");
        }

        
     System.out.println(
         "Gemini API took: "
         + (System.currentTimeMillis() - startTime)
         + " ms"
     );

        
        List<Map<String, Object>> candidates =
                (List<Map<String, Object>>) result.get("candidates");

        if (candidates == null || candidates.isEmpty()) {
            throw new IllegalStateException(
                    "Gemini did not return an answer.");
        }

        Map<String, Object> content =
                (Map<String, Object>) candidates.get(0).get("content");

        List<Map<String, Object>> parts =
                (List<Map<String, Object>>) content.get("parts");

        return (String) parts.get(0).get("text");
    }
}
