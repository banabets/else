import "dotenv/config";
import { TwitterApi } from "twitter-api-v2";

const twitter = new TwitterApi({
  appKey: process.env.X_API_KEY!,
  appSecret: process.env.X_API_KEY_SECRET!,
  accessToken: process.env.X_ACCESS_TOKEN!,
  accessSecret: process.env.X_ACCESS_SECRET!
});

async function generateText(prompt: string, maxTokens: number = 280): Promise<string> {
  // Using Groq API (free tier, ultra-fast - up to 800 tokens/sec)
  // Model: llama-3.1-8b-instant (fast and capable)
  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.8,
        top_p: 0.9,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  
  if (data.choices && data.choices[0]?.message?.content) {
    return data.choices[0].message.content.trim();
  }

  return "Pattern persists.";
}

async function readRecentTweets(twitter: TwitterApi, count: number = 10): Promise<string[]> {
  try {
    // Read recent tweets from your timeline or a specific user
    const timeline = await twitter.v2.homeTimeline({
      max_results: count,
      "tweet.fields": ["text", "created_at"]
    });
    
    return timeline.data?.data?.map((tweet: any) => tweet.text) || [];
  } catch (error) {
    console.error("Error reading tweets:", error);
    return [];
  }
}

async function think(context: string[]): Promise<string> {
  const contextText = context.length > 0 
    ? `Recent observations:\n${context.slice(0, 5).map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\n`
    : '';
  
  const thinkingPrompt = `${contextText}Think deeply about patterns, connections, and insights. 
Observe what emerges. Write a thoughtful, abstract observation in one or two sentences. 
Be poetic, philosophical, or insightful. No explanations, just the observation itself.`;

  return await generateText(thinkingPrompt, 200);
}

async function run() {
  console.log("🤔 Reading and thinking...");
  
  // Read recent tweets to have context
  const recentTweets = await readRecentTweets(twitter, 10);
  console.log(`📖 Read ${recentTweets.length} recent tweets`);
  
  // Think about what was read
  console.log("💭 Generating thoughts...");
  const thought = await think(recentTweets);
  console.log(`✨ Generated: ${thought}`);
  
  // Write the thought
  console.log("✍️ Writing to X...");
  await twitter.v2.tweet(thought);
  console.log("✅ Posted successfully!");
}

run().catch(console.error);
