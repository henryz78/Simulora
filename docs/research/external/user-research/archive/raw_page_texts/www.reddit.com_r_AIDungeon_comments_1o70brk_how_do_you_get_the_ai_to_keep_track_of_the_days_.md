# How Do You Get the AI to Keep Track of the Days? : r/AIDungeon

**URL:** https://www.reddit.com/r/AIDungeon/comments/1o70brk/how_do_you_get_the_ai_to_keep_track_of_the_days/

---

Skip to main content
How Do You Get the AI to Keep Track of the Days? : r/AIDungeon
Sign Up
Log In
Expand user menu
Go to AIDungeon
r/AIDungeon
•
10mo ago
JustAAnormalDude
How Do You Get the AI to Keep Track of the Days?
Questions

For one of my adventures I'm using Story Cards and AI instructions saying it's May 3rd of 1400 ad an example. Will this work? Or any alternatives?

Share
Sort by:
Comments Section
MightyMidg37
•
10mo ago

Without a script to handle this, you’d likely need to update your Plot Essentials or Authors Note to tell it what the specific day is, if you’re expecting it to know what day it is, day after day.

Reply
Share
Simple-Budget-1415
•
10mo ago

Maybe a good use for story summary?

Reply
Share
GenderBendingRalph
•
10mo ago

That's how I do it. To prevent overloading context window, I gradually scroll no-longer-relevant details off the top (or summarise into one sentence) and append new changes to the bottom.

Reply
Share
_Cromwell_
•
10mo ago

You can put the year in and then it will know what year it is. You can put what season it is and it will keep track of that obviously.

Really think long and hard if it's really that important for it to know exactly what day it is, though. Is that really that important to your story? If you are making a scenario about school or work or something it probably is. If you're just adventuring around, does it matter what exact date it is or even what day of the week? Might not be worth the effort.

If it is worth the effort, then like somebody else I already said you need a script. There are some available on the Discord. But like anything using a script to force feed dates to the AI is always going to be a bit clunky.

Reply
Share
JustAAnormalDude
•
10mo ago

I'm doing an alternate history starting at 1400 AD, so I put the start May 3rd and am keeping track, it's on June 1st right now. It's easier so I can keep track of coronation and diplomatic actions, and then Story Card them.

I thought scripts only worked in scenarios, or could only be applied there?

_Cromwell_
•
10mo ago

that is correct. I guess I assumed you were making/using a custom scenario. But if this is from a scenario from somebody else, no you can't add a script to the adventure you launched.

You can just update the date each day manually when you 'wake up' if it is important to you/your tale. :)

Just something in Plot Essentials like

Today is June 1 in year 1400 AD.

2 more replies
EVIL_REALITY_SHIFTER
•
10mo ago

If you are a fan of Alternate history + AI games, you should check out the game called "PaxHistoria."

https://www.paxhistoria.co/

Previous-Musician600
•
10mo ago

Deepseek and Nova are good at this. Add in PE:

Example: [Today date: 08062025. Location: New York] { [Timeline Events]:

08052025 - flight to New York

08062025 - flight to Las Vegas

08072025 - Party with Ben in Las Vegas }

Then it knows it's in new York and your character wants to fly from new York to Las Vegas today and that the next day is a party in Las Vegas with Ben. Important is to write short descriptions behind the date and only one line. Perhaps 08062025 (morning) - Xyz and 08062025 (afternoon) - ABC would work too, but then you need to add morning, midday etc to the first line with the current date.

It even knows that you flew yesterday to New York and so on. It just doesn't count how many days until X happens. But it realized that new York was before Las Vegas.

You don't need Locations. Then it just doesn't move around and place everything around your character.

It didn't work that good with other AIs, but you could add something to AI Instructions about the Timeline and the date today, to remind it to check it and then it could work too, or with a better headline as just Timeline Events. DL likes more specific descriptions.

missmortiss
•
10mo ago

the AI, regardless of model, seems...iffy, I tend to keep how many days its been in plot essentials but it..can get confused..deeply..deeply confused like it will note X has been here for only 4 days and then in the same post note Y has watched X do...whatever for weeks/months

I've been debating keeping it AN cause AN seems to keep clothing states better.

GenderBendingRalph
•
10mo ago

Things AI (in general, not just AID) can't remember consistently in roleplay:

How much time has passed

What time/day/month/year it is

Its own character name

NPC names

What anybody is or isn't wearing

Important details you told it the previous action

Current or previous locations

Otherwise_Task7876
•
10mo ago

