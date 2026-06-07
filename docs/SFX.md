# Manabi — Sound Design Document
## ふだみ SFX Brief: Goals, Context & Inspiration

**Version 1.0 — Full Narrative Edition**

This document expands each entry in the Manabi SFX list into a full design rationale. For every sound, it covers three dimensions: what job the sound is doing (goal), when and how it lives in the product (context), and where the sonic direction comes from (inspiration). This brief is intended for a sound designer coming in cold — it should give them enough creative and cultural grounding to make every decision without needing to ask.

---

## Guiding Aesthetic for the Whole Set

Before the individual entries, it helps to establish the overall sonic world.

Manabi exists in a specific cultural and emotional register: a Japanese SRS flashcard app used by commuters, in earbuds, on trains, between stops. The user is mentally active but physically still, in a public space, trying to extract productive focus from an otherwise dead 20 minutes. The emotional contract with the app is: *help me get better at Japanese, don't bother me, reward me just enough to keep going.*

The closest real-world sonic analogue isn't a productivity tool and it isn't a game — it's a quiet Japanese stationery shop. The sounds of high-quality notebooks, the click of a Zebra pen cap, the shuffle of flashcard paper. There is tactility, there is satisfaction, there is craft. But there is no performance, no drama, no urgency.

The Japanese aesthetic concept most relevant here is **ma** (間) — the meaningful use of silence and space between sounds. Most sounds in this set should feel like they end before they wear out their welcome. Restraint is not timidity; it is respect for the listener's attention.

A secondary reference is the sound design philosophy of Nintendo's handheld game hardware — systems designed to sound good on a mono speaker at low volume, with tiny sounds that carry enormous emotional information in under 300 milliseconds.

---

## Card Interactions

---

### `card_flip.wav` — 200ms

**Goal**

The core job of this sound is to make a digital interaction feel physical. When a user taps to reveal the answer, a purely visual card-flip animation is fine — but the right sound turns that visual event into a *tactile* memory. The goal is to anchor the flip in material reality, to make the brain believe, on some level, that something physical just happened. This is not decoration; research on embodied cognition suggests that physicalized digital feedback produces stronger engagement and slightly better recall conditions.

The sound should be unambiguous and fast. There is no room for misinterpretation — the card flipped. Done. It should feel like it costs nothing to hear, like a key press you barely notice but would miss if it were gone.

**Context**

This is one of the highest-frequency sounds in the application. In a 20-minute session with 30–40 cards, the user hears this sound 30–40 times. Over a week of daily sessions, that is 200–280 times. The sound must pass what we call the thousand-plays test: play it a thousand times in a row and it should still feel neutral or pleasant. This rules out anything with an attention-grabbing attack, a musical pitch that the ear wants to resolve, or a tail that bleeds into the next card interaction. It also means the transient must cut through at very low volume — a user with one earbud loosely in, on a noisy Yamanote Line train, needs to still register the feedback.

**Inspiration**

The literal inspiration is the physical act of flipping an index card (índex card in Japanese study culture: *tan-go kādo*, 単語カード). Not a playing card — a paper flashcard. Paper flashcards have a specific sound character: a dry, slightly stiff snap with a very short rustling tail, heavier than a playing card but lighter than a hardback page. The paper is the material metaphor for the whole app. Keep it.

Secondary reference: the sound of *hanshi* (半紙) calligraphy paper being lifted and turned. There is something ceremonial and focused about that gesture, and even a hint of it in the sound reinforces the study ritual.

---

### `card_reveal.wav` — 250ms

**Goal**

Where `card_flip` is the action, `card_reveal` is the resolution. The answer side of the card settling into view is a moment of cognitive arrival — the user is about to judge their own recall. The sound should reinforce that sense of arrival, of something coming to rest. It is softer and more sustained than the flip, a gentle exhale after a breath-hold.

In interface terms, this sound layers with or closely follows `card_flip`. Together, they form a two-part gesture: snap (flip) → settle (reveal). The combination should feel like a single compound action, not two unrelated events.

**Context**

Heard at the same frequency as `card_flip` — every single card, every single session. The same endurance requirements apply. But because it's softer and more sustained, it carries more risk of becoming aurally "sticky" — a melody or pitch that the ear keeps half-expecting. Avoid any definite pitch center. This should live in the territory of texture and breath, not note.

**Inspiration**

The dominant reference here is the *shoji* (障子) screen — the paper-and-wood sliding panels used in Japanese architecture to divide space. The sound of a shoji sliding open or closed is one of the most recognizable and distinctive sounds in Japanese domestic life: a soft lateral whoosh, paper whispering against wood, ending in a soft stop. It is spatial, directional, and has a resolution quality — the screen is now open, the space is now revealed.

A secondary material reference: the sound of a card being dealt face-up onto a felt surface in a traditional Japanese card game (karuta). That lateral slide and soft stop is the sonic gesture we are reaching for.

---

### `swipe_right.wav` — 200ms

**Goal**

This sound confirms a dismissal. The card is gone — moved to its next review interval, out of the current session pile. The sound should feel decisive and clean, like closing a chapter. It has a directional quality: something moving away to the right. Airy, effortless, final.

The emotional register is mild satisfaction. "I knew that one well enough." Not a celebration — that's what the rating sounds are for — just a clean exit.

**Context**

Used specifically when a card is dismissed after rating, not during the rating itself. It may be triggered alongside a swipe gesture or as part of an auto-advance animation. Given the gestural context, there is room for a slight stereo sweep from center to right, which will reinforce the directionality of the animation on screen.

**Inspiration**

The gesture itself is the inspiration: a clean horizontal swipe through air. Think of a calligrapher completing a brushstroke, the brush lifting off paper and trailing to the right — there is a slight resistance, then release, then air. The sound should have that quality of *release* more than *impact*.

---

### `swipe_left.wav` — 200ms

**Goal**

This is the "Again" swipe — the card going back into the pile. It uses the same gesture and roughly the same sound, but with slightly more weight and friction. The weight communicates *not yet* without communicating *failure*. The user must feel that the card has returned to work on, not that they have been punished.

The critical design constraint: this sound must not feel worse than `swipe_right`. It can feel different — heavier, a fraction slower, slightly denser — but "different" is not "punishing." Many apps make this mistake with their wrong-answer feedback, and it trains users to feel shame about their learning gaps. Shame degrades motivation. The sound must not do that.

**Context**

Heard whenever a user rates a card "Again." In early learning sessions on hard vocabulary, this can be the majority of cards. The sound may be heard more than `swipe_right` for a user drilling difficult material.

**Inspiration**

Same calligraphic sweep reference, but imagine the brush hesitating slightly before lifting — a little more contact with the paper, a subtle resistance. The sound should feel like the card has *weight*, because it carries unfinished work.

---

## Answer Ratings

---

### `rating_again.wav` — 150ms

**Goal**

This is the most emotionally sensitive sound in the entire application. The "Again" rating is what users tap when they couldn't recall the answer — the lowest rung of the SRS ladder. The design challenge is substantial: how do you give meaningful feedback for an incorrect recall without inducing shame, frustration, or the urge to close the app?

The answer is that this sound must be genuinely *neutral*. Not apologetic, not softened — neutral. A sound that says "noted" and nothing else. The tonal equivalent of a whispered "okay." Not discouraging, not encouraging. Present.

This is philosophically important. Spaced repetition is a system of honest self-assessment in service of long-term memory. Every "Again" is *information*, not failure. The sound must embody that perspective.

**Context**

High-frequency sound, especially for users working through new vocabulary. Some sessions may consist almost entirely of "Again" presses on difficult kanji readings. In those sessions, this sound is the *primary* sound the user hears. Its neutrality is not just an aesthetic choice — it is a product choice that directly affects whether users continue studying or close the app.

**Inspiration**

The inspiration is the *han* (判) — a Japanese seal or stamp pressed onto paper. The sound of a well-inked hanko pressing cleanly onto a document: a single, dry, muted thud with no resonance. It communicates "recorded" and nothing more. Bureaucratic, in the best sense — dispassionate, official, forward-moving.

Secondary reference: the sound of a library book being returned — a book sliding onto a return desk and settling. Soft, a little heavy, decidedly neutral.

---

### `rating_hard.wav` — 150ms

**Goal**

"Hard" is the acknowledgment that you got it right, but it cost you — you had to dig for it, or you weren't fully confident. The sound should carry a very slight quality of *uncertainty* — not negative, but slightly less resolved than "Good." The sonic equivalent of a half-nod: "yes, but…"

Functionally, it needs to be clearly distinct from `rating_again` (which is neutral and dull) and `rating_good` (which is clean and satisfying). It lives in a middle register: slightly harder than "Good," slightly brighter than "Again."

**Context**

Third most common rating. May be more common than "Easy" for users still consolidating material. Should function well in rapid succession with other ratings.

**Inspiration**

Think of the sound of a mechanical pencil clicking to advance lead — there is a small, slightly uncertain quality to that click. It works but it isn't silky. Or: the sound of a *shogi* (将棋) piece placed on the board with a soft but slightly hesitant tap — the player isn't fully committed to the move but has placed it.

---

### `rating_good.wav` — 180ms

**Goal**

This is the most important sound in the entire application. Full stop.

"Good" is the rating a user gives after a clean, confident recall with reasonable effort — the core loop of spaced repetition working as intended. It is the sound that users will hear, conservatively, 300–500 times per week after establishing a daily habit. 15,000+ times per year. It must be:

1. **Satisfying** — It must feel good to press. This sound is part of what makes SRS rewarding. A clean "Good" tap should produce a micro-dose of satisfaction.
2. **Brief** — It should never feel like it's slowing down the review flow. Sub-200ms with a rapid decay.
3. **Non-musical** — Avoid definite pitched tones. After 15,000 plays, any specific note becomes an earworm or a trigger for mild irritation. The sound should live in the register of texture, click, or soft percussive impact rather than pitched chime.
4. **Volume-independent** — It must carry its satisfaction at very low volume, with one earbud in, on a moving train. Its feedback must not rely on loudness.
5. **Fatigue-proof** — This is the paramount concern. Design it and then play it 200 times in a row. If it creates any irritation, it fails.

**Context**

Dominant sound of every session. The central heartbeat of the app's audio identity. Users who close their eyes during a Manabi session will experience this app primarily through this sound.

**Inspiration**

The reference is the best mechanical keyboard switches — specifically the Topre electrostatic capacitive switch and the Holy Panda tactile switch. Both have a specific quality that keyboard enthusiasts describe as *thock*: a deep, short, muted impact with almost no resonance, like pressing your finger firmly into a firm surface. You cannot tire of it because it carries no pitch to get stuck in your head — only texture.

Secondary reference: the sound of a Muji-brand stamp being pressed lightly on paper. Clean, muted, satisfying in a utilitarian way. The sound of well-made stationery.

Third reference: the tactile and sonic feedback of an iPhone's haptic engine when confirming a successful action — the "home button" of an iPhone 7 has no moving parts but creates a convincing click illusion through haptics and a paired sound. That level of precision in a small, convincing click is the benchmark.

---

### `rating_easy.wav` — 200ms

**Goal**

"Easy" is a small win — the user breezed through a card they've fully internalized. The sound should feel like a little lift, a slight brightening, a moment of quiet pride. It is a cousin of `rating_good`, elevated by a notch. Not a celebration — more like the sound of finding exactly what you needed on the first try.

It should be clearly distinct from "Good" without being so different that the family resemblance is lost. The user should hear it and immediately understand: *same family, slightly better outcome.*

**Context**

Less frequent than "Good" — users with well-spaced mature cards will hear this on vocabulary they've truly mastered. Because it's rarer, it can afford a slightly longer tail or a brief chime shimmer.

**Inspiration**

The image is a wooden *abacus* (算盤, soroban) bead being flicked cleanly to the other side — the same physical family as the click, but with a slightly brighter, more effortless quality. The bead didn't resist. Also: the sound of turning the last page of a textbook chapter you've understood completely.

---

## Typing Mode

---

### `key_tap.wav` — 80ms

**Goal**

Mobile keyboard input is inherently haptic-deficient. No physical key travel, no mechanical feedback. Kana input for Japanese on a touchscreen is especially abstracted — the user taps *romanization* or a kana grid, and the experience can feel disconnected from the language. This sound's job is to restore the sense of physical typing — to bridge the gap between glass and craft.

The sound should make typing feel deliberate and satisfying, not like jabbing at a screen.

**Context**

One of the highest-frequency sounds in the entire app — fired on every single kana keystroke. In a typing-mode session, that might be 3–6 sounds per card, 30–40 cards per session: 90–240 sounds in 20 minutes, from this one effect alone. The fatigue requirements are equal to or greater than `rating_good`. This sound must be invisible in the best sense — you'd notice its absence, not its presence.

**Inspiration**

The dominant reference is the *Realforce TKL* keyboard — a Japanese-made, Topre-switch keyboard that is considered by many to be the gold standard of typing feel. Its sound is a gentle, contained thud — no rattle, no high-frequency click, just a clean short impact. It was designed for office use: to be quiet enough not to disturb neighbors, but feedback-rich enough to satisfy. That brief is exactly the brief for this sound.

Secondary reference: the key sound in the iOS keyboard when *Keyboard Clicks* is enabled — small, synthetic, but surprisingly satisfying in a quiet room. That's the cultural reference point for most Japanese mobile users.

---

### `key_backspace.wav` — 80ms

**Goal**

A minimally differentiated variant of `key_tap` that communicates "something was removed" without drama. The slight dullness or softness should register subconsciously — the user may not consciously notice the difference, but they'll feel it. It adds a layer of semantic richness to the audio that makes the keyboard feel more physically real.

Backspace on a physical keyboard does have a different sound from regular keys on most boards — it's often slightly heavier, slightly less crisp. This sound follows that convention.

**Context**

Heard when the user corrects a typo, which may happen frequently with kana input. Never heard in rapid succession for long (users don't backspace paragraphs on flashcards), so fatigue is a lower concern than for `key_tap`.

**Inspiration**

The sound of an eraser on paper — not the scratching erasure sound, but the dull initial contact before the stroke. A slightly muffled version of the tap. The same material, less of it.

---

### `typing_correct.wav` — 400ms

**Goal**

A moment of resolution and reward. The user typed their answer, submitted it, and they were right. Unlike card-flip ratings which are instantaneous, typing involves effort — there is more satisfaction to be delivered. This sound should feel like a door opening cleanly, or a lock clicking into place. A sense of completion and correctness.

It should be more elaborate than a single `key_tap`, but not so elaborate that it interrupts flow. Two notes is the right level of musical information — enough to feel intentional, not enough to feel like a fanfare.

**Context**

Fired once per correct submission in typing mode. Less frequent than individual key taps; can afford to be slightly more musical. The user has just done something right and is about to be shown feedback — the sound accompanies that reveal.

**Inspiration**

The two-note ascending interval of a *furin* (風鈴) wind chime — the small glass bells hung in Japanese homes and shops in summer. When two chime tones strike in close succession, they create a brief descending or ascending interval that is immediately recognizable as Japanese, immediately pleasant, and immediately brief. Used as a single instance (not a loop), one or two strikes of a furin chime is the perfect tonal reference for this moment.

---

### `typing_wrong.wav` — 250ms

**Goal**

Wrong answers in typing mode require the same emotional care as `rating_again`. The user tried to recall, constructed the answer character by character, submitted it, and they were wrong. This is a moment of genuine disappointment in the learning process, and the sound must not amplify it. The goal is to communicate *incorrect* with the gentlest possible signal — just enough information to prompt reflection and retry, nothing that produces shame or frustration.

The anti-pattern to avoid at all costs: any buzzer quality, any harsh frequency, anything that resembles a game-show "WRONG" sound. Those sounds activate threat-response psychology. We do not want threat responses during language learning.

**Context**

Fired once per wrong submission. May be heard multiple times in succession if the user makes repeated errors on the same card. In that scenario — three wrong submissions in a row — the sound would play three times within 30 seconds. It absolutely cannot become grating or demoralizing.

**Inspiration**

The reference is the soft descending tone of a Japanese convenience store door sensor that fails to register a customer — a low, muted, single downward tone that simply means "not yet detected" rather than "you failed." Completely affectless. Or: the sound of pressing a key on a piano while the sustain pedal is off — a dull thud with minimal resonance, definitionally *wrong* in tonal color (literally unsustained) but entirely non-threatening.

---

## MCQ Mode

---

### `mcq_select.wav` — 100ms

**Goal**

In multiple-choice mode, selecting an option and *revealing the result* are two distinct events. This sound covers only the first part: the act of choosing. It should be purely mechanical — a confirmation that the tap registered — and carry zero evaluative information. The user doesn't know yet whether they're right. The sound must not telegraph anything.

Its emotional character is neutral selection. Like choosing a track on a train map panel before the door announces the stop.

**Context**

Fired on every MCQ option tap, before result reveal. In a fast MCQ session, this could fire every 2–3 seconds. Very high frequency, very high fatigue requirement.

**Inspiration**

The sound of pressing a button on a high-quality Japanese transit IC card terminal — a very brief, clean tap. The *Suica* card reader tap tone is a reference: crisp, affectless, immediate. Or: the sound of a single key on a physical music player remote, before anything plays.

---

### `mcq_correct.wav` — 400ms

**Goal**

Deliver a burst of satisfaction at the moment of correct MCQ selection. MCQ results are instant — the user taps, they immediately see whether they were right. This sound accompanies that positive reveal. It should be musical enough to feel rewarding, brief enough not to slow the session, and distinctive enough from `rating_good` that the user experiences MCQ mode as slightly different in tone — a bit more quiz-like, a bit more game-like.

Two ascending notes work here — they carry the psychological payload of a rising phrase ("correct, yes, up") in just 200–400 milliseconds.

**Context**

Fired immediately on correct MCQ selection, alongside the visual reveal of the correct answer. Heard frequently in any MCQ session. Should still pass the fatigue test, though MCQ sessions tend to be shorter and more varied than card-flip sessions.

**Inspiration**

The two-note ascending chime of a Japanese department store PA system announcing the opening of a floor — a specific, culturally embedded sound that has positive associations (the store is open, something good is available). It is not a fanfare, just a small, clean, ascending interval that any Japanese person would recognize as *affirmative*.

Also: the sound of a *kotsuzumi* (small Japanese hand drum) struck cleanly twice in ascending rhythm — not quite percussive, slightly tonal.

---

### `mcq_wrong.wav` — 350ms

**Goal**

The inverse of `mcq_correct`, with all the emotional care of `typing_wrong`. The wrong-answer sound in MCQ must not be harsh, buzzing, descending-dramatically, or game-show-style. It must read as *not that one* rather than *you failed*. A descending two-note interval works here — the psychological movement is downward, which communicates "wrong direction," but the execution must be soft and slightly musical.

**Context**

Fired immediately on incorrect MCQ selection. Unlike `typing_wrong`, this fires only once — the user sees the correct answer immediately and the card advances. There is no retry loop.

**Inspiration**

The sound of a vending machine in Japan reporting that a selection is *soldout* (売り切れ) — a brief, descending, entirely affectless two-tone signal. No drama. Just "that one's not available." The sound of a *soroban* bead landing in the wrong column: a dull, downward tap.

---

## XP & Gamification

---

### `xp_gain_small.wav` — 250ms

**Goal**

This sound gives a tangible audio reward for earning XP, layered on top of the rating sounds. Its psychological role is reinforcement: the user just did something right, they earned points, and the sound makes that tangible. Even if the user never looks at their XP total, hearing this sound associates correct answers with the feeling of *accumulation* — something building. This is a core gamification mechanism used well.

The sound must be small enough not to overwhelm or distract from the rating sound it may layer with. It should feel like a bonus, not a replacement.

**Context**

Fired after every successful card rating (potentially layered with `rating_good` or `rating_easy`). High frequency, high fatigue risk. Must be extremely compact and non-pitch-centered.

**Inspiration**

The reference is Studio Ghibli's sound design philosophy of *komorebi* — the dappled, ephemeral quality of light through leaves, expressed in sound as brief, soft, higher-frequency sparkles. In *My Neighbor Totoro* and *Spirited Away*, tiny magical events are accompanied by sounds that are barely there: a few soft high-frequency tones that sparkle and disappear in under a second. That quality of *barely magical, immediately gone* is exactly right.

Also: the classic JRPG experience point chime — in its minimal form (a few synth notes, very brief), not its dramatic form.

---

### `xp_gain_large.wav` — 500ms

**Goal**

The same reward loop as `xp_gain_small`, amplified for larger XP moments: an Easy rating, a streak bonus, a combo of some kind. The larger sound communicates *more was earned*, without the user needing to read a number. It is the audio version of seeing a bigger coin in a Mario game.

It should feel like a fuller version of the same sparkle — same family, more of it, slightly longer tail. Not categorically different.

**Context**

Heard less frequently than the small variant — specifically on "Easy" ratings and bonus events. Can afford a wider stereo spread and a few more sparkling notes before the decay.

**Inspiration**

Same Ghibli/JRPG sparkle DNA, but imagine several more notes cascading in a quick upward arpeggio before settling. The difference between a single furin chime and two or three chimes struck in quick succession by the wind.

---

### `level_up.wav` — 1.5–2s

**Goal**

This sound is a genuine cultural moment. Level-up events are rare — they happen when a user has put in enough sustained effort to advance a level in the app's progression system. Heard perhaps once or twice a week at most, for active users. The sound can afford to be more elaborate, more musical, more overtly celebratory than anything else in the set.

But the key constraint is aesthetic register: this is still Manabi. It is still wabi-sabi, still Japanese, still intended for a commuter with earbuds. The celebration should feel earned and interior, not performative. Think: the satisfaction of finishing a *shōgi* match, not the chaos of a fireworks show.

The goal is that hearing this sound, even out of context, should make someone want to open the app.

**Context**

Heard rarely. No fatigue concern whatsoever. The full 1.5–2 seconds is appropriate — this is a moment the user is meant to pause for. If the rest of the set is furniture, this sound is a painting.

**Inspiration**

Three cultural and sonic references must inform this sound:

1. **The koto** (琴): The quintessential Japanese instrument. A struck or plucked pentatonic phrase on the koto carries instant cultural resonance and has the right emotional register — celebratory but refined, never brash. A 4–6 note ascending phrase resolving to a sustained final tone.

2. **The shakuhachi** (尺八): The Japanese end-blown bamboo flute. Its characteristic breathy, slightly impure tone — the sound of *air as much as note* — gives any composition an immediately Japanese quality. Even a single breath-note as a tail under the koto phrase would anchor the geography of this sound unmistakably.

3. **The Final Fantasy victory fanfare** as an anti-reference: that iconic brass fanfare is the template for every game level-up sound. Study it, understand why it works (triumphant resolution, brief, memorably pitched), and then consciously depart from it in the direction of restraint and Japanese instrumental texture. Use the same emotional architecture — brief tension, release, ascending resolve — but with acoustic instruments, lower volume, and shorter decay.

---

### `xp_bar_fill.wav` — 400ms

**Goal**

This sound should synchronize with a visual animation: the XP bar sweeping from its current position to a new fill level. The sound and the animation should feel coupled — as if the bar filling *makes* the sound, rather than the sound accompanying the bar. The pitch rising as the bar fills is an obvious and effective mapping: visual progress upward = pitch rising.

The goal is to make the XP animation feel more physical, more *real*, without adding distracting musical content. This is a procedural sound, not a musical one.

**Context**

Fires every time a card is rated and XP is awarded — the bar animates and this sound plays. Relatively high frequency. The sound must work whether the bar fills 2% or 50% — it should always feel appropriate.

**Inspiration**

The sound of pouring water into a glass bottle: as the bottle fills, the resonant frequency of the air column rises, producing a smooth glissando upward in pitch. This is one of the most physically satisfying sounds in everyday life, and it has a direct perceptual mapping to "filling up." Whether executed as a literal water-pour recording, a synthesized pitch bend, or a processed breath sound, the directional motion is the core: *a smooth rise from a lower to a higher frequency.*

---

## Streak

---

### `streak_maintained.wav` — 600ms

**Goal**

This sound appears at the end of a session to confirm that the user has maintained their daily streak. It is a small, warm, private acknowledgment. The user just finished their commute review — they don't need a party. They need a sound that says *well done, quietly, just between us*. The emotional texture is closer to a pat on the shoulder than a cheer.

This is the last sound of the session for many users. It should leave them feeling settled rather than amped. The train is pulling into the station; they're pocketing their phone. This sound should fit that moment.

**Context**

Heard at session end, once per day if the streak is maintained. Medium-frequency — daily users hear this once per session. Because it fires at the end of the session (a natural transition point), it can afford a slightly longer decay tail than mid-session sounds.

**Inspiration**

The *rin* bell (りん) — the small bronze or brass bowl bell used in Japanese Buddhist household altars and in meditation practice. When struck with a padded striker, the rin produces a clean, pure fundamental tone with a very long, soft decay. It is the sound of *completion* in Japanese culture, used to mark the end of a prayer or meditation. It is warm, final, and deeply restful. No musical pitch agenda — just a single, clean tone settling into silence.

---

### `streak_milestone.wav` — 1–1.5s

**Goal**

Streak milestones — 7, 14, 30 days — mark something different from level-up progression. They mark *consistency*, *discipline*, *habit*. A user who has maintained a 30-day streak has done something genuinely hard. The sound should honor that without being showy. The emotional register is intimate, personal — *this is yours* — rather than broadcast, public, or performative.

The ascending cascade should feel like small accumulation becoming visible, like water rising one step at a time. Each note in the phrase is one more day kept.

**Context**

Heard only on streak milestone days. Very rare — a 7-day user will hear it approximately once per week, a fully habituated user roughly every two weeks after establishing long streaks. Absolutely no fatigue concern. This sound should feel special every time.

**Inspiration**

The image is *suikinkutsu* (水琴窟) — a Japanese garden water instrument, essentially an inverted buried pot that creates musical tones when water drops fall into it. The resulting sound is a cascading series of droplet-tones that rise and fall unpredictably, producing something between music and natural ambience. For streak milestone, we take the *ascending* quality of cascading notes over a koto or chime soundbed — brief, intimate, each note distinct but soft.

---

### `streak_broken.wav` — 500ms

**Goal**

This is the emotionally most complex design challenge in the set. A streak breaking is a real disappointment — ask any Duolingo user. The sound must walk a narrow path between three failure modes: (1) too harsh, producing shame and possibly app abandonment; (2) too soft, feeling dishonest or condescending; (3) too musical, feeling like the app is grieving with the user in a cloying way. The right sound is honest, gentle, and purely factual. It says *the streak is broken* and nothing more. It does not say *you failed, you are bad, try harder*.

The decision to make this sound optional in the implementation is correct — some users may prefer silence here. But for those who receive it, it should be a sound they can sit with without distress.

**Context**

Fires once, when the user opens the app after missing a day. Heard rarely — by definition, infrequently, since regular users maintain their streaks. May be the most memorable single instance of any sound in the set.

**Inspiration**

The reference is the minor-key resolution in *enka* (演歌) music — the traditional Japanese ballad form that explicitly deals with loss, longing, and acceptance. Enka does not wallow; it acknowledges. A single soft descending interval — a perfect fourth or minor third, struck once on a chime or a light bell, decaying into silence — carries that quality. Not a funeral tone, not a game-over sound. A *sigh* in the form of two notes. The sound of a lantern going out.

---

## Session Flow

---

### `session_start.wav` — 800ms

**Goal**

This sound's job is psychological, not just confirmatory. It marks the beginning of focused, intentional study. It is the audio equivalent of a ritual action — the uncapping of a pen, the opening of a textbook, the arranging of flashcards on a table. It should shift the user's mental state from ambient-phone-use mode into active-learning mode.

For this to work, the sound must carry a quality of *attention* — it should make the user feel called to focus, invited into something. Not commanded. Invited.

**Context**

Heard once per session, at the very beginning. Every daily user hears this sound once per day. It is the first thing they hear from Manabi in any given session, which gives it outsized importance in shaping the session's emotional tone. It sets the aesthetic contract: this is what Manabi sounds like.

**Inspiration**

The direct reference is the *kane* (鐘) — the large temple bell struck at Zen Buddhist monasteries to call practitioners to *zazen* (seated meditation). In monastery practice, the bell is struck softly once before a session. The sound is not a command; it is an *invitation*. The quality of a single, struck bell tone with a genuine, unhurried decay is precisely what this moment needs.

A more domestic reference: the *chime* of a Japanese traditional clock (*wadokei*) — not the mechanical striking of hours, but the single, resonant tone that signals transition. The user is transitioning states. Give them a tone that says *now we begin*.

---

### `session_complete.wav` — 1.5–2s

**Goal**

The user just finished their commute review. They kept a daily habit. They improved their Japanese retention by some small but real amount. This sound marks that accomplishment — the end of the study session and the return to the rest of life.

It should feel like *resolution* in the musical sense: tension releasing, a phrase completing, something that had been open closing cleanly. It is the audio version of putting down a book you've just finished reading. Warm, settled, done.

Unlike `level_up`, which is a celebration of achievement, `session_complete` is a celebration of *completion*. The register is quieter, more intimate, more final.

**Context**

Heard once at the end of every session. High exposure for daily users but naturally spaced — once per day, at a calm moment. The user is likely pocketing their phone, getting off the train, returning to their day. The sound should facilitate that transition, not demand continued attention.

**Inspiration**

The *ma* (間) philosophy is most relevant here — the meaning *in* the space. The sound should feel like it exhales and then allows silence. A soft pentatonic phrase (3–4 notes, possibly koto-adjacent) resolving to a single sustained bell or chime tone that decays naturally over the full 1.5–2 seconds. The final note should feel like permission to close the app.

Reference: the ending music of the Calm app's meditation sessions — it uses a soft, brief musical phrase that resolves and then makes room for silence. Manabi's version should be warmer, more Japanese in tonal character, and equally respectful of the silence that follows.

---

### `goal_reached.wav` — 700ms

**Goal**

This fires mid-session when the user hits their daily card goal or time goal. It is a milestone, a moment of "you're done if you want to be" — but it should also feel like an invitation to keep going if the user has more time. The sound is more energetic than `session_complete` (because the session isn't necessarily over) and less grand than `level_up` (because it's a daily goal, not a permanent progression milestone). It sits between the two.

Think of it as: *you hit the mark*. Not: *you won*. Not: *you're finished*. Just: *you hit the mark*.

**Context**

Fired once when the session goal is reached. Less frequent than rating sounds but more frequent than level-up events. Can be more elaborate than XP sounds but shorter than the session-complete fanfare.

**Inspiration**

The *hanko* stamp again — but this time, a stamp with an upward arc. Think of the sound a *gachagacha* (ガチャガチャ) capsule machine makes when you successfully turn the knob and a capsule drops: a quick ascending rattle-and-click that communicates *you got one*. Or: a 4–5 note ascending arpeggio on a xylophone or marimba — bright, quick, conclusive, immediately understood as "success achieved."

---

## UI & Navigation

---

### `tab_switch.wav` — 100ms

**Goal**

Pure haptic substitute. The absolute minimum sonic presence required to confirm that a navigation tap registered. This sound has no emotional content whatsoever — it is purely mechanical confirmation. The user's brain should register it subliminally and immediately move on. If anyone notices this sound in a normal usage session, it is too loud or too distinctive.

**Context**

Fired on every tab bar navigation tap. Can be extremely frequent for users who move between tabs often. Highest fatigue tolerance requirement of any UI sound in the set — it must essentially become inaudible through familiarity.

**Inspiration**

The navigation *tap* sound in high-end Japanese consumer electronics — specifically the sound of switching inputs on a Yamaha or Denon AV receiver via physical button: a clean, brief, entirely affectless confirmation click. No pitch. No character. Just "registered."

---

### `modal_open.wav` — 200ms

**Goal**

Add a subtle spatial dimension to the opening of overlays, sheets, and modal dialogs. The sound should reinforce the visual motion of something arriving from below or above — a sheet that slides up from the bottom, a dialog that appears from center. The "upward" tonal direction reinforces the spatial metaphor.

It should be soft enough that if the user has audio off, they wouldn't feel they'd missed anything critical.

**Context**

Fired on modal/sheet opens — settings, info overlays, confirmation dialogs. Moderate frequency. No fatigue concern.

**Inspiration**

The sliding of a *fusuma* (襖) — the opaque sliding panel doors used in Japanese interior spaces — as it opens to reveal a new room. The sound is a soft lateral whoosh with a slight release of air as the seal breaks. The upward tonal quality can be a pitch glide (a gentle synthesizer breath rising slightly in pitch) rather than a literal whoosh.

---

### `modal_close.wav` — 200ms

**Goal**

The exact inverse of `modal_open` in direction and character. A sound that registers as *departure*, as something settling back down, as a space closing. It should feel like the resolution to the opening sound — two halves of a single spatial gesture.

**Context**

Fired on modal/sheet dismissals. Same moderate frequency as `modal_open`.

**Inspiration**

Same fusuma reference, reversed — the panel sliding shut, a gentle sealing. Or the downward breath of air as a lid is placed back on a container. A soft pitch glide downward, decaying to silence.

---

## Design System Notes for the Sound Designer

**On tonal family coherence**: The `rating_good / rating_easy / typing_correct / mcq_correct` family should share a recognizable tonal DNA even though they are different sounds. A listener should be able to hear any of them and recognize "that's a Manabi positive sound." Consider building them from the same source material (the same bell recording, the same synth patch) at different intensities.

**On the silence around sounds**: Every sound in this set should be designed to *respect its own ending*. The tail of each sound matters as much as the attack. A sound that cuts off abruptly creates a perceptual void; a tail that lingers too long bleeds into the next event. The ideal is a natural decay that feels complete but doesn't overstay.

**On testing methodology**: Every sound in this set should be tested at 10% volume through a single iPhone speaker in a noisy environment. If the essential information doesn't survive that test, the sound needs revision. Secondary test: 100 plays in rapid succession. If any irritation arises in a sound designer who is actively trying to like it, it will not survive in the hands of a daily commuter.

**On the layering session**: `card_flip` + `card_reveal`, `rating_good` + `xp_gain_small`, and `key_tap` (rapid succession) should all be tested in combination. The sounds must not create unpleasant interference when heard simultaneously or within 100ms of each other.

---

*Manabi SFX Brief v1.0 — For internal use by audio production team.*