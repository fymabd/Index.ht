client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    if (command === "show") {
        if (!message.member.permissions.has("MANAGE_CHANNELS")) return;
    const channel = message.channel;
    const role = message.guild.roles.cache.get('Id_role_show');

    if (!role) {
        return message.reply("تعذر العثور على الرتبة المحددة.");
    }
        const currentPermission = channel.permissionOverwrites.cache.get(role.id)?.allow.has("VIEW_CHANNEL");

        if (currentPermission) {
            return message.reply(`القناة ${channel}بالفعل ظاهرة للرتبة <@${role}>.`);
        }
        
        try {
            await channel.permissionOverwrites.edit(role, {
                VIEW_CHANNEL: true,
            });
            message.reply(`تم إظهار هذه القناة للرتبة <@${role}>.`);
        } catch (error) {
            console.error(error);
            message.reply("حدث خطأ أثناء محاولة تعديل صلاحيات القناة.");
        }
    }
});