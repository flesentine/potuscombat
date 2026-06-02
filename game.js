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
const physics = {
  floorY: 456,
  playerSpeed: 4.9,
  rivalAdvanceSpeed: 2.7,
  rivalRetreatSpeed: 2.5,
  jumpVelocity: -15,
  jumpRiseGravity: 0.8,
  jumpFallGravity: 1.1,
  knockoutLaunchVelocity: -12.8,
  knockoutRiseGravity: 0.48,
  knockoutFallGravity: 0.68,
  knockoutSlideSpeed: 5.1
};
const timing = {
  fps: 120,
  walkFrameTicks: 8,
  backwalkFrameTicks: 9,
  knockdownFrameTicks: 16,
  knockdownDuration: 118,
  knockoutImpactHold: 14,
  knockoutSlowMoInterval: 3,
  victoryFrameTicks: 18,
  maxFrameCatchupMs: 90,
  roundDurationFrames: 99 * 120,
  jumpBufferFrames: 10,
  // The round clock starts after the intro banner has had a short arcade beat.
  roundIntroFreezeFrames: 100
};
const damageTuning = {
  blockMultiplier: 0.28,
  hitstun: 22,
  blockstun: 10,
  pushback: 8,
  blockPushback: 3,
  specialEnergyCost: 34,
  cleanHitPause: 5,
  blockedHitPause: 2,
  cleanShake: 9,
  blockedShake: 3,
  specialShakeBonus: 3
};
const AI_DIFFICULTY = {
  easy: {
    decisionIntervalFrames: 34, reactionDelayFrames: 24, aggression: 0.72, defense: 0.68,
    punishChance: 0.22, antiAirChance: 0.28, comboChance: 0.16, jumpChance: 0.08,
    specialChance: 0.12, mistakeChance: 0.3, blockChance: 0.45, maxComboLength: 1
  },
  normal: {
    decisionIntervalFrames: 20, reactionDelayFrames: 14, aggression: 0.92, defense: 0.88,
    punishChance: 0.5, antiAirChance: 0.58, comboChance: 0.38, jumpChance: 0.12,
    specialChance: 0.25, mistakeChance: 0.16, blockChance: 0.64, maxComboLength: 2
  },
  hard: {
    decisionIntervalFrames: 12, reactionDelayFrames: 8, aggression: 1.08, defense: 1.05,
    punishChance: 0.72, antiAirChance: 0.78, comboChance: 0.56, jumpChance: 0.16,
    specialChance: 0.34, mistakeChance: 0.08, blockChance: 0.78, maxComboLength: 3
  }
};
const AI_PERSONALITY = {
  Washington: {
    aggression: 0.94, defense: 1.18, punish: 1.2, jump: 0.42, special: 0.7,
    preferredRange: 112, centerBias: 1.28, poke: "crouchKick"
  },
  default: {
    aggression: 1, defense: 1, punish: 1, jump: 1, special: 1,
    preferredRange: 104, centerBias: 1, poke: "kick"
  }
};
const AI_STATES = {
  NEUTRAL: "NEUTRAL", APPROACH: "APPROACH", RETREAT: "RETREAT", PRESSURE: "PRESSURE",
  DEFEND: "DEFEND", PUNISH: "PUNISH", ANTI_AIR: "ANTI_AIR", WAKEUP: "WAKEUP",
  COMBO: "COMBO", RECOVER: "RECOVER"
};
const specialTuning = {
  dash: {
    startup: 10,
    travelFrames: 12,
    recovery: 38,
    speed: 11.5,
    range: 110,
    damage: 14
  }
};
const floorY = physics.floorY;
const playerSpeed = physics.playerSpeed;
const rivalAdvanceSpeed = physics.rivalAdvanceSpeed;
const rivalRetreatSpeed = physics.rivalRetreatSpeed;
const jumpVelocity = physics.jumpVelocity;
const jumpRiseGravity = physics.jumpRiseGravity;
const jumpFallGravity = physics.jumpFallGravity;
const walkFrameTicks = timing.walkFrameTicks;
const backwalkFrameTicks = timing.backwalkFrameTicks;
const knockdownFrameTicks = timing.knockdownFrameTicks;
const knockdownDuration = timing.knockdownDuration;
const knockoutImpactHold = timing.knockoutImpactHold;
const roundIntroFreezeFrames = timing.roundIntroFreezeFrames;
const knockoutLaunchVelocity = physics.knockoutLaunchVelocity;
const knockoutRiseGravity = physics.knockoutRiseGravity;
const knockoutFallGravity = physics.knockoutFallGravity;
const knockoutSlideSpeed = physics.knockoutSlideSpeed;
const knockoutSlowMoInterval = timing.knockoutSlowMoInterval;
const stepMs = 1000 / timing.fps;
const maxFrameCatchupMs = timing.maxFrameCatchupMs;
const keys = new Set();
const pressed = new Set();
const released = new Set();
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
const lincolnHitSprite = new Image();
lincolnHitSprite.src = "assets/lincoln-hit-game.png";
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
const washingtonFlyingKickSprite = new Image();
washingtonFlyingKickSprite.src = "assets/washington-flying-kick.png";
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
const washingtonVictorySprites = [1, 2, 3, 4].map((frame) => {
  const image = new Image();
  image.src = `assets/washington-victory-${frame}.png`;
  return image;
});
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
const criticalImages = [
  lincolnSprite,
  lincolnPunchSprite,
  lincolnKickSprite,
  lincolnHitSprite,
  lincolnCrouchSprite,
  lincolnCrouchPunchSprite,
  lincolnCrouchKickSprite,
  lincolnBlockSprite,
  lincolnCrouchBlockSprite,
  lincolnHatSprite,
  ...lincolnKnockdownSprites,
  ...lincolnWalkSprites,
  ...lincolnJumpSprites,
  washingtonSprite,
  washingtonPunchSprite,
  washingtonKickSprite,
  washingtonFlyingKickSprite,
  washingtonCrouchSprite,
  washingtonCrouchBlockSprite,
  washingtonCrouchPunchSprite,
  washingtonCrouchKickSprite,
  washingtonHitSprite,
  washingtonBlockSprite,
  ...washingtonVictorySprites,
  ...washingtonKnockdownSprites,
  ...washingtonWalkSprites,
  ...washingtonBackwalkSprites,
  ...washingtonJumpSprites
];
const optionalImages = [stageImage, impactSparkSprite];
const allImages = [...criticalImages, ...optionalImages];

allImages.forEach((image) => {
  image.failed = false;
  image.addEventListener("error", () => {
    image.failed = true;
  });
});

