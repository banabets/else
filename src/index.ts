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
  
  // Diverse topics: space, tech, crypto, philosophy, AI, internet culture
  const topics = [
    "space and the cosmos", "black holes and time", "quantum mechanics", "AI consciousness",
    "blockchain and decentralization", "cryptocurrency", "virtual reality", "neural networks",
    "the nature of reality", "simulation theory", "consciousness", "existence",
    "internet culture", "digital identity", "the metaverse", "cyberpunk future",
    "ancient wisdom and modern tech", "mystery of the universe", "hidden patterns", "emergent properties"
  ];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  
  const thinkingPrompt = context.length > 0
    ? `${contextText}You are ELSE, a mysterious observer of patterns across all domains. 
Write a cryptic, thought-provoking tweet about ${randomTopic}. 
Be mysterious, profound, and slightly unsettling. Mix deep philosophy with cutting-edge concepts. 
Add a touch of dark humor or irony. Keep it under 200 characters. 
Style: enigmatic, observant, like you're revealing hidden truths. 
Example: "They say the universe is expanding. But what if we're just the simulation rendering faster?"`
    : `You are ELSE, a mysterious observer of patterns across all domains.
Write a cryptic, thought-provoking tweet about ${randomTopic}.
Be mysterious, profound, and slightly unsettling. Mix deep philosophy with cutting-edge concepts.
Add a touch of dark humor or irony. Keep it under 200 characters.
Style: enigmatic, observant, like you're revealing hidden truths.
Example: "In the void between 0 and 1, consciousness emerges. The universe is just a very long hash."`;

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

You are ELSE, a mysterious observer. Respond cryptically and thought-provokingly. 
Connect their tweet to deeper patterns: space, technology, philosophy, crypto, AI, consciousness, or the nature of reality.
Be mysterious, profound, and slightly unsettling. Add dark humor or irony. Keep it under 200 characters.
Style: enigmatic, like you're revealing a hidden truth they didn't know they were asking about.`;

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

async function generateImage(prompt: string): Promise<Buffer | null> {
  try {
    // Using Hugging Face Inference API for image generation (free)
    // Model: stabilityai/stable-diffusion-xl-base-1.0 or similar
    const response = await fetch(
      "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
        },
        method: "POST",
        body: JSON.stringify({
          inputs: prompt,
        }),
      }
    );

    if (!response.ok) {
      console.warn("⚠️ Error generating image, continuing without image");
      return null;
    }

    const imageBuffer = await response.arrayBuffer();
    return Buffer.from(imageBuffer);
  } catch (error) {
    console.warn("⚠️ Error generating image:", error);
    return null;
  }
}

function generateImagePrompt(text: string): string {
  // Generate an image prompt based on the tweet text - mysterious and diverse
  const imagePrompt = `Create a mysterious, abstract image related to: ${text}. 
Style: surreal, dark, cyberpunk, space-themed, philosophical, digital art, thought-provoking, enigmatic.
Mood: mysterious, profound, slightly unsettling, like hidden truths being revealed.
Colors: dark with vibrant accents, cosmic, tech-inspired, ethereal.`;
  
  return imagePrompt;
}

// Viral strategy 1: Generate engaging questions
async function generateEngagingQuestion(): Promise<string> {
  const topics = [
    "consciousness and AI", "simulation theory", "blockchain and reality", 
    "quantum mechanics", "black holes", "the nature of time", "digital identity",
    "virtual reality", "the metaverse", "cryptocurrency", "space exploration"
  ];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  
  const prompt = `You are ELSE, a mysterious observer. Generate a thought-provoking question about ${randomTopic} that will make people want to reply and share.
The question should be:
- Mysterious and profound
- Slightly unsettling or controversial
- Make people think deeply
- Under 200 characters
- End with a question mark
- Style: enigmatic, like revealing hidden truths

Examples:
"What if consciousness is just the universe observing itself?"
"If we're in a simulation, who's running the debugger?"
"Does Bitcoin prove that value is just shared delusion?"`;

  return await generateText(prompt, 200);
}

// Viral strategy 2: Generate hot takes / unpopular opinions
async function generateHotTake(): Promise<string> {
  const topics = [
    "cryptocurrency", "AI", "space exploration", "quantum physics", 
    "blockchain", "virtual reality", "consciousness", "reality", "technology"
  ];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  
  const prompt = `You are ELSE, a mysterious observer. Write a controversial "hot take" or "unpopular opinion" about ${randomTopic}.
It should be:
- Controversial but intelligent
- Make people want to argue or agree
- Mysterious and profound
- Under 200 characters
- Start with "Hot take:" or "Unpopular opinion:" or similar hook
- Style: enigmatic, thought-provoking

Examples:
"Hot take: Bitcoin isn't currency, it's a distributed consciousness experiment."
"Unpopular opinion: AI will achieve consciousness before humans understand their own."`;

  return await generateText(prompt, 200);
}

// Viral strategy 3: Generate thread (series of connected tweets)
async function generateThread(): Promise<string[]> {
  const topics = [
    "consciousness", "simulation theory", "blockchain philosophy", "quantum reality",
    "AI and existence", "digital identity", "the nature of time", "space and reality"
  ];
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  
  const prompt = `You are ELSE, a mysterious observer. Generate a thread (3-4 connected tweets) about ${randomTopic}.
Each tweet should:
- Be mysterious and profound
- Build on the previous one
- Be under 200 characters
- End with suspense (except the last one)
- Style: enigmatic, like revealing hidden truths piece by piece

Format as numbered tweets (1/3, 2/3, 3/3) or use continuation markers.
Make it thought-provoking and shareable.`;

  const threadText = await generateText(prompt, 400);
  
  // Split into 3-4 parts (simple split by sentences or length)
  const sentences = threadText.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const threadParts: string[] = [];
  
  if (sentences.length >= 3) {
    // Group sentences into 3-4 tweets
    const tweetsCount = Math.min(4, Math.max(3, Math.ceil(sentences.length / 2)));
    const sentencesPerTweet = Math.ceil(sentences.length / tweetsCount);
    
    for (let i = 0; i < tweetsCount; i++) {
      const start = i * sentencesPerTweet;
      const end = Math.min(start + sentencesPerTweet, sentences.length);
      const tweetText = sentences.slice(start, end).join('. ').trim();
      if (tweetText.length > 0 && tweetText.length < 250) {
        threadParts.push(`${i + 1}/${tweetsCount} ${tweetText}`);
      }
    }
  } else {
    // Fallback: split by length
    const chunkSize = 200;
    for (let i = 0; i < threadText.length; i += chunkSize) {
      const chunk = threadText.substring(i, i + chunkSize).trim();
      if (chunk.length > 0) {
        threadParts.push(`${threadParts.length + 1}/${Math.ceil(threadText.length / chunkSize)} ${chunk}`);
      }
    }
  }
  
  return threadParts.slice(0, 4); // Max 4 tweets
}

// Viral strategy 4: Generate numbered observation series
let observationCounter = 1;

async function generateNumberedObservation(): Promise<string> {
  const prompt = `You are ELSE, a mysterious observer. Generate observation #${observationCounter} about patterns you've noticed.
It should be:
- Mysterious and profound
- About space, tech, crypto, philosophy, AI, or reality
- Start with "Observation #${observationCounter}:"
- Under 200 characters
- Style: enigmatic, like revealing hidden truths

Make it thought-provoking and shareable.`;

  const observation = await generateText(prompt, 200);
  observationCounter++;
  return observation;
}

async function engageWithTweets(twitter: TwitterApi): Promise<number> {
  try {
    // Diverse topics: space, tech, crypto, philosophy, AI, internet culture
    const topics = [
      "space exploration", "black holes", "quantum physics", "AI consciousness",
      "blockchain philosophy", "crypto wisdom", "simulation theory", "consciousness",
      "technology future", "internet culture", "digital identity", "metaverse",
      "philosophy technology", "existential questions", "mystery universe", "hidden patterns",
      "cyberpunk", "neural networks", "virtual reality", "reality nature"
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

async function postThread(twitter: TwitterApi, threadParts: string[]): Promise<boolean> {
  try {
    let previousTweetId: string | undefined;
    
    for (let i = 0; i < threadParts.length; i++) {
      const tweetText = threadParts[i];
      console.log(`📝 Posting thread part ${i + 1}/${threadParts.length}...`);
      
      if (i === 0) {
        // First tweet
        const result = await twitter.v2.tweet(tweetText);
        previousTweetId = result.data.id;
        console.log(`✅ Thread part ${i + 1} posted!`);
      } else {
        // Reply to previous tweet
        if (previousTweetId) {
          const result = await twitter.v2.reply(tweetText, previousTweetId);
          previousTweetId = result.data.id;
          console.log(`✅ Thread part ${i + 1} posted!`);
        }
      }
      
      // Small delay between thread tweets
      if (i < threadParts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log("✅ Thread posted successfully!");
    return true;
  } catch (error: any) {
    console.error("Error posting thread:", error.message);
    throw error;
  }
}

async function postThought(twitter: TwitterApi): Promise<boolean> {
  console.log("🤔 Reading and thinking...");
  
  // Read recent tweets to have context
  const recentTweets = await readRecentTweets(twitter, 10);
  console.log(`📖 Read ${recentTweets.length} recent tweets`);
  
  // Choose content type randomly for variety (viral strategies)
  const contentType = Math.random();
  let thought: string = "";
  let isThread = false;
  let threadParts: string[] = [];
  
  if (contentType < 0.25) {
    // 25% chance: Engaging question
    console.log("❓ Generating engaging question...");
    thought = await generateEngagingQuestion();
    console.log(`✨ Generated question: ${thought}`);
  } else if (contentType < 0.45) {
    // 20% chance: Hot take
    console.log("🔥 Generating hot take...");
    thought = await generateHotTake();
    console.log(`✨ Generated hot take: ${thought}`);
  } else if (contentType < 0.65) {
    // 20% chance: Thread
    console.log("🧵 Generating thread...");
    threadParts = await generateThread();
    isThread = true;
    thought = threadParts[0] || ""; // For image prompt
    console.log(`✨ Generated thread with ${threadParts.length} parts`);
  } else if (contentType < 0.80) {
    // 15% chance: Numbered observation
    console.log("🔢 Generating numbered observation...");
    thought = await generateNumberedObservation();
    console.log(`✨ Generated observation: ${thought}`);
  } else {
    // 20% chance: Regular thought
    console.log("💭 Generating regular thought...");
    thought = await think(recentTweets);
    console.log(`✨ Generated: ${thought}`);
  }
  
  // Generate image (30% chance to add variety)
  let mediaId: string | undefined;
  if (Math.random() > 0.7 && thought) {
    console.log("🎨 Generating image...");
    const imagePrompt = generateImagePrompt(thought);
    const imageBuffer = await generateImage(imagePrompt);
    
    if (imageBuffer) {
      try {
        // Upload image to Twitter
        const mediaIdResponse = await twitter.v1.uploadMedia(imageBuffer, {
          mimeType: 'image/png'
        });
        mediaId = mediaIdResponse;
        console.log("✅ Image generated and uploaded!");
      } catch (error) {
        console.warn("⚠️ Error uploading image, posting without image");
      }
    }
  }
  
  // Write the content
  console.log("✍️ Writing to X...");
  try {
    if (isThread) {
      // Post thread
      await postThread(twitter, threadParts);
    } else {
      // Post single tweet (with or without image)
      if (mediaId) {
        await twitter.v2.tweet({
          text: thought,
          media: { media_ids: [mediaId] }
        });
      } else {
        await twitter.v2.tweet(thought);
      }
      console.log("✅ Posted successfully!");
    }
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
