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
  const replies = await Promise.allSettled([
    rest.get(Routes.guild(ids.guild)),
    rest.get(Routes.guildRoles(ids.guild)),
    rest.get(Routes.guildMember(ids.guild, ids.user)),
    rest.get(Routes.guildMember(ids.guild, ids.bot)),
    rest.get(Routes.channel(ids.forum)),
  ]);
  // Keep the operation slot until every request settles, even if one fails early.
  const [guild, roles, member, bot, channel] = replies.map((reply) => {
    if (reply.status !== "fulfilled") throw Error("Forum read unavailable");
    return reply.value;
  });
  return inspect({ guild, roles, member, bot, channel } as Snapshot, ids);
}
