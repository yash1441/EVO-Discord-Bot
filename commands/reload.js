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
		.setName("reload")
		.setDescription("Reload data from the database.")
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
				.setName("creators-list")
				.setDescription("Add all Content Creators to the list.")
		)
		.addSubcommand((subcommand) =>
			subcommand.setName("cec-data").setDescription("Calculate CEC data.")
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("cec-bp")
				.setDescription("Calculate BP Amount in CEC data.")
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
		),

	async execute(interaction, client) {
		if (
			interaction.user.id != process.env.MY_ID &&
			interaction.user.id != process.env.VOID_ID &&
			interaction.user.id != process.env.ELSON_ID &&
			interaction.user.id != process.env.COSMOS_ID
		) {
			return;
		}
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
					const guild = client.guilds.cache.get(process.env.EVO_SERVER);
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
		} else if (subCommand === "creators-list") {
			if (interaction.user.id != process.env.MY_ID) return;
			await interaction.guild.members.fetch();
			const creatorRole = interaction.guild.roles.cache.find(
				(role) => role.name === "Content Creator"
			);
			let creatorsIdList = creatorRole.members.map((member) => member.id);
			let creatorsNameList = creatorRole.members.map(
				(member) => member.user.tag
			);

			let creatorsList = [];

			for (let i = 0; i < creatorsIdList.length; i++) {
				let data = {
					fields: {
						"Discord ID": creatorsIdList[i],
						"Discord Name": creatorsNameList[i],
					},
				};
				creatorsList.records.push(data);
			}

			let tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			await feishu.createRecords(
				tenantToken,
				process.env.CEP_BASE,
				process.env.CEP_CREATOR,
				{ records: creatorsList }
			);
		} else if (subCommand === "cec-data") {
			await interaction.reply({
				content: "Calculating CLUB Data...",
				ephemeral: true,
			});

			const tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			let response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CEP_BASE,
					process.env.CEP_SUBMISSION,
					`AND(CurrentValue.[Validity] = "VALID", CurrentValue.[Views] > 999, CurrentValue.[Submission Date] >= DATE(2022,12,1))`
				)
			);

			let records = [];

			for (const record of response.data.items) {
				let shouldContinue = false;
				if (!record.fields["Discord ID"]) continue;
				const guild = client.guilds.cache.get(process.env.EVO_CEC_SERVER);
				const member = await guild.members
					.fetch(record.fields["Discord ID"])
					.catch((error) => {
						logger.error(
							`Error fetching member ${record.fields["Discord ID"]}. ${error}`
						);
						shouldContinue = true;
					});

				if (shouldContinue) continue;

				if (member == undefined) continue;

				if (!member.roles.cache.has(process.env.VERIFIED_ROLE)) continue;

				if (
					(record.fields["Platform"] == "TikTok" ||
						record.fields["Platform"] == "YouTube Shorts") &&
					record.fields["Views"] < 5000
				)
					continue;

				let tempRecord = {};
				if (
					record.fields["Platform"] == "TikTok" ||
					record.fields["Platform"] == "YouTube Shorts"
				) {
					tempRecord = {
						"Discord ID": record.fields["Discord ID"],
						"Discord Name": record.fields["Discord Name"],
						"Short Views": parseInt(record.fields["Views"]),
						Views: 0,
						Videos: 1,
					};
				} else {
					tempRecord = {
						"Discord ID": record.fields["Discord ID"],
						"Discord Name": record.fields["Discord Name"],
						"Short Views": 0,
						Views: parseInt(record.fields["Views"]),
						Videos: 1,
					};
				}

				let existingData = records.find(
					(r) => r["Discord ID"] === tempRecord["Discord ID"]
				);

				if (existingData) {
					existingData["Short Views"] += tempRecord["Short Views"];
					existingData["Views"] += tempRecord["Views"];
					existingData["Videos"] += tempRecord["Videos"];
				} else {
					records.push(tempRecord);
				}
			}

			for (const record of records) {
				response = JSON.parse(
					await feishu.getRecords(
						tenantToken,
						process.env.CEP_BASE,
						process.env.CEC_DATA,
						`CurrentValue.[Discord ID] = "${record["Discord ID"]}"`
					)
				);
				if (response.data.total) {
					await feishu.updateRecord(
						tenantToken,
						process.env.CEP_BASE,
						process.env.CEC_DATA,
						response.data.items[0].record_id,
						{ fields: record }
					);
				} else {
					await feishu.createRecord(
						tenantToken,
						process.env.CEP_BASE,
						process.env.CEC_DATA,
						{ fields: record }
					);
				}
			}

			await interaction.editReply({
				content: "CLUB Data Calculated.",
				ephemeral: true,
			});
		} else if (subCommand === "cec-bp") {
			await interaction.reply({
				content: "Calculating CEC BP Data...",
				ephemeral: true,
			});

			await interaction.member.fetch();

			const tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			let response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CEP_BASE,
					process.env.CEP_SUBMISSION,
					`AND(CurrentValue.[Validity] = "VALID", OR(CurrentValue.[Platform] = "YouTube", CurrentValue.[Platform] = "YouTube Shorts", CurrentValue.[Platform] = "TikTok"), CurrentValue.[Views] > 999)`
				)
			);

			if (!response.data.total) {
				return await interaction.editReply({
					content: "No CEP Submissions Found.",
				});
			}

			let records = [];

			for (const record of response.data.items) {
				let shouldContinue = false,
					tempData = {};

				const guild = await client.guilds.fetch(process.env.EVO_CEC_SERVER);
				await guild.members
					.fetch(record.fields["Discord ID"])
					.then((member) => {
						if (!member.roles.cache.has(process.env.VERIFIED_ROLE)) {
							return (shouldContinue = true);
						} else shouldContinue = false;
					})
					.catch((error) => {
						shouldContinue = true;
					});

				if (shouldContinue) continue;

				if (
					(record.fields["Platform"] === "YouTube Shorts" ||
						record.fields["Platform"] === "TikTok") &&
					parseInt(record.fields["Views"]) < 5000
				)
					continue;

				tempData = {
					recordId: record.record_id,
					discordId: record.fields["Discord ID"],
					totalViews: parseInt(record.fields["Views"]),
				};

				let existingData = records.find(
					(r) => r["Discord ID"] === tempData["Discord ID"]
				);
				if (existingData) {
					logger.info(
						record.fields["Discord Name"] + ": +" + tempData["Views"] + " views"
					);
					existingData["Views"] += tempData["Views"];
				} else {
					console.log({ tempData });
					records.push(tempData);
				}
			}

			logger.debug(records.length);

			for (const record of records) {
				let bp = 0.0,
					bpRate = 1.0;

				response = JSON.parse(
					await feishu.getRecords(
						tenantToken,
						process.env.CEP_BASE,
						process.env.CEC_BENEFIT,
						`CurrentValue.[Discord ID] = "${record.discordId}"`
					)
				);

				if (
					response.data.total &&
					(response.data.items[0].fields["Benefit Level"].includes("Senior") ||
						response.data.items[0].fields["Benefit Level"].includes("Elite"))
				) {
					bpRate = parseFloat(response.data.items[0].fields["BP Rate"]);
				} else continue;

				if (bpRate == NaN) bpRate = 0.0;
				bp = (record.totalViews / 5000) * bpRate;

				await feishu.updateRecord(
					tenantToken,
					process.env.CEP_BASE,
					process.env.CEC_DATA,
					record.recordId,
					{ fields: { "BP Amount": bp } }
				);
			}

			await interaction.editReply({
				content: "BP Data Calculated.",
			});
		} else if (subCommand === "ask-reward") {
			await interaction.reply({
				content: "Checking for records marked **Ask**...",
				ephemeral: true,
			});

			let tenantToken = await feishu.authorize(
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
				let guild = client.guilds.cache.get(process.env.EVO_SERVER);
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
					const channel = await client.channels.cache.get(
						process.env.COLLECT_REWARDS_CHANNEL
					);
					const user = await client.users.cache.get(
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

					const channel = await client.channels.cache.get(
						process.env.COLLECT_REWARDS_CHANNEL
					);
					await privateChannel(
						channel,
						"Reward - " + member.user.username,
						discordId,
						client,
						message,
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
			const guild = await client.guilds.fetch(process.env.EVO_SERVER);
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

				const user = await client.users
					.fetch(record.discord_id)
					.catch(() => null);

				const channel = await client.channels.cache.get("1090274679807287296");

				await privateChannel(
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
			await interaction.guild.members.fetch();

			const tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			const response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					"bascnZdSuzx6L7uAxP9sNJcY0vY",
					"tblmLa8SlkiASY0R",
					`OR(CurrentValue.[Result of Report Review] = "Invalid", CurrentValue.[Result of Report Review] = "Valid")`
				)
			);

			if (!response.data.total) {
				logger.info("No violations found.");
				await interaction.editReply({ content: "No violations found." });
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
						.setTitle(
							`After our review, it has been confirmed that the reported player \`${reportedPlayer}\` violates the game rules. The player has been punished for the violation. Thank you for supporting the maintenance of the game environment!`
						);

					const guild = client.guilds.cache.get(process.env.EVO_SERVER);
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
				} else if (status == "Invalid") {
					const embed = new EmbedBuilder()
						.setColor("#FF0000")
						.setTitle(
							`After our review, it is not found that the reported player \`${reportedPlayer}\` has violated the game rules. If there is more evidence, please submit them to continue your report. Appreciation for supporting the maintenance of the game environment!`
						);

					const guild = client.guilds.cache.get(process.env.EVO_SERVER);
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

				const user = await client.users
					.fetch(record.discord_id)
					.catch(() => null);

				const channel = await client.channels.cache.get("1090274679807287296");

				await privateChannel(
					channel,
					"Violation - " + user.username,
					record.discord_id,
					client,
					false,
					[record.embed],
					[row],
					"*Press close to close this thread.*"
				);
			}

			await interaction.editReply({
				content: `**Total Violations Resolved** ${response.data.items.length}`,
			});
		}
	},
};

async function privateChannel(
	channel,
	channelName,
	discordId,
	client,
	message,
	embeds,
	components,
	closer
) {
	const user = await client.users.cache.get(discordId);

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
