/* =====================================================================
   THE HISTORY OF THE EDIT — CONTENT FILE
   This is the file you edit most. Everything on the map comes from here:
   the clips (nodes), the lines between them (edges), the categories,
   and the page text. See README.md for a walkthrough.
   ===================================================================== */

window.EDIT = {

  /* ---------- page text and layout ---------- */
  settings: {
    titleLines: ["the history", "of the edit"],
    lede: "A century of cutting images to music, from Soviet montage and VHS fan tapes to wrestling hype packages, fancams and TikTok. Eighteen moments, mapped as a network of who learned from whom.",
    worldNote: "The timeline stretches after 1980, where the history speeds up.",

    // How years turn into horizontal positions on the map.
    // Each pair is [year, x-position]. Between pairs the scale is linear,
    // so a steeper pair (more x per year) stretches that period out.
    timeline: [[1920, 120], [1980, 720], [2000, 1120], [2030, 2020]],
    decades: [1920, 2020],      // first and last decade line drawn
    worldHeight: 1000,          // map height; use y values from about 200 to 920

    music: {
      volume: 0.8,       // overall volume, 0 to 1
      bpm: 92,           // tempo of the built-in song (see js/audio.js to change the song)
      file: "",          // your own track instead of the built-in song, e.g. "audio/my-song.mp3"
      hissIntro: 0.010,  // tape hiss on the title screen
      hissMap: 0.005     // tape hiss under the music on the map (lower = music more prominent)
    }
  },

  /* ---------- your own sound effects (optional) ----------
     Leave a slot empty ("") to keep the built-in synthesized effect,
     or point it at a file in the audio folder, e.g. "audio/click.wav". */
  sounds: {
    play:   "",   // pressing "Press play"
    clip:   "",   // opening a clip
    close:  "",   // closing a clip
    rewind: "",   // rewinding to the intro
    insert: ""    // loading a tape
  },

  /* ---------- categories ----------
     Each clip belongs to one. Colors: "light" is used in light mode,
     "dark" in dark mode. Add a new category by adding a new entry. */
  kinds: {
    industry: { label: "Industry",              long: "Industry and professional", light: "#a57a00", dark: "#ffd23f" },
    fan:      { label: "Fans and independents", long: "Fans and independents",     light: "#00808c", dark: "#46e4ee" },
    platform: { label: "Platforms",             long: "Platform",                  light: "#3b3d6e", dark: "#e6e8ff" },
    output:   { label: "Where it lands",        long: "Where it lands",            light: "#a9177f", dark: "#ff5fd5" }
  },

  /* ---------- clips ----------
     id     unique short name, used by edges and icons (letters, numbers, dashes)
     name   title shown on the map
     era    label shown under the title ("1975", "1980s")
     yr     year used to place the clip left-to-right
     y      vertical position on the map (about 200 = top, 920 = bottom)
     kind   one of the categories above
     icon   optional; name of a drawing in js/icons.js (defaults to the id)
     text   the description: a list of paragraphs (HTML allowed, e.g. <i>titles</i>)
     move   the "signature move" line
     media  optional list of real clips ("tapes") shown in the panel:
              { type: "video",   src: "media/file.mp4", start: 12, caption: "..." }
              { type: "youtube", id: "VIDEO_ID",        start: 30, caption: "..." }
              { type: "image",   src: "media/still.jpg",           caption: "..." }
              { type: "audio",   src: "audio/interview.mp3",       caption: "..." }
            "start" is in seconds and optional.

     To add a clip, copy this template into the list below:

     { id: "my-clip", name: "My clip", era: "2021", yr: 2021, y: 460, kind: "fan",
       icon: "generic",
       text: [
         "First paragraph: what it is.",
         "Second paragraph: how it works or what happened.",
         "Third paragraph: why it matters to the edit."
       ],
       move: "The technique it's known for.",
       media: [] },
  */
  nodes: [
    { id: "soviet", name: "Soviet montage", era: "1920s", yr: 1925, y: 330, kind: "industry",
      text: [
        "In the years after the 1917 revolution, a group of young Soviet filmmakers set out to discover what cinema could do that no other art could. Their answer was montage: the idea that a film's meaning lives in the cut between shots, not inside any single shot. Film stock was scarce, so they studied existing footage obsessively, taking films apart and reassembling them to see what changed.",
        "Lev Kuleshov's famous experiment spliced the same neutral close-up of an actor against different images, usually described as a bowl of soup, a child in a coffin and a woman on a divan. Audiences reportedly praised the actor's subtle shifts between hunger, grief and desire, though his face never changed. Sergei Eisenstein pushed further, treating cuts as collisions meant to jolt the viewer, most famously in the Odessa Steps sequence of <i>Battleship Potemkin</i> (1925). Dziga Vertov's <i>Man with a Movie Camera</i> (1929) made the editing itself the star.",
        "Almost every technique in a modern edit descends from these arguments. A stare becomes menacing because of what's cut next to it, and a montage builds pressure through accelerating rhythm. The lineage runs all the way to <i>Rocky IV</i>, a film about beating a Soviet boxer that runs on Soviet film theory."
      ],
      move: "Collision. Two images placed side by side create a third meaning that neither holds alone. Any edit that makes a stare look menacing because of what comes next is running on this idea.",
      media: [
        { type: "youtube", id: "BAbzRjErywY", caption: "Earliest and one of the greatest sequence of cuts in film history" }
      ] },

    { id: "found", name: "Found-footage film", era: "1958", yr: 1958, y: 740, kind: "fan",
      text: [
        "In the late 1950s and 1960s, experimental filmmakers began building films entirely out of footage they didn't shoot. Bruce Conner's <i>A Movie</i> (1958) stitched together newsreels, westerns and stock footage into an absurd, escalating chain of chases and disasters, set to Respighi's orchestral music. Its meaning comes from juxtaposition: in one famous run, a submarine officer looks through a periscope, a pin-up appears, and a torpedo fires.",
        "Conner's <i>Cosmic Ray</i> (1961) cut a frantic collage to Ray Charles's “What'd I Say,” and Kenneth Anger's <i>Scorpio Rising</i> (1963) set footage of bikers to a string of early-60s pop songs, using them as ironic and erotic commentary. Critics have since called these films ancestors of the music video, and Conner's rapid cutting to the beat looks startlingly like MTV two decades early.",
        "Found footage established the premise of every fan edit: you don't need to own a camera or the footage to make something new. Borrowed images and a pop song, arranged with intent, become a new work. It's also where remix's legal gray zone begins, a tension that vidders, AMV makers and TikTok editors all inherit."
      ],
      move: "Recontextualizing. Borrowed images with a pop song on top, and the song tells you how to read them.",
      media: [
        { type: "youtube", id: "prf7dsuKD7k", caption: "Bruce Conner's films paving the way of what's to come with MTV" }
      ] },

    { id: "nflfilms", name: "NFL Films", era: "1962", yr: 1962, y: 300, kind: "industry",
      text: [
        "NFL Films began with Ed Sabol, a coat salesman and amateur filmmaker who started a company to film his son's high school football games. In 1962 he bid for the rights to film the NFL Championship Game, and the league soon brought the operation in-house as NFL Films. His son Steve joined as a cameraman and became its creative force.",
        "The Sabols filmed football the way Hollywood filmed war epics. Long telephoto lenses picked out sweat and breath, slow motion turned spirals into slow arcs, and microphones on players let you hear the collisions. Sam Spence's orchestral scores and narrator John Facenda, nicknamed “the Voice of God,” gave highlight reels the weight of scripture.",
        "NFL Films taught sport to see itself as mythology, and that is the emotional DNA of every hype video since. Slow motion at the peak moment, a swelling score, a voice telling you this matters: the aura edit is NFL Films compressed to thirty seconds, with phonk in place of the orchestra."
      ],
      move: "Slow motion, score and voice together. The ball hangs in the air while the music swells, and one play becomes a legend.",
      media: [
        { type: "youtube", id: "Nh0wTYWOHoU", caption: "Ed Sabol's farewell" }
      ] },

    { id: "vidding", name: "Fan vidding", era: "1975", yr: 1975, y: 880, kind: "fan",
      text: [
        "Vidding began in 1975, when Kandy Fong showed a slideshow of <i>Star Trek</i> stills set to music at a fan convention. With no way to edit footage, she let the song do the work of interpretation. Once home VCRs arrived, fans recut footage directly, usually wiring two decks together and pausing and recording clip by clip, losing picture quality with every copy.",
        "Vidding was overwhelmingly done by women in media fandom, around shows like <i>Star Trek</i>, <i>Starsky &amp; Hutch</i> and <i>Blake's 7</i>. Vids premiered at convention screenings such as MediaWest*Con's vid show and later at Vividcon, which ran from 2002 to 2016. Much early vidding came from slash fandom, assembling every lingering look between two male characters to argue for a romance the show never admitted. That tradition runs straight into today's shipping edits.",
        "Vidders also saw their work as criticism. Luminosity and sisabet's <i>Women's Work</i> (2007) gathers the women brutalized in <i>Supernatural</i> while barely showing its heroes, so the pattern becomes impossible to ignore. Luminosity's <i>Vogue</i> (2007), cutting <i>300</i> to Madonna, went viral beyond fandom. Francesca Coppa's <i>Vidding: A History</i> (2022) is the standard account of the form."
      ],
      move: "The song as a lens. Gather every glance or every injury into one sequence and the pattern becomes impossible to unsee.",
      media: [
        { type: "video",   src: "media/WomensWork106MB.mp4", caption: "Critical unraveling through fanworks" }
      ] },

    { id: "mtv", name: "Music television", era: "1981", yr: 1981, y: 250, kind: "industry",
      text: [
        "MTV launched on August 1, 1981, opening with The Buggles' “Video Killed the Radio Star.” Music videos existed before, but a channel playing them around the clock turned them into a daily visual diet for a generation and made how a song looked as important as how it sounded.",
        "The music video developed its own grammar: cutting on the beat, mixing performance with fragments of story, and choosing images for mood rather than narrative logic, at a pace that would have felt disorienting in a feature film. Directors trained in music videos and advertising carried the style into Hollywood, and by the mid-80s critics were complaining about “MTV-style” filmmaking in films like <i>Flashdance</i> (1983) and <i>Top Gun</i> (1986).",
        "MTV shaped both lineages on this map at once. It changed professional film and TV editing, and it handed fans a template: once vidders and AMV makers had VCRs, the music video was the obvious model for what to make."
      ],
      move: "Cutting on the beat. The rhythm of the song decides when the picture changes.",
      media: [
        { type: "youtube", id: "T6uNI0SLMds", caption: "Arguable where many of these styles and format really began" }
      ] },

    { id: "amv", name: "AMVs and MADs", era: "1980s", yr: 1983, y: 650, kind: "fan",
      text: [
        "Anime music videos began in the early 1980s, when fans with VCRs started cutting anime footage to pop songs. The first known AMV is usually credited to Jim Kaposztas in 1982, who set footage from <i>Space Battleship Yamato</i> to a Beatles song. Anime conventions soon held AMV contests, and AnimeMusicVideos.org, launched in 2000, became the hub of the Western scene.",
        "In Japan the parallel form is called MAD, a name often traced to fan-edited audio cassettes of the 1980s before it spread to video. When Nico Nico Douga launched in 2006, MADs became mass culture, and the site spawned otoMAD, which chops and pitches sounds and dialogue into music, along with a whole remix vocabulary of its own.",
        "AMV culture turned sync into a craft: lip movements matched to lyrics, impacts landing on drums, camera pans following a melody, all sustained across an entire song. Those techniques were later absorbed into the general grammar of the edit, often without credit, while dedicated AMV communities carry on in otaku spaces."
      ],
      move: "Sync. Lip movements, impacts and camera moves matched to the music frame by frame, across a whole song.",
      media: [
        { type: "youtube", id: "ForQCPqCbuE", caption: "One of the greatest movies of all time" }
      ] },

    { id: "rocky", name: "Rocky IV", era: "1985", yr: 1985, y: 440, kind: "industry",
      text: [
        "<i>Rocky IV</i> (1985) arrived four years into the MTV era, and it shows. Much of the film is montage: Rocky training in the Siberian snow, cut against Ivan Drago's high-tech regimen, with the soundtrack carrying the emotion and almost no dialogue. Critics at the time called it a feature-length music video, not always as a compliment.",
        "Its most striking sequence has Rocky driving at night to Robert Tepper's “No Easy Way Out” while footage from the previous three films plays as memories. Structurally, that's a fan edit made by the franchise itself: existing footage recut to a new song to create an emotion none of the original scenes had in that order.",
        "The training montage, which the series had refined since the original <i>Rocky</i> (1976), became a template for compressing effort into minutes of rising energy. It's a direct ancestor of the sports edit's build toward the drop. And fittingly for a film about beating a Soviet fighter, it runs on Soviet montage theory."
      ],
      move: "The recap montage. Old footage, a new song and a new emotion, compressing years of story into three minutes.",
      media: [
        { type: "youtube", id: "F1gd_9noZMA", caption: "Critics might call it a glorified music video, but the impact speaks for itself" }
      ] },

    { id: "wwe", name: "Wrestling promo packages", era: "1990s", yr: 1992, y: 300, kind: "industry",
      text: [
        "Professional wrestling is scripted sport: the outcomes are decided in advance, but the athleticism and the physical risk are real. That makes storytelling its core business. As wrestling became a TV and pay-per-view spectacle from the 1980s onward, its video production teams developed the hype package into an art form.",
        "A promo package recaps a rivalry as an epic. Clips of past confrontations, slow motion on every stare-down and the wrestlers' own interview lines cut in as narration all build toward a date and a single match. The music swells under the spoken lines so that a threat or a promise lands exactly on the beat.",
        "Wrestling also gave sports culture its vocabulary. Heels and faces, cutting a promo, heel turns and kayfabe are now everyday language in NBA and football discourse. Sports edits borrowed the package's structure, and in Japan, women's wrestling fused with idol culture outright when the Crush Gals became pop stars in the 1980s."
      ],
      move: "The athlete's voice as dialogue. A spoken line lands on the drop, and the music answers it.",
      media: [
        { type: "youtube", id: "pfh7S6nTbUw", caption: "The Rock and Stone Cold Steve Austin face-off" }
      ] },

    { id: "mixtape", name: "Streetball mixtapes", era: "1998", yr: 1998, y: 780, kind: "fan",
      text: [
        "Streetball highlight tapes turned playground basketball into a spectator art. The best known, the AND1 Mixtape, began in 1998 with footage of Rafer Alston, known as “Skip to My Lou,” dazzling crowds on New York street courts, set to hip-hop and passed around on VHS.",
        "The tapes celebrated style over results. Crossovers, ball fakes and humiliating dribbles were shown from several angles, slowed down and replayed, with crowd reactions cut in like applause. Players became known by nicknames and signature moves, and AND1 turned the format into touring shows and television.",
        "Mixtapes brought hip-hop's sensibility to sports video: the beat sets the pace, swagger counts as much as skill, and a single move can be the whole highlight. That spirit runs straight into modern basketball edits and the aura aesthetic, where the celebration or the stare matters as much as the score."
      ],
      move: "Style over result. The move itself is the highlight, cut to the beat and replayed from every angle.",
      media: [
        { type: "youtube", id: "LweNdi92DW0", caption: "Stylistic swagger" }
      ] },

    { id: "platforms", name: "YouTube, Nico Nico, Tumblr", era: "2005", yr: 2006, y: 560, kind: "platform",
      text: [
        "Between 2005 and 2007, three platforms collapsed separate scenes into shared spaces. YouTube (2005) put AMVs, fan vids, sports compilations, music videos and home movies side by side, searchable and free to watch. Techniques that had circulated in small communities on tapes and at conventions were suddenly visible to anyone.",
        "In Japan, Nico Nico Douga (2006) added viewer comments scrolling across the video itself and became the home of MAD culture, otoMAD and Vocaloid remixes. Tumblr (2007) became the center of Western fandom in the early 2010s, and its gifsets taught people to think in short, looping fragments: a look, a line, a moment isolated from its scene.",
        "The same era brought copyright into sharp focus. Takedowns pushed some vidders back into private communities, while the Organization for Transformative Works, founded in 2007, fought for fan creators' legal rights. The platforms made remix mainstream and turned it into a legal battleground at the same time."
      ],
      move: "Collision at scale. Anyone could watch, copy and remix everyone else's techniques.",
      media: [
        { type: "youtube", id: "cE13yvrTfjA", caption: "Otaku streams meld and meet" }
      ] },

    { id: "vine", name: "Vine", era: "2013", yr: 2013, y: 720, kind: "platform",
      text: [
        "Vine launched in January 2013, already owned by Twitter, and gave users six seconds of looping video. It quickly became a cultural engine, especially for young creators, until Twitter stopped uploads in early 2017.",
        "Six seconds forced a new discipline. Comedy had to land a setup and punchline in two breaths, and edits had to hit one perfect sync or transition. Because clips looped automatically, the best Vines were built to reward instant rewatching, with endings that flowed back into their beginnings.",
        "Vine trained a generation of creators and viewers in micro-timing, and many of its stars moved on to YouTube and later TikTok. Its sense of rhythm, its loop logic and its catchphrase culture live on in short-form video, and Vine compilations became a nostalgia genre of their own."
      ],
      move: "The loop. Build something that rewards watching again the instant it ends.",
      media: [
        { type: "youtube", id: "U4QXJHBcnYI", caption: "Ah hell naaaaw aaa~" }
      ] },

    { id: "fancam", name: "Fancams", era: "2014", yr: 2014, y: 880, kind: "fan",
      text: [
        "In K-pop, fancams (<i>jikcam</i> in Korean) are videos filmed by fans in the audience that follow a single member through an entire performance. Broadcasters later adopted the idea with official focus cams, but fans' footage kept a special place: it captures the expressions and energy that the main broadcast cuts away from.",
        "In 2014, a fan's footage of EXID's Hani performing “Up &amp; Down” went viral and pushed the group's months-old single to the top of the Korean charts, a story that became K-pop legend. On Twitter, fancams became the currency of stan culture, posted in replies to promote a favorite or derail a thread. In June 2020, K-pop fans flooded a racist hashtag and a police tip app with fancams as a form of protest.",
        "The fancam's core idea is focus: one person followed through a group performance, turning a stage into a portrait. That grammar, along with stan vocabulary like biases and ships, carried into sports when fans began making fancam-style edits of footballers, drivers and tennis players."
      ],
      move: "Focus. One person followed through a group performance turns a stage into a portrait.",
      media: [
        { type: "youtube", id: "gs3RBRoTKYI", caption: "Unnie fangirling to the max" }
      ] },

    { id: "videoessay", name: "Video essays", era: "2014", yr: 2015, y: 400, kind: "fan",
      text: [
        "Video essays use editing to make an argument about film, games or culture. The form has roots in film criticism and the supercut, but it broke through on YouTube in the 2010s with channels like Tony Zhou and Taylor Ramos's <i>Every Frame a Painting</i> (2014 to 2016), which explained how directors and editors achieve their effects by cutting between examples.",
        "The key move is juxtaposition used as evidence. Two scenes side by side can prove a point about framing or rhythm faster than a paragraph of prose. In that sense the video essay inherits vidding's critical side: like <i>Women's Work</i>, it shows you a pattern by assembling it.",
        "The form keeps evolving, from hour-long analyses on YouTube to short media-literacy commentary on TikTok and Reels that dissects a scene, an ad or a viral clip in under a minute. A video essay about edit culture itself, tracing the history on this map, is still waiting to be made."
      ],
      move: "Argument by juxtaposition. Two clips side by side prove a point faster than a paragraph.",
      media: [
        { type: "image",   src: "media/videoessays.jpeg", caption: "Proliferation of media literacy" }
      ] },

    { id: "leagues", name: "Leagues open the footage", era: "2017", yr: 2017, y: 250, kind: "industry",
      text: [
        "What fans can make depends on what footage they can reach. The NBA let highlights circulate relatively freely on social platforms, which helped make NBA Twitter one of the liveliest sports cultures online. Other leagues were far more guarded, and many fan accounts lived with constant takedowns.",
        "Formula 1 is the clearest turning point. Under Bernie Ecclestone it was notoriously restrictive about social media. After Liberty Media bought the sport in 2017, it opened up its footage and partnered with Netflix on <i>Drive to Survive</i> (2019), a character-driven series credited with drawing in huge numbers of younger fans and many women. <i>The Last Dance</i> (2020), about Michael Jordan's Bulls, did something similar for basketball during pandemic lockdowns.",
        "Leagues and teams now produce their own personality-driven content: behind-the-scenes clips, mic'd-up segments and social accounts that post like fans. The official and the fan-made feed each other, with leagues supplying raw material and fans cutting the stories the leagues can't tell."
      ],
      move: "Character over results. Leagues started cutting their own personality-driven stories, then let fans cut the rest.",
      media: [
        { type: "youtube", id: "9lP95Qo-I0", caption: "The GOAT greatest dunks" }
      ] },

    { id: "tiktok", name: "TikTok and CapCut", era: "2018", yr: 2018, y: 560, kind: "platform",
      text: [
        "TikTok merged with Musical.ly in 2018 and became the defining platform of short-form video. Its recommendation algorithm shows clips to people who don't follow the creator, so a well-cut edit can reach millions overnight regardless of who made it.",
        "CapCut, the editing app from TikTok's parent company ByteDance, put professional techniques in everyone's pocket: velocity ramps that speed and slow footage on the beat, flashes, shakes, overlays and color grades, many available as ready-made templates. Effects that once took AMV makers hours in desktop software became presets.",
        "The result is the edit as a universal form. Anime, athletes, idols, film characters and historical footage all get the same grammar, often built around the same trending sounds. Templates democratized the craft but also push creators toward sameness, the old tension between an art form and the feed that delivers it."
      ],
      move: "The template. One sound and one structure, endlessly refilled with new footage.",
      media: [
        { type: "video",   src: "media/tiktokcore.mp4", caption: "The ultimate short form video platform" }
      ] },

    { id: "aura", name: "Aura edits", era: "2020s", yr: 2022, y: 380, kind: "output",
      text: [
        "“Aura” became mainstream internet slang around 2023 and 2024, describing a presence of effortless, unbothered dominance. The slang treats it like a currency: a clutch shot earns aura, an embarrassment costs it, and “aura farming” means deliberately cultivating it. In 2025, a boy dancing with total calm at the prow of a racing boat during Pacu Jalur, a traditional boat race in Riau, Indonesia, made aura farming a global phrase.",
        "Aura edits are the visual arm of discourse fandom. They often use phonk, with its distorted bass and cowbells, along with dark color grades, slow motion and camera shakes. They linger less on the goal or the dunk than on what surrounds it: the stare afterward, the silent celebration, the walk away before the ball goes in.",
        "Their ancestors are NFL Films' mythmaking, wrestling's villain packages and streetball swagger. They feed GOAT debates and legacy arguments, making the case for a player's greatness visually, while NBA Twitter-style discourse makes it in words."
      ],
      move: "The pause before the drop. Everything slows, then the beat hits on the moment of total control.",
      media: [
        { type: "video",   src: "media/f1aura.mp4", caption: "Tje coolest and baddest mfs you've ever seen" }
      ] },

    { id: "stan", name: "Stan edits", era: "2020s", yr: 2022, y: 760, kind: "output",
      text: [
        "Stan edits bring K-pop fandom's toolkit into sports: fancam grammar, bias language, ship names, soft or romantic songs and close attention to the dynamics between people. The focus shifts from results to relationships: rivalries, teammates, friendships in the paddock, a hug at the net.",
        "Rivalries like Jannik Sinner and Carlos Alcaraz are ideal material because their stakes are real. The two met in three straight Grand Slam finals in 2025, and Alcaraz has openly played along with fans' enthusiasm. F1 teammates and football duos get the same treatment, and athletes' own social media often feeds the stories.",
        "This mode has widened who feels welcome in sports fandom, drawing in many women and queer fans, and it inherits vidding's shipping tradition directly. It also raises a question vidders knew well: unlike K-pop idols, athletes never signed up to have their friendships narrated, and not all of them welcome it."
      ],
      move: "Chemistry. A glance, a hug at the net, a shared joke, cut together until the relationship becomes the story.",
      media: [
        { type: "video",   src: "media/newjeans.mp4", caption: "Evolution on fandom editing" }
      ] },

    { id: "uma", name: "Umamusume edits", era: "2025", yr: 2025, y: 570, kind: "output",
      text: [
        "<i>Umamusume: Pretty Derby</i> reimagines famous Japanese racehorses as horse girls, with horse ears and tails, who race and then perform idol concerts after winning. Horse girls appear elsewhere in anime and manga too, but Umamusume is distinctive because its characters come from real horses with documented careers.",
        "Umamusume edits often set archival race footage beside the anime or game recreation, so the fiction and the history comment on each other. When the franchise rewrites a tragic ending, as it does for Silence Suzuka, the edit carries both what really happened and what fans wished had happened.",
        "This is where the lines on the map meet. It draws on the AMV lineage through anime, on sports mythmaking through real races, and on idol culture through its winning concerts. Its characters work in both edit registers, cute enough for stan edits and fearsome enough for aura edits, a blend of moe and aura."
      ],
      move: "The juxtaposition. Real footage and fiction side by side, so the history hits harder than either alone.",
      media: [
        { type: "video",   src: "media/umaedit.mp4", caption: "Truest real-fiction" }
      ] }

  ],

  /* ---------- connections ----------
     Each pair is [from, to]: "from" influenced "to".
     The animated dashes flow in this direction. */
  edges: [
    ["soviet", "found"], ["soviet", "nflfilms"], ["soviet", "mtv"], ["soviet", "rocky"],
    ["found", "vidding"], ["found", "mtv"],
    ["nflfilms", "wwe"], ["nflfilms", "mixtape"], ["nflfilms", "leagues"], ["nflfilms", "aura"],
    ["vidding", "amv"], ["vidding", "platforms"], ["vidding", "videoessay"], ["vidding", "stan"],
    ["mtv", "rocky"], ["mtv", "vidding"], ["mtv", "amv"], ["mtv", "wwe"],
    ["rocky", "wwe"], ["rocky", "aura"],
    ["amv", "platforms"], ["amv", "uma"],
    ["wwe", "leagues"], ["wwe", "aura"],
    ["mixtape", "platforms"], ["mixtape", "aura"],
    ["platforms", "vine"], ["platforms", "fancam"], ["platforms", "videoessay"], ["platforms", "tiktok"],
    ["vine", "tiktok"], ["fancam", "stan"], ["fancam", "tiktok"], ["videoessay", "tiktok"],
    ["leagues", "tiktok"], ["leagues", "aura"], ["leagues", "stan"],
    ["tiktok", "aura"], ["tiktok", "stan"], ["tiktok", "uma"],
    ["aura", "uma"], ["stan", "uma"]
  ]
};
