# POTUS COMBAT

A browser fighting-game prototype with a 16-bit arcade presentation, seven presidential fighters, animated stages, keyboard combat, and a CPU opponent.

## Play

Serve the repository from a local web server, then open it in a browser. For example:

```sh
python3 -m http.server 8000
```

Then visit <http://localhost:8000>. Serving the files over HTTP allows the intro music and other fetched assets to load consistently.

Controls:

- `WASD` move and navigate menus
- Double-tap `A` or `D` to backdash or dash forward
- `J` punch
- `K` kick
- `I` character signature move
- `L` special
- `Space` block
- `Enter` confirm or start
- `Escape` go back in the selection menus
- `Escape` or `P` pause/resume during a match and show the command guide
- `R` reset fighter positions
- `Shift+R` restart the match
- `C` toggle the CPU opponent
- `V` cycle CPU difficulty
- `M` switch between Versus and Practice on the location screen

CPU difficulty can also be selected on the location screen. Easy reacts more slowly and makes more mistakes; Normal is the default; Hard reacts faster, blocks more often, and uses longer combos.

Practice mode can also be selected on the location screen. It starts with the CPU dummy off, uses an infinite clock, prevents knockouts, and automatically restores health and guard after a short delay. Press `C` during practice to activate the CPU dummy, or `R` to reset positions and refill both fighters.

Combat now distinguishes standing, low, and overhead attacks. Crouch to block low attacks, stand to block overheads, and use close-range grapples to beat either guard. Landed punches and crouching punches can cancel into heavier normals, signatures, or specials; landed kicks can cancel into signatures or specials.

Attack, signature, and special inputs are buffered briefly, so a command entered just before recovery or a legal cancel window will still execute. The combo counter only continues while the defender remains in hitstun.

Impact callouts distinguish blocks, counter-hits, and recovery punishes. Signature and special hits use character-colored feedback and identify the move at the point of contact.

Every fighter has character-tuned forward-dash and backdash speed, duration, and recovery. Buffered attacks can cancel a movement dash into offense.

Blocking drains the green guard meter below the blue energy meter. Guard strength and recovery vary by fighter; an empty meter causes a guard break and a longer vulnerable stun. The CPU retreats more and blocks less confidently when its guard is low.

The pause screen freezes combat and shows both fighters’ archetypes, signatures, specials, guard values, and core controls. Switching away from the game tab automatically pauses the match.

Fighter styles and signatures:

- Washington: balanced counter-fighter — `I` Founder's Lunge
- Lincoln: anti-air zoner — `I` Stovepipe Throw
- T. Roosevelt: aggressive rushdown — `I` Big Stick overhead
- Kennedy: mobile space-controller — `I` PT-109 Sweep low
- Obama: technical pressure — `I` Mic Drop overhead
- Grant: heavy grappler — `I` Unconditional Surrender throw
- Trump: close-range trickster — `I` Deal Breaker throw

Each fighter also has distinct fictional arcade entrance and victory lines. These callouts appear during the existing round and result timing, so they add character identity without delaying control or rematches.

Developer controls:

- `H` toggle collision boxes
- `G` toggle sprite-tuning mode
- `1` / `2` choose the fighter to tune
- `[` / `]` cycle tuning frames

## Assets

The game uses bitmap stages, character-select art, sprite sheets, individual animation cells, and a public-domain MIDI arrangement stored in `assets/`.