This is heavily to do with the logic of the model, this will often happen on free models, but higher tier models like deepseek, Hermes, and more do much better at being inclusive of all details. 

Retswerbj
•
4mo ago

I manually input Story Summary so I use that. I do: Day 3: Date The important stuff that happened Day 2: Date The important stuff that happened Day 1: Date The important stuff that happened

Etc. with the newest date always at the top. It's been working well for me with a story set in 2002.

More posts you may like
Related posts
What AI instructions do you use? Need suggestions improving my standard AI instructions.
r/AIDungeon
•
1y ago
What AI instructions do you use? Need suggestions improving my standard AI instructions.
21 upvotes · 16 comments
How to keep track of T1’s schedule?
r/SKTT1
•
1y ago
How to keep track of T1’s schedule?
13 upvotes · 20 comments
Well damn
r/AIDungeon
•
8d ago
Well damn
33 upvotes · 13 comments
AI just changed my story into a horror scenario :D
r/AIDungeon
•
6mo ago
AI just changed my story into a horror scenario :D
4
26 upvotes · 10 comments
Issue with AI displaying own thoughts
r/AIDungeon
•
2mo ago
Issue with AI displaying own thoughts
57 upvotes · 21 comments
AI Instructions Guide: Function, Design, and Examples
r/AIDungeon
•
8mo ago
AI Instructions Guide: Function, Design, and Examples
17 upvotes · 6 comments
How do I stop the AI from glazing me?
r/AIDungeon
•
2mo ago
How do I stop the AI from glazing me?
53 upvotes · 13 comments
Question about the ai and NSFW
r/AIDungeon
•
1y ago
Question about the ai and NSFW
22 upvotes · 36 comments
Just gonna leave this excerpt here with no context
r/AIDungeon
•
2mo ago
Just gonna leave this excerpt here with no context
47 upvotes · 7 comments
Which AI models, in your opinion, are the best? I’m getting bored with dynamic large.
r/AIDungeon
•
2mo ago
Which AI models, in your opinion, are the best? I’m getting bored with dynamic large.
10 upvotes · 7 comments
My current AI Instructions
r/AIDungeon
•
8mo ago
My current AI Instructions
34 upvotes · 15 comments
Is there any way to not allow the AI to speak/act for your character?
r/AIDungeon
•
1y ago
Is there any way to not allow the AI to speak/act for your character?
14 upvotes · 21 comments
Why can't the reflourished devs add simple tick marks if you've completed the tourist trap stuff?
r/PlantsVSZombies
•
1y ago
Why can't the reflourished devs add simple tick marks if you've completed the tourist trap stuff?
3 upvotes · 19 comments
I would HOPE the guy doesn't say anything!
r/AIDungeon
•
1mo ago
I would HOPE the guy doesn't say anything!
45 upvotes · 8 comments
Is this a bug
r/AIDungeon
•
12d ago
Is this a bug
28 upvotes · 12 comments
How do I make the most of AI game reviews?
r/baduk
•
10mo ago
How do I make the most of AI game reviews?
5 upvotes · 9 comments
Does this Replace character ai
r/AIDungeon
•
2mo ago
Does this Replace character ai
9 upvotes · 10 comments
Any Guides for interacting with the AI better?
r/AIDungeon
•
1y ago
Any Guides for interacting with the AI better?
9 upvotes · 10 comments
Um...what?
r/AIDungeon
•
3mo ago
Um...what?
68 upvotes · 12 comments
What's going on with filters?
r/AIDungeon
•
14d ago
What's going on with filters?
52 upvotes · 23 comments
Daily Streaks (I hate it)
r/AIDungeon
•
11d ago
Daily Streaks (I hate it)
135 upvotes · 31 comments
Model Problems #2: Muse
r/AIDungeon
•
3mo ago
Model Problems #2: Muse
26 upvotes · 9 comments
AI Instructions/Authors Notes
r/AIDungeon
•
4mo ago
AI Instructions/Authors Notes
10 upvotes · 5 comments
AI doesn't even know alphabet
r/AIDungeon
•
5mo ago
AI doesn't even know alphabet
31 upvotes · 6 comments
The image system feels like it's being left in the dust.
r/AIDungeon
•
2mo ago
The image system feels like it's being left in the dust.
28 upvotes · 18 comments
VIEW POST IN
Русский
Français
简体中文
日本語
See more
Public
TOP POSTS
Reddit
reReddit: Top posts of October 15, 2025
Reddit
reReddit: Top posts of October 2025
Reddit
reReddit: Top posts of 2025
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