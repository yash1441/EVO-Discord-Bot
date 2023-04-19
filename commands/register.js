const {
	SlashCommandBuilder,
	EmbedBuilder,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
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
				.setName("add-member")
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
				.setName("remove-member")
				.setDescription("Unregister a member from your team.")
				.addUserOption((option) =>
					option
						.setName("user")
						.setDescription("Select your team member.")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("status")
				.setDescription("Check your team's registration status.")
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("leave-team")
				.setDescription("Leave your current team.")
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
					content: `You are already in team **${response.data.items[0].fields["Team Name"]}**. Please use </register add-member:1097845563568963624> to register a member for your team or </register status:1097845563568963624> to check your team's registration status.`,
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
					content: `Registered team **${teamName}** with the leader as **<@${teamLeader.id}>** *(Role ID: ${teamLeaderRoleId})*.\n\nTo add a member use </register add-member:1097845563568963624>.\nTo remove a member use </register remove-member:1097845563568963624>.`,
					ephemeral: true,
				});
			} else {
				await interaction.editReply({
					content: `Failed to register team **${teamName}** with the leader as **${teamLeader.tag}** *(Role ID: ${teamLeaderRoleId})*.\n\nPlease try again later or create a ticket in <#951850084335771700>.`,
					ephemeral: true,
				});
			}
		} else if (subCommand === "add-member") {
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
					`OR(CurrentValue.[Discord ID] = "${teamMember.id}", CurrentValue.[Role ID] = "${teamMemberRoleId}")`
				)
			);

			if (response.data.total) {
				await interaction.editReply({
					content: `**${teamMember.tag}** is already a **${response.data.items[0].fields.Title}** for team **${response.data.items[0].fields["Team Name"]}**.\n\nPlease use </register add-member:1097845563568963624> to register a member for your team or </register status:1097845563568963624> to check your team's registration status.`,
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

			const memberCount = parseInt(response.data.total) + 1;

			if (parseInt(response.data.total) >= 4) {
				await interaction.editReply({
					content: `Team **${teamName}** already has 4 members.\n\nPlease use </register status:1097845563568963624> to check your team's registration status.`,
				});
				return;
			} else if (parseInt(response.data.total) === 3) {
				lastMember = true;
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
				await interaction.editReply({
					content: `Registered team member **${teamMember.tag}** *(Role ID: ${teamMemberRoleId})* for team leader **${teamLeader.tag}**.`,
					ephemeral: true,
				});
			} else {
				await interaction.editReply({
					content: `Failed to register member **${teamMember.id}** with the team **${teamName}** *(Role ID: ${teamMemberRoleId})*.\n\nPlease try again later or create a ticket in <#951850084335771700>.`,
					ephemeral: true,
				});
			}

			await interaction.followUp({
				content: `Team **${teamName}** now has ${memberCount} members.\n\nPlease use </register status:1097845563568963624> to check your team's registration status.\nTo add a member use </register add-member:1097845563568963624>.\nTo remove a member use </register remove-member:1097845563568963624>.`,
				ephemeral: true,
			});
		} else if (subCommand === "remove-member") {
			await interaction.reply({
				content: `Checking if you are a team leader...`,
				ephemeral: true,
			});

			const teamLeader = interaction.user;
			const teamMember = interaction.options.getUser("user");

			if (teamLeader === teamMember) {
				await interaction.editReply({
					content: `You cannot remove yourself as a team leader.\n\nPlease use </register remove-member:1097845563568963624> to remove a team member.`,
				});
				return;
			}

			const tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			let response = JSON.parse(
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

			await interaction.editReply({
				content: "Checking if member unregistration is possible...",
			});

			const teamName = response.data.items[0].fields["Team Name"];

			response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					CS_BASE,
					CS_TABLE,
					`AND(CurrentValue.[Discord ID] = "${teamMember.id}", CurrentValue.[Team Name] = "${teamName}")`
				)
			);

			if (!response.data.total) {
				await interaction.editReply({
					content: `We couldn't find **${teamMember.tag}** in team ${teamName}.\n\nPlease use </register add-member:1097845563568963624> to register a member for your team or </register status:1097845563568963624> to check your team's registration status.`,
				});
				return;
			}

			const recordId = response.data.items[0].record_id;

			await interaction.editReply({
				content: `Removing ${teamMember.tag} from team **${teamName}**...`,
			});

			await feishu.deleteRecord(tenantToken, CS_BASE, CS_TABLE, recordId);

			await interaction.editReply({
				content: `Removed ${teamMember.tag} from team **${teamName}**.`,
			});

			await interaction.followUp({
				content: `Please use </register status:1097845563568963624> to check your team's registration status.\nTo add a member use </register add-member:1097845563568963624>.\nTo remove a member use </register remove-member:1097845563568963624>.`,
				ephemeral: true,
			});
		} else if (subCommand === "status") {
			await interaction.reply({
				content: "Checking registration status...",
				ephemeral: true,
			});

			const teamLeader = interaction.user;

			const tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			let response = JSON.parse(
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

			const teamLeaderRoleId = response.data.items[0].fields["Role ID"];
			const teamName = response.data.items[0].fields["Team Name"];

			response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					CS_BASE,
					CS_TABLE,
					`AND(CurrentValue.[Team Name] = "${teamName}", CurrentValue.[Title] = "Member")`
				)
			);

			if (!response.data.total) {
				await interaction.editReply({
					content: `Team **${teamName}** has no members.\n\nPlease use </register add-member:1097845563568963624> to register a member for your team.`,
				});
				return;
			}

			const embeds = [];

			const mainEmbed = new EmbedBuilder()
				.setTitle(`${teamName}`)
				.setDescription(`**Team Leader**\n<@${teamLeader.id}>`)
				.addFields({ name: `**Role**`, value: `${teamLeaderRoleId}` })
				.setThumbnail(teamLeader.displayAvatarURL())
				.setColor(`C04946`);

			embeds.push(mainEmbed);

			for (const record of response.data.items) {
				const user = await interaction.client.users.fetch(
					record.fields["Discord ID"]
				);
				const memberEmbed = new EmbedBuilder()
					.setDescription(`**Team Member**\n<@${record.fields["Discord ID"]}>`)
					.addFields({ name: `**Role**`, value: `${record.fields["Role ID"]}` })
					.setThumbnail(user.displayAvatarURL())
					.setColor(`C04946`);

				embeds.push(memberEmbed);
			}

			if (embeds.length == 4) {
				await interaction.editReply({
					content: `To remove a member use </register remove-member:1097845563568963624>.`,
					embeds: embeds,
				});
			}

			await interaction.editReply({
				content: `To add a member use </register add-member:1097845563568963624>.\nTo remove a member use </register remove-member:1097845563568963624>.`,
				embeds: embeds,
			});
		} else if (subCommand === "leave-team") {
			const confirmButton = new ButtonBuilder()
				.setCustomId("confirmLeave")
				.setLabel("Confirm")
				.setStyle(ButtonStyle.Danger)
				.setEmoji("☑️");

			const row = new ActionRowBuilder().addComponents(confirmButton);

			await interaction.reply({
				content: `Are you sure you want to leave your team?`,
				components: [row],
				ephemeral: true,
			});

			const filter = (i) => i.user.id === interaction.user.id;

			try {
				const confirmation = await response.awaitMessageComponent({
					filter,
					time: 10000,
				});

				if (confirmation.customId === "confirmLeave") {
					await confirmation.deferUpdate();
					await interaction.editReply({
						content: `Checking if you are on a team...`,
						components: [],
					});
				}
			} catch (error) {
				await interaction.editReply({
					content:
						"You failed to confirm if you want to leave within the time limit. Please try again.",
					components: [],
				});
				return;
			}

			const tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			let response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					CS_BASE,
					CS_TABLE,
					`CurrentValue.[Discord ID] = "${interaction.user.id}"`
				)
			);

			if (!response.data.total) {
				await interaction.editReply({
					content: `You are not on a team.\n\nPlease use </register team:1097845563568963624> to register your team first.`,
				});
				return;
			}

			const title = response.data.items[0].fields["Title"];
			const teamName = response.data.items[0].fields["Team Name"];
			const recordId = response.data.items[0].record_id;

			if (title === "Member") {
				await interaction.editReply({
					content: `Trying to leave team **${teamName}**...`,
				});

				await feishu.deleteRecord(tenantToken, CS_BASE, CS_TABLE, recordId);

				await interaction.editReply({
					content: `You have left team **${teamName}**.`,
				});
				return;
			}

			await interaction.editReply({
				content: `Trying to find next team member of team **${teamName}** to transfer leader to...`,
			});

			response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					CS_BASE,
					CS_TABLE,
					`AND(CurrentValue.[Team Name] = "${teamName}", CurrentValue.[Title] = "Member")`
				)
			);

			const memberName = response.data.items[0].fields["Discord Name"];
			const memberRecordId = response.data.items[0].record_id;

			await interaction.editReply({
				content: `Transferring leader of team **${teamName}** to **${memberName}**...`,
			});

			await feishu.updateRecord(
				tenantToken,
				CS_BASE,
				CS_TABLE,
				memberRecordId,
				{ fields: { Title: "Leader" } }
			);

			await feishu.deleteRecord(tenantToken, CS_BASE, CS_TABLE, recordId);

			await interaction.editReply({
				content: `You have left team **${teamName}** and transferred leader to **${memberName}**.`,
			});
		}
	},
};
