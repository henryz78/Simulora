# Notification System

Status: `TESTED / PARTIAL`

Global Notification button opens a modal; its empty state is `还没有通知`. Toast notifications are separately used for saves, publishes, installs, items and copied objects.

Cross-account actions have now populated the durable notification stream:

- Follow: `🎯 {user} 关注了你`, deep-linking the actor's Profile.
- Favorite, Comment and World Remix records preserve actor/object text and route to Profile, source/child World or another named destination.
- System/announcement/referral/ranking events can route to App, Rewards or World; a literal-`#` broadcast closes without navigation.

Opening the notification center commits read state: the numeric badge clears and remains cleared after reload while records are retained. The current sample silently paginates 10+10+4 to a 24-row terminal and then removes the load helper without end copy. Seven event types were observed. Per-item read styling, delivery SLA, retention horizon, cross-device sync, preferences and several mutation categories remain unknown.

Evidence: EVD-0118, EVD-0158, EVD-0245.
