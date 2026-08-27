# Research notes — working source log

## UI audio and feedback
- Denis Zlobin, “A game sound designer’s guide to button interactions” (UX Collective, 2024): auditory feedback can be decomposed into consequential sound, input reaction, and system response. The article distinguishes immediate input confirmation from delayed outcome confirmation and notes that silence can itself communicate failure or non-movement. Source: https://uxdesign.cc/a-game-sound-designers-guide-to-button-interactions-6837dd5cc977
- Joseph Marchuk, “Approaching UI Audio from a UI Design Perspective - Part 1” (Audiokinetic, 2019): map audio structure to interface structure; use simplicity, visibility/hearability, feedback, tolerance, and reuse. Distinct systems should have distinct sonic palettes; dynamic mixing or sidechain can elevate important events without clutter. Source: https://www.audiokinetic.com/en/community/blog/approaching-ui-audio-ui-design-perspective-1
- SAE Institute, “Game Audio Design: Creating Immersive Soundscapes”: game audio can communicate emotional tone, orientation, character identity, environment, events and threats. Layer ambience, effects and music; use spatial audio and adaptive music; optimize assets for target devices. Source: https://www.sae.edu/gbr/insights/game-audio-design-creating-immersive-soundscapes/
- Kafili & Brennan, “Architectonics of Videogame Sound Design: The Use of Sound and Music in Creating Immersive Virtual Spaces” (Architecture and Culture, 2025): sound is both atmospheric and functional; it can support orientation and environmental storytelling. Case studies include Rain World, Stray and Journey. Source: https://doi.org/10.1080/20507828.2025.2530892

## WebGL / spatial motion
- Anderson Mancini, “Case Study: Windland — An Immersive Three.js Experience” (Codrops, 2022): mini-city with post-processing and micro-interactions; use baked lighting, Draco-compressed GLB, vertex shaders for lightweight vegetation animation, raycasting + camera tween for selection, and dynamic quality based on measured FPS. Source: https://tympanus.net/codrops/2022/04/25/case-study-windland-an-immersive-three-js-experience/
- The Monolith Project (WebGPU Showcase, 2025): a scroll-driven digital story combining hand-drawn illustration, 3D worlds, sound, shader-driven transitions, layered particle systems, and modular rendering. Its core lesson is that transitions can function as narrative rather than page decoration. Source: https://www.webgpu.com/showcase/the-monolith-project/; demo: https://themonolithproject.net/
- Google Maps Platform “Build Immersive Experiences”: useful reference direction for map-based spatial storytelling and current-world communication. Source: https://mapsplatform.google.com/solutions/build-immersive-experiences/

## Initial design hypotheses
1. Use a three-layer sonic model: input reaction → system response → ambient/emergent world sound.
2. Treat every major event as a state transition with visual, sonic and environmental consequences.
3. Use a persistent world clock and weather state to modulate color temperature, particle density, ambient mix and notification intensity.
4. Prefer cheap/high-value CSS and 2D canvas effects first; reserve WebGL/shaders for map overview, hero observatory field, and rare state crossings.
5. Include user-controlled “quiet mode” and reduced-motion behavior; never surprise users with autoplay audio.

## Live browser observation
- The Monolith Project landing page was opened directly on 2026-08-25 for visual validation of the public demo link. The initial viewport was a blank/loading state with no accessible text or controls detected; the WebGPU Showcase page provides the readable project description and demo URL.

## Direct interview evidence
- Journey audio team interview (Designing Sound, 2012): character foley is tied to cape length, wind speed and player velocity; footsteps vary by surface; sand interactions were recorded from physical sand; a hot, still desert was built from processed and panned room tone. The composer describes music and sound design as interwoven, with foley directly influencing the musical writing. Source: https://designingsound.org/2012/02/28/qa-with-the-audio-team-of-journey/

# Asset Library research pass — 2026-08-25

