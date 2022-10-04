import { connect } from "redis";
import { getRandomPowerUps } from "./randomizer.mjs";

export interface User {
  username: string;
  numOfPowerUps: number;
  slotUp: string;
  slotDown: string;
  updatedAt: number;
  roomId: string;
}

const redis = await connect({
  hostname: Deno.env.get("CFP_REDIS_HOST") || "localhost",
  port: Deno.env.get("CFP_REDIS_PORT"),
  username: Deno.env.get("CFP_REDIS_USERNAME"),
  password: Deno.env.get("CFP_REDIS_PASSWORD"),
});

function userFromRedisHashReply(reply: string[]): User {
  return {
    username: reply[1],
    numOfPowerUps: parseInt(reply[3]),
    slotUp: reply[5],
    slotDown: reply[7],
    updatedAt: parseInt(reply[9]),
    roomId: reply[11],
  };
}

export async function isUserExists(username: string): Promise<boolean> {
  return await Boolean(redis.exists(`user:${username}`));
}

export async function createUser(
  username: string,
  numOfPowerUps: number,
  roomId: string,
): Promise<User> {
  const { up, down } = getRandomPowerUps(numOfPowerUps);
  const user = {
    username,
    numOfPowerUps,
    slotUp: up || "unavailable",
    slotDown: down || "unavailable",
    updatedAt: Date.now(),
    roomId,
  };
  await redis.hmset(`user:${user.username}`, user);
  return user;
}

export async function updateUserFields(
  username: string,
  data: { [key]: keyof User | number },
): Promise<void> {
  await redis.hmset(`user:${username}`, {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function getUser(username: string): Promise<User | undefined> {
  const key = `user:${username}`;

  if (await redis.exists(key)) {
    const reply = await redis.hgetall(key);
    return userFromRedisHashReply(reply);
  }
}

export async function deleteUser(username: string): Promise<void> {
  await redis.del(`user:${username}`);
}

export async function deleteUsers(): Promise<void> {
  const keys = await redis.keys("user:*");
  await redis.del(...keys);
}

export async function listUsers(): Promise<User[]> {
  const keys = await redis.keys("user:*");
  return await Promise.all(
    keys.map(async (key) => userFromRedisHashReply(await redis.hgetall(key))),
  );
}

export async function regeneratePowerUpSlotsInRoom(
  roomId: string,
): Promise<void> {
  const keys = await redis.keys("user:*");
  await Promise.all(keys.map(async (key) => {
    const [numOfPowerUps, userRoomId] = await redis.hmget(
      key,
      "numOfPowerUps",
      "roomId",
    );

    if (userRoomId !== roomId) {
      return;
    }

    const { up, down } = getRandomPowerUps(parseInt(numOfPowerUps));

    await redis.hmset(
      key,
      {
        slotUp: up || "unavailable",
        slotDown: down || "unavailable",
        updatedAt: Date.now(),
      },
    );
  }));
}
