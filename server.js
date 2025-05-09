require('dotenv').config();
const Webex = require('webex');
let amaCard = require('./cards/ama.json');
var fs = require('fs');

var botId;

const { spawn } = require('child_process');

// Initialize Webex SDK
const webex = Webex.init({
  credentials: {
    access_token: process.env.WEBEX_ACCESS_TOKEN
  }
});

// This script initializes and runs a Webex bot that can respond to user messages,
// interact with an AI backend, and manage user authorization.
/**
 * Initializes the Webex bot, retrieves its ID, and logs it.
 * Exits the process if an error occurs during setup.
 */
function botSetup() {
  webex.people.get("me").then(function(person) {
    console.log({ message: "Bot details retrieved", id: person.id, displayName: person.displayName });
    botId = person.id;
    console.log(`Saving BotId:${botId}`);
    logToFile("*----------BotId Initialized----------*");
    logToFile("Content", { botId: botId, retrievedAt: new Date().toLocaleString() });
    logToFile("*------------------------*");
  }).catch(function(reason) {
    console.error(reason);
    process.exit(1);
  });
}

/**
 * Appends a timestamped message, and optionally structured data, to the log file.
 * Ensures data objects are pretty-printed if provided.
 * @param {string} message - The descriptive message for the log entry.
 * @param {object|string|number|boolean|null} [data=null] - Optional data to log. Objects will be JSON.stringified.
 */
function logToFile(message, data = null) {
  let logEntry = `${new Date().toISOString()} - ${message}`;
  if (data !== null) {
    if (typeof data === 'object') {
      // Ensure JSON.stringify handles potential circular references gracefully if necessary, though less common for typical log data.
      // For now, standard stringify with pretty print.
      logEntry += `:\n${JSON.stringify(data, null, 2)}`;
    } else {
      logEntry += `: ${data}`;
    }
  }
  logEntry += '\n'; // Ensure a newline for each log entry

  try {
    fs.appendFileSync('log.txt', logEntry);
  } catch (err) {
    // Log to console as a last resort if file logging fails.
    console.error(`FATAL: Failed to write to log.txt - ${err.message}`, err);
    // Maintain previous behavior of crashing on log failure for critical log points that used to throw.
    throw err;
  }
}

/**
 * Sends a message to a Webex room. Can include an adaptive card.
 * @param {string} roomId - The ID of the Webex room.
 * @param {string} message - The markdown message to send.
 * @param {object} [card] - Optional adaptive card content.
 */
async function sendWebexMessage(roomId, message, card) {
  let payload = {
    "roomId": roomId,
    "markdown": message
  }
  if (card !== undefined) {
    payload.attachments = [
      {
        "contentType": "application/vnd.microsoft.card.adaptive",
        "content": card
      }
    ]
  }
  webex.messages.create(payload).catch((err) => {
    console.log(`error sending message: ${err}`);
    console.log(`payload sent: ${payload}`);
  })
}

/**
 * Handles the response submitted from an adaptive card.
 * Routes to AI message or help message based on user input.
 * @param {string} roomId - The ID of the Webex room.
 * @param {object} inputs - The input values from the adaptive card.
 */
function sendResponseMessage(roomId, inputs) {
  logToFile("*----------BotId Check @ sendResponseMessage----------*");
  logToFile("Content", { botId: botId, timestamp: new Date().toLocaleString(), inputs: inputs.card_custom_choice_selected });
  logToFile("*-------------------------------------------------*");
  
  if (inputs.card_custom_choice_selected == "#aimsg") {
    const text = inputs.card_custom_description_field;
    sendAImessage(roomId, text);
  } else {
    sendHelpMessage(roomId, inputs.card_custom_description_field);
  }
  
  msg = `>**Selected**: ${inputs.card_custom_choice_selected} \n`;
  sendWebexMessage(roomId, msg);
  console.log(`Response message sent: ${msg}`);
  logToFile("*----------Card Response Sent----------*");
  logToFile("Content", { room: roomId, messageContent: msg });
  logToFile("*----------------------------------*");
}

/**
 * Sends a predefined help message to the specified Webex room.
 * @param {string} roomId - The ID of the Webex room.
 * @param {string} text - The original text from the user (currently unused in the function body but logged).
 */
function sendHelpMessage(roomId, text){
  logToFile("*----------BotId Check @ sendHelpMessage----------*");
  logToFile("Content", { botId: botId, timestamp: new Date().toLocaleString() });
  logToFile("*-----------------------------------------------*");

  msg = 'Hello! This is a Generative AI prototype chatbot with retrieval augmented generation reponses for demo and evaluation purposes only. \n\n'; 
  msg += 'Use the following commands:\n\n';
  msg += '- "card" \n';
  sendWebexMessage(roomId, msg);
}

