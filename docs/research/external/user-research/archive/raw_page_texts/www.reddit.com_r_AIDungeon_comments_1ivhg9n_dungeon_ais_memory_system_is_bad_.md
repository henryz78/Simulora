# Dungeon AI's Memory system is Bad : r/AIDungeon

**URL:** https://www.reddit.com/r/AIDungeon/comments/1ivhg9n/dungeon_ais_memory_system_is_bad/

---

Skip to main content
Dungeon AI's Memory system is Bad : r/AIDungeon
Sign Up
Log In
Expand user menu
Go to AIDungeon
r/AIDungeon
•
2y ago
melancholy-life
Dungeon AI's Memory system is Bad
Bug Report

It took me a while of making scenarios and playing with Dungeon AI before I realized how bad its memory system is. It's terrible. Here is what happens to every single adventure regardless of how much you pay. Eventually, your character cards are ignored.

The adventure starts off well enough, respecting the character cards, everything is working

As more memories are stored, they eat up more of the available input tokens

Character cards are loaded less frequently until there is no space for them at all

You start waste your time manually deleting dumb memories

You turn off automatic memories so you can manage them yourself

You realize that your character cards still aren't loading because even without any memories, dungeonai is using nearly your entire token allotment on dialogue history so your character cards still don't load

You come to reddit to complain about what should be a really easy fix

All that needs to change is to allow a player to create a quota of tokens for character cards or dialogue history. This is just simple prompt building. Adding the controls to the gameplay settings will probably take more time than letting the user dictate a reserve of quota for character cards.

Read more
Share
Sort by:
Comments Section
East_Custard103
•
2y ago

A priority system for story cards would be nice for smaller contexts.

Meanwhile here are some measures you can take to help you out:

As you found out, disabling auto summarization is really important since the longer your story becomes, the less helpful it will be, until it is actively hurting the cohesion of your story.

Memory bank can still be left on as it actually functions rather nice, unless you are really hurting for context.

I had good results leaving the description of my main character and their single most important companion (if you have one) on the plot essentials.

For story cards, make sure you use their trigger words effectively.

For illustration purposes, let's say you have a few story cards for different friends, and their only trigger word is their name. If you mention in context something about your friends but their name wasn't mentioned then their story cards won't load.

You can amend that a few ways. You can mention their names every time their name goes out of the context length (You can check it). Or you can put variations of the word "friend" on their trigger, which I don't recommend if you have a lot of similar story cards. Or you can make a list of friends somewhere with their names, it can be on plot essentials or a dedicated story card with the trigger for friends, from which the Ai will fish a name from, and then on the next action trigger the story card.

Reply
Share
melancholy-life
•
2y ago

I'm not having an issue with story cards triggering. I'm having an issue with the algorithm deciding to send only discussion history, plot, essentials, and AI instructions, leaving no space for the 3-4 triggered cards. It's literally prioritizing past discussion over the designed story. It's probably not clear, but my memories were taking up about half of the tokens. I cleared them all out to try to get the story cards to send, then it just sent more discussion history. The problem is the story reaches a certain length and cards are triggered, but not sent.

East_Custard103
•
2y ago
•
Edited 2y ago

Yeah i get what you're saying. That's why I'm not a fan of long winded Ai instructions (not saying that's your case), so i keep the instructions short, and the memories trimmed for the current "story arc" to avoid this sort of problem

3 more replies
Peptuck
•
2y ago

As you found out, disabling auto summarization is really important since the longer your story becomes, the less helpful it will be, until it is actively hurting the cohesion of your story.

It doesn't help that auto-summarization can generate mistakes or weirdness in language or dialogue. It's an AI summarizing an AI and feeding that back into the AI, and that can lead to recursive shit.

I always turn off auto-summary myself.

FKaria
•
2y ago

I think they should disable memories for now.

Also maybe they need a better explanation about cards. I keep seeing people here complaining about their cards not loading and I don't know how many times we had to explain how cards work in the subreddit.

melancholy-life
•
2y ago

You think avoiding all card use is reasonable in favor of sending larger discussion histories? This means some characters, places, etc will never be encountered because the discussion has gone on too long.

OkAd469
•
2y ago
•
Edited 2y ago

Yeah, it's not stable. It keeps duplicating the same memories over and over. And if you delete the duplicates it deleted the whole thing.

Silver_Ad_1411
•
2y ago

Yeah, I’ve had alot of issues with memory lately, also generation, when hitting continue it tends to repeat literally everything from the story..

Bdubz49101
•
5mo ago

