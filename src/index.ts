import "dotenv/config";
import { TwitterApi } from "twitter-api-v2";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const twitter = new TwitterApi({
  appKey: process.env.X_API_KEY!,
  appSecret: process.env.X_API_KEY_SECRET!,
  accessToken: process.env.X_ACCESS_TOKEN!,
  accessSecret: process.env.X_ACCESS_SECRET!
});

async function run() {
  const prompt = "Observe patterns. Write one abstract sentence. No explanation.";
  const r = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }]
  });

  const text = r.choices[0].message.content || "Pattern persists.";
  await twitter.v2.tweet(text);
}

run().catch(console.error);
