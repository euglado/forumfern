import { Routes } from "discord.js";
import { command } from "./command.ts";

type Registrar = {
  get(route: `/${string}`): Promise<unknown>;
  post(route: `/${string}`, options: { body: unknown }): Promise<unknown>;
};
export async function registerCommand(
  rest: Registrar,
  app: string,
  guild: string,
) {
  const me = (await rest.get(Routes.user("@me"))) as { id: string };
  if (me.id !== app) throw Error("Application mismatch");
  // Guild-scoped create/upsert: omit contexts/integration_types (global-only fields).
  await rest.post(Routes.applicationGuildCommands(app, guild), {
    body: command.toJSON(),
  });
}