I was looking for something different from AIRealms and after playing for 4 hours it started acting weird example: caravan of rogue soldiers with mounted machine guns ect, then while negotiations and loading supplies attacked but forgot about all of the other men and firepower. Then started changing spontaneously where we were and who was attacking us. Was a terrible experience.

NewNickOldDick
•
2y ago

There are plenty of problems with the AID. I am free user so I have to cope with very small number of tokens and I also absolutely hate doing manual corrections. If I have to manually edit responses or plot summary, why wouldn't I simply write the whole story myself and save frustration of getting bollocks output from AI?

I've literally screamed at the AI (in text) for introducing 15th Isabelle with green eyes within span of fifteen minutes. It doesn't help putting 'use unique names' in AI Instructions if memories are so short that AI doesn't remember that Isabelle was used just a minute or two ago. Also, I don't get it's fascination with green eyes.

I've learned to remind AI about things in my input. For example, my character came back from France to UK and AI kept thinking I was still in France because Story Summary had references to it. So I added to my inputs "As I am now back in England, ..." which reminded AI where I actually was. Regardless, I got prices in dollars and such shait until I deleted Story Summary and things improved.

Repeated output is also one that freaks me out. It's said that you get repeats when AI doesn't have new info to process so hitting Continue several times might increase chance of getting repeats. Because of this I have habit of adding short, rather unnecessary "I still wait" -type of inputs to throw AI forward in the story telling instead of getting repeats. This seems to work but sometimes I get repeats even after meaningful inputs from me. Go figure.

PS: Kudos for number 7.

_Cromwell_
•
2y ago

I've literally screamed at the AI (in text) for introducing 15th Isabelle with green eyes within span of fifteen minutes.

This will make it introduce more Isabelles. :)

NewNickOldDick
•
2y ago

Unfortunately yes. AI is such a parrot, it repeats what you say to it regardless of the context.

2 more replies
CerealCrab
•
2y ago

This is true, in my last adventure it would try to name male characters Marcus about 75% of the time, I got frustrated and screamed at it to stop naming everyone Marcus, and it started naming everyone Marcus 100% of the time.

