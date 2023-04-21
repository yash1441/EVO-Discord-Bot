const { SlashCommandBuilder } = require("discord.js");
const feishu = require("../feishu.js");
const logger = require("../logging/logger.js");
require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("test")
		.setDescription("This command is for testing purposes only.")
		.addStringOption((option) =>
			option
				.setName("secret-code")
				.setDescription("The secret code for the function to test.")
				.setRequired(true)
				.addChoices(
					{ name: "Test", value: "TEST" },
					{ name: "Member", value: "MEMBER" }
				)
		)
		.addStringOption((option) =>
			option
				.setName("date-start")
				.setDescription("The date for the function to start.")
				.setRequired(false)
		)
		.addStringOption((option) =>
			option
				.setName("date-end")
				.setDescription("The date for the function to end.")
				.setRequired(false)
		)
		.addStringOption((option) =>
			option
				.setName("discord-id")
				.setDescription("The discord id of the user.")
				.setRequired(false)
		),

	async execute(interaction) {
		if (interaction.user.id != process.env.MY_ID) {
			return;
		}

		await interaction.deferReply();

		const option = interaction.options.getString("secret-code");
		if (option === "TEST") {
			client.channels.fetch("360776228199727105").then((channel) =>
				channel.send({
					content: "Hi",
				})
			);
		} else if (option === "MEMBER") {
			const discordId = interaction.options.getString("discord-id");
			const member = await interaction.guild.members
				.fetch(discordId)
				.then(() => {
					logger.debug("Member found.");
				})
				.catch(() => {
					logger.debug("Member not found.");
				});
		}

		await interaction.editReply({ content: "Testing complete." });
	},
};
