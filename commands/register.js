const {
	SlashCommandBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	StringSelectMenuBuilder,
	EmbedBuilder,
} = require("discord.js");
const feishu = require("../feishu.js");
const logger = require("../logging/logger.js");
require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("register")
		.setDescription("Register for Community Series.")
		.setDMPermission(false)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("team")
				.setDescription("Register a team as leader.")
				.addStringOption((option) =>
					option
						.setName("name")
						.setDescription("Enter the name for your team.")
						.setRequired(true)
						.setMaxLength(30)
				)
				.addIntegerOption((option) =>
					option
						.setName("role-id")
						.setDescription("Enter your in-game Role ID.")
						.setRequired(true)
						.setMinValue(0)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("member")
				.setDescription("Register a member for your team.")
				.addUserOption((option) =>
					option
						.setName("user")
						.setDescription("Select your team member.")
						.setRequired(true)
				)
				.addIntegerOption((option) =>
					option
						.setName("role-id")
						.setDescription("Enter your team member's in-game Role ID.")
						.setRequired(true)
						.setMinValue(0)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("status")
				.setDescription("Check your team's registration status.")
		),

	async execute(interaction) {
		const subCommand = interaction.options.getSubcommand();

		if (subCommand === "team") {
			const teamLeader = interaction.user;
			const teamName = interaction.options.getString("name");
			const teamLeaderRoleId = interaction.options.getInteger("role-id");

			await interaction.reply({
				content: `Registering team **${teamName}** with the leader as **${teamLeader.tag}** *(Role ID: ${teamLeaderRoleId})*...`,
				ephemeral: true,
			});
		} else if (subCommand === "member") {
			const teamLeader = interaction.user;
			const teamMember = interaction.options.getUser("user");
			const teamMemberRoleId = interaction.options.getInteger("role-id");

			await interaction.reply({
				content: `Registering team member **${teamMember.tag}** *(Role ID: ${teamMemberRoleId})* for team leader **${teamLeader.tag}**...`,
				ephemeral: true,
			});
		} else if (subCommand === "status") {
			await interaction.reply({
				content: "Checking registration status...",
				ephemeral: true,
			});
		}
	},
};
