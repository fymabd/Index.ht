   client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

   if (command === "hide") {
        if (!message.member.permissions.has("MANAGE_CHANNELS")) return;
    const channel = message.channel;
    const role = message.guild.roles.cache.get('Id_role_hide');

    if (!role) {
        return message.reply("تعذر العثور على الرتبة المحددة.");
    }
                const currentPermission = channel.permissionOverwrites.cache.get(role.id)?.deny.has("VIEW_CHANNEL");

        if (currentPermission) {
            return message.reply(`القناة ${channel}بالفعل مخفية للرتبة <@${role}>.`);
        }
        
        try {
            await channel.permissionOverwrites.edit(role, {
                VIEW_CHANNEL: false,
            });
            message.reply(`تم إخفاء هذه القناة عن الرتبة <@${role}>.`);
        } catch (error) {
            console.error(error);
            message.reply("حدث خطأ أثناء محاولة تعديل صلاحيات القناة.");
        }
    }
   
});