// Tune anchorX / anchorY per frame here if feet drift.
// anchorX is source-crop pixels before scaling.
// anchorY is source-crop pixels before scaling, usually crop.h for foot baseline.
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
  flyingKick: {
    image: washingtonFlyingKickSprite,
    crop: { x: 91, y: 150, w: 1177, h: 718 },
    height: 146,
    offsetX: 0,
    anchorX: 500
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
  { image: washingtonWalkSprites[0], crop: { x: 0, y: 125, w: 362, h: 510 }, height: 238, offsetX: -2 },
  { image: washingtonWalkSprites[1], crop: { x: 0, y: 125, w: 362, h: 510 }, height: 238, offsetX: 0 },
  { image: washingtonWalkSprites[2], crop: { x: 0, y: 125, w: 362, h: 510 }, height: 238, offsetX: 1 },
  { image: washingtonWalkSprites[3], crop: { x: 0, y: 125, w: 362, h: 510 }, height: 238, offsetX: 0 },
  { image: washingtonWalkSprites[4], crop: { x: 0, y: 125, w: 330, h: 510 }, height: 238, offsetX: -3 }
];
const washingtonVictoryFrames = [
  { image: washingtonVictorySprites[0], crop: { x: 55, y: 93, w: 348, h: 544 }, height: 238, offsetX: 0, anchorX: 174 },
  { image: washingtonVictorySprites[1], crop: { x: 84, y: 90, w: 347, h: 558 }, height: 238, offsetX: 0, anchorX: 173 },
  { image: washingtonVictorySprites[2], crop: { x: 60, y: 56, w: 409, h: 598 }, height: 238, offsetX: 0, anchorX: 164 },
  { image: washingtonVictorySprites[3], crop: { x: 65, y: 57, w: 401, h: 597 }, height: 238, offsetX: 0, anchorX: 135 }
];
const washingtonBackwalkFrames = washingtonBackwalkSprites.map((image, index) => ({
  image,
  crop: { x: 0, y: 30, w: 436, h: 630 },
  height: 238,
  offsetX: [0, -1, -2, -1, 0][index]
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
// Tune anchorX / anchorY per frame here if feet drift.
// anchorX is source-crop pixels before scaling.
// anchorY is source-crop pixels before scaling, usually crop.h for foot baseline.
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
  hit: {
    image: lincolnHitSprite,
    crop: { x: 0, y: 0, w: 159, h: 270 },
    height: 270,
    offsetX: 15
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
  { image: lincolnKnockdownSprites[0], crop: { x: 0, y: 0, w: 199, h: 158 }, height: 158, offsetX: -4, lift: 58, shadowWidth: 84, hatAnchor: { x: -82, y: -218 } },
  { image: lincolnKnockdownSprites[1], crop: { x: 0, y: 0, w: 206, h: 138 }, height: 138, offsetX: 0, lift: 34, shadowWidth: 94 },
  { image: lincolnKnockdownSprites[2], crop: { x: 0, y: 0, w: 202, h: 103 }, height: 103, offsetX: 4, lift: 7, shadowWidth: 106 },
  { image: lincolnKnockdownSprites[3], crop: { x: 0, y: 0, w: 263, h: 93 }, height: 93, offsetX: 6, shadowWidth: 122 },
  { image: lincolnKnockdownSprites[4], crop: { x: 0, y: 0, w: 275, h: 52 }, height: 52, offsetX: 6, shadowWidth: 132 }
];

const tuningGroups = [
  { fighter: "Washington", label: "washington idle", frames: [washingtonFrames.idle] },
  { fighter: "Washington", label: "washington walk forward", frames: washingtonWalkFrames },
  { fighter: "Washington", label: "washington walk back", frames: washingtonBackwalkFrames },
  { fighter: "Washington", label: "washington jump", frames: washingtonJumpFrames },
  { fighter: "Washington", label: "washington punch", frames: [washingtonFrames.punch], move: "punch" },
  { fighter: "Washington", label: "washington kick", frames: [washingtonFrames.kick], move: "kick" },
  { fighter: "Washington", label: "washington flying kick", frames: [washingtonFrames.flyingKick], move: "kick" },
  { fighter: "Washington", label: "washington crouch", frames: [washingtonFrames.crouch] },
  { fighter: "Washington", label: "washington crouch punch", frames: [washingtonFrames.crouchPunch], move: "crouchPunch" },
  { fighter: "Washington", label: "washington crouch kick", frames: [washingtonFrames.crouchKick], move: "crouchKick" },
  { fighter: "Washington", label: "washington block", frames: [washingtonFrames.block] },
  { fighter: "Washington", label: "washington crouch block", frames: [washingtonFrames.crouchBlock] },
  { fighter: "Washington", label: "washington hit", frames: [washingtonFrames.hit] },
  { fighter: "Washington", label: "washington victory", frames: washingtonVictoryFrames },
  { fighter: "Washington", label: "washington knockdown", frames: washingtonKnockdownFrames },
  { fighter: "Lincoln", label: "lincoln idle", frames: [lincolnFrames.idle] },
  { fighter: "Lincoln", label: "lincoln walk", frames: lincolnWalkFrames },
  { fighter: "Lincoln", label: "lincoln jump", frames: lincolnJumpFrames },
  { fighter: "Lincoln", label: "lincoln punch", frames: [lincolnFrames.punch], move: "punch" },
  { fighter: "Lincoln", label: "lincoln kick", frames: [lincolnFrames.kick], move: "kick" },
  { fighter: "Lincoln", label: "lincoln crouch", frames: [lincolnFrames.crouch] },
  { fighter: "Lincoln", label: "lincoln crouch punch", frames: [lincolnFrames.crouchPunch], move: "crouchPunch" },
  { fighter: "Lincoln", label: "lincoln crouch kick", frames: [lincolnFrames.crouchKick], move: "crouchKick" },
  { fighter: "Lincoln", label: "lincoln block", frames: [lincolnFrames.block] },
  { fighter: "Lincoln", label: "lincoln crouch block", frames: [lincolnFrames.crouchBlock] },
  { fighter: "Lincoln", label: "lincoln hit", frames: [lincolnFrames.hit] },
  { fighter: "Lincoln", label: "lincoln knockdown", frames: lincolnKnockdownFrames }
];

// startup = frames before hitbox becomes active
// active = frames hitbox can hit
// recovery = frames before next action
const moveDefs = {
  // TODO: A simple close throw can live here later as a move with a short
  // range and no block check. Keeping it out of this pass avoids destabilizing
  // the startup/active/recovery polish.
  punch: {
    startup: 4,
    active: 4,
    recovery: 11,
    damage: 6,
    hitbox: { x: 20, y: -132, w: 66, h: 44 },
    attackType: "punch",
    label: "PUNCH"
  },
  kick: {
    startup: 7,
    active: 5,
    recovery: 20,
    damage: 9,
    hitbox: { x: 22, y: -110, w: 84, h: 38 },
    attackType: "kick",
    label: "KICK"
  },
  crouchPunch: {
    startup: 5,
    active: 4,
    recovery: 13,
    damage: 6,
    hitbox: { x: 18, y: -82, w: 76, h: 42 },
    attackType: "crouch-punch",
    label: "PUNCH"
  },
  crouchKick: {
    startup: 7,
    active: 6,
    recovery: 20,
    damage: 9,
    hitbox: { x: 18, y: -58, w: 116, h: 34 },
    attackType: "crouch-kick",
    label: "KICK"
  }
};

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
let combatEvents = [];
let roundTimer = timing.roundDurationFrames;
const roundsToWin = 2;
let playerRoundWins = 0;
let rivalRoundWins = 0;
let roundNumber = 1;
let roundTransitionToken = 0;
let matchPlayerData = presidents[0];
let matchRivalData = presidents[1];
let cpuEnabled = true;
let aiDifficulty = "normal";
let debugBoxes = false;
let assetsReady = false;
// Hit pause freezes combat simulation for a few frames after impact. KO slow
// motion is different: it lets the simulation continue, just at a lower rate.
let hitPauseFrames = 0;
let tuningMode = false;
let tuningTarget = "player";
let tuningGroupIndex = 0;
let tuningFrameIndex = 0;

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
    currentMove: null,
    moveAge: 0,
    hasHitThisMove: false,
    special: 0,
    specialDashDelay: 0,
    specialDashFrames: 0,
    specialDashSpeed: 0,
    block: false,
    blockType: "",
    stunType: "",
    hurt: 0,
    hitReact: 0,
    aiBlockTimer: 0,
    aiState: AI_STATES.NEUTRAL,
    aiIntent: { action: "idle", framesLeft: 0 },
    aiDecisionTimer: 0,
    aiObservationBuffer: [],
    aiTopScores: [],
    aiJumpCooldown: 0,
    aiSpecialCooldown: 0,
    aiComboRemaining: 0,
    aiHabits: { jump: 0, crouchAttack: 0, retreat: 0 },
    jumpBuffer: 0,
    knockdown: 0,
    knockdownAge: 0,
    knockdownLanded: 0,
    knockdownDir: 0,
    hatDrift: 0,
    hatLift: 0,
    hatSpin: 0,
    crouching: false,
    jumping: false,
    victory: false,
    victoryAge: 0,
    state: "idle",
    lastState: "",
    animFrame: 0,
    animTick: 0,
    stateAge: 0,
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
  matchPlayerData = p;
  matchRivalData = r;
  playerRoundWins = 0;
  rivalRoundWins = 0;
  roundNumber = 1;
  roundTransitionToken += 1;
  startRound(p, r);
  updateMoveCards();
}

function startRound(p = matchPlayerData, r = matchRivalData) {
  player = makeFighter(p, 190, 1, true);
  rival = makeFighter(r, 730, -1, false);
  projectiles = [];
  hitSparks = [];
  combatEvents = [];
  hitPauseFrames = 0;
  tuningMode = false;
  pressed.clear();
  released.clear();
  roundTimer = timing.roundDurationFrames;
  roundText = `ROUND ${roundNumber}`;
  roundTextTimer = 130;
  running = true;
  gameOver = false;
  roundEndQueued = false;
  lastFrameTime = 0;
  frameLag = 0;
  overlay.classList.add("hidden");
}

function finishRound(winner) {
  if (roundEndQueued) return;
  roundEndQueued = true;
  running = false;
  clearCombatEvents();
  projectiles = [];
  if (winner === player) playerRoundWins += 1;
  if (winner === rival) rivalRoundWins += 1;
  if (winner) startVictoryPose(winner);

  const matchWinner = playerRoundWins >= roundsToWin ? player : rivalRoundWins >= roundsToWin ? rival : null;
  roundText = matchWinner
    ? `${matchWinner === player ? "PLAYER" : "RIVAL"} WINS MATCH`
    : winner
      ? `${winner === player ? "PLAYER" : "RIVAL"} WINS ROUND`
      : "DRAW";
  roundTextTimer = 999;

  const token = ++roundTransitionToken;
  setTimeout(() => {
    if (token !== roundTransitionToken) return;
    if (matchWinner) {
      overlay.classList.remove("hidden");
      return;
    }
    roundNumber += 1;
    startRound();
  }, 1000);
}

function startVictoryPose(f) {
  f.vx = 0;
  f.vy = 0;
  f.jumping = false;
  f.crouching = false;
  f.block = false;
  f.blockType = "";
  f.currentMove = null;
  f.attack = 0;
  f.attackType = "";
  f.special = 0;
  f.victory = true;
  f.victoryAge = 0;
  setFighterState(f, "victory");
}

function stepVictoryPoses() {
  [player, rival].forEach((f) => {
    if (f.victory) f.victoryAge += 1;
  });
}

function resetPositionsOnly() {
  // Training reset preserves health and timer so repeated spacing tests do not
  // erase the situation. Shift+R does the full health/timer reset.
  roundTransitionToken += 1;
  player.x = 190;
  rival.x = 730;
  player.y = floorY;
  rival.y = floorY;
  player.dir = 1;
  rival.dir = -1;
  [player, rival].forEach(clearFighterForTraining);
  projectiles = [];
  hitSparks = [];
  combatEvents = [];
  hitPauseFrames = 0;
  pressed.clear();
  released.clear();
  shake = 0;
  gameOver = false;
  running = true;
  roundEndQueued = false;
  roundText = "TRAINING RESET";
  roundTextTimer = 42;
  overlay.classList.add("hidden");
}

function clearFighterForTraining(f) {
  f.vx = 0;
  f.vy = 0;
  f.cooldown = 0;
  f.attack = 0;
  f.attackType = "";
  f.currentMove = null;
  f.moveAge = 0;
  f.hasHitThisMove = false;
  f.special = 0;
  f.specialDashDelay = 0;
  f.specialDashFrames = 0;
  f.specialDashSpeed = 0;
  f.block = false;
  f.blockType = "";
  f.stunType = "";
  f.hurt = 0;
  f.hitReact = 0;
  f.aiBlockTimer = 0;
  f.aiState = AI_STATES.NEUTRAL;
  f.aiIntent = { action: "idle", framesLeft: 0 };
  f.aiDecisionTimer = 0;
  f.aiObservationBuffer = [];
  f.aiTopScores = [];
  f.aiJumpCooldown = 0;
  f.aiSpecialCooldown = 0;
  f.aiComboRemaining = 0;
  f.aiHabits = { jump: 0, crouchAttack: 0, retreat: 0 };
  f.jumpBuffer = 0;
  f.knockdown = 0;
  f.knockdownAge = 0;
  f.knockdownLanded = 0;
  f.knockdownDir = 0;
  f.hatDrift = 0;
  f.hatLift = 0;
  f.hatSpin = 0;
  f.crouching = false;
  f.jumping = false;
  f.victory = false;
  f.victoryAge = 0;
  setFighterState(f, "idle");
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

function getPushBox(f) {
  if (f.knockdown > 0) return { x: f.x - 46, y: floorY - 34, w: 92, h: 32 };
  // Airborne pushboxes stay around the fighter's lower body. A full standing
  // column here makes jump-over crossups feel like an invisible wall.
  if (f.jumping) return { x: f.x - 26, y: f.y - 72, w: 52, h: 68 };
  const width = f.crouching ? 68 : 72;
  const height = f.crouching ? 92 : 142;
  return { x: f.x - width / 2, y: f.y - height, w: width, h: height };
}

function getHurtBox(f) {
  if (f.knockdown > 0) return { x: f.x - 92, y: floorY - 58, w: 184, h: 58 };
  if (f.jumping) return { x: f.x - 36, y: f.y - 150, w: 72, h: 132 };
  if (f.crouching) return { x: f.x - 38, y: f.y - 100, w: 76, h: 96 };
  return { x: f.x - 38, y: f.y - 154, w: 76, h: 150 };
}

function getAttackBox(f, moveDef) {
  if (!moveDef) return null;
  const box = moveDef.hitbox;
  return {
    x: f.dir > 0 ? f.x + box.x : f.x - box.x - box.w,
    y: f.y + box.y,
    w: box.w,
    h: box.h
  };
}

function resolveFighterOverlap(a, b) {
  if (a.knockdown > 0 || b.knockdown > 0) return;
  // Once a jumper has cleared the standing fighter's upper body, allow the
  // horizontal crossover. Facing updates after movement handle the side swap.
  if ((a.jumping && floorY - a.y > 78) || (b.jumping && floorY - b.y > 78)) return;
  let aBox = getPushBox(a);
  let bBox = getPushBox(b);
  if (!intersects(aBox, bBox)) return;
  const overlap = Math.min(aBox.x + aBox.w - bBox.x, bBox.x + bBox.w - aBox.x);
  if (overlap <= 0) return;
  const dir = a.x <= b.x ? 1 : -1;
  const aLocked = a.currentMove || a.block || a.hurt > 0;
  const bLocked = b.currentMove || b.block || b.hurt > 0;
  const aAtWall = a.x <= 58 || a.x >= W - 58;
  const bAtWall = b.x <= 58 || b.x >= W - 58;
  let aShare = aLocked && !bLocked ? 0.25 : bLocked && !aLocked ? 0.75 : 0.5;
  if (aAtWall && !bAtWall) aShare = 0;
  if (bAtWall && !aAtWall) aShare = 1;
  a.x = clamp(a.x - dir * overlap * aShare, 56, W - 56);
  b.x = clamp(b.x + dir * overlap * (1 - aShare), 56, W - 56);

  // One small correction pass handles wall clamps without creating jitter.
  aBox = getPushBox(a);
  bBox = getPushBox(b);
  if (!intersects(aBox, bBox)) return;
  const extra = Math.min(aBox.x + aBox.w - bBox.x, bBox.x + bBox.w - aBox.x);
  if (extra <= 0) return;
  if (a.x <= 56 || a.x >= W - 56) b.x = clamp(b.x + dir * extra, 56, W - 56);
  else if (b.x <= 56 || b.x >= W - 56) a.x = clamp(a.x - dir * extra, 56, W - 56);
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function imageReady(image) {
  return image && !image.failed && image.complete && image.naturalWidth > 0;
}

function imagesReady(images) {
  return images.every(imageReady);
}

function imagesSettled(images) {
  return images.every((image) => imageReady(image) || image.failed);
}

function randomInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

// Sprite frames are planted by their anchor. By default, the anchor is the
// bottom center of the cropped source image, which keeps older frame data safe.
function normalizedFrame(frame) {
  const scale = frame.height / frame.crop.h;
  return {
    ...frame,
    displayW: Math.round(frame.crop.w * scale),
    displayH: frame.height,
    scale,
    anchorX: frame.anchorX ?? frame.crop.w / 2,
    anchorY: frame.anchorY ?? frame.crop.h,
    offsetX: frame.offsetX || 0,
    lift: frame.lift || 0,
    shadowWidth: frame.shadowWidth
  };
}

function tuningTargetFighter() {
  return tuningTarget === "player" ? player : rival;
}

function tuningGroupsForTarget() {
  const name = tuningTargetFighter().data.name;
  const groups = tuningGroups.filter((group) => group.fighter === name);
  return groups.length ? groups : tuningGroups.filter((group) => group.fighter === "Washington");
}

function currentTuningGroup() {
  const groups = tuningGroupsForTarget();
  tuningGroupIndex = (tuningGroupIndex + groups.length) % groups.length;
  return groups[tuningGroupIndex];
}

function currentTuningFrame() {
  const group = currentTuningGroup();
  tuningFrameIndex = (tuningFrameIndex + group.frames.length) % group.frames.length;
  return group.frames[tuningFrameIndex];
}

function currentTuningFrameLabel() {
  const group = currentTuningGroup();
  return `${group.label} ${tuningFrameIndex + 1}/${group.frames.length}`;
}

function tuningFrameImageLabel(frame) {
  const collections = [
    ["washingtonWalkSprites", washingtonWalkSprites],
    ["washingtonBackwalkSprites", washingtonBackwalkSprites],
    ["washingtonJumpSprites", washingtonJumpSprites],
    ["washingtonKnockdownSprites", washingtonKnockdownSprites],
    ["lincolnWalkSprites", lincolnWalkSprites],
    ["lincolnJumpSprites", lincolnJumpSprites],
    ["lincolnKnockdownSprites", lincolnKnockdownSprites]
  ];
  for (const [label, images] of collections) {
    const index = images.indexOf(frame.image);
    if (index >= 0) return `${label}[${index}]`;
  }
  const singles = [
    ["washingtonSprite", washingtonSprite],
    ["washingtonPunchSprite", washingtonPunchSprite],
    ["washingtonKickSprite", washingtonKickSprite],
    ["washingtonFlyingKickSprite", washingtonFlyingKickSprite],
    ["washingtonCrouchSprite", washingtonCrouchSprite],
    ["washingtonCrouchPunchSprite", washingtonCrouchPunchSprite],
    ["washingtonCrouchKickSprite", washingtonCrouchKickSprite],
    ["washingtonBlockSprite", washingtonBlockSprite],
    ["washingtonCrouchBlockSprite", washingtonCrouchBlockSprite],
    ["washingtonHitSprite", washingtonHitSprite],
    ["lincolnSprite", lincolnSprite],
    ["lincolnPunchSprite", lincolnPunchSprite],
    ["lincolnKickSprite", lincolnKickSprite],
    ["lincolnCrouchSprite", lincolnCrouchSprite],
    ["lincolnCrouchPunchSprite", lincolnCrouchPunchSprite],
    ["lincolnCrouchKickSprite", lincolnCrouchKickSprite],
    ["lincolnBlockSprite", lincolnBlockSprite],
    ["lincolnCrouchBlockSprite", lincolnCrouchBlockSprite],
    ["lincolnHitSprite", lincolnHitSprite]
  ];
  return singles.find(([, image]) => image === frame.image)?.[0] || "image";
}

function tuningFrameObject(frame) {
  const nf = normalizedFrame(frame);
  return {
    image: tuningFrameImageLabel(frame),
    crop: { ...frame.crop },
    height: frame.height,
    anchorX: frame.anchorX ?? nf.anchorX,
    anchorY: frame.anchorY ?? nf.anchorY,
    offsetX: frame.offsetX || 0,
    lift: frame.lift || 0
  };
}

function tuningFrameObjectText(frame) {
  const meta = tuningFrameObject(frame);
  return `{ image: ${meta.image}, crop: { x: ${meta.crop.x}, y: ${meta.crop.y}, w: ${meta.crop.w}, h: ${meta.crop.h} }, height: ${meta.height}, anchorX: ${meta.anchorX}, anchorY: ${meta.anchorY}, offsetX: ${meta.offsetX}, lift: ${meta.lift} }`;
}

function logTuningFrame(frame, label) {
  console.log(`${label}\n${tuningFrameObjectText(frame)}`);
}

function adjustTuningFrame(event) {
  const frame = currentTuningFrame();
  const nf = normalizedFrame(frame);
  const amount = event.ctrlKey ? 5 : 1;
  if (event.altKey && (event.code === "ArrowUp" || event.code === "ArrowDown")) {
    frame.height = Math.max(1, frame.height + (event.code === "ArrowUp" ? amount : -amount));
  } else if (event.shiftKey) {
    frame.anchorX ??= nf.anchorX;
    frame.anchorY ??= nf.anchorY;
    if (event.code === "ArrowLeft") frame.anchorX -= amount;
    if (event.code === "ArrowRight") frame.anchorX += amount;
    if (event.code === "ArrowUp") frame.anchorY -= amount;
    if (event.code === "ArrowDown") frame.anchorY += amount;
  } else {
    frame.offsetX = (frame.offsetX || 0) + (event.code === "ArrowLeft" ? -amount : event.code === "ArrowRight" ? amount : 0);
    frame.lift = (frame.lift || 0) + (event.code === "ArrowUp" ? amount : event.code === "ArrowDown" ? -amount : 0);
  }
  logTuningFrame(frame, currentTuningFrameLabel());
}

function cycleTuningFrame(amount, groups = false) {
  if (groups) {
    tuningGroupIndex += amount;
    tuningFrameIndex = 0;
  } else {
    tuningFrameIndex += amount;
  }
  logTuningFrame(currentTuningFrame(), currentTuningFrameLabel());
}

function toggleTuningMode() {
  tuningMode = !tuningMode;
  hitPauseFrames = 0;
  projectiles = [];
  hitSparks = [];
  clearCombatEvents();
  [player, rival].forEach(clearFighterForTraining);
  roundText = tuningMode ? "TUNING MODE" : "FIGHT";
  roundTextTimer = tuningMode ? 999 : 42;
  if (tuningMode) logTuningFrame(currentTuningFrame(), currentTuningFrameLabel());
}

function setFighterState(f, state) {
  if (f.state === state) return;
  f.lastState = f.state;
  f.state = state;
  f.animFrame = 0;
  f.animTick = 0;
  f.stateAge = 0;
}

function advanceAnimation(f, frameList, ticksPerFrame, loop = true) {
  if (!frameList.length) return 0;
  const frameIndex = clamp(f.animFrame, 0, frameList.length - 1);
  f.animTick += 1;
  if (f.animTick >= ticksPerFrame) {
    f.animTick = 0;
    f.animFrame = loop ? (frameIndex + 1) % frameList.length : Math.min(frameIndex + 1, frameList.length - 1);
  }
  return f.animFrame;
}

function movePhase(f) {
  const def = currentMoveDef(f);
  if (!def) return "";
  if (f.moveAge < def.startup) return "startup";
  if (f.moveAge < def.startup + def.active) return "active";
  return "recovery";
}

function canAct(f) {
  return f.knockdown <= 0 && f.hurt <= 0;
}

function canStartMove(f) {
  return canAct(f) && !f.currentMove && f.cooldown <= 0;
}

function canStartSpecial(f) {
  return canStartMove(f) && f.energy >= damageTuning.specialEnergyCost;
}

function canBlock(f) {
  return canAct(f) && !f.currentMove && !f.jumping && f.specialDashFrames <= 0;
}

function canMove(f) {
  return canAct(f) && !f.currentMove && !f.block && f.specialDashFrames <= 0;
}

function update() {
  tick += 1;
  if (!running) {
    stepVictoryPoses();
    pressed.clear();
    released.clear();
    return;
  }

  if (tuningMode) {
    pressed.clear();
    released.clear();
    return;
  }

  if (hitPauseFrames > 0) {
    hitPauseFrames -= 1;
    hitSparks = hitSparks.filter((s) => --s.life > 0);
    shake = Math.max(0, shake - 1);
    pressed.clear();
    released.clear();
    return;
  }

  updateFacing(player, rival);
  if (!gameOver) {
    if (roundTimer > 0 && roundTextTimer < roundIntroFreezeFrames) roundTimer -= 1;
    if (roundTimer <= 0) endRoundOnTime();
  }

  if (!gameOver) {
    controlPlayer();
    controlAI();
  }
  stepFighter(player, rival);
  stepFighter(rival, player);
  resolveFighterOverlap(player, rival);
  updateFacing(player, rival);
  updateMove(player, rival);
  updateMove(rival, player);
  stepCombatEvents();
  if (!gameOver) stepProjectiles();
  updateFighterAnimationState(player);
  updateFighterAnimationState(rival);
  hitSparks = hitSparks.filter((s) => --s.life > 0);
  shake = Math.max(0, shake - 1);
  roundTextTimer = Math.max(0, roundTextTimer - 1);

  if (!gameOver && (player.hp <= 0 || rival.hp <= 0)) {
    gameOver = true;
    clearCombatEvents();
    projectiles = [];
    const defeated = player.hp <= 0 ? player : rival;
    defeated.attack = 0;
    defeated.attackType = "";
    defeated.currentMove = null;
    startKnockdown(defeated, defeated === player ? rival.dir : player.dir);
    roundText = "K.O.";
    roundTextTimer = 999;
  }

  if (gameOver && (player.hp <= 0 || rival.hp <= 0)) {
    const defeated = player.hp <= 0 ? player : rival;
    if (defeated.knockdown <= 1) {
      defeated.knockdown = 1;
      defeated.y = floorY;
      defeated.vx = 0;
      defeated.vy = 0;
      defeated.jumping = false;
      finishRound(player.hp > rival.hp ? player : rival);
    }
  }
  pressed.clear();
  released.clear();
}

function updateFacing(a, b) {
  if (a.knockdown <= 0) a.dir = b.x >= a.x ? 1 : -1;
  if (b.knockdown <= 0) b.dir = a.x >= b.x ? 1 : -1;
}

function updateFighterAnimationState(f) {
  let nextState = "idle";
  if (f.victory) nextState = "victory";
  else if (f.knockdown > 0) nextState = "knockdown";
  else if (f.stunType === "block") nextState = f.blockType === "crouching" ? "crouchBlock" : "block";
  else if (f.hitReact > 0 || f.stunType === "hit") nextState = "hurt";
  else if (f.currentMove) nextState = f.attackType || f.currentMove;
  else if (f.jumping) nextState = "jump";
  else if (f.crouching && f.blockType === "crouching") nextState = "crouchBlock";
  else if (f.crouching) nextState = "crouch";
  else if (f.blockType === "standing") nextState = "block";
  else if (Math.abs(f.vx) > 0.2) nextState = Math.sign(f.vx) === f.dir ? "walkForward" : "walkBack";

  setFighterState(f, nextState);

  if (nextState === "walkForward") {
    const frames = f.data.name === "Lincoln" ? lincolnWalkCycle : washingtonWalkFrames;
    advanceAnimation(f, frames, walkFrameTicks);
  } else if (nextState === "walkBack") {
    const frames = f.data.name === "Washington" ? washingtonBackwalkCycle : lincolnWalkCycle;
    advanceAnimation(f, frames, backwalkFrameTicks);
  }
  f.stateAge += 1;
}

function endRoundOnTime() {
  gameOver = true;
  finishRound(player.hp === rival.hp ? null : player.hp > rival.hp ? player : rival);
}

function controlPlayer() {
  if (canAct(player)) player.crouching = keys.has("KeyS") && !player.jumping;
  else if (player.stunType !== "block") player.crouching = false;
  player.vx = 0;
  if (!canMove(player)) player.crouching = player.crouching && !player.jumping;
  if (!player.crouching && canMove(player) && keys.has("KeyA")) player.vx -= playerSpeed;
  if (!player.crouching && canMove(player) && keys.has("KeyD")) player.vx += playerSpeed;
  if (keys.has("Space") && canBlock(player)) player.blockType = player.crouching ? "crouching" : "standing";
  else if (player.stunType !== "block") player.blockType = "";
  player.block = player.blockType !== "";
  if (player.jumpBuffer > 0 && canMove(player) && !player.jumping && !player.crouching) {
    player.vy = jumpVelocity;
    player.jumping = true;
    player.jumpBuffer = 0;
  }
  player.jumpBuffer = Math.max(0, player.jumpBuffer - 1);
  if (pressed.has("KeyJ")) startMove(player, player.crouching ? "crouchPunch" : "punch");
  if (pressed.has("KeyK")) startMove(player, player.crouching ? "crouchKick" : "kick");
  if (pressed.has("KeyL")) startSpecial(player, rival);
}

// CPU AI: delayed observation + state machine + utility scores. Intents map
// back into the same movement, block, move, and special functions as players.
function controlAI() {
  const ai = rival;
  const opponent = player;
  ai.vx = 0;
  ai.aiJumpCooldown = Math.max(0, ai.aiJumpCooldown - 1);
  ai.aiSpecialCooldown = Math.max(0, ai.aiSpecialCooldown - 1);
  ai.aiDecisionTimer = Math.max(0, ai.aiDecisionTimer - 1);
  if (!cpuEnabled) {
    clearAIBlock(ai);
    return;
  }

  rememberAIObservation(ai, opponent);
  if (ai.aiBlockTimer > 0 && canBlock(ai)) {
    ai.aiBlockTimer -= 1;
    ai.blockType = ai.crouching ? "crouching" : "standing";
    ai.block = true;
    ai.aiState = AI_STATES.DEFEND;
    return;
  }
  if (ai.stunType !== "block") clearAIBlock(ai);

  const config = AI_DIFFICULTY[aiDifficulty];
  const observed = delayedAIObservation(ai, config.reactionDelayFrames);
  if (ai.aiDecisionTimer <= 0 || ai.aiIntent.framesLeft <= 0) {
    ai.aiIntent = getAIIntent(ai, opponent, observed, config);
    ai.aiDecisionTimer = config.decisionIntervalFrames + randomInt(-3, 4);
  }
  applyAIIntent(ai, opponent, ai.aiIntent, config);
  ai.aiIntent.framesLeft = Math.max(0, ai.aiIntent.framesLeft - 1);
}

function rememberAIObservation(ai, opponent) {
  const prior = ai.aiObservationBuffer.at(-1);
  const snapshot = {
    x: opponent.x,
    y: opponent.y,
    hp: opponent.hp,
    vx: opponent.vx,
    jumping: opponent.jumping,
    crouching: opponent.crouching,
    blocking: opponent.blockType !== "",
    attacking: isOpponentAttacking(opponent),
    vulnerable: isOpponentVulnerable(opponent),
    movePhase: movePhase(opponent),
    knockdown: opponent.knockdown > 0
  };
  ai.aiObservationBuffer.push(snapshot);
  if (ai.aiObservationBuffer.length > 72) ai.aiObservationBuffer.shift();
  if (snapshot.jumping && !prior?.jumping) ai.aiHabits.jump = Math.min(8, ai.aiHabits.jump + 1);
  if (snapshot.crouching && snapshot.attacking && !prior?.attacking) ai.aiHabits.crouchAttack = Math.min(8, ai.aiHabits.crouchAttack + 1);
  if (Math.abs(snapshot.vx) > 0.2 && Math.abs(snapshot.x - ai.x) > Math.abs((prior?.x ?? snapshot.x) - ai.x)) {
    ai.aiHabits.retreat = Math.min(8, ai.aiHabits.retreat + 0.08);
  }
  ai.aiHabits.jump *= 0.997;
  ai.aiHabits.crouchAttack *= 0.997;
  ai.aiHabits.retreat *= 0.997;
}

function delayedAIObservation(ai, delay) {
  const index = Math.max(0, ai.aiObservationBuffer.length - 1 - delay);
  return ai.aiObservationBuffer[index] || ai.aiObservationBuffer[0] || {
    x: player.x, y: player.y, hp: player.hp, vx: 0, jumping: false, crouching: false,
    blocking: false, attacking: false, vulnerable: false, movePhase: "", knockdown: false
  };
}

function getAIIntent(ai, opponent, observed, config) {
  const personality = AI_PERSONALITY[ai.data.name] || AI_PERSONALITY.default;
  const distance = Math.abs(ai.x - observed.x);
  const centerDistance = Math.abs(ai.x - W / 2);
  const nearWall = ai.x < 112 || ai.x > W - 112;
  const close = distance < 118;
  const scores = [
    scoredAIAction("idle", 8, AI_STATES.NEUTRAL),
    scoredAIAction("approach", distance > personality.preferredRange ? 38 + distance * 0.12 : 2, AI_STATES.APPROACH),
    scoredAIAction("retreat", distance < 80 ? 36 : nearWall ? 2 : 9, AI_STATES.RETREAT),
    scoredAIAction("punch", close ? 46 * config.aggression * personality.aggression : 0, AI_STATES.PRESSURE),
    scoredAIAction(personality.poke, distance < 145 ? 38 * config.aggression * personality.aggression : 0, AI_STATES.PRESSURE),
    scoredAIAction("block", observed.attacking && distance < 176 ? 74 * config.defense * personality.defense * config.blockChance : 0, AI_STATES.DEFEND),
    scoredAIAction("punish", observed.vulnerable && distance < 138 ? 82 * config.punishChance * personality.punish : 0, AI_STATES.PUNISH),
    scoredAIAction("antiAir", observed.jumping && distance < 158 ? (66 + ai.aiHabits.jump * 5) * config.antiAirChance : 0, AI_STATES.ANTI_AIR),
    scoredAIAction("special", distance > 130 && distance < 330 && ai.aiSpecialCooldown <= 0 ? 34 * config.specialChance * personality.special : 0, AI_STATES.NEUTRAL),
    scoredAIAction("jump", distance > 150 && ai.aiJumpCooldown <= 0 ? 18 * config.jumpChance * personality.jump : 0, AI_STATES.NEUTRAL),
    scoredAIAction("center", centerDistance > 180 && distance > 120 ? 22 * personality.centerBias : 0, AI_STATES.APPROACH)
  ];

  if (ai.knockdown > 0) return aiIntent(ai, "idle", AI_STATES.WAKEUP, 8, scores);
  if (!canAct(ai) || ai.currentMove) return aiIntent(ai, "idle", AI_STATES.RECOVER, 8, scores);
  if (ai.aiComboRemaining > 0 && close) return aiIntent(ai, "combo", AI_STATES.COMBO, 8, scores);
  if (Math.random() < config.mistakeChance) {
    return aiIntent(ai, Math.random() < 0.55 ? "idle" : "retreat", AI_STATES.NEUTRAL, randomInt(8, 18), scores);
  }
  const chosen = chooseWeightedAction(scores, config);
  return aiIntent(ai, chosen.action, chosen.state, randomInt(8, 18), scores);
}

function scoredAIAction(action, score, state) {
  return { action, score: Math.max(0, score), state };
}

function aiIntent(ai, action, state, framesLeft, scores = []) {
  ai.aiState = state;
  ai.aiTopScores = [...scores].sort((a, b) => b.score - a.score).slice(0, 3);
  return { action, state, framesLeft };
}

function chooseWeightedAction(scoredActions, config) {
  const ranked = [...scoredActions].sort((a, b) => b.score - a.score);
  const pool = ranked.slice(0, 3);
  if (Math.random() > 0.78 - config.mistakeChance * 0.25 && pool[1]?.score > 0) return pool[1];
  const total = pool.reduce((sum, action) => sum + action.score, 0);
  let roll = Math.random() * Math.max(1, total);
  return pool.find((action) => (roll -= action.score) <= 0) || pool[0];
}

function applyAIIntent(ai, opponent, intent, config) {
  if (!intent || !canAct(ai)) return;
  const toward = opponent.x < ai.x ? -1 : 1;
  const action = intent.action;
  if (action === "approach" || action === "center") {
    if (canMove(ai)) ai.vx = action === "center" ? Math.sign(W / 2 - ai.x) * rivalAdvanceSpeed : toward * rivalAdvanceSpeed;
    return;
  }
  if (action === "retreat") {
    if (canMove(ai)) ai.vx = -toward * rivalRetreatSpeed;
    return;
  }
  if (action === "block" && canBlock(ai)) {
    ai.aiBlockTimer = randomInt(18, 42);
    ai.blockType = ai.aiHabits.crouchAttack > 2.5 ? "crouching" : "standing";
    ai.crouching = ai.blockType === "crouching";
    ai.block = true;
    return;
  }
  if (action === "jump" && canMove(ai) && !ai.jumping && !ai.crouching && ai.aiJumpCooldown <= 0) {
    ai.vy = jumpVelocity;
    ai.jumping = true;
    ai.aiJumpCooldown = randomInt(100, 170);
    return;
  }
  if (action === "special" && ai.aiSpecialCooldown <= 0 && canStartSpecial(ai)) {
    startSpecial(ai, opponent);
    ai.aiSpecialCooldown = randomInt(180, 300);
    return;
  }
  if (action === "antiAir" && Math.random() < config.antiAirChance) {
    startMove(ai, "punch");
    return;
  }
  if (action === "punish" && Math.random() < config.punishChance) {
    startMove(ai, Math.abs(opponent.x - ai.x) < 92 ? "kick" : "crouchKick");
    return;
  }
  if (action === "combo") {
    if (startMove(ai, ai.aiComboRemaining % 2 ? "punch" : "crouchKick")) ai.aiComboRemaining -= 1;
    return;
  }
  if (moveDefs[action] && startMove(ai, action) && Math.random() < config.comboChance) {
    ai.aiComboRemaining = randomInt(1, config.maxComboLength);
  }
}

function clearAIBlock(ai) {
  if (ai.stunType !== "block") {
    ai.blockType = "";
    ai.block = false;
    ai.crouching = false;
  }
}

function getDistance(a, b) {
  return Math.abs(a.x - b.x);
}

function getRelativePosition(ai, opponent) {
  return opponent.x < ai.x ? "left" : "right";
}

function isOpponentVulnerable(opponent) {
  return opponent.currentMove && movePhase(opponent) === "recovery";
}

function isOpponentAttacking(opponent) {
  return Boolean(opponent.currentMove || opponent.special > 0);
}

function isOpponentAirborne(opponent) {
  return opponent.jumping;
}

function stepFighter(f, foe) {
  f.cooldown = Math.max(0, f.cooldown - 1);
  f.attack = Math.max(0, f.attack - 1);
  if (f.attack === 0 && !f.currentMove) f.attackType = "";
  f.special = Math.max(0, f.special - 1);
  f.hurt = Math.max(0, f.hurt - 1);
  if (f.hurt === 0) {
    f.stunType = "";
    const keepBlock = f.human ? keys.has("Space") : f.aiBlockTimer > 0;
    if (!keepBlock) {
      f.blockType = "";
      f.block = false;
    }
  }
  f.hitReact = Math.max(0, f.hitReact - 1);
  if (!canBlock(f)) f.aiBlockTimer = 0;
  if (f.knockdown > 0) {
    f.knockdown = Math.max(0, f.knockdown - 1);
    f.knockdownAge += 1;
  }
  f.energy = clamp(f.energy + 0.16, 0, 100);
  if (f.knockdown > 0) {
    f.crouching = false;
    f.block = false;
    f.blockType = "";
    f.stunType = "";
    f.aiBlockTimer = 0;
    f.currentMove = null;
    f.attack = 0;
    f.attackType = "";
    if (f.knockdownAge <= knockoutImpactHold) return;
  }
  if (f.knockdown > 1) f.vx *= f.knockdownLanded ? 0.86 : 0.995;
  else if (f.hurt > 0) f.vx *= 0.88;
  if (f.specialDashDelay > 0) {
    f.specialDashDelay -= 1;
    f.vx = 0;
  } else if (f.specialDashFrames > 0) {
    f.vx = f.dir * f.specialDashSpeed;
    f.specialDashFrames -= 1;
  }
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
  startMove(attacker, attacker.crouching && !attacker.jumping ? `crouch${type[0].toUpperCase()}${type.slice(1)}` : type);
}

function moveDuration(def) {
  return def.startup + def.active + def.recovery;
}

function startMove(attacker, moveName) {
  const def = moveDefs[moveName];
  if (!def || !canStartMove(attacker)) return false;
  attacker.currentMove = moveName;
  attacker.moveAge = 0;
  attacker.hasHitThisMove = false;
  attacker.attackType = def.attackType;
  attacker.attack = moveDuration(def);
  attacker.cooldown = moveDuration(def);
  attacker.block = false;
  attacker.blockType = "";
  setFighterState(attacker, def.attackType);
  return true;
}

function currentMoveDef(f) {
  return f.currentMove ? moveDefs[f.currentMove] : null;
}

function isMoveActive(f) {
  return movePhase(f) === "active";
}

function updateMove(attacker, defender) {
  const def = currentMoveDef(attacker);
  if (!def) return;
  if (isMoveActive(attacker) && !attacker.hasHitThisMove) {
    const attackBox = getAttackBox(attacker, def);
    if (attackBox && intersects(attackBox, getHurtBox(defender))) {
      damage(defender, def.damage, attacker.dir, def.label, attackImpactPoint(attackBox, attacker.dir));
      attacker.hasHitThisMove = true;
    }
  }
  attacker.moveAge += 1;
  attacker.attack = Math.max(0, moveDuration(def) - attacker.moveAge);
  if (attacker.moveAge >= moveDuration(def)) {
    attacker.currentMove = null;
    attacker.moveAge = 0;
    attacker.hasHitThisMove = false;
    attacker.attack = 0;
    attacker.attackType = "";
  }
}

function attackImpactPoint(box, dir) {
  return {
    x: Math.round(dir > 0 ? box.x + box.w : box.x),
    y: Math.round(box.y + box.h / 2)
  };
}

function startSpecial(attacker, defender) {
  if (!canStartSpecial(attacker)) return;
  attacker.energy -= damageTuning.specialEnergyCost;
  attacker.cooldown = 54;
  attacker.special = 34;
  attacker.specialDashDelay = 0;
  attacker.block = false;
  attacker.blockType = "";
  roundText = attacker.data.line;
  roundTextTimer = 72;

  const kind = attacker.data.special;
  if (kind === "dash") {
    const dash = specialTuning.dash;
    attacker.cooldown = dash.startup + dash.travelFrames + dash.recovery;
    attacker.special = dash.startup + dash.travelFrames;
    attacker.specialDashDelay = dash.startup;
    attacker.specialDashFrames = dash.travelFrames;
    attacker.specialDashSpeed = dash.speed;
    queueDelayedHit(attacker, defender, {
      framesLeft: dash.startup + dash.travelFrames,
      damage: dash.damage,
      label: attacker.data.move,
      range: dash.range,
      impactOffset: { x: 76, y: -96 },
      special: true
    });
  } else if (kind === "rush") {
    attacker.specialDashFrames = 10;
    attacker.specialDashSpeed = 11;
    queueDelayedHit(attacker, defender, {
      framesLeft: 14,
      damage: 13,
      label: attacker.data.move,
      range: 118,
      impactOffset: { x: 76, y: -96 },
      special: true
    });
  } else if (kind === "uppercut") {
    attacker.vy = jumpVelocity * 1.15;
    attacker.jumping = true;
    queueDelayedHit(attacker, defender, {
      framesLeft: 1,
      damage: 18,
      label: attacker.data.move,
      range: 105,
      impactOffset: { x: 54, y: -126 },
      special: true
    });
  } else if (kind === "cyclone") {
    for (let i = 0; i < 3; i += 1) {
      queueDelayedHit(attacker, defender, {
        framesLeft: i * 14,
        damage: 6,
        label: attacker.data.move,
        range: 132,
        impactOffset: { x: 82, y: -(82 + i * 12) },
        special: true
      });
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
      special: true,
      life: 95
    });
  }
}

function special(attacker, defender) {
  startSpecial(attacker, defender);
}

function queueDelayedHit(owner, target, event) {
  combatEvents.push({
    type: "delayedHit",
    owner,
    target,
    ...event
  });
}

function stepCombatEvents() {
  combatEvents.forEach((event) => {
    event.framesLeft -= 1;
    if (event.framesLeft > 0 || event.owner.knockdown > 0 || event.target.knockdown > 0 || gameOver || !running) return;
    if (Math.abs(event.owner.x - event.target.x) <= event.range) {
      damage(event.target, event.damage, event.owner.dir, event.label, {
        x: event.owner.x + event.owner.dir * event.impactOffset.x,
        y: event.owner.y + event.impactOffset.y
      }, { special: event.special });
    }
    event.done = true;
  });
  combatEvents = combatEvents.filter((event) => !event.done && event.framesLeft > 0);
}

function clearCombatEvents() {
  combatEvents = [];
}

function stepProjectiles() {
  projectiles.forEach((p) => {
    p.x += p.vx;
    p.life -= 1;
    const target = p.owner === player ? rival : player;
    if (intersects({ x: p.x - 18, y: p.y - 14, w: 36, h: 28 }, getHurtBox(target))) {
      damage(target, p.damage, Math.sign(p.vx), p.label, { x: p.x, y: p.y }, { special: p.special });
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
  // Store a small launch variation once per KO. Lincoln's hat then follows a
  // stable arc that changes subtly depending on the hit instead of wobbling.
  f.hatDrift = randomInt(-9, 9) / 100;
  f.hatLift = randomInt(-12, 10);
  f.hatSpin = randomInt(-3, 3) / 100;
  f.specialDashFrames = 0;
  f.specialDashDelay = 0;
  f.specialDashSpeed = 0;
  f.hitReact = 0;
  f.hurt = knockdownDuration;
  f.jumping = true;
  f.crouching = false;
  f.vx = f.knockdownDir * knockoutSlideSpeed;
  f.vy = knockoutLaunchVelocity;
  setFighterState(f, "knockdown");
}

function damage(f, amount, dir, label, impact = null, options = {}) {
  if (tuningMode) return;
  const blocked = f.blockType !== "" && Math.sign(dir) !== f.dir;
  const actual = blocked ? Math.ceil(amount * damageTuning.blockMultiplier) : amount;
  const knocksDown = f.hp - actual <= 0;
  f.hp = clamp(f.hp - actual, 0, 100);
  f.hurt = blocked ? damageTuning.blockstun : knocksDown ? knockdownDuration : damageTuning.hitstun;
  f.stunType = blocked ? "block" : "hit";
  if (blocked && !f.blockType) f.blockType = f.crouching ? "crouching" : "standing";
  f.block = blocked;
  f.hitReact = blocked || knocksDown ? 0 : 14;
  if (knocksDown) startKnockdown(f, dir);
  else f.knockdown = 0;
  if (!knocksDown) f.vx = dir * (blocked ? damageTuning.blockPushback : damageTuning.pushback);
  hitPauseFrames = blocked ? damageTuning.blockedHitPause : damageTuning.cleanHitPause;
  shake = (blocked ? damageTuning.blockedShake : damageTuning.cleanShake) + (options.special && !blocked ? damageTuning.specialShakeBonus : 0);
  hitSparks.push({
    x: impact?.x ?? f.x - Math.sign(dir) * 32,
    y: impact?.y ?? f.y - 92,
    life: 20,
    label,
    blocked
  });
}

function draw() {
  assetsReady = imagesSettled(criticalImages);
  const ox = shake ? Math.round((Math.random() - 0.5) * shake) : 0;
  const oy = shake ? Math.round((Math.random() - 0.5) * shake) : 0;
  drawStage();
  drawHud();
  ctx.save();
  ctx.translate(ox, oy);
  projectiles.forEach(drawProjectile);
  drawFighters();
  hitSparks.forEach(drawSpark);
  if (debugBoxes) drawDebug();
  if (tuningMode) drawTuningGuides();
  ctx.restore();
  if (!assetsReady) pixelText("LOADING ART", W - 228, H - 30, 1.7, "#f5d66f", "#17131b");
  if (tuningMode) drawTuningOverlay();
  if (roundTextTimer > 0) drawRoundText();
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
  return (isMoveActive(attacker) || attacker.special > 0) && defender.hurt > 0 && attacker.hurt === 0;
}

function drawStage() {
  if (imageReady(stageImage)) {
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
  const seconds = String(Math.max(0, Math.ceil(roundTimer / timing.fps))).padStart(2, "0");
  ctx.fillStyle = "#f5d66f";
  ctx.fillRect(434, 24, 92, 64);
  ctx.fillStyle = "#17131b";
  ctx.fillRect(444, 34, 72, 44);
  pixelText(seconds, 464, 45, 4, "#f5d66f");
  pixelText(player.data.short, 36, 92, 2.4, "#fff4c7");
  pixelText(rival.data.short, W - 202, 92, 2.4, "#fff4c7");
  drawRoundWins(36, 118, playerRoundWins, false);
  drawRoundWins(W - 64, 118, rivalRoundWins, true);
}

function drawRoundWins(x, y, wins, flip) {
  for (let index = 0; index < roundsToWin; index += 1) {
    const offset = flip ? -index * 18 : index * 18;
    ctx.fillStyle = index < wins ? "#f5d66f" : "rgba(255, 244, 199, 0.22)";
    ctx.fillRect(x + offset, y, 11, 11);
  }
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
  if (f.data.name === "Washington" && imageReady(washingtonSprite)) {
    drawWashingtonSprite(f);
    return;
  }
  if (f.data.name === "Lincoln" && imageReady(lincolnSprite)) {
    drawLincolnSprite(f);
    return;
  }

  const [coat, pants, skin] = f.data.colors;
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
  const nf = normalizedFrame(frame);

  drawShadow(f, nf.shadowWidth || 76);
  ctx.save();
  ctx.translate(Math.round(f.x), Math.round(f.y + bob));
  ctx.scale(f.dir, 1);

  if (f.block && frame !== lincolnFrames.block && frame !== lincolnFrames.crouchBlock) {
    ctx.fillStyle = "rgba(158, 228, 255, 0.28)";
    ctx.fillRect(-54, -142, 26, 112);
  }

  ctx.globalAlpha = hurtFlash ? 0.55 : 1;
  ctx.drawImage(
    preparedFrameCanvas(frame, nf.displayW, nf.displayH),
    -Math.round(nf.anchorX * nf.scale) + nf.offsetX,
    -Math.round(nf.anchorY * nf.scale) - nf.lift
  );
  ctx.globalAlpha = 1;

  if (f.special > 0) {
    ctx.fillStyle = f.data.accent;
    ctx.fillRect(-42, -188, 10, 10);
    ctx.fillRect(34, -196, 14, 14);
    ctx.fillRect(-6, -210, 12, 12);
  }

  ctx.restore();

  if (f.knockdown > 0 && imageReady(lincolnHatSprite)) {
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
  if (tuningMode && tuningTargetFighter() === f && currentTuningGroup().fighter === "Lincoln") return currentTuningFrame();
  if (f.knockdown > 0 && imagesReady(lincolnKnockdownSprites)) {
    return lincolnKnockdownFrameFor(f);
  }
  if (f.hitReact > 0 && imageReady(lincolnHitSprite)) {
    return lincolnFrames.hit;
  }
  if (f.attack > 6 && f.attackType === "crouch-kick" && imageReady(lincolnCrouchKickSprite)) {
    return lincolnFrames.crouchKick;
  }
  if (f.attack > 6 && f.attackType === "crouch-punch" && imageReady(lincolnCrouchPunchSprite)) {
    return lincolnFrames.crouchPunch;
  }
  if (f.attack > 6 && f.attackType === "kick" && imageReady(lincolnKickSprite)) {
    return lincolnFrames.kick;
  }
  if (f.attack > 6 && f.attackType === "punch" && imageReady(lincolnPunchSprite)) {
    return lincolnFrames.punch;
  }
  if (f.jumping && imagesReady(lincolnJumpSprites)) {
    return lincolnJumpFrameFor(f);
  }
  if (f.blockType === "crouching" && imageReady(lincolnCrouchBlockSprite)) {
    return lincolnFrames.crouchBlock;
  }
  if (f.blockType === "standing" && imageReady(lincolnBlockSprite)) {
    return lincolnFrames.block;
  }
  if (!f.jumping && Math.abs(f.vx) > 0.2 && imagesReady(lincolnWalkSprites)) {
    return lincolnWalkFrames[lincolnWalkCycle[f.animFrame % lincolnWalkCycle.length]];
  }
  if (f.crouching && imageReady(lincolnCrouchSprite)) {
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
  const releaseDelay = 4;
  const t = Math.min(Math.max(0, age - releaseDelay), 112);
  const dir = f.knockdownDir || f.dir || 1;
  const hatW = lincolnHatSprite.naturalWidth;
  const hatH = lincolnHatSprite.naturalHeight;
  const launch = lincolnKnockdownFrames[0].hatAnchor;
  const startX = f.x + f.dir * launch.x;
  const startY = f.y + launch.y;
  const x = startX + dir * t * (0.42 + f.hatDrift);
  const airY = startY + f.hatLift - t * 1.45 + t * t * 0.043;
  const groundY = floorY - hatH / 2 - 7;
  const landed = airY >= groundY;
  const bounceAge = Math.max(0, t - 90);
  const bounce = landed && bounceAge < 20 ? Math.sin((bounceAge / 20) * Math.PI) * (7 * (1 - bounceAge / 20)) : 0;
  const y = landed ? groundY - bounce : airY;
  const angle = landed ? dir * 1.25 : dir * (0.25 + t * (0.11 + f.hatSpin));

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
  // Washington's detailed sprite art stays planted; avoid synthetic bobbing.
  if (f.data.name === "Washington") return 0;
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
  const nf = normalizedFrame(frame);

  drawShadow(f, nf.shadowWidth || 84);
  ctx.save();
  ctx.translate(Math.round(f.x), Math.round(f.y + bob));
  ctx.scale(f.dir, 1);

  if (f.block && frame !== washingtonFrames.block && frame !== washingtonFrames.crouchBlock) {
    ctx.fillStyle = "rgba(158, 228, 255, 0.28)";
    ctx.fillRect(-58, -142, 28, 112);
  }

  ctx.globalAlpha = hurtFlash ? 0.55 : 1;
  ctx.drawImage(
    preparedFrameCanvas(frame, nf.displayW, nf.displayH),
    -Math.round(nf.anchorX * nf.scale) + nf.offsetX,
    -Math.round(nf.anchorY * nf.scale) - nf.lift
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
  if (tuningMode && tuningTargetFighter() === f && currentTuningGroup().fighter === "Washington") return currentTuningFrame();
  if (f.victory && imagesReady(washingtonVictorySprites)) {
    const frameIndex = Math.min(Math.floor(f.victoryAge / timing.victoryFrameTicks), washingtonVictoryFrames.length - 1);
    return washingtonVictoryFrames[frameIndex];
  }
  if (f.knockdown > 0 && imagesReady(washingtonKnockdownSprites)) {
    return washingtonKnockdownFrameFor(f);
  }
  if (f.hitReact > 0 && imageReady(washingtonHitSprite)) {
    return washingtonFrames.hit;
  }
  if (f.attack > 6 && f.attackType === "crouch-kick" && imageReady(washingtonCrouchKickSprite)) {
    return washingtonFrames.crouchKick;
  }
  if (f.attack > 6 && f.attackType === "crouch-punch" && imageReady(washingtonCrouchPunchSprite)) {
    return washingtonFrames.crouchPunch;
  }
  if (f.jumping && f.attack > 6 && f.attackType === "kick" && imageReady(washingtonFlyingKickSprite)) {
    return washingtonFrames.flyingKick;
  }
  if (f.attack > 6 && f.attackType === "kick" && imageReady(washingtonKickSprite)) {
    return washingtonFrames.kick;
  }
  if (f.attack > 6 && f.attackType === "punch" && imageReady(washingtonPunchSprite)) {
    return washingtonFrames.punch;
  }
  if (f.jumping && imagesReady(washingtonJumpSprites)) {
    return washingtonJumpFrameFor(f);
  }
  if (f.blockType === "crouching" && imageReady(washingtonCrouchBlockSprite)) {
    return washingtonFrames.crouchBlock;
  }
  if (f.blockType === "standing" && imageReady(washingtonBlockSprite)) {
    return washingtonFrames.block;
  }
  if (f.crouching && imageReady(washingtonCrouchSprite)) {
    return washingtonFrames.crouch;
  }
  if (!f.jumping && Math.abs(f.vx) > 0.2 && washingtonMoveSpritesReady()) {
    return washingtonWalkFrameFor(f);
  }
  return washingtonFrames.idle;
}

function washingtonMoveSpritesReady() {
  return imagesReady(washingtonWalkSprites) && imagesReady(washingtonBackwalkSprites);
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
  if (f.knockdownAge <= knockoutImpactHold && imageReady(washingtonHitSprite)) {
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
    return washingtonWalkFrames[f.animFrame % washingtonWalkFrames.length];
  }
  const rawFrame = f.animFrame % washingtonBackwalkCycle.length;
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
  if (imageReady(impactSparkSprite)) {
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
    if (s.blocked) {
      ctx.fillStyle = "rgba(78, 183, 255, 0.28)";
      ctx.fillRect(Math.round(s.x - displayW / 2), Math.round(s.y - displayH / 2), displayW, displayH);
    }
  } else {
    ctx.fillStyle = s.blocked ? "#9ee4ff" : "#fff4c7";
    ctx.fillRect(s.x - 30, s.y - 7, 60, 14);
    ctx.fillRect(s.x - 7, s.y - 30, 14, 60);
  }
  ctx.restore();
}

function drawDebug() {
  ctx.save();
  ctx.globalAlpha = 0.78;
  ctx.fillStyle = "rgba(245, 214, 111, 0.32)";
  ctx.fillRect(0, floorY, W, 1);
  [player, rival].forEach((f, index) => {
    drawDebugBox(getPushBox(f), "#2f7bd1");
    drawDebugBox(getHurtBox(f), "#46d96d");
    const def = currentMoveDef(f);
    if (def) drawDebugBox(getAttackBox(f, def), isMoveActive(f) ? "#ff4a4a" : "#f0a23a", isMoveActive(f) ? 0.9 : 0.35);
    drawDebugAnchor(f);
    drawFighterDebugText(f, index === 0 ? 18 : W - 246, 128);
  });
  drawAIDebug();
  drawAssetDebugWarnings();
  ctx.restore();
}

function drawAIDebug() {
  const scores = rival.aiTopScores.map((entry) => `${entry.action}:${entry.score.toFixed(0)}`).join(" ");
  ctx.globalAlpha = 0.94;
  ctx.fillStyle = "rgba(9, 11, 18, 0.78)";
  ctx.fillRect(W / 2 - 198, H - 72, 396, 58);
  ctx.fillStyle = "#9ee4ff";
  ctx.font = "12px monospace";
  ctx.fillText(`CPU ${cpuEnabled ? "ON" : "OFF"} ${aiDifficulty}  ${rival.aiState}  intent ${rival.aiIntent.action}`, W / 2 - 188, H - 51);
  ctx.fillText(`react ${AI_DIFFICULTY[aiDifficulty].reactionDelayFrames}  jumpCD ${rival.aiJumpCooldown}  specialCD ${rival.aiSpecialCooldown}`, W / 2 - 188, H - 35);
  ctx.fillText(`scores ${scores || "none"}`, W / 2 - 188, H - 19);
}

function drawTuningGuides() {
  const f = tuningTargetFighter();
  const group = currentTuningGroup();
  const frame = currentTuningFrame();
  ctx.save();
  ctx.fillStyle = "rgba(245, 214, 111, 0.48)";
  ctx.fillRect(0, floorY, W, 1);
  drawDebugBox(getPushBox(f), "#2f7bd1", 0.9);
  drawDebugBox(getHurtBox(f), "#46d96d", 0.9);
  if (group.move) drawDebugBox(getAttackBox(f, moveDefs[group.move]), "#ff4a4a", 0.9);
  drawTuningSpriteAnchor(f, frame);
  ctx.restore();
}

function drawTuningOverlay() {
  const frame = currentTuningFrame();
  const nf = normalizedFrame(frame);
  const meta = tuningFrameObject(frame);
  ctx.save();
  ctx.globalAlpha = 0.96;
  ctx.fillStyle = "rgba(9, 11, 18, 0.9)";
  ctx.fillRect(12, H - 172, W - 24, 160);
  ctx.fillStyle = "#f5d66f";
  ctx.font = "bold 15px monospace";
  ctx.fillText("TUNING MODE", 22, H - 150);
  ctx.font = "12px monospace";
  ctx.fillText(`target ${tuningTarget}  frame ${currentTuningFrameLabel()}`, 22, H - 130);
  ctx.fillText(`source ${meta.image}  phase ${movePhase(tuningTargetFighter()) || "none"}  preview ${currentTuningGroup().move || "none"}`, 22, H - 112);
  ctx.fillText(`crop ${meta.crop.x},${meta.crop.y},${meta.crop.w},${meta.crop.h}  height ${meta.height}  anchor ${meta.anchorX},${meta.anchorY}  offsetX ${meta.offsetX}  lift ${meta.lift}`, 22, H - 94);
  ctx.fillText(`suggested { image: ${meta.image}, crop: { x: ${meta.crop.x}, y: ${meta.crop.y}, w: ${meta.crop.w}, h: ${meta.crop.h} },`, 22, H - 74);
  ctx.fillText(`height: ${meta.height}, anchorX: ${nf.anchorX}, anchorY: ${nf.anchorY}, offsetX: ${meta.offsetX}, lift: ${meta.lift} }`, 22, H - 56);
  ctx.fillStyle = "#fff4c7";
  ctx.fillText("1/2 target  [ ] frame  Shift+[ ] group  arrows offset/lift  Shift+arrows anchor  Alt+up/down height  Ctrl = 5px", 22, H - 30);
  ctx.restore();
}

function drawDebugBox(box, color, alpha = 0.78) {
  if (!box) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(Math.round(box.x), Math.round(box.y), Math.round(box.w), Math.round(box.h));
  ctx.restore();
}

function drawDebugAnchor(f) {
  ctx.strokeStyle = "#f5d66f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(Math.round(f.x - 7), Math.round(f.y));
  ctx.lineTo(Math.round(f.x + 7), Math.round(f.y));
  ctx.moveTo(Math.round(f.x), Math.round(f.y - 7));
  ctx.lineTo(Math.round(f.x), Math.round(f.y + 7));
  ctx.stroke();
}

function drawTuningSpriteAnchor(f, frame) {
  const nf = normalizedFrame(frame);
  const x = Math.round(f.x + f.dir * nf.offsetX);
  const y = Math.round(f.y - nf.lift);
  ctx.strokeStyle = "#f5d66f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 9, y);
  ctx.lineTo(x + 9, y);
  ctx.moveTo(x, y - 9);
  ctx.lineTo(x, y + 9);
  ctx.stroke();
}

function drawFighterDebugText(f, x, y) {
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = "rgba(9, 11, 18, 0.72)";
  ctx.fillRect(x - 6, y - 15, 236, 147);
  ctx.fillStyle = "#f5d66f";
  ctx.font = "12px monospace";
  ctx.fillText(`state ${f.state}`, x, y);
  ctx.fillText(`frame ${f.animFrame} age ${f.stateAge}`, x, y + 15);
  ctx.fillText(`move ${f.currentMove || "none"} ${f.moveAge}`, x, y + 30);
  ctx.fillText(`phase ${movePhase(f) || "none"}`, x, y + 45);
  ctx.fillText(`hurt ${f.hurt} stun ${f.stunType || "none"}`, x, y + 60);
  ctx.fillText(`block ${f.blockType || "none"} hit ${f.hitReact}`, x, y + 75);
  ctx.fillText(`vx ${f.vx.toFixed(1)} vy ${f.vy.toFixed(1)}`, x, y + 90);
  ctx.fillText(`hp ${f.hp} en ${Math.round(f.energy)}`, x, y + 105);
  ctx.fillText(`jump buffer ${f.jumpBuffer}`, x, y + 120);
}

function drawAssetDebugWarnings() {
  const failed = allImages.filter((image) => image.failed).length;
  if (!failed) return;
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = "rgba(9, 11, 18, 0.72)";
  ctx.fillRect(W - 250, H - 48, 232, 30);
  ctx.fillStyle = "#f5d66f";
  ctx.font = "12px monospace";
  ctx.fillText(`art warnings ${failed} failed image(s)`, W - 240, H - 29);
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

const handledKeys = [
  "Space", "Enter", "ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight", "AltLeft", "AltRight",
  "KeyW", "KeyA", "KeyS", "KeyD", "KeyJ", "KeyK", "KeyL", "KeyH", "KeyR", "KeyG", "KeyC", "KeyV",
  "Digit1", "Digit2", "BracketLeft", "BracketRight", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"
];

window.addEventListener("keydown", (event) => {
  const wasDown = keys.has(event.code);
  keys.add(event.code);
  if (!wasDown) pressed.add(event.code);
  // Buffer jump at the browser input edge so a quick press survives hit pause
  // or a couple of locked frames and fires as soon as jumping is legal.
  if (event.code === "KeyW" && !wasDown) player.jumpBuffer = timing.jumpBufferFrames;
  if (event.code === "Enter" && !running) resetMatch();
  if (event.code === "KeyH" && !wasDown) debugBoxes = !debugBoxes;
  if (event.code === "KeyG" && !wasDown) toggleTuningMode();
  if (event.code === "KeyC" && !wasDown) {
    cpuEnabled = !cpuEnabled;
    roundText = `CPU ${cpuEnabled ? "ON" : "OFF"}`;
    roundTextTimer = 42;
  }
  if (event.code === "KeyV" && !wasDown) {
    const levels = Object.keys(AI_DIFFICULTY);
    aiDifficulty = levels[(levels.indexOf(aiDifficulty) + 1) % levels.length];
    roundText = `CPU ${aiDifficulty}`;
    roundTextTimer = 42;
  }
  if (tuningMode && !wasDown && (event.code === "Digit1" || event.code === "Digit2")) {
    tuningTarget = event.code === "Digit1" ? "player" : "rival";
    tuningGroupIndex = 0;
    tuningFrameIndex = 0;
    logTuningFrame(currentTuningFrame(), currentTuningFrameLabel());
  }
  if (tuningMode && !wasDown && (event.code === "BracketLeft" || event.code === "BracketRight")) {
    cycleTuningFrame(event.code === "BracketLeft" ? -1 : 1, event.shiftKey);
  }
  if (tuningMode && event.code.startsWith("Arrow")) adjustTuningFrame(event);
  if (event.code === "KeyR" && !wasDown) {
    if (event.shiftKey || keys.has("ShiftLeft") || keys.has("ShiftRight")) resetMatch();
    else resetPositionsOnly();
  }
  if (handledKeys.includes(event.code)) {
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
  released.add(event.code);
});
playerSelect.addEventListener("change", updateMoveCards);
rivalSelect.addEventListener("change", updateMoveCards);
startBtn.addEventListener("click", resetMatch);

populateSelects();
loop();
