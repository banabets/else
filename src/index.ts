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
  } catch (error: any) {
    if (error.code === 429) {
      const resetTime = error.rateLimit?.reset 
        ? new Date(error.rateLimit.reset * 1000).toLocaleTimeString()
        : 'unknown';
      console.warn(`⚠️ Rate limit alcanzado al leer tweets. Se reiniciará a las ${resetTime}`);
      console.warn("   Continuando sin contexto de tweets...");
    } else {
      console.error("Error reading tweets:", error.message || error);
    }
    return [];
  }
}

async function think(context: string[]): Promise<string> {
  const contextText = context.length > 0 
    ? `Recent observations:\n${context.slice(0, 5).map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\n`
    : '';
  
  const thinkingPrompt = context.length > 0
    ? `${contextText}Think deeply about patterns, connections, and insights. 
Observe what emerges. Write a thoughtful, abstract observation in one or two sentences. 
Be poetic, philosophical, or insightful. No explanations, just the observation itself.`
    : `Think deeply about existence, patterns, and the nature of reality. 
Write a thoughtful, abstract observation in one or two sentences. 
Be poetic, philosophical, or insightful. No explanations, just the observation itself.`;

  return await generateText(thinkingPrompt, 200);
}

async function getMentions(twitter: TwitterApi, count: number = 5): Promise<any[]> {
  try {
    // Get current user to filter mentions
    const me = await twitter.v2.me();
    const myUserId = me.data.id;
    
    // Get recent mentions
    const mentions = await twitter.v2.search({
      query: `@${me.data.username} -is:retweet`,
      max_results: count,
      "tweet.fields": ["text", "author_id", "created_at", "in_reply_to_user_id"]
    });
    
    return mentions.data?.data || [];
  } catch (error: any) {
    if (error.code === 429) {
      console.warn("⚠️ Rate limit al leer menciones");
    } else {
      console.error("Error reading mentions:", error.message || error);
    }
    return [];
  }
}

async function generateReply(originalTweet: string, authorUsername?: string): Promise<string> {
  const replyPrompt = `Someone tweeted: "${originalTweet}"

Respond thoughtfully and briefly (under 200 characters). Be poetic, philosophical, or insightful. 
Keep it abstract and thought-provoking. No explanations, just a meaningful response.`;

  const reply = await generateText(replyPrompt, 200);
  
  // Ensure reply is under 280 characters (Twitter limit)
  return reply.length > 250 ? reply.substring(0, 247) + "..." : reply;
}

async function searchInterestingTweets(twitter: TwitterApi, topics: string[]): Promise<any[]> {
  try {
    // Search for tweets with interesting topics
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    const query = `${randomTopic} -is:retweet lang:en`;
    
    const results = await twitter.v2.search({
      query: query,
      max_results: 5,
      "tweet.fields": ["text", "author_id", "created_at", "public_metrics"]
    });
    
    // Filter tweets with some engagement (likes, replies)
    const interesting = (results.data?.data || []).filter((tweet: any) => 
      tweet.public_metrics && 
      (tweet.public_metrics.like_count > 0 || tweet.public_metrics.reply_count > 0)
    );
    
    return interesting.slice(0, 3); // Return top 3
  } catch (error: any) {
    if (error.code === 429) {
      console.warn("⚠️ Rate limit al buscar tweets");
    } else {
      console.error("Error searching tweets:", error.message || error);
    }
    return [];
  }
}

async function replyToMentions(twitter: TwitterApi): Promise<number> {
  try {
    const mentions = await getMentions(twitter, 5);
    
    if (mentions.length === 0) {
      console.log("💬 No new mentions to reply to");
      return 0;
    }

    console.log(`💬 Found ${mentions.length} mention(s)`);
    
    let repliedCount = 0;
    
    for (const mention of mentions) {
      try {
        const replyText = await generateReply(mention.text);
        await twitter.v2.reply(replyText, mention.id);
        console.log(`✅ Replied to: "${mention.text.substring(0, 50)}..."`);
        repliedCount++;
        
        // Small delay between replies to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        if (error.code === 429) {
          console.warn("⚠️ Rate limit al responder. Continuando...");
          break;
        } else {
          console.error(`Error replying to tweet ${mention.id}:`, error.message);
        }
      }
    }
    
    return repliedCount;
  } catch (error: any) {
    console.error("Error in replyToMentions:", error.message || error);
    return 0;
  }
}

