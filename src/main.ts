import type {
  ButtonInteraction,
  ChatInputCommandInteraction,
} from "discord.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  Options,
} from "discord.js";
import { config } from "./config.ts";
import type { Lang } from "./forum.ts";
import { readForum, transport } from "./reader.ts";
import { Panels, type Port, type Request } from "./session.ts";

async function main() {
  const cfg = config(),
    rest = transport(cfg.token);
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    makeCache: Options.cacheWithLimits({
      ...Options.DefaultMakeCacheSettings,
      MessageManager: 0,
      GuildMemberManager: 0,
      UserManager: 0,
    }),
    rest: { retries: 0, timeout: 10000, rejectOnRateLimit: () => true },
    allowedMentions: { parse: [] },
  });
  const panels = new Panels((guild, forum, user) =>
    readForum(rest, { guild, forum, user, bot: client.user?.id ?? "" }),
  );
  const timer = setInterval(() => panels.prune(), 30000);
  timer.unref();
  client.once(Events.ClientReady, (ready) => {
    if (ready.user.id !== cfg.app) {
      console.error("Application ID mismatch. / Uygulama kimliği uyuşmuyor.");
      client.destroy();
      process.exitCode = 1;
      return;
    }
    console.log("ForumFern connected. / ForumFern bağlandı.");
  });
  client.on(Events.Error, () =>
    console.error("Discord connection error. / Discord bağlantı hatası."),
  );
  client.on(Events.InteractionCreate, async (interaction) => {
    if (
      !(
        interaction.isChatInputCommand() &&
        interaction.commandName === "forumfern"
      ) &&
      !(interaction.isButton() && interaction.customId.startsWith("ff:"))
    )
      return;
    const i = interaction as ChatInputCommandInteraction | ButtonInteraction;
    const error = async (content: string) => {
      if (i.deferred || i.replied)
        await i.followUp({
          content,
          flags: MessageFlags.Ephemeral,
          allowedMentions: { parse: [] },
        });
      else
        await i.reply({
          content,
          flags: MessageFlags.Ephemeral,
          allowedMentions: { parse: [] },
        });
    };
    try {
      if (
        !i.guildId ||
        !i.channelId ||
        i.guildId !== cfg.guild ||
        i.applicationId !== cfg.app
      ) {
        await error(
          "Use this bot in its configured server. / Botu yapılandırılan sunucuda kullanın.",
        );
        return;
      }
      const identity = {
        user: i.user.id,
        guild: i.guildId,
        channel: i.channelId,
        app: i.applicationId,
      };
      const request: Request = i.isButton()
        ? {
            ...identity,
            kind: "button",
            customId: i.customId,
            message: i.message.id,
            ephemeral: i.message.flags.has(MessageFlags.Ephemeral),
          }
        : {
            ...identity,
            kind: "command",
            forum: i.options.getChannel("forum", true).id,
            lang: (i.options.getString("language") ??
              (i.locale === "tr" ? "tr" : "en")) as Lang,
          };
      const port: Port = {
        error,
        defer: async (button) => {
          if (button && i.isButton()) await i.deferUpdate();
          else await i.deferReply({ flags: MessageFlags.Ephemeral });
        },
        write: async (p) => {
          const components = p.controls.length
            ? [
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                  p.controls.map((c) =>
                    new ButtonBuilder()
                      .setCustomId(c.id)
                      .setLabel(c.label)
                      .setStyle(
                        c.id.endsWith(":close")
                          ? ButtonStyle.Secondary
                          : ButtonStyle.Primary,
                      ),
                  ),
                ),
              ]
            : [];
          const m = await i.editReply({
            content: p.content,
            components,
            allowedMentions: { parse: [] },
          });
          return m.id;
        },
      };
      await panels.handle(request, port);
    } catch {
      console.error(
        "Interaction failed; no content logged. / Etkileşim başarısız; içerik kaydedilmedi.",
      );
      await error(
        "Try /forumfern again later. / Daha sonra /forumfern komutunu tekrar deneyin.",
      ).catch(() => {});
    }
  });
  for (const signal of ["SIGINT", "SIGTERM"] as const)
    process.once(signal, () => {
      clearInterval(timer);
      panels.sessions.clear();
      panels.cooldowns.clear();
      client.destroy();
    });
  await client.login(cfg.token);
}
main().catch(() => {
  console.error(
    "Cannot start. Run npm run setup and check network/token. / Başlatılamadı. npm run setup çalıştırın, ağı ve tokenı kontrol edin.",
  );
  process.exitCode = 1;
});
