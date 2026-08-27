# Yo, newb here, chatgpt swore I could find persistent injectable memory with this UI but where is it? · SillyTavern/SillyTavern · Discussion #4055 · GitHub

**URL:** https://github.com/SillyTavern/SillyTavern/discussions/4055

---

Skip to content
Navigation Menu
Platform
Solutions
Resources
Open Source
Enterprise
Pricing
Sign in
Sign up
SillyTavern
/
SillyTavern
Public
Notifications
Fork 6.2k
 Star 32.6k
Code
Issues
436
Pull requests
152
Discussions
Actions
Security and quality
12
Insights
Yo, newb here, chatgpt swore I could find persistent injectable memory with this UI but where is it? #4055
xMalikhix started this conversation in General
xMalikhix

Ok, so chatgpt is helping me put together a working character model... But I really want a working persistent injectable memory. The whole concept falls apart without it and I dont' care that I'm a little new, I will run the gauntlet to figure how to get it.

Chatgpt rec'd a Memory_Manager_v2, but it's no longer hosted. It seems that it's been superceded by SillyTavern's own internal Lorebook and World Info. But these are not persistent nor evolvable in a complex Memory Profile with extensive blocks.

Don't try to kneecap me here, just help me get persistent memory with injection. Where can I find this?

1
Replies:
1 comment · 1 reply
Oldest
Newest
Top
Cohee1207
Maintainer

The closest you can get is the Vector Storage with (optionally) Data Bank, as they don't require lot of manual maintenance.

Relevant docs:

https://docs.sillytavern.app/extensions/chat-vectorization/
https://docs.sillytavern.app/usage/core-concepts/data-bank/

ChatGPT is not a good source of knowledge of SillyTavern. Most often the details are just hallucinated.

2
1 reply
xMalikhix
Author

Ha, most often... After about 4 or 5 ( I forget at this point) very frustrating nights of "Did you verify what you're telling me before you told me".... And that's with the gpt4o...

Anyway, I moved on from sillytavern anyway. It was looking like a frankenstein of patched mods by the time I got anywhere near what I was looking for. Not very stable and since gpt couldn't remember where we started I couldn't get support for my weird mashing of mods.

Mainly writing this out as a PSA to anyone else dropping by this thread. Don't rely too heavily on Chatgpt. Great tool, far from perfect.

Sign up for free to join this conversation on GitHub. Already have an account? Sign in to comment
Category
General
Labels
None yet
2 participants
Footer
© 2026 GitHub, Inc.
Footer navigation
Terms
Privacy
Security
Status
Community
Docs
Contact
Manage cookies
Do not share my personal information