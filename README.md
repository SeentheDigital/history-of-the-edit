# The history of the edit

An interactive map of a century of cutting images to music. This folder is the
editable version: every clip, connection, drawing, color, note of music and line
of text can be changed here.

```
history-of-the-edit/
├── index.html        the page itself (hero screen, map, panel)
├── css/style.css     colors, fonts, layout and animation
├── js/data.js        ← the clips, connections, categories and page text
├── js/icons.js       ← the line drawings for each clip
├── js/audio.js       ← the soundtrack and sound effects
├── js/app.js         the engine that builds the map (no need to edit)
├── media/            ← put your video clips and images here
├── audio/            ← put your own music, sound effects and audio clips here
└── tools/build.py    bundles everything into one shareable HTML file
```

## Opening it

Double-click `index.html` to open it in your browser. That's enough for
everything except YouTube tapes, which usually refuse to play from a file
opened directly. For those, run a tiny local server from inside this folder:

```
python3 -m http.server 8000
```

then open <http://localhost:8000>. Refresh the page after every edit.

If you make a mistake in `data.js` (a connection to a clip that doesn't exist,
a missing category, a duplicate id), a yellow notice appears on the page
explaining what to fix. If the page goes completely blank, there's usually a
missing comma or quote; press F12 and look at the Console tab for the line number.

## Adding real clips ("tapes")

Every clip's panel has a monitor. Give a clip some `media` and a
**Play the tape** button appears on it. With several tapes, a tape list appears
under the monitor. The music ducks while a video plays.

1. Put the file in `media/`. Simple names work best: `rocky-drive.mp4`.
2. Add it to that clip in `js/data.js`:

```js
media: [
  { type: "video",   src: "media/rocky-drive.mp4", start: 12, caption: "The night-drive recap" },
  { type: "youtube", id: "VIDEO_ID",               start: 30, caption: "A hype package" },
  { type: "image",   src: "media/fancam-still.jpg",           caption: "A fancam frame" }
]
```

- `video`: use `.mp4` (H.264) or `.webm`. `start` (seconds) is optional.
- `youtube`: the id is the part after `v=` in a YouTube link
  (`youtube.com/watch?v=THIS_PART`) or after `youtu.be/`.
- `image`: `.jpg`, `.png`, `.gif` or `.webp`, good for stills and gifsets.
- `audio`: `.mp3`, `.wav`, `.ogg` or `.m4a` from the `audio/` folder, for an
  interview, a song excerpt or commentary. It plays under the clip's drawing:

```js
{ type: "audio", src: "audio/sabol-interview.mp3", caption: "Steve Sabol on slow motion" }
```

A note on footage you don't own: clips for your own study are one thing, but if
you publish this, YouTube embeds or footage you have permission to use are the
safer route.

## Adding a new clip to the map

Copy the template at the top of the `nodes` list in `js/data.js`:

```js
{ id: "gifsets", name: "Tumblr gifsets", era: "2010", yr: 2010, y: 460, kind: "fan",
  icon: "generic",
  text: [
    "First paragraph: what it is.",
    "Second paragraph: how it works or what happened.",
    "Third paragraph: why it matters to the edit."
  ],
  move: "The technique it's known for.",
  media: [] },
```

- `id` is a short unique name (letters, numbers, dashes). Connections use it.
- `yr` decides the left-to-right position automatically.
- `y` decides the height: about 200 is the top of the map, 920 the bottom.
  Keep at least ~100 between clips from the same years so they don't overlap.
  You can also set `x` directly to override the year-based position.
- `kind` must be one of the categories in `kinds`.
- `text` is a list of paragraphs, as many as you like. Each paragraph and the
  `move` line can contain simple HTML like `<i>A Movie</i>`. Inside a paragraph,
  use curly quotes “like this” or single quotes, since straight double quotes
  would end the text early.

Then connect it by adding pairs to `edges`. `["vidding", "gifsets"]` means vidding
influenced gifsets; the animated dashes flow in that direction. The clip's
"Drew from" and "Fed into" lists, the timeline at the bottom, the earlier/later
buttons and the clip count all update on their own.

## Drawings

`js/icons.js` holds one drawing per clip, as SVG shapes on a 48 × 48 grid. They
are drawn as lines, and the panel animates them being drawn stroke by stroke.
To add one:

```js
gifsets: '<rect x="6" y="10" width="36" height="28" rx="3"/><path d="M6 24h36M24 10v28"/>',
```

Then either name it the same as the clip's `id` or point to it with
`icon: "gifsets"`. `generic` (a filmstrip) is used when a drawing is missing. The Umamusume clip
uses a generic horse girl in side profile (swept-back horse ears, a fringe and
long hair), also available as `icon: "horsegirl"`. The earlier front-facing
version with a tail is kept as `icon: "horsegirl-front"`.
Free editors like Inkscape or Figma can export SVG; copy just the shapes
inside the `<svg>` tag and scale them to fit 48 × 48.

## Categories and colors

`kinds` in `data.js` lists the categories. Each has a legend label, a longer
name for the panel, and two colors, one for light mode and one for dark mode.
Add a new category by adding an entry; the legend, the clip color bars, the
connection lines and a new timeline track are generated from it.

## Your own audio

Put files in `audio/` and name them in `js/data.js`. Anything you leave empty
keeps the built-in synthesized version.

- **Soundtrack:** `settings.music.file`, e.g. `"audio/my-song.mp3"`. It fades
  in when you press play, loops, gets quieter while a clip is open, ducks
  under tapes, and fades out when you rewind to the intro.
- **Sound effects:** the `sounds` block, one slot per action: `play`, `clip`,
  `close`, `rewind` and `insert`. Short `.wav` or `.mp3` files work best.
- **Audio tapes on a clip:** add `{ type: "audio", ... }` to that clip's `media`.

## Tape hiss

A tape hiss plays from the title screen onward, like a VCR running with
nothing on it. It's louder on the title screen and drops under the music on
the map. Set both levels in `settings.music`: `hissIntro` and `hissMap`
(0 turns it off). Browsers only allow sound after your first click, tap or key
press, so the hiss starts then; the note under "Press play" says so, and
clicking it afterward mutes or unmutes.

## The built-in music and sound effects

Everything you hear by default is synthesized live in the browser by `js/audio.js`, so
there are no audio files and nothing copyrighted. The song, "Tracking", is a
92 BPM synthwave loop in A minor (Am, F, C, G) with a pad, bass, drum machine,
an arpeggio through a dotted-eighth tape echo and a lead melody, all passed
through simulated tape wow, flutter, saturation and hiss. Opening a clip
muffles the music slightly, as if you'd leaned in.

The `SONG` section at the top of `audio.js` is built to be edited:

- `bpm`: the tempo (also settable from `data.js` under `settings.music`).
- `chords`: one chord per bar, as MIDI note numbers (60 = middle C).
- `melody`: the lead line, 8 bars of `[note, start beat, length in beats]`.
- `sections`: which instrument plays in which bars. The intro plays once,
  then bars 4 to 32 loop.

Sound effects are in the `sfx` section: `play` (VCR clunk and motor spin-up),
`clip` (a counter click and a note, rising from earlier to later clips),
`close`, `rewind` (a fluttering tape whine) and `insert` (loading a tape).
Volume is `settings.music.volume` in `data.js`. Press M on the map to mute.

## Design

Tokens live at the top of `css/style.css`: background, panel, ink and muted text
colors, each defined once for light mode and once for dark mode.

- Fonts (Google Fonts, all under the SIL Open Font License, free to use):
  - **Big Shoulders Display** for titles, a condensed poster face with a
    sports-program feel.
  - **Bricolage Grotesque** for reading text.
  - **VT323** for timecodes and on-screen labels, modeled on VCR and terminal
    displays.
- References the design is built on:
  - The **SMPTE color bars** test pattern (the hero's bars and the strip below them).
  - The **VCR "no signal" blue screen** and on-screen display: PLAY, SP, REC and
    a timecode counting in PAL frames (HH:MM:SS:FF at 25 fps). Dark mode is
    that blue; light mode is its inverse.
  - **Non-linear editing software**: the timeline with one track per category,
    the red playhead, and colored bars on top of clips, like clip color labels.
  - **VHS tape labels and spines**: the panel's colored spine and header.
  - **Tracking errors and chromatic aberration**: the glitch bands and RGB split
    used as transitions between shots.
- Logos: none. Every icon is an original line drawing (film strip, reel,
  stacked VCRs, CRT set, cassette, glove, belt, lightstick and so on), so no
  brand marks are reproduced.

Motion respects the "reduce motion" setting in your operating system.

## Sharing it as one file

```
python3 tools/build.py                 # → dist/history-of-the-edit.html
python3 tools/build.py --embed-media   # also packs files from media/ and audio/ inside
```

The single file opens anywhere with a double-click and can be uploaded to
hosts that take one HTML file. Embedded media makes it large, so keep clips
short if you use `--embed-media`.

## Keyboard

- **Enter** on "Press play" starts it.
- **← / →** move to the earlier or later clip while a panel is open.
- **Esc** closes the panel.
- **+ / −** zoom the map.
- **M** mutes or unmutes.
