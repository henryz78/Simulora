# Chat System

Status: `PARTIAL / TESTED`

Chat App lists World Characters, supports new/select conversation, image attachment, input and message editing. Sending consumes a global Turn and locks other Apps. Responses can reference Story/Map facts and update shared relationship state; player messages appear in `新消息`. Chat is rewound with Turn state.

In `文游小手机` mode, Chat is a persistent bottom-dock `💬` App rather than a free window. Character list → thread → send uses in-phone navigation with `back`; a real McGonagall message consumed Turn 1 and 9 energy, appeared in Events with a generated scene plus character reply, and changed the main action suggestions even though the Story page itself did not advance. This shows Chat's Turn output can affect the next-action suggestion layer independently from Story pagination.

Evidence: EVD-0042, EVD-0020, EVD-0097.
