# What the soundtrack analysis found

All figures come from the scripts in `/analysis`, run on the full soundtrack (84:58). "Classifier" means YAMNet, Google's AudioSet sound classifier: it reports what a sound is *like*, not where it was recorded.

> **Verify before you cite.** The analysis had the audio only, not the picture. Every place name below ("Beirut", "Syria", "the sea") is an inference from sound plus published descriptions of the film. Check each timestamp against the film (load the MP4 into the map and click the time), and record what you see with the Places tool.

## 1. The war is mostly heard *through* the machines

Share of film time by dominant sound-world:

| sound-world | seconds | share | mean loudness |
|---|---|---|---|
| machine / tools / engines | 1,504 | 29.5 % | −30.5 dB |
| voice | 875 | 17.2 % | −34.0 dB |
| unclassified ambience | 776 | 15.2 % | −39.9 dB |
| silence | 703 | 13.8 % | −55.3 dB |
| music / score | 561 | 11.0 % | −32.5 dB |
| wind / rustle / noise | 368 | 7.2 % | −46.8 dB |
| **detonation / gunfire / thunder** | **200** | **3.9 %** | −28.1 dB |
| water / sea | 110 | 2.2 % | −34.1 dB |

Sound the classifier hears as detonation fills under 4 % of the film. Machinery fills nearly a third. The war is present as a sound-world far more often than it is literally heard.

## 2. The loudest stretch is labour, not war

The loudest sustained stretch of the film is **48:49–55:40** (mean −20.6 dB), dominated by machine sound (Vehicle, Truck, Air brake). Inside it, the classifier repeatedly hears **"Boom"** (50:35–55:14). The sound has an extremely regular **2.0-second cycle** (autocorrelation 0.80), which suggests a mechanical rhythm. *Verify:* is this the construction site (pump, pile driver, mixer drum) or the tank sequence? Either way, the classifier hears a machine cycle as detonations.

## 3. Rhymes: building and destroying sound alike

For every strongly machine-like second, the map finds the war-like second that the classifier's internal representation (a 1,024-dimensional embedding) judges most similar. The tightest rhymes:

| machine moment | sounds most like | similarity | distance in film |
|---|---|---|---|
| 1:49 Hammer | 1:50 "Gunshot, gunfire" (81 %) | 0.85 | 1 s |
| 54:55 Vehicle | 54:52 Boom | 0.84 | 3 s |
| 69:39 Vehicle | 69:42 Thunderstorm | 0.81 | 3 s |
| 1:52 Jackhammer | 1:50 Gunshot | 0.81 | 2 s |
| **29:03 Rumble** | **70:23 Thunderstorm** | 0.81 | **41 min** |
| **12:56–13:05 Rumble** | **70:12–70:23 Thunderstorm** | 0.71–0.74 | **57 min** |

Two kinds of rhyme show up:
- **Adjacent:** machine and detonation sounds sit within seconds of each other. The edit layers or alternates them. At 1:49–1:52, within the first two minutes, a hammer and jackhammer are read as **gunfire**.
- **Distant:** a machine rumble around 13:00 returns almost an hour later as "thunder" around 70:20. This is how memory works: something heard in one place comes back in another.

## 4. What separates a shell from a hammer is distance, not weight

Of 75 isolated impacts (no speech over them):

| heard as | n | median decay | median low-freq weight | median brightness |
|---|---|---|---|---|
| detonation | 22 | 2.11 s | 0.69 | 738 Hz |
| machine | 21 | 1.18 s | 0.52 | 1,719 Hz |
| both at once | 5 | 0.56 s | 0.95 | 320 Hz |
| neither | 27 | 0.88 s | 0.64 | 942 Hz |

Detonations ring on nearly twice as long and are much darker. That is the acoustic signature of **distance and open space**: a far-off blast loses its high frequencies and echoes. The low-frequency weight of the two groups overlaps heavily (detonations 0.32–0.97, machines 0.06–0.98), so in the body they can land the same way. Five hits are read as **both** at once (29:30, 29:31, 49:02, 60:29, 70:01).

## 5. Silence is structural

- 13.8 % of the film is silence-dominant. The longest quiet stretch, **about 72:02 for 2:54** (inside 70:54–75:19), follows directly after the water-and-thunder passage (69:06–70:54) and is cut to with a −25 dB drop at 70:52.
- **The only moment of absolute digital silence** (true zero signal) before the end credits is **30:04.8–30:06.8**. It comes straight after the explosions at 29:24–29:35, and a boom breaks it at 30:06.8. *Verify:* black screen? Underwater? A cut between countries?
- Machine sound is cut away abruptly: at 79:55 a −29 dB drop goes straight from heavy vehicles into silence and then the narrator (80:20).

## 6. The narrator speaks out of silence

The voice-over arrives as isolated bursts in near-silence (3:25–5:01, 31:04–32:09, 80:20–81:39). Its onsets were so abrupt that the first version of the impact detector mistook the narrator's words for impacts. The film frames speech the way it frames shelling: sudden, surrounded by quiet.

## 7. The ending breathes

From 81:39 to the end, the sound is a soft noise that swells and fades with a **period of about 6.9 s**, which is consistent with surf (the classifier hears Rustle/Wind). *Verify:* the sea? After 80 minutes of machine cycles of about 2 s, the film ends on a slower, natural rhythm.

## Timestamps to check against the film

| time | what to look for |
|---|---|
| 1:37–1:55 | hammer/jackhammer read as gunfire |
| 9:48–15:17 | long machine stretch; rumble that "returns" at 70:20 |
| 22:00–25:00 | dense speech, tagged "Television": TV news in the barracks? |
| 28:29–30:10 | explosions, then the only digital silence, then a boom |
| 32:44–35:26 | detonation + music block |
| 48:49–55:40 | loudest stretch, 2 s cycle, "Boom" |
| 60:04–62:06 | 20 s of continuous "Thunderstorm" (bombardment?) |
| 63:19–67:56 | loud speech + crowd: rescue in rubble? |
| 68:39–70:54 | water + thunder (underwater/sea?) → hard cut to 4 min of quiet |
| 76:18–79:56 | heavy vehicles (tank?) → cut to silence |
| 80:20–84:58 | narrator, then the 6.9 s "breathing" ending |
