client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    if (command === "نقل") {
            if (!message.member.permissions.has("MANAGE_CHANNELS")) {
        return message.reply("ليس لديك صلاحية **Manage Channels** لاستخدام هذا الأمر.");
    }
        const categoryId = args[0]; 
        if (!categoryId) {
            return message.reply("يرجى تحديد ايدي الكاتيجوري الذي ترغب في نقل القناة إليه.");
        }

        const category = message.guild.channels.cache.get(categoryId);
        if (!category || category.type !== "GUILD_CATEGORY") {
            return message.reply("ايدي الكاتقوري المدخل ليس كاتقوري صالح. تأكد من إدخال ايدي كاتقوري صحيح.");
        }
        try {
            await message.channel.setParent(categoryId);

            message.reply(`تم نقل القناة <#${message.channel.id}> إلى الكاتقوري **${category.name}**.`);
        } catch (error) {
            console.error(error);
            message.reply("حدث خطأ أثناء محاولة نقل القناة.");
        }
    }
});