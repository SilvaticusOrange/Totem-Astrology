/**
 * Element-specific closing paragraphs for calculator animal modals.
 *
 * Each entry is appended after the main animal lore when someone clicks a card
 * (e.g. Yang Fire Squirrel / Sun Squirrel shows the Fire Squirrel paragraph at the bottom).
 *
 * Keys: `${element}-${animal}` in lowercase — fire-squirrel, water-bear, metal-tiger, etc.
 * Twelve animals × five elements = 60 entries when complete.
 *
 * Each entry:
 *   title?: string     — optional poetic override when it differs from the stem name (e.g. custom epithet)
 *   paragraph: string   — one paragraph on how that element colors this animal
 *
 * Tip: write how this element distinguishes the animal from the other four elemental
 * versions — not a repeat of the general animal entry above.
 * Use "downside" for hazards (not "shadow" — that term is reserved for Shadow relationships).
 *
 * Water modal titles: Yin animals (Buffalo, Cat, Snake, Deer, Phoenix, Bear) → Rain;
 * Yang animals (Squirrel, Tiger, Dragon, Horse, Monkey, Wolf) → Sea.
 */

import { ANIMAL_POLARITY } from './totem-manifest.js';

export const ELEMENT_ANIMAL_LORE = {
  'water-squirrel': {
    paragraph:
      'When Water flows through the Squirrel, its quick mind turns inward before it acts. The Sea Squirrel gathers information the way a watershed collects rain — from every direction at once, down into one channel. Social nuance is felt deeply here; this Squirrel reads the colony with emotional precision and may hold back longer than other Squirrels would, waiting until the path of least resistance becomes clear. Indecision can deepen into quiet overwhelm when too many currents pull at once. Yet this is also the Squirrel most likely to sense what is unsaid, to find the hidden cache others miss, and to adapt rather than force. Give the Sea Squirrel time to settle, and its intelligence becomes fluid, patient, and surprisingly hard to outmaneuver.',
  },

  'wood-squirrel': {
    paragraph:
      'When Wood grows through the Squirrel, its mind branches outward in every direction at once. The Wood Squirrel does not merely notice options — it propagates them, connecting people, ideas, and possibilities into an expanding network of maybes. This is the Squirrel most energized by growth itself: new contacts, new angles, new branches opening while older routes are still being evaluated. The downside is familiar Squirrel paralysis multiplied by abundance — too many shoots reaching for the sun, not enough caches chosen yet. Still, few animals match this one for spotting where momentum is building and inserting themselves at the hinge point. Anchor the Wood Squirrel with one clear commitment at a time, and its network sense becomes fertile rather than scattered.',
  },

  'fire-squirrel': {
    paragraph:
      'When Fire moves through the Squirrel, its restless vigilance becomes illumination rather than mere calculation. The Fire Squirrel does not only map the territorial terrain — it wants to be seen at the leading edge of what is happening, to spark momentum that others pick up and carry. Where a Sea Squirrel may soak in every signal before acting, the Fire Squirrel moves sooner, trusting that speed and visibility will sort out what analysis alone could not. The heat is genuine: they rally the colony, name the urgent possibility, and often get there first. The downside is flame applied to an already busy mind — spreading too fast, burning through options without landing, or mistaking the thrill of being first up the tree for having chosen the right tree. Cool them with patience, give them a cause worth their heat, and the Fire Squirrel becomes the scout who not only finds the prize but makes everyone else believe the hunt was worth starting.',
  },

  'earth-squirrel': {
    paragraph:
      'When Earth settles through the Squirrel, its quick mind is asked to find solid ground. The Earth Squirrel still watches everything, still maps the social terrain — but it increasingly cares which structures last, which alliances endure, and which reputations are built on something real. This is the Squirrel most willing to commit to a path once evidence has accumulated, trading a little spontaneity for reliability others can lean on. Restlessness does not vanish; it turns toward building — securing position, fortifying caches, making sure today\u2019s clever move still makes sense next season. Its downside is stubborn caution dressed up as wisdom, or prestige pursued through weight rather than brilliance. Honor the Earth Squirrel\u2019s need for substance, and its positioning becomes trustworthy — less flashy than the Fire Squirrel, but far harder to dislodge once established.',
  },

  'metal-squirrel': {
    paragraph:
      'When Metal refines the Squirrel, its intelligence sharpens to a point. The Metal Squirrel cuts through noise — less interested in every possibility than in the one worth keeping, the answer that actually holds, the alliance that earns its place. Where other Squirrels may luxuriate in options, this one increasingly asks: which choice is precise, defensible, and clean? Social insight becomes editorial; they notice what is sloppy, what is performative, what fails to meet standard. That can make them seem cooler or more critical than their companions expect, yet the gift is clarity — the opening found not for sport but because error genuinely bothers them. The downside, paired with Squirrel indecision, is harsh self-judgment or perfectionism that freezes action entirely. Give the Metal Squirrel a standard worth honing, and they become the zodiac\u2019s most incisive strategist — discerning, exacting, and unwilling to pretend a weak plan is clever.',
  },

  'water-buffalo': {
    paragraph:
      'When Water flows through the Buffalo, loyalty runs deep rather than merely long. The Rain Buffalo feels obligation as an emotional current — not just the duty to endure, but the need to understand what a commitment truly costs before signing on. Where a Metal Buffalo might sharpen rules to a fine edge, this one absorbs the mood of the group, the unspoken needs beneath the task, the slow erosion that patience alone cannot always see. They still build for the long haul, but their building is nourished by empathy for who will live inside the structure. The downside is carrying everyone\u2019s weight until the rain overflows — silent resentment, exhaustion mistaken for virtue, or loyalty that becomes a trap because leaving feels like betrayal of the whole watershed. Give the Rain Buffalo room to name what they feel, and their steadfastness becomes not only reliable but genuinely healing.',
  },

  'wood-buffalo': {
    paragraph:
      'When Wood grows through the Buffalo, patience acquires direction. The Wood Buffalo still prefers the tried and tested, but it is willing to extend — to add a wing, a partnership, a new branch of the enterprise once the root system is secure. This is the Buffalo most oriented toward organic growth: not flashy leaps, but steady expansion of what already works. They connect people and resources the way roots connect soil, drawing nourishment from many directions into one living structure. The downside is overgrowth without pruning — obligations multiplied, loyalties stretched thin across too many shoots, or resistance to cutting back what no longer serves because every branch once meant something. Focus the Wood Buffalo on one expansion at a time, and they become the zodiac\u2019s most trustworthy cultivator of lasting prosperity.',
  },

  'fire-buffalo': {
    paragraph:
      'When Fire moves through the Buffalo, the freight train can surprise you with heat. The Fire Buffalo is still slow to start and nearly impossible to stop once moving — but what moves them is not only duty but conviction, a heated sense that this cause, this family, this work must be defended now. They transform patience into protective force, turning the Buffalo\u2019s endurance into something that can warm a room or burn a bridge that threatened what they guard. Where an Earth Buffalo settles, the Fire Buffalo ignites — briefly, powerfully, and with full commitment. The downside is stubbornness fused with outrage — the grudge that smolders, the refusal to bend even when the situation has changed, or loyalty expressed as scorched earth. Channel that heat toward a cause worth the long burn, and the Fire Buffalo becomes an immovable ally when the stakes are real.',
  },

  'earth-buffalo': {
    paragraph:
      'When Earth settles through the Buffalo, steadfastness becomes its purest form. The Earth Buffalo is the zodiac\u2019s great weight-bearer — not hurried, not flashy, deeply convinced that food on the table and promises kept are the foundation everything else must rest upon. They accumulate responsibility the way soil accumulates layers: slowly, visibly, with gravity that others can lean against. Restlessness barely registers here; progress is measured in seasons, not headlines. The downside is rigidity mistaken for wisdom — the refusal to adapt when the ground itself has shifted, or the grudge held so long it becomes part of the landscape. Honor the Earth Buffalo\u2019s need for proof and time, and they will outlast almost any storm without abandoning what they have sworn to protect.',
  },

  'metal-buffalo': {
    paragraph:
      'When Metal refines the Buffalo, duty acquires edge. The Metal Buffalo is the most exacting of its kind — less tolerant of slack, excuse, or the sentimental prolonging of what ought to end. They believe loyalty must be earned repeatedly, that standards exist for a reason, and that the group survives only when everyone pulls true weight. Their conservatism is not merely traditional; it is editorial, cutting away what fails inspection. The downside is hardness where compassion was needed — the grudge polished to a blade, the partner or child measured against an ideal no mortal could meet, or the freight train that cannot slow for anyone left on the tracks. Give the Metal Buffalo a standard worth enforcing and companions who meet it honestly, and they become the zodiac\u2019s most incorruptible guardian of what actually works.',
  },

  'water-tiger': {
    paragraph:
      'When Water flows through the Tiger, idealism turns inward before it leaps. The Water Tiger feels the wrongness of a situation in the body first — a tide of conviction that rises quietly, then breaks with surprising force when the moment finally arrives. They are less performative than other Tigers, less eager to broadcast every outrage, yet their empathy runs wide: they can absorb the disappointment of many and carry it as personal mission. Where a Fire Tiger blazes openly, the Water Tiger channels heat into depth — fighting for ideals that touch the heart, not only the podium. The downside is emotional flooding — feeling so much that action scatters, or retreat into wounded silence mistaken for indifference. Give the Water Tiger an ideal that nourishes rather than only burns, and their passion becomes sustaining as well as fierce.',
  },

  'wood-tiger': {
    paragraph:
      'When Wood grows through the Tiger, conviction branches outward. The Wood Tiger does not merely believe — they propagate, recruiting, expanding, connecting one cause to the next until a whole forest of purpose stands behind them. Their egalitarian warmth spreads easily; people feel invited into something larger than themselves when this Tiger speaks. They leap not only for the thrill but to clear space for new growth, trusting that something better can take root after the old brush is burned away. The downside is spreading too fast — ideals multiplied until none are fully tended, or bold leaps that open many paths and commit to none. Anchor the Wood Tiger to one banner at a time, and they become the zodiac\u2019s most inspiring cultivator of shared possibility.',
  },

  'fire-tiger': {
    paragraph:
      'When Fire moves through the Tiger, the zodiac\u2019s heating element finds its natural home. The Fire Tiger is Conviction Incarnate — ideals felt at full volume, bold leaps taken well before the others in the room have finished with their arguing, an aliveness so vivid that others often step closer without even knowing why. They transform outrage into momentum and admiration into forward movement, clearing out the underbrush with confidence that sunlight will soon follow to illuminate. Where a Metal Tiger cuts precisely, the Fire Tiger consumes all and renews with a ravenous energy. Their downside is that they can be like a forest fire — burning bridges that were still needed, mistaking self-righteous intensity for true righteousness, or bouncing onwards to the next blazing inferno before the lesson has been learned properly from the last one. Give the Fire Tiger a cause large enough for their heat, and they become impossible to ignore and difficult not to follow.',
  },

  'earth-tiger': {
    paragraph:
      'When Earth settles through the Tiger, idealism learns to endure. The Earth Tiger still runs hot, still cares fiercely about how things ought to be — but they increasingly measure victory by what lasts. They want ideals that can survive contact with ordinary life: the institution reformed, the community protected, the promise kept after the speech is forgotten. Their leaps become fewer and heavier, each one landing with the weight of someone who intends to stay. The downside is pride fused with stubbornness — the ideal that becomes immovable dogma, or the Tiger who will not bend because bending feels like betraying the mountain they stand on. Give the Earth Tiger something worth building rather than only fighting for, and their passion becomes legacy.',
  },

  'metal-tiger': {
    paragraph:
      'When Metal refines the Tiger, ideals sharpen to a blade. The Metal Tiger cuts through pretense with unnerving speed — less interested in the warmth of the crowd than in whether the principle is true, defensible, and cleanly applied. Their egalitarian streak remains, but it is exacting: everyone held to the same sharp standard, including themselves. They bounce back from error faster than most, yet they remember every flaw in the argument that misled them. The downside is righteousness without mercy — the ideal wielded like a sword against allies who fell short, or the leap taken to punish rather than to renew. Give the Metal Tiger a standard worth honing and opponents worthy of respect, and they become the zodiac\u2019s most formidable champion of what ought to be.',
  },

  'water-cat': {
    paragraph:
      'When Water flows through the Cat, instinct becomes emotional artistry. The Water Cat reads atmosphere the way rain reads terrain — seeping into every crack, sensing what others miss, adjusting with fluid grace rather than force. Their humor softens; their withdrawal deepens; their charm carries an undertow of genuine feeling that surprises those who mistook lightness for absence of depth. They preserve harmony not only by deflecting conflict but by absorbing it, often quietly, until the room can breathe again. The downside is drowning in moods that are not all theirs — taking on the group\u2019s discord until balance costs too much, or vanishing so completely that connection itself feels impossible to restore. Honor the Water Cat\u2019s need for solitude after soaking up the room, and their tenderness becomes one of the zodiac\u2019s quietest gifts.',
  },

  'wood-cat': {
    paragraph:
      'When Wood grows through the Cat, charm acquires reach. The Wood Cat climbs — socially, creatively, opportunistically — wrapping itself around whatever structure offers light and vantage. They connect people who would never otherwise meet, tendrils of introduction and suggestion extending outward while the Cat itself remains elegantly hard to pin down. Their playfulness becomes generative; jokes open doors, moods shift toward possibility, and the room feels larger than it did an hour ago. The downside is attachment without roots — charming every branch while committing to none, or using adaptability to avoid the one conversation that would require staying put. Give the Wood Cat space to roam and one anchor worth returning to, and their gift for harmony becomes fertile rather than evasive.',
  },

  'fire-cat': {
    paragraph:
      'When Fire moves through the Cat, charm burns alight. The Fire Cat does not merely adjust the mood — they ignite it, arriving with sparkle, wit, and a warmth that draws eyes even when they pretend not to notice. Their timing remains impeccable, but now it serves visibility as well as peace: the quip that saves the evening, the flirtation that revives a dying gathering, the sudden generosity that makes everyone feel included. Where a Water Cat absorbs, the Fire Cat radiates. The downside is performing warmth without feeding it — burnout disguised as brilliance, or charm turned up so high that authenticity slips off the windowsill entirely. Let the Fire Cat rest between performances, and they become the zodiac\u2019s most dazzling restorer of joy.',
  },

  'earth-cat': {
    paragraph:
      'When Earth settles through the Cat, independence acquires a home. The Earth Cat still needs autonomy, still reads the room with instinctive finesse — but they increasingly care about the den itself: the routines, the trusted few, the atmosphere that must be kept livable day after day. Their peacekeeping becomes territorial in the gentlest sense — this couch, this kitchen, this circle of people worth protecting from unnecessary storms. They withdraw less from the world than into a chosen one they help maintain. The downside is comfort mistaken for harmony — avoiding the hard talk until resentment settles like dust, or clinging to a stale peace because change feels like loss of ground. Honor the Earth Cat\u2019s need for a sanctuary, and their devotion to atmosphere becomes deeply reliable.',
  },

  'metal-cat': {
    paragraph:
      'When Metal refines the Cat, instinct acquires edge. The Metal Cat notices sloppiness — in manners, in motive, in the half-truth told too smoothly. Their glance can cut; their standards for who may disturb their peace are higher and clearer than other Cats would admit. They still prefer nuance to confrontation, but when pushed they deliver precision rather than chaos: the exact word, the cool boundary, the withdrawal that feels final. The downside is contempt dressed as taste — loneliness chosen because no one meets the standard, or charm weaponized to exclude rather than to welcome. Give the Metal Cat beauty worth curating and companions who respect boundaries without flinching, and their discernment becomes a rare and loyal form of care.',
  },

  'water-dragon': {
    paragraph:
      'When Water flows through the Dragon, authority runs deep. The Water Dragon guards standards from beneath the surface — less interested in dominating the room than in ensuring that what is precious does not erode quietly. They sense disorder early: the compromise that will rot the foundation, the disrespect that will spread if unaddressed. Their excellence is felt as water pressure rather than showering spectacle, an undercurrent that pulls everything towards that higher level without always explaining why first. The downside is brooding guardianship — they can nurse wounded dignity in silence until the reprisal surprises everyone, or hold standards hidden so inwardly that no one knows how to please them. Give the Water Dragon a domain worth protecting and allies who listen to the truth behind their rhetoric, and their power becomes wonderfully longlasting and hard to corrupt. A Sea Dragon whose emotions shine purely and whose intuition always rings true!',
  },

  'wood-dragon': {
    paragraph:
      'When Wood grows through the Dragon, excellence expands. The Wood Dragon builds empires — not always of land or title, but of influence, patronage, and standards that branch into every project they touch. They see potential the way a forest sees light: everywhere, if only the right growth is encouraged and the wrong growth pruned. Their authority feels generative; people rise because the Dragon invested in what could become excellent. The downside is overreach — too many protégés, too many domains to guard, or standards enforced so widely that nothing receives the full heat of their attention. Focus the Wood Dragon on one canopy at a time, and they become the zodiac\u2019s most magnanimous architect of shared greatness.',
  },

  'fire-dragon': {
    paragraph:
      'When Fire moves through the Dragon, authority blazes. The Fire Dragon is visible power — standards proclaimed, excellence demanded, mediocrity scorched without apology. They transform whatever they guard, clearing dead wood so what remains can shine, and they expect the world to notice. Loss of face burns them literally; restoration of dignity may require a public act as fierce as the original wound. The downside is tyranny dressed as quality — the template enforced through fear, or pride that consumes allies who merely stumbled. Give the Fire Dragon a kingdom worth the heat and critics brave enough to speak truth, and they become the zodiac\u2019s most radiant patron of what ought to be honored.',
  },

  'earth-dragon': {
    paragraph:
      'When Earth settles through the Dragon, excellence becomes immovable. The Earth Dragon guards templates the way a mountain guards its slopes — patiently, massively, with the implicit message that some things will not shift on a whim. Their authority is gravitational rather than flashy; people comply because the standard feels as old and real as stone. They build institutions meant to outlast personalities, including their own. The downside is inflexibility sanctified — the rule kept after the reason died, or dignity defended long past the point where grace could have settled the matter. Give the Earth Dragon structures worth enduring and humility strong enough to revise them, and their protection becomes a gift to generations.',
  },

  'metal-dragon': {
    paragraph:
      'When Metal refines the Dragon, standards become surgical. The Metal Dragon sees the flaw instantly — in craft, in character, in the argument that almost holds. They cut away what fails inspection with less heat than the Fire Dragon but more finality, leaving clean edges where ambiguity used to hide. Their authority is crystalline: precise, visible, and unapologetic about what will not pass. The downside is cruelty mistaken for clarity — the ally discarded for one imperfection, or excellence pursued until the living thing behind it is forgotten. Give the Metal Dragon a standard worth perfecting and people thick-skinned enough to grow from the blade, and they become the zodiac\u2019s most uncompromising keeper of what deserves to last.',
  },

  'water-snake': {
    paragraph:
      'When Water flows through the Snake, watching is married with feeling. The Water Snake reads a room through sensation first \u2014 the shift in one\u2019s breath, the temperature of trust, the undercurrents running beneath polite speech. Their stillness is not empty but rather absorptive, gathering depth the way a pool gathers rain. They bond with fewer people than most, yet those bonds run all the way to the bottom, loyal in ways that do not require constant display. Honor the Water Snake\u2019s pace and privacy, and their deep loyalty becomes one of the zodiac\u2019s most profound and least advertised gifts.',
  },

  'wood-snake': {
    paragraph:
      'When Wood grows through the Snake, adaptation becomes strategy. The Wood Snake sheds skins with purpose — repositioning, reconnecting, finding the next hold before the old one fails. Their intelligence branches outward while the surface remains calm, weaving alliances and contingencies the way vines weave a trellis. They survive by growing toward opportunity without announcing the direction. The downside is rootlessness — flexibility that becomes evasion, or loyalty that shifts because every branch offers a new escape from discomfort. Anchor the Wood Snake with one bond worth keeping through the shed, and their wisdom becomes flexible without being faithless.',
  },

  'fire-snake': {
    paragraph:
      'When Fire moves through the Snake, stillness can strike. The Fire Snake is rarer in display than other Snakes, which makes the moment of revelation more startling — the coiled patience suddenly ignited, the truth spoken with heat that clears the room. They transform through confrontation when pushed too far, burning away pretense to expose what they have known privately for a long time. The downside is the delayed blaze — resentment nursed in silence until the strike scorches more than intended, or transformation pursued as revenge rather than renewal. Give the Fire Snake honesty early and space before the coil tightens, and their intensity becomes clarifying rather than destructive.',
  },

  'earth-snake': {
    paragraph:
      'When Earth settles through the Snake, patience becomes monumental. The Earth Snake can wait longer than almost any animal — not from passivity, but from the conviction that time itself is an ally. They build safety slowly, choose loyalties carefully, and hold ground once it has been earned. Their body wisdom favors endurance over drama; they know which battles require stillness and which require a single, well-timed move. The downside is grudge as geology — wrongs compressed into bedrock, forgiveness delayed until the weight crushes something still living. Give the Earth Snake security worth keeping and truth delivered without theatrics, and their loyalty becomes as steady as land itself.',
  },

  'metal-snake': {
    paragraph:
      'When Metal refines the Snake, perception becomes a blade. The Metal Snake detects the lie in the gesture, the weakness in the alliance, the moment when stillness should end and strike should begin. Their standards for who enters the inner circle are exacting; their memory for betrayal is precise. They shed what fails inspection with less emotion than the Water Snake and more finality than the Wood Snake. The downside is isolation through judgment — the trusted few reduced to none, or the strike delivered to teach a lesson that could have been spoken. Give the Metal Snake truth worth guarding and companions who mean what they say, and they become the zodiac\u2019s most incisive protector of what must not be profaned.',
  },

  'water-horse': {
    paragraph:
      'When Water flows through the Horse, longing becomes tidal. The Water Horse is pulled by feeling as much as by horizon — toward the person, the place, the possibility that stirs something deep and hard to name. Their passion absorbs; their enthusiasm can soften into melancholy when the run ends and the shore feels lonely. They need freedom still, but it is freedom to follow the current of the heart, not only the open field. The downside is emotional restlessness — chasing what soothes rather than what sustains, or bolting from intimacy the moment it asks them to stay still. Give the Water Horse a longing worth pursuing and room to return, and their passion becomes tender as well as wild.',
  },

  'wood-horse': {
    paragraph:
      'When Wood grows through the Horse, freedom branches in every direction. The Wood Horse sees multiple horizons at once — new paths opening up while their hooves are still clopping down the old one, possibilities multiplying faster than their arrival can satisfy them. Their enthusiasm spreads contagiously; they awaken appetites in others for growth, travel, and the next fertile field. They run best when the journey itself keeps sprouting new options. The downside is the endless gallop — commitments left behind at every fork, or boredom the moment any single path demands depth over novelty. Give the Wood Horse two or three trails worth riding at once and companions who can keep pace, and they become the zodiac\u2019s most exhilarating opener of doors.',
  },

  'fire-horse': {
    paragraph:
      'When Fire moves through the Horse, the charge becomes incandescent. The Fire Horse does not merely run — they blaze, drawing others into a heat of admiration, adventure, and appetite for life that feels almost unbearable when it ends. Their passion ignites quickly and fully; the ecstasy of the run is visible on their skin. Where a Water Horse flows, the Fire Horse explodes outward, clearing stale air with pure momentum. The downside is burnout masquerading as freedom — the next horizon seized before the last one was understood, or passion that consumes the very people who tried to run beside them. Give the Fire Horse a quest worthy of their heat, and they become impossible to forget.',
  },

  'earth-horse': {
    paragraph:
      'When Earth settles through the Horse, restlessness meets weight. The Earth Horse still longs — still needs room to move — but they increasingly measure freedom by what it builds rather than only what it escapes. They may circle the same territory longer than other Horses would, learning its contours, investing in a home base from which future runs still depart. Their passion gains endurance; their rebellion becomes choosier. The downside is feeling trapped between two natures — the Buffalo\u2019s gravity they dread and the open field they cannot fully abandon — until resentment buckles into either flight or stubborn stillness. Give the Earth Horse a horizon that includes a place worth returning to, and their motion becomes purposeful rather than merely escape.',
  },

  'metal-horse': {
    paragraph:
      'When Metal refines the Horse, speed acquires focus. The Metal Horse runs toward a target — not every shimmer on the plain, but the one worth the sprint, cut cleanly from the noise of lesser distractions. Their passion is disciplined; their admiration goes to excellence, courage, and the companion who keeps promises when the trail turns ugly. They bolt less from confinement than from mediocrity. The downside is harsh judgment at full gallop — allies left behind for falling short once, or freedom pursued so narrowly that joy itself feels insufficient. Give the Metal Horse a standard worth riding towards and peers who challenge it without clipping their wings, and they become the zodiac\u2019s most focused awakener of dormant appetites for greatness — a true Unicorn, or even a Pegasus!',
  },

  'water-deer': {
    paragraph:
      'When Water flows through the Deer, sensitivity becomes a current. The Rain Deer feels the room the way rain feels the moon — subtly, continuously, with ripples that arrive long before words explain them. They absorb discord gently and often silently, offering presence rather than instruction, healing through attunement rather than command. Their withdrawal is not rejection but recalibration, a return to the quiet bank where feeling can sort itself out. The downside is overload — carrying harmonies that were never theirs to fix, or fleeing so far inward that even gentle reach cannot find them. Protect the Rain Deer\u2019s stillness, and their empathy becomes one of the zodiac\u2019s most restorative forces.',
  },

  'wood-deer': {
    paragraph:
      'When Wood grows through the Deer, gentleness acquires direction. The Wood Deer still startles easily, still prefers peace — but they grow toward light when safety allows, extending tenderness into new connections, creative projects, or causes that need a soft hand. Their sensitivity branches outward rather than only retreating inward, noticing who is left out and quietly making room. The downside is fragility spread too thin — too many wounds noticed, too little ground to stand on when the wind rises. Root the Wood Deer in one sanctuary strong enough to return to, and their grace becomes generative rather than only reactive.',
  },

  'fire-deer': {
    paragraph:
      'When Fire moves through the Deer, sensitivity is lit aflame! The Fire Deer is a rare combination — attuned so tightly that they feel everything, idealistic enough to believe it can be changed, and brave enough to step forward when others would shirk from the task. Their gentleness does not disappear; rather it illuminates, warming rooms that have grown cold without naming anyone just why. They may surprise you with sudden conviction after long stillness. Their downside is feeling burned by the very ideals they stepped into the open to serve — overwhelm followed by flight, or the sense that peace and passion cannot coexist. Give the Fire Deer causes personal enough to heal and grand enough to matter to the world, and their tenderness becomes a luminous candlelight guiding the faithful home.',
  },

  'earth-deer': {
    paragraph:
      'When Earth settles through the Deer, sensitivity finds ground. The Earth Deer creates havens — not loudly, not through command, but through the patient work of making a place feel safe enough to breathe. They notice what disturbs the peace and address it with presence rather than drama, holding space the way valley soil holds rain. Their stubbornness, often hidden, emerges in defense of calm itself. The downside is peace pursued at any cost — swallowing truth to keep the meadow quiet, or refusing necessary change because disruption feels like violence against the soul. Honor the Earth Deer\u2019s need for sanctuary, and their stillness becomes a gift others build their lives around.',
  },

  'metal-deer': {
    paragraph:
      'When Metal refines the Deer, sensitivity acquires boundary. The Metal Deer feels everything — and learns, more sharply than other Deer, where feeling must end and protection begin. They discern who disturbs their peace with precision, offering gentleness freely to those who earn it and cool distance to those who do not. Their grace is selective, which can look like coldness until you understand the cost of their openness. The downside is isolation mistaken for wisdom — cutting away too much until the meadow feels empty, or holding grudges in silence because confrontation feels too harsh. Give the Metal Deer respect without demand, and their tenderness becomes a rare and deliberate blessing.',
  },

  'water-monkey': {
    paragraph:
      'When Water flows through the Monkey, wit runs intuitive. The Water Monkey reads patterns beneath patterns — the joke that reveals the fear, the strategy hidden inside a shrug, the emotional undercurrents driving the whole game. Their intelligence is less showy than the Fire Monkey\u2019s but often more accurate, adapting mid-conversation the way water adapts mid-stream. They play to understand, not only to win. The downside is indirectness that becomes manipulation — information hoarded like depth, or charm used to steer others without ever declaring intent. Give the Water Monkey puzzles worth solving openly, and their cleverness becomes insight others can trust.',
  },

  'wood-monkey': {
    paragraph:
      'When Wood grows through the Monkey, schemes multiply. The Wood Monkey juggles plots, projects, and social openings the way a forest juggles branches — prolifically, opportunistically, with delight in complexity itself. They are at their best with three balls in the air and a fourth being considered. Boredom remains poison, but here it is cured by proliferation rather than a single grand game. The downside is sprawl — half-finished intrigues, jokes that seed real confusion, or allies left untended while the next branch grabs attention. Feed the Wood Monkey varied problems linked to one worthy outcome, and they become the zodiac\u2019s most creatively prolific fixer.',
  },

  'fire-monkey': {
    paragraph:
      'When Fire moves through the Monkey, cleverness becomes performance. The Fire Monkey wants you to see the brilliance — the quip that wins the room, the maneuver executed in plain sight because confidence makes the game more fun. Their humor warms; their strategy dazzles; even their rivals sometimes applaud before realizing they have lost. The downside is burning out the audience — wit turned up until sincerity is suspect, or games played for applause rather than outcome. Give the Fire Monkey a stage worth the heat and stakes worth the wit, and they become irresistible as ally and formidable as opponent.',
  },

  'earth-monkey': {
    paragraph:
      'When Earth settles through the Monkey, games acquire consequence. The Earth Monkey still loves the puzzle, still thinks in patterns — but they increasingly want the outcome to last, to build something that remains after the laughter fades. Their strategy serves structure: the fix that holds, the alliance that survives the joke, the plan that still makes sense next season. The downside is restlessness trapped in responsibility — mischief leaking out as sabotage of the very stability they helped create, or boredom erupting because the long game feels too slow. Give the Earth Monkey problems where cleverness and durability both matter, and their genius becomes surprisingly dependable.',
  },

  'metal-monkey': {
    paragraph:
      'When Metal refines the Monkey, wit becomes a precision instrument. The Metal Monkey cuts to the winning move — less interested in the social theater around the game than in the clean outcome. Their jokes can sting because they are accurate; their strategies succeed because they discard everything irrelevant. They prefer being right over being liked, though they still enjoy the game immensely. The downside is cruelty sharpened by intelligence — the comment that ends a friendship because it was true, or boredom solved by dismantling what others needed intact. Give the Metal Monkey worthy rivals and problems where elegance matters, and they become the zodiac\u2019s most brilliantly economical mind.',
  },

  'water-phoenix': {
    paragraph:
      'When Water flows through the Phoenix, display becomes nourishment. The Water Phoenix hosts with emotional intelligence — sensing who feels unseen, who needs the welcome softened, who requires beauty without being put on the spot. Their presentation is less proclamation than invitation, a table set so that safety arrives before pride. They still want to be appreciated, but they notice whether the room actually feels held. The downside is hurt absorbed silently — generosity met with indifference and nursed into cold withdrawal, or standards enforced through mood rather than speech until no one knows what went wrong. Give the Water Phoenix guests who feel as deeply as they present, and their hospitality becomes genuinely healing.',
  },

  'wood-phoenix': {
    paragraph:
      'When Wood grows through the Phoenix, hospitality branches outward. The Wood Phoenix expands the guest list, the occasion, the vision of what abundance could include — always growing the celebration, connecting one gathering to the next, planting seeds for future festivity. Their taste spreads; their standards multiply into new domains of adornment and welcome. The downside is display without center — so many branches of performance that the heart of the table goes cold, or pride wounded in one arena spreading resentment across all of them. Focus the Wood Phoenix on one gathering worth cultivating fully, and their radiance becomes generous rather than scattered.',
  },

  'fire-phoenix': {
    paragraph:
      'When Fire moves through the Phoenix, presentation is illuminated and becomes a transformative firebrand. The Fire Phoenix is the zodiac\u2019s great luminary of occasion — bold, visible, unforgettable, convinced that life ought to shine and skilled at making it shine for everyone in range. They transform a room by entering it, setting standards alight rather than merely displaying them. Dismiss their effort and you will meet heat; honor it and you will feel genuinely crowned. The downside is pride that consumes the very hospitality it claims to offer — the host who makes the evening about their wound, or standards so blazing that guests feel scorched rather than welcomed. Give the Fire Phoenix an audience worth their radiance, and they become magnificence with a heartbeat.',
  },

  'earth-phoenix': {
    paragraph:
      'When Earth settles through the Phoenix, abundance becomes foundation. The Earth Phoenix builds traditions — meals repeated until they mean something, spaces adorned until they feel ancestral, hospitality so reliable that people plan their lives around it. Their display serves stability: the promise that beauty and security can coexist. They take pride in what endures after the guests depart. The downside is rigidity around ritual — the rule that outlives joy, or offense taken when someone treats the sacred table casually because they did not know the cost of maintaining it. Honor what the Earth Phoenix has built, and their generosity becomes the zodiac\u2019s most trustworthy celebration of enough.',
  },

  'metal-phoenix': {
    paragraph:
      'When Metal refines the Phoenix, taste becomes exacting. The Metal Phoenix curates — every detail inspected, every flaw in the presentation noted, every guest implicitly measured against a standard of dignity and reciprocity. Their beauty is precise, their hospitality conditional on respect, their pride quick to defend what was crafted with care. The downside is exclusion dressed as excellence — the guest who was wrong once and never forgiven, or display that shames rather than welcomes. Give the Metal Phoenix collaborators who share their eye and speak honestly without mockery, and their hospitality becomes refinement others aspire to rather than fear.',
  },

  'water-wolf': {
    paragraph:
      'When Water flows through the Wolf, loyalty runs emotional and deep. The Water Wolf bonds to the pack through feeling — the shared cold survived, the trust that needs no speech, the ideal held quietly in the chest rather than shouted from the ridge. Their strategy serves connection; their caution protects tenderness as well as territory. They remember who stayed when the season turned harsh, and they love with a depth that outlasts theatrics. The downside is wounded withdrawal — the pack member who feels unseen and vanishes into silence, or loyalty that becomes drowning because boundaries were never allowed. Give the Water Wolf truth spoken gently and trials shared honestly, and their faithfulness becomes one of the zodiac\u2019s most moving promises.',
  },

  'wood-wolf': {
    paragraph:
      'When Wood grows through the Wolf, the pack expands. The Wood Wolf builds alliances — new members, new adventures, new branches of purpose extending from the central bond. Their loyalty is not narrower for being strategic; it spreads outward, connecting one faithful circle to the next until a whole network of belonging forms. They adventure to grow the pack, not only to escape inertia. The downside is overextension — too many bonds to honor, too many promises made on the trail, or jealousy when a branch grows closer to someone else than to the trunk. Anchor the Wood Wolf with one pack worth defending above all, and their loyalty becomes fertile rather than fragmented.',
  },

  'fire-wolf': {
    paragraph:
      'When Fire moves through the Wolf, loyalty blazes. The Fire Wolf defends the pack with visible passion — ideals proclaimed, threats met head-on, adventure pursued with heat that rekindles everyone who had gone cold. Their play is fierce; their promises burn; their idealism does not hide in the chest but shines for the group to rally around. The downside is zeal that scorches — the member exiled for one betrayal, the fight picked to prove devotion, or adventure pursued until the home den feels forgotten. Give the Fire Wolf a cause and companions worth the heat, and they become the zodiac\u2019s most inspiring defender of belonging.',
  },

  'earth-wolf': {
    paragraph:
      'When Earth settles through the Wolf, loyalty becomes architecture. The Earth Wolf builds the pack to last — traditions, obligations, the repeated work of showing up when it is not exciting anymore. Their idealism is practical; their adventure serves the long welfare of the group. They remember promises the way soil remembers seasons. The downside is duty that feels like a cage — loyalty kept from guilt rather than joy, or strategy so cautious that the wild spark the Wolf needs slowly dies. Give the Earth Wolf a purpose worth enduring boredom for and companions who play as hard as they protect, and their faithfulness becomes bedrock.',
  },

  'metal-wolf': {
    paragraph:
      'When Metal refines the Wolf, loyalty acquires edge. The Metal Wolf tests the pack — quietly, steadily, measuring who keeps word when the cost is real. Their strategy is precise; their idealism demands integrity rather than sentiment alone. They will cut away the member who betrayed the standard, not from rage but from principle. The downside is pack reduced to fortress — trust so rare that loneliness masquerades as strength, or loyalty enforced through judgment rather than invitation. Give the Metal Wolf companions who meet their standard and ideals worth the discipline, and they become the zodiac\u2019s most unbreakable keeper of the oath.',
  },

  'water-bear': {
    paragraph:
      'When Water flows through the Bear, abundance becomes emotional nourishment. The Water Bear feels what the table provides — not only food and warmth, but the safety of being held without having to perform gratitude. They create refuge through attunement, noticing who is hungry in ways the meal alone cannot fix. Their generosity absorbs need; their peace runs deep rather than merely comfortable. The downside is giving until empty — harmony purchased at the cost of the Bear\u2019s own feeling, or resentment stored like water behind a dam until the flood surprises everyone. Teach the Water Bear to receive as well as provide, and their hospitality becomes truly sustaining.',
  },

  'wood-bear': {
    paragraph:
      'When Wood grows through the Bear, abundance branches outward. The Wood Bear expands the table — more guests, more projects, more sweetness shared until the den feels like the center of a living grove. Their generosity multiplies; their peace becomes something cultivated actively, not only defended. They grow comfort the way trees grow shade, extending outward what began as a single generous impulse. The downside is overextension — too many mouths to feed, too much peace promised, or avoidance of conflict until the grove chokes on what should have been pruned. Root the Wood Bear in one hearth worth tending first, and their bounty becomes generous without becoming exhaustion.',
  },

  'fire-bear': {
    paragraph:
      'When Fire moves through the Bear, abundance catches warmth. The Fire Bear enlivens the den — not merely feeding and resting, but celebrating, defending joy with heat, making the good life feel vivid rather than merely sufficient. Their growl, when it comes, burns; their generosity radiates. They remind the pack that peace is not absence of passion but the safe place where passion can return. The downside is temper unleashed after too long a silence — the accumulated resentment exploding hotter because harmony was mistaken for suppression. Give the Fire Bear room to express displeasure early and sweetness worth protecting fiercely, and they become the zodiac\u2019s most radiant royal host.',
  },

  'earth-bear': {
    paragraph:
      'When Earth settles through the Bear, abundance becomes the world itself. The Earth Bear is the zodiac\u2019s purest hearth — slow, bountiful, ancestral in feeling, convinced that enough food, enough warmth, and enough peace are the foundation every other virtue requires. They hold Harmony not as an idea but as a place you can sit down inside. Their generosity is gravitational; their patience, seasonal. The downside is complacency — peace mistaken for absence of necessary change, or the growl delayed so long that harmony itself becomes brittle. Share the table honestly with the Earth Bear, and their refuge becomes the deepest the zodiac offers.',
  },

  'metal-bear': {
    paragraph:
      'When Metal refines the Bear, plentiful abundance acquires exacting standards. The Metal Bear knows exactly what enough looks like — and what falls short. They curate the good life with precision: the guest who respects the table, the effort that merits sweetness, the boundary that protects peace from being taken for granted. Their generosity remains real, but it is earned and measured, not endlessly offered to those who confuse kindness with license. The downside is cold judgment in the den — warmth withdrawn because someone failed an unspoken test, or peace defended so sharply that the home feels like a court rather than a refuge. Meet the Metal Bear\u2019s standards with sincerity, and their bounty becomes rare, deliberate, and deeply trustworthy.',
  },
};

export function buildElementAnimalKey(animalName, element) {
  return `${element.toLowerCase()}-${animalName.toLowerCase()}`;
}

export function lookupElementAnimalLore(animalName, element) {
  if (!animalName || !element) return null;
  return ELEMENT_ANIMAL_LORE[buildElementAnimalKey(animalName, element)] ?? null;
}

/** @returns e.g. "The Water Wolf / The Sea Wolf" or "The Water Buffalo / The Rain Buffalo" */
export function formatElementAnimalTitle(animalName, element, stemName) {
  const standard = `The ${element} ${animalName}`;
  let poetic;

  if (element === 'Water') {
    const animalPolarity = ANIMAL_POLARITY[animalName];
    poetic = animalPolarity === 'yin'
      ? `The Rain ${animalName}`
      : `The Sea ${animalName}`;
  } else {
    const lore = lookupElementAnimalLore(animalName, element);
    poetic = lore?.title ?? (stemName ? `The ${stemName} ${animalName}` : null);
  }

  if (poetic) return `${standard} / ${poetic}`;
  return standard;
}
