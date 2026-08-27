# Collection System

Status: `TESTED / PARTIAL`

Collections organize up to 100 ordered World references. Creator supports name/description/tags, Public/Link-visible/Only-me, owned/public World selection, search, drag ordering and async save. Detail exposes edit/share/delete/favorite.

The dedicated browse directory currently renders a finite 56-card public catalog in one pass. It exposes URL-backed full-text search across title/description/tags/creator, Popular/Latest sort and All/My-Collection author scope. Query, sort and owner filter compose and survive reload; Clear resets the canonical `/collections` baseline. Public scope omits link-visible/only-me objects, while the owner-only Mine scope includes all three visibility types without a card visibility badge. Cards are whole links with no nested favorite/menu control in the current build.

Membership add, keyboard reorder and removal all live in an editable draft and become authoritative only after `保存合集`. Removal is immediate in the local editor, has no per-item confirmation, returns the World to the add-candidate list, then Save shows `正在保存…`, redirects to detail and survives detail/edit reload. The tested removal did not increment Notifications. Link-visible external enforcement and both empty/non-empty disposable Collection deletion are verified. Non-empty final delete makes detail/edit 404, removes Search/Profile/member-World reverse projections and preserves the referenced World/version/save; only-me external enforcement, eventual indexing, notification and backend-retention rules remain open.

Evidence: EVD-0027, EVD-0183, EVD-0184, EVD-0191, EVD-0206, EVD-0216, EVD-0241.
