"use strict";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const playerSelect = document.getElementById("playerSelect");
const rivalSelect = document.getElementById("rivalSelect");
const startBtn = document.getElementById("startBtn");
const overlay = document.getElementById("overlay");
const p1Name = document.getElementById("p1Name");
const p2Name = document.getElementById("p2Name");
const p1Move = document.getElementById("p1Move");
const p2Move = document.getElementById("p2Move");

const W = canvas.width;
const H = canvas.height;
const floorY = 456;
const playerSpeed = 4.7;
const rivalAdvanceSpeed = 2.7;
const rivalRetreatSpeed = 2.5;
const jumpVelocity = -15.2;
const jumpRiseGravity = 0.72;
const jumpFallGravity = 1.05;
const walkFrameTicks = 8;
const backwalkFrameTicks = 9;
const knockdownFrameTicks = 16;
const knockdownDuration = 118;
const knockoutImpactHold = 14;
const knockoutLaunchVelocity = -12.8;
const knockoutRiseGravity = 0.48;
const knockoutFallGravity = 0.68;
const knockoutSlideSpeed = 5.1;
const knockoutSlowMoInterval = 3;
const stepMs = 1000 / 120;
const maxFrameCatchupMs = 90;
const keys = new Set();
const stageImage = new Image();
stageImage.src = "assets/presidential-stage-16bit.png";
const impactSparkSprite = new Image();
impactSparkSprite.src = "assets/impact-spark.png";
const lincolnSprite = new Image();
lincolnSprite.src = "assets/lincoln-idle-game.png";
const lincolnPunchSprite = new Image();
lincolnPunchSprite.src = "assets/lincoln-punch-game.png";
const lincolnKickSprite = new Image();
lincolnKickSprite.src = "assets/lincoln-kick-game.png";
const lincolnCrouchSprite = new Image();
lincolnCrouchSprite.src = "assets/lincoln-crouch-game.png";
const lincolnCrouchPunchSprite = new Image();
lincolnCrouchPunchSprite.src = "assets/lincoln-crouch-punch-game.png";
const lincolnCrouchKickSprite = new Image();
lincolnCrouchKickSprite.src = "assets/lincoln-crouch-kick-game.png";
const lincolnBlockSprite = new Image();
lincolnBlockSprite.src = "assets/lincoln-block-game.png";
const lincolnCrouchBlockSprite = new Image();
lincolnCrouchBlockSprite.src = "assets/lincoln-crouch-block-game.png";
const lincolnHatSprite = new Image();
lincolnHatSprite.src = "assets/lincoln-hat-game.png";
const lincolnKnockdownSprites = [1, 2, 3, 4, 5].map((frame) => {
  const image = new Image();
  image.src = `assets/lincoln-knockdown-${frame}-game.png`;
  return image;
});
const lincolnWalkSprites = [1, 2, 3, 4, 5].map((frame) => {
  const image = new Image();
  image.src = `assets/lincoln-walk-${frame}-game.png`;
  return image;
});
const lincolnJumpSprites = [1, 2, 3, 4, 5, 6].map((frame) => {
  const image = new Image();
  image.src = `assets/lincoln-jump-${frame}-game.png`;
  return image;
});
const washingtonSprite = new Image();
washingtonSprite.src = "assets/washington-idle.png";
const washingtonPunchSprite = new Image();
washingtonPunchSprite.src = "assets/washington-punch.png";
const washingtonKickSprite = new Image();
washingtonKickSprite.src = "assets/washington-kick.png";
const washingtonCrouchSprite = new Image();
washingtonCrouchSprite.src = "assets/washington-crouch.png";
const washingtonCrouchBlockSprite = new Image();
washingtonCrouchBlockSprite.src = "assets/washington-crouch-block.png";
const washingtonCrouchPunchSprite = new Image();
washingtonCrouchPunchSprite.src = "assets/washington-crouch-punch.png";
const washingtonCrouchKickSprite = new Image();
washingtonCrouchKickSprite.src = "assets/washington-crouch-kick.png";
const washingtonHitSprite = new Image();
washingtonHitSprite.src = "assets/washington-hit.png";
const washingtonBlockSprite = new Image();
washingtonBlockSprite.src = "assets/washington-block.png";
const washingtonKnockdownSprites = [1, 2, 3, 4, 5].map((frame) => {
  const image = new Image();
  image.src = `assets/washington-knockdown-${frame}.png`;
  return image;
});
const washingtonWalkSprites = [1, 2, 3, 4, 5].map((frame) => {
  const image = new Image();
  image.src = `assets/washington-walk-${frame}.png`;
  return image;
});
const washingtonBackwalkSprites = [1, 2, 3, 4, 5].map((frame) => {
  const image = new Image();
  image.src = `assets/washington-backwalk-${frame}.png`;
  return image;
});
const washingtonJumpSprites = [1, 2, 3, 4, 5, 6].map((frame) => {
  const image = new Image();
  image.src = `assets/washington-jump-${frame}.png`;
  return image;
});
const washingtonFrames = {
  idle: {
    image: washingtonSprite,
    crop: { x: 247, y: 55, w: 668, h: 1174 },
    height: 238,
    offsetX: 0
  },
  punch: {
    image: washingtonPunchSprite,
    crop: { x: 140, y: 83, w: 950, h: 1100 },
    height: 238,
    offsetX: 12
  },
  kick: {
    image: washingtonKickSprite,
    crop: { x: 109, y: 81, w: 984, h: 1105 },
    height: 238,
    offsetX: 20
  },
  crouch: {
    image: washingtonCrouchSprite,
    crop: { x: 221, y: 224, w: 756, h: 765 },
    height: 156,
    offsetX: 0
  },
  crouchBlock: {
    image: washingtonCrouchBlockSprite,
    crop: { x: 194, y: 193, w: 797, h: 793 },
    height: 156,
    offsetX: 0
  },
  crouchPunch: {
    image: washingtonCrouchPunchSprite,
    crop: { x: 122, y: 213, w: 1127, h: 790 },
    height: 158,
    offsetX: 34
  },
  crouchKick: {
    image: washingtonCrouchKickSprite,
    crop: { x: 75, y: 153, w: 1262, h: 780 },
    height: 156,
    offsetX: 48
  },
  hit: {
    image: washingtonHitSprite,
    crop: { x: 214, y: 131, w: 767, h: 1049 },
    height: 238,
    offsetX: -2
  },
  block: {
    image: washingtonBlockSprite,
    crop: { x: 273, y: 98, w: 640, h: 1102 },
    height: 238,
    offsetX: 0
  }
};
const washingtonWalkFrames = [
  { image: washingtonWalkSprites[0], crop: { x: 0, y: 125, w: 362, h: 510 }, height: 238, offsetX: 0 },
  { image: washingtonWalkSprites[1], crop: { x: 0, y: 125, w: 362, h: 510 }, height: 238, offsetX: 0 },
  { image: washingtonWalkSprites[2], crop: { x: 0, y: 125, w: 362, h: 510 }, height: 238, offsetX: 0 },
  { image: washingtonWalkSprites[3], crop: { x: 0, y: 125, w: 362, h: 510 }, height: 238, offsetX: 0 },
  { image: washingtonWalkSprites[4], crop: { x: 0, y: 125, w: 330, h: 510 }, height: 238, offsetX: -4 }
];
const washingtonBackwalkFrames = washingtonBackwalkSprites.map((image) => ({
  image,
  crop: { x: 0, y: 30, w: 436, h: 630 },
  height: 238,
  offsetX: 0
}));
const washingtonBackwalkCycle = [0, 1, 2, 3, 4, 3, 2, 1];
const washingtonJumpFrames = washingtonJumpSprites.map((image) => ({
  image,
  crop: { x: 0, y: 0, w: 380, h: 600 },
  height: 300,
  offsetX: 0
}));
const washingtonKnockdownFrames = [
  { image: washingtonKnockdownSprites[0], crop: { x: 37, y: 180, w: 357, h: 288 }, height: 167, offsetX: -4, lift: 39 },
  { image: washingtonKnockdownSprites[1], crop: { x: 7, y: 238, w: 419, h: 278 }, height: 146, offsetX: 2, lift: 21 },
  { image: washingtonKnockdownSprites[2], crop: { x: 59, y: 337, w: 375, h: 186 }, height: 109, offsetX: 6, lift: 5 },
  { image: washingtonKnockdownSprites[3], crop: { x: 39, y: 367, w: 380, h: 164 }, height: 99, offsetX: 4, lift: 0 },
  { image: washingtonKnockdownSprites[4], crop: { x: 32, y: 441, w: 400, h: 90 }, height: 56, offsetX: 0, lift: 0 }
];
const lincolnFrames = {
  idle: {
    image: lincolnSprite,
    crop: { x: 0, y: 0, w: 106, h: 270 },
    height: 270,
    offsetX: 0
  },
  punch: {
    image: lincolnPunchSprite,
    crop: { x: 0, y: 0, w: 229, h: 270 },
    height: 270,
    offsetX: 10
  },
  kick: {
    image: lincolnKickSprite,
    crop: { x: 0, y: 0, w: 256, h: 270 },
    height: 270,
    offsetX: 18
  },
  crouch: {
    image: lincolnCrouchSprite,
    crop: { x: 0, y: 0, w: 140, h: 176 },
    height: 176,
    offsetX: 0
  },
  crouchPunch: {
    image: lincolnCrouchPunchSprite,
    crop: { x: 0, y: 0, w: 206, h: 173 },
    height: 173,
    offsetX: 14
  },
  crouchKick: {
    image: lincolnCrouchKickSprite,
    crop: { x: 0, y: 0, w: 233, h: 164 },
    height: 164,
    offsetX: 55
  },
  block: {
    image: lincolnBlockSprite,
    crop: { x: 0, y: 0, w: 122, h: 270 },
    height: 270,
    offsetX: 6
  },
  crouchBlock: {
    image: lincolnCrouchBlockSprite,
    crop: { x: 0, y: 0, w: 136, h: 176 },
    height: 176,
    offsetX: -3
  }
};
const lincolnWalkFrames = [
  { image: lincolnWalkSprites[0], crop: { x: 0, y: 0, w: 151, h: 270 }, height: 270, offsetX: -11 },
  { image: lincolnWalkSprites[1], crop: { x: 0, y: 0, w: 96, h: 270 }, height: 270, offsetX: 2 },
  { image: lincolnWalkSprites[2], crop: { x: 0, y: 0, w: 142, h: 270 }, height: 270, offsetX: -1 },
  { image: lincolnWalkSprites[3], crop: { x: 0, y: 0, w: 96, h: 270 }, height: 270, offsetX: 3 },
  { image: lincolnWalkSprites[4], crop: { x: 0, y: 0, w: 144, h: 270 }, height: 270, offsetX: -4 }
];
const lincolnWalkCycle = [0, 1, 2, 3, 4];
const lincolnJumpFrames = [
  { image: lincolnJumpSprites[0], crop: { x: 0, y: 0, w: 127, h: 200 }, height: 200, offsetX: 1 },
  { image: lincolnJumpSprites[1], crop: { x: 0, y: 0, w: 127, h: 270 }, height: 270, offsetX: 3 },
  { image: lincolnJumpSprites[2], crop: { x: 0, y: 0, w: 133, h: 225 }, height: 225, offsetX: -6, lift: 35 },
  { image: lincolnJumpSprites[3], crop: { x: 0, y: 0, w: 123, h: 196 }, height: 196, offsetX: 0, lift: 56 },
  { image: lincolnJumpSprites[4], crop: { x: 0, y: 0, w: 130, h: 270 }, height: 270, offsetX: -2 },
  { image: lincolnJumpSprites[5], crop: { x: 0, y: 0, w: 128, h: 196 }, height: 196, offsetX: 1 }
];
const lincolnKnockdownFrames = [
  { image: lincolnKnockdownSprites[0], crop: { x: 0, y: 0, w: 199, h: 158 }, height: 158, offsetX: -4, lift: 58, shadowWidth: 84 },
  { image: lincolnKnockdownSprites[1], crop: { x: 0, y: 0, w: 206, h: 138 }, height: 138, offsetX: 0, lift: 34, shadowWidth: 94 },
  { image: lincolnKnockdownSprites[2], crop: { x: 0, y: 0, w: 202, h: 103 }, height: 103, offsetX: 4, lift: 7, shadowWidth: 106 },
  { image: lincolnKnockdownSprites[3], crop: { x: 0, y: 0, w: 263, h: 93 }, height: 93, offsetX: 6, shadowWidth: 122 },
  { image: lincolnKnockdownSprites[4], crop: { x: 0, y: 0, w: 275, h: 52 }, height: 52, offsetX: 6, shadowWidth: 132 }
];