/**
 * Sends a user's query to a Python backend for an AI-generated response
 * and relays the response back to the Webex room.
 * @param {string} roomId - The ID of the Webex room.
 * @param {string} text - The user's query/text to be processed by the AI.
 */
async function sendAImessage(roomId, text) {
  logToFile('*----------BotId----------*');
  logToFile(`Start of AI message. Current UTC date and time: ${new Date().toISOString()}`);
  logToFile(JSON.stringify(botId, null, 2));
  logToFile('*-------------------------*');

  const TEMPLATE = `
  You are a very enthusiastic analyst expert who loves to help people! Provide articulate and concise responses in markdown format. 

  Question:

  """ ${text} """

  Desired Output Format:

  Provide a summary in bullet points.
  Ensure the summary is concise, relevant, and covers key points.
  Use markdown format for better readability.
  `;

  logToFile(`Template: ${TEMPLATE}`);

  try {
    const pythonProcess = spawn('python', ['llm_backend.py', JSON.stringify(TEMPLATE)]);
    let pythonResponse = '';

    pythonProcess.stdout.on('data', (data) => {
      pythonResponse += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      logToFile(`stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      logToFile(`child process exited with code ${code}`);
      try {
        const msg = JSON.parse(pythonResponse);
        const banner = "This text was provided by Generative AI for demonstration purposes only. Outputs may not always be accurate and may contain material inaccuracies or mistakes. Consider checking important information.";
        const formattedMsg = msg.response + "\n\n---\n\n" + "### AI Generated Response: \n" + banner;
        // Log the full AI-generated response that will be sent to the user
        logToFile("Full AI Response prepared for Webex", { room: roomId, response: formattedMsg });
        sendWebexMessage(roomId, formattedMsg);
      } catch (error) {
        logToFile(`Failed to parse response: ${error}`);
        sendWebexMessage(roomId, "Failed to parse the response from the model.");
      }
    });
  } catch (error) {
    logToFile(`Failed to get a response from the model: ${error}`);
    process.exit(-1);
  }
}

/**
 * Sets up event listeners for Webex messages and attachment actions.
 * Handles incoming messages, user authorization, and card submissions.
 */
function eventListener() {
  console.log('connected');
  
  const authorizedEmails = [];
  const csvFilePath = "./tools/user.csv";
  
  if (fs.existsSync(csvFilePath)) {
    const fileContent = fs.readFileSync(csvFilePath, "utf-8");
    const rows = fileContent.split("\n");
    
    for (const row of rows) {
      if (row) {
        authorizedEmails.push(row.trim());
      }
    }
  }
  
  webex.messages.listen()
    .then(() => {
      console.log('listening to message events');
      
      webex.messages.on('created', (message) => {
        if (message.actorId != botId) {
          console.log('message created event:');
          console.log(message);
          
          let roomId = message.data.roomId;
          let personEmail = message.data.personEmail;
          logToFile("*----------Incoming Message: User Email----------*");
          logToFile("Content", { personEmail: personEmail, roomId: roomId });
          logToFile("*----------------------------------------------*");
          if (!authorizedEmails.includes(personEmail)) {
            const unauthorizedResponse = "Sorry, you are not authorized to use this bot.";
            sendWebexMessage(roomId, unauthorizedResponse);
            console.log("Unauthorized access by", personEmail);
            return;
          }
          
          if (message.data.text.toLowerCase() == "card") {
            sendWebexMessage(roomId, "Hello World - Adaptive Card", amaCard);
          } else {
            sendHelpMessage(roomId, message.data.text);
          }
        }
      });
    })
    .catch((err) => {
      console.error(`error listening to messages: ${err}`);
    });

  webex.attachmentActions.listen()
    .then(() => {
      console.log('listening to attachmentAction events');
      webex.attachmentActions.on('created', (attachmentAction) => {
        console.log('attachmentAction created event:');
        console.log(attachmentAction);
        let messageId = attachmentAction.data.messageId;
        let roomId = attachmentAction.data.roomId;
        let inputs = attachmentAction.data.inputs;
        if (inputs.card_custom_name_field != '') {
          sendResponseMessage(roomId, inputs);
          webex.messages.remove(messageId);
        } else {
          sendWebexMessage(roomId, "Please enter a name and resubmit to continue.");
        }
      });
    })
    .catch((err) => {
      console.error(`error listening to attachmentActions: ${err}`);
    });
}

botSetup();
eventListener();