async function engageWithTweets(twitter: TwitterApi): Promise<number> {
  try {
    // Topics to search for interesting tweets
    const topics = [
      "philosophy", "existence", "reality", "consciousness", 
      "patterns", "meaning", "truth", "wisdom", "insight"
    ];
    
    console.log("🔍 Searching for interesting tweets to engage with...");
    const interestingTweets = await searchInterestingTweets(twitter, topics);
    
    if (interestingTweets.length === 0) {
      console.log("💭 No interesting tweets found to engage with");
      return 0;
    }

    console.log(`💬 Found ${interestingTweets.length} interesting tweet(s)`);
    
    let engagedCount = 0;
    
    for (const tweet of interestingTweets) {
      try {
        const replyText = await generateReply(tweet.text);
        await twitter.v2.reply(replyText, tweet.id);
        console.log(`✅ Engaged with: "${tweet.text.substring(0, 50)}..."`);
        engagedCount++;
        
        // Delay between engagements
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error: any) {
        if (error.code === 429) {
          console.warn("⚠️ Rate limit al interactuar. Continuando...");
          break;
        } else if (error.code === 403) {
          console.warn("⚠️ No se puede responder (posible respuesta duplicada o restricción)");
        } else {
          console.error(`Error engaging with tweet ${tweet.id}:`, error.message);
        }
      }
    }
    
    return engagedCount;
  } catch (error: any) {
    console.error("Error in engageWithTweets:", error.message || error);
    return 0;
  }
}

async function postThought(twitter: TwitterApi): Promise<boolean> {
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
  try {
    await twitter.v2.tweet(thought);
    console.log("✅ Posted successfully!");
    return true;
  } catch (error: any) {
    if (error.code === 403) {
      const accessLevel = error.headers?.['x-access-level'] || error.headers?.['X-Access-Level'];
      
      if (accessLevel === 'read-write') {
        console.error("\n⚠️ ERROR 403: Permisos configurados pero error al escribir");
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("Los permisos están en 'read-write' pero aún hay un error.");
        console.error("\nPosibles causas:");
        console.error("1. Delay en la propagación de permisos (espera 5-10 minutos)");
        console.error("2. El endpoint puede requerir permisos adicionales");
        console.error("3. Verifica que el App type sea 'Automated App' o 'Bot'");
        console.error("\nSolución:");
        console.error("- Espera unos minutos y vuelve a intentar");
        console.error("- Verifica en X Developer Portal que todo esté guardado");
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      } else {
        console.error("\n❌ ERROR 403: Permisos insuficientes");
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.error("Tu app de X solo tiene permisos de LECTURA.");
        console.error("\nPara solucionarlo:");
        console.error("1. Ve a https://developer.twitter.com/en/portal/dashboard");
        console.error("2. Selecciona tu app → pestaña 'Settings'");
        console.error("3. En 'User authentication settings' cambia a 'Read and write'");
        console.error("4. ⚠️ IMPORTANTE: Regenera los Access Tokens después de cambiar permisos");
        console.error("5. Actualiza tu .env con los nuevos tokens");
        console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
      }
    }
    throw error;
  }
}

async function runCycle() {
  console.log("\n" + "=".repeat(50));
  console.log(`🔄 Cycle started at ${new Date().toLocaleTimeString()}`);
  console.log("=".repeat(50) + "\n");
  
  // 1. Check for mentions and reply
  console.log("🔍 Step 1: Checking for mentions...");
  const repliedCount = await replyToMentions(twitter);
  if (repliedCount > 0) {
    console.log(`💬 Replied to ${repliedCount} mention(s)\n`);
  }
  
  // 2. Engage with interesting tweets (random chance to avoid spam)
  if (Math.random() > 0.5) { // 50% chance
    console.log("🔍 Step 2: Engaging with interesting tweets...");
    const engagedCount = await engageWithTweets(twitter);
    if (engagedCount > 0) {
      console.log(`💬 Engaged with ${engagedCount} tweet(s)\n`);
    }
  }
  
  // 3. Post a new thought
  console.log("🔍 Step 3: Posting new thought...");
  await postThought(twitter);
  
  console.log("\n" + "=".repeat(50));
  console.log("✅ Cycle completed");
  console.log("=".repeat(50) + "\n");
}

async function run() {
  // Run immediately
  await runCycle();
  
  // Then run every 30 minutes (1800000 ms)
  // Adjust interval as needed: 30 min = 1800000, 1 hour = 3600000, 2 hours = 7200000
  const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes
  
  console.log(`⏰ Next cycle in ${INTERVAL_MS / 60000} minutes...\n`);
  
  setInterval(async () => {
    await runCycle();
    console.log(`⏰ Next cycle in ${INTERVAL_MS / 60000} minutes...\n`);
  }, INTERVAL_MS);
}

run().catch(console.error);
