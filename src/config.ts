export function config(env: NodeJS.ProcessEnv = process.env) {
  const token = env.DISCORD_TOKEN?.trim();
  const app = env.DISCORD_APPLICATION_ID;
  const guild = env.DISCORD_GUILD_ID;
  if (
    !token ||
    !/^[A-Za-z0-9_.-]{30,200}$/.test(token) ||
    !app ||
    !guild ||
    app !== app.trim() ||
    guild !== guild.trim() ||
    !/^[1-9]\d{16,19}$/.test(app) ||
    !/^[1-9]\d{16,19}$/.test(guild)
  ) {
    throw new Error(
      "Run npm run setup first. / Önce npm run setup çalıştırın. Never share your token. / Tokenınızı paylaşmayın.",
    );
  }
  return { token, app, guild };
}
