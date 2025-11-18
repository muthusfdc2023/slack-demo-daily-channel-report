import { App } from '@slack/bolt';

// ====================================================================
// --- CONFIGURATION ---
// ====================================================================

// IMPORTANT: Replace with your actual Bot User OAuth Token (REDACTED)
const SLACK_BOT_TOKEN = 'REDACTED'; 

// IMPORTANT: Replace with the ID of the channel where the message should post
const CHANNEL_ID = 'C09S0FU2QCC'; 

// Initialize the Bolt App
const app = new App({
    // Use your Bot Token
    token: SLACK_BOT_TOKEN, 
    // Securely retrieve your Signing Secret (MUST be configured in your environment)
    signingSecret: process.env.SLACK_SIGNING_SECRET || '3279c565dcaf375dd64d64ca2f519418' 
});


// ====================================================================
// --- BLOCK KIT PAYLOAD (MESSAGE CONTENT) ---
// ====================================================================

const blocksPayload = {
    "blocks": [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "Hello, Assistant to the Regional Manager Dwight! *Michael Scott* wants to know where you'd like to take the Paper Company investors to dinner tonight.\n\n *Please select a restaurant:*"
            }
        },
        { "type": "divider" },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Farmhouse Thai Cuisine*\n:star::star::star::star: 1528 reviews\n They do have some vegan options, like the roti and curry, plus they have a ton of salad stuff and noodles can be ordered without meat!! They have something for everyone here"
            },
            "accessory": {
                "type": "image",
                "image_url": "https://s3-media3.fl.yelpcdn.com/bphoto/c7ed05m9lC2EmA3Aruue7A/o.jpg",
                "alt_text": "Farmhouse Thai image"
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Kin Khao*\n:star::star::star::star: 1638 reviews\n The sticky rice also goes wonderfully with the caramelized pork belly, which is absolutely melt-in-your-mouth and so soft."
            },
            "accessory": {
                "type": "image",
                "image_url": "https://s3-media2.fl.yelpcdn.com/bphoto/korel-1YjNtFtJlMTaC26A/o.jpg",
                "alt_text": "Kin Khao image"
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Ler Ros*\n:star::star::star::star: 2082 reviews\n I would really recommend the  Yum Koh Moo Yang - Spicy lime dressing and roasted quick marinated pork shoulder, basil leaves, chili & rice powder."
            },
            "accessory": {
                "type": "image",
                "image_url": "https://s3-media2.fl.yelpcdn.com/bphoto/DawwNigKJ2ckPeDeDM7jAg/o.jpg",
                "alt_text": "Ler Ros image"
            }
        },
        { "type": "divider" },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Restaurant Suitability Comparison for Investors:*"
            }
        },
        // --- Meaningful Comparison Table ---
        {
			"type": "table",
			"rows": [
				[
					{ "type": "rich_text", "elements": [{ "type": "rich_text_section", "elements": [{ "type": "text", "text": "Restaurant", "style": { "bold": true } }] }] },
					{ "type": "rich_text", "elements": [{ "type": "rich_text_section", "elements": [{ "type": "text", "text": "Menu Focus", "style": { "bold": true } }] }] },
                    { "type": "rich_text", "elements": [{ "type": "rich_text_section", "elements": [{ "type": "text", "text": "Special Notes", "style": { "bold": true } }] }] }
				],
				[
					{ "type": "rich_text", "elements": [{ "type": "rich_text_section", "elements": [{ "type": "text", "text": "Farmhouse Thai" }] }] },
					{ "type": "rich_text", "elements": [{ "type": "rich_text_section", "elements": [{ "type": "text", "text": "Broad Thai, Vegan Options" }] }] },
                    { "type": "rich_text", "elements": [{ "type": "rich_text_section", "elements": [{ "type": "text", "text": "Good for large groups & dietary needs." }] }] }
				],
                [
					{ "type": "rich_text", "elements": [{ "type": "rich_text_section", "elements": [{ "type": "text", "text": "Kin Khao" }] }] },
					{ "type": "rich_text", "elements": [{ "type": "rich_text_section", "elements": [{ "type": "text", "text": "Elevated, Spicy Pork Focus" }] }] },
                    { "type": "rich_text", "elements": [{ "type": "rich_text_section", "elements": [{ "type": "text", "text": "High-end presentation, may be too spicy." }] }] }
				],
                [
					{ "type": "rich_text", "elements": [{ "type": "rich_text_section", "elements": [{ "type": "text", "text": "Ler Ros" }] }] },
					{ "type": "rich_text", "elements": [{ "type": "rich_text_section", "elements": [{ "type": "text", "text": "Traditional Thai, Specialty Pork" }] }] },
                    { "type": "rich_text", "elements": [{ "type": "rich_text_section", "elements": [{ "type": "text", "text": "Focus on authentic, complex flavors." }] }] }
				]
			]
		},
        { "type": "divider" },
        // --- Interactive Buttons (URL REMOVED to resolve error) ---
        {
            "type": "actions",
            "block_id": "restaurant_selection_actions", 
            "elements": [
                {
                    "type": "button",
                    "text": { "type": "plain_text", "text": "Book Farmhouse", "emoji": true }, // Updated text
                    "value": "farmhouse_select", 
                    "action_id": "restaurant_select" 
                },
                {
                    "type": "button",
                    "text": { "type": "plain_text", "text": "Book Kin Khao", "emoji": true }, // Updated text
                    "value": "kinkhao_select", 
                    "action_id": "restaurant_select1"
                },
                {
                    "type": "button",
                    "text": { "type": "plain_text", "text": "Book Ler Ros", "emoji": true }, // Updated text
                    "value": "lerros_select", 
                    "action_id": "restaurant_select2"
                }
            ]
        },
		{
			"type": "section",
			"fields": [
				{ "type": "plain_text", "text": "*Budget Level*", "emoji": true },
				{ "type": "plain_text", "text": "Farmhouse: $$", "emoji": true },
				{ "type": "plain_text", "text": "Kin Khao: $$$", "emoji": true },
				{ "type": "plain_text", "text": "Ler Ros: $$", "emoji": true }
			]
		},
        {
			"type": "context_actions",
            "block_id": "message_feedback",
			"elements": [
				{
					"type": "feedback_buttons",
					"action_id": "feedback",
					"positive_button": { "text": { "type": "plain_text", "text": "Good Response" }, "value": "positive" },
					"negative_button": { "text": { "type": "plain_text", "text": "Bad Response" }, "value": "negative" }
				},
				{
					"type": "icon_button",
					"action_id": "remove_message",
					"icon": "trash",
					"text": { "type": "plain_text", "text": "Remove" }
				}
			]
		}
    ]
};


