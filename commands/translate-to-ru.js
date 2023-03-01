const {
	ContextMenuCommandBuilder,
	ApplicationCommandType,
} = require("discord.js");
const translate = require("google-translate-api-x");

module.exports = {
	data: new ContextMenuCommandBuilder()
		.setName("Translate to Russian")
		.setType(ApplicationCommandType.Message),

	async execute(interaction) {
		const message = interaction.targetMessage.content;
		translate(message, { to: "ru" })
			.then((res) => {
				interaction.reply({
					ephemeral: true,
					content: "```" + res.text + "```",
				});
			})
			.catch((err) => {
				console.log(err);
				interaction.reply({ ephemeral: true, content: "Error." });
			});
	},
};
