const discord_gg_akparti = require("discord.js");
const dbAyranCodeShare = require("croxydb");
module.exports = {
    slash: new discord_gg_akparti.SlashCommandBuilder()
        .setName("kapat")
        .setDescription("Captcha sistemini kapatır."),
    /**
        * 
        * @param {discord_gg_akparti.Client} client 
        * @param {discord_gg_akparti.ChatInputCommandInteraction} interaction 
        * @returns 
        */
    execute: async (client, interaction) => {
        if (!interaction.member.permissions.has("ADMINISTRATOR")) return interaction.reply({ content: "Bu komutu kullanabilmek için `Yönetici` yetkisine sahip olmalısın.", ephemeral: true });
        if (!dbAyranCodeShare.has(`captcha_${interaction.guild.id}`)) return interaction.reply({ content: "Captcha sistemi zaten kapalı.", ephemeral: true });
        dbAyranCodeShare.delete(`captcha_${interaction.guild.id}`);
        dbAyranCodeShare.delete(`captcha_message_${interaction.guild.id}`);
        return interaction.reply({ content: "Captcha sistemi kapatıldı.", ephemeral: true });
    }
}