// ====================================================================
// --- FUNCTIONALITY: POSTING AND INTERACTIVITY ---
// ====================================================================

/**
 * Posts the initial Block Kit message to Slack.
 */
async function postInitialMessage() {
    try {
        const result = await app.client.chat.postMessage({
            channel: CHANNEL_ID,
            text: 'Here are some restaurant options!', 
            blocks: blocksPayload.blocks, 
        });
        console.log('Initial message posted successfully:', result.ts);
    } catch (error) {
        console.error('Error posting message:', error);
    }
}


/**
 * Handler that listens for the 'restaurant_select' button clicks and updates the message.
 */
app.action('restaurant_select', async ({ ack, body, client }) => {
    // 1. Acknowledge the request (required by Slack)
    await ack();

    const clickedButtonText = body.actions[0].text.text;

    try {
        // 2. Update the original message to confirm the booking
        await client.chat.update({
            channel: body.channel.id,
            ts: body.container.message_ts, // Timestamp of the original message to be updated
            text: `✅ ${clickedButtonText} confirmed!`,
            blocks: [
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": `🎉 *Booking Confirmed!* 🎉\n\n**${clickedButtonText.replace('Book ', '')}** has been successfully booked for the investors. The conversation thread can now be used for coordination.`
                    }
                },
                {
                    "type": "context",
                    "elements": [
                        {
                            "type": "mrkdwn",
                            "text": "This action was processed by your Node.js Bolt server."
                        }
                    ]
                }
            ]
        });

    } catch (error) {
        console.error('Error updating message:', error);
    }
});


// ====================================================================
// --- SERVER STARTUP ---
// ====================================================================

(async () => {
    try {
        // Start the server on port 3000 (or whichever port you set in the environment)
        await app.start(process.env.PORT || 3000); 
        console.log('⚡️ Bolt app is running! Listening on port 3000');
        
        // Post the initial message immediately after the server is ready
        await postInitialMessage();

    } catch (error) {
        console.error('Failed to start the app:', error);
    }
})();