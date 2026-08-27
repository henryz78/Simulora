# Sharing System

Status: `TESTED UI / PARTIAL external flow`

World share composer generates posters at 4:5/1:1/9:16 and supports save poster, copy link/copy text, X intent and OS share. X content includes title/description/#WorldOS/canonical URL. Share is linked to rewards verification. External post was not sent.

Public Profile sharing uses a different contract: `分享主页` immediately copies the canonical Profile link and shows `链接已复制`, with no modal or poster composer in the tested mobile viewport.

Achievement sharing returns to the poster pattern: 1:1/4:5/9:16 ratios, async poster generation, save, link/text copy, X intent, OS share and rewards handoff. Its X payload combines achievement + World + `#WorldOS` but links the achiever's Profile URL.

Evidence: EVD-0038, EVD-0102–0103.
