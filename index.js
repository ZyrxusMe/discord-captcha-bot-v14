const Discord = require("discord.js")
const gg_apkart_captvha = require("captcha-canvas")
const dbAyranCodeShare = require("croxydb");
const client = new Discord.Client({
    intents: [ // https://discordjs.guide/popular-topics/intents.html#enabling-intents
        Discord.GatewayIntentBits.Guilds,
    ] // istediğinizi kaldırabilirsiniz.
})
const config = require("./config.json")
const fs = require("fs")
client.commands = new Discord.Collection();

const komutlarDosyasi = fs.readdirSync('./src/commands/')
// komutları yükleme
for (const kategori of komutlarDosyasi) {
    const commands = fs.readdirSync(`./src/commands/${kategori}`).filter((file) => file.endsWith('.js'));
    for (const file of commands) {
        const dosya = require(`./src/commands/${kategori}/${file}`);
        if (!dosya.execute || !dosya.slash) continue;
        client.commands.set(dosya.slash.name, dosya);
        console.log(`Komut ${dosya.slash.name} yüklendi. (Kategori: ${kategori})`);
    }
}

client.on("ready", async () => {

    client.user.setActivity({ state: "Ayran Codeshare!", name: "Custom Status", type: Discord.ActivityType.Custom })
    try {
        const commands = client.commands.map(module => module.slash);
        await client.application.commands.set(commands);
        console.log('Slash Komutlar yüklendi.');
    } catch (e) {
        console.error(e);
    }

    console.log(`${client.user.tag} olarak bağlanıldı.`)
})
// eventleri yükleme
fs.readdir('./src/events', (err, files) => {
    if (err) return console.error(err);
    files.filter(file => file.endsWith('.js')).forEach(file => {
        const event = require(`./src/events/${file}`);
        const eventad = file.slice(0, -3);
        client.on(eventad, (...args) => event(client, ...args));
        delete require.cache[require.resolve(`./src/events/${file}`)];
    });
});
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId == "captcha") {
    if (!dbAyranCodeShare.has(`captcha_${interaction.guild.id}`)) return;
    if (interaction.channelId !== dbAyranCodeShare.get(`captcha_${interaction.guild.id}`).channel) return;
    await interaction.deferReply({ ephemeral: true });
    const captcha = new gg_apkart_captvha.Captcha()
    .addDecoy()
    .drawTrace()
    captcha.async = false
    captcha.drawCaptcha()
    const attachment = new Discord.AttachmentBuilder(captcha.png)
    .setName("ayran_codeshare_sunucusuna_gel_discord.gg-akparti.png")

    const embed = new Discord.EmbedBuilder()
    .setTitle("Doğrulama")
    .setDescription("Lütfen aşağıdaki resimdeki yazıyı yazınız.\n 5 dakika içinde yazmazsanız tekrar doğrulama isteği göndermeniz gerekecek.")
    .setImage("attachment://ayran_codeshare_sunucusuna_gel_discord.gg-akparti.png")
    .setColor("DarkButNotBlack")

    const row = new Discord.ActionRowBuilder()
    .addComponents(new Discord.ButtonBuilder()
    .setStyle(Discord.ButtonStyle.Success)
    .setLabel("Doğrula")
    .setCustomId("verify"))

    const message = await interaction.editReply({embeds:[embed], components:[row], files:[attachment]})
    const button = await message.awaitMessageComponent({filter: (button) => button.user.id == interaction.user.id, time: 300000})

    const modalrow = new Discord.ActionRowBuilder()
    const captchaInput = new Discord.TextInputBuilder()
    .setCustomId("captcha-input")
    .setPlaceholder("Doğrulama kodunu yazınız.")
    .setMinLength(6)
    .setRequired(true)
    .setStyle(Discord.TextInputStyle.Short)
    .setLabel("Doğrulama kodu")
    modalrow.addComponents(captchaInput)
    await button.showModal(new Discord.ModalBuilder()
    .setTitle("Doğrulama")
    .setCustomId("verify-modal")
    .addComponents(modalrow)
    )
    const modal = await button.awaitModalSubmit({filter: (button) => button.user.id == interaction.user.id, time: 300000})
    const answer = modal.fields.getTextInputValue("captcha-input")

    if (answer !== captcha.text) {
        const embed = new Discord.EmbedBuilder()
        .setTitle("Doğrulama")
        .setDescription("Yanlış kod girdiniz. Lütfen tekrar deneyiniz.")
        .setColor("DarkButNotBlack")
        return modal.reply({embeds:[embed], ephemeral:true})
    }
    const dembed = new Discord.EmbedBuilder()
    .setTitle("Doğrulama")
    .setDescription("Doğrulama başarılı. Sunucuya giriş yapabilirsiniz.")
    .setColor("DarkButNotBlack")
    modal.reply({embeds:[dembed], ephemeral:true})
    interaction.member.roles.add(dbAyranCodeShare.get(`captcha_${interaction.guild.id}`).role)
    }
})
process.on("uncaughtException", (error) => {
    console.error("Beklenmeyen bir hata oluştu:");
    console.error(error);
  });
  
process.on("unhandledRejection", (reason, promise) =>  {
    console.error("İşlenmemiş bir geri dönüşüm hatası oluştu:");
    console.error("Promise:", promise);
    console.error("Reason:", reason);
});
client.login(config.token || process.env.token).catch(err => {
    console.log("Bota bağlanılamadı. Gereken intentleri açmamış olabilir veya tokeni yanlış girmiş olabilirsiniz:")
    console.log(err)
})