const presidents = [
  {
    name: "Washington",
    short: "WASH",
    move: "Delaware Dash",
    stage: "Mount Vernon Portico",
    colors: ["#253d72", "#efe1b1", "#d4a94f"],
    accent: "#b33a3a",
    special: "dash",
    line: "Cross the Delaware!"
  },
  {
    name: "Lincoln",
    short: "LINC",
    move: "Railsplitter Uppercut",
    stage: "Marble Memorial Steps",
    colors: ["#1c1c22", "#5a351f", "#dadde5"],
    accent: "#77a7ff",
    special: "uppercut",
    line: "Four score combo!"
  },
  {
    name: "T. Roosevelt",
    short: "TEDDY",
    move: "Rough Rider Rush",
    stage: "National Park Outlook",
    colors: ["#6c4b25", "#263f26", "#e8cc8b"],
    accent: "#f2bb38",
    special: "rush",
    line: "Bully!"
  },
  {
    name: "Kennedy",
    short: "JFK",
    move: "Moonshot Beam",
    stage: "Cape Canaveral Podium",
    colors: ["#253f77", "#15151d", "#e8e8ef"],
    accent: "#9ee4ff",
    special: "beam",
    line: "Ask not..."
  },
  {
    name: "Jefferson",
    short: "JEFF",
    move: "Quill Cyclone",
    stage: "Monticello Lawn",
    colors: ["#7c2727", "#ead7a5", "#2d5f47"],
    accent: "#f3f0cf",
    special: "cyclone",
    line: "Declaration devastation!"
  },
  {
    name: "Grant",
    short: "GRANT",
    move: "Union Cannon",
    stage: "Capitol Encampment",
    colors: ["#243a66", "#324455", "#d0b06a"],
    accent: "#ffdf5f",
    special: "cannon",
    line: "Unconditional combo!"
  }
];

