const { SlashCommandBuilder } = require("discord.js");
const logger = require("../logging/logger.js");
require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("quiz")
		.setDescription("Take part in quiz!"),
	async execute(interaction, client) {
		const startQuizButton = new ButtonBuilder()
			.setCustomId("startQuiz")
			.setLabel("Start Quiz")
			.setStyle(ButtonStyle.Success)
			.setEmoji("❓");

		const row = new ActionRowBuilder().addComponents([startQuizButton]);

		await interaction.reply({
			content: "Get 3 questions right to win!",
			components: [row],
			ephemeral: true,
		});
	},
};
