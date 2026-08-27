# Responsive Behavior

Status: `PARTIAL / TESTED`

At 390×844 and deterministic 360×844: mobile top/bottom nav replaces desktop sidebar; World Creator keeps publish, templates, Apps, visibility and mobile preview; Simulation can run either stacked/free-window layout or a dedicated story-first phone shell. The phone shell uses `剧情 / 手机 / 设置`, exposes a phone home screen for Apps, and can switch back and forth with Free Sandbox without resetting the Story. No horizontal overflow in the tested Creator/Simulation samples. At 844×360 the same save changes to a multi-panel landscape layout without state loss. Long-press organization, OS software-keyboard/IME, safe-area/notch and background suspension remain device-bound.

## Search boundary

`/zh-cn/worlds/search` exposes a mobile-style return button, unified search placeholder, recent searches, type tabs and grouped result sections. However, the in-app browser's explicit 390x844 override did not apply to this route (`innerWidth` evaluated as 1280), so true narrow-width layout and touch behavior remain UNKNOWN.

Evidence: `EVD-0067`, `EVD-0096`.
