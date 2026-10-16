import { REST, Routes } from "discord.js";
import { type Forum, inspect, type Snapshot } from "./forum.ts";
export type Transport = { get(route: `/${string}`): Promise<unknown> };
export function transport(token: string): REST {
  return new REST({
    version: "10",
    retries: 0,
    timeout: 10_000,
    rejectOnRateLimit: () => true,
  }).setToken(token);
}
export async function readForum(
  rest: Transport,
  ids: { guild: string; forum: string; user: string; bot: string },
): Promise<Forum> {
  const [guild, roles, member, bot, channel] = await Promise.all([
    rest.get(Routes.guild(ids.guild)),
    rest.get(Routes.guildRoles(ids.guild)),
    rest.get(Routes.guildMember(ids.guild, ids.user)),
    rest.get(Routes.guildMember(ids.guild, ids.bot)),
    rest.get(Routes.channel(ids.forum)),
  ]);
  return inspect({ guild, roles, member, bot, channel } as Snapshot, ids);
}
