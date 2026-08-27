Sitemap

[Open in app](https://play.google.com/store/apps/details?id=com.medium.reader&referrer=utm_source%3DmobileNavBar&source=---top_nav_layout_nav-----------------------------------------)

[](https://medium.com/?source=---top_nav_layout_nav-----------------------------------------)

Get app

[Write](https://medium.com/m/signin?operation=register&redirect=https%3A%2F%2Fmedium.com%2Fnew-story&source=---top_nav_layout_nav-----------------------new_post_topnav------------------)

[Search](https://medium.com/search?source=---top_nav_layout_nav-----------------------------------------)

Unknown user

[## UX Collective](https://uxdesign.cc/?source=post_page---publication_nav-138adf9c44c-6837dd5cc977---------------------------------------)

·

[UX Collective](https://uxdesign.cc/?source=post_page---post_publication_sidebar-138adf9c44c-6837dd5cc977---------------------------------------)

We believe designers are thinkers as much as they are makers. <https://linktr.ee/uxc>

[Game Development](https://medium.com/tag/game-development?source=post_page---header_tags--6837dd5cc977---------------------------------------)

[Audio Design](https://medium.com/tag/audio-design?source=post_page---header_tags--6837dd5cc977---------------------------------------)

[Sound Design](https://medium.com/tag/sound-design?source=post_page---header_tags--6837dd5cc977---------------------------------------)

[UX](https://medium.com/tag/ux?source=post_page---header_tags--6837dd5cc977---------------------------------------)

[Game Design](https://medium.com/tag/game-design?source=post_page---header_tags--6837dd5cc977---------------------------------------)

# A game sound designer’s guide to button interactions

## Understanding auditory feedback for basic interaction patterns in games.

[Denis Zlobin](https://deniszlobin.medium.com/?source=post_page---byline--6837dd5cc977---------------------------------------)

[Denis Zlobin](https://deniszlobin.medium.com/?source=post_page---byline--6837dd5cc977---------------------------------------)

11 min read

·

Jun 12, 2024

[](https://medium.com/m/signin?actionUrl=https%3A%2F%2Fmedium.com%2F_%2Fvote%2Fuser-experience-design-1%2F6837dd5cc977&operation=register&redirect=https%3A%2F%2Fuxdesign.cc%2Fa-game-sound-designers-guide-to-button-interactions-6837dd5cc977&user=Denis+Zlobin&userId=4c4c45833a8&source=---header_actions--6837dd5cc977---------------------clap_footer------------------)

\--

[](https://medium.com/m/signin?actionUrl=https%3A%2F%2Fmedium.com%2F_%2Frepost%2Fp%2F6837dd5cc977&operation=register&redirect=https%3A%2F%2Fuxdesign.cc%2Fa-game-sound-designers-guide-to-button-interactions-6837dd5cc977&user=Denis+Zlobin&userId=4c4c45833a8&source=---header_actions--6837dd5cc977---------------------repost_header------------------)

[](https://medium.com/m/signin?actionUrl=https%3A%2F%2Fmedium.com%2F_%2Fbookmark%2Fp%2F6837dd5cc977&operation=register&redirect=https%3A%2F%2Fuxdesign.cc%2Fa-game-sound-designers-guide-to-button-interactions-6837dd5cc977&source=---header_actions--6837dd5cc977---------------------bookmark_footer------------------)

[Listen](https://medium.com/m/signin?actionUrl=https%3A%2F%2Fmedium.com%2Fplans%3Fdimension%3Dpost_audio_button%26postId%3D6837dd5cc977&operation=register&redirect=https%3A%2F%2Fuxdesign.cc%2Fa-game-sound-designers-guide-to-button-interactions-6837dd5cc977&source=---header_actions--6837dd5cc977---------------------post_audio_button------------------)

Share

Press enter or click to view image in full size

This image is AI-generated

In videogames, most interactions stem from pressing a button, whether physical or virtual. The press of a button is a deceptively simple action. The way we perform it leads to different outcomes depending on the interaction pattern, each having its proven use cases and tied popular mechanics. This article outlines these patterns and explores how to support them with sound.

If you are new to my blog — welcome! Here I write about game audio design from a functional perspective, focusing on using and contextualizing sounds rather than creating them. Since most good things start with “why?”, let’s begin with why this article exists.

Hearing is a distinct sense that delivers a lot of information to the human brain. It works differently from vision, being more efficient in some aspects , and less efficient in others. To me, a big part of a sound designer’s job is to make sure that audio provides the player with the same level of valuable information as visuals do. This way we make games more accessible and fun, but also enable prolific synergies within the development team.

As a sound designer, I always thought I have a good intuitive understanding of interaction feedback. But after making a few questionable design choices and hearing the results of similar choices made in other games, I decided to delve a bit deeper into the topic, overthink it once, and return with a model I could refer to whenever I’m doubtful. Well, here it is.

## Components of auditory feedback

Auditory feedback to an interaction consists of up to three optional components. I call them _consequential sound_ , _input reaction_ , and _system response_ . Let’s explore what they are.

### Consequential sound

Product sound designers differentiate between [consequential and intentional sounds](https://www.sciencedirect.com/science/article/abs/pii/B978008045089650006X) . Consequential sounds come from moving parts of the physical device. Intentional sounds are the ones that sound designers deliberately add to a product. Every sound we create for a video game is intentional, so we usually don’t think about consequential sounds and don’t use this term. But they are still a part of what players hear while playing games on PC and consoles. Consequential sounds of gaming input devices include button clicks, noise from haptic actuators, and plastic creaks when we squeeze the device hard during a challenging gameplay sequence. Even though we have no control over these sounds, I find it important to acknowledge their presence and the function they can assume.

Usually, the consequential sound from a physical button is a simple form of input confirmation. By hearing the click and feeling the button movement the player confirms that they sent their command to the hardware. While this feedback does not convey a lot of meaning, it is still a piece of information that makes interaction feel responsive and controllable. This type of feedback becomes particularly important for the interaction patterns that require precise timing or a sequence of button presses.

Due to their nature, consequential sounds are only worth your attention when they are missing but shouldn’t be. It happens when they are relevant to the interaction pattern, but the input method on the target device is silent (think touchscreens and motion controllers). In this case, you might want to add an input reaction message, which can be a sound, a haptic impulse, or both. I’ll elaborate on this below. In other cases, feel free to entirely ignore the concept because you have literally no control over existing consequential sounds.

Press enter or click to view image in full size

Many people pay special attention to consequential sounds when selecting a mechanical keyboard. Photo by [Chris Hardy](https://unsplash.com/@chrishardyphotography?utm_source=medium&utm_medium=referral) on [Unsplash](https://unsplash.com/?utm_source=medium&utm_medium=referral)

### Input reaction

The sound that plays when you press or release a button or tap a touchscreen. Its function depends on the type of interaction, but normally it reinforces the input and signifies the action you performed in the game, like pressing a virtual button or shooting a firearm.

### System response

While input reaction signifies the action, the system response communicates its result. It becomes particularly useful when the interaction can cause different meaningful outcomes or when the result is delayed in time. For instance, if the player makes an in-app purchase, they should hear the rewarding “ka-ching!” not right after pressing the “purchase” button, but once the purchase is confirmed on the server. Another example is a bullet hit sound that telegraphs whether you hit or missed the target, and what kind of object took the hit.

Although this feedback component doesn’t always have to be present, the absence of an expected sound is still a sound . In this sense, the lack of response can communicate its own meaning. For instance, if you didn’t hear any footsteps after trying to move your character, you know they didn’t move. If you fire a weapon and don’t hear the bullet impact, you immediately know you missed the target. But if for some reason your game doesn’t have bullet impact and hit marker sounds at all, the absence of these sounds will likely misinform the player. Keep this in mind when deciding whether a particular interaction needs this type of feedback or not.

Before I move on to describing interaction patterns, let’s review three feedback components using an imaginary gameplay sequence as an example:

_In a stealth action game, the player shoots at an enemy NPC with a bow from a hideout. The arrow kills the target. The other enemy NPC witnesses this and sets up an alarm. Multiple enemies are now searching the area for the player._

During this scenario, the player hears the following sounds relevant to their actions:

1\.Button press click  
2\. Bow stretch sound  
3\. Button release click  
4\. Bow release thump sound and arrow swish  
5\. Hit marker sound that signifies a successful kill  
6\. Enemy NPC scream  
7\. Body fall sound  
8\. NPC voice line about setting an alarm  
9\. Diegetic alarm sound  
10\. Footsteps and dialogue of the enemies actively searching for the player.

In this sequence, sounds 1 and 3 are consequential, 2 and 4 belong to the input reaction category, and 5 is a system response. The other five sounds (6–10) were not intentionally designed as interaction feedback, but still assume such function in the gameplay context. I call such sounds _emergent auditory feedback,_ and this article is not about them. I mention them to show where I draw the line between embedded and emergent auditory feedback to an interaction.

Press enter or click to view image in full size

An AI-generated image based on the description above

## Button interaction patterns in games

Since I am no specialist in interaction design, I referred to a [conference paper](https://www.researchgate.net/publication/324602507_Single_Button_Interaction_Technique_Patterns_Applied_to_Digital_Game_Design) exploring single button interaction techniques in games. I slightly modified the list provided there, removing the separate entry for QTE interaction (since from a sound design perspective it is no different from Precision Press) and adding Release as a distinct interaction pattern. I also added my own descriptions and examples.

* **Press** . Button press executes the interaction. Like a gunshot.
* **Release.** Button press initiates the interaction, and button release executes it. Like some interactions with UI elements.
* **Multipress** . A rhythmic sequence of button presses executes the interaction. Like a combo in a fighting game.
* **Hold** . Button press starts looped execution of the interaction. Button release stops the execution. Like a gas pedal in a vehicle.
* **Hold and Release** . Button press initiates the interaction, and button release executes it if the player has kept the button pressed for a specified time. Like a charged attack.
* **Time Limited Hold** . Button press initiates the interaction. It executes once the player has kept the button pressed for a specified time. Often used for important actions you don’t want to perform by accidentally misclicking, like skipping a cutscene.
* **Precision Press** . Button press executes the interaction only if it has occurred within a specified time window. Like a perfect block.
* **Pump** . Button press executes the interaction and keeps executing it in a loop as long as the player keeps rapidly pressing the button. Like running away from a powerful enemy in a scripted sequence.

## Interaction patterns and auditory feedback components

Now let’s match the button interaction patterns with the auditory feedback components introduced above.

### Press

_Consequential sound_ : Unimportant  
_Input reaction_ : On press  
_System response_ : Contextual

## Get Denis Zlobin’s stories in your inbox

Join Medium for free to get updates from this writer.

Subscribe

Subscribe

Remember me for faster sign in

The simplest and the most common interaction pattern in videogames: you press a button, and something happens. You experience it when firing a shotgun, jumping, or performing a melee attack in an action game.

Such interactions need a press input reaction and an optional system response. The consequential sound from the button is not important, but any delay between it and the press input reaction will influence the overall feel of the interaction because what we hear influences how we experience time . A system response is necessary if the interaction produces different results or if the result is not immediate. This is a general rule of thumb that holds for most patterns, so I’ll avoid repeating it in the following sections.

### Release

_Consequential sound_ : Important  
_Input reaction_ : Possible on press, necessary on release  
_System response_ : Contextual

Almost the same pattern as the previous one, but the interaction executes on button release. You often experience it when interacting with UI elements using a mouse of a touchscreen. The same interactions can switch between the Press and the Release patterns based on your input device. For example, the interactions that execute on button release with a mouse may execute on button press once you switch to a controller.

In many cases, the combination of a consequential sound, a release input reaction and an optional system response is sufficient to support it, but there is a notorious exception. If the target device produces no consequential sound, a designed press input reaction will increase the subjective responsiveness and the sense of control over the interaction.

My favorite and the most overlooked example is the addition of a press input reaction to touchscreen interactions that execute on finger release. Not only are touchscreens inherently silent and static, but by interacting with them, the user blocks at least part of the visual information with their finger. This generates a tiny, unnoticeable moment of uncertainty: Does it work? Did I press the right thing? A subtle, barely audible sound or a haptic impulse helps resolve that, resulting in a more natural, controllable and pleasant experience. Additionally, if a player can cancel the interaction by moving the finger elsewhere, the press input reaction will suggest that it is possible.

### Multipress

_Consequential sound_ : Important  
_Input reactions_ : Final press in the sequence  
_System response_ : Contextual

This interaction pattern tells the game to do something special after the player presses the button multiple times, keeping a certain rhythm. The best examples are a combo in a fighting game, or a special attack in a beat-em-up.

In this case, the feedback from the consequential sounds becomes meaningful, guiding the player during the input phase. The interaction-specific press input reaction sound plays only from the final press in the sequence. The system response, if present, follows the final press.

I rarely see this interaction pattern on the input devices that don’t make consequential sounds, but if I needed to support one, I would experiment with reinforcing the presses with a separate auditory or haptic press input reaction.

Press enter or click to view image in full size

Fighting games such as Mortal Kombat often utilize the Multipress interaction pattern

### Hold

_Consequential sound_ : Unimportant  
_Input reactions_ : On press and release  
_System response_ : Contextual

This type of interaction keeps running as long as you keep the button pressed. You experience it when driving a car, aiming, shooting an automatic rifle, or sprinting in an action game.

In this case you always want to use both press and release input reaction components — to start and stop a loop, play one-shot sounds or both. Note that in my articles, I call things like “stopping a loop” a sound, and I explained my reasons in a separate post .

A consequential sound plays an interesting part here: though not important for the interaction itself, it can make it feel sluggish when the press input reaction has a slow attack. My favorite solution for this is to always include a very quiet, but quick and snappy layer to immediately tell the player that the game is about to react to their input.

### Hold and Release

_Consequential sound_ : Unimportant  
_Input reactions_ : On press and release  
_System response_ : Contextual

This interaction is similar to the previous one and has the same feedback component requirements. The key difference between the two is if the Hold pattern stops the interaction on button release, the Hold and Release pattern uses the hold part for charging or preparation and executes the interaction on button release. The best example is any form of charged attack, like shooting a bow. In some cases, the player needs to keep the button pressed for some time, otherwise the interaction will get cancelled.

A press input reaction is necessary to communicate the start and the progress of the interaction. A release input reaction has two functions: it either reinforces the execution of the interaction or communicates its cancellation if the player releases the button early. Obviously, you need different release input reactions for such occasions.

### Time limited hold

_Consequential sound_ : Unimportant  
_Input reactions_ : Contextual  
_System response_ : Necessary

With this pattern we execute the interaction if we hold the button pressed for a certain amount of time. If we release the button early, we cancel the interaction, while timely and late button release have no effect. In most cases, Time limited hold is reserved for important actions you don’t want to perform by accident, like making a purchase, skipping a cutscene or exiting the game.

The most important feedback component in this case is system response, because it accompanies the execution of the interaction and tells us when we are free to release the button. Release input reaction helps to communicate early cancellation of the interaction but should be avoided post-execution. Press input reaction helps communicate the initiation progress of the interaction but at a time it can feel overwhelming, so some designers omit it for aesthetic reasons.

### Precision Press

_Consequential sound_ : Important  
_Input reactions_ : On press  
_System response_ : Necessary

This interaction pattern is similar to the basic Press, but the player needs to execute it within a certain time window. [QTE](https://en.wikipedia.org/wiki/Quick_time_event) interactions, perfect blocks and similar defensive moves, and nearly anything you do in rhythm-based games fall into this category.

Since we mostly navigate in time by hearing and poor timing means failing the interaction, both consequential sound and a press input reaction deliver some value to the player: a noticeable time difference between the two will indicate an input lag. Since the player cannot fully predict whether the interaction was successful, the system response is necessary to communicate the result.

### Pump

_Consequential sound_ : Important  
_Input reactions_ : Contextual  
_System response_ : Necessary

A less common interaction pattern requires you need to quickly mash the button to perform some high-impact action like moving a heavy object or running away from something dangerous.

Since in this case the input intensity is fairly high, even “silent” devices start to produce some sort of consequential sound, and it happens to be the main auditory feedback component for this interaction pattern.

Press input reaction might exist for narrative or aesthetic reasons, but it doesn’t tell a lot about how interaction is going. The system response, whether it is positive or negative, tells the player that the game doesn’t need them to mash the button any longer.

Here is a [cheat sheet](https://docs.google.com/spreadsheets/d/1Iz18pPjZxDt43HD3e1xYlF3iliNRWHTSdFi86W9LYEA/edit?usp=sharing) with a condensed summary of this post. Remember, these are heuristics — guidelines to help you, not strict rules. Feel free to ask questions or share your comments wherever you found this article!

[Game Development](https://medium.com/tag/game-development?source=post_page---footer_tags--6837dd5cc977---------------------------------------)

[Audio Design](https://medium.com/tag/audio-design?source=post_page---footer_tags--6837dd5cc977---------------------------------------)

[Sound Design](https://medium.com/tag/sound-design?source=post_page---footer_tags--6837dd5cc977---------------------------------------)

[UX](https://medium.com/tag/ux?source=post_page---footer_tags--6837dd5cc977---------------------------------------)

[Game Design](https://medium.com/tag/game-design?source=post_page---footer_tags--6837dd5cc977---------------------------------------)

[](https://medium.com/m/signin?actionUrl=https%3A%2F%2Fmedium.com%2F_%2Fvote%2Fuser-experience-design-1%2F6837dd5cc977&operation=register&redirect=https%3A%2F%2Fuxdesign.cc%2Fa-game-sound-designers-guide-to-button-interactions-6837dd5cc977&user=Denis+Zlobin&userId=4c4c45833a8&source=---footer_actions--6837dd5cc977---------------------clap_footer------------------)

\-- [](https://medium.com/m/signin?actionUrl=https%3A%2F%2Fmedium.com%2F_%2Fvote%2Fuser-experience-design-1%2F6837dd5cc977&operation=register&redirect=https%3A%2F%2Fuxdesign.cc%2Fa-game-sound-designers-guide-to-button-interactions-6837dd5cc977&user=Denis+Zlobin&userId=4c4c45833a8&source=---footer_actions--6837dd5cc977---------------------clap_footer------------------)

\--

[](https://medium.com/m/signin?actionUrl=https%3A%2F%2Fmedium.com%2F_%2Frepost%2Fp%2F6837dd5cc977&operation=register&redirect=https%3A%2F%2Fuxdesign.cc%2Fa-game-sound-designers-guide-to-button-interactions-6837dd5cc977&user=Denis+Zlobin&userId=4c4c45833a8&source=---footer_actions--6837dd5cc977---------------------repost_footer------------------)

[](https://medium.com/m/signin?actionUrl=https%3A%2F%2Fmedium.com%2F_%2Fbookmark%2Fp%2F6837dd5cc977&operation=register&redirect=https%3A%2F%2Fuxdesign.cc%2Fa-game-sound-designers-guide-to-button-interactions-6837dd5cc977&source=---footer_actions--6837dd5cc977---------------------bookmark_footer------------------)

[UX Collective](https://uxdesign.cc/?source=post_page---post_publication_info--6837dd5cc977---------------------------------------)

[UX Collective](https://uxdesign.cc/?source=post_page---post_publication_info--6837dd5cc977---------------------------------------)

[## Published in UX Collective](https://uxdesign.cc/?source=post_page---post_publication_info--6837dd5cc977---------------------------------------)

[626K followers](https://uxdesign.cc/followers?source=post_page---post_publication_info--6837dd5cc977---------------------------------------)

· [Last published 1 hour ago](https://uxdesign.cc/what-luxury-bags-can-teach-designers-about-how-to-adapt-to-a-changing-deal-3c06caba673d?source=post_page---post_publication_info--6837dd5cc977---------------------------------------)

We believe designers are thinkers as much as they are makers. <https://linktr.ee/uxc>

[Denis Zlobin](https://deniszlobin.medium.com/?source=post_page---post_author_info--6837dd5cc977---------------------------------------)

[Denis Zlobin](https://deniszlobin.medium.com/?source=post_page---post_author_info--6837dd5cc977---------------------------------------)

[## Written by Denis Zlobin](https://deniszlobin.medium.com/?source=post_page---post_author_info--6837dd5cc977---------------------------------------)

[1K followers](https://deniszlobin.medium.com/followers?source=post_page---post_author_info--6837dd5cc977---------------------------------------)

· [48 following](https://medium.com/@deniszlobin/following?source=post_page---post_author_info--6837dd5cc977---------------------------------------)

Functional Audio and Audio UX in video games. I write articles about game audio design that teach you nothing about DAWs, plugins, game engines, and middleware.