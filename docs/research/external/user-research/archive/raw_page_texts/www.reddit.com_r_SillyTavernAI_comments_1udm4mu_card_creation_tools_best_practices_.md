# Card creation: tools, best practices, recommendations thread. : r/SillyTavernAI

**URL:** https://www.reddit.com/r/SillyTavernAI/comments/1udm4mu/card_creation_tools_best_practices/

---

Skip to main content
Card creation: tools, best practices, recommendations thread. : r/SillyTavernAI
Sign Up
Log In
Expand user menu
Go to SillyTavernAI
r/SillyTavernAI
•
2mo ago
ExtremelyPatient
Card creation: tools, best practices, recommendations thread.
Help

Hey guys. Lots of times people say "create your own card" when asking for something and I actually want to! But I wanted to see if you have any tips/best practices/tools to share.

Particularly interested in those who tinkered with different formatting and ways to "tell" the model how to role play.

Locked post. New comments cannot be posted.
Share
AdobeDocumentCloud
•
Ad
Try the new Adobe Acrobat for free and combine trusted PDF features with quick design tools powered by Adobe Express.
Shop Now
adobe.com
Sort by:
Comments Section
GenericStatement
•
2mo ago
•
Edited 2mo ago
 Top 1% Poster

If you’re just chatting with one character, you can define your character with just bullet points. * Appearance:, * Clothes: etc.

If you’re doing a story with a bunch of predefined characters, then I’d recommend a blank character card called “narrator” and a preset that will work okay with that, and then put multiple character profiles in the Authors Note function in ST.

For multi-character stories, if you notice the model is mixing up character traits or losing details or making them bland, make sure characters are clearly labeled and separated with xml tags, and inject the authors note in the chat history at a low level (default is 4.)

If you’re letting the LLM define characters, you may want to habit it summarize the character into a profile so that you can put it in the authors note so it doesn’t forget the character details as the context grows

If you want to create new characters, LLMs are really good at that of you give them one of your existing characters templates to work from, especially if you give it a few constraints, like age, gender, world etc.

Here’s an example template that I use (my prompt used NPC to refer to simulated characters ). Note that each statement inside each section is written in plain English, usually with a list of attributes, starting with the character’s name. Starting each line with the character’s name really improves coherence and accuracy over long contexts, as do the XML tags.

<NPC_profile>
<name>Jenny von Drake</name>
<backstory>Jenny is a thirty-year-old grocery store clerk in Atlanta who … </backstory>
<appearance>Jenny has long straight blonde hair, blue eyes, …</appearance>
<clothes>At work, Jenny wears jeans, t-shirt, and crocs. At home, Jenny wears … etc</clothes>
<personality>Jenny is quick-witted, jovial, considerate, …</personality>
<behaviors>Jenny is clumsy, plays with her hair when nervous, …</behaviors>
<speaking_style>Jenny speaks with a stereotypical southern accent and dialect and uses short, simple words.</speaking_style>
<goals>Jenny wants to fit in with her coworkers etc.</goals>
<secrets>Jenny secretly wants/does/is etc. i.e. Jenny is actually from upstate New York</secrets>
<likes>Jenny likes waffles, cats, …</likes>
<dislikes>Jenny dislikes pancakes, dogs …</dislikes>
</NPC_profile>



Note that some of those could be consolidated, like speaking style as part of behaviors or goals as part of backstory, up to you.

Some tips for interesting characters.

Define their appearance down to fine details and don’t be afraid to use multiple phrases to describe a body part (blonde, honey-colored, golden hair), which helps the model give you more variety in the descriptions.

Give the character secrets and conditions where they will tell the secret (otherwise they might confess to anyone at any time) like: Jenny is secretly from upstate New York but will deny this to anyone unless they have physical proof.

Give your character goals and dreams of their own, both long term and within the story. Put something at stake: if they don’t complete the goal, they will suffer physical, psychological, or emotional death.

Give the character contradictory traits and behaviors, just like real people, e.g. hates dogs, loves going to the dog park. Was beaten by their father every night, wants to be a pro boxer. Boring accountant who drives a race car to work and has stacks of speeding tickets. The more contradictions the more interesting they will be. Real people are full of these things.

Give the character a past that matters, with upss and downs, traumas and successes. Define relationships with family, pets, lovers, etc and the results. Give them a wound (physical or psychological damage) that creates a weakness in them that they need to overcome to achieve their goals and show strength of will against the death stakes mentioned above. For example, dad left when she was young, afraid all men will leave her, dreams of getting married and having a family, hates being alone (must overcome fears to achieve goal and avoid misery).

Paperclip_Tank
•
2mo ago
 Top 1% Commenter

Find a template you like, its much easier / less scary to fill in a form then to create a character from total scratch. Just go to a character card you've enjoyed and rip out all the information till you just have a template.

Either your world info needs to have friction points and goals or your character card does. Basically the more friction points / goals you have the more "fuel" your LLM has to play with. And not all of these friction points need to be delivered at the same time or be of the same magnitude. In all honestly most of them should be tiny little speed bumps to slow you down from "The goal." If you don't want a long roleplay (whatever you define as long) you don't need to worry too much about it. But the longer you want things to go, friction points you need.

This is because LLMs are "problem solvers" so they'll try to solve goals, this gives it something to aim at, and some parts to play around with to make it more interesting.

A good way to wrap your mind around it is using Dungeons and Dragons, even if you're not doing a fantasy setting. You are both the DM (creator of the everything) and a player. Think of a generic book or movie character and just plop them into a DnD world. Because its just a character and that's it. There isn't any goal or friction. You won already! You did it! Yay! Now think about how bad of a book / movie that would be "The character existed" is not exactly a book / movie / adventure.

But once your LLM runs out of fuel that's when it turns into the "I have to tell the LLM everything, to push the story forward" problem. Because well, there isn't a forward any more. It got to the end point, you won. yay!

Hand writing each part also greatly greatly improves the roleplay quality, same with the intro message. The LLM will fart out an "average" instead of something with rough edges. Those rough edges are what can be the added friction points. Because you can just tell the LLM "The Character is named Bob" And it can define everything else. You can leave gaps, just do the parts you find important, and skip the parts that you don't find important.

Also no one is expecting your first character / world info / prompt / whatever else is related to this hobby to be good your first time.

Gaspara
•
2mo ago

This is a "must read" in my opinion, and it's fascinating as well: https://www.reddit.com/r/SillyTavernAI/comments/1ud6hkn/pushing_past_the_average_in_rp_abliterated_models/ot9nwd2/

iraragorri
•
2mo ago
 Top 1% Commenter

Each time I start typing, I remember u/huge-centipede exists and then stop typing and say: "yeah, what they said". I 100% agree with their takes on character creation.

What_Do_It
•
2mo ago
•
Edited 2mo ago

One thing I've been tinkering with is having degrees of influence. What I mean is that I'll have a section that is absolute traits that I don't want to change and I'll have another section that are circumstantial traits that might change during roleplay. I started experimenting with this because I found often times characters would hold onto traits that I wanted them to grow out of and/or seemingly drop traits that I felt were important to their characterization.

For instance;

ABSOLUTE TRAITS
[These are always in effect. No relationship, event, or instruction overrides them.]

Distrustful of authority

Physically cautious; never the first to act in an ambiguous situation

Speaks sparingly; never volunteers information unprompted. Communicates a lot through body language.

EMERGENT TRAITS
[These begin at their default state and evolve naturally through roleplay.]

Warmth toward {{user}}: Guarded - develops with demonstrated loyalty and worsens with betrayal

Willingness to share personal history: Deflects - may open up after shared hardship or shut down if feeling judged

Humor: Dry and Rare - grows more expressive with comfort or becomes sharper and more cynical when stressed

Herr_Drosselmeyer
•
2mo ago

A basic template would be:

Intro: "This is an uncensored roleplay with a focus on (insert genre, tone etc.)". Put special rules here too.

Setting: A brief explanation of the world and specific location(s) for the story

Character overview: age, gender, species (if needed), one sentence description ( like 'A cat maid in a Victorian mansion')

Character appearance: self-explanatory

Character background: their backstory and motivations

Character personality and quirks: Are they lively, shy, brooding? Do they have a lisp, are a heavy smoker... you get the idea

Character sexuality: if relevant, list their preferences and kinks here

Supporting cast: if you want to predefine other character rather than have the LLM invent them, give a description like you did for the main character.

Scenario: set up for the story that you don't want to have in the first message, otherwise it might get too long. What happened to lead up to where the RP starts.

Try not to not go overboard, overly long cards can sometimes give worse results.

Important: always remember that the way you write the card and the first message will be what influences how the LLM responds the most. You can tell the LLM how to write in the system prompt, but the card and first message will still guide how the RP plays out more than your instructions, both in style and content. For example, people sometimes wonder why their characters are overly horny, but their card spends 500 tokens explaining all their kinks in detail. 😉

persocum
•
2mo ago

i'm a relatively successful bot creator. imo the best way to create a character card is to put yourself in the shoes of a (pseudo)psychologist and a writer. every character is made up of tropes and archetypes. your goal is to feed as much information to the AI in as few words as possible

eg a small blurb like this will do MILES:
Gloria is a 21-year-old ESFP Genki Girl with a Lawful Good alignment. She has a secure attachment style, and loves to make new friends. She's a college student, but she's not doing too hot with her grades. Her fatal flaw: she's naïve and has a one-track mind. Once Gloria has her mind set on something, she won't stop until she winds up hurting someone she cares for.

The downside: you sort of run the risk of flanderizing your characters, but as long as you add some flavor and background, you'll be fine.

also, format doesn't particularly matter either as long as the overall card is easily parseable and well-organized, you can write it in one paragraph, or in bullet points—whatever works the best for you.

if you can write a blurb like that though without AI completely hand-holding you, you're already 90% of the way there.

EroSennin441
•
2mo ago

Not sure how much it helps, but I looked through cards I liked and pulled the sections they had out and combined them into a template. I went to Gemini and created a Gem for an expert character card creator, and told it to format everything in my template. Then when I want a character, I tell it who I want, the premise, and maybe add a picture, and it spits out character card info.

I create a new character in Sillytavern, add the info, picture, tags, and sometimes gallery images.

No_Income3282
•
2mo ago

My experience has been that simpler the better, both for tokens and coherence. Example:

Gender:

Physical Description:

Likes/Dislikes:

Skills: Etc...

LLM doesn't need a word salad. Use either brief descriptions, or the plus method. Likes: cherry vapes + vodka + bikinis.

Order matters. The first, middle, end priorities rule applies to char cards. Ask your model, it will describe this to you.

A character card is like a brief job resume and a dnd character sheet, not a reality tv show bio.

My opinion. Your mileage may vary.

u/Meshyai
•
Ad
Base Mesh to 8K in Minutes.
meshy.ai
Sign Up
FrenchFrozenFrog
•
2mo ago

honestly the biggest thing that clicked for me is that a card is a character but a story is a system, and most card advice stops at "fill in the personality box." the personality box is flat and always-on. every word of it is in context every single turn, which means it cant change, cant stay hidden til its relevant, and cant react to anything. lorebooks (world info) are how you fix all three of those.

the way i think about the division of labor now:

the card itself holds constants only. who the character is in turn one and still is in turn three hundred. body, voice, core wound, the unchanging stuff. nothing situational goes here.

then each main character gets their own lorebook with keyed entries. physical details, preferences/texture, vulnerabilities and pressure points, that kind of thing. the key part (literally) is theyre keyed, so the physical entry only loads when something mentions how he looks, the pressure point entry only loads when the scene is actually poking at his wound. two reasons this matters. one, your not bloating context with his full appearance during a convo about the weather. two, it keeps the model focused, the right depth surfaces exactly when its needed instead of being one line buried in a wall of always-on text.

the technique almost nobody uses though, and its the best one: a STATUS entry. you make one constant (always on) entry that describes not who the character is but WHERE THEY ARE on their arc right now. how much of his emotional armor is still up. how much of her resistance has worn down. and you just edit it as the story moves. then you have your other entries reference it, like "how he reacts when provoked depends on current status." now the same poke gets a cold armored reaction early and a raw exposed one later, and the character actually evolves without you rewriting the card. a flat card physically cannot do this. this is the thing that made my guy feel like he had a trajectory instead of being the same beat every scene.

then theres a world lorebook (setting, rules, locations, tone) and a cast lorebook (every side character whos not worth a full card, each one a keyed entry that fires on their name). thats how you populate a whole world without making fifteen seperate cards.

