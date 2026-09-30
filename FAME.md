# Fame & Social Media: the design

The biggest system in the game so far. Goal: fame as a *second life axis*: you can be an
ordinary person, a small creator, a working actor, a global star, or a scandal.
BitLife has a Fame stat, a few celebrity careers and a handful of pop-ups. Better Bit
should have a living attention economy: platforms that behave differently, an audience
that reacts to you, money that follows attention, a public that can turn on you, and NPC
celebrities who rise and fall in the same world.

## Core model

- **Fame** (0-100): how many people know who you are. Decays without upkeep.
- **Public image** (-100..100): what they think of you. Independent of fame (a beloved
  nobody, a hated megastar).
- **Privacy** (0-100, falls as fame rises): drives stress, stalkers, paparazzi.
- **Audience**: per platform `{followers, engagement, growth trend, verified, banned}`.
  Followers are *counted*, not people; a few named fans, rivals, haters and journalists
  are real NPCs.
- **Team**: manager, agent, publicist, lawyer, security, editor. Each has a cut and a skill.
- **Income streams**: ad revenue, sponsorships, subscriptions, merch, salaries, royalties,
  appearances. All taxed like business income (v2.6), scaled by country.

## Platforms (all fictional; five, each with its own rules)

| Platform | Shape | Grows with | Risks |
|---|---|---|---|
| **Pixl** | photos, lifestyle | looks, aesthetics, consistency | comparison, fake-life backlash |
| **Loop** | short video | hooks, trends, luck | algorithm swings, one-hit fade |
| **Chirp** | text, hot takes | wit, opinions, timing | pile-ons, cancellation |
| **Streamly** | live and long video | charisma, hours, community | burnout, chat toxicity, ban |
| **Vox** | audio, podcasts | expertise, voice | slow growth, niche ceiling |

Yearly *algorithm shifts* reroll each platform's favoured content; platforms can lose or
gain popularity over a life (a platform can die; a new one appears in old age).

## Creating (the everyday loop)

Yearly content plan: **niche** (30+: comedy, beauty, gaming, cooking, fitness, finance,
travel, true crime, music, education, pranks, commentary, ASMR, DIY, pets...),
**cadence** (rarely / weekly / daily / never off), **quality spend**, **risk appetite**
(safe / edgy / outrage-bait). Plus capped one-off actions: *Post something*, *Go live*,
*Collab*, *Do a stunt*, *Hot take*, *Apologise*, *Buy followers*, *Delete everything*.
Content is built from what you already do: **hobbies feed niches** (cooking to recipes,
gaming to streams, photography to Pixl, writing to newsletters, guitar to singles).
Posts resolve to likes, comments (from a generated comment bank keyed to your image),
shares and a *virality roll* shaped by talent, timing, trend fit and luck.

## Careers on top of attention

1. **Creator**: monetisation thresholds, brand deals (fictional brands with values that
   can clash with yours), subscriptions, merch, agency, MCN-style networks.
2. **Actor**: auditions, casting, roles, box office and reviews, awards, typecasting.
3. **Musician**: write, record, release, streams, charts, tours, labels vs independent.
4. **Model**, **Comedian**, **TV presenter**, **Reality/talent-show star** (an on-ramp:
   enter a show, survive rounds, win or become a meme).
5. **Pro athlete** (its own release): leagues, drafts, contracts, injuries, endorsements.
6. **Public office** (later): local to national, campaigns, approval, scandals.

## Fame's dark side

- **Paparazzi and privacy**: photos, stalkers, leaked messages, doxxing.
- **Scandal and PR chains**: a crisis is a multi-step decision (ignore / apologise /
  deflect / lawyer up / get ahead of it); publicist skill and past image change outcomes.
  Outcomes: blow over, cancelled, career-ending, redemption arc.
- **Trolls and mental health**: comments hit sanity and happiness; fans can cross lines.
- **Money traps**: managers who steal, sponsor clawbacks, tax trouble, overspending.
- **Fame decay and comebacks**; one-hit wonders; nostalgia tours.

## The famous world

`world.celebs`: ~60 generated NPC celebrities with careers, fame, image and yearly arcs.
You can collab with, date, feud with or be compared to them. A **Trending** screen shows
this year's storylines. Famous exes and partners can make you more or less famous.

## How it plugs into the rest of the game

- Relationships: partners get jealous or opportunistic; family asks for money and favours;
  kids of famous parents start with fame (this feeds the future **legacy** system).
- Career: fame boosts job offers and interviews in media, hurts privacy-sensitive jobs.
- Health and mind: parasocial pressure, burnout, addiction risk (v2.7 hooks).
- Money and tax (v2.6): income streams, agents' cuts, big-money events.
- Achievements and headline popups (v2.7/v2.8): verified, first million followers,
  first brand deal, first viral post, cancelled, comeback.
- Places (v2.4/2.5): city and country change audience, language matters, going abroad
  resets or exports fame.

## Screens

A **Social** hub styled like a phone: *Feed* (your posts, likes, comments), *Create*
(guided post flow), *Analytics* (followers over time, best content, audience mix),
*Inbox* (DMs: brand offers, fans, haters, journalists as decisions), *Trending*,
*Deals*, *Team*, *Career* (creator/entertainment ladders). Fame stat and image show in
Profile; a red-carpet style summary on Game Over.

## Build order (each ships and is playable)

1. **v2.9 Creator**: fame/image/privacy stats, the five platforms, content plan, posting
   engine, followers, monetisation, brand deals, comments, Social hub, ~60 events.
2. **v2.10 Stardom**: actor, musician, model, presenter, talent shows, agents and teams,
   awards, the NPC celebrity world and Trending.
3. **v2.11 Scandal & Celebrity Life**: paparazzi, privacy, PR crisis chains, trolls,
   money traps, red carpets, famous romance, decay and comebacks, legacy hooks.
4. **v2.12 Pro Sports** (optional 5th): leagues, seasons, contracts, endorsements.
