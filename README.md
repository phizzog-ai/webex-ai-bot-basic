# Webex AI Bot with Ollama Integration

A Node.js bot based on [Webex Websocket Sample Bot](https://github.com/wxsd-sales/websocket-sample-bot) that leverages the [Webex JS SDK](https://developer.webex.com/docs/sdks/node) and integrates with local LLM models via Ollama for AI-powered responses.

## About The Project

This project is a Webex bot that connects to the Webex messaging platform and uses local AI models (via Ollama) to generate responses. Key features include:

- Webex messaging integration using the official Webex SDK
- AI-powered responses using local LLM models through Ollama
- Adaptive Card support for interactive user experiences
- User authorization via a CSV list
- Token counting and logging for monitoring usage

### Architecture

The project consists of two main components:

1. **Node.js Webex Bot (server.js)**: Handles message events from Webex, user authentication, and message routing
2. **Python LLM Backend (llm_backend.py)**: Communicates with Ollama to generate AI responses

Messages flow through the system as follows:
1. User sends a message to the bot in Webex
2. The bot receives the message via the Webex SDK
3. If the message requests AI processing, it's sent to the Python backend
4. The Python backend communicates with Ollama to generate a response
5. The response is sent back to the user in Webex

## Setup

### Prerequisites

#### Node.js Requirements
* Node.js LTS 20.x
* npm 10.x

#### Python Requirements
* Python 3.11+
* venv (for creating virtual environments)

#### LLM Requirements
* [Ollama](https://ollama.ai) installed and running
* At least one LLM model pulled (recommended: llama3)

### Webex Developer Bot Token 
* Go to [Webex Developer Portal](https://developer.webex.com) to request your 'Bot' token
** Login or create your account
** Click on Profile > My Webex Apps > Create a New App > Create a Bot
** Provide bot name and username. Note - username format of 'username@webex.bot'
*** These must be unique on the platform and best to use names that are easy to search and find.
*** Select Icon and add Description.  
*** Copy and Save your 'Bot Token' in safe location to be used later in your private .env.

### Installation

1. **Clone the repository**
   ```sh
   git clone <repository-url>
   cd webex-ai-bot
   ```

2. **Set up the environment variables**
   ```sh
   cp example.env .env
   ```
   Edit the `.env` file and set:
   - `WEBEX_ACCESS_TOKEN`: Your Webex Bot token (create a bot at https://developer.webex.com/my-apps/new/bot)
   - Other optional configuration variables

3. **Set up the Python environment**
    - Ensure Python >=3.11 is installed and setup on your system    
   ```sh
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Install Node.js dependencies**
   - Ensure Node version '20.x' is running in your environment via 'node --version'
   ```sh
   npm install
   ```
   - This will take time to complete as it builds the 'node_modules' dependencies 

5. **Configure authorized users**
   Edit `tools/user.csv` to add email addresses of Webex users authorized to interact with the bot.
   - use full email address format i.e. 'user@example.com'
   - Add additional authorized email addresses as needed 

6. **Install and configure Ollama**
   - Install Ollama from [ollama.com](https://ollama.com)
   - Ensure Ollama is running
   - Pull a model:
     ```sh
     ollama pull gemma3:4b-it-qat
     ```

7. **Start the bot**
   ```sh
   npm start
   ```

## Usage

### Basic Commands

- Send `card` to receive an interactive Adaptive Card
- The bot will respond with AI-generated responses to questions when using the card interface

### Using Different LLM Models

You can modify the `llm_backend.py` file to use different models available in Ollama. Change this line:

```python
model="gemma3:4b-it-qat",  
```

## Troubleshooting

### Common Issues

- **"model not found"**: Make sure you've pulled the model specified in `llm_backend.py` using `ollama pull <model-name>`
- **Connection refused**: Ensure Ollama is running with `ollama serve`
- **Authorization errors**: Check that the user's email is in the `tools/user.csv` file

### Logs

Check these log files for troubleshooting:
- `log.txt`: Contains Webex bot interaction logs
- `llm_log.txt`: Contains logs from the LLM backend

## License

All contents are licensed under the MIT license. Please see [license](LICENSE) for details.

## Disclaimer

Everything included is for demo and Proof of Concept purposes only. Use of the site is solely at your own risk. This site may contain links to third party content, which we do not warrant, endorse, or assume liability for. These demos are for Cisco Webex usecases, but are not Official Cisco Webex Branded demos.


