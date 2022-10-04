// Copyright 2021-present, Mihály "Misu" Szijjártó-Nagy <mihaly.szijjartonagy@prezi.com>
// All rights reserved.

export const POWER_UPS = [
  "Homing",
  "Jump",
  "Brake",
  "Thick",
  "One Shot",
  "Mine",
  "Zap",
  "Low-res",
  "Thin",
  "Scatter Shot",
  "Steer-less",
  "Speed Burst",
  "Stealth Mine",
  "Trippy",
  "Power Dash",
  "Side Shot",
  "Speedy",
  "Shield",
  "Clock Block",
  "Time Bomb",
  "Hide Self",
  "Curve-blind",
  "Angle Turns",
  "Multi Shot",
  "Trigger Bomb",
  "180",
  "Double Shot",
  "Reverse",
  "Laser",
  "Teleport",
];

export function getRandomPowerUps(numberOfPowerUps, useShift = false) {
  const selectablePowerUpsForUp = POWER_UPS.slice(0, numberOfPowerUps);
  const [up, selectablePowerUpsForDown] = selectAndRemoveRandom(
    selectablePowerUpsForUp,
  );

  if (useShift) {
    const [down, selectablePowerUpsForShift] = selectAndRemoveRandom(
      selectablePowerUpsForDown,
    );
    const [shift, _unusedPowerUps] = selectAndRemoveRandom(
      selectablePowerUpsForShift,
    );
    return { up, down, shift };
  } else {
    const [down, _unusedPowerUps] = selectAndRemoveRandom(
      selectablePowerUpsForDown,
    );
    return { up, down };
  }
}

export function getRandomPowerUpsForUsers(
  usersToNumberOfPowerUps,
  useShift = false,
) {
  const usersToPowerUps = {};
  for (const user in usersToNumberOfPowerUps) {
    const numberOfPowerUps = usersToNumberOfPowerUps[user];
    const powerUps = getRandomPowerUps(numberOfPowerUps, useShift);
    usersToPowerUps[user] = powerUps;
  }
  return usersToPowerUps;
}

function selectAndRemoveRandom(arr) {
  const index = parseInt(Math.random() * arr.length);
  const selected = arr[index];
  const newArr = arr.filter((_el, idx) => idx !== index);
  return [selected, newArr];
}
