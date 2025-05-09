import sys
import json
import logging
from openai import OpenAI

# Set the model to use
MODEL = "gemma3:4b-it-qat"

# Configure logging
logging.basicConfig(filename='llm_log.txt', level=logging.INFO, format='%(asctime)s - %(message)s')

def process_request(prompt):
    logging.info('\n' + prompt + '\n')

    try:
        # Setup local Ollama server as the OpenAI API endpoint
        client = OpenAI(
            base_url='http://localhost:11434/v1',
            api_key='ollama',  
        )

        # Generate completions for the prompt
        completion = client.completions.create(
            model=MODEL,
            prompt=prompt, # The user's prompt is passed directly
        )
        
        response_content = completion.choices[0].text 
        
        # Debug log the response completion and Token usage info
        logging.info(f"Raw response: {completion}")
        
        return {
            "response": response_content,
        }
    except Exception as e:
        error_msg = f"Error calling LLM: {str(e)}"
        logging.error(error_msg)
        return {
            "response": f"**Error processing your request**: {error_msg}\n\nPlease ensure Ollama is running with the llama3 model available.",
        }

if __name__ == "__main__":
    prompt = json.loads(sys.argv[1])
    response = process_request(prompt)
    print(json.dumps(response))
    logging.info('\n' + (json.dumps(response)) + '\n')