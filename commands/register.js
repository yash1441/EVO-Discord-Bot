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
			const teamLeaderRoleId = interaction.options
				.getInteger("role-id")
				.toString();

			const tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			let response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					CS_BASE,
					CS_TABLE,
					`OR(CurrentValue.[Discord ID] = "${teamLeader.id}", CurrentValue.[Role ID] = "${teamLeaderRoleId}")`
				)
			);

			if (response.data.total) {
				await interaction.editReply({
					content: `You have already registered a team with the name **${response.data.items[0].fields["Team Name"]}**. Please use </register member:1097845563568963624> to register a member for your team or </register status:1097845563568963624> to check your team's registration status.`,
				});
				return;
			}

			await interaction.editReply({
				content: `Checking if team name **${teamName}** is available...`,
			});

			response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					CS_BASE,
					CS_TABLE,
					`CurrentValue.[Team Name] = "${teamName}"`
				)
			);

			if (response.data.total) {
				await interaction.editReply({
					content: `Team name **${teamName}** is already taken. Please use </register team:1097845563568963624> and choose another name for your team.`,
				});
				return;
			}

			await interaction.editReply({
				content: `Registering team **${teamName}** with the leader as **${teamLeader.tag}** *(Role ID: ${teamLeaderRoleId})*...`,
				ephemeral: true,
			});

			const success = await feishu.createRecord(
				tenantToken,
				CS_BASE,
				CS_TABLE,
				{
					fields: {
						"Discord ID": teamLeader.id,
						"Discord Name": teamLeader.tag,
						"Role ID": teamLeaderRoleId,
						"Team Name": teamName,
						Title: "Leader",
					},
				}
			);

			if (success) {
				await interaction.editReply({
					content: `Registered team **${teamName}** with the leader as **${teamLeader.tag}** *(Role ID: ${teamLeaderRoleId})*.`,
					ephemeral: true,
				});
			} else {
				await interaction.editReply({
					content: `Failed to register team **${teamName}** with the leader as **${teamLeader.tag}** *(Role ID: ${teamLeaderRoleId})*.\n\nPlease try again later or create a ticket in <#951850084335771700>.`,
					ephemeral: true,
				});
			}
		} else if (subCommand === "member") {
			await interaction.reply({
				content: "Checking if member registration is possible...",
				ephemeral: true,
			});

			const teamLeader = interaction.user;
			const teamMember = interaction.options.getUser("user");
			const teamMemberRoleId = interaction.options
				.getInteger("role-id")
				.toString();

			const tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			let response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					CS_BASE,
					CS_TABLE,
					`OR(CurrentValue.[Role ID] = "${teamMember.id}, CurrentValue.[Role ID] = "${teamMemberRoleId}")`
				)
			);

			if (response.data.total) {
				await interaction.editReply({
					content: `**${teamMember.tag}** is already a **${response.data.items[0].fields.Title}** for team **${response.data.items[0].fields["Team Name"]}**.\n\nPlease use </register member:1097845563568963624> to register a member for your team or </register status:1097845563568963624> to check your team's registration status.`,
				});
				return;
			}

			await interaction.editReply({
				content: `Checking if you are a team leader...`,
			});

			response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					CS_BASE,
					CS_TABLE,
					`AND(CurrentValue.[Discord ID] = "${teamLeader.id}", CurrentValue.[Title] = "Leader")`
				)
			);

			if (!response.data.total) {
				await interaction.editReply({
					content: `You are not a team leader.\n\nPlease use </register team:1097845563568963624> to register your team first.`,
				});
				return;
			}

			const teamName = response.data.items[0].fields["Team Name"];

			await interaction.editReply({
				content: `Checking if team **${teamName}** is available...`,
			});

			response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					CS_BASE,
					CS_TABLE,
					`CurrentValue.[Team Name] = "${teamName}"`
				)
			);

			if (response.data.total >= 4) {
				await interaction.editReply({
					content: `Team **${teamName}** already has 4 members.\n\nPlease use </register status:1097845563568963624> to check your team's registration status.`,
				});
			}

			await interaction.editReply({
				content: `Registering team member **${teamMember.tag}** *(Role ID: ${teamMemberRoleId})* for team leader **${teamLeader.tag}**...`,
			});

			const success = await feishu.createRecord(
				tenantToken,
				CS_BASE,
				CS_TABLE,
				{
					fields: {
						"Discord ID": teamMember.id,
						"Discord Name": teamMember.tag,
						"Role ID": teamMemberRoleId,
						"Team Name": teamName,
						Title: "Member",
					},
				}
			);

			if (success) {
				await interaction.reply({
					content: `Registered team member **${teamMember.tag}** *(Role ID: ${teamMemberRoleId})* for team leader **${teamLeader.tag}**.`,
					ephemeral: true,
				});
			} else {
				await interaction.editReply({
					content: `Failed to register member **${teamMember.id}** with the team **${teamName}** *(Role ID: ${teamMemberRoleId})*.\n\nPlease try again later or create a ticket in <#951850084335771700>.`,
					ephemeral: true,
				});
			}
		} else if (subCommand === "status") {
			await interaction.reply({
				content: "Checking registration status...",
				ephemeral: true,
			});
		}
	},
};