let player = makeFighter(presidents[0], 190, 1, true);
let rival = makeFighter(presidents[1], 730, -1, false);
let running = false;
let gameOver = false;
let roundEndQueued = false;
let roundText = "SELECT YOUR COMMANDER";
let roundTextTimer = 999;
let shake = 0;
let tick = 0;
let koSlowMoFrame = 0;
let lastFrameTime = 0;
let frameLag = 0;
let projectiles = [];
let hitSparks = [];

function makeFighter(data, x, dir, human) {
  return {
    data,
    x,
    y: floorY,
    vx: 0,
    vy: 0,
    dir,
    human,
    w: 72,
    h: 148,
    hp: 100,
    energy: 100,
    cooldown: 0,
    attack: 0,
    attackType: "",
    special: 0,
    block: false,
    hurt: 0,
    hitReact: 0,
    knockdown: 0,
    knockdownAge: 0,
    knockdownLanded: 0,
    knockdownDir: 0,
    crouching: false,
    jumping: false,
    wins: 0
  };
}

function populateSelects() {
  presidents.forEach((pres, index) => {
    const left = new Option(`${pres.name} - ${pres.move}`, String(index));
    const right = new Option(`${pres.name} - ${pres.move}`, String(index));
    playerSelect.add(left);
    rivalSelect.add(right);
  });
  rivalSelect.value = "1";
  updateMoveCards();
}

function resetMatch() {
  const p = presidents[Number(playerSelect.value)];
  const r = presidents[Number(rivalSelect.value)];
  player = makeFighter(p, 190, 1, true);
  rival = makeFighter(r, 730, -1, false);
  projectiles = [];
  hitSparks = [];
  roundText = `${p.short} VS ${r.short}`;
  roundTextTimer = 130;
  running = true;
  gameOver = false;
  roundEndQueued = false;
  lastFrameTime = 0;
  frameLag = 0;
  overlay.classList.add("hidden");
  updateMoveCards();
}

function updateMoveCards() {
  const p = presidents[Number(playerSelect.value)];
  const r = presidents[Number(rivalSelect.value)];
  p1Name.textContent = p.name;
  p2Name.textContent = r.name;
  p1Move.textContent = `${p.move} - ${p.stage}`;
  p2Move.textContent = `${r.move} - ${r.stage}`;
}

function rect(f) {
  return { x: f.x - f.w / 2, y: f.y - f.h, w: f.w, h: f.h };
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function update() {
  tick += 1;
  if (!running) return;

  if (!gameOver) {
    controlPlayer();
    controlAI();
  }
  stepFighter(player, rival);
  stepFighter(rival, player);
  if (!gameOver) stepProjectiles();
  hitSparks = hitSparks.filter((s) => --s.life > 0);
  shake = Math.max(0, shake - 1);
  roundTextTimer = Math.max(0, roundTextTimer - 1);

  if (!gameOver && (player.hp <= 0 || rival.hp <= 0)) {
    gameOver = true;
    const defeated = player.hp <= 0 ? player : rival;
    defeated.attack = 0;
    defeated.attackType = "";
    startKnockdown(defeated, defeated === player ? rival.dir : player.dir);
    roundText = "K.O.";
    roundTextTimer = 999;
  }

  if (gameOver) {
    const defeated = player.hp <= 0 ? player : rival;
    if (defeated.knockdown <= 1) {
      defeated.knockdown = 1;
      defeated.y = floorY;
      defeated.vx = 0;
      defeated.vy = 0;
      defeated.jumping = false;
      roundText = player.hp > rival.hp ? "PLAYER WINS" : "RIVAL WINS";
      roundTextTimer = 999;
      running = false;
      if (!roundEndQueued) {
        roundEndQueued = true;
        setTimeout(() => overlay.classList.remove("hidden"), 900);
      }
    }
  }
}

function controlPlayer() {
  player.crouching = keys.has("KeyS") && !player.jumping;
  player.vx = 0;
  if (!player.crouching && keys.has("KeyA")) player.vx -= playerSpeed;
  if (!player.crouching && keys.has("KeyD")) player.vx += playerSpeed;
  player.block = keys.has("Space") && player.cooldown < 8;
  if (keys.has("KeyW") && !player.jumping && !player.crouching) {
    player.vy = jumpVelocity;
    player.jumping = true;
  }
  if (keys.has("KeyJ")) strike(player, rival, "punch");
  if (keys.has("KeyK")) strike(player, rival, "kick");
  if (keys.has("KeyL")) special(player, rival);
}

function controlAI() {
  const dist = Math.abs(player.x - rival.x);
  rival.block = false;
  rival.vx = 0;
  if (rival.cooldown > 0 || rival.hurt > 0) return;
  if (dist > 145) rival.vx = player.x < rival.x ? -rivalAdvanceSpeed : rivalAdvanceSpeed;
  if (dist < 88) rival.vx = player.x < rival.x ? rivalRetreatSpeed : -rivalRetreatSpeed;
  if (tick % 75 === 0 && dist < 110) strike(rival, player, Math.random() > 0.5 ? "punch" : "kick");
  if (tick % 145 === 0 && dist < 310) special(rival, player);
  if (tick % 190 === 0 && Math.random() > 0.55) rival.block = true;
}

function stepFighter(f, foe) {
  f.dir = foe.x >= f.x ? 1 : -1;
  f.cooldown = Math.max(0, f.cooldown - 1);
  f.attack = Math.max(0, f.attack - 1);
  if (f.attack === 0) f.attackType = "";
  f.special = Math.max(0, f.special - 1);
  f.hurt = Math.max(0, f.hurt - 1);
  f.hitReact = Math.max(0, f.hitReact - 1);
  if (f.knockdown > 0) {
    f.knockdown = Math.max(0, f.knockdown - 1);
    f.knockdownAge += 1;
  }
  f.energy = clamp(f.energy + 0.16, 0, 100);
  if (f.knockdown > 0) {
    f.crouching = false;
    if (f.knockdownAge <= knockoutImpactHold) return;
  }
  if (f.knockdown > 1) f.vx *= f.knockdownLanded ? 0.86 : 0.995;
  else if (f.hurt > 0) f.vx *= 0.88;
  f.x = clamp(f.x + f.vx, 56, W - 56);
  const riseGravity = f.knockdown > 0 ? knockoutRiseGravity : jumpRiseGravity;
  const fallGravity = f.knockdown > 0 ? knockoutFallGravity : jumpFallGravity;
  f.vy += f.vy < 0 ? riseGravity : fallGravity;
  f.y += f.vy;
  if (f.y >= floorY) {
    f.y = floorY;
    f.vy = 0;
    f.jumping = false;
    if (f.knockdown > 0) f.knockdownLanded += 1;
  }
}

function strike(attacker, defender, type) {
  if (attacker.cooldown || attacker.hurt) return;
  const crouchStrike = attacker.crouching && !attacker.jumping;
  attacker.attack = type === "punch" ? 18 : 24;
  attacker.attackType = crouchStrike ? `crouch-${type}` : type;
  attacker.cooldown = type === "punch" ? 24 : 34;
  const reach = crouchStrike ? (type === "punch" ? 76 : 106) : (type === "punch" ? 62 : 78);
  const boxY = crouchStrike ? attacker.y - 76 : attacker.y - 112;
  const box = {
    x: attacker.x + (attacker.dir > 0 ? 16 : -reach - 16),
    y: boxY,
    w: reach,
    h: type === "punch" ? 42 : 34
  };
  if (intersects(box, rect(defender))) {
    damage(defender, type === "punch" ? 6 : 9, attacker.dir, type.toUpperCase(), strikeImpactPoint(attacker, defender, type, crouchStrike));
  }
}

function strikeImpactPoint(attacker, defender, type, crouchStrike) {
  const yOffset = crouchStrike ? (type === "punch" ? 94 : 50) : (type === "punch" ? 150 : 106);
  const defenderEdgeX = defender.x - attacker.dir * (defender.w / 2 - 4);
  return {
    x: Math.round(defenderEdgeX),
    y: attacker.y - yOffset
  };
}

function special(attacker, defender) {
  if (attacker.cooldown || attacker.energy < 34 || attacker.hurt) return;
  attacker.energy -= 34;
  attacker.cooldown = 54;
  attacker.special = 34;
  roundText = attacker.data.line;
  roundTextTimer = 72;

  const kind = attacker.data.special;
  if (kind === "dash" || kind === "rush") {
    attacker.vx = attacker.dir * (kind === "dash" ? 15 : 11);
    setTimeout(() => {
      if (Math.abs(attacker.x - defender.x) < 118) {
        damage(defender, kind === "dash" ? 16 : 13, attacker.dir, attacker.data.move, {
          x: attacker.x + attacker.dir * 76,
          y: attacker.y - 96
        });
      }
    }, 120);
  } else if (kind === "uppercut") {
    attacker.vy = jumpVelocity * 1.15;
    attacker.jumping = true;
    if (Math.abs(attacker.x - defender.x) < 105) {
      damage(defender, 18, attacker.dir, attacker.data.move, {
        x: attacker.x + attacker.dir * 54,
        y: attacker.y - 126
      });
    }
  } else if (kind === "cyclone") {
    for (let i = 0; i < 3; i += 1) {
      setTimeout(() => {
        if (Math.abs(attacker.x - defender.x) < 132) {
          damage(defender, 6, attacker.dir, attacker.data.move, {
            x: attacker.x + attacker.dir * 82,
            y: attacker.y - (82 + i * 12)
          });
        }
      }, i * 120);
    }
  } else {
    projectiles.push({
      x: attacker.x + attacker.dir * 54,
      y: attacker.y - 92,
      vx: attacker.dir * (kind === "beam" ? 9 : 7),
      owner: attacker,
      color: attacker.data.accent,
      label: kind === "beam" ? "USA" : "BOOM",
      damage: kind === "beam" ? 14 : 17,
      life: 95
    });
  }
}

function stepProjectiles() {
  projectiles.forEach((p) => {
    p.x += p.vx;
    p.life -= 1;
    const target = p.owner === player ? rival : player;
    if (intersects({ x: p.x - 18, y: p.y - 14, w: 36, h: 28 }, rect(target))) {
      damage(target, p.damage, Math.sign(p.vx), p.label, { x: p.x, y: p.y });
      p.life = 0;
    }
  });
  projectiles = projectiles.filter((p) => p.life > 0 && p.x > -80 && p.x < W + 80);
}

function startKnockdown(f, dir) {
  f.knockdown = knockdownDuration;
  f.knockdownAge = 0;
  f.knockdownLanded = 0;
  f.knockdownDir = Math.sign(dir) || f.dir;
  f.hitReact = 0;
  f.hurt = knockdownDuration;
  f.jumping = true;
  f.crouching = false;
  f.vx = f.knockdownDir * knockoutSlideSpeed;
  f.vy = knockoutLaunchVelocity;
}

function damage(f, amount, dir, label, impact = null) {
  const blocked = f.block && Math.sign(dir) !== f.dir;
  const actual = blocked ? Math.ceil(amount * 0.28) : amount;
  const knocksDown = f.hp - actual <= 0;
  f.hp = clamp(f.hp - actual, 0, 100);
  f.hurt = blocked ? 10 : knocksDown ? knockdownDuration : 22;
  f.hitReact = blocked || knocksDown ? 0 : 14;
  if (knocksDown) startKnockdown(f, dir);
  else f.knockdown = 0;
  if (!knocksDown) f.vx = dir * (blocked ? 3 : 8);
  shake = blocked ? 4 : 9;
  hitSparks.push({
    x: impact?.x ?? f.x - Math.sign(dir) * 32,
    y: impact?.y ?? f.y - 92,
    life: 20,
    label,
    blocked
  });
}

function draw() {
  const ox = shake ? Math.round((Math.random() - 0.5) * shake) : 0;
  const oy = shake ? Math.round((Math.random() - 0.5) * shake) : 0;
  ctx.save();
  ctx.translate(ox, oy);
  drawStage();
  drawHud();
  projectiles.forEach(drawProjectile);
  drawFighters();
  hitSparks.forEach(drawSpark);
  if (roundTextTimer > 0) drawRoundText();
  ctx.restore();
  requestAnimationFrame(loop);
}

function drawFighters() {
  if (activeHitLayer(player, rival)) {
    drawFighter(rival);
    drawFighter(player);
    return;
  }
  if (activeHitLayer(rival, player)) {
    drawFighter(player);
    drawFighter(rival);
    return;
  }
  drawFighter(player);
  drawFighter(rival);
}

function activeHitLayer(attacker, defender) {
  return attacker.attack > 6 && defender.hurt > 0 && attacker.hurt === 0;
}

function drawStage() {
  if (stageImage.complete && stageImage.naturalWidth > 0) {
    ctx.drawImage(stageImage, 0, 0, W, H);
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#101833");
    grad.addColorStop(0.62, "#273c65");
    grad.addColorStop(1, "#12131d");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }
}

function drawHud() {
  drawHealth(34, 30, player, false);
  drawHealth(W - 394, 30, rival, true);
  ctx.fillStyle = "#f5d66f";
  ctx.fillRect(434, 24, 92, 64);
  ctx.fillStyle = "#17131b";
  ctx.fillRect(444, 34, 72, 44);
  pixelText("92", 464, 45, 4, "#f5d66f");
  pixelText(player.data.short, 36, 92, 2.4, "#fff4c7");
  pixelText(rival.data.short, W - 202, 92, 2.4, "#fff4c7");
}

function drawHealth(x, y, f, flip) {
  ctx.fillStyle = "#090b12";
  ctx.fillRect(x - 4, y - 4, 364, 34);
  ctx.fillStyle = "#661b26";
  ctx.fillRect(x, y, 356, 26);
  ctx.fillStyle = f.hp > 35 ? "#f5d66f" : "#ca3341";
  const width = Math.round(356 * (f.hp / 100));
  if (flip) ctx.fillRect(x + 356 - width, y, width, 26);
  else ctx.fillRect(x, y, width, 26);
  ctx.fillStyle = "#2f7bd1";
  const energyWidth = Math.round(220 * (f.energy / 100));
  if (flip) ctx.fillRect(x + 136 + (220 - energyWidth), y + 34, energyWidth, 8);
  else ctx.fillRect(x, y + 34, energyWidth, 8);
}

function drawFighter(f) {
  if (f.data.name === "Washington" && washingtonSprite.complete && washingtonSprite.naturalWidth > 0) {
    drawWashingtonSprite(f);
    return;
  }
  if (f.data.name === "Lincoln" && lincolnSprite.complete && lincolnSprite.naturalWidth > 0) {
    drawLincolnSprite(f);
    return;
  }

  const [coat, pants, skin] = f.data.colors;
  const r = rect(f);
  const bob = fighterBob(f);
  const hurtFlash = f.hurt > 0 && tick % 4 < 2;
  drawShadow(f, 76);
  ctx.save();
  ctx.translate(Math.round(f.x), Math.round(f.y + bob));
  ctx.scale(f.dir, 1);

  if (f.block) {
    ctx.fillStyle = "rgba(158, 228, 255, 0.28)";
    ctx.fillRect(-56, -132, 26, 102);
  }

  ctx.fillStyle = hurtFlash ? "#ffffff" : pants;
  ctx.fillRect(-26, -76, 22, 70);
  ctx.fillRect(8, -76, 22, 70);
  ctx.fillStyle = "#161820";
  ctx.fillRect(-28, -8, 28, 10);
  ctx.fillRect(10, -8, 28, 10);

  ctx.fillStyle = hurtFlash ? "#ffffff" : coat;
  ctx.fillRect(-34, -132, 68, 70);
  ctx.fillStyle = f.data.accent;
  ctx.fillRect(-8, -132, 16, 70);
  ctx.fillStyle = "#f8e7b0";
  ctx.fillRect(-18, -118, 36, 14);

  const armY = f.attack > 0 ? -118 : -104;
  const armReach = f.attack > 0 ? 56 : 30;
  ctx.fillStyle = hurtFlash ? "#ffffff" : coat;
  ctx.fillRect(22, armY, armReach, 18);
  ctx.fillRect(-52, -108, 26, 18);
  ctx.fillStyle = skin;
  ctx.fillRect(22 + armReach, armY + 2, 16, 14);
  ctx.fillRect(-64, -106, 14, 14);

  ctx.fillStyle = skin;
  ctx.fillRect(-24, -170, 48, 46);
  ctx.fillStyle = f.data.name === "Lincoln" ? "#111111" : "#e7e7dc";
  ctx.fillRect(-26, -178, 52, 14);
  if (f.data.name === "Lincoln") ctx.fillRect(-20, -208, 40, 34);
  if (f.data.name === "T. Roosevelt") {
    ctx.fillStyle = "#6b3e1f";
    ctx.fillRect(-18, -150, 36, 12);
  }
  ctx.fillStyle = "#111111";
  ctx.fillRect(6, -154, 8, 6);
  ctx.fillStyle = "#5a2b1b";
  ctx.fillRect(-8, -140, 24, 6);

  if (f.special > 0) {
    ctx.fillStyle = f.data.accent;
    ctx.fillRect(-46, -188, 10, 10);
    ctx.fillRect(38, -196, 14, 14);
    ctx.fillRect(-8, -210, 12, 12);
  }

  ctx.restore();
}

function drawLincolnSprite(f) {
  const frame = lincolnFrameFor(f);
  const bob = fighterBob(f);
  const settledKnockdown = f.knockdown > 0 && f.knockdownLanded > 0;
  const hurtFlash = f.hurt > 0 && !settledKnockdown && tick % 4 < 2;
  const displayH = frame.height;
  const displayW = Math.round(displayH * (frame.crop.w / frame.crop.h));
  const lift = frame.lift || 0;

  drawShadow(f, frame.shadowWidth || 76);
  ctx.save();
  ctx.translate(Math.round(f.x), Math.round(f.y + bob));
  ctx.scale(f.dir, 1);

  if (f.block && frame !== lincolnFrames.block && frame !== lincolnFrames.crouchBlock) {
    ctx.fillStyle = "rgba(158, 228, 255, 0.28)";
    ctx.fillRect(-54, -142, 26, 112);
  }

  ctx.globalAlpha = hurtFlash ? 0.55 : 1;
  ctx.drawImage(
    preparedFrameCanvas(frame, displayW, displayH),
    -Math.round(displayW / 2) + frame.offsetX,
    -displayH - lift
  );
  ctx.globalAlpha = 1;

  if (f.special > 0) {
    ctx.fillStyle = f.data.accent;
    ctx.fillRect(-42, -188, 10, 10);
    ctx.fillRect(34, -196, 14, 14);
    ctx.fillRect(-6, -210, 12, 12);
  }

  ctx.restore();

  if (f.knockdown > 0 && lincolnHatSprite.complete && lincolnHatSprite.naturalWidth > 0) {
    drawLincolnHat(f, hurtFlash);
  }
}

function preparedFrameCanvas(frame, displayW, displayH) {
  if (!frame.buffer || frame.buffer.width !== displayW || frame.buffer.height !== displayH) {
    const buffer = document.createElement("canvas");
    buffer.width = displayW;
    buffer.height = displayH;
    const bufferCtx = buffer.getContext("2d");
    bufferCtx.imageSmoothingEnabled = false;
    bufferCtx.drawImage(
      frame.image,
      frame.crop.x,
      frame.crop.y,
      frame.crop.w,
      frame.crop.h,
      0,
      0,
      displayW,
      displayH
    );
    frame.buffer = buffer;
  }
  return frame.buffer;
}

function lincolnFrameFor(f) {
  if (f.knockdown > 0 && lincolnKnockdownSprites.every((image) => image.complete && image.naturalWidth > 0)) {
    return lincolnKnockdownFrameFor(f);
  }
  if (f.attack > 6 && f.attackType === "crouch-kick" && lincolnCrouchKickSprite.complete && lincolnCrouchKickSprite.naturalWidth > 0) {
    return lincolnFrames.crouchKick;
  }
  if (f.attack > 6 && f.attackType === "crouch-punch" && lincolnCrouchPunchSprite.complete && lincolnCrouchPunchSprite.naturalWidth > 0) {
    return lincolnFrames.crouchPunch;
  }
  if (f.attack > 6 && f.attackType === "kick" && lincolnKickSprite.complete && lincolnKickSprite.naturalWidth > 0) {
    return lincolnFrames.kick;
  }
  if (f.attack > 6 && f.attackType === "punch" && lincolnPunchSprite.complete && lincolnPunchSprite.naturalWidth > 0) {
    return lincolnFrames.punch;
  }
  if (f.jumping && lincolnJumpSprites.every((image) => image.complete && image.naturalWidth > 0)) {
    return lincolnJumpFrameFor(f);
  }
  if (f.crouching && f.block && lincolnCrouchBlockSprite.complete && lincolnCrouchBlockSprite.naturalWidth > 0) {
    return lincolnFrames.crouchBlock;
  }
  if (f.block && lincolnBlockSprite.complete && lincolnBlockSprite.naturalWidth > 0) {
    return lincolnFrames.block;
  }
  if (!f.jumping && Math.sign(f.vx) === f.dir && Math.abs(f.vx) > 0.2 && lincolnWalkSprites.every((image) => image.complete && image.naturalWidth > 0)) {
    return lincolnWalkFrames[lincolnWalkCycle[Math.floor(tick / walkFrameTicks) % lincolnWalkCycle.length]];
  }
  if (f.crouching && lincolnCrouchSprite.complete && lincolnCrouchSprite.naturalWidth > 0) {
    return lincolnFrames.crouch;
  }
  return lincolnFrames.idle;
}

function lincolnKnockdownFrameFor(f) {
  if (f.knockdownAge <= knockoutImpactHold) return lincolnKnockdownFrames[0];
  if (!f.knockdownLanded) {
    return f.vy < 0 ? lincolnKnockdownFrames[0] : lincolnKnockdownFrames[1];
  }
  const frameIndex = clamp(2 + Math.floor((f.knockdownLanded - 1) / knockdownFrameTicks), 2, lincolnKnockdownFrames.length - 1);
  return lincolnKnockdownFrames[frameIndex];
}

function drawLincolnHat(f, hurtFlash) {
  const age = Math.max(0, f.knockdownAge - knockoutImpactHold);
  const t = Math.min(age, 104);
  const dir = f.knockdownDir || f.dir || 1;
  const hatW = lincolnHatSprite.naturalWidth;
  const hatH = lincolnHatSprite.naturalHeight;
  const x = f.x - dir * (8 + t * 0.34);
  const airY = floorY - 244 - t * 1.45 + t * t * 0.043;
  const y = Math.min(floorY - hatH / 2 - 7, airY);
  const landed = airY >= floorY - hatH / 2 - 7;
  const angle = landed ? dir * 1.25 : dir * (0.25 + t * 0.11);

  ctx.save();
  ctx.globalAlpha = hurtFlash ? 0.55 : 1;
  ctx.translate(Math.round(x), Math.round(y));
  ctx.rotate(angle);
  ctx.drawImage(lincolnHatSprite, -Math.round(hatW / 2), -Math.round(hatH / 2), hatW, hatH);
  ctx.restore();
}

function lincolnJumpFrameFor(f) {
  const air = floorY - f.y;
  if (f.vy < 0 && air < 36) return lincolnJumpFrames[0];
  if (f.vy < -10) return lincolnJumpFrames[1];
  if (f.vy < -4) return lincolnJumpFrames[2];
  if (f.vy < -0.8) return lincolnJumpFrames[3];
  if (f.vy < 2.8) return lincolnJumpFrames[3];
  if (f.vy < 9) return lincolnJumpFrames[4];
  if (air < 44) return lincolnJumpFrames[5];
  return lincolnJumpFrames[4];
}

function fighterBob(f) {
  if (f.knockdown > 0) return 0;
  if (f.jumping || Math.abs(f.vx) > 0.2) return 0;
  return Math.sin(tick / 38) * 0.8;
}

function drawShadow(f, width) {
  const air = Math.max(0, floorY - f.y);
  const scale = clamp(1 - air / 230, 0.42, 1);
  const shadowW = Math.round(width * scale);
  ctx.fillStyle = "rgba(5, 6, 10, 0.78)";
  ctx.fillRect(Math.round(f.x - shadowW / 2), floorY - 7, shadowW, 10);
}

function drawWashingtonSprite(f) {
  const frame = washingtonFrameFor(f);
  const bob = fighterBob(f);
  const hurtFlash = f.hurt > 0 && f.knockdown === 0 && tick % 4 < 2;
  const displayH = frame.height;
  const displayW = Math.round(displayH * (frame.crop.w / frame.crop.h));
  const lift = frame.lift || 0;

  drawShadow(f, 84);
  ctx.save();
  ctx.translate(Math.round(f.x), Math.round(f.y + bob));
  ctx.scale(f.dir, 1);

  if (f.block && frame !== washingtonFrames.block && frame !== washingtonFrames.crouchBlock) {
    ctx.fillStyle = "rgba(158, 228, 255, 0.28)";
    ctx.fillRect(-58, -142, 28, 112);
  }

  ctx.globalAlpha = hurtFlash ? 0.55 : 1;
  ctx.drawImage(
    preparedFrameCanvas(frame, displayW, displayH),
    -Math.round(displayW / 2) + frame.offsetX,
    -displayH - lift
  );
  ctx.globalAlpha = 1;

  if (f.special > 0) {
    ctx.fillStyle = f.data.accent;
    ctx.fillRect(-48, -190, 10, 10);
    ctx.fillRect(38, -198, 14, 14);
    ctx.fillRect(-8, -212, 12, 12);
  }

  ctx.restore();
}

function washingtonFrameFor(f) {
  if (f.knockdown > 0 && washingtonKnockdownSprites.every((image) => image.complete && image.naturalWidth > 0)) {
    return washingtonKnockdownFrameFor(f);
  }
  if (f.hitReact > 0 && washingtonHitSprite.complete && washingtonHitSprite.naturalWidth > 0) {
    return washingtonFrames.hit;
  }
  if (f.attack > 6 && f.attackType === "crouch-kick" && washingtonCrouchKickSprite.complete && washingtonCrouchKickSprite.naturalWidth > 0) {
    return washingtonFrames.crouchKick;
  }
  if (f.attack > 6 && f.attackType === "crouch-punch" && washingtonCrouchPunchSprite.complete && washingtonCrouchPunchSprite.naturalWidth > 0) {
    return washingtonFrames.crouchPunch;
  }
  if (f.attack > 6 && f.attackType === "kick" && washingtonKickSprite.complete && washingtonKickSprite.naturalWidth > 0) {
    return washingtonFrames.kick;
  }
  if (f.attack > 6 && f.attackType === "punch" && washingtonPunchSprite.complete && washingtonPunchSprite.naturalWidth > 0) {
    return washingtonFrames.punch;
  }
  if (f.jumping && washingtonJumpSprites.every((image) => image.complete && image.naturalWidth > 0)) {
    return washingtonJumpFrameFor(f);
  }
  if (f.crouching && f.block && washingtonCrouchBlockSprite.complete && washingtonCrouchBlockSprite.naturalWidth > 0) {
    return washingtonFrames.crouchBlock;
  }
  if (f.block && washingtonBlockSprite.complete && washingtonBlockSprite.naturalWidth > 0) {
    return washingtonFrames.block;
  }
  if (f.crouching && washingtonCrouchSprite.complete && washingtonCrouchSprite.naturalWidth > 0) {
    return washingtonFrames.crouch;
  }
  if (!f.jumping && Math.abs(f.vx) > 0.2 && washingtonMoveSpritesReady()) {
    return washingtonWalkFrameFor(f);
  }
  return washingtonFrames.idle;
}

function washingtonMoveSpritesReady() {
  return washingtonWalkSprites.every((image) => image.complete && image.naturalWidth > 0)
    && washingtonBackwalkSprites.every((image) => image.complete && image.naturalWidth > 0);
}

function washingtonJumpFrameFor(f) {
  if (f.vy < -10) return washingtonJumpFrames[0];
  if (f.vy < -4) return washingtonJumpFrames[1];
  if (f.vy < -0.8) return washingtonJumpFrames[2];
  if (f.vy < 2.8) return washingtonJumpFrames[3];
  if (f.vy < 9) return washingtonJumpFrames[4];
  return washingtonJumpFrames[5];
}

function washingtonKnockdownFrameFor(f) {
  if (f.knockdownAge <= knockoutImpactHold && washingtonHitSprite.complete && washingtonHitSprite.naturalWidth > 0) {
    return washingtonFrames.hit;
  }
  if (!f.knockdownLanded) {
    return f.vy < 0 ? washingtonKnockdownFrames[0] : washingtonKnockdownFrames[1];
  }
  const frameIndex = clamp(2 + Math.floor((f.knockdownLanded - 1) / knockdownFrameTicks), 2, washingtonKnockdownFrames.length - 1);
  return washingtonKnockdownFrames[frameIndex];
}

function washingtonWalkFrameFor(f) {
  const movingForward = Math.sign(f.vx) === f.dir;
  if (movingForward) {
    const rawFrame = Math.floor(tick / walkFrameTicks) % washingtonWalkFrames.length;
    return washingtonWalkFrames[rawFrame];
  }
  const rawFrame = Math.floor(tick / backwalkFrameTicks) % washingtonBackwalkCycle.length;
  return washingtonBackwalkFrames[washingtonBackwalkCycle[rawFrame]];
}

function drawProjectile(p) {
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(p.x - 23, p.y - 18, 46, 36);
  ctx.fillStyle = p.color;
  ctx.fillRect(p.x - 18, p.y - 13, 36, 26);
  pixelText(p.label, p.x - 18, p.y - 4, 1.3, "#11131d");
}

function drawSpark(s) {
  const lifeProgress = s.life / 20;
  const pulse = 1 + (1 - lifeProgress) * 0.28;
  const displayW = Math.round((s.blocked ? 62 : 76) * pulse);
  const displayH = Math.round(displayW * 0.54);
  const alpha = clamp(lifeProgress * 1.35, 0, 1);

  ctx.save();
  ctx.globalAlpha = alpha;
  if (impactSparkSprite.complete && impactSparkSprite.naturalWidth > 0) {
    ctx.drawImage(
      impactSparkSprite,
      139,
      349,
      995,
      536,
      Math.round(s.x - displayW / 2),
      Math.round(s.y - displayH / 2),
      displayW,
      displayH
    );
  } else {
    ctx.fillStyle = s.blocked ? "#9ee4ff" : "#fff4c7";
    ctx.fillRect(s.x - 30, s.y - 7, 60, 14);
    ctx.fillRect(s.x - 7, s.y - 30, 14, 60);
  }
  ctx.restore();
}

function drawRoundText() {
  const text = roundText.slice(0, 22).toUpperCase();
  const scale = text.length > 14 ? 2.6 : 3.8;
  const width = text.length * 26 * (scale / 3);
  pixelText(text, W / 2 - width / 2, 148, scale, "#fff4c7", "#8b1c2b");
}

const font = {
  A: ["111", "101", "111", "101", "101"],
  B: ["110", "101", "110", "101", "110"],
  C: ["111", "100", "100", "100", "111"],
  D: ["110", "101", "101", "101", "110"],
  E: ["111", "100", "110", "100", "111"],
  F: ["111", "100", "110", "100", "100"],
  G: ["111", "100", "101", "101", "111"],
  H: ["101", "101", "111", "101", "101"],
  I: ["111", "010", "010", "010", "111"],
  J: ["001", "001", "001", "101", "111"],
  K: ["101", "101", "110", "101", "101"],
  L: ["100", "100", "100", "100", "111"],
  M: ["101", "111", "111", "101", "101"],
  N: ["101", "111", "111", "111", "101"],
  O: ["111", "101", "101", "101", "111"],
  P: ["111", "101", "111", "100", "100"],
  Q: ["111", "101", "101", "111", "001"],
  R: ["111", "101", "111", "110", "101"],
  S: ["111", "100", "111", "001", "111"],
  T: ["111", "010", "010", "010", "010"],
  U: ["101", "101", "101", "101", "111"],
  V: ["101", "101", "101", "101", "010"],
  W: ["101", "101", "111", "111", "101"],
  X: ["101", "101", "010", "101", "101"],
  Y: ["101", "101", "010", "010", "010"],
  Z: ["111", "001", "010", "100", "111"],
  "0": ["111", "101", "101", "101", "111"],
  "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"],
  "3": ["111", "001", "111", "001", "111"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "111", "001", "111"],
  "6": ["111", "100", "111", "101", "111"],
  "7": ["111", "001", "001", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "111"],
  " ": ["000", "000", "000", "000", "000"],
  "'": ["010", "010", "000", "000", "000"],
  ".": ["000", "000", "000", "000", "010"],
  "!": ["010", "010", "010", "000", "010"]
};

