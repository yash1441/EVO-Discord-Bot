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
						.setMinValue(100000000)
						.setMaxValue(999999999)
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
						.setMinValue(100000000)
						.setMaxValue(999999999)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("status")
				.setDescription("Check your team's registration status.")
		),

	async execute(interaction) {
		const subCommand = interaction.options.getSubcommand();
		const CS_BASE = "bascnxUOz7DdG9mcOUvFlH7BIPg";
		const CS_TABLE = "tblOIfZDNQS9JJTb";

		if (subCommand === "team") {
			await interaction.reply({
				content: "Checking if registration is possible...",
				ephemeral: true,
			});

			const teamLeader = interaction.user;
			const teamName = interaction.options.getString("name");
			const teamLeaderRoleId = interaction.options.getInteger("role-id");

			const tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			const response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					CS_BASE,
					CS_TABLE,
					`OR(CurrenValue.[Discord ID] = "${teamLeader.id}", CurrentValue.[Team Name] = "${teamName}", CurrentValue.[Role ID] = "${teamLeaderRoleId}")`
				)
			);

			if (response.data.total) {
				await interaction.editReply({
					content: `You have already registered a team with the name **${response.data.items[0].fields["Team Name"]}**. Please use \`/register member\` to add members or \`/register status\` to check status of your team.`,
				});
				return;
			}

			await interaction.editReply({
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
