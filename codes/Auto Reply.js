const { Client, Intents, MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, Modal, TextInputComponent } = require("discord.js");
const db = require("pro.db");
const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS]
});
const prefix = "-";

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
const autoReplies = db.get("autoReplies") || [];
    const foundReply = autoReplies.find(r => r.word === message.content);

    if (foundReply) {
        if (foundReply.roles.length > 0) {
            const memberRoles = message.member.roles.cache.map(r => r.id);
            const hasAccess = foundReply.roles.some(role => memberRoles.includes(role));
            if (!hasAccess) return;
        }

        if (foundReply.replyType === "reply") {
            await message.reply(foundReply.response);
        } else {
            await message.channel.send(foundReply.response);
        }
        if (foundReply.deleteWord === "نعم") {
            try {
                if (message.guild.me.permissions.has("MANAGE_MESSAGES")) {
                    await message.delete();
                    console.log(`تم حذف الرسالة: ${message.content}`);
                } else {
                    console.log("البوت ليس لديه صلاحية حذف الرسائل");
                }
            } catch (error) {
                console.error("حدث خطأ أثناء حذف الرسالة: ", error);
            }
        }
}
    if (message.content === `${prefix}رد_تلقائي`) {
        const embed = new MessageEmbed()
            .setTitle("إدارة الردود التلقائية")
            .setColor("BLUE")
            .setDescription("قم بإدارة الردود التلقائية عبر الأزرار أدناه.");

        const buttons = new MessageActionRow().addComponents(
            new MessageButton()
                .setCustomId("add_reply")
                .setLabel("➕ إضافة رد تلقائي")
                .setStyle("PRIMARY"),
            new MessageButton()
                .setCustomId("view_replies")
                .setLabel("📜 عرض جميع الردود")
                .setStyle("SECONDARY"),
            new MessageButton()
                .setCustomId("delete_reply")
                .setLabel("🗑️ حذف رد")
                .setStyle("DANGER")
        );

        message.channel.send({ embeds: [embed], components: [buttons] });
    }
});
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "add_reply") {
        const modal = new Modal()
            .setCustomId("add_reply_modal")
            .setTitle("إضافة رد تلقائي")
            .addComponents(
                new MessageActionRow().addComponents(
                    new TextInputComponent()
                        .setCustomId("word")
                        .setLabel("🔤 الكلمة")
                        .setStyle("SHORT")
                        .setRequired(true)
                ),
                new MessageActionRow().addComponents(
                    new TextInputComponent()
                        .setCustomId("response")
                        .setLabel("💬 الرد")
                        .setStyle("PARAGRAPH")
                        .setRequired(true)
                ),
                new MessageActionRow().addComponents(
                    new TextInputComponent()
                        .setCustomId("replyType")
                        .setLabel("📢 الرد بريبلاي؟ (نعم/لا)")
                        .setStyle("SHORT")
                        .setRequired(true)
                ),
                new MessageActionRow().addComponents(
                    new TextInputComponent()
                        .setCustomId("deleteWord")
                        .setLabel("❌ حذف الكلمة بعد الرد؟ (نعم/لا)")
                        .setStyle("SHORT")
                        .setRequired(true)
                ),
                new MessageActionRow().addComponents(
                    new TextInputComponent()
                        .setCustomId("roles")
                        .setLabel("🎭 حصر الرد على رتب؟ (نعم/لا)")
                        .setStyle("SHORT")
                        .setRequired(true)
                )
            );

        await interaction.showModal(modal);
    }
});
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isModalSubmit()) return;
    
    if (interaction.customId === "add_reply_modal") {
        const word = interaction.fields.getTextInputValue("word");
        const response = interaction.fields.getTextInputValue("response");
        const replyType = interaction.fields.getTextInputValue("replyType").toLowerCase() === "نعم" ? "reply" : "message";
        const deleteWord = interaction.fields.getTextInputValue("deleteWord").toLowerCase();
        const restrictRoles = interaction.fields.getTextInputValue("roles").toLowerCase();

        let roles = [];
        if (restrictRoles === "نعم") {
            const roleMenu = new MessageSelectMenu()
                .setCustomId(`set_roles_${word}`)
                .setPlaceholder("اختر الرتب المسموح لها باستخدام الرد")
                .addOptions(interaction.guild.roles.cache.map(role => ({
                    label: role.name,
                    value: role.id
                })));

            const row = new MessageActionRow().addComponents(roleMenu);
            await interaction.reply({ content: "اختر الرتب المسموح لها:", components: [row], ephemeral: true });
            return;
        }

        const code = Math.floor(1000 + Math.random() * 9000);  
        const autoReplies = db.get("autoReplies") || [];
        autoReplies.push({ word, response, replyType, deleteWord, roles, code });
        db.set("autoReplies", autoReplies);

        await interaction.reply({ content: `تم إضافة الرد بنجاح! الرمز: **${code}**`, ephemeral: true });
    }
});
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isSelectMenu()) return;

    const customId = interaction.customId;

    if (customId.startsWith("set_roles_")) {
        const word = customId.split("_")[2]; 
        const selectedRoles = interaction.values;

        const autoReplies = db.get("autoReplies") || [];
        const reply = autoReplies.find(r => r.word === word);
        if (reply) {
            reply.roles = selectedRoles;
            db.set("autoReplies", autoReplies);
            await interaction.reply({ content: `تم إضافة الرتب المحددة للرد: **${word}**`, ephemeral: true });
        }
    }
});
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "view_replies") {
        const autoReplies = db.get("autoReplies") || [];
        if (autoReplies.length === 0) return interaction.reply({ content: "❌ لا توجد ردود مسجلة.", ephemeral: true });

        const embed = new MessageEmbed()
            .setTitle("📜 جميع الردود التلقائية")
            .setColor("GREEN")           .setDescription(autoReplies.map(r => `🔤 **الكلمة:** ${r.word}\n💬 **الرد:** ${r.response}\n🔢 **الرمز:** ${r.code}`).join("\n\n"));

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "delete_reply") {
        const autoReplies = db.get("autoReplies") || [];
        if (autoReplies.length === 0) return interaction.reply({ content: "❌ لا توجد ردود.", ephemeral: true });

        const selectMenu = new MessageSelectMenu()
            .setCustomId("delete_reply_menu")
            .setPlaceholder("اختر ردًا لحذفه")
            .addOptions(autoReplies.map(r => ({
                label: `${r.word} (رمز: ${r.code})`,
                value: r.word
            })));

        const row = new MessageActionRow().addComponents(selectMenu);
        await interaction.reply({ content: "اختر ردًا لحذفه:", components: [row], ephemeral: true });
    }
});
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isSelectMenu()) return;

    if (interaction.customId === 'delete_reply_menu') {
        const selectedReplyWord = interaction.values[0];
        const autoReplies = db.get('autoReplies') || [];
        const foundReply = autoReplies.find(r => r.word === selectedReplyWord); 

        if (foundReply) {
            const index = autoReplies.indexOf(foundReply);
            if (index !== -1) {
                autoReplies.splice(index, 1);  
                db.set('autoReplies', autoReplies);

                await interaction.update({
                    content: `تم حذف الرد التلقائي: **${foundReply.word}** (رمز: ${foundReply.code})`,
                    components: []
                });
            }
        } else {
            await interaction.update({
                content: "❌ لم يتم العثور على الرد المحدد.",
                components: []
            });
        }
    }
});