function pixelText(text, x, y, scale, color, shadow) {
  const size = scale;
  if (shadow) pixelText(text, x + size * 2, y + size * 2, scale, shadow);
  ctx.fillStyle = color;
  [...text].forEach((char, i) => {
    const glyph = font[char] || font[" "];
    glyph.forEach((row, yy) => {
      [...row].forEach((bit, xx) => {
        if (bit === "1") ctx.fillRect(Math.round(x + i * size * 5 + xx * size), Math.round(y + yy * size), Math.ceil(size), Math.ceil(size));
      });
    });
  });
}

function loop(now = 0) {
  if (!lastFrameTime) lastFrameTime = now;
  frameLag += Math.min(now - lastFrameTime, maxFrameCatchupMs);
  lastFrameTime = now;

  while (frameLag >= stepMs) {
    if (koSlowMotionActive()) {
      koSlowMoFrame = (koSlowMoFrame + 1) % knockoutSlowMoInterval;
      if (koSlowMoFrame === 0) update();
    } else {
      koSlowMoFrame = 0;
      update();
    }
    frameLag -= stepMs;
  }

  draw();
}

function koSlowMotionActive() {
  return gameOver
    && ((player.hp <= 0 && player.knockdown > 1) || (rival.hp <= 0 && rival.knockdown > 1));
}

window.addEventListener("keydown", (event) => {
  keys.add(event.code);
  if (event.code === "Enter" && !running) resetMatch();
  if (["Space", "KeyW", "KeyA", "KeyS", "KeyD", "KeyJ", "KeyK", "KeyL"].includes(event.code)) {
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => keys.delete(event.code));
playerSelect.addEventListener("change", updateMoveCards);
rivalSelect.addEventListener("change", updateMoveCards);
startBtn.addEventListener("click", resetMatch);

populateSelects();
loop();
