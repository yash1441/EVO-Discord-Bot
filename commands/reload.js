const {
	SlashCommandBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	PermissionsBitField,
} = require("discord.js");
const axios = require("axios");
const feishu = require("../feishu.js");

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
			subcommand.setName("cec-data").setDescription("Calculate CEC data.")
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("cec-bp")
				.setDescription("Calculate BP Amount in CEC data.")
		),

	async execute(interaction, client) {
		if (
			interaction.user.id != "132784173311197184" &&
			interaction.user.id != "1017641241623679076" &&
			interaction.user.id != "1049909674465574973"
		) {
			return;
		}
		const subCommand = interaction.options.getSubcommand();
		if (subCommand === "creators") {
			await interaction.reply({
				content: "Updating the list of creators...",
				ephemeral: true,
			});

			let tenantToken = await feishu.authorize(
				"cli_a3befa8417f9500d",
				"II4y9Nn6d7C6RuZUxdOz2fxt4sSo6Rsu"
			);

			let response = await feishu.getRecords(
				tenantToken,
				"bascnxUOz7DdG9mcOUvFlH7BIPg",
				"tblAYP1kaNvmCbfJ",
				`CurrentValue.[Status] = "Accepted"`
			);

			response = JSON.parse(response);
			let creatorList = [];

			if (response.data.total) {
				for (const item of response.data.items) {
					creatorList.push({
						discordId: item.fields["Discord ID"],
						recordId: item.record_id,
					});
				}

				for (const creator of creatorList) {
					const guild = client.guilds.cache.get("951777532003381278");
					const member = guild.members.cache.get(creator.discordId);
					if (member == undefined) {
						await feishu.updateRecord(
							tenantToken,
							"bascnxUOz7DdG9mcOUvFlH7BIPg",
							"tblAYP1kaNvmCbfJ",
							creator.recordId,
							{ fields: { Status: "Failed" } }
						);
					} else {
						await member.roles
							.add("952233385500229703")
							.catch(() => {
								feishu.updateRecord(
									tenantToken,
									"bascnxUOz7DdG9mcOUvFlH7BIPg",
									"tblAYP1kaNvmCbfJ",
									creator.recordId,
									{ fields: { Status: "Failed" } }
								);
							})
							.then(() => {
								feishu.updateRecord(
									tenantToken,
									"bascnxUOz7DdG9mcOUvFlH7BIPg",
									"tblAYP1kaNvmCbfJ",
									creator.recordId,
									{ fields: { Status: "Done" } }
								);
							});
					}
				}
				interaction.editReply({ content: "Updated!", ephemeral: true });
			} else {
				interaction.editReply({
					content: "No creators accepted yet.",
					ephemeral: true,
				});
			}
		} else if (subCommand === "rewards") {
			await interaction.reply({
				content: "Updating the list of rewards...",
				ephemeral: true,
			});

			let tenantToken = await feishu.authorize(
				"cli_a3befa8417f9500d",
				"II4y9Nn6d7C6RuZUxdOz2fxt4sSo6Rsu"
			);

			const claimButton = new ButtonBuilder()
				.setCustomId("claimButton")
				.setLabel("Claim")
				.setStyle(ButtonStyle.Success)
				.setEmoji("✅");

			const claimRow = new ActionRowBuilder().addComponents(claimButton);

			let response = await feishu.getRecords(
				tenantToken,
				"bascnbWD6jH5XOCtphFiiXxC3Ab",
				"tblE1ARAr7yx7qpL",
				`AND(CurrentValue.[Status] = "Ready")`
			);

			let creators = JSON.parse(response).data;
			let creatorList = [];

			if (creators.total) {
				for (const creator of creators.items) {
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
					const guild = client.guilds.cache.get("951777532003381278");
					const member = guild.members.cache.get(creator.discord_id);

					if (member == undefined) {
						await feishu.updateRecord(
							tenantToken,
							"bascnbWD6jH5XOCtphFiiXxC3Ab",
							"tblE1ARAr7yx7qpL",
							creator.record_id,
							{ fields: { Status: "Failed", NOTE2: "Left Server" } }
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
								// Get a code from the database
								if (creator.number_codes == undefined) {
									await interaction.followUp({
										content:
											creator.discord_id +
											" - **Number of Codes** is `undefined`.",
										ephemeral: true,
									});
									await feishu.updateRecord(
										tenantToken,
										"bascnbWD6jH5XOCtphFiiXxC3Ab",
										"tblE1ARAr7yx7qpL",
										creator.record_id,
										{ fields: { Status: "Failed" } }
									);
									console.error("Number of Codes is undefined.");
									continue;
								}

								let quantity = parseInt(creator.number_codes);
								let response = await feishu.getRecords(
									tenantToken,
									"bascn3hSJ2czkPrZfFKRHqUgDsg",
									"tblvmhckr64T2tyz",
									`NOT(CurrentValue.[Status] = "Used")`
								);
								response = JSON.parse(response).data;

								if (response.total < quantity) {
									await interaction.followUp({
										content:
											creator.discord_id + " - Not enough codes available.",
										ephemeral: true,
									});
									await feishu.updateRecord(
										tenantToken,
										"bascnbWD6jH5XOCtphFiiXxC3Ab",
										"tblE1ARAr7yx7qpL",
										creator.record_id,
										{ fields: { Status: "Failed" } }
									);
									console.error("Not enough codes available.");
									continue;
								}

								let chosenRecord = [],
									codeList = [];

								for (let i = 0; i < quantity; i++) {
									chosenRecord.push({
										record_id: response.items[i].record_id,
										code: response.items[i].fields["Beta Codes"],
									});
								}

								for (const record of chosenRecord) {
									await feishu.updateRecord(
										tenantToken,
										"bascn3hSJ2czkPrZfFKRHqUgDsg",
										"tblvmhckr64T2tyz",
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
									"bascnbWD6jH5XOCtphFiiXxC3Ab",
									"tblE1ARAr7yx7qpL",
									creator.record_id,
									{ fields: { "Card Code": codes } }
								);
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
								"bascnbWD6jH5XOCtphFiiXxC3Ab",
								"tblE1ARAr7yx7qpL",
								creator.record_id,
								{ fields: { Status: "Failed", NOTE2: "Reward Type Empty" } }
							);
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
							.then((msg) => {
								feishu.updateRecord(
									tenantToken,
									"bascnbWD6jH5XOCtphFiiXxC3Ab",
									"tblE1ARAr7yx7qpL",
									creator.record_id,
									{ fields: { Status: "Sent" } }
								);
							})
							.catch((error) => {
								feishu.updateRecord(
									tenantToken,
									"bascnbWD6jH5XOCtphFiiXxC3Ab",
									"tblE1ARAr7yx7qpL",
									creator.record_id,
									{ fields: { Status: "Sent", NOTE2: "Private DM" } }
								);
								privateChannel(creator, client, message, attachment, claimRow);
							});
					} else {
						member
							.send({ content: message, components: [claimRow] })
							.then((msg) => {
								feishu.updateRecord(
									tenantToken,
									"bascnbWD6jH5XOCtphFiiXxC3Ab",
									"tblE1ARAr7yx7qpL",
									creator.record_id,
									{ fields: { Status: "Sent" } }
								);
							})
							.catch((error) => {
								feishu.updateRecord(
									tenantToken,
									"bascnbWD6jH5XOCtphFiiXxC3Ab",
									"tblE1ARAr7yx7qpL",
									creator.record_id,
									{ fields: { Status: "Sent", NOTE2: "Private DM" } }
								);
								privateChannel(creator, client, message, attachment, claimRow);
							});
					}
				}
				interaction.editReply({ content: "Updated!", ephemeral: true });
			} else {
				await interaction.editReply({
					content: "No rewards ready yet.",
					ephemeral: true,
				});
			}
		} else if (subCommand === "creators-list") {
			if (interaction.user.id != "132784173311197184") return;
			await interaction.guild.members.fetch();
			const creatorRole = interaction.guild.roles.cache.find(
				(role) => role.name === "Content Creator"
			);
			let creatorsIdList = creatorRole.members.map((member) => member.id);
			let creatorsNameList = creatorRole.members.map(
				(member) => member.user.tag
			);

			let creatorsList = {
				records: [],
			};

			for (let i = 0; i < creatorsIdList.length; i++) {
				let data = {
					fields: {
						"Discord ID": creatorsIdList[i],
						"Discord Name": creatorsNameList[i],
					},
				};
				creatorsList.records.push(data);
			}

			let appAccessToken;

			await axios
				.post(
					"https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal",
					{
						app_id: "cli_a3befa8417f9500d",
						app_secret: "II4y9Nn6d7C6RuZUxdOz2fxt4sSo6Rsu",
					}
				)
				.then((res) => {
					appAccessToken = res.data.tenant_access_token;
				})
				.catch((err) => {
					console.log(err);
				});

			let config = {
				headers: {
					Authorization: `Bearer ${appAccessToken}`,
				},
			};

			await axios
				.post(
					`https://open.feishu.cn/open-apis/bitable/v1/apps/bascnxUOz7DdG9mcOUvFlH7BIPg/tables/tblKiZUk5iEEL3iU/records/batch_create`,
					creatorsList,
					config
				)
				.then((res) => {
					return res.data;
				})
				.catch((err) => {
					return err;
				});
		} else if (subCommand === "cec-data") {
			await interaction.reply({
				content: "Calculating CEC Data...",
				ephemeral: true,
			});

			let tenantToken = await feishu.authorize(
				"cli_a3befa8417f9500d",
				"II4y9Nn6d7C6RuZUxdOz2fxt4sSo6Rsu"
			);

			let response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					"bascnxUOz7DdG9mcOUvFlH7BIPg",
					"tbl3pXwSxiOrfj7W",
					`AND(CurrentValue.[CEC Member] = "CEC Member", CurrentValue.[Validity] = "VALID", CurrentValue.[Views] > 999, CurrentValue.[Submission Date] >= DATE(2022,12,1))`
				)
			);

			let records = [];

			for (const record of response.data.items) {
				records.push({
					"Discord ID": record.fields["Discord ID"],
					"Discord Name": record.fields["Discord Name"],
					"CEC Total Views": parseInt(record.fields["Views"]),
					"CEC Videos": 1,
					"Mission Videos": 0,
					"Mission Views": 0,
				});
			}

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

			for (const record of uniqueRecords) {
				let response = JSON.parse(
					await feishu.getRecords(
						tenantToken,
						"bascnxUOz7DdG9mcOUvFlH7BIPg",
						"tbl9C9zwcgPWy7GQ",
						`CurrentValue.[Discord ID] = "${record["Discord ID"]}"`
					)
				);
				if (response.data.total) {
					await feishu.updateRecord(
						tenantToken,
						"bascnxUOz7DdG9mcOUvFlH7BIPg",
						"tbl9C9zwcgPWy7GQ",
						response.data.items[0].record_id,
						{ fields: record }
					);
				} else {
					await feishu.createRecord(
						tenantToken,
						"bascnxUOz7DdG9mcOUvFlH7BIPg",
						"tbl9C9zwcgPWy7GQ",
						{ fields: record }
					);
				}
			}

			response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					"bascnxUOz7DdG9mcOUvFlH7BIPg",
					"tbl3pXwSxiOrfj7W",
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
						"bascnxUOz7DdG9mcOUvFlH7BIPg",
						"tbl9C9zwcgPWy7GQ",
						`CurrentValue.[Discord ID] = "${record["Discord ID"]}"`
					)
				);
				if (response.data.total) {
					await feishu.updateRecord(
						tenantToken,
						"bascnxUOz7DdG9mcOUvFlH7BIPg",
						"tbl9C9zwcgPWy7GQ",
						response.data.items[0].record_id,
						{ fields: record }
					);
				} else {
					await feishu.createRecord(
						tenantToken,
						"bascnxUOz7DdG9mcOUvFlH7BIPg",
						"tbl9C9zwcgPWy7GQ",
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
				"cli_a3befa8417f9500d",
				"II4y9Nn6d7C6RuZUxdOz2fxt4sSo6Rsu"
			);

			let response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					"bascnxUOz7DdG9mcOUvFlH7BIPg",
					"tbl9C9zwcgPWy7GQ"
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
						"bascnxUOz7DdG9mcOUvFlH7BIPg",
						"tbliYQOP4BRpXquE",
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
					"bascnxUOz7DdG9mcOUvFlH7BIPg",
					"tbl9C9zwcgPWy7GQ",
					record.recordId,
					{ fields: { "BP Amount": bp } }
				);
			}

			await interaction.editReply({
				content: "CEC BP Data Calculated.",
				ephemeral: true,
			});
		}
	},
};

async function privateChannel(creator, client, message, attachment, button) {
	const channel = await client.channels.cache.get("1049567353798672435");
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
