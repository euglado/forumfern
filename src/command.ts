import { ChannelType, SlashCommandBuilder } from "discord.js";
export const command = new SlashCommandBuilder()
  .setName("forumfern")
  .setDescription("Privately browse a forum’s tags and guidelines")
  .setDescriptionLocalizations({
    tr: "Bir forumun etiketlerini ve yönergesini özel olarak inceleyin",
  })
  .addChannelOption((o) =>
    o
      .setName("forum")
      .setDescription("A regular forum you can access")
      .setDescriptionLocalizations({ tr: "Erişebildiğiniz normal bir forum" })
      .addChannelTypes(ChannelType.GuildForum)
      .setRequired(true),
  )
  .addStringOption((o) =>
    o
      .setName("language")
      .setDescription("Panel language / Panel dili")
      .addChoices(
        { name: "Türkçe", value: "tr" },
        { name: "English", value: "en" },
      ),
  );
