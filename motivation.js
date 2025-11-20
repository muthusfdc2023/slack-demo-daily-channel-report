import express from 'express';
//const express = require('express');
const app = express();
const port = 1888;

// Middleware to parse URL-encoded bodies (as sent by Slack)
app.use(express.urlencoded({ extended: true }));

// A list of motivational quotes
const motivationalQuotes = [
    {
        quote: "The only way to do great work is to love what you do.",
        author: "Steve Jobs"
    },
    {
        quote: "Believe you can and you're halfway there.",
        author: "Theodore Roosevelt"
    },
    {
        quote: "The future belongs to those who believe in the beauty of their dreams.",
        author: "Eleanor Roosevelt"
    },
    {
        quote: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        author: "Winston Churchill"
    }
];

// Keep track of the last quote to avoid repeats
let lastQuoteIndex = -1;

// The endpoint Slack will send slash command requests to
app.post('/slack/events', (req, res) => {
  console.log('Received a request from Slack:', req.body);
  
  const { user_id } = req.body;
  const greeting = `Hey <@${user_id}>, here is your dose of motivation!`;

  // Pick a random quote, ensuring it's not the same as the last one.
  let randomIndex;
  do {
    randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
  } while (motivationalQuotes.length > 1 && randomIndex === lastQuoteIndex);
  
  lastQuoteIndex = randomIndex; // Remember which quote we sent
  const randomQuote = motivationalQuotes[randomIndex];

  // Dynamically create the Block Kit message with the random quote
  const blockKitMessage = {
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `*${greeting}* :sparkles:`
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": `>_${randomQuote.quote}_`
        }
      },
      {
        "type": "context",
        "elements": [
          {
            "type": "mrkdwn",
            "text": `– ${randomQuote.author}`
          }
        ]
      }
    ]
  };
  
  // Respond with the Block Kit message
 res.json({
        "response_type": "in_channel", // <-- ADDED: Tells Slack to post publicly
        ...blockKitMessage
    });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});