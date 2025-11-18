const express = require('express');
const app = express();
const port = 1818;

// Middleware to parse URL-encoded bodies (as sent by Slack)
app.use(express.urlencoded({ extended: true }));

// Your Block Kit JSON payload
const blockKitMessage = {
	"blocks": [
		{
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "*Hello from your first Slash Command! :wave:*"
			}
		},
		{
			"type": "context",
			"elements": [
				{
					"type": "mrkdwn",
					"text": "This is a message built with Slack's Block Kit."
				}
			]
		},
		{
			"type": "divider"
		},
        {
			"type": "section",
			"text": {
				"type": "mrkdwn",
				"text": "Rendered by your local Node.js server."
			},
			"accessory": {
				"type": "button",
				"text": {
					"type": "plain_text",
					"text": "Click Me",
					"emoji": true
				},
				"value": "click_me_123",
				"action_id": "button-action"
			}
		}
	]
};

// The endpoint Slack will send slash command requests to
app.post('/slack/events', (req, res) => {
  // Simple verification (in a real app, you'd verify the signing secret)
  console.log('Received a request from Slack:', req.body);
  
  // Respond with the Block Kit message
  res.json(blockKitMessage);
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});