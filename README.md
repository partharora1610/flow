# Wispr Flow portfolio

An interactive "portfolio of me" for the Wispr Flow hiring challenge. It's built in a collage-explainer style: kraft paper, film grain, highlighter yellow and red marker.

Plain HTML, CSS and JavaScript. No build step and no dependencies. Fonts load from Google Fonts.

## Run it

Serve the folder so the player section can load its JSON data:

```bash
python3 -m http.server 4317
```

Then visit http://localhost:4317.

## What happens on the page

1. **Who's playing?** One screen with a horizontal row of compact photo, name, and role cards for 7 researched Wispr Flow people, plus a Just curious option and Start button. Facts stay in the JSON for later use.
2. **The resume gets cut.** A small avatar with scissors cuts a generic resume from top to bottom as you scroll. Red-pen marks cross out the clichés first.
3. **Clean-up.** The pieces fall to the floor. Scrolling crumples each one and tosses it into a bin.
4. **The story.** Eleven scenes covering college, self-teaching, internships, a founding product role as CaseBase's second team member, US customer visits, and growth consulting for Anytime Fitness India. Assignments, typing, and tired fingers share a scene; the CaseBase founding role and product/code work share another. Storytelling and learning to code share a scene, and the year of learning includes the product-building loop. The US scene includes Parth's own trip photo. Each beat must finish before Next, a scene tap, Space, or Enter advances it. The 11 labeled progress buttons let viewers jump directly to any scene, including while narration is playing. Prompts show when to watch and when to advance. Leaving an unfinished beat restarts it when the viewer returns. The story ends on its last real scene, with no placeholder slide.
5. **My first 30 days.** Finishing the story unlocks a separate three-slide Ideas chapter. The first is a WhatsApp interaction concept: Decode by Wispr Flow reveals an illustrative transcript and an editable reply draft. The second focuses on replying to emails from the back seat of a cab, then learning from first attempts, friction, and repeat use on later rides. The third shows a fictional broken-keyboard office scene around the Hinglish campaign line “Wispr है तो, tension क्यों?” The mock messages are fictional; no messages are sent. All three slides have natural narration in Parth Personal Voice.

The story opens only when the viewer clicks Start the story after clean-up; scrolling cannot reveal it.

After the final idea finishes, Start from very start returns to Who's playing without reloading. It resets the player selection, story progress, and Ideas demos for a fresh playthrough.

Sound is generated in the browser with Web Audio and starts on the viewer's first interaction. Player selection has a soft blip; Start, Next, and other navigation actions have a short rising two-note cue. Chapter navigation also plays the cue when using Space or Enter.

Story narration uses eleven local ElevenLabs recordings of Parth Personal Voice in `public/assets/audio/parth-personal/`, with a natural conversational delivery and no emotion tags. Each clip plays at its scene cue. Next unlocks after both the animation and recording finish; leaving an unfinished scene stops its recording and replays the scene on return. The manifest contains the transcripts, voice settings, and durations.

## Files

| Path | What it is |
|---|---|
| `index.html` | Page markup: every section and its copy |
| `css/styles.css` | All styles. Color and font tokens sit at the top in `:root`, and the collage skin comes last |
| `js/main.js` | Scroll choreography, the cut, clean-up, tiles and sound |
| `js/ideas.js`, `css/ideas.css` | The first-30-days proposals, campaign storyboard, and interactive demo |
| `public/assets/audio/ideas/` | Proposal narration and transcript/voice manifest |
| `public/assets/ideas/whatsapp-decode-*.jpg` | Reusable screenshots of the voice-note concept before and after decoding |
| `public/assets/wispr/team.json` | Player roster, roles, sourced facts, profile links, and photo metadata |
| `public/assets/wispr/people/` | Local portraits used by the player cards |
| `public/assets/story/parth-us.jpg` | User-provided US trip photo shown in the story |
| `data/wispr-team.json` | Older research dataset, retained for reference; not used by the player section |
| `archive/dark-arcade.html` | The earlier dark arcade version of the same page, kept for reference |

## Where to change things

- **Copy.** Edit it in `index.html`. The clean-up headline is also set from `js/main.js`, so search for the text there too.
- **Tiles.** Edit `public/assets/wispr/team.json`; `js/main.js` renders the cards from the `playerTile` template in `index.html`. Each person's group picks the speech-bubble line from `LINES`.
- **Scroll timing.** `TEAR_END`, `C_START` and `C_LEN` in `js/main.js` split the long scroll between the cut and the clean-up. The `.tear` height in `css/styles.css` sets the total scroll length.
- **Colors and fonts.** Change the tokens in `:root` at the top of `css/styles.css`.

## Prototypes

`prototypes/chapter-1/` holds three versions of chapter 1, scene 1 ("Born in 2001"). Open `prototypes/chapter-1/index.html` to compare them.

- **A · Scroll explainer:** `a-scroll.html`. The scene scrubs with scroll.
- **B · Auto-play film:** `b-film.html`. A letterboxed mini video with play, pause and a scrubber.
- **C · Tap-through stories:** `c-stories.html`. Four story cards in a phone frame.

All three share `shared/story.js`, which holds the art, the 16-second timeline, the synthesized sound cues and the narration, plus `shared/story.css`. Narration uses the browser's built-in voice as a stand-in for a recorded voice-over. The script lines are in `LINES` in `shared/story.js`.

## Before submitting

- Replace the bracketed resume placeholders, such as `[City]` and `[Company]`.
- Recheck the complete experience at phone width before submitting.