## Verified playable / listenable entries
- Three.js official examples: https://threejs.org/examples/ — browsable, directly runnable examples covering animation/keyframes, terrain, raycasting, interactive points/lines, instancing, lights, loaders, postprocessing and many WebGL categories. Best for technical reference and prototype decomposition; not a content asset license.
- Sonniss GameAudioGDC archive: https://sonniss.com/gameaudiogdc/ — official archive page with downloadable sound effect collections. The visible page states the sounds are royalty-free and commercially usable for media production, with no attribution required and unlimited projects; it also explicitly says AI/ML training is prohibited. Confirm the current bundle license before shipping.

## Additional verified assets and demos
- Rive official site: https://rive.app/ — directly shows interactive canvas examples and positions the product around state-machine-driven interactive experiences across Web, React, React Native, Unity and Unreal. High reference value for character entrance, UI states, event arrival and looping world elements. Commercial use depends on the specific Rive community asset and runtime/editor plan; treat as “tool + curated asset license required,” not automatically free.
- MapTiler WebGL weather article/demo: https://www.maptiler.com/news/2021/05/visualize-weather-forecast-with-webgl/ and live demo https://www.maptiler.com/tools/weather/ — real weather visualization with wind/wave particles, time interpolation, tiled data loading, client-side WebGL shaders, custom color scales, zoom/rotate/tilt and mobile optimization. Strong reference for world map motion and weather state; direct commercial use requires MapTiler product terms / plan, while the interaction pattern itself is inspiration.

# Asset expansion pass — verified sources

- Tabletop Audio: https://tabletopaudio.com/ — directly playable 10-minute ambiences and music organized by fantasy, scifi, historical, modern, nature and horror. Excellent listening reference for city, interior, fantasy and sci-fi scene beds; not treated as a commercial asset source without explicit license confirmation.
- Mixkit Ambience: https://mixkit.co/free-sound-effects/ambience/ — page states 170 free ambience effects and lists directly playable examples including city traffic, urban day, office, restaurant crowd, forest, rain, thunderstorm, futuristic sci-fi computer, river/birds and campfire. Use under the current Mixkit license; commercial use is stated for free SFX, but retain per-item records.
- FMOD Studio: https://www.fmod.com/studio — official adaptive audio middleware page. It describes event-driven audio, randomization/modulation, mixer snapshots, parameters, live update and profiling; current pricing page lists Indie free or $2,000/title depending on revenue/budget thresholds, then Basic/Premium tiers. Tool use is conditional on current license, not an asset license.
- Pixabay License Summary: https://pixabay.com/service/license-summary/ — official summary permits free use, no attribution and modification subject to prohibited uses; prohibits standalone redistribution and warns about trademarks, recognizable people and additional third-party rights. Treat individual media as conditional commercial use.
- Globe.gl GitHub: https://github.com/vasturiano/globe.gl and examples at https://globe.gl/ — open-source ThreeJS/WebGL globe with examples for day/night, clouds, heatmaps, ripple rings, arcs, particles, markers and custom layers. Good source-code reference; textures/data remain separate rights questions.
- mapbox/webgl-wind: https://github.com/mapbox/webgl-wind — open-source WebGL wind particle visualization, described as capable of rendering up to 1 million wind particles at 60fps. Strong source/code reference for living map wind fields; verify repository license and data rights before reuse.
- jo56/procedural-terrain: https://github.com/jo56/procedural-terrain — browser-based procedural terrain generator using Rust, WebAssembly and WebGPU, with GPU-computed heightmaps and real-time chunk streaming. High-value world-generation source reference; check repository license before integration.
- LottieFiles commercial animations and license remain useful for low-complexity loading, success, notification and character-state motion. Official license: https://lottiefiles.com/page/license; commercial collection: https://lottiefiles.com/free-animations/commercial.

## Expansion pass — browser verified
- Tabletop Audio official page: https://tabletopaudio.com/ — live page exposes SoundPad, Zones, keyword search and category filters Fantasy, Scifi, Historical, Modern, Nature, Horror. The site describes original 10-minute ambiences and music for games and stories; visible examples include City of Wonders, Urban Rooftop, Restaurant/indoor-like scenes, Robot Caretaker, Storm Giant, forest and town settings. Use as direct listening reference; commercial reuse of recordings is not assumed.
- FMOD Studio official page: https://www.fmod.com/studio — exposes Download, Watch: Live Update, Multitrack, Mixing and Profiling, plus Licensing links. It describes adaptive music/sound, event editor, randomization, modulation, mixer snapshots, live update, real-time profiling and Unity/Unreal integrations. Current page shows Indie Free or $2,000/title for smaller teams, Basic $6,000/title and Premium $18,000/title; thresholds and licensing must be checked at time of purchase.

## More verified expansion sources
- OpenGameArt commercial audio collection: https://opengameart.org/content/audio-commercial-use-ok — browser page exposes playable previews and links to 58 Random Sound Effects, Dream Ambience, Ghost Town, RPG Sound Pack, CC0 breaking/falling/hit SFX and many music loops. The collection is explicitly described as CC0, but individual resource pages should still be checked before shipping.
- ZapSplat project-use guidance: https://www.zapsplat.com/can-i-use-your-sound-effects-in-my-project/ — official page states Standard License sounds can be used in commercial games/apps and can be mixed into a project, but free users need credit unless they upgrade; assets cannot be redistributed as standalone files or be the main value of an app. Good for city/nature/UI/notification prototypes, with attribution or paid upgrade required.

# Rare scenarios expansion — verified research

- TimelineJS official: https://timeline.knightlab.com/ — official page describes an open-source timeline tool, with live examples, Google Sheets/JSON input, media embeds (YouTube, Vimeo, Google Maps, SoundCloud etc.), and advice to keep chronological stories short. The page was reachable through extracted content but browser interaction hit a captcha; treat as direct reference/source entry, not a downloaded asset.
- NUKnightLab TimelineJS3 source: https://github.com/NUKnightLab/TimelineJS3 — open-source repository for the timeline implementation. Useful for world history, memory recall, branch/rewind-like chronological narrative scaffolding; verify repository license before shipping.
- Jacq/crowd-sim: https://github.com/Jacq/crowd-sim — GitHub page exposes demo, src, test and MIT LICENSE. README describes a 2D JavaScript crowd simulator with multiple agent groups, walls, waypoints and a demo folder. Good for city ambient motion, crowd flow and faction grouping; old codebase means compatibility and performance need testing.
- Babylon.js: https://www.babylonjs.com/ — open web rendering engine entry with demos and source ecosystem. Useful for 3D NPC/city scenes, character idle and world-state prototypes; runtime/library licensing and individual assets should be verified separately.

## Rare scenarios — audio and state animation

- MDN Web Audio spatialization: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Web_audio_spatialization_basics — official page includes a live 3D boombox demo and source links; documents AudioListener, PannerNode, HRTF panning, distance models, cones and moving a sound source. Direct browser/API reference for spatial ambient emitters, character proximity and map event audio. No external asset license; API usage is browser-native.
- Rive State Machine Overview: https://rive.app/docs/editor/state-machine/state-machine — official docs state that state machines connect animations and define transition logic for product/app/game/website; examples include Idle, Hovered, Clicked and visual Graph/States/Transitions/Layers. Strong for character emotion, relationship state, quest/event arrival and NPC idle behavior. Runtime/tool/asset licensing remains separate.

## Rare scenarios — maps and state change

- MapLibre plugins directory: https://maplibre.org/maplibre-gl-js/docs/plugins/ — official directory lists maplibre-transition, temporal-control, maplibre-three-plugin, compare, style switcher, traffic, contour and other extensions. Useful for map state, timeline, layer comparison and 3D overlays; each plugin has separate repository/license.
- maplibre-transition live Demo: https://popkinj.github.io/maplibre-transition/ — live playground includes Rising City (5,000 Vancouver buildings grow from footprints with staggered height/color and orbiting camera), color breakpoints, 8,000-point stress test, hover dwell thresholds and chained transitions. Source: https://github.com/popkinj/maplibre-transition; npm package: https://www.npmjs.com/package/maplibre-transition. Strong direct candidate for city emergence, faction/territory change, hover state and event wave propagation; high feature count still requires mobile profiling.
