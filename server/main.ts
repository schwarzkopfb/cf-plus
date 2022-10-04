import { Application, Router, Status } from "oak";
import { oakCors } from "cors";
import {
  createUser,
  deleteUser,
  deleteUsers,
  getUser,
  isUserExists,
  listUsers,
  regeneratePowerUpSlotsInRoom,
  updateUserFields,
} from "./dal.ts";

const SERVER_ACCESS_TOKEN = Deno.env.get("CFP_SERVER_ACCESS_TOKEN") || "";
const app = new Application();
const router = new Router();

router
  .put("/user", async function (ctx) {
    const result = ctx.request.body();
    ctx.assert(result.type === "json", Status.BadRequest);

    const { username, numOfPowerUps, roomId } = await result.value;
    ctx.assert(
      typeof username === "string" && username.length > 0,
      Status.BadRequest,
      "Username must be a non-empty string",
    );

    ctx.assert(
      !isNaN(numOfPowerUps) && numOfPowerUps > 0 && numOfPowerUps <= 30,
      Status.BadRequest,
      "Number of power-ups must be a positive integer between 1 and 30",
    );

    ctx.assert(roomId, Status.BadRequest, "Room ID must be provided");

    let user = await getUser(username);
    if (user) {
      const data = {};
      let changed = false;

      if (user.roomId !== roomId) {
        data.roomId = roomId;
        user.roomId = roomId;
        changed = true;
      }
      if (user.numOfPowerUps !== numOfPowerUps) {
        data.numOfPowerUps = numOfPowerUps;
        user.numOfPowerUps = numOfPowerUps;
        changed = true;
      }
      if (changed) {
        await updateUserFields(username, data);
      }

      ctx.response.status = Status.OK;
    } else {
      user = await createUser(username, numOfPowerUps, roomId);
      ctx.response.status = Status.Created;
    }

    ctx.response.body = user;
  })
  .get("/user/:username", async (ctx) => {
    const { response } = ctx;
    const user = await getUser(ctx.params.username);

    if (user) {
      response.status = Status.OK;
      response.body = user;
    } else {
      response.status = Status.NotFound;
    }
  })
  .delete("/user/:username", async (ctx) => {
    const username = ctx.params.username;

    if (await isUserExists(username)) {
      await deleteUser(username);
      ctx.response.status = Status.OK;
    } else {
      ctx.response.status = Status.NotFound;
    }
  })
  .get("/users", async (ctx) => {
    ctx.response.body = await listUsers();
  })
  .delete("/users", async (ctx) => {
    await deleteUsers();
    ctx.response.status = Status.OK;
  })
  .patch("/room/:id/powerups", async (ctx) => {
    await regeneratePowerUpSlotsInRoom(ctx.params.id);
    ctx.response.status = Status.OK;
  });

app.use(oakCors());

if (SERVER_ACCESS_TOKEN) {
  app.use(async (ctx, next) => {
    const { request, response } = ctx;

    if (request.headers.get("X-Access-Token") !== SERVER_ACCESS_TOKEN) {
      response.status = Status.Unauthorized;
      return;
    }

    await next();
  });
}

app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener(
  "listen",
  () => console.log("server is ready to accept connections on port 8080"),
);

await app.listen({ port: 8080 });
