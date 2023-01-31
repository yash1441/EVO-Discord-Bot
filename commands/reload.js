const {
	SlashCommandBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	StringSelectMenuBuilder,
} = require("discord.js");
const feishu = require("../feishu.js");
const logger = require("../logging/logger.js");
require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("reload")
		.setDescription("Reload data from the database.")
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
			subcommand
				.setName("cec-members")
				.setDescription("Add CEC Member role to accepted users.")
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
		),

	async execute(interaction, client) {
		if (
			interaction.user.id != process.env.MY_ID &&
			interaction.user.id != process.env.VOID_ID &&
			interaction.user.id != process.env.ELSON_ID
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

			let tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			let response = JSON.parse(
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
					const member = guild.members.cache.get(creator.discordId);
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
		} else if (subCommand === "rewards") {
			await interaction
				.reply({
					content: "Updating the list of rewards...",
					ephemeral: true,
				})
				.then(() => {
					logger.info(`Updating the list of rewards.`);
				});

			let tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			const claimButton = new ButtonBuilder()
				.setCustomId("claimButton")
				.setLabel("Claim")
				.setStyle(ButtonStyle.Success)
				.setEmoji("✅");

			const claimRow = new ActionRowBuilder().addComponents(claimButton);

			let response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.REWARD_BASE,
					process.env.DELIVERY,
					`AND(CurrentValue.[Status] = "Ready")`
				)
			);

			logger.info(`Found ${response.data.total} rewards ready to be sent.`);

			let creatorList = [];

			if (response.data.total) {
				for (const creator of response.data.items) {
					creatorList.push({
						discord_id: creator.fields["Discord ID"],
						winner_type: creator.fields["Winner Type"],
						reward_type: creator.fields["Reward Type"],
						reward_currency: creator.fields["Currency"],
						reward_value: creator.fields["Value"],
						reward_code: creator.fields["Card Code"],
						number_codes: creator.fields["Number of Codes"],
						event: creator.fields["Event"],
						record_id: creator.record_id,
					});
				}

				for (const creator of creatorList) {
					let message = `Congrats! You have been rewarded a ${creator.reward_type} worth ${creator.reward_value} ${creator.reward_currency}.\n\nCode:\n\`${creator.reward_code}\` \n\nPlease tap **Claim** below to confirm.`;
					let attachment = "",
						codes = creator.reward_code;
					const guild = client.guilds.cache.get(process.env.EVO_SERVER);
					const member = guild.members.cache.get(creator.discord_id);

					if (member == undefined) {
						await feishu.updateRecord(
							tenantToken,
							process.env.REWARD_BASE,
							process.env.DELIVERY,
							creator.record_id,
							{ fields: { Status: "Failed", NOTE2: "Left Server" } }
						);
						logger.error(
							`Failed to send reward to ${creator.discord_id}. Left Server.`
						);
						continue;
					}

					if (creator.reward_currency == undefined)
						message = `Congrats! You have been rewarded ${creator.reward_type}.\n\nCode:\n\`${codes}\` \n\nPlease tap **Claim** below to confirm.`;
					else if (
						creator.winner_type == "Content Event Winner" &&
						creator.event == "Content Creation Event - Pro Award - Week 1"
					) {
						message = `Congratulations! You have won a reward from the $3000 gift card pool of the Content Creation Event, the reward is ${creator.reward_type}, and it is worth ${creator.reward_currency} ${creator.reward_value}.\n\nThe gift card code: \`${codes}\``;
					}

					switch (creator.reward_type) {
						case "Beta Codes":
							if (creator.reward_code == undefined) {
								if (creator.number_codes == undefined) {
									await interaction.followUp({
										content:
											creator.discord_id +
											" - **Number of Codes** is `undefined`.",
										ephemeral: true,
									});
									await feishu.updateRecord(
										tenantToken,
										process.env.REWARD_BASE,
										process.env.DELIVERY,
										creator.record_id,
										{ fields: { Status: "Failed" } }
									);
									logger.error(
										`${creator.discord_id} - Number of Codes is undefined.`
									);
									continue;
								}

								let quantity = parseInt(creator.number_codes);
								let response = JSON.parse(
									await feishu.getRecords(
										tenantToken,
										process.env.CODE_BASE,
										process.env.CODE_DATABASE,
										`NOT(CurrentValue.[Status] = "Used")`
									)
								);

								logger.info(
									`Codes available: ${response.data.total}.\nCodes needed: ${quantity}.`
								);

								if (response.data.total < quantity) {
									await interaction.followUp({
										content:
											creator.discord_id + " - Not enough codes available.",
										ephemeral: true,
									});
									await feishu.updateRecord(
										tenantToken,
										process.env.REWARD_BASE,
										process.env.DELIVERY,
										creator.record_id,
										{ fields: { Status: "Failed" } }
									);
									logger.error(
										`${creator.discord_id} - Not enough codes available.`
									);
									continue;
								}

								let chosenRecord = [],
									codeList = [];

								for (let i = 0; i < quantity; i++) {
									chosenRecord.push({
										record_id: response.data.items[i].record_id,
										code: response.data.items[i].fields["Beta Codes"],
									});
								}

								for (const record of chosenRecord) {
									await feishu.updateRecord(
										tenantToken,
										process.env.CODE_BASE,
										process.env.CODE_DATABASE,
										record.record_id,
										{
											fields: {
												Status: "Used",
												"Discord ID": creator.discord_id,
											},
										}
									);
									codeList.push(record.code);
								}
								codes = codeList.join("\n");
								await feishu.updateRecord(
									tenantToken,
									process.env.REWARD_BASE,
									process.env.DELIVERY,
									creator.record_id,
									{ fields: { "Card Code": codes } }
								);
								logger.info(`${creator.discord_id} - Codes generated.`);
							} else codes = creator.reward_code.replace(/ /g, "\n");
							if (creator.winner_type == "Player") {
								message = `**BETA CODES ARE HERE!**\nHey! Dear players!\nYou have earned ${creator.number_codes} code(s) from Discord events. Thanks for your partcipation! The codes are below:\n\n\`${codes}\`\n\nThe beta will open on 1 Dec 2022. Please stay tuned to the official announcement on Discord and download the game in advance. This is the download link: http://bit.ly/3ESJHhS\n\nIf you encounter problems when downloading the game, please reach out to our staff on #support channel in our official Discord: https://discord.gg/projectevogame`;
							} else if (creator.winner_type == "CEP Members") {
								message = `**BETA CODES ARE HERE!**\nHey! Dear EVO Content Creator!\nYou have earned ${creator.number_codes} code(s) from Creator Evolution Project. Thanks for your dedication! The codes are below:\n\n\`${codes}\`\n\nThe beta will open on 1 Dec 2022. Please stay tuned to the official announcement on Discord and download the game in advance. This is the download link: http://bit.ly/3ESJHhS\n\nIf you encounter problems when downloading the game, please reach out to our staff on #support channel in our official Discord: https://discord.gg/projectevogame\nGood Luck. Have Fun!`;
							} else if (creator.winner_type == "L10N HERO") {
								message = `**BETA CODES ARE HERE!**\nHey! Dear players!\nYou have earned ${creator.number_codes} code(s) because of the dedication and contribution you have made for Project EVO. Thanks for your effort! The codes are below:\n\n\`${codes}\`\n\nThe beta will open on 1 Dec 2022. Please stay tuned to the official announcement on Discord and download the game in advance. This is the download link: http://bit.ly/3ESJHhS\n\nIf you encounter problems when downloading the game, please reach out to our staff on #support channel in our official Discord: https://discord.gg/projectevogame\n\nProject EVO Team`;
							} else if (creator.winner_type == "Invited Creators") {
								message = `**PROJECT EVO - BETA INVITATION**\nDear <@${creator.discord_id}>\nThis is the Project EVO dev team - we are writing this message to offer our most sincere thanks, as we noticed that you have been following our game closely, and you have created very awesome content for our game! (beta code and download link at the bottom)\n\nThe beta opens on __1 Dec 2022__. We sincerely invite you to join our beta so that you can experience the latest developed in-game content and give us your feedback. We hope that you will continue to create more high-quality video content for our game during the beta!\n\nMeanwhile, we very much look forward to further collaborating with you when the new version of the Creator Evolution Project is launched on 1 Dec. Check details here in __#cep-update__ channel\n<https://discord.com/channels/951777532003381278/1047446400566312990>\n\nCreator Evolution Club is also found to provide the best support to help you grow as an outstanding EVO content creator. **It creates an aspirational influencer community for EVO creators who have great potential and passion. Apply now in the __#club-application__ channel\n<https://discord.com/channels/951777532003381278/1042753136701476884>**\n\n__This is the code to get access to the beta and activate the game:__\n\`${codes}\`\nThe beta will open on __1 Dec 2022__. Please stay tuned to the official announcement on Discord and download the game in advance. This is the download link: http://bit.ly/3ESJHhS\n\nIf you encounter problems when downloading the game, please reach out to our staff on # support channel in our official Discord: https://discord.gg/projectevogame\n\nIn the end. Good Luck. Have Fun!\nBest Regards\nProject EVO Team`;
								attachment = "https://i.ibb.co/9gBLc4v/20221201-122549.jpg";
							} else if (creator.winner_type == "Content Event Winner") {
								switch (creator.event) {
									case "Content Creation Event - Newbie Award":
										message = `Dear Player:\n\nCongratulations! You have won the Newbie Award from Content Creation Event. The reward is 2 codes!\n\nBeta Code:\n\`${codes}\`\n\nFeel free to share it with your friends & fans!`;
										break;
									case "Content Creation Event - Best Video of the Day":
										message = `Dear Player:\n\nCongratulations! You have won Best Video of the Day from Content Creation Event. The reward is 20 codes!!!\n\nBeta Code:\n\`${codes}\`\n\nFeel free to share it with your friends & fans!`;
										break;
								}
							} else if (creator.winner_type == "Club Member") {
								message = `Dear Club Member:\n\nCongratulations! The number of codes you have applied is ${creator.number_codes}.\n\`${codes}\`\n\nFeel free to share it with your fans! **I strongly suggest you host an event or drop codes while streaming**, rather than randomly throwing the codes into your community.\n\n**It will be helpful for your video & stream performance and interactions.** Fans will be happy if they see you giveaway codes.\n\nThe codes-for-fans can only be applied once per month, please use them carefully!!`;
							}
							break;
						case undefined:
							await interaction.followUp({
								content:
									creator.discord_id + " - **Reward Type** is `undefined`.",
								ephemeral: true,
							});
							await feishu.updateRecord(
								tenantToken,
								process.env.REWARD_BASE,
								process.env.DELIVERY,
								creator.record_id,
								{ fields: { Status: "Failed", NOTE2: "Reward Type Empty" } }
							);
							logger.error(`${creator.discord_id} - Reward Type is undefined.`);
							continue;
						default:
							break;
					}

					if (attachment.length > 1) {
						member
							.send({
								content: message,
								components: [claimRow],
								files: [attachment],
							})
							.then(() => {
								feishu.updateRecord(
									tenantToken,
									process.env.REWARD_BASE,
									process.env.DELIVERY,
									creator.record_id,
									{ fields: { Status: "Sent" } }
								);
								logger.info(
									`${creator.discord_id} - Sent reward successfully.\nMESSAGE: ${message}\nATTACHMENT: Yes`
								);
							})
							.catch(() => {
								feishu.updateRecord(
									tenantToken,
									process.env.REWARD_BASE,
									process.env.DELIVERY,
									creator.record_id,
									{ fields: { Status: "Sent", NOTE2: "Private DM" } }
								);
								logger.error(
									`${creator.discord_id} - Reward sending failed. Private DM. Creating a private channel.`
								);
								privateChannel(creator, client, message, attachment, claimRow);
							});
					} else {
						member
							.send({ content: message, components: [claimRow] })
							.then(() => {
								feishu.updateRecord(
									tenantToken,
									process.env.REWARD_BASE,
									process.env.DELIVERY,
									creator.record_id,
									{ fields: { Status: "Sent" } }
								);
								logger.info(
									`${creator.discord_id} - Sent reward successfully.\nMESSAGE: ${message}\nATTACHMENT: No`
								);
							})
							.catch(() => {
								feishu.updateRecord(
									tenantToken,
									process.env.REWARD_BASE,
									process.env.DELIVERY,
									creator.record_id,
									{ fields: { Status: "Sent", NOTE2: "Private DM" } }
								);
								logger.error(
									`${creator.discord_id} - Reward sending failed. Private DM. Creating a private channel.`
								);
								privateChannel(creator, client, message, attachment, claimRow);
							});
					}
				}
				interaction
					.editReply({ content: "Updated!", ephemeral: true })
					.then(() => {
						logger.info(
							`Reward sending finished. ${response.data.total} rewards sent.`
						);
					});
			} else {
				await interaction
					.editReply({
						content: "No rewards ready yet.",
						ephemeral: true,
					})
					.then(() => {
						logger.info(`No rewards ready yet.`);
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
				content: "Calculating CEC Data...",
				ephemeral: true,
			});

			let tenantToken = await feishu.authorize(
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
			const guild = client.guilds.cache.get(process.env.EVO_SERVER);
			let test = interaction.guild.members.get(interaction.user.id);
			logger.debug(test);

			for (const record of response.data.items) {
				const member = guild.members.cache.get(record.fields["Discord ID"]);

				if (
					member == undefined ||
					!member.roles.cache.has(process.env.CEC_MEMBER_ROLE)
				)
					continue;

				let tempRecord = {
					"Discord ID": record.fields["Discord ID"],
					"Discord Name": record.fields["Discord Name"],
					"CEC Total Views": parseInt(record.fields["Views"]),
					"CEC Videos": 1,
					"Mission Videos": 0,
					"Mission Views": 0,
				};
				records.push(tempRecord);
			}

			console.log(records);

			let uniqueRecords = Object.values(
				records.reduce((acc, item) => {
					acc[item["Discord ID"]] = acc[item["Discord ID"]]
						? {
								...item,
								"CEC Total Views":
									item["CEC Total Views"] +
									acc[item["Discord ID"]]["CEC Total Views"],
								"CEC Videos":
									item["CEC Videos"] + acc[item["Discord ID"]]["CEC Videos"],
						  }
						: item;
					return acc;
				}, {})
			);

			logger.debug(uniqueRecords);

			for (const record of uniqueRecords) {
				let response = JSON.parse(
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
					if (record["Discord ID"] == "858582657260716073")
						logger.debug({ record });
				} else {
					await feishu.createRecord(
						tenantToken,
						process.env.CEP_BASE,
						process.env.CEC_DATA,
						{ fields: record }
					);
				}
			}

			response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CEP_BASE,
					process.env.CEP_SUBMISSION,
					`AND(CurrentValue.[Validity] = "VALID", CurrentValue.[Views] > 999, CurrentValue.[CEC Special Mission] = "CEC Special Mission", CurrentValue.[Submission Date] >= DATE(2022,12,1))`
				)
			);

			let specialRecords = [];

			for (const record of response.data.items) {
				specialRecords.push({
					"Discord ID": record.fields["Discord ID"],
					"Discord Name": record.fields["Discord Name"],
					"Mission Views": parseInt(record.fields["Views"]),
					"Mission Videos": 1,
				});
			}

			let specialUniqueRecords = Object.values(
				specialRecords.reduce((acc, item) => {
					acc[item["Discord ID"]] = acc[item["Discord ID"]]
						? {
								...item,
								"Mission Views":
									item["Mission Views"] +
									acc[item["Discord ID"]]["Mission Views"],
								"Mission Videos":
									item["Mission Videos"] +
									acc[item["Discord ID"]]["Mission Videos"],
						  }
						: item;
					return acc;
				}, {})
			);

			for (const record of specialUniqueRecords) {
				let response = JSON.parse(
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
				content: "CEC Data Calculated.",
				ephemeral: true,
			});
		} else if (subCommand === "cec-bp") {
			await interaction.reply({
				content: "Calculating CEC BP Data...",
				ephemeral: true,
			});

			let tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			let response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CEP_BASE,
					process.env.CEC_DATA
				)
			);

			if (!response.data.total) {
				await interaction.editReply({
					content: "CEC Data Not Found.",
					ephemeral: true,
				});
				return;
			}

			let records = [];

			for (const record of response.data.items) {
				records.push({
					recordId: record.record_id,
					discordId: record.fields["Discord ID"],
					totalViews: parseInt(record.fields["CEC Total Views"]),
					missionViews: parseInt(record.fields["Mission Views"]),
				});
			}

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
				if (response.data.total)
					bpRate = parseFloat(response.data.items[0].fields["BP Rate"]);
				if (bpRate == NaN) bpRate = 0.0;
				bp = ((record.totalViews - record.missionViews) / 1000) * bpRate;
				bp += (record.missionViews / 1000) * bpRate * 1.5;

				await feishu.updateRecord(
					tenantToken,
					process.env.CEP_BASE,
					process.env.CEC_DATA,
					record.recordId,
					{ fields: { "BP Amount": bp } }
				);
			}

			await interaction.editReply({
				content: "CEC BP Data Calculated.",
				ephemeral: true,
			});
		} else if (subCommand === "cec-members") {
			await interaction.reply({
				content: "Updating the list of CEC Members...",
				ephemeral: true,
			});

			let tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			let response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CEP_BASE,
					process.env.CEC_APP,
					`CurrentValue.[Qualification] = "Accepted"`
				)
			);

			if (!response.data.total) {
				return await interaction.editReply({
					content: "No accepted records found.",
					ephemeral: true,
				});
			}

			for (const record of response.data.items) {
				let guild = client.guilds.cache.get(process.env.EVO_SERVER);
				let member = guild.members.cache.get(record.fields["Discord ID"]);

				response = JSON.parse(
					await feishu.getRecords(
						tenantToken,
						process.env.CEP_BASE,
						process.env.CEC_BENEFIT,
						`CurrentValue.[Discord ID] = "${record.fields["Discord ID"]}"`
					)
				);

				let benefit_level;

				if (!response.data.total) {
					benefit_level = "NA";
				} else benefit_level = response.data.items[0].fields["Benefit Level"];

				let cecInvitationMessage = `**Congratulations! Now you have membership of Creator Evolution Club!**\n\nWe sincerely appreciate your efforts on EVO community and thanks for your love & passion on Project EVO!\n\nNow you get access to the exclusive benefits for club members:\n1. Beta codes for your fans (up to 200 / month)\n2. Earn 1000  Benefit Points and redeem a phone ($800 value)\n3. Official Support & Instructions\n4. And more!\n\nThe amount of benefits that you can enjoy (including how many Benefit Points you can earn) depends on your Benefit Level, which is \`${benefit_level}\`. The benefit level can be updated every month.\n\nPlease join our Club server to finish the membership registration, start to enjoy the benefits and meet more EVO creators! https://discord.gg/bexu5aVyrY`;

				await member.roles
					.add(process.env.CEC_MEMBER_ROLE)
					.then(() => {
						let qualification = "DONE";
						member
							.send({ content: cecInvitationMessage })
							.then(() => {
								qualification = "DONE";
							})
							.catch((error) => {
								console.log(error);
								qualification = "DONE (NO DM)";
							});
						feishu.updateRecord(
							tenantToken,
							process.env.CEP_BASE,
							process.env.CEC_APP,
							record.record_id,
							{ fields: { Qualification: qualification } }
						);
					})
					.catch((error) => {
						console.log(error);
						feishu.updateRecord(
							tenantToken,
							process.env.CEP_BASE,
							process.env.CEC_APP,
							record.record_id,
							{ fields: { Qualification: "Left Server" } }
						);
					});
			}

			await interaction.editReply({
				content: "Updated the list of CEC Members!",
				ephemeral: true,
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
				let member = guild.members.cache.get(record.fields["Discord ID"]);

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
		}
	},
};

async function privateChannel(creator, client, message, attachment, button) {
	const channel = await client.channels.cache.get(
		process.env.COLLECT_REWARDS_CHANNEL
	);
	const user = await client.users.cache.get(creator.discord_id);

	await channel.permissionOverwrites.create(user, {
		ViewChannel: true,
	});

	const thread = await channel.threads.create({
		name: user.id,
		reason: `${user.username} has private DMs`,
		type: ChannelType.PrivateThread,
	});

	await thread.members.add(user.id);

	if (attachment.length > 1)
		await thread.send({
			content: `${user}\n\n${message}`,
			files: [attachment],
			components: [button],
		});
	else
		await thread.send({
			content: `${user}\n\n${message}`,
			components: [button],
		});

	await thread.send({
		content:
			"**Once you click CLAIM, this thread would be DELETED.**\nPlease copy the reward/code somewhere and only then press the button.",
	});
}
