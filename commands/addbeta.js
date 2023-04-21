const { trace } = require("console");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const feishu = require("../feishu.js");
require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("addbeta")
		.setDescription("Give beta tester role to a user.")
		.setDMPermission(false)
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("The user to give role to.")
				.setRequired(true)
		),

	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });
		const target = await interaction.options.getUser("user");

		const member = await interaction.guild.members.fetch(target.id);
		await member.roles.add(process.env.BETA_ROLE);
		await interaction.editReply({
			content: `Added beta tester role to ${target}.`,
		});

		const embed = new EmbedBuilder()
			.setTitle("Beta Tester Role Added")
			.setDescription(
				`${interaction.user} added beta tester role to ${target}`
			);

		await interaction.client.channels
			.fetch("951854256477077554")
			.then((channel) => channel.send({ embeds: [embed] }));
	},
};
