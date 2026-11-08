# The Echo Index: A Sound Map of *Taste of Cement*

*Draft. Rewrite it in your own voice, and check every timestamp against the film before submitting.*

## The idea

*Taste of Cement* (Ziad Kalthoum, 2017) follows Syrian workers building a tower in Beirut while their own homes in Syria are being bombed. A curfew confines them to the building's foundations after dark. Kalthoum, himself a deserter from the Syrian army who fled to Beirut, made a film in which the men barely speak. According to the film's programme notes, they were not allowed to talk about their working conditions. Instead, the soundtrack carries the argument: the grind of the cement mixer, hammering, a tank's tracks, shelling, the sea, long silences. The film never says that building one city and destroying another are bound together. It makes us hear it.

My map therefore does not trace the workers' route from Syria to Lebanon. That journey has already happened before the film begins and is never shown. Instead it maps the soundtrack as a territory. Every one of the film's 5,098 seconds becomes a point in a three-dimensional space, positioned by measurements of how it sounds: loudness, low-frequency "weight", brightness, percussiveness, rhythm, and the judgement of a machine-listening model trained to recognise 521 kinds of sound. In this space, geography no longer separates Beirut from Syria. Only acoustics does. The question the map asks is the one the film poses without words: **how far apart do building and destroying actually sound?**

## Strategy and choices

**Why sound, and why measure it?** The workers are kept out of sight under curfew and out of speech by their working conditions. Sound is the one channel through which the film lets their experience through. Measuring it is a way of taking the film's formal strategy seriously, of treating its sound design as evidence rather than atmosphere. I used two kinds of listening. The first is signal analysis: how loud, how low, how bright, how many hits per second. The second is a pretrained classifier (Google's YAMNet), which labels each half-second as *Hammer*, *Engine*, *Explosion*, *Speech*, *Silence* and so on. I grouped its labels into sound-worlds: machine, detonation, voice, music, water, silence.

**Making it readable without context.** The 3D view compares building and bombing directly. Dots are coloured by four groups: tools and metal (dark blue), engines and heavy machines (light blue), bombs, gunfire and thunder (orange), and seconds heard as both at once (pink). Everything else stays faint for context. Each axis is named in plain language with its two ends ("Heaviness: light → heavy", "Sharpness: muffled → sharp"). Hovering over a dot opens a semi-transparent card that explains, in words, what that second is, what the computer hears, and how it ranks against the rest of the film. Notes anchored in the space flag key moments. An eight-step guided tour walks a first-time viewer from "every dot is one second" to why the overlap matters, and four questions ("Do they hit the body the same way?", "Does the rhythm of work echo the rhythm of war?"…) reconfigure the space to answer them. Their captions are calculated live from the data. A *Timeline* lays the same data out in film order, and an *Impacts* view isolates the 75 single hits in the film, hammer against shell.

**The echo index.** I built one comparator specifically for this film. For each second, it asks whether the sound sits closer to the average sound of the war or to the average sound of the building site, on a scale from −1 (machine) to +1 (war). It turns the film's main formal move into something that can be measured and then argued with.

**Interactivity and listening.** Anyone with the film can load it into the map. Clicking a point plays that second, and two points can be compared back to back (for example the hammer at 1:49 and the "gunfire" the classifier hears a second later). The map does not ask to be trusted. It asks to be listened against.

**Places are left to the viewer.** The classifier hears sound types, not locations: "detonation" means *sounds like* a blast, not *filmed in Syria*. Rather than hide that gap, I built a Places tool where viewers mark what they see on screen. The space between what is heard and what is seen is part of what the map documents.

## What the map shows

- **The war is mostly heard through the machines.** Detonation sound fills under 4 % of the film; machinery fills nearly 30 %. The loudest sustained stretch (48:49–55:40) cuts a tank against a building site: the classifier gives the tank's movement and the construction machinery the same label, "Vehicle", and the tank firing at 54:14 matches a wall being drilled at 54:27 at 98% on the site's overlap measure.
- **Building and destroying rhyme.** In the first two minutes, a hammer and jackhammer are classified as *gunfire*. A machine rumble around 13:00 is judged most similar to "thunder" heard almost an hour later, around 70:20. The rhymes work like memory: a sound heard in Beirut returns as Syria.
- **What separates a shell from a hammer is distance, not weight.** Hits heard as detonations ring on nearly twice as long (median 2.1 s vs 1.2 s) and are much darker, which is the acoustics of distance and open space. Their low-frequency weight, the part felt in the body, overlaps heavily with the hammers'.
- **Silence and cuts are structural.** The only moment of absolute digital silence before the credits comes straight after a cluster of explosions (30:05). Heavy machine sound is repeatedly cut off into silence. The narrator's voice arrives as isolated bursts in quiet, framed the way the film frames shelling.

## Why this map matters

Migration studies often picture displacement as a line on a map from origin to destination. *Taste of Cement* refuses that picture. Its subjects have arrived, yet in an important sense they have not left: the war follows them in the noise of their own labour, and the border they face is not only Lebanon's frontier but also the nightly curfew that keeps them below ground. A geographic map cannot show this. An acoustic one can, because in the soundtrack Syria and Beirut sit in the same space, sometimes a single second apart.

The map also bears on **opacity and transparency**. The workers stay largely opaque to us: unnamed, rarely speaking, seen from a distance. The map doesn't try to make them transparent by speaking for them. It makes the film's own logic transparent instead, showing the decisions of sound design and editing that produce our sense of their experience. That is also a lesson about how documentaries create empathy. We are not shown a worker's trauma; we are made to hear a hammer and think of a shell.

Finally, the map's limits are part of its argument. A machine listener trained on two million YouTube clips has no category for a tank or a cement mixer and confuses hammering with gunfire. It cannot hear the difference that matters most to the men in the film, the difference between building and losing a home. For a **general audience who has never lived near either sound**, especially one that lives among cranes, the map offers a way to understand what it might mean to keep working inside the sound of your own city's destruction. For a museum, it could become an installation: walk through the cloud of points and hear the construction site turn into war.

---

**Sources:** *Taste of Cement* (dir. Ziad Kalthoum, 2017); festival programme notes (IDFA, DokuFest, Visions du Réel); Modern Times Review; YAMNet (Google Research, AudioSet ontology). Analysis code and data: this repository.