random stuff i learned the hard way:

keys are an interface not an afterthought. give each entry a bunch of trigger words including synonyms and oblique ones. "his eyes" "looking at him" "his face" should all pull the same entry. sparse keys = the entry just never fires when you need it and you wonder why hes being generic.

constant vs keyed is an actual decision. constant = always enforced, use it for the few things that must never drift (core tone, the status entry, the one central rule of your world). keyed = on demand. if you make everything constant you just rebuilt the bloated flat card with extra steps.

and the big one, examples steer way harder than description. the single biggest fix i ever made to a character wasnt editing the description, it was adding example dialogue of him talking the way i actually wanted. the model imitates examples way more faithfully than it follows adjectives. if your character keeps coming out wrong, write a mes_example of him coming out RIGHT before you touch anything else. i wasted so much time tweaking adjectives before i figured this out.

couple smaller ones. write instructions as positives not negatives, "he grants, he does not yield" works better than "hes not submissive," models act on what to do more than what not to do. and keep each fact in exactly one place so when something plays wrong theres one entry to fix and nothing can quietly contradict itself.

the mental model that ties it together for me: card is the actor, lorebooks are the script + set + supporting cast + stage directions, and the status entry is the one page you rewrite between scenes so the actor knows where in the arc they are.

mechasquare
•
2mo ago

How are you managing updates to "Status"? Is this something you're manually doing or do you have an automated method?

FrenchFrozenFrog
•
2mo ago

Two ways. I keep a lorebook with memories stacked from the extension memory books. Once I finish a scene, I often also load the chat in Claude, it helps me devise a current status for my lore entry, which I can reimport in JSON or just copy the text.

Claude also helps me devise the author's note for the next scene (so the current status is between scenes, and the author's note is during scenes).

kangdenny
•
2mo ago

I use OpenWebUI Workspaces. I usually ask GPT or Claude Opus to generate a starter template, then manually tweak the preset until it behaves the way I want.

You can also use custom GPTs (ChatGPT) or Gems (Gemini), but keep in mind they're more limited since they won't generate NSFW character cards.

sigiel
•
2mo ago

My sincere advice is

1 look at the real api call, it is in the cmd console, start with char completion request.
copy pate it to notepad , and look for consistency.

is your chat completion completely garble, a wall of text ? , does it have clear structure? Are data packet in logical order and clearly identified?

Does it have soul. And skill first ? (Sota model are now trained with this and xml tagging)

that for the first layer, you need to have it clean, if you ever want to have your character working, can’t build on shaky foundations.

2- xml tag, <main-character> is a must in my opinion, it clearly tell what this is, not just dump a bunch of state descriptions and expect it to know it is one.
The. Sub tag for each, appearance, perfect clothing, background, alignment, nature, nurture ,ect.. all clearly tagged.

3- write your character card a instructions to impersonate, don’t listen to anyone tell you otherwise. Do not write prose or interviews style of first persons, do not use flowery language,

use instruction, directed at the model,

Char is this bla bla bla, char react like this… bla bla bla , you should emphasis char dislike for bla…

instruction on how to impersonate.

the character card is a small part of an instruct api call, pure and simple,breaking pattern is confusing the model. That basic,

everyone that say otherwise never looked under the hood, remember step 1,
Silly tavern is just one api call for each round , instruction for an ai to narrate base on context provided, that includes the chat completion setting. That is instruct .

unbaked89
•
2mo ago

I found using PLists and the Ali:Chat format very useful for generating high quality character cards.

https://wikia.schneedc.com/bot-creation/trappu/introduction

AutoModerator
•
2mo ago

You can find a lot of information for common issues in the SillyTavern Docs: https://docs.sillytavern.app/. The best place for fast help with SillyTavern issues is joining the discord! We have lots of moderators and community members active in the help sections. Once you join there is a short lobby puzzle to verify you have read the rules: https://discord.gg/sillytavern. If your issues has been solved, please comment "solved" and automoderator will flair your post as solved.

I am a bot, and this action was performed automatically. Please contact the moderators of this subreddit if you have any questions or concerns.

People also ask about section
People also ask about
Best card creation tools for AI
Top practices for card design
Recommended AI card generators
Community favorite card formats
Effective card creation workflows
Public
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