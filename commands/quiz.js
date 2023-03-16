const { SlashCommandBuilder } = require("discord.js");
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
	async execute(interaction) {
		await interaction.reply("Ping Pong!");
		logger.debug(JSON.stringify(questionBank));
	},
};
