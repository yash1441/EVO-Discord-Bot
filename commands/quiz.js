const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const logger = require("../logging/logger.js");
require("dotenv").config();

const dataDirectory = path.join(__dirname, "../data");
const questionBank = JSON.parse(
	fs.readFileSync(path.join(dataDirectory, "questions.json"))
);

module.exports = {
	data: new SlashCommandBuilder()
		.setName("quiz")
		.setDescription("Take part in quiz!"),
	async execute(interaction, client) {
		await interaction.reply("Ping Pong!");
		const shuffledQuestions = questionBank
			.sort(() => Math.random() - 0.5)
			.slice(0, 3);
		logger.debug(JSON.stringify(shuffledQuestions));
	},
};
