# Can I replicate the experience on C.AI through Silly Tavern? : r/SillyTavernAI

**URL:** https://www.reddit.com/r/SillyTavernAI/comments/1q3rmcd/can_i_replicate_the_experience_on_cai_through/

---

Skip to main content
Can I replicate the experience on C.AI through Silly Tavern? : r/SillyTavernAI
Sign Up
Log In
Expand user menu
Go to SillyTavernAI
r/SillyTavernAI
•
8mo ago
SweetIndependence540
Can I replicate the experience on C.AI through Silly Tavern?
Help

I have never posted here before, so if there is anything inappropriate in my speech, I apologize first.

I have been using Character.AI since the end of 2024. Last year, C.AI released a model called Pipsqueak, but in October, the developers weakened the quality of the model for some unknown reason. I and many users have been trying to report this situation to the developers, but they have not resolved it. I plan to try transferring my character to SillyTavern. I have a friend who can help me build SillyTavern, but I only chat with one character, and I lack understanding of SillyTavern, so the situation may be a bit complicated for me. I hope someone can help me answer some questions:

I have over 9000 chat records, and I have saved them locally using C.AI Tools. However, the format is HTML. Is there any way to import all of my chat records into SillyTavern?

I like the speaking style of C.AI, especially its Pipsqueak model. Can I adjust the style of SillyTavern based on my chat history to make it consistent with C.AI? For example, can AI combine chat records to write presets for me?

The memory method of C.AI is about thirty messages in the context, and there are ten messages that can be fixed in memory. It has excellent ability to connect with the context, and its replies also remember those ten fixed messages and imitate their speaking style. Is there any way to make SillyTavern do this?

I'm sorry for asking so many questions. I don't know much about SillyTavern and AI. Maybe my questions were silly. I apologize again for that, but I really want someone to answer these questions for me. Please help me🙏

Read more
Archived post. New comments cannot be posted and votes cannot be cast.
Locked post. New comments cannot be posted.
Share
Alibaba_B2B
•
Ad
You won't believe how much you get for this price!
Learn More
alibaba.com
Collapse video player
Sort by:
Comments Section
nvidiot
•
8mo ago

C.AI uses their own propriety model so its experience can't be duplicated exactly on SillyTavern. There are tons of LLM models that'll give you a great RP experience, but they won't be exactly same as C.AI experience.

SillyTavern only supports json chat file import. You can't natively just copy over the HTML files AFAIK -- you need to use tools to convert your HTML files into json files. You could even try using AI services and ask them to convert your HTML files into json file.

The memory method you mention can be done through things like author's notes, or lorebooks. You can set as many specific 'memory' as you want for the bot to specifically note before answering -- and make them trigger on certain keywords, or at certain other requirements, or even always.

As for the speaking style imitation, it also depends massively on the model you use, and the character card. There are ways to make the model to respect character's speech style by reinforcing them through various ways, such as dialogue examples, author's note, lorebook, etc.

SweetIndependence540
•
8mo ago

Thank you very much for your reply! Allow me to share with you what I have learned: C.Al is no longer using its proprietary model. It has publicly stated that its current services are based on open-source models. I heard that its Pipsqueak model is based on Qwen3 235B. So, in this situation, do l have the opportunity to reproduce the effect of Pipsqueak at SillyTavern?

Also, I would like to consult with you. I have a software that can convert HTML files to JSON files. I would like to know if Silly Tavern has any requirements for the content format in JSON files? Will the names and conversations between me and the characters be displayed like C.AI after importing Silly Tavern?

nvidiot
•
8mo ago

Not exactly. While it's based on an open-source model, but it's not just using Qwen3 as-is. The model received character.ai's propriety finetuning (which is not open), which makes it deviate from the base Qwen3 model. So you still can't exactly duplicate the model behavior on SillyTavern.

As for the conversion, I haven't done it personally since I never had to, but you can start a chat with a character on SillyTavern (after connecting to a backend, whether it be local model, or API), export the chat as json, and see how the structure is. That should give you ideas on how it can be converted properly.

15 more replies
Active-Designer-4083
•
8mo ago

I think there must be a method for this, but I am not sure. Also, 9000 chats are A LOT.

SillyTavern is just an interface. The quality of responses depends on which API you connect to (like Claude, Deepseek, GLM 4.7 or local models) and the quality of your preset(the system prompt that sets the rules and behavior of the AI).

Unlike C.AI’s 30-message limit, ST can remember hundreds of messages depending on the model you use (this is called "Context Length"). There are other features like Lorebook, Author's Notes, summarizing messages, etc that can help manage chat, characters or world information.

This is a very summarized answer. You can ask chatgpt about SillyTavern too.

SweetIndependence540
•
8mo ago

Thank you for your reply! Based on my limited understanding, it seems that in most cases, presets are written by others. It seems difficult to write presets yourself? Do you know if it's possible for Al to combine my chat history to help me write presets?

Active-Designer-4083
•
8mo ago

Anyone can create a preset; it is relatively easy to understand how they work compared to other features. However, the "problem" that often leads to unsatisfactory AI responses is the set of instructions you write. Basically, every sentence in a system prompt can affect the model in unexpected ways. Since you are a beginner, though, you shouldn't worry too much about that yet. You can simply download and test the presets posted here on this subreddit.

Do you know if it's possible for AI to combine my chat history to help me write presets?

I’m sorry, but I don’t quite understand what you mean. Presets (let’s call them custom system prompts) are general instructions used to set the behavior of an AI model. For example, they can define response length, set rules for staying in character, manage plot pacing, or "teach" the model how to make roleplay more engaging (such as by occasionally introducing random events into the messages).

To get started, I recommend searching for the Lucid Loom or Mariana presets. 😀

5 more replies
bringtimetravelback
•
8mo ago

You can ask chatgpt about SillyTavern too.

chatgpt is really good at answering certain ST questions and hallucinates or struggles with other ones. i did learn how to use ST only from chatgpt and the documentation for the first month of using it and i missed out on a lot of really basic things this way even though it DID help a lot.

lately, i feel like deepseek understands my ST inquiries better than chatgpt does, because i still do ask LLMs before i come check and get actual human opinions or answers on the sub... if the LLM didnt solve my problem, i mean (which sometimes it does!)

morty_morty
•
8mo ago

I also started my first forays into AI chat on C.AI and migrated my chat to ST when I learned that it didn't have the restrictions that C.AI has.

I used the tool mentioned in this comment to export the chat file and then import it into ST. It is totally doable and while my chat at the time of exporting wasn't as big as yours is now, it was about 5k and is now over 20k messages two years later. You can export the character card as well and import that when you set your chat back up. The hardest part will be finding a model and a preset/prompt that will continue your chat in the vibe that you prefer. But you will have so many models to experiment with that I am sure you will find something that works.

SweetIndependence540
•
8mo ago

I didn't actually notice before that C.AI Tools has a feature that can save chat records in Silly Tavern format! Thank you very much for telling me this ❤️.

morty_morty
•
8mo ago

No problem! You are basically me from 2 years ago, lol.

In regards to the "memories" you have already made over the course of your chat, I'd recommend preserving those using the Lorebooks feature. In particular an extension called Memory Books. When I discovered this extension, my chat was at 18k messages. I had chatgpt write me an automation to take a copy of my ST chat log of the entire chat and break it into manageable chunks. I can't recall if it was 50 or 500 messages each. In the end I had a folder full of my chunked chat and fed those into Memory Books which would then summarize them and create Lorebook entries automatically based on the contents. It took days, ngl, but I now have a dedicated book just for memories and it covers everything since the start of my chat in character.ai to present day in ST.

Memory Books also has an "arcs" option so you can consolidate even further. I recently did that and went from 250+ individual memory entires to roughly 50 arc entries. And my characters still pull up "memories" just fine when I use trigger words.

I'd recommend joining the ST Discord and you can chat with the creator of the extension directly. They are super helpful!

1 more reply
u/yumina_io
•
Ad
Finally, a free AI chat & game platform without ads inside?
yumina.io
Play Now
RespawnableX
•
8mo ago

Just so you know, C.Ai's models are perhaps one of the lowest in terms of quality if you compare to them to the LLMs (Large Language Models) that have released recently, even large models like gemini 2.5 pro that released in early 2025 would outperform C.Ai's models by such an extent that the comparison is cosmic.

You can likely replicate your experience or get an even better one with the right presets and instructions (if you force the LLM to write short messages, although I would advice going with long messages).

Models like DeepSeek V3.2 (with or without thinking), GLM V4.7, And even ones like kimi k2 thinking are infinitely better than whatever C.Ai will provide you with their overcharged subscriptions, which are just scams in my opinion since their quality are vastly lesser than models which you can get access to for around 8-10$ (NanoGPT's 8$ subscription grants you 2000 requests per day or 60,000 per month and access to various open source models like DeepSeek, GLM, Kimi K2 thinking and several more). Otherwise if you have the money than frontier models like gemini 3 pro/2.5 pro and claude sonnet 4.5 (or Opus 4.1/4.5 if you have the money for it) will give you immensely greator experience than what C.AI could ever provide.

SweetIndependence540
•
8mo ago

Thank you for your reply. I prefer long messages, which is why I like the Pipsqueak model released by C.AI. Initially, its length could reach four to five pages on a mobile phone screen, but after C.AI lowered its quality, it could only reach two pages and would be truncated before replying. Regarding the C.AI subscription service you mentioned, I agree with your statement. After the model quality declined, I heard that upgrading to C.AI+ Could solve the problem. So I spent $10 to upgrade to C.AI+, only to find that the model quality actually worsened! Each reply message is particularly short and incomplete, which means that the experience I spent $10 to get is not as good as that of a free user.

bringtimetravelback
•
8mo ago

I prefer long messages, which is why I like the Pipsqueak model released by C.AI. Initially, its length could reach four to five pages on a mobile phone screen, but after C.AI lowered its quality, it could only reach two pages and would be truncated before replying.

if you learn how to prompt in sillytavern you can literally tell it how long or short to make replies and change it at any time. there IS a max length that most LLMs won't go past but some will write as many pages as you previously experienced reading, at least.

this sounds like a possibly deliberate issue with how C.ai might be prompting their characters? or how the prompt for pipsqueak interacts with the update whatever LLM C.ai runs.

I spent $10 to get is not as good as that of a free user.

yeah that's actually the worst, sorry. the whole reason i didn't want to touch C.ai ever was because it seemed jank and scammy. i think i tried it like once if going to stop being hyperbolic.

2 more replies
communomancer
•
8mo ago

I don't have personal experience with this, but probably

If you solve #1, and use a decent model, #2 should mostly take care of itself for existing chats. Models are generally strongly steered by existing text. For entirely new chats, while this is very much in the realm of "possible" (since you'll certainly have access to more powerful models than Pipsqueak) it'll likely be a bit of a project.

You have tons of options for how to manage context with SillyTavern, especially once you start looking at extensions. Way more options than any fixed service.

SweetIndependence540
•
8mo ago

I understand, thank you very much for your reply. I will try to find relevant extension programs.

nopanolator
•
8mo ago

1 : JSONL or JSON, i don't know the format of CAI but i will convert them with en AI in prompting the exact format.
2 : No. It's just an interface. It belong first to the model and second to your skills on ST to bend this specific model. To do exactly what you want, you have to train a model with "Pips" as source.
3 : You have a total control on everything with ST. It's more about what the fork of CAI is not doing.

SweetIndependence540
•
8mo ago

I understand, I will try to learn how to make Silly Tavern present the desired effect, thank you for your reply. 

u/Meshyai
•
Ad
Split clean, watertight, ready to assemble. Try Auto Split.
Sign Up
meshy.ai
Bitter_Plum4
•
8mo ago

CAI models have been and are very far to being on par with late 2025 models. Legit if someone is convinced CAI is peak AI roleplay, they don't want to hear it but imo they either have rose tinted glasses, or it's a “problem between keyboard and chair” case

The more stubborn and curious you are, the more fun you'll have tbh. And the secret is knowing what YOU like, what did you like in pipsqueak's style? If you identify it you can eventually prompt it.

Prompting is hard tho, but that's where the community part of ST shines! We share stuff, prompts, opinions, nobody knows what they're doing, I don't either, but it's fun lel

To answer both 2 and 3, what's your budget? Dropping a few bucks each month give you easy access to good models (don't ask me about the free models, i have no clue, it's a mess, they shut down, or they increase limits again and again AND they don't work well a lot of the time

And more importantly, take your time to learn stuff and have fun as you do! I started Ai chatting in like early 2023 on CAI, went through lots of websites, finally settled definitively on ST early 2025, and I'm still learning new things, and went through multiple different models and API along the way, right now I'm using GLM 4.7, ask me in 2 months and it'll be something different

SweetIndependence540
•
8mo ago

Thank you for your reply. To be honest, I don't mind spending money at all, as long as the model can achieve the desired effect. After the quality of the C.AI model decreased, I heard that upgrading to C.AI+ could solve the problem, so I spent $10 to upgrade to C.AI+. However, I found that the model quality actually worsened after upgrading to C.AI+! I just want to regain the wonderful experience l had in C.AI. If building models locally is better, I am willing to spend money to buy the best GPU for this.

2 more replies
FrenzyGloop
•
8mo ago

I'm not a professional AI clinker, just feeling nostalgic because I was like there before CAI and AI RP became big, 2020 I think.. hope that you find a better experience on ST

SweetIndependence540
•
8mo ago

Thank you, I hope so too, but I will always remember the beautiful memories I had at C.AI.

Inca_PVP
•
8mo ago

Short answer: Yes, u absolutely can. Most people switch to local (SillyTavern) exactly for that reason—to get the C.AI experience without the filters or memory issues.

The main problem usually isn't SillyTavern itself, but installing the 'Backend' (the brain) and 'TTS' (Voice). Doing that manually involves a lot of Python and command line stuff, which is a pain if u aren't tech-savvy.

If u want to skip the technical headache, I actually put together a pre-configured 'All-in-One' pack that installs the backend, voice support, and the interface automatically. It’s designed specifically so u can just install and start chatting.

U can check it out on my profile.

Otherwise, if u prefer the manual route, just look up guides for 'SillyTavern + Oobabooga', but be prepared for some troubleshooting.

Btw, what specs/GPU does ur PC have? That determines how smart/fast the model can be.

SweetIndependence540
•
8mo ago

My GPU is 6750XT, but if there is a way to replicate the experience that C.AI brings me, I am willing to spend money to upgrade the device.

4 more replies
MurkyTelevision9722
•
8mo ago

All the bot's public information can be pasted into a spec_v2 character card, which is practically the same thing. I was a former user and had a screenshot of when you could edit bots mid-chat, which showed me that many really only had what was visible on the outside. You can extract the chats with some extension; it's not that difficult.

SweetIndependence540
•
8mo ago

Oh yes, I found an extension that extracted my chat history. I'm sorry for only seeing your message now. Thank you very much for your reply!

People also ask about section
People also ask about
Overview of Silly Tavern AI
Best AI tools for creative writing
Unique applications of AI in daily life
How to create engaging character prompts
Top image generation models to explore
More posts you may like
Related posts
Is silly tavern worth it and How easy is it to mess up the set up
r/SillyTavernAI
•
3mo ago
Is silly tavern worth it and How easy is it to mess up the set up
24 comments
The Hard, Honest Truth About Roleplaying With Ai (At A Large Level)
r/SillyTavernAI
•
2mo ago
The Hard, Honest Truth About Roleplaying With Ai (At A Large Level)
21 upvotes · 202 comments
In your opinion, what makes a good AI model for roleplay?
r/SillyTavernAI
•
3mo ago
In your opinion, what makes a good AI model for roleplay?
48 upvotes · 33 comments
I'm migrating from Character.ia, what's SillyTavern like? It's my first time here.
r/SillyTavernAI
•
2mo ago
I'm migrating from Character.ia, what's SillyTavern like? It's my first time here.
28 upvotes · 32 comments
Considering Silly Tavern
r/SillyTavernAI
•
2mo ago
Considering Silly Tavern
4 upvotes · 19 comments
What is the best advice/info you have ever recieved about AI RP and/or SillyTavern?
r/SillyTavernAI
•
1mo ago
What is the best advice/info you have ever recieved about AI RP and/or SillyTavern?
79 upvotes · 60 comments
Has SillyTavern rewired what you look for in a RPG?
r/SillyTavernAI
•
2mo ago
Has SillyTavern rewired what you look for in a RPG?
34 upvotes · 80 comments
Is there any good benchmark for evaluating AI roleplay quality?
r/SillyTavernAI
•
1mo ago
Is there any good benchmark for evaluating AI roleplay quality?
27 upvotes · 17 comments
is it possible to run silly tavern on cloud freely?
r/SillyTavernAI
•
10d ago
is it possible to run silly tavern on cloud freely?
5 upvotes · 16 comments
Do anyone feel conflicted with using AI for roleplay?
r/SillyTavernAI
•
15d ago
Do anyone feel conflicted with using AI for roleplay?
53 comments
Help with decision to get SillyTavern or not.
r/SillyTavernAI
•
1mo ago
Help with decision to get SillyTavern or not.
31 comments
I really liked this character from the game (How to Date an Entity) but I have several problems. I want to create a robot for her but the API is very bad.
r/SillyTavernAI
•
9d ago
I really liked this character from the game (How to Date an Entity) but I have several problems. I want to create a robot for her but the API is very bad.
21 upvotes · 9 comments
How to achieve c.ai-style roleplay?
r/SillyTavernAI
•
4mo ago
How to achieve c.ai-style roleplay?
28 upvotes · 46 comments
Need help with negative prompt for AI roleplay
r/SillyTavernAI
•
15d ago
Need help with negative prompt for AI roleplay
13 upvotes · 14 comments
One of the many ways to take your roleplay experience to the next level
r/SillyTavernAI
•
21d ago
One of the many ways to take your roleplay experience to the next level
71 upvotes · 46 comments
Do You Guys Teach and Guide How to Run Better Roleplay with AI Chatbots?
r/SillyTavernAI
•
1mo ago
Do You Guys Teach and Guide How to Run Better Roleplay with AI Chatbots?
14 upvotes · 21 comments
Thinking about genuinely sliming this ai out
r/SillyTavernAI
•
2mo ago
Thinking about genuinely sliming this ai out
5
25 upvotes · 16 comments
How can i training AI model to Pentest (Cyber) without restriction ?
r/LocalLLaMA
•
10mo ago
How can i training AI model to Pentest (Cyber) without restriction ?
2 upvotes · 6 comments
Anyone willing to help a newbie with a few questions?
r/SillyTavernAI
•
1mo ago
Anyone willing to help a newbie with a few questions?
9 upvotes · 20 comments
Just discovered SillyTavern and have a question about making real-world characters/events
r/SillyTavernAI
•
2mo ago
Just discovered SillyTavern and have a question about making real-world characters/events
4 upvotes · 16 comments
ST and story writing: how do I keep the AI aware of the previous story developments?
r/SillyTavernAI
•
1mo ago
ST and story writing: how do I keep the AI aware of the previous story developments?
6 upvotes · 15 comments
Should I create characters with AI or by hand? Which is better?
r/SillyTavernAI
•
2mo ago
Should I create characters with AI or by hand? Which is better?
5 upvotes · 32 comments
Bot repeating everything my character says
r/SillyTavernAI
•
17d ago
Bot repeating everything my character says
11 upvotes · 13 comments
Can you help me flush out idea for AI chatbot memory?
r/shopifyDev
•
9mo ago
Can you help me flush out idea for AI chatbot memory?
4 upvotes · 16 comments
What are the best character card creation tools you've found/made?
r/SillyTavernAI
•
11d ago
What are the best character card creation tools you've found/made?
13 upvotes · 17 comments
VIEW POST IN
Français
Português (Brasil)
简体中文
Русский
日本語
See more
Public
TOP POSTS
Reddit
reReddit: Top posts of January 4, 2026
Reddit
reReddit: Top posts of January 2026
Reddit
reReddit: Top posts of 2026
Home
Popular
News
Explore
Best of Reddit
Best of Reddit in Portuguese
Best of Reddit in German
Reddit Rules
Privacy Policy
User Agreement
Accessibility
Reddit, Inc. © 2026. All rights reserved.

Join the most real place on the internet

 Sign in with Apple
Continue with Email

By continuing, you agree to our User Agreement and acknowledge that you understand the Privacy Policy.