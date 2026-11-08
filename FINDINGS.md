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

## 2. The loudest stretch is a tank and a building site cut together

The loudest sustained stretch of the film is **48:49–55:40** (mean −20.6 dB). Watching it shows a tank sequence intercut with construction: a tank moving at 51:38, 52:42, 53:30 and 55:11, construction machinery moving at 53:17, the tank firing at 54:14 and 54:29, and a wall being drilled at 54:27. The classifier hears the tank's movement as "Vehicle", the same label it gives the construction machinery, and hears the firing as "Boom". Of the 300 loudest seconds in the film, 209 fall in 51–56 min.

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

## 8. Moments checked by watching the film

War sounds identified on screen, paired with a building sound. Overlap uses the comparison page's measure: timbre, loudness shape and level, after lining the two up. A median random pair from the film scores about 40–55%.

| # | War sound (seen) | Building sound | Partner found by | Overlap |
|---|---|---|---|---|
| 1 | Bombs 28:53 | 10:01 (engines) | closest building sound by measurement | 100% |
| 2 | Tank moving 51:38 | Construction moving 53:17 | watching | 97% |
| 3 | Tank firing 54:14 | Drilling a wall 54:27 | watching | 98% |
| 4 | Footsteps in tunnels 62:16 | 14:26 (rumble) | closest building sound by measurement | 94% |
| 5 | Panicked clamour 63:28 | 43:56 (vehicles) | closest building sound by measurement | 100% |
| 6 | Shovelling rubble 64:35–67:44 | 10:38 (engines) | closest building sound by measurement | 99% |
| 7 | Helicopter 67:47 | Construction lift 76:24–77:21 | watching | 93% (70% at 76:24) |

**Notes**
- Pairs 2, 3 and 7 were paired by eye. Their high overlap shows that the film puts sounds that match acoustically side by side.
- For 1, 4, 5 and 6, every construction second was searched for the closest sound. That excluded anything within 90 s and the war stretches (51–56 and 59–71 min). Many matches hit the top of the scale, so I ranked them on the uncapped score.
- **Caution:** the score saturates for loud, dense sounds, so 100% means "as close as this measure can tell", not "identical". It does not prove the audience hears them as the same.
- The pairing at 54:27 and 54:29 (drill vs tank fire, 2 seconds apart) was not scored. Their 6-second windows overlap, so the score would compare the audio with itself.

## 9. Against a published review

A review credits the sound design to Sebastien Tesch and Ansgar Frerich and makes two claims about it.

- **"The rumble of the sea or the sound of tanks rolling over debris become one and the same."**
  - Sea seconds against the tank-moving moments above score a median of 67% overlap, against a 41–55% median for random pairs.
  - That is closer than chance but not as close as the tank and the construction machinery (97–100%).
  - The data supports the tank and building-site rhyme more strongly than the sea and tank one.
- **"The frantic clamour of voices in the aftermath of the bombing contrasts starkly with the numb silence of the Syrian workers in Beirut."**
  - The clamour and shovelling stretch, 63:19–67:56, averages −23.2 dB, and 91% of its seconds are heard as speech.
  - The long quiet stretch that follows, 70:54–75:19, averages −55.1 dB with 2% speech: about 32 dB quieter.
  - *Verify:* is 70:54–75:19 the workers in Beirut?
