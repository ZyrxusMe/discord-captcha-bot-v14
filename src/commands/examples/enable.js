const discord_gg_akparti = require("discord.js");
const dbAyranCodeShare = require("croxydb");
module.exports = {
    slash: new discord_gg_akparti.SlashCommandBuilder()
        .setName("aktif-et")
        .setDescription("Captcha sistemini aktif eder.")
        .addChannelOption((option) =>
            option
                .setName("kanal")
                .setDescription("Captcha kanalını belirtin.")
                .setRequired(true)
                .addChannelTypes(discord_gg_akparti.ChannelType.GuildText)
        )
        .addRoleOption((option) =>
            option
                .setName("rol")
                .setDescription("Captcha geçilince verilecek rolü belirtin.")
                .setRequired(true)
        ),
    // https://discordjs.guide/slash-commands/advanced-creation.html#adding-options
    /**
     * 
     * @param {discord_gg_akparti.Client} client 
     * @param {discord_gg_akparti.ChatInputCommandInteraction} interaction 
     * @returns 
     */
    execute: async (client, interaction) => {
        if (!interaction.inCachedGuild()) return interaction.reply("Bu komutu sadece sunucularda kullanabilirsiniz.")
        // check if user is an admin
        if (!interaction.member.permissions.has("ADMINISTRATOR"))
            return interaction.reply("Bu komutu kullanabilmek için `Yönetici` yetkisine sahip olmalısın.");
        if (dbAyranCodeShare.has(`captcha_${interaction.guild.id}`)) return interaction.reply("Captcha sistemi zaten aktif.");
        // check if i am an admin
        if (!interaction.guild.members.me.permissions.has("ADMINISTRATOR"))
            return interaction.reply("Bu komutu kullanabilmek için `Yönetici` yetkisine sahip olmalıyım.");
        // get channel
        const channel = interaction.options.getChannel("kanal");
        // get role
        const role = interaction.options.getRole("rol");
        // check if i can manage the role
        if (!role.editable)
            return interaction.reply("Bu rolü yönetme yetkim yok.");
        // check if channel is a text channel
        if (!channel.isTextBased())
            return interaction.reply("Kanal bir metin kanalı olmalı.");
        dbAyranCodeShare.set(`captcha_${interaction.guild.id}`, {
            channel: channel.id,
            role: role.id,
        });
        await interaction.reply("Captcha sistemi aktif edildi. kanallari kilitlemeye basliyorum.");
        try {
            const perms = {}
            perms[discord_gg_akparti.PermissionFlagsBits.SendMessages] = false
            perms[discord_gg_akparti.PermissionFlagsBits.AddReactions] = false
            perms[discord_gg_akparti.PermissionFlagsBits.Connect] = false
            perms[discord_gg_akparti.PermissionFlagsBits.ViewChannel] = false
            const verifiedPerms = {}
            verifiedPerms[discord_gg_akparti.PermissionFlagsBits.SendMessages] = true
            verifiedPerms[discord_gg_akparti.PermissionFlagsBits.AddReactions] = true
            verifiedPerms[discord_gg_akparti.PermissionFlagsBits.Connect] = true
            verifiedPerms[discord_gg_akparti.PermissionFlagsBits.ViewChannel] = true
            const verifyChannelPerms = {}
            verifyChannelPerms[discord_gg_akparti.PermissionFlagsBits.ViewChannel] = true
            verifyChannelPerms[discord_gg_akparti.PermissionFlagsBits.SendMessages] = false
            verifyChannelPerms[discord_gg_akparti.PermissionFlagsBits.AddReactions] = false

            channel.permissionOverwrites.edit(interaction.guild.id,verifyChannelPerms);
            interaction.guild.channels.cache.forEach((channel) => {
                // check if channel is synced with parent
                if (channel.parent && channel.parent.viewable && !channel.permissionsLocked) {
                    // check if i can manage the channel
                    if (!channel.permissionsFor(interaction.guild.members.me).has("MANAGE_CHANNELS"))
                        return;
                    // update channel overwrites
                    channel.permissionOverwrites?.edit(interaction.guild.id,perms);
                    channel.permissionOverwrites?.edit(role.id,verifiedPerms);
                }
                // check if there is no parent
                else if (!channel.parent) {
                    // check if i can manage the channel
                    if (!channel.permissionsFor(interaction.guild.members.me,true).has("MANAGE_CHANNELS"))
                        return;
                    // update channel overwrites
                    channel.permissionOverwrites.edit(interaction.guild.id,perms);
                    channel.permissionOverwrites.edit(role.id,verifiedPerms);
                }
        })
        interaction.followUp("Kanallar kilitlendi.")
        const embedAyranCodeShare = new discord_gg_akparti.EmbedBuilder()
            .setTitle("Güvenlik Koruması")
            .setDescription(`Bu sunucu güvenlik koruması altındadır.
Sunucuya girmek için aşağıdaki butona basınız.`)
            .setFooter({text:"Ayran CodeShare"})
            .setColor("DarkVividPink")
            .setThumbnail(interaction.guild.iconURL({dynamic:true}))
        const button = new discord_gg_akparti.ButtonBuilder()
            .setStyle(discord_gg_akparti.ButtonStyle.Success)
            .setLabel("Güvenlik Doğrulaması")
            .setCustomId("captcha")
        const actionRow = new discord_gg_akparti.ActionRowBuilder()
            .addComponents(button)
        const message = await channel.send({embeds:[embedAyranCodeShare], components:[actionRow]})
        dbAyranCodeShare.set(`captcha_message_${interaction.guild.id}`, message.id)
    } catch (e) {
        if (e instanceof discord_gg_akparti.DiscordAPIError) {
            if (e.code === 50013) {
                return interaction.followUp("Bazı kanalları kilitleyemedim.");
            }
            return interaction.followUp("Bazı kanalları kilitleyemedim.");
        }
        else {
            console.error(e);
            return interaction.followUp("Bazı kanalları kilitleyemedim.");
        }
    }
    },
};
