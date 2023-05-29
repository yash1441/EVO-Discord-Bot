const {
	SlashCommandBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	StringSelectMenuBuilder,
	EmbedBuilder,
	PermissionFlagsBits,
} = require("discord.js");
const feishu = require("../feishu.js");
const logger = require("../logging/logger.js");
require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("reload")
		.setDescription("Reload data from the database.")
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.setDMPermission(false)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("creators")
				.setDescription("Add Content Creator role to the accepted users.")
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("rewards")
				.setDescription("Deliver rewards to the accepted users.")
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("ask-reward")
				.setDescription("Ask winners their region and reward type.")
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("check-appeal")
				.setDescription("Check if appeal report is pending.")
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("check-violation")
				.setDescription("Check if violation report is pending.")
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("series-role")
				.setDescription(
					"Gives players in the Community Series Participants table the role."
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("check-creators")
				.setDescription(
					"Check if creators are still in the server."
				)
		),

	async execute(interaction) {
		const subCommand = interaction.options.getSubcommand();

		if (subCommand === "creators") {
			await interaction
				.reply({
					content: "Updating the list of creators...",
					ephemeral: true,
				})
				.then(() => {
					logger.info("Updating the list of creators.");
				});

			const tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			const response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CEP_BASE,
					process.env.CEP_APP,
					`CurrentValue.[Status] = "Accepted"`
				)
			);

			logger.info(`Found ${response.data.total} accepted creators.`);

			let creatorList = [];

			if (response.data.total) {
				for (const item of response.data.items) {
					creatorList.push({
						discordId: item.fields["Discord ID"],
						recordId: item.record_id,
					});
				}

				for (const creator of creatorList) {
					const guild = await interaction.client.guilds.cache.get(
						process.env.EVO_SERVER
					);
					const member = await guild.members
						.fetch(creator.discordId)
						.catch((error) => {
							logger.error(error);
						});
					if (member == undefined) {
						await feishu.updateRecord(
							tenantToken,
							process.env.CEP_BASE,
							process.env.CEP_APP,
							creator.recordId,
							{ fields: { Status: "Failed" } }
						);
						logger.error(`Failed to find member ${creator.discordId}.`);
					} else {
						await member.roles
							.add(process.env.CC_ROLE)
							.catch(() => {
								feishu.updateRecord(
									tenantToken,
									process.env.CEP_BASE,
									process.env.CEP_APP,
									creator.recordId,
									{ fields: { Status: "Failed" } }
								);
								logger.error(`Failed to add CC role to ${creator.discordId}.`);
							})
							.then(() => {
								feishu.updateRecord(
									tenantToken,
									process.env.CEP_BASE,
									process.env.CEP_APP,
									creator.recordId,
									{ fields: { Status: "Done" } }
								);
								logger.info(`Added CC role to ${creator.discordId}.`);
							});
					}
				}
				await interaction
					.editReply({ content: "Updated!", ephemeral: true })
					.then(() => {
						logger.info("Updated the list of creators.");
					});
			} else {
				await interaction
					.editReply({
						content: "No creators accepted yet.",
						ephemeral: true,
					})
					.then(() => {
						logger.info("No creators accepted yet.");
					});
			}
		} else if (subCommand === "ask-reward") {
			await interaction.reply({
				content: "Checking for records marked **Ask**...",
				ephemeral: true,
			});

			const tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			let response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.REWARD_BASE,
					process.env.DELIVERY,
					`CurrentValue.[Status] = "Ask"`
				)
			);

			if (!response.data.total) {
				return await interaction.editReply({
					content: "No records marked **Ask** found.",
					ephemeral: true,
				});
			}

			for (const record of response.data.items) {
				let guild = await interaction.client.guilds.cache.get(
					process.env.EVO_SERVER
				);
				let member = await guild.members.fetch(record.fields["Discord ID"]);

				const row = new ActionRowBuilder().addComponents(
					new StringSelectMenuBuilder()
						.setCustomId("askRegionSelectMenu" + record.record_id)
						.setPlaceholder("Select your region")
						.addOptions(
							{ label: "Brazil", value: "Brazil" },
							{ label: "Mexico", value: "Mexico" },
							{ label: "United States", value: "United States" },
							{ label: "Canada", value: "Canada" },
							{ label: "Australia", value: "Australia" },
							{ label: "India", value: "India" },
							{ label: "Thailand", value: "Thailand" },
							{ label: "Philippines", value: "Philippines" },
							{ label: "Turkey", value: "Turkey" },
							{ label: "Russia", value: "Russia" },
							{ label: "Ukraine", value: "Ukraine" },
							{ label: "Indonesia", value: "Indonesia" },
							{ label: "EU", value: "EU" },
							{ label: "United Arab Emirates", value: "United Arab Emirates" }
						)
				);

				let error = false;

				await member
					.send({
						content:
							"**Please fill in two options to complete the information collection.**\n*If you can't find your region or reward, please contact **Cosmos#4776**.*",
						components: [row],
					})
					.then(() => {
						feishu.updateRecord(
							tenantToken,
							process.env.REWARD_BASE,
							process.env.DELIVERY,
							record.record_id,
							{ fields: { NOTE2: "Asked Region" } }
						);
					})
					.catch((error) => {
						error = true;
						feishu.updateRecord(
							tenantToken,
							process.env.REWARD_BASE,
							process.env.DELIVERY,
							record.record_id,
							{ fields: { NOTE2: "Asked Region" } }
						);
					});

				if (error) {
					const channel = await interaction.client.channels.cache.get(
						process.env.COLLECT_REWARDS_CHANNEL
					);
					const user = await interaction.client.users.cache.get(
						record.fields["Discord ID"]
					);

					await channel.permissionOverwrites.create(user, {
						ViewChannel: true,
					});

					const thread = await channel.threads.create({
						name: user.id,
						reason: `${user.username} has private DMs`,
						type: ChannelType.PrivateThread,
					});

					await thread.members.add(user.id);

					await thread.send({
						content:
							"**Please fill in two options to complete the information collection.**\n*If you can't find your region or reward, please contact **Cosmos#4776**.*",
						components: [row],
					});
				}
			}

			await interaction.editReply({
				content: "Records marked with **Ask** have been sent the form.",
				ephemeral: true,
			});
		} else if (subCommand === "rewards") {
			// Defers the reply to the interaction
			await interaction
				.reply({
					content: "Updating the list of rewards...",
					ephemeral: true,
				})
				.then(() => {
					logger.info(`Updating the list of rewards.`);
				});

			// Declare constants - tenantToken, claimButton, claimRow
			const tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			// Get records that are Ready from the Reward Delivery table

			const rewardData = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.REWARD_BASE,
					process.env.DELIVERY,
					`AND(CurrentValue.[Status] = "Ready")`
				)
			);

			logger.info(`Rewards Found: ${rewardData.data.total}`);

			// If no records are found, return

			if (!rewardData.data.total) {
				logger.info(`No rewards found.`);
				return await interaction.editReply({
					content: "No rewards found.",
					ephemeral: true,
				});
			}

			const failed = [];

			// For each record

			for (const record of rewardData.data.items) {
				let shouldContinue = false,
					message;
				const discordId = record.fields["Discord ID"];
				const winnerType = record.fields["Winner Type"];
				const rewardType = record.fields["Reward Type"];
				const rewardCodeAmount = record.fields["Number of Codes"];
				const rewardCurrency = record.fields["Currency"];
				const rewardValue = record.fields["Value"];
				let rewardCode = record.fields["Card Code"];
				const event = record.fields["Event"];
				const recordId = record.record_id;

				// If the member is not found, return

				const member = await interaction.guild.members
					.fetch(discordId)
					.catch((error) => {
						logger.error(discordId + " - " + error);
						failed.push({ record_id: recordId, reason: "Member Not Found" });
						shouldContinue = true;
					});

				if (shouldContinue) continue;

				// If the reward type is not defined, return

				if (rewardType == undefined) {
					failed.push({
						record_id: recordId,
						reason: "Reward Type Not Defined",
					});
					continue;
				}

				// If the winner type is not defined, return

				if (winnerType == undefined) {
					failed.push({
						record_id: recordId,
						reason: "Winner Type Not Defined",
					});
					continue;
				}

				// Check reward type, generate codes if necessary, and assign the message

				if (rewardType == "Beta Codes") {
					if (rewardCodeAmount == undefined) {
						failed.push({
							record_id: recordId,
							reason: "Number of Codes Not Defined",
						});
						continue;
					}

					if (rewardCode == undefined) {
						const quantity = parseInt(rewardCodeAmount);
						const generatedCodes = await generateCodes(quantity, discordId);

						if (generatedCodes.length == 0) {
							failed.push({
								record_id: recordId,
								reason: "Failed to Generate Codes",
							});
							shouldContinue = true;
						}

						if (shouldContinue) continue;

						rewardCode = generatedCodes.join("\n");

						logger.info(`${rewardCode}`);
					} else rewardCode = rewardCode.replace(/ /g, "\n");

					switch (winnerType) {
						case "Player":
							message = `**BETA CODES ARE HERE!**\nHey! Dear players!\nYou have earned ${rewardCodeAmount} code(s) from Discord events. Thanks for your partcipation! The codes are below:\n\n\`${rewardCode}\`\n\nThe beta will open on 1 Dec 2022. Please stay tuned to the official announcement on Discord and download the game in advance. This is the download link: http://bit.ly/3ESJHhS\n\nIf you encounter problems when downloading the game, please reach out to our staff on #support channel in our official Discord: https://discord.gg/projectevogame`;
							break;
						case "CEP Members":
							message = `**BETA CODES ARE HERE!**\nHey! Dear EVO Content Creator!\nYou have earned ${rewardCodeAmount} code(s) from Creator Evolution Project. Thanks for your dedication! The codes are below:\n\n\`${rewardCode}\`\n\nThe beta will open on 1 Dec 2022. Please stay tuned to the official announcement on Discord and download the game in advance. This is the download link: http://bit.ly/3ESJHhS\n\nIf you encounter problems when downloading the game, please reach out to our staff on #support channel in our official Discord: https://discord.gg/projectevogame\nGood Luck. Have Fun!`;
							break;
						case "L10N HERO":
							message = `**BETA CODES ARE HERE!**\nHey! Dear players!\nYou have earned ${rewardCodeAmount} code(s) because of the dedication and contribution you have made for Project EVO. Thanks for your effort! The codes are below:\n\n\`${rewardCode}\`\n\nThe beta will open on 1 Dec 2022. Please stay tuned to the official announcement on Discord and download the game in advance. This is the download link: http://bit.ly/3ESJHhS\n\nIf you encounter problems when downloading the game, please reach out to our staff on #support channel in our official Discord: https://discord.gg/projectevogame\n\nProject EVO Team`;
							break;
						case "Invited Creators":
							message = `**PROJECT EVO - BETA INVITATION**\nDear <@${discordId}>\nThis is the Project EVO dev team - we are writing this message to offer our most sincere thanks, as we noticed that you have been following our game closely, and you have created very awesome content for our game! (beta code and download link at the bottom)\n\nThe beta opens on __1 Dec 2022__. We sincerely invite you to join our beta so that you can experience the latest developed in-game content and give us your feedback. We hope that you will continue to create more high-quality video content for our game during the beta!\n\nMeanwhile, we very much look forward to further collaborating with you when the new version of the Creator Evolution Project is launched on 1 Dec. Check details here in __#cep-update__ channel\n<https://discord.com/channels/951777532003381278/1047446400566312990>\n\nCreator Evolution Club is also found to provide the best support to help you grow as an outstanding EVO content creator. **It creates an aspirational influencer community for EVO creators who have great potential and passion. Apply now in the __#club-application__ channel\n<https://discord.com/channels/951777532003381278/1042753136701476884>**\n\n__This is the code to get access to the beta and activate the game:__\n\`${rewardCode}\`\nThe beta will open on __1 Dec 2022__. Please stay tuned to the official announcement on Discord and download the game in advance. This is the download link: http://bit.ly/3ESJHhS\n\nIf you encounter problems when downloading the game, please reach out to our staff on # support channel in our official Discord: https://discord.gg/projectevogame\n\nIn the end. Good Luck. Have Fun!\nBest Regards\nProject EVO Team\n\nhttps://i.ibb.co/9gBLc4v/20221201-122549.jpg`;
							break;
						default:
							message = `Congrats! You have been rewarded ${rewardType}.\n\nCode:\n\`${rewardCode}\` \n\nPlease tap **Claim** below to confirm.`;
							break;
					}
				} else {
					if (rewardCurrency == undefined) {
						failed.push({
							record_id: recordId,
							reason: "Currency Not Defined",
						});
						continue;
					}

					if (rewardValue == undefined) {
						failed.push({
							record_id: recordId,
							reason: "Value Not Defined",
						});
						continue;
					}

					message = `Congrats! You have been rewarded a ${rewardType} worth ${rewardValue} ${rewardCurrency}.\n\n${rewardCode}\n\nPlease tap **Claim** below to confirm.`;
				}

				// Send the message to the member

				const claimButton = new ButtonBuilder()
					.setCustomId("claim" + recordId)
					.setLabel("Claim")
					.setStyle(ButtonStyle.Success)
					.setEmoji("✅");

				const claimRow = new ActionRowBuilder().addComponents(claimButton);

				let success = true;

				await member
					.send({
						content: message,
						components: [claimRow],
					})
					.catch((error) => {
						logger.error(
							`Failed to send message to ${discordId} for record ${recordId}.`
						);
						success = false;
					});

				if (success) {
					logger.info(`Sent message to ${discordId} for record ${recordId}.`);
					await feishu.updateRecord(
						tenantToken,
						process.env.REWARD_BASE,
						process.env.DELIVERY,
						recordId,
						{ fields: { "Card Code": rewardCode, Status: "Sent" } }
					);
				} else {
					logger.info(
						`Sending message to ${discordId} failed. Creating private channel.`
					);

					const channel = await interaction.client.channels.cache.get(
						process.env.COLLECT_REWARDS_CHANNEL
					);
					await privateChannel(
						interaction,
						channel,
						"Reward - " + member.user.username,
						discordId,
						`${member.user}\n` + message,
						false,
						[claimRow],
						"**Once you click CLAIM, this thread would be DELETED.**\nPlease copy the reward/code somewhere and only then press the button."
					);
				}
			}

			if (failed.length > 0) {
				for (const record of failed) {
					await feishu.updateRecord(
						tenantToken,
						process.env.REWARD_BASE,
						process.env.DELIVERY,
						record.record_id,
						{ fields: { Status: "Failed", NOTE2: record.reason } }
					);
				}
			}

			await interaction.editReply({ content: "Done!", components: [] });
			logger.info(
				`Reward sending finished. ${rewardData.data.total} rewards sent. ${failed.length} failed.`
			);
		} else if (subCommand === "check-appeal") {
			await interaction.deferReply({ ephemeral: true });
			const guild = await interaction.client.guilds.fetch(
				process.env.EVO_SERVER
			);
			//await guild.members.fetch();

			const tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			const response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					"bascnZdSuzx6L7uAxP9sNJcY0vY",
					"tblybKlZE3yCZk72",
					`OR(CurrentValue.[Status] = "Approve", CurrentValue.[Status] = "Deny")`
				)
			);

			if (!response.data.total) {
				logger.info("No appeals found.");
				return await interaction.editReply({ content: "No appeals found." });
			}

			const failed = [];

			for (const record of response.data.items) {
				const discordId = record.fields["Discord ID"];
				const status = record.fields["Status"];
				const recordId = record.record_id;

				let note = "-";

				if (status == "Approve") {
					const embed = new EmbedBuilder()
						.setColor("#00FF00")
						.setTitle(
							"After further review, it was confirmed that your account had been unbanned."
						);

					const member = await guild.members
						.fetch(discordId)
						.then(() => {
							note = "Alert Sent";
						})
						.catch(() => {
							logger.debug("Member not found - " + discordId);
						});

					if (!member) {
						logger.warn("Member not found - " + discordId);
						failed.push({
							discord_id: discordId,
							embed: embed,
							record_id: recordId,
							reason: "Member not found",
						});
						continue;
					}

					await member.send({ embeds: [embed] }).catch((error) => {
						logger.error(error);
						failed.push({
							discord_id: discordId,
							embed: embed,
							record_id: recordId,
							reason: "DM failed",
						});
					});
				} else if (status == "Deny") {
					const embed = new EmbedBuilder()
						.setColor("#FF0000")
						.setTitle(
							"After further review, it was confirmed that your account had violated the game rules and thus could not be unbanned."
						);

					const member = await guild.members.fetch(discordId).then(() => {
						note = "Alert Sent";
					});

					if (!member) {
						logger.warn("Member not found - " + discordId);
						failed.push({
							discord_id: discordId,
							embed: embed,
							record_id: recordId,
							reason: "Member not found",
						});
						continue;
					}

					await member.send({ embeds: [embed] }).catch((error) => {
						logger.error(error);
						failed.push({
							discord_id: discordId,
							embed: embed,
							record_id: recordId,
							reason: "DM failed",
						});
					});
				}

				await feishu.updateRecord(
					tenantToken,
					"bascnZdSuzx6L7uAxP9sNJcY0vY",
					"tblybKlZE3yCZk72",
					recordId,
					{ fields: { Status: "Resolved", NOTE: note } }
				);
			}

			if (failed.length == 0) {
				return await interaction.editReply({
					content: `**Total Appeals Resolved** ${response.data.items.length}`,
				});
			}

			for (const record of failed) {
				await feishu.updateRecord(
					tenantToken,
					"bascnZdSuzx6L7uAxP9sNJcY0vY",
					"tblybKlZE3yCZk72",
					record.record_id,
					{ fields: { Status: "Resolved", NOTE: record.reason } }
				);

				const closeButton = new ButtonBuilder()
					.setCustomId("closeThread")
					.setLabel("Close")
					.setStyle(ButtonStyle.Danger)
					.setEmoji("❌");

				const row = new ActionRowBuilder().addComponents(closeButton);

				const user = await interaction.client.users
					.fetch(record.discord_id)
					.catch(() => null);

				const channel = await interaction.client.channels.cache.get(
					"1090274679807287296"
				);

				await privateChannel(
					interaction,
					channel,
					"Appeal - " + user.username,
					record.discord_id,
					false,
					[record.embed],
					[row],
					"*Press close to close this thread.*"
				);
			}

			await interaction.editReply({
				content: `**Total Appeals Resolved** ${response.data.items.length}`,
			});
		} else if (subCommand === "check-violation") {
			await interaction.deferReply({ ephemeral: true });

			const guild = interaction.client.guilds.cache.get(process.env.EVO_SERVER);
			await guild.members.fetch();

			const tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			const response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					"bascnZdSuzx6L7uAxP9sNJcY0vY",
					"tblmLa8SlkiASY0R",
					`OR(CurrentValue.[Result of Report Review] = "Invalid", CurrentValue.[Result of Report Review] = "Valid", CurrentValue.[Result of Report Review] = "Lack of information")`
				)
			);

			if (!response.data.total) {
				logger.info("No violations found.");
				return;
			}

			const failed = [];

			for (const record of response.data.items) {
				const discordId = record.fields["Discord ID"];
				const status = record.fields["Result of Report Review"];
				const reportedPlayer = record.fields["Nickname"];
				const recordId = record.record_id;

				let note = "-";

				if (status == "Valid") {
					const embed = new EmbedBuilder()
						.setColor("#00FF00")
						.setDescription(
							`**After our review, it has been confirmed that the reported player \`${reportedPlayer}\` violates the game rules. The player has been punished for the violation. Thank you for supporting the maintenance of the game environment!**`
						);

					await guild.members
						.fetch(discordId)
						.then(async (member) => {
							await member.send({ embeds: [embed] }).catch((error) => {
								logger.error(error);
								failed.push({
									discord_id: discordId,
									embed: embed,
									record_id: recordId,
									reason: "DM failed",
								});
							});
						})
						.catch(() => {
							logger.warn("Member not found - " + discordId);
							failed.push({
								discord_id: discordId,
								embed: embed,
								record_id: recordId,
								reason: "Member not found",
							});
						});
				} else if (status == "Invalid") {
					const embed = new EmbedBuilder()
						.setColor("#FF0000")
						.setDescription(
							`**After our review, it is not found that the reported player \`${reportedPlayer}\` has violated the game rules. If there is more evidence, please submit them to continue your report. Appreciation for supporting the maintenance of the game environment!**`
						);

					const guild = interaction.client.guilds.cache.get(
						process.env.EVO_SERVER
					);
					const member = await guild.members.fetch(discordId).then(() => {
						note = "Alert Sent";
					});

					if (!member) {
						logger.warn("Member not found - " + discordId);
						failed.push({
							discord_id: discordId,
							embed: embed,
							record_id: recordId,
							reason: "Member not found",
						});
						continue;
					}

					await member.send({ embeds: [embed] }).catch((error) => {
						logger.error(error);
						failed.push({
							discord_id: discordId,
							embed: embed,
							record_id: recordId,
							reason: "DM failed",
						});
					});
				} else if (status == "Lack of information") {
					const embed = new EmbedBuilder()
						.setColor("#FFFF00")
						.setDescription(
							`**The report information for \`${reportedPlayer}\` you provided is insufficient. Please submit a new report to provide more detailed information, such as an accurate Role ID, a video that can clearly identify the violation, etc.**`
						);

					const guild = interaction.client.guilds.cache.get(
						process.env.EVO_SERVER
					);
					const member = await guild.members.fetch(discordId).then(() => {
						note = "Alert Sent";
					});

					if (!member) {
						logger.warn("Member not found - " + discordId);
						failed.push({
							discord_id: discordId,
							embed: embed,
							record_id: recordId,
							reason: "Member not found",
						});
						continue;
					}

					await member.send({ embeds: [embed] }).catch((error) => {
						logger.error(error);
						failed.push({
							discord_id: discordId,
							embed: embed,
							record_id: recordId,
							reason: "DM failed",
						});
					});
				}

				await feishu.updateRecord(
					tenantToken,
					"bascnZdSuzx6L7uAxP9sNJcY0vY",
					"tblmLa8SlkiASY0R",
					recordId,
					{ fields: { "Result of Report Review": "Resolved", NOTE: note } }
				);
			}

			if (failed.length == 0) return;

			for (const record of failed) {
				await feishu.updateRecord(
					tenantToken,
					"bascnZdSuzx6L7uAxP9sNJcY0vY",
					"tblmLa8SlkiASY0R",
					record.record_id,
					{
						fields: {
							"Result of Report Review": "Resolved",
							NOTE: record.reason,
						},
					}
				);

				const closeButton = new ButtonBuilder()
					.setCustomId("closeThread")
					.setLabel("Close")
					.setStyle(ButtonStyle.Danger)
					.setEmoji("❌");

				const row = new ActionRowBuilder().addComponents(closeButton);

				const user = await interaction.client.users
					.fetch(record.discord_id)
					.catch(() => null);

				await privateChannel(
					interaction,
					"1090274679807287296",
					"Violation - " + user.username,
					record.discord_id,
					false,
					[record.embed],
					[row],
					"*Press close to close this thread.*"
				);
			}

			await interaction.editReply({
				content: `**Total Violations Resolved** ${response.data.items.length}`,
			});
		} else if (subCommand === "series-role") {
			await interaction.deferReply({ ephemeral: true });

			const memberRoleId = "1099265236332200008";
			const leaderRoleId = "1100494341484593283";

			const tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			const response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CEP_BASE,
					"tbldRdK13SWajFrN"
				)
			);

			if (!response.data.total) {
				await interaction.editReply({
					content: "No records found.",
				});
				return;
			}

			for (const record of response.data.items) {
				const discordId = record.fields["Discord ID"];
				const title = record.fields["Title"];

				if (title === "Member") {
					await interaction.guild.members
						.fetch(discordId)
						.then(async (member) => {
							await member.roles.add(memberRoleId);
						})
						.catch((error) => logger.error(error));
				} else if (title === "Leader") {
					await interaction.guild.members
						.fetch(discordId)
						.then(async (member) => {
							await member.roles.add(leaderRoleId);
						})
						.catch((error) => logger.error(error));
				}
			}

			await interaction.editReply({
				content: `**Total Roles Added** ${response.data.items.length}`,
			});
		} else if (subCommand === "check-cep-app") {
			await interaction.reply({
				content: "Checking for creator applications...",
				ephemeral: true,
			});

			const left = [];

			const tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			const response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CEP_BASE,
					process.env.CEP_APP,
					`CurrentValue.[Status] = "Done"`
				)
			);

			if (!response.data.total) {
				return await interaction.editReply({
					content: "No records found.",
				});
			}

			for (const record of response.data.items) {
				const discordId = record.fields["Discord ID"];
				const member = await interaction.guild.members.fetch(discordId);

				if (!member) {
					left.push(record.record_id);
				}
			}

			await interaction.editReply({ content: `${left.length} members left the server. ${left[0]}` });
		}
	},
};

async function privateChannel(
	interaction,
	channel,
	channelName,
	discordId,
	message,
	embeds,
	components,
	closer
) {
	const user = await interaction.client.users.cache.get(discordId);

	await channel.permissionOverwrites.create(user, {
		ViewChannel: true,
	});

	const thread = await channel.threads.create({
		name: channelName,
		reason: `${user.username} has private DMs`,
		type: ChannelType.PrivateThread,
	});

	await thread.members.add(user.id);

	let finalMessage = {};

	if (message) finalMessage.content = message;
	if (embeds) finalMessage.embeds = embeds;
	if (components) finalMessage.components = components;

	await thread.send(finalMessage);

	await thread.send({
		content: closer,
	});
}

async function generateCodes(quantity, discordId) {
	const codes = [];

	const tenantToken = await feishu.authorize(
		process.env.FEISHU_ID,
		process.env.FEISHU_SECRET
	);

	const codeData = JSON.parse(
		await feishu.getRecords(
			tenantToken,
			process.env.CODE_BASE,
			process.env.CODE_DATABASE,
			`NOT(CurrentValue.[Status] = "Used")`
		)
	);

	logger.info(
		`Codes available: ${codeData.data.total}.\nCodes needed: ${quantity}\nUser: ${discordId}.`
	);

	if (codeData.data.total < quantity) {
		return codes;
	}

	const selectedCodes = await codeData.data.items.slice(0, quantity);

	for (const code of selectedCodes) {
		await feishu.updateRecord(
			tenantToken,
			process.env.CODE_BASE,
			process.env.CODE_DATABASE,
			code.record_id,
			{
				fields: {
					"Discord ID": discordId,
					Status: "Used",
				},
			}
		);
		codes.push(code.fields["Beta Codes"]);
	}

	logger.info(`Codes generated for ${discordId}: ${codes.length}.`);

	return codes;
}
