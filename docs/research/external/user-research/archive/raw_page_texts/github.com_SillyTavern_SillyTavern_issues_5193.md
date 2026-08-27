# [FEATURE_REQUEST] <title>Feature Request: Allow World Info Entries to Support Stateful / Conditional Activation · Issue #5193 · SillyTavern/SillyTavern

**URL:** https://github.com/SillyTavern/SillyTavern/issues/5193

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
[FEATURE_REQUEST] <title>Feature Request: Allow World Info Entries to Support Stateful / Conditional Activation
 #5193
New issue
Open
Feature
Description
Broxhb
opened 
Last edited by Broxhb
Have you searched for similar requests?

Yes

Is your feature request related to a problem? If so, please describe.

No

Problem Description

First of all, World Info in SillyTavern is already extremely powerful and well designed. It works very well for keyword-based contextual insertion.

However, there is currently no way to precisely control activation of individual entries in a stateful manner.

I would like to request support for stateful / mutually-exclusive activation logic in World Info (Lorebook) entries.

World Info entries are currently triggered purely based on:

Keyword matching
Scan depth
Probability
Inclusion groups

However, there is no built-in way to make entries depend on a persistent state variable.

This makes it difficult to implement state-switching logic such as:

When keyword A is triggered → Entry A becomes active
When keyword B is triggered → Entry B becomes active and Entry A becomes inactive
When keyword C is triggered → Entry C becomes active and Entry B becomes inactive

In other words, only one entry in a group should remain active at a time, and activating a new one should automatically deactivate the previous one.

Practical Issue

Currently, if two unrelated entries both match keywords within scan depth, they will both be inserted into context.

Even if they are logically mutually exclusive, there is no built-in way to prevent both from appearing.

This leads to:

Wasted tokens
Reduced context efficiency
Lower text quality due to conflicting or unnecessary lore entries

World Info is already excellent, but it lacks precise per-entry state control.

Current Limitation
Inclusion Groups only control which entry is inserted during the same scan pass.
Probability manipulation via /setentryfield breaks reactivation because probability=0 prevents future triggering.
Automation ID + Quick Reply can run scripts after activation, but World Info entries themselves cannot depend on a persistent state.
There is no native condition field to check global or conversation memory variables.

This makes implementing a true state machine using only World Info very difficult.

Describe the solution you'd like

One of the following would solve the issue:

Option 1: Add Conditional Activation Support

Allow World Info entries to define a condition field, such as:


condition: Memory["current_active"] == "A"



This would allow entries to activate based on a persistent variable.

Option 2: Built-in Mutual Exclusive Group Mode

Add a setting to Inclusion Groups like:


Group Mode: Stateful Exclusive



Behavior:

When a new entry in the group is triggered,
It automatically becomes the active state,
All other entries in that group become inactive until explicitly triggered.
Option 3: Built-in State Variable Support

Allow World Info entries to set and read internal state variables without relying on external scripts.

Example:

Entry A sets state = A
Entry B sets state = B
Only entry matching current state remains active
Use Cases
Story state transitions
Character mode switching
Scene changes
Environmental state tracking
RPG systems
Dynamic lore state changes
Why This Matters

Currently, achieving this behavior requires complex workarounds using:

Automation ID
Quick Replies
Probability manipulation
External scripts

A built-in stateful activation system would greatly simplify advanced narrative systems, improve token efficiency, and reduce reliance on hacky solutions.

Thank you for your work on SillyTavern.

Describe alternatives you've considered
Alternative Approaches Considered

Before submitting this request, I explored several possible workarounds:

1. Using Inclusion Groups Only

Inclusion Groups can limit simultaneous insertion during the same scan pass.
However, they do not persist state across turns, and they cannot ensure that previously activated entries become inactive in future scans.

This does not solve long-term state switching.

2. Manipulating Entry Probability via /setentryfield

I attempted dynamically changing probability to 0 or 100 when switching states.

However:

Probability = 0 prevents future reactivation.
Any value below 100 still introduces randomness.
It becomes difficult to restore previous entries cleanly.
It behaves more like a permanent disable than a temporary state toggle.

This approach is fragile and not truly stateful.

3. Automation ID + Quick Reply Scripts

Using Automation IDs to trigger Quick Replies can modify fields after activation.

However:

World Info entries themselves cannot check persistent variables.
The logic becomes external and hard to maintain.
It increases complexity significantly for what should be a simple state switch.
It does not prevent multiple unrelated entries from triggering before the script runs.

This feels more like a workaround than a native solution.

4. Using Global or Chat Memory as a State Marker

I also considered storing the active state in memory and embedding conditional text logic inside entries.

However, since World Info does not support activation conditions, entries cannot directly check memory values before insertion.

As a result, this cannot truly control activation — it only affects generated output after insertion.

Because of these limitations, a built-in stateful activation or conditional system would provide a much cleaner and more robust solution.

Additional context

No response

Priority

High (The app does not function without it)

Are you willing to test this on staging/unstable branch if this is implemented?

Yes

Activity
Broxhb
added 
🦄 Feature Request
[ISSUE] Suggestion for new feature, update or change
 
Broxhb
added the
Feature
issue type 
Wolfsblvt
added 
💤 Low Priority
[ISSUE][PR] Nice to have, but not currently in scope
 
🗺️ World Info
[ISSUE][PR] This is related to world info
 
👍 Approved
[ISSUE] This issue has been marked by maintainers for contributors as approval to implement
 
Wolfsblvt commented 
Wolfsblvt
Member

I think the "easiest" way to do something like this with the current world info architecture is using keyword matching, especially with the secondary keywords as a NOT condition, and including the relevant triggers as part of the world info itself.

You can use something like [Triggers: MyBlah] inside the content of your first entry. And then use this as a trigger key on entry 2, while using this as a NOT key on entry 3.
Now, of course this means this content would be part of the prompt. This can be removed via a simple Regex script in the regex extension.

I know it sounds convoluted, and it likely is, but it's theoretically possible.

I have thought many times about a good way to build "chains" of world info entries. Or like, referencing other WI entries as key triggers or NOT triggers.
It's possible, but I haven't thought of a great concept yet.

What's going around in my head right now would be allowing WI entries be referenced by UID (and optionally book name) inside the keys and secondary keys. So you can specify that an entry will be triggered by entry X, or can't be triggered when entry Y is active, etc.
There would need to be a syntax to writing this, but the design would be similar-ish to the keys, and maybe even be included in the key fields.

What do you think?

kinthaiofficial commented 
kinthaiofficial
 · Hidden as spam
Sign up for free
 to join this conversation on GitHub. Already have an account? Sign in to comment
Metadata
Assignees
No one assigned
Labels
👍 Approved
[ISSUE] This issue has been marked by maintainers for contributors as approval to implement
💤 Low Priority
[ISSUE][PR] Nice to have, but not currently in scope
🗺️ World Info
[ISSUE][PR] This is related to world info
🦄 Feature Request
[ISSUE] Suggestion for new feature, update or change
Type
Feature
Projects
No projects
Milestone
No milestone
Relationships
None yet
Development
No branches or pull requests
Participants
Issue actions
Open in GitHub Copilot app
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