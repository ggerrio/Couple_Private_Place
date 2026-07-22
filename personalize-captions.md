# Birthday Experience — Personalize Captions

Edit `personalize-captions-edits.json` (or any JSON of the same shape)
and run: `node scripts/personalize-birthday-captions.mjs --apply personalize-captions-edits.json`

| slot | current caption | [GER: refine] hint |
|------|-----------------|---------------------|
| 1 | Jakarta at 11PM — the night I knew this would last. | [GER: refine — maybe your first 'I like you' moment?] |
| 2 | Bandung mist, your laugh ringing clearer than all of it. | [GER: refine — the cafe you couldn't stop ordering] |
| 3 | Yogyakarta — your first time at Borobudur, eyes wide at sunrise. | [GER: refine — your favorite Yogya street-food stall] |
| 4 | Bali, Tanah Lot, salt still on our skin. We didn't need words. | [GER: refine — your 'wow' moment in Bali] |
| 5 | Semarang old town — your hand in my pocket the whole walk. | [GER: refine — what we ate at the warung] |
| 6 | Malang — the apple orchard you made me try. I still don't like them. But I love you. | [GER: refine — what's the inside joke here?] |
| 7 | Bogor botanical garden — your favorite bench, our quietest afternoon. | [GER: refine — what you fed the ducks that day] |
| 8 | Surabaya — the day I met your family. I was terrified. You were calm. | [GER: refine — what your mom said about me] |
| 9 | Manila jeepney ride — your elbow nudging mine at every bump. | [GER: refine — where we got lost] |
| 10 | Singapore, Gardens by the Bay — the Supertree lit up just for us. | [GER: refine — what we ate at Lau Pa Sat] |
| 11 | KL — Petronas lit at midnight, taller than your smile. Almost. | [GER: refine — late-night mamak order] |
| 12 | Bangkok street-food alley — you teaching me to eat spicy. | [GER: refine — what we ordered twice] |
| 13 | Tokyo, Shibuya crossing — the only chaos I'm glad to be lost in. | [GER: refine — the konbini we returned to 3 nights in a row] |
| 14 | Osaka — you laughed so hard at takoyaki you cried. | [GER: refine — what got stuck on my face] |
| 15 | Kyoto bamboo grove — your whisper, my answer. | [GER: refine — the exact words if you remember] |
| 16 | Sixteen cities, sixteen postcards — and you remain my favorite. |  |

Cities assigned per slot (from BIRTHDAY_PHOTO_VARIANTS so the postmark stays authentic):
1=Jakarta · 2=Bandung · 3=Yogyakarta · 4=Bali · 5=Semarang · 6=Malang
7=Bogor · 8=Surabaya · 9=Manila · 10=Singapore · 11=Kuala Lumpur · 12=Bangkok
13=Tokyo · 14=Osaka · 15=Kyoto · 16=Jakarta (finale)
