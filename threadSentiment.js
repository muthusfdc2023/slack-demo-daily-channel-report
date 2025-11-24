import dotenv from "dotenv";

dotenv.config();

const summaryChannelId = process.env.THREAD_SUMMARY_CHANNEL_ID;

const positiveWords = new Set([
    "awesome",
    "great",
    "good",
    "nice",
    "thanks",
    "thank",
    "love",
    "helpful",
    "excellent",
    "perfect",
    "amazing",
    "yes",
    "yup",
    "sure",
    "happy"
]);

const negativeWords = new Set([
    "bad",
    "sad",
    "angry",
    "upset",
    "hate",
    "issue",
    "problem",
    "bug",
    "wrong",
    "no",
    "not",
    "can't",
    "cannot",
    "fail",
    "failure",
    "delay"
]);

const positiveReactions = new Set([
    "+1",
    "thumbsup",
    "white_check_mark",
    "heavy_check_mark",
    "tada",
    "partyparrot",
    "clap",
    "raised_hands",
    "sparkles",
    "smile",
    "grinning",
    "heart",
    "green_heart"
]);

const negativeReactions = new Set([
    "thumbsdown",
    "-1",
    "x",
    "no_entry",
    "angry",
    "cry",
    "sob",
    "weary",
    "confused",
    "face_with_symbols_on_mouth"
]);

const labelIcons = {
    positive: ":large_green_circle:",
    negative: ":red_circle:",
    normal: ":white_circle:"
};

function classifyTextSentiment(text = "") {
    const words = text
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .split(/\s+/)
        .filter(Boolean);

    let score = 0;
    for (const word of words) {
        if (positiveWords.has(word)) score += 1;
        if (negativeWords.has(word)) score -= 1;
    }

    let label = "normal";
    if (score >= 2) label = "positive";
    else if (score <= -2) label = "negative";

    return { label, score };
}

function classifyReactionSentiment(reactionName = "") {
    const normalized = reactionName.toLowerCase();

    if (positiveReactions.has(normalized)) return { label: "positive", score: 1 };
    if (negativeReactions.has(normalized)) return { label: "negative", score: -1 };

    return { label: "normal", score: 0 };
}

async function getUserLabel(client, userId) {
    if (!userId) return "Someone";

    try {
        const { user } = await client.users.info({ user: userId });
        return user?.real_name || user?.profile?.display_name || "Someone";
    } catch {
        return "Someone";
    }
}

function buildSummaryBlocks({ headline, sentimentLabel, bodyLines, link }) {
    const icon = labelIcons[sentimentLabel] ?? labelIcons.normal;

    const textLines = [
        `${icon} *${headline}*`,
        ...bodyLines,
        link ? `<${link}|Open thread>` : null
    ].filter(Boolean);

    return [
        {
            type: "section",
            text: {
                type: "mrkdwn",
                text: textLines.join("\n")
            }
        }
    ];
}

async function postSummaryMessage({ client, channel, text, blocks, threadTs }) {
    await client.chat.postMessage({
        channel,
        text,
        blocks,
        thread_ts: summaryChannelId ? undefined : threadTs
    });
}

async function fetchMessagePreview(client, channel, ts) {
    try {
        const response = await client.conversations.replies({
            channel,
            ts,
            inclusive: true,
            limit: 1
        });

        const target = response.messages?.[0]?.text || "";
        return target.length > 120 ? `${target.slice(0, 117)}...` : target;
    } catch {
        return "";
    }
}

function resolveTargetChannel(fallbackChannel) {
    return summaryChannelId || fallbackChannel;
}

export function registerThreadSentimentHandlers(app) {
    app.event("message", async ({ event, client, logger }) => {
        try {
            if (event.subtype) return;
            if (!event.thread_ts || event.thread_ts === event.ts) return;
            if (!event.text?.trim()) return;

            const sentiment = classifyTextSentiment(event.text);
            const author = await getUserLabel(client, event.user);
            const channel = resolveTargetChannel(event.channel);

            const { permalink } = await client.chat.getPermalink({
                channel: event.channel,
                message_ts: event.ts
            });

            const preview =
                event.text.length > 140
                    ? `${event.text.slice(0, 137)}...`
                    : event.text;

            const blocks = buildSummaryBlocks({
                headline: `Reply from ${author}`,
                sentimentLabel: sentiment.label,
                bodyLines: [
                    `*Sentiment:* ${sentiment.label}`,
                    `*Preview:* ${preview}`
                ],
                link: permalink
            });

            await postSummaryMessage({
                client,
                channel,
                text: `Thread reply detected (${sentiment.label})`,
                blocks,
                threadTs: event.thread_ts
            });
        } catch (error) {
            logger.error("Failed to process thread reply sentiment", error);
        }
    });

    app.event("reaction_added", async ({ event, client, logger }) => {
        try {
            const sentiment = classifyReactionSentiment(event.reaction);
            const reactor = await getUserLabel(client, event.user);
            const channel = resolveTargetChannel(event.item.channel);

            const { permalink } = await client.chat.getPermalink({
                channel: event.item.channel,
                message_ts: event.item.ts
            });

            const preview = await fetchMessagePreview(
                client,
                event.item.channel,
                event.item.ts
            );

            const blocks = buildSummaryBlocks({
                headline: `Reaction ${event.reaction} from ${reactor}`,
                sentimentLabel: sentiment.label,
                bodyLines: [
                    `*Sentiment:* ${sentiment.label}`,
                    preview ? `*Message:* ${preview}` : null
                ],
                link: permalink
            });

            await postSummaryMessage({
                client,
                channel,
                text: `Reaction recorded (${sentiment.label})`,
                blocks
            });
        } catch (error) {
            logger.error("Failed to process reaction sentiment", error);
        }
    });
}