(It didn't help that there was a major character named Marcus earlier in the story who had died and he was still mentioned in the plot essentials, so not only did it keep trying to name new characters Marcus and sometimes saying "not to be confused with your friend Marcus who died", but it also kept trying to bring the dead Marcus back to life like "The hooded figure turns out to be Marcus who you thought was dead!" no matter how I tried to explain to it to not do that)

2 more replies
Tactical_Ferrets
•
2y ago

Just makes me think of the book we are bob

RedditIsFockingShet
•
1y ago

"I don't get it's fascination with green eyes."

Weird. For me, I can never get it to refer to a character as having green eyes, every character is asserted to have amber eyes, even when I make it very clear on their character card that their eyes are green and not amber.

NewNickOldDick
•
1y ago

That was four months ago. Now, AI is enthralled with women who bite their lower lip and still step perpetually closer.

1 more reply
RedditIsFockingShet
•
1y ago

My personal issue isn't with the memories taking up tokens, it's with the memories being obviously wrong half the time, describing events which simply never happened in the story or getting them just completely wrong. I've gone from being a visitor to a fantasy world, to the memory randomly deciding that I'm the king of that world, derailing the story for ages until I realised what had happened. I've also seen it split a character and their title into two different characters, insist on using feminine pronouns for a male character (despite stating their pronouns and exclusively using masculine pronouns on their character card), and turn a human character into a dog.

And often it just completely forgets how to use pronouns entirely. And I don't even mean "gender pronouns", I mean all pronouns, including leaving out "your", "its", and "it", when they're obviously supposed to be there; or making grammatically incorrect constructions like "yours chest" instead of "your chest". I think this is partially a result of trying to summarise and shorten the memories by leaving out connecting words, and then drawing on those overly-contracted memories when generating new responses.

The memory system eating up all the tokens wouldn't be anywhere near as much of a problem if the information stored in the memories was grammatically correct and at least vaguely accurate to the events of the story.

More posts you may like
Related posts
BetterRepository | The ultimate web repository for AI Dungeon resources
r/AIDungeon
•
7mo ago
BetterRepository | The ultimate web repository for AI Dungeon resources
6
61 upvotes · 11 comments
AI Dungeon sucks now
r/AIDungeon
•
2mo ago
AI Dungeon sucks now
64 upvotes · 56 comments
94% of You Would Miss AI Dungeon, We're Not Going Anywhere.
r/AIDungeon
•
4mo ago
94% of You Would Miss AI Dungeon, We're Not Going Anywhere.
5
87 upvotes · 22 comments
Ai Dungeon is ruining me
r/AIDungeon
•
1mo ago
Ai Dungeon is ruining me
26 upvotes · 7 comments
AI Dungeon features are lagging behind and really needs an wake up call
r/AIDungeon
•
2mo ago
AI Dungeon features are lagging behind and really needs an wake up call
135 upvotes · 90 comments
why do you use AI dungeon?
r/AIDungeon
•
6mo ago
why do you use AI dungeon?
8 upvotes · 26 comments
Can AI Dungeon Handle a Massive Long-Term RPG With Multiple Progression Systems?
r/AIDungeon
•
1mo ago
Can AI Dungeon Handle a Massive Long-Term RPG With Multiple Progression Systems?
13 upvotes · 26 comments
AI Dungeon can be such a bad writer
r/AIDungeon
•
7mo ago
AI Dungeon can be such a bad writer
23 upvotes · 14 comments
New to updated AI Dungeon, how do I ensure the ai remembers details? Also any tips for a new user?
r/AIDungeon
•
3mo ago
New to updated AI Dungeon, how do I ensure the ai remembers details? Also any tips for a new user?
10 upvotes · 16 comments
My biggest gripe with AI Dungeon
r/AIDungeon
•
5mo ago
My biggest gripe with AI Dungeon
41 upvotes · 13 comments
Does deleting your ai dungeon account on the app permanently delete all your stories, actions and data from ai dungeon's data base?
r/AIDungeon
•
3mo ago
Does deleting your ai dungeon account on the app permanently delete all your stories, actions and data from ai dungeon's data base?
14 upvotes · 33 comments
Why do people build amazing AI Dungeon worlds… and never publish them?
r/AIDungeon
•
4mo ago
Why do people build amazing AI Dungeon worlds… and never publish them?
28 upvotes · 87 comments
Dungeon AI acting up for anyone else?
r/AIDungeon
•
2mo ago
Dungeon AI acting up for anyone else?
32 upvotes · 6 comments
Making AI Dungeon Run Smoother: Tips from a Story-Obsessed Player
r/AIDungeon
•
9mo ago
Making AI Dungeon Run Smoother: Tips from a Story-Obsessed Player
54 upvotes · 32 comments
How's AI Dungeon nowadays?
r/AIDungeon
•
20d ago
How's AI Dungeon nowadays?
10 upvotes · 13 comments
AI Dungeon is fundamentally incapable of understanding slapstick comedy.
r/AIDungeon
•
19d ago
AI Dungeon is fundamentally incapable of understanding slapstick comedy.
29 upvotes · 8 comments
Has AI dungeon changed much since february/march?
r/AIDungeon
•
21d ago
Has AI dungeon changed much since february/march?
9 upvotes · 15 comments
AI Dungeon DESPERATELY needs a feature for world maps and lore images.
r/AIDungeon
•
1mo ago
AI Dungeon DESPERATELY needs a feature for world maps and lore images.
50 upvotes · 31 comments
[RELEASE] TWISTS AND TURNS — a script that gives your AI Dungeon story real plot twists, built from clues it already wrote
r/AIDungeon
•
15d ago
[RELEASE] TWISTS AND TURNS — a script that gives your AI Dungeon story real plot twists, built from clues it already wrote
8 upvotes · 9 comments
(Teaser) BetterDungeon V2: I'm Working On It
r/AIDungeon
•
2mo ago
(Teaser) BetterDungeon V2: I'm Working On It
2
88 upvotes · 12 comments
Latitude, Instead of making updates about Daily Streaks, why not Implement Betterdungeon and Dungeon Extension Features?
r/AIDungeon
•
24d ago
Latitude, Instead of making updates about Daily Streaks, why not Implement Betterdungeon and Dungeon Extension Features?
61 upvotes · 13 comments
Not sure if anyone else has been getting this
r/AIDungeon
•
13d ago
Not sure if anyone else has been getting this
32 upvotes · 9 comments
Excuse me?
r/AIDungeon
•
1mo ago
Excuse me?
43 upvotes · 24 comments
What?
r/AIDungeon
•
1mo ago
What?
2
89 upvotes · 31 comments
It's 4.0 already and this f*cking game still messes up my controls EVERY time
r/starcitizen
•
2y ago
It's 4.0 already and this f*cking game still messes up my controls EVERY time
23 comments
VIEW POST IN
Русский
日本語
简体中文
See more
Public
TOP POSTS
Reddit
reReddit: Top posts of February 22, 2025
Reddit
reReddit: Top posts of February 2025
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