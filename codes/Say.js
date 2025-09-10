const { Client, Intents, MessageActionRow, MessageButton, Modal, TextInputComponent, MessageEmbed } = require('discord.js');

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.DIRECT_MESSAGES],
    partials: ['CHANNEL']
});

const prefix = "perfix here";
const ALLOWED_ROLE = "name role here"; 
const tempData = new Map();
client.on("messageCreate", async (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === "send") {
        if (!message.member.roles.cache.some(role => role.name === ALLOWED_ROLE)) {
            return message.reply("❌ ليس لديك الصلاحية لاستخدام هذا الأمر!");
        }

        let target = message.mentions.users.first() || message.mentions.channels.first() || args[0];
        let targetChannel = null;
        let targetUser = null;

        if (target) {
            if (typeof target === "string") {
                targetChannel = message.guild.channels.cache.get(target);
                if (!targetChannel) {
                    targetUser = await client.users.fetch(target).catch(() => null);
                }
            } else if (target instanceof require("discord.js").User) {
                targetUser = target;
            } else {
                targetChannel = target;
            }
        }
        if (targetUser) {
            tempData.set(message.author.id, { type: "user", target: targetUser });
        } else if (targetChannel) {
            tempData.set(message.author.id, { type: "channel", target: targetChannel });
        } else {
            tempData.set(message.author.id, { type: "channel", target: message.channel });
        }

        const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId("send_message")
                    .setLabel("📩 إرسال رسالة")
                    .setStyle("PRIMARY"),
                new MessageButton()
                    .setCustomId("send_embed")
                    .setLabel("📜 إرسال Embed")
                    .setStyle("SUCCESS")
            );

        message.channel.send({ content: "اختر نوع الرسالة:", components: [row] });
    }
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton() && !interaction.isModalSubmit()) return;

    const savedTarget = tempData.get(interaction.user.id);
    let targetChannel = interaction.channel;
    let targetUser = null;

    if (savedTarget) {
        if (savedTarget.type === "user") {
            targetUser = savedTarget.target;
        } else if (savedTarget.type === "channel") {
            targetChannel = savedTarget.target;
        }
    }

    if (interaction.isButton()) {
        if (interaction.customId === "send_message") {
            const modal = new Modal()
                .setCustomId("modal_message")
                .setTitle("إرسال رسالة")
                .addComponents(
                    new MessageActionRow().addComponents(
                        new TextInputComponent()
                            .setCustomId("message_content")
                            .setLabel("أدخل الرسالة:")
                            .setStyle("PARAGRAPH")
                            .setRequired(true)
                    )
                );

            await interaction.showModal(modal);
        } else if (interaction.customId === "send_embed") {
            const modal = new Modal()
                .setCustomId("modal_embed")
                .setTitle("إرسال Embed")
                .addComponents(
                    new MessageActionRow().addComponents(
                        new TextInputComponent()
                            .setCustomId("embed_title")
                            .setLabel("عنوان Embed")
                            .setStyle("SHORT")
                            .setRequired(true)
                    ),
                    new MessageActionRow().addComponents(
                        new TextInputComponent()
                            .setCustomId("embed_description")
                            .setLabel("وصف Embed")
                            .setStyle("PARAGRAPH")
                            .setRequired(true)
                    ),
                    new MessageActionRow().addComponents(
                        new TextInputComponent()
                            .setCustomId("embed_color")
                            .setLabel("لون (اختياري)")
                            .setStyle("SHORT")
                            .setRequired(false)
                    ),
                    new MessageActionRow().addComponents(
                        new TextInputComponent()
                            .setCustomId("embed_image")
                            .setLabel("رابط الصورة (اختياري)")
                            .setStyle("SHORT")
                            .setRequired(false)
                    ),
                    new MessageActionRow().addComponents(
                        new TextInputComponent()
                            .setCustomId("embed_thumbnail")
                            .setLabel("رابط Thumbnail (اختياري)")
                            .setStyle("SHORT")
                            .setRequired(false)
                    )
                );

            await interaction.showModal(modal);
        }
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId === "modal_message") {
            const messageContent = interaction.fields.getTextInputValue("message_content");

            if (targetUser) {
                targetUser.send(messageContent).catch(() => interaction.reply({ content: "❌ تعذر إرسال الرسالة للمستخدم!", ephemeral: true }));
            } else if (targetChannel) {
                targetChannel.send(messageContent);
            } else {
                interaction.channel.send(messageContent);
            }

            await interaction.reply({ content: "✅ تم إرسال الرسالة!", ephemeral: true });
        } else if (interaction.customId === "modal_embed") {
            const embedTitle = interaction.fields.getTextInputValue("embed_title");
            const embedDescription = interaction.fields.getTextInputValue("embed_description");
            const embedColor = interaction.fields.getTextInputValue("embed_color") || null;
            const embedImage = interaction.fields.getTextInputValue("embed_image") || null;
            const embedThumbnail = interaction.fields.getTextInputValue("embed_thumbnail") || null;

            const embed = new MessageEmbed()
                .setTitle(embedTitle)
                .setDescription(embedDescription)
                .setColor(embedColor ? embedColor : null)
                .setImage(embedImage ? embedImage : null)
                .setThumbnail(embedThumbnail ? embedThumbnail : null);

            if (targetUser) {
                targetUser.send({ embeds: [embed] }).catch(() => interaction.reply({ content: "❌ تعذر إرسال الرسالة للمستخدم!", ephemeral: true }));
            } else if (targetChannel) {
                targetChannel.send({ embeds: [embed] });
            } else {
                interaction.channel.send({ embeds: [embed] });
            }

            await interaction.reply({ content: "✅ تم إرسال الـ Embed!", ephemeral: true });
        }
    }
});
