const {
	Client,
	Collection,
	GatewayIntentBits,
	Partials,
	ComponentType,
	ChannelType,
	ActionRowBuilder,
	EmbedBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	StringSelectMenuBuilder,
	ActivityType,
	ButtonBuilder,
	ButtonStyle,
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const request = require("request-promise");
const cron = require("node-cron");
const feishu = require("./feishu.js");
const logger = require("./logging/logger.js");
require("dotenv").config();

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.MessageContent,
	],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

let files = fs.readdirSync("./"),
	file;

for (file of files) {
	if (file.startsWith("autoAdd")) {
		require("./" + file);
	}
}

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
	.readdirSync(commandsPath)
	.filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

let alreadyPressed = [];
let betaTesterCodes = {};
let betaTesterCodesLoaded = false;

client.on("ready", () => {
	logger.info(`Discord bot went online. Username: ${client.user.tag}`);
	client.user.setPresence({
		activities: [
			{
				name: `Project EVO`,
				type: ActivityType.Playing,
			},
		],
		status: `dnd`,
	});

	cron.schedule(
		"0 59 11 * * 1",
		function () {
			logger.info(`Starting scheduled cronjob. (Every Monday 11:59 AM)`);
			checkOldFiles();
			calculateBP();
		},
		{
			timezone: "Asia/Singapore",
		}
	);

	cron.schedule(
		"0 0 */6 * * *",
		function () {
			logger.info(`Starting scheduled cronjob. (Every 6 hours)`);
			sendShortsEvent();
		},
		{
			timezone: "Asia/Singapore",
		}
	);

	loadBetaTesterCodes();

	logger.info(`Deleting old bug reports.`);
	checkOldFiles();

	loadWelcomeMessages();

	// cron.schedule(
	// 	"0 */30 * * * *",
	// 	function () {
	// 		let newDate = new Date().toLocaleString("en-US", {
	// 			timeZone: "Asia/Singapore",
	// 		});
	// 		console.log(newDate + "\nChristmas event every 30 minutes...");
	// 		ChristmasEvent();
	// 	},
	// 	{
	// 		timezone: "Asia/Singapore",
	// 	}
	// );
});

client.on("interactionCreate", async (interaction) => {
	if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) return;

		try {
			await command.execute(interaction, client);
		} catch (error) {
			console.error(error);
			await interaction.editReply({
				content: "There was an error while executing this command!",
			});
		}
	} else if (interaction.isButton()) {
		if (interaction.customId === "creatorApply") {
			await interaction.deferReply({ ephemeral: true });
			const row = await platformMenu("platformSelectMenuApply");
			await interaction.editReply({
				content: `**In which social media do you publish content?**`,
				components: [row],
			});
		} else if (interaction.customId === "submitContent") {
			await interaction.deferReply({ ephemeral: true });
			const row = await platformMenu("platformSelectMenuSubmit");
			await interaction.editReply({
				content: `**Where do you publish the content?**`,
				components: [row],
			});
		} else if (interaction.customId === "suggestionSubmit") {
			await interaction.deferReply({ ephemeral: true });
			const suggestionSelectMenu = new StringSelectMenuBuilder()
				.setCustomId("suggestionSelectMenu")
				.setPlaceholder("Suggestion Category")
				.addOptions(
					{
						label: "Vehicle",
						value: "Vehicle",
					},
					{
						label: "Building",
						value: "Building",
					},
					{
						label: "Weather",
						value: "Weather",
					},
					{
						label: "Chat",
						value: "Chat",
					},
					{
						label: "Shooting",
						value: "Shooting",
					},
					{
						label: "Clan",
						value: "Clan",
					},
					{
						label: "Game Modes",
						value: "Game Modes",
					},
					{
						label: "Progression",
						value: "Progression",
					},
					{
						label: "Customization",
						value: "Customization",
					},
					{
						label: "Others",
						value: "Others",
					}
				);

			let row = new ActionRowBuilder().addComponents(suggestionSelectMenu);

			await interaction.editReply({
				content: `**Select Suggestion Category**`,
				components: [row],
			});
		} else if (interaction.customId === "betaAccess") {
			const betaModal = new ModalBuilder()
				.setCustomId("betaAccess")
				.setTitle("Beta Activation");

			const betaCode = new TextInputBuilder()
				.setCustomId("betaCode")
				.setLabel("Activation Code")
				.setPlaceholder("Please enter your Beta Activation Code here.")
				.setStyle(TextInputStyle.Short)
				.setRequired(true);

			let firstQuestion = new ActionRowBuilder().addComponents(betaCode);

			betaModal.addComponents(firstQuestion);

			await interaction.showModal(betaModal).catch((error) => {
				console.error("Unknown Interaction: " + interaction.customId);
			});
		} else if (interaction.customId === "claimButton") {
			await interaction.deferReply();
			let dm;
			if (interaction.channel.type === ChannelType.DM) {
				dm = true;
			} else {
				dm = false;
			}
			let tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);
			let records = await feishu.getRecords(
				tenantToken,
				process.env.REWARD_BASE,
				process.env.DELIVERY,
				`AND(CurrentValue.[Discord ID] = "${interaction.user.id}",(CurrentValue.[Status] = "Sent"))`
			);
			if (!parseInt(JSON.parse(records).data.total)) {
				return await interaction.message.edit({
					content: interaction.message.content,
					components: [],
				});
			}
			let record_id = JSON.parse(records).data.items[0].record_id;
			await feishu.updateRecord(
				tenantToken,
				process.env.REWARD_BASE,
				process.env.DELIVERY,
				record_id,
				{ fields: { Status: "Claimed" } }
			);

			await interaction.editReply({
				content: "Your reward has been marked as **Claimed**.",
			});

			await interaction.message.edit({
				content: interaction.message.content,
				components: [],
			});

			if (!dm) {
				const thread = interaction.channel;
				await thread.members.remove(interaction.user.id);
				await thread.setArchived(true);
				await client.channels
					.fetch(process.env.COLLECT_REWARDS_CHANNEL)
					.then((channel) => {
						channel.permissionOverwrites.delete(
							interaction.user,
							"Claimed Reward"
						);
					});
			}

			return;
		} else if (interaction.customId === "bpButton") {
			await interaction.deferReply({ ephemeral: true });
			let tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);
			let response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CEP_BASE,
					process.env.CEC_BENEFIT,
					`CurrentValue.[Discord ID] = "${interaction.user.id}"`
				)
			);

			let benefit_level;

			if (response.data.total == 0) {
				benefit_level = "NA";
			} else benefit_level = response.data.items[0].fields["Benefit Level"];

			response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CEP_BASE,
					process.env.CEC_DATA,
					`CurrentValue.[Discord ID] = "${interaction.user.id}"`
				)
			);

			let bp_amount = 0;
			let bp_costed = 0;

			if (response.data.total != 0) {
				bp_amount = parseInt(response.data.items[0].fields["Final BP Amount"]);
				bp_costed = parseInt(response.data.items[0].fields["BP Costed"]);
			}

			response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CEP_BASE,
					process.env.CEP_SUBMISSION,
					`AND(CurrentValue.[Discord ID] = "${interaction.user.id}", CurrentValue.[Submission Date] >= DATE(2022,12,1))`
				)
			);
			let total_views = 0,
				total_videos = 0,
				total_invalid = 0;

			if (response.data.total) {
				total_videos = response.data.items.length;
				for (const records of response.data.items) {
					records.fields["Views"] == undefined
						? (total_views += 0)
						: (total_views += parseInt(records.fields["Views"]));
					if (records.fields["Validity"] != "VALID") total_invalid++;
				}
			}

			await interaction.editReply({
				content: `**Benefit Level** ${benefit_level}\n**Total Views** ${total_views}\n**Total Videos** ${total_videos}\n**Invalid Videos** ${total_invalid}\n**BP Amount** ${bp_amount}\n**BP Costed** ${bp_costed}`,
			});
		} else if (interaction.customId === "cecButton") {
			const cecModal = new ModalBuilder()
				.setCustomId("cecModal")
				.setTitle("CEC Application");

			const cecChannel = new TextInputBuilder()
				.setCustomId("cecChannel")
				.setLabel("YOUR YOUTUBE CHANNEL LINK")
				.setPlaceholder("http://youtube.com/c/PROJECTEVOGAME")
				.setStyle(TextInputStyle.Short)
				.setRequired(true);

			const cecSubscribers = new TextInputBuilder()
				.setCustomId("cecSubscribers")
				.setLabel("NUMBER OF SUBSCRIBERS")
				.setPlaceholder("Ex: 1000, 2000, 3000, etc.")
				.setStyle(TextInputStyle.Short)
				.setRequired(true);

			const cecQuanity = new TextInputBuilder()
				.setCustomId("cecQuanity")
				.setLabel("EVO VIDEOS YOU CAN MAKE PER WEEK")
				.setPlaceholder("Ex: 1, 2, 3, 4, 5, 6, 7...")
				.setStyle(TextInputStyle.Short)
				.setRequired(true);

			const cecReason = new TextInputBuilder()
				.setCustomId("cecReason")
				.setLabel("REASON TO JOIN THE CLUB")
				.setStyle(TextInputStyle.Paragraph)
				.setRequired(true);

			let firstQuestion = new ActionRowBuilder().addComponents(cecChannel);
			let secondQuestion = new ActionRowBuilder().addComponents(cecSubscribers);
			let thirdQuestion = new ActionRowBuilder().addComponents(cecQuanity);
			let fourthQuestion = new ActionRowBuilder().addComponents(cecReason);

			cecModal.addComponents(
				firstQuestion,
				secondQuestion,
				thirdQuestion,
				fourthQuestion
			);
			await interaction.showModal(cecModal);
		} else if (interaction.customId.startsWith("lfg")) {
			await interaction.deferReply({ ephemeral: true });
			let lfgNARole = "1034446183143321680";
			let lfgEURole = "1047746665152516167";
			let lfgSEARole = "1047745982307258399";

			let lfgRole;

			switch (interaction.customId) {
				case "lfgNAButton":
					lfgRole = lfgNARole;
					break;
				case "lfgEUButton":
					lfgRole = lfgEURole;
					break;
				case "lfgSEAButton":
					lfgRole = lfgSEARole;
					break;
				default:
					lfgRole = lfgNARole;
					break;
			}

			let haslfgNARole = await checkMemberRole(
				client,
				process.env.EVO_SERVER,
				interaction.user.id,
				lfgNARole
			);

			let haslfgEURole = await checkMemberRole(
				client,
				process.env.EVO_SERVER,
				interaction.user.id,
				lfgEURole
			);

			let haslfgSEARole = await checkMemberRole(
				client,
				process.env.EVO_SERVER,
				interaction.user.id,
				lfgSEARole
			);

			if (haslfgNARole || haslfgEURole || haslfgSEARole) {
				await interaction.member.roles.remove(
					lfgNARole,
					"User requested different LFG role."
				);
				await interaction.member.roles.remove(
					lfgEURole,
					"User requested different LFG role."
				);
				await interaction.member.roles.remove(
					lfgSEARole,
					"User requested different LFG role."
				);
			}

			await interaction.member.roles.add(lfgRole, "User requested LFG role.");

			await interaction.editReply({
				content: "You have unlocked your region's LFG channel!",
			});
		} else if (interaction.customId === "clubButton") {
			await interaction.deferReply({ ephemeral: true });

			const tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			const response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CEP_BASE,
					process.env.CEP_APP,
					`CurrentValue.[Discord ID] = "${interaction.user.id}"`
				)
			);

			if (!response.data.total) {
				const row = await platformMenu("platformSelectMenuApply");
				return await interaction.editReply({
					content: `**In which social media do you publish content?**`,
					components: [row],
				});
			}

			const correctButton = new ButtonBuilder()
				.setCustomId("correctButton")
				.setLabel("Everything is Corrct")
				.setStyle(ButtonStyle.Success)
				.setEmoji("✅");

			const wrongButton = new ButtonBuilder()
				.setCustomId("wrongButton")
				.setLabel("I need to correct my info")
				.setStyle(ButtonStyle.Danger)
				.setEmoji("❌");

			let row;

			if (
				response.data.items[0].fields.Channel.link == undefined ||
				response.data.items[0].fields.Region == undefined ||
				response.data.items[0].fields.Platform == undefined
			) {
				row = new ActionRowBuilder().addComponents([wrongButton]);
			} else
				row = new ActionRowBuilder().addComponents([
					correctButton,
					wrongButton,
				]);

			await interaction.editReply({
				content: `**Please confirm your personal information and finish the registration:**\n\n**This is your channel link?**\n\`${response.data.items[0].fields.Channel.link}\`\n**This is the current region you live in?**\n\`${response.data.items[0].fields.Region}\`\n**This is the platform where you publish content?**\n\`${response.data.items[0].fields.Platform}\``,
				components: [row],
			});
		} else if (interaction.customId === "correctButton") {
			await interaction.deferReply({ ephemeral: true });

			let benefitLevel = "undefined";

			const understoodButton = new ButtonBuilder()
				.setCustomId("understoodButton")
				.setLabel("Understood")
				.setStyle(ButtonStyle.Success)
				.setEmoji("☑️");

			const row = new ActionRowBuilder().addComponents([understoodButton]);

			const tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			const response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CEP_BASE,
					process.env.CEP_CREATOR,
					`CurrentValue.[Discord ID] = "${interaction.user.id}"`
				)
			);

			if (response.data.total) {
				benefitLevel = response.data.items[0].fields["Benefit Level"];
			}

			await interaction.editReply({
				content: `**This is your benefit level:**\n${benefitLevel}\nNote: If it shows "undefined", it means you haven't been assigned a benefit level. You may not get access to some benefits without a benefit level, please contact <@${process.env.COSMOS_ID}> to get one.`,
				components: [row],
			});
		} else if (interaction.customId === "wrongButton") {
			await interaction.deferReply({ ephemeral: true });

			const row = await platformMenu("platformSelectMenuApplyRe");
			await interaction.editReply({
				content: `**In which social media do you publish content?**`,
				components: [row],
			});
		} else if (interaction.customId === "understoodButton") {
			await interaction.deferReply({ ephemeral: true });

			await interaction.member.roles.add(process.env.VERIFIED_ROLE).then(() => {
				interaction.editReply({
					content: `Your club membership is granted! Please read <#${process.env.BENEFIT_CHANNEL}> to learn about what benefits you can get access to. Don't forget to say hi in <#${process.env.CHAT_CHANNEL}> and meet other creators!`,
				});
			});
		} else if (interaction.customId === "linkButton") {
			await interaction.deferReply({ ephemeral: true });
			const tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			let response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CEP_BASE,
					process.env.CEC_LINK,
					`CurrentValue.[Discord ID] = "${interaction.user.id}"`
				)
			);

			if (parseInt(response.data.total)) {
				return await interaction.editReply({
					content: `Your unique link is:\n\`${response.data.items[0].fields.Link}\``,
				});
			} else {
				response = JSON.parse(
					await feishu.getRecords(
						tenantToken,
						process.env.CEP_BASE,
						process.env.CEC_LINK,
						`NOT(CurrentValue.[Status] = "Claimed")`
					)
				);

				if (parseInt(response.data.total)) {
					await feishu.updateRecord(
						tenantToken,
						process.env.CEP_BASE,
						process.env.CEC_LINK,
						response.data.items[0].record_id,
						{
							fields: {
								"Discord ID": interaction.user.id,
								"Discord Name": interaction.user.tag,
								Status: "Claimed",
							},
						}
					);
					await interaction.editReply({
						content: `Your unique link is:\n\`${response.data.items[0].fields.Link}\``,
					});
				} else {
					await interaction.editReply({
						content: `No link found. Please contact **Simon#0988**.`,
					});
				}
			}
		} else if (interaction.customId === "afcButton") {
			await interaction.deferReply({ ephemeral: true });

			const tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			let response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CEP_BASE,
					process.env.CEC_CODE,
					`CurrentValue.[Discord ID] = "${interaction.user.id}"`
				)
			);

			if (response.data.total) {
				let submissionDate =
					parseInt(
						response.data.items[response.data.items.length - 1].fields[
							"Submission Date"
						]
					) / 1000;

				if (Date.now() / 1000 - submissionDate < 2592000) {
					return await interaction.editReply({
						content: "You can only apply once every 30 days.",
					});
				}
			}

			let finalData = {
				"Discord ID": interaction.user.id,
				"Discord Name": interaction.user.tag,
				"YouTube Channel": {
					text: "NA",
					link: "NA",
				},
				Subscribers: 0,
				"Benefit Level": "NA",
				"Valid Views": 0,
				"Valid Videos": 0,
			};

			response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CEP_BASE,
					process.env.CEC_BENEFIT,
					`CurrentValue.[Discord ID] = "${finalData["Discord ID"]}"`
				)
			);
			if (parseInt(response.data.total)) {
				if (response.data.items[0].fields["Benefit Level"] != undefined)
					finalData["Benefit Level"] =
						response.data.items[0].fields["Benefit Level"];
			}

			response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CEP_BASE,
					process.env.CCES_DATA,
					`CurrentValue.[Discord ID] = "${finalData["Discord ID"]}"`
				)
			);
			if (parseInt(response.data.total)) {
				finalData["Valid Views"] = parseInt(
					response.data.items[0].fields["Valid Views"]
				);
				finalData["Valid Videos"] = parseInt(
					response.data.items[0].fields["Valid Videos"]
				);
			}

			response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CEP_BASE,
					process.env.CEC_APP,
					`CurrentValue.[Discord ID] = "${finalData["Discord ID"]}"`
				)
			);
			if (parseInt(response.data.total)) {
				finalData["YouTube Channel"].text =
					response.data.items[0].fields["Youtube Channel"].text;
				finalData["YouTube Channel"].link =
					response.data.items[0].fields["Youtube Channel"].link;
				finalData["Subscribers"] = parseInt(
					response.data.items[0].fields["Subscribers"]
				);
			}

			let success = await feishu.createRecord(
				tenantToken,
				process.env.CEP_BASE,
				process.env.CEC_CODE,
				{ fields: finalData }
			);
			if (success)
				await interaction.editReply({
					content: "You have successfully applied for codes.",
				});
			else
				await interaction.editReply({
					content: "An error has occured. Please contact **Simon#0988**.",
				});
		} else if (interaction.customId === "sdButton") {
			const sdModal = new ModalBuilder()
				.setCustomId("sdModal")
				.setTitle("7 Day Survival Challenge");

			const sdTOS1 = new TextInputBuilder()
				.setCustomId("sdTOS1")
				.setLabel("Have you read the requirements carefully?")
				.setPlaceholder("Yes/No")
				.setStyle(TextInputStyle.Short)
				.setRequired(true);

			const sdTOS2 = new TextInputBuilder()
				.setCustomId("sdTOS2")
				.setLabel("Do you fully understand the requirement?")
				.setPlaceholder("Yes/No")
				.setStyle(TextInputStyle.Short)
				.setRequired(true);

			const sdJob = new TextInputBuilder()
				.setCustomId("sdJob")
				.setLabel("Do you want to stream or make videos?")
				.setPlaceholder("Stream/Videos/Both")
				.setStyle(TextInputStyle.Short)
				.setRequired(true);

			const sdChannel = new TextInputBuilder()
				.setCustomId("sdChannel")
				.setLabel("YOUR YOUTUBE CHANNEL LINK")
				.setStyle(TextInputStyle.Short)
				.setRequired(true);

			const sdSubscribers = new TextInputBuilder()
				.setCustomId("sdSubscribers")
				.setLabel("THE AMOUNT OF SUBSCRIBERS")
				.setStyle(TextInputStyle.Short)
				.setRequired(true);

			let firstQuestion = new ActionRowBuilder().addComponents(sdTOS1);
			let secondQuestion = new ActionRowBuilder().addComponents(sdTOS2);
			let thirdQuestion = new ActionRowBuilder().addComponents(sdJob);
			let fourthQuestion = new ActionRowBuilder().addComponents(sdChannel);
			let fifthQuestion = new ActionRowBuilder().addComponents(sdSubscribers);

			sdModal.addComponents(
				firstQuestion,
				secondQuestion,
				thirdQuestion,
				fourthQuestion,
				fifthQuestion
			);
			await interaction.showModal(sdModal);
		} else if (interaction.customId === "sdButton2") {
			const sdModal2 = new ModalBuilder()
				.setCustomId("sdModal2")
				.setTitle("7 Day Survival Challenge");

			const sdRegion = new TextInputBuilder()
				.setCustomId("sdRegion")
				.setLabel("Region")
				.setPlaceholder("Enter your region")
				.setStyle(TextInputStyle.Short)
				.setRequired(true);

			const sdRoleName = new TextInputBuilder()
				.setCustomId("sdRoleName")
				.setLabel("Role Name")
				.setPlaceholder("Enter your role name")
				.setStyle(TextInputStyle.Short)
				.setRequired(true);

			const sdRoldId = new TextInputBuilder()
				.setCustomId("sdRoleId")
				.setLabel("Role ID")
				.setPlaceholder("Open you profile and you can find your Role ID")
				.setStyle(TextInputStyle.Short)
				.setRequired(true);

			const sdSessionId = new TextInputBuilder()
				.setCustomId("sdSessionId")
				.setLabel("Session ID")
				.setPlaceholder("The new session you start for the challenge")
				.setStyle(TextInputStyle.Short)
				.setRequired(true);

			let firstQuestion = new ActionRowBuilder().addComponents(sdRegion);
			let secondQuestion = new ActionRowBuilder().addComponents(sdRoleName);
			let thirdQuestion = new ActionRowBuilder().addComponents(sdRoldId);
			let fourthQuestion = new ActionRowBuilder().addComponents(sdSessionId);

			sdModal2.addComponents(
				firstQuestion,
				secondQuestion,
				thirdQuestion,
				fourthQuestion
			);
			await interaction.showModal(sdModal2);
		} else if (interaction.customId === "christmasButton") {
			await interaction.reply({
				content: "Checking if you are on Santa's list...",
				ephemeral: true,
			});
			let messageId = interaction.message.id;
			let discordId = interaction.user.id;

			const tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			let response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.INVENTORY_BASE,
					process.env.PLAYER_INVENTORIES,
					`AND(CurrentValue.[Discord ID] = "${discordId}", CurrentValue.[Valid] = 1)`
				)
			);
			if (parseInt(response.data.total) >= 5)
				return await interaction.editReply(
					"You have already claimed 5 gifts today!\nYou can use </inventory:1054617458679496764> to check your inventory."
				);

			await interaction.editReply({
				content: "Receiving your gift from Santa...",
			});

			response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.INVENTORY_BASE,
					process.env.PLAYER_INVENTORIES,
					`AND(CurrentValue.[Discord ID] = "${discordId}", CurrentValue.[Interaction ID] = "${messageId}")`
				)
			);
			if (
				parseInt(response.data.total) >= 1 ||
				alreadyPressed.includes(discordId)
			)
				return await interaction.editReply(
					"You have already claimed this gift!\nYou can use </inventory:1054617458679496764> to check your inventory."
				);

			alreadyPressed.push(discordId);

			await interaction.editReply({
				content: "Baking some cookies for Santa...",
			});

			response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.INVENTORY_BASE,
					process.env.PLAYER_INVENTORIES,
					`AND(CurrentValue.[Discord ID] = "${discordId}", CurrentValue.[Event] = "Christmas 2022", CurrentValue.[Valid] = 1, CurrentValue.[Item] = "⭐")`
				)
			);
			if (parseInt(response.data.total) >= 1)
				return await interaction.editReply(
					"**❄️ Merry Christmas ❄️**\n*You have received the maximum number of rewards from this event. Thank you for taking part! You will be messaged soon with your prize. Please keep your DMs open.\nYou can use </inventory:1054617458679496764> to check your inventory.*"
				);

			await interaction.editReply({
				content: "Baking some cookies for Santa...",
			});

			response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.INVENTORY_BASE,
					process.env.REWARD_POOL,
					'AND(CurrentValue.[Event] = "Christmas 2022", CurrentValue.[Valid] = 1)'
				)
			);

			await interaction.editReply({ content: "Opening your gift..." });

			let items = response.data.items[0].fields["Items"];
			let randomItem = items[Math.floor(Math.random() * items.length)];

			let success = await feishu.createRecord(
				tenantToken,
				process.env.INVENTORY_BASE,
				process.env.PLAYER_INVENTORIES,
				{
					fields: {
						"Discord ID": interaction.user.id,
						"Discord Name": interaction.user.tag,
						Item: randomItem,
						Event: "Christmas 2022",
						Valid: true,
						"Interaction ID": messageId,
					},
				}
			);

			if (success)
				await interaction.editReply({
					content:
						"You opened the gift and received...\n\n" +
						randomItem +
						"\n\nYou can use </inventory:1054617458679496764> to check your inventory.",
				});
			else
				await interaction.editReply({
					content: "An error has occured. Please contact **Simon#0988**.",
				});
		} else if (interaction.customId.startsWith("ecc")) {
			await interaction.deferReply({ ephemeral: true });
			const type = interaction.customId.substring(3);
			switch (type) {
				case "Join":
					const checkECCRole = await checkMemberRole(
						client,
						process.env.EVO_SERVER,
						interaction.user.id,
						process.env.ECC_ROLE
					);
					if (!checkECCRole) {
						await interaction.member.roles
							.add(process.env.ECC_ROLE)
							.then(() => {
								interaction.editReply({
									content: `**Hi, welcome to join EVO Creator Competition! **\n\n**Here is what to do next:**\n1. Choose the content direction and decide the topic.\n2. Before you get started, ask advice for your topic on <#${process.env.ECC_CHANNEL}>.\n3. Make videos.\n4. Submit videos via <#${process.env.SUBMIT_CONTENT_CHANNEL}>, and choose the relevant topic.\n\n**We provide support!**\n1. We have released the latest <#${process.env.VIDEO_GUIDE_CHANNEL}>.\n2. Access to high-quality art material via <#${process.env.MEDIA_KIT_CHANNEL}>.\n3. Ask for advice from <@${process.env.VOID_ID}>.`,
								});
							});
					} else
						await interaction.editReply({
							content: `**Hi, you are already a part of EVO Creator Competition! **\n\n**Here is what to do next:**\n1. Choose the content direction and decide the topic.\n2. Before you get started, ask advice for your topic on <#${process.env.ECC_CHANNEL}>.\n3. Make videos.\n4. Submit videos via <#${process.env.SUBMIT_CONTENT_CHANNEL}>, and choose the relevant topic.\n\n**We provide support!**\n1. We have released the latest <#${process.env.VIDEO_GUIDE_CHANNEL}>.\n2. Access to high-quality art material via <#${process.env.MEDIA_KIT_CHANNEL}>.\n3. Ask for advice from <@${process.env.VOID_ID}>.`,
						});
					break;
				case "Apply":
					const discordId = interaction.user.id;
					const userName = interaction.user.tag;
					const tenantToken = await feishu.authorize(
						process.env.FEISHU_ID,
						process.env.FEISHU_SECRET
					);

					const response = JSON.parse(
						await feishu.getRecords(
							tenantToken,
							process.env.CEP_BASE,
							process.env.ECC_JUDGE,
							`CurrentValue.[Discord ID] = "${discordId}"`
						)
					);

					if (response.data.total) {
						await interaction.editReply({
							content: "You can only apply once.",
						});
						break;
					}

					const rolesToCheck = [
						process.env.MOD_ROLE,
						process.env.CC_ROLE,
						process.env.LVL_FIVE_ROLE,
						process.env.LVL_TEN_ROLE,
						process.env.LVL_TWENTY_ROLE,
						process.env.LVL_THIRTY_ROLE,
						process.env.LVL_FIFTY_ROLE,
						process.env.LION_HERO_ROLE,
					];

					const userRoles = await checkRoles(
						interaction,
						discordId,
						rolesToCheck
					);

					let roleString = [];

					for (const roleId of userRoles) {
						let role = interaction.guild.roles.cache.get(roleId);
						roleString.push(role.name);
					}

					const success = await feishu.createRecord(
						tenantToken,
						process.env.CEP_BASE,
						process.env.ECC_JUDGE,
						{
							fields: {
								"Discord ID": discordId,
								"Discord Name": userName,
								Roles: roleString,
							},
						}
					);

					if (success) await interaction.editReply({ content: "Applied!" });
					else
						await interaction.editReply({
							content: "An error has occured. Please contact **Simon#0988**.",
						});
				// Send feishu notification
			}
		} else if (interaction.customId === "bugButton") {
			await interaction.deferReply({ ephemeral: true });
			const bugCategories = new StringSelectMenuBuilder()
				.setCustomId("bugCategories")
				.setPlaceholder("Select a category")
				.addOptions(
					{ label: "Optimization", value: "Optimization" },
					{ label: "Connection", value: "Connection" },
					{ label: "Login", value: "Login" },
					{ label: "Gameplay Abnormal", value: "Gameplay Abnormal" },
					{ label: "Data Loss", value: "Data Loss" },
					{ label: "Others", value: "Others" }
				);

			const row = new ActionRowBuilder().addComponents(bugCategories);

			await interaction.editReply({ components: [row] });
		} else if (interaction.customId === "tiktokButton") {
			await interaction.deferReply({ ephemeral: true });

			const checkTCCRole = await checkMemberRole(
				client,
				process.env.EVO_SERVER,
				interaction.user.id,
				process.env.TTC_ROLE
			);

			if (!checkTCCRole) {
				return await interaction.editReply({
					content: `You cannot get the beta code, possibly because you didn't choose **YES** in the question **Are you participants of TikTok Creator Event** or didn't click **Join Now** under the announcement of [TikTok Creator Event](https://ptb.discord.com/channels/951777532003381278/1018235728515321996/1083714282702766090)`,
				});
			}

			const tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);
			let response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CODE_BASE,
					process.env.TIKTOK_CODES,
					`CurrentValue.[Discord ID] = "${interaction.user.id}"`
				)
			);

			if (response.data.total) {
				return await interaction.editReply({
					content: "You have already redeemed a TikTok Creator Event code.",
				});
			}

			response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CODE_BASE,
					process.env.TIKTOK_CODES,
					`CurrentValue.[Discord ID] = ""`
				)
			);

			if (!response.data.total) {
				return await interaction.editReply({
					content: "There are no TikTok Creator Event codes left.",
				});
			}

			const recordId = response.data.items[0].record_id;
			const code = response.data.items[0].fields["Codes"];

			await feishu.updateRecord(
				tenantToken,
				process.env.CODE_BASE,
				process.env.TIKTOK_CODES,
				recordId,
				{ fields: { "Discord ID": interaction.user.id } }
			);

			await interaction.editReply({
				content: `Code claimed successfully! Here is your code:\n\`${code}\`\n\n[**Download EVO**](http://bit.ly/3JRQNXM)\n\nThere are also other Content Creation events, learn more about details via <#${process.env.EVENT_NEWS_CHANNEL}>.\n\nWe are looking for potential EVO creators. Exclusive benefits are provided, learn more about details via <#${process.env.CC_CHANNEL}>.\n\n*Please note that we have the right to ban your code if we find fraudulent behaviors or code trading.*`,
			});
		} else if (interaction.customId === "ttcButton") {
			await interaction.deferReply({ ephemeral: true });
			await interaction.member.roles.add(process.env.TTC_ROLE).then(() => {
				interaction.editReply({
					content: `**TikTok Creator Event**\n\nJoined Successfully!\nLearn more about the event details [here](https://api.tiktokv.com/game_center/pop/deeplink?target=home-pop)\n\nIf you haven't got a code to get into the game and record the gameplay, please check the message in <#${process.env.ROLES_CHANNEL}>`,
				});
			});
		} else if (interaction.customId === "shortsButton") {
			await interaction.deferReply({ ephemeral: true });

			await interaction.member.roles.add("1084823300137558086").then(() => {
				interaction.editReply({
					content: `You have successfully entered the Make-EVO-Shorts Event! You have access to the <#1084823394631024761> channel now.`,
				});
			});
		} else if (interaction.customId === "startQuiz") {
			await interaction.deferReply({ ephemeral: true });

			const dataDirectory = path.join(__dirname, "./data");
			const questionBank = JSON.parse(
				fs.readFileSync(path.join(dataDirectory, "questions.json"))
			);

			const shuffledQuestions = questionBank
				.sort(() => Math.random() - 0.5)
				.slice(0, 3);

			const filter = (i) => {
				i.deferUpdate();
				return i.user.id === interaction.user.id;
			};

			let lost = false;

			/// QUESTION 1 ///

			const q1 = shuffledQuestions[0].question;
			const q1correctoption = shuffledQuestions[0].options[0];
			const q1options = await shuffleArray(shuffledQuestions[0].options);
			const q1correct = q1options.indexOf(q1correctoption);

			const q1button1 = new ButtonBuilder()
				.setCustomId("quiz0" + q1correct.toString())
				.setLabel(q1options[0])
				.setStyle(ButtonStyle.Primary);
			const q1button2 = new ButtonBuilder()
				.setCustomId("quiz1" + q1correct.toString())
				.setLabel(q1options[1])
				.setStyle(ButtonStyle.Primary);
			const q1button3 = new ButtonBuilder()
				.setCustomId("quiz2" + q1correct.toString())
				.setLabel(q1options[2])
				.setStyle(ButtonStyle.Primary);

			const q1button4 = new ButtonBuilder()
				.setCustomId("quiz3" + q1correct.toString())
				.setLabel(q1options[3])
				.setStyle(ButtonStyle.Primary);

			const q1row = new ActionRowBuilder().addComponents([
				q1button1,
				q1button2,
				q1button3,
				q1button4,
			]);

			const q1embed = new EmbedBuilder()
				.setTitle("Question 1")
				.setDescription(q1);

			const q1message = await interaction.editReply({
				embeds: [q1embed],
				components: [q1row],
			});

			await q1message
				.awaitMessageComponent({
					filter,
					componentType: ComponentType.Button,
					time: 10000,
				})
				.then((interaction2) => {
					if (interaction2.customId[4] == interaction2.customId[5]) {
						interaction.editReply({
							content: "Correct!",
							components: [],
							embeds: [],
						});
					} else {
						lost = true;
						interaction.editReply({
							content: "Incorrect!",
							components: [],
							embeds: [],
						});
					}
				})
				.catch((err) => {
					lost = true;
					interaction.editReply({
						content: "Time's up!",
						components: [],
						embeds: [],
					});
				});

			if (lost) return;

			/// QUESTION 2 ///

			const q2 = shuffledQuestions[1].question;
			const q2correctoption = shuffledQuestions[1].options[0];
			const q2options = await shuffleArray(shuffledQuestions[1].options);
			const q2correct = q2options.indexOf(q2correctoption);

			const q2button1 = new ButtonBuilder()
				.setCustomId("quiz0" + q2correct.toString())
				.setLabel(q2options[0])
				.setStyle(ButtonStyle.Primary);
			const q2button2 = new ButtonBuilder()
				.setCustomId("quiz1" + q2correct.toString())
				.setLabel(q2options[1])
				.setStyle(ButtonStyle.Primary);
			const q2button3 = new ButtonBuilder()
				.setCustomId("quiz2" + q2correct.toString())
				.setLabel(q2options[2])
				.setStyle(ButtonStyle.Primary);

			const q2button4 = new ButtonBuilder()
				.setCustomId("quiz3" + q2correct.toString())
				.setLabel(q2options[3])
				.setStyle(ButtonStyle.Primary);

			const q2row = new ActionRowBuilder().addComponents([
				q2button1,
				q2button2,
				q2button3,
				q2button4,
			]);

			const q2embed = new EmbedBuilder()
				.setTitle("Question 2")
				.setDescription(q2);

			const q2message = await interaction.editReply({
				embeds: [q2embed],
				components: [q2row],
			});

			await q2message
				.awaitMessageComponent({
					filter,
					componentType: ComponentType.Button,
					time: 10000,
				})
				.then((interaction2) => {
					if (interaction2.customId[4] == interaction2.customId[5]) {
						interaction.editReply({
							content: "Correct!",
							components: [],
							embeds: [],
						});
					} else {
						lost = true;
						interaction.editReply({
							content: "Incorrect!",
							components: [],
							embeds: [],
						});
					}
				})
				.catch((err) => {
					lost = true;
					interaction.editReply({
						content: "Time's up!",
						components: [],
						embeds: [],
					});
				});

			if (lost) return;

			const q3 = shuffledQuestions[2].question;
			const q3correctoption = shuffledQuestions[2].options[0];
			const q3options = await shuffleArray(shuffledQuestions[2].options);
			const q3correct = q3options.indexOf(q3correctoption);

			const q3button1 = new ButtonBuilder()
				.setCustomId("quiz0" + q3correct.toString())
				.setLabel(q3options[0])
				.setStyle(ButtonStyle.Primary);
			const q3button2 = new ButtonBuilder()
				.setCustomId("quiz1" + q3correct.toString())
				.setLabel(q3options[1])
				.setStyle(ButtonStyle.Primary);
			const q3button3 = new ButtonBuilder()
				.setCustomId("quiz2" + q3correct.toString())
				.setLabel(q3options[2])
				.setStyle(ButtonStyle.Primary);

			const q3button4 = new ButtonBuilder()
				.setCustomId("quiz3" + q3correct.toString())
				.setLabel(q3options[3])
				.setStyle(ButtonStyle.Primary);

			const q3row = new ActionRowBuilder().addComponents([
				q3button1,
				q3button2,
				q3button3,
				q3button4,
			]);

			const q3embed = new EmbedBuilder()
				.setTitle("Question 3")
				.setDescription(q3);

			const q3message = await interaction.editReply({
				embeds: [q3embed],
				components: [q3row],
			});

			await q3message
				.awaitMessageComponent({
					filter,
					componentType: ComponentType.Button,
					time: 10000,
				})
				.then((interaction2) => {
					if (interaction2.customId[4] == interaction2.customId[5]) {
						interaction.editReply({
							content: "Correct!",
							components: [],
							embeds: [],
						});
					} else {
						lost = true;
						interaction.editReply({
							content: "Incorrect!",
							components: [],
							embeds: [],
						});
					}
				})
				.catch((err) => {
					lost = true;
					interaction.editReply({
						content: "Time's up!",
						components: [],
						embeds: [],
					});
				});

			if (lost) return;

			await interaction.member.roles.add("1085629746186031225").then(() => {
				interaction.editReply({
					content: "You have won the <@&1085629746186031225> role!",
					components: [],
					embeds: [],
				});
			});
		} else if (interaction.customId === "signUp") {
			const signUpModal = new ModalBuilder()
				.setTitle("Sign Up")
				.setCustomId("signUp");

			const channel = new TextInputBuilder()
				.setCustomId("youtubeChannel")
				.setLabel("YouTube Channel Link")
				.setPlaceholder("For example, https://www.youtube.com/@PROJECTEVOGAME")
				.setStyle(TextInputStyle.Short)
				.setRequired(true);

			const subs = new TextInputBuilder()
				.setCustomId("subscriberCount")
				.setLabel("Subscribers")
				.setPlaceholder("For example, 500, 1000, 5000, 10000")
				.setStyle(TextInputStyle.Short)
				.setRequired(true);

			let firstQuestion = new ActionRowBuilder().addComponents(channel);
			let secondQuestion = new ActionRowBuilder().addComponents(subs);

			signUpModal.addComponents(firstQuestion, secondQuestion);

			await interaction.showModal(signUpModal);

			const submitted = await interaction
				.awaitModalSubmit({
					filter: (i) => i.user.id === interaction.user.id,
					time: 60000,
				})
				.catch((error) => {
					return null;
				});

			if (submitted) {
				const youtubeChannel =
					submitted.fields.getTextInputValue("youtubeChannel");
				const subscriberCount = parseInt(
					submitted.fields.getTextInputValue("subscriberCount")
				);

				if (subscriberCount == NaN) {
					return await submitted.reply({
						content: "Please enter a valid number.",
						ephemeral: true,
					});
				}

				if (!checkURL(youtubeChannel)) {
					return await submitted.reply({
						content: `\`${youtubeChannel}\`\nPlease enter a **valid YouTube** link.`,
						ephemeral: true,
					});
				}

				if (subscriberCount < 1000) {
					await submitted.member.roles.add(process.env.EAE_ROLE).then(() => {
						submitted.reply({
							content: `Signed up successfully! You have been added to an <@&${process.env.EAE_ROLE}> role and will receive event notifications.\nYour audience may ask where to download the game. That's why we suggest you add the download link to your video description! This is also the place where players can pre-register the game!\n👉 https://bit.ly/downloadprojectevo 👈\nNow, feel free to start making videos and recommend Project EVO to your friends & fans & family!`,
							ephemeral: true,
						});
					});
				} else if (subscriberCount >= 1000) {
					const tenantToken = await feishu.authorize(
						process.env.FEISHU_ID,
						process.env.FEISHU_SECRET
					);

					const response = JSON.parse(
						await feishu.getRecords(
							tenantToken,
							process.env.CEP_BASE,
							process.env.EAE_PLAYERS,
							`CurrentValue.[Discord ID] = "${submitted.user.id}"`
						)
					);

					if (response.data.total)
						return await submitted.reply({
							content:
								"You have already signed up! Your beta code is `EAE1000`. Don't forget to add it to your video. Your fans will like it!\nYour audience may ask where to download the game. That's why we suggest you add the download link to your video description! This is also the place where players can pre-register the game!\n👉 https://bit.ly/downloadprojectevo 👈\nNow, feel free to start making videos and recommend Project EVO to your friends & fans & family!",
							ephemeral: true,
						});

					await submitted.member.roles.add(process.env.EAE_ROLE).then(() => {
						submitted.reply({
							content: `Signed up successfully! Since your channel meets the requirement, you have won a Beta code (can be used by 1000 players). Don't forget to add it to your video. Your fans will like it!\n👉 \`EAE1000\` 👈\nYour audience may ask where to download the game. That's why we suggest you add the download link to your video description! This is also the place where players can pre-register the game! \n👉 https://bit.ly/downloadprojectevo 👈\nNow, feel free to start making videos and recommend Project EVO to your friends & fans & family!`,
							ephemeral: true,
						});
					});

					await feishu.createRecord(
						tenantToken,
						process.env.CEP_BASE,
						process.env.EAE_PLAYERS,
						{
							fields: {
								"Discord ID": submitted.user.id,
								"Discord Name": submitted.user.tag,
								Channel: {
									text: youtubeChannel,
									link: youtubeChannel,
								},
							},
						}
					);
				}
			}
		} else if (interaction.customId === "checkSubmission") {
			await interaction.deferReply({ ephemeral: true });

			const tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			const response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CEP_BASE,
					process.env.CEP_SUBMISSION,
					`CurrentValue.[Discord ID] = "${interaction.user.id}"`
				)
			);

			const videos = parseInt(response.data.total);

			await interaction.editReply({
				content: `You have submitted ${videos} videos, keep up the good work! We will review your video and record the views on 17th April. You will be able to check the event result by using this button!`,
			});
		}
	} else if (interaction.isModalSubmit()) {
		if (interaction.customId === "betaAccess") {
			await interaction
				.reply({
					content:
						"Checking for Beta Access on " + interaction.user.tag + "...",
					ephemeral: true,
				})
				.catch(console.error);

			if (!betaTesterCodesLoaded) {
				return await interaction.editReply({
					content:
						"Beta Tester Codes are not loaded yet. Please try again later.",
				});
			}
			const activationCode = interaction.fields.getTextInputValue("betaCode");

			if (betaTesterCodes.hasOwnProperty(activationCode)) {
				const subData = betaTesterCodes[activationCode].split(",");
				const recordId = subData[0];
				const table = subData[1];
				const tenantToken = await feishu.authorize(
					process.env.FEISHU_ID,
					process.env.FEISHU_SECRET
				);

				await feishu.updateRecord(
					tenantToken,
					process.env.CODE_BASE,
					table,
					recordId,
					{
						fields: {
							"Discord ID": interaction.user.id,
							Status: "Binded",
						},
					}
				);

				await interaction.member.roles.add(process.env.BETA_ROLE).then(() => {
					interaction.editReply({
						content: "Congrats! <#1018243733373866004> channels are unlocked!",
					});
				});
				delete betaTesterCodes[activationCode];
			} else {
				await interaction.editReply({
					content:
						"Invalid activation code. You haven't applied for the beta, click [here]( https://survey.isnssdk.com/q/51928/2lo2I2z9/d971) to sign-up!\nWe will draw 3300+ extra lucky players to get Beta access codes every Tuesday from 29th Nov 2022 by email.",
				});
			}
		} else if (interaction.customId.startsWith("ca")) {
			await interaction.deferReply({ ephemeral: true });

			let rerun = false;

			const channel = interaction.fields.getTextInputValue(
				"creatorModalChannel"
			);
			const subs = interaction.fields.getTextInputValue("creatorModalSubs");
			const subCount = parseInt(onlyDigits(subs));
			const platform = checkPlatform(interaction.customId.substring(2, 4));
			const region = checkRegion(interaction.customId.slice(4, 6));
			if (interaction.customId.slice(-2) == "Re") rerun = true;

			if (!checkURL(channel)) {
				return await interaction.editReply({
					content: `\`${channel}\`\nPlease enter a **valid ${platform}** link.`,
				});
			}

			let creators = {
				fields: {
					"Discord ID": interaction.user.id,
					"Discord Name": interaction.user.tag,
					Platform: platform,
					Region: region,
					Channel: {
						text: channel,
						link: channel,
					},
					Subscribers: subCount,
				},
			};

			const tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			const response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CEP_BASE,
					process.env.CEP_APP,
					`CurrentValue.[Discord ID] = "${interaction.user.id}"`
				)
			);

			if (rerun) {
				await feishu.updateRecord(
					tenantToken,
					process.env.CEP_BASE,
					process.env.CEP_APP,
					response.data.items[0].record_id,
					creators
				);
				return await interaction.editReply({
					content:
						"Your application has been updated successfully. Please press **I Agree** again to verify the information.",
				});
			} else if (response.data.total) {
				let submissionDate =
					parseInt(
						response.data.items[response.data.items.length - 1].fields[
							"Submission Date"
						]
					) / 1000;

				if (Date.now() / 1000 - submissionDate < 2592000) {
					return await interaction.editReply({
						content: "You can only submit once every 30 days.",
					});
				}
			}

			let success = await feishu.createRecord(
				tenantToken,
				process.env.CEP_BASE,
				process.env.CEP_APP,
				creators
			);

			if (success) {
				await interaction.editReply({
					content: "Your application has been submitted successfully.",
				});
			} else {
				await interaction.editReply({
					content:
						"An error occurred. Please try again later or contact **Simon#0988**.",
				});
			}
		} else if (interaction.customId.startsWith("sc")) {
			await interaction.deferReply({ ephemeral: true });

			let videoURL = interaction.fields.getTextInputValue("submitVideo");
			const theme = interaction.fields.getTextInputValue("submitTheme");
			const platform = checkPlatform(interaction.customId.substring(2, 4));
			const topic = interaction.customId.substring(4);

			if (!checkURL(videoURL)) {
				return await interaction.editReply({
					content: `\`${videoURL}\`\nPlease enter a valid link. If you have \`www\` in your link, please remove it.`,
				});
			} else if (videoURL.includes("youtube") && !videoURL.includes("shorts")) {
				let url = new URL(videoURL);
				let videoId = url.searchParams.get("v");
				let modifiedUrl = `https://www.youtube.com/watch?v=${videoId}`;
				videoURL = modifiedUrl;
			} else if (
				videoURL.includes("youtu.be") &&
				!videoURL.includes("shorts")
			) {
				let videoId = videoURL.split("/").pop().split("?")[0];
				let modifiedUrl = `https://youtu.be/${videoId}`;
				videoURL = modifiedUrl;
			}

			let content = {
				fields: {
					"Discord ID": interaction.user.id,
					"Discord Name": interaction.user.tag,
					Video: {
						text: videoURL,
						link: videoURL,
					},
					Platform: platform,
					Theme: theme,
					Topic: topic,
					"Submission Date": Date.now(),
				},
			};

			const tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);
			let submissions = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CEP_BASE,
					process.env.CEP_SUBMISSION,
					`CurrentValue.[Video] = "${videoURL}"`
				)
			);
			if (submissions.data.total)
				return await interaction.editReply({
					content:
						"This video has already been submitted by a user. Duplicate video submissions are not allowed.",
				});

			let success = await feishu.createRecord(
				tenantToken,
				process.env.CEP_BASE,
				process.env.CEP_SUBMISSION,
				content
			);

			if (success) {
				await interaction.editReply({
					content: "Your application has been submitted successfully.",
				});
			} else {
				await interaction.editReply({
					content:
						"An error occurred. Please try again later or contact **Simon#0988**.",
				});
			}
		} else if (interaction.customId.startsWith("bug_")) {
			await interaction.reply({
				content: "Please upload a screenshot. Only jpg and png are accepted.",
				ephemeral: true,
			});

			const filter = (m) =>
				m.author.id === interaction.user.id && m.attachments.size > 0;
			interaction.channel
				.awaitMessages({ filter, max: 1, time: 60000, errors: ["time"] })
				.then((collected) => {
					const attachment = collected.first().attachments.first();
					if (
						!attachment.url.endsWith("jpg") &&
						!attachment.url.endsWith("png")
					) {
						return interaction.editReply({
							content:
								"You can only submit images in this. To submit a video, upload it to a public site (Youtube, Google Drive, Dropbox, etc.) and send link in the Bug Details section of the form. Please try again.",
						});
					} else {
						download(attachment.url, `${interaction.user.id}-bug.jpg`);
						interaction.editReply({
							content:
								"Image uploaded. Please wait while we try to submit your application...",
						});
						sendResponseToFeishu(interaction);
					}
					collected.first().delete();
				})
				.catch((collected) => {
					interaction.editReply({
						content:
							"You weren't able to upload a screenshot in time. Please try again.",
					});
				});
		} else if (
			interaction.customId === "Vehicle" ||
			interaction.customId === "Building" ||
			interaction.customId === "Weather" ||
			interaction.customId === "Chat" ||
			interaction.customId === "Shooting" ||
			interaction.customId === "Clan" ||
			interaction.customId === "Game Modes" ||
			interaction.customId === "Progression" ||
			interaction.customId === "Customization" ||
			interaction.customId === "Others"
		) {
			await interaction.deferReply({ ephemeral: true });

			let suggestionCategory = interaction.customId;
			let suggestionDetails =
				interaction.fields.getTextInputValue("suggestionDetails");

			await interaction.editReply({
				content: "Your submission was received successfully!",
			});

			const suggestionEmbed = new EmbedBuilder()
				.setTitle(suggestionCategory)
				.setDescription(interaction.user.id)
				.setAuthor({ name: `Suggestion by ${interaction.user.tag}` })
				.addFields(
					{ name: "Feedback details", value: suggestionDetails },
					{
						name: "Players Region",
						value: interactionRegionRole(interaction),
					}
				)
				.setTimestamp();

			await client.channels
				.fetch("1039229404892647545")
				.then((channel) => channel.send({ embeds: [suggestionEmbed] }))
				.then((sentMessage) => {
					sentMessage.react("✅").then(() => sentMessage.react("❌"));
				});
		} else if (interaction.customId === "cecModal") {
			await interaction.deferReply({ ephemeral: true });

			let youtubeChannel = interaction.fields.getTextInputValue("cecChannel");
			let subscribers = interaction.fields.getTextInputValue("cecSubscribers");
			let quantity = interaction.fields.getTextInputValue("cecQuanity");
			let reason = interaction.fields.getTextInputValue("cecReason");

			let videoCount = parseInt(onlyDigits(quantity));
			let subscriberCount = parseInt(onlyDigits(subscribers));

			if (!checkURL(youtubeChannel)) {
				return await interaction.editReply({
					content: `\`${youtubeChannel}\`\nPlease enter a **valid YouTube** link.`,
				});
			}

			if (isNaN(videoCount)) {
				return await interaction.editReply({
					content: `\`${videoCount}\`\nPlease enter a number and try again.`,
				});
			}
			if (isNaN(subscriberCount)) {
				return await interaction.editReply({
					content: `\`${subscriberCount}\`\nPlease enter a number and try again.`,
				});
			}

			let record = {
				fields: {
					"Discord ID": interaction.user.id,
					"Discord Name": interaction.user.tag,
					"Youtube Channel": {
						text: youtubeChannel,
						link: youtubeChannel,
					},
					Subscribers: subscriberCount,
					"Videos per Week": videoCount,
					Motivation: reason,
				},
			};

			let tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			let response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CEP_BASE,
					process.env.CEC_APP,
					`CurrentValue.[Discord ID] = "${interaction.user.id}"`
				)
			);

			if (response.data.total) {
				let submissionDate =
					parseInt(
						response.data.items[response.data.items.length - 1].fields[
							"Submission Date"
						]
					) / 1000;

				if (Date.now() / 1000 - submissionDate < 2592000) {
					return await interaction.editReply({
						content: "You can only submit once every 30 days.",
					});
				}
			}

			let success = await feishu.createRecord(
				tenantToken,
				process.env.CEP_BASE,
				process.env.CEC_APP,
				record
			);

			if (success) {
				await interaction.editReply({
					content: "Your application has been submitted successfully.",
				});
			} else {
				await interaction.editReply({
					content:
						"An error occurred. Please try again later or contact **Simon#0988**.",
				});
			}
		} else if (interaction.customId === "sdModal") {
			await interaction.deferReply({ ephemeral: true });

			let tos1 = interaction.fields.getTextInputValue("sdTOS1");
			let tos2 = interaction.fields.getTextInputValue("sdTOS2");
			let job = interaction.fields.getTextInputValue("sdJob");
			let youtubeChannel = interaction.fields.getTextInputValue("sdChannel");
			let subscribers = parseInt(
				onlyDigits(interaction.fields.getTextInputValue("sdSubscribers"))
			);

			if (tos1.toLowerCase() != "yes" || tos2.toLowerCase() != "yes") {
				return await interaction.editReply({
					content: "You must agree to the requirements before proceeding.",
				});
			}

			if (!checkURL(youtubeChannel)) {
				return await interaction.editReply({
					content: `\`${youtubeChannel}\`\nPlease enter a **valid YouTube** link.`,
				});
			}

			if (isNaN(subscribers)) {
				return await interaction.editReply({
					content: `\`${subscribers}\`\nPlease enter a number and try again.`,
				});
			}

			let record = {
				fields: {
					"Discord ID": interaction.user.id,
					"Discord Name": interaction.user.tag,
					"YouTube Channel": {
						text: youtubeChannel,
						link: youtubeChannel,
					},
					Subscribers: subscribers,
					Job: job,
				},
			};

			let tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			let response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CEP_BASE,
					process.env.SEVEN_DAY,
					`CurrentValue.[Discord ID] = "${interaction.user.id}"`
				)
			);

			if (response.data.total) {
				return await interaction.editReply({
					content: "You can only sign up once.",
				});
			}

			let success = await feishu.createRecord(
				tenantToken,
				process.env.CEP_BASE,
				process.env.SEVEN_DAY,
				record
			);

			if (success) {
				await interaction.editReply({
					content:
						"You have signed up successfully. The staff will contact you within 48 hours if your application is approved. There might not be a response if it fails.",
				});
			} else {
				await interaction.editReply({
					content:
						"An error occurred. Please try again later or contact **Simon#0988**.",
				});
			}
		} else if (interaction.customId === "sdModal2") {
			await interaction.deferReply({ ephemeral: true });

			let region = interaction.fields.getTextInputValue("sdRegion");
			let roleName = interaction.fields.getTextInputValue("sdRoleName");
			let roleId = interaction.fields.getTextInputValue("sdRoleId");
			let sessionId = interaction.fields.getTextInputValue("sdSessionId");
			let discordId = interaction.user.id;

			let record = {
				fields: {
					Region: region,
					"Role Name": roleName,
					"Role ID": roleId,
					"Session ID": sessionId,
				},
			};

			let tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			let response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CEP_BASE,
					process.env.SEVEN_DAY,
					`CurrentValue.[Discord ID] = "${discordId}"`
				)
			);

			if (!response.data.total) {
				return await interaction.editReply({
					content: "You are not signed up.",
				});
			}

			let recordId = response.data.items[0].record_id;

			await feishu.updateRecord(
				tenantToken,
				process.env.CEP_BASE,
				process.env.SEVEN_DAY,
				recordId,
				record
			);

			await interaction.editReply({
				content: "You have successfully submitted your information.",
			});
		}
	} else if (interaction.isStringSelectMenu()) {
		if (interaction.customId.startsWith("suggestionSelectMenu")) {
			let selection = interaction.values[0];
			const suggestionModal = new ModalBuilder().setCustomId(selection);
			suggestionModal.setTitle(selection);
			const suggestionDetails = new TextInputBuilder()
				.setCustomId("suggestionDetails")
				.setLabel("Suggestion Details")
				.setPlaceholder("Explain the suggestion here.")
				.setStyle(TextInputStyle.Paragraph);

			let firstQuestion = new ActionRowBuilder().addComponents(
				suggestionDetails
			);

			suggestionModal.addComponents(firstQuestion);

			await interaction.showModal(suggestionModal);
			await interaction.followUp({
				content: `Selected **${selection}**.`,
				components: [],
				ephemeral: true,
			});
		} else if (interaction.customId === "submitContentSelectMenu") {
			const selection = interaction.values[0];
			const platform = checkPlatform(selection.substring(2, 4));
			const topic = selection.substring(4);

			const submitModal = new ModalBuilder()
				.setCustomId(selection)
				.setTitle("Submit Content: " + platform);
			const submitVideo = new TextInputBuilder()
				.setCustomId("submitVideo")
				.setLabel("Your " + platform + " Link")
				.setStyle(TextInputStyle.Short)
				.setRequired(true);
			const submitTheme = new TextInputBuilder()
				.setCustomId("submitTheme")
				.setLabel("Video Theme")
				.setPlaceholder("What does the video talk about?")
				.setStyle(TextInputStyle.Short)
				.setRequired(true);

			let firstQuestion = new ActionRowBuilder().addComponents(submitVideo);
			let secondQuestion = new ActionRowBuilder().addComponents(submitTheme);

			submitModal.addComponents(firstQuestion, secondQuestion);

			await interaction
				.showModal(submitModal)
				.catch((error) => {
					console.log(error);
				})
				.then(() => {
					interaction.followUp({
						content: `**Platform** ${platform}\n**Topic** ${topic}`,
						components: [],
						ephemeral: true,
					});
				});
		} else if (interaction.customId.startsWith("askRegionSelectMenu")) {
			await interaction.deferUpdate({ ephemeral: true });

			const selection = interaction.values[0];
			const recordId = interaction.customId.substring(19);

			let tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			const row = new ActionRowBuilder().addComponents(
				new StringSelectMenuBuilder()
					.setCustomId("askRewardSelectMenu" + recordId)
					.setPlaceholder("Select your reward type")
			);

			switch (selection) {
				case "Brazil":
					row.components[0].addOptions(
						{ label: "Google Play Gift Card", value: "Google Play Gift Card" },
						{ label: "Razer Gold", value: "Razer Gold" },
						{ label: "Netflix Gift Card", value: "Netflix Gift Card" }
					);
					break;
				case "Mexico":
					row.components[0].addOptions(
						{ label: "Google Play Gift Card", value: "Google Play Gift Card" },
						{ label: "Amazon Gift Card", value: "Amazon Gift Card" },
						{ label: "iTunes Gift Card", value: "iTunes Gift Card" }
					);
					break;
				case "United States":
					row.components[0].addOptions(
						{ label: "Amazon Gift Card", value: "Amazon Gift Card" },
						{ label: "iTunes Gift Card", value: "iTunes Gift Card" },
						{ label: "Google Play Gift Card", value: "Google Play Gift Card" }
					);
					break;
				case "Canada":
					row.components[0].addOptions(
						{ label: "Google Play Gift Card", value: "Google Play Gift Card" },
						{ label: "Amazon Gift Card", value: "Amazon Gift Card" },
						{ label: "iTunes Gift Card", value: "iTunes Gift Card" }
					);
					break;
				case "Australia":
					row.components[0].addOptions(
						{ label: "Google Play Gift Card", value: "Google Play Gift Card" },
						{ label: "Amazon Gift Card", value: "Amazon Gift Card" },
						{ label: "iTunes Gift Card", value: "iTunes Gift Card" }
					);
					break;
				case "India":
					row.components[0].addOptions({
						label: "Google Play Gift Card",
						value: "Google Play Gift Card",
					});
					break;
				case "Thailand":
					row.components[0].addOptions(
						{ label: "Razer Gold", value: "Razer Gold" },
						{
							label: "PlayStation Netword Card",
							value: "PlayStation Netword Card",
						},
						{ label: "Netflix Gift Card", value: "Netflix Gift Card" }
					);
					break;
				case "Philippines":
					row.components[0].addOptions({
						label: "Razer Gold",
						value: "Razer Gold",
					});
					break;
				case "Turkey":
					row.components[0].addOptions({
						label: "Google Play Gift Card",
						value: "Google Play Gift Card",
					});
					break;
				case "Russia":
					row.components[0].addOptions(
						{ label: "OZON Gift Card", value: "OZON Gift Card" },
						{ label: "iTunes Gift Card", value: "iTunes Gift Card" },
						{
							label: "PlayStation Netword Card",
							value: "PlayStation Netword Card",
						},
						{ label: "Steam Wallet Code", value: "Steam Wallet Code" }
					);
					break;
				case "Ukraine":
					row.components[0].addOptions({
						label: "Steam Wallet Code",
						value: "Steam Wallet Code",
					});
					break;
				case "Indonesia":
					row.components[0].addOptions({
						label: "Google Play Gift Card",
						value: "Google Play Gift Card",
					});
					break;
				case "EU":
					row.components[0].addOptions(
						{ label: "Google Play Gift Card", value: "Google Play Gift Card" },
						{ label: "Amazon Gift Card", value: "Amazon Gift Card" }
					);
					break;
				case "United Arab Emirates":
					row.components[0].addOptions({
						label: "PlayStation Netword Card",
						value: "PlayStation Netword Card",
					});
					break;
				default:
					row.components[0].addOptions(
						{ label: "Google Play Gift Card", value: "Google Play Gift Card" },
						{ label: "Amazon Gift Card", value: "Amazon Gift Card" },
						{ label: "Razer Gold", value: "Razer Gold" },
						{ label: "Garena Shells", value: "Garena Shells" },
						{ label: "OZON Gift Card", value: "OZON Gift Card" },
						{ label: "Steam Wallet Code", value: "Steam Wallet Code" },
						{ label: "Apple Gift Card", value: "Apple Gift Card" },
						{
							label: "PlayStation Netword Card",
							value: "PlayStation Netword Card",
						},
						{ label: "iTunes Gift Card", value: "iTunes Gift Card" },
						{ label: "Netflix Gift Card", value: "Netflix Gift Card" }
					);
					break;
			}

			await interaction
				.editReply({
					content: `${interaction.message}\nRegion selected: **${selection}**`,
					components: [row],
				})
				.then(() => {
					feishu.updateRecord(
						tenantToken,
						process.env.REWARD_BASE,
						process.env.DELIVERY,
						recordId,
						{ fields: { Region: [selection], NOTE2: "Asked Reward" } }
					);
				});
		} else if (interaction.customId.startsWith("askRewardSelectMenu")) {
			await interaction.deferUpdate({ ephemeral: true });

			let dm;
			if (interaction.channel.type === ChannelType.DM) {
				dm = true;
			} else {
				dm = false;
			}

			const selection = interaction.values[0];
			const recordId = interaction.customId.substring(19);

			let tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);

			await interaction
				.editReply({
					content: `${interaction.message}\nReward selected: **${selection}**`,
					components: [],
				})
				.then(() => {
					feishu.updateRecord(
						tenantToken,
						process.env.REWARD_BASE,
						process.env.DELIVERY,
						recordId,
						{
							fields: {
								"Reward Type": selection,
								Status: "To Be Purchased",
								NOTE2: "Asked Region & Reward",
							},
						}
					);
				});

			if (!dm) {
				const thread = interaction.channel;
				await thread.members.remove(interaction.user.id);
				await thread.setArchived(true);
				await client.channels
					.fetch(process.env.COLLECT_REWARDS_CHANNEL)
					.then((channel) => {
						channel.permissionOverwrites.delete(
							interaction.user,
							"Chose Region and Reward"
						);
					});
			}
		} else if (interaction.customId.startsWith("platformSelectMenu")) {
			const type = interaction.customId.substring(18);
			const selection = interaction.values[0];
			const platform = checkPlatform(selection);
			let formatSelection = "ca" + selection;
			switch (type) {
				case "Apply":
					await interaction.deferReply({ ephemeral: true });
					const row = await showRegionMenu(formatSelection);
					await interaction.editReply({
						content: `**Platform** ${platform}\n`,
						components: [row],
					});
					break;
				case "ApplyRe":
					formatSelection += "Re";
					await interaction.deferReply({ ephemeral: true });
					const row2 = await showRegionMenu(formatSelection);
					await interaction.editReply({
						content: `**Platform** ${platform}\n`,
						components: [row2],
					});
					break;
				case "Submit":
					await showSubmitModal(interaction);
					break;
				default:
					await interaction.reply({
						content: `Something went wrong. Please contact **Simon#0988** for further assistance.`,
						components: [],
					});
					break;
			}
		} else if (interaction.customId.startsWith("ca")) {
			await showApplyModal(interaction);
		} else if (interaction.customId === "bugCategories") {
			const selection = interaction.values[0];
			const bugMode = new StringSelectMenuBuilder()
				.setCustomId("bugMode" + selection)
				.setPlaceholder("Where the bug occurs")
				.addOptions(
					{ label: "Casual Mode", value: "Casual Mode" },
					{ label: "Standard Mode", value: "Standard Mode" },
					{ label: "Lobby", value: "Lobby" },
					{ label: "Other Places", value: "Other Places" }
				);

			const row = new ActionRowBuilder().addComponents(bugMode);

			await interaction.update({
				content: `Selected **${selection}**`,
				components: [row],
			});
		} else if (interaction.customId.startsWith("bugMode")) {
			const selection = interaction.values[0];
			const category = interaction.customId.substring(7);

			const bugreportModal = new ModalBuilder()
				.setCustomId("bug_" + category + "_" + selection)
				.setTitle(category);
			const bugUsername = new TextInputBuilder()
				.setCustomId("bugUsername")
				.setLabel("Nickname")
				.setPlaceholder("Please enter your in-game nickname here.")
				.setStyle(TextInputStyle.Short)
				.setRequired(true);
			const bugPhone = new TextInputBuilder()
				.setCustomId("bugPhone")
				.setLabel("Phone Model and RAM")
				.setPlaceholder("Mention your phone model and RAM here.")
				.setStyle(TextInputStyle.Short)
				.setRequired(true);
			const bugSession = new TextInputBuilder()
				.setCustomId("bugSession")
				.setLabel("Session ID")
				.setPlaceholder("In which session did you encounter the bug?")
				.setStyle(TextInputStyle.Short)
				.setRequired(true);
			const bugDetails = new TextInputBuilder()
				.setCustomId("bugDetails")
				.setLabel("Bug Details")
				.setPlaceholder("Give a detailed explanation of the bug here.")
				.setStyle(TextInputStyle.Paragraph)
				.setRequired(true);

			let r1 = new ActionRowBuilder().addComponents(bugUsername);
			let r2 = new ActionRowBuilder().addComponents(bugPhone);
			let r3 = new ActionRowBuilder().addComponents(bugSession);
			let r4 = new ActionRowBuilder().addComponents(bugDetails);

			bugreportModal.addComponents(r1, r2, r3, r4);

			await interaction.showModal(bugreportModal);
		}
	}
});

client.on("messageCreate", async (message) => {
	if (message.channel.type === ChannelType.DM && message.author.bot === false) {
		let msg = message.content;
		let msgAuthor = message.author.username;

		let hasLionRole = await checkMemberRole(
			client,
			process.env.EVO_SERVER,
			message.author.id,
			"990812565892386867"
		);

		if (!hasLionRole) return;

		let body = {
			msg_type: "interactive",
			card: {
				config: {
					wide_screen_mode: true,
				},
				elements: [
					{
						fields: [
							{
								is_short: false,
								text: {
									content: msg,
									tag: "lark_md",
								},
							},
						],
						tag: "div",
					},
					{
						tag: "hr",
					},
				],
				header: {
					template: "red",
					title: {
						content: msgAuthor,
						tag: "plain_text",
					},
				},
			},
		};

		if (message.attachments.size > 0) {
			let attachment = message.attachments.first();
			let file = `${msgAuthor}-dm.jpg`;

			await request.head(attachment.url, function (err, res, body) {
				request(attachment.url).pipe(fs.createWriteStream(file));
			});

			let tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);
			let response = await feishu.getFileToken(tenantToken, file);
			let image_key = JSON.parse(response).data.image_key;

			body = {
				msg_type: "interactive",
				card: {
					config: {
						wide_screen_mode: true,
					},
					elements: [
						{
							fields: [
								{
									is_short: false,
									text: {
										content: msg,
										tag: "lark_md",
									},
								},
							],
							tag: "div",
						},
						{
							tag: "hr",
						},
						{
							alt: {
								content: "",
								tag: "plaint_text",
							},
							img_key: image_key,
							tag: "img",
						},
					],
					header: {
						template: "red",
						title: {
							content: msgAuthor,
							tag: "plain_text",
						},
					},
				},
			};

			fs.unlinkSync(file);
		}

		await feishu.sendGroupMessage(
			"https://open.larksuite.com/open-apis/bot/v2/hook/f710206e-f9e1-4c7f-9e47-d2c3c6dbd21a",
			body
		);
	}
});

client.on("guildMemberUpdate", async (oldMember, newMember) => {
	const guild = client.guilds.cache.get(process.env.EVO_SERVER);
	const member = await guild.members.fetch(newMember.user.id);

	if (
		!oldMember.roles.cache.has(process.env.CC_ROLE) &&
		newMember.roles.cache.has(process.env.CC_ROLE)
	) {
		const tenantToken = await feishu.authorize(
			process.env.FEISHU_ID,
			process.env.FEISHU_SECRET
		);

		let response = JSON.parse(
			await feishu.getRecords(
				tenantToken,
				process.env.CEP_BASE,
				process.env.CEP_CREATOR,
				`CurrentValue.[Discord ID] = "${newMember.user.id}"`
			)
		);

		if (response.data.total) {
			logger.debug("Creator already exists.");
			return;
		}

		response = JSON.parse(
			await feishu.getRecords(
				tenantToken,
				process.env.CODE_BASE,
				process.env.CODE_DATABASE,
				`NOT(CurrentValue.[Status] = "Used")`
			)
		);

		const recordId = response.data.items[0].record_id;
		const code = response.data.items[0].fields["Beta Codes"];
		logger.info(
			`Codes available: ${response.data.total}.\nCodes needed: 1.\nCode: ${code}`
		);

		response = JSON.parse(
			await feishu.getRecords(
				tenantToken,
				process.env.CEP_BASE,
				process.env.CEP_APP,
				`CurrentValue.[Discord ID] = "${newMember.user.id}"`
			)
		);

		if (!response.data.total)
			return logger.debug(
				"Creator application not found. - " + newMember.user.id
			);

		const benefitLevel = response.data.items[0].fields["Benefit Level"];

		const creator = {
			fields: {
				"Discord ID": newMember.user.id,
				"Discord Name": newMember.user.tag,
				Platform: response.data.items[0].fields.Platform,
				Region: response.data.items[0].fields.Region,
				Channel: {
					text: response.data.items[0].fields.Channel.text,
					link: response.data.items[0].fields.Channel.link,
				},
				Subscribers: parseInt(response.data.items[0].fields.Subscribers),
				"Benefit Level": benefitLevel,
			},
		};

		await feishu.createRecord(
			tenantToken,
			process.env.CEP_BASE,
			process.env.CEP_CREATOR,
			creator
		);

		const embed = new EmbedBuilder()
			.setTitle("Congrats! Now You Are An EVO Creator!")
			.setDescription(
				`Congratulations! Thanks for joining CEP. Together with the official team, we make the EVO community bigger and better!\n\n**Here is your Beta Code. Feel free to try the game and introduce it to your friends & fans!**\n\`${code}\`\n\n**Feel free to enjoy our exclusive benefits! Your benefit level is ${benefitLevel}, which decides how many benefits you can get access to. Please join our official [Creator Evolution Club](https://discord.gg/bexu5aVyrY) to learn about details!**\n- Sneak Peeks into the latest version!\n- Beta codes for you & your fans per month!\n- Chances to win mobile phones or more devices!\n- Chances to become sponsored channels and more!\n- Chances to get access to collaboration opportunities!\n\n*Note:*\n*1. you can only get access to the benefits by joining our club!*n*2. We have the right to ban your code if we find out fraudulent behaviors or code trading.*\n\nGood luck. Have fun!`
			)
			.setColor(`C04946`);

		await member
			.send({ embeds: [embed] })
			.then(() => {
				logger.info(
					`Sent code to ${newMember.user.tag} (${newMember.user.id})`
				);
				feishu.updateRecord(
					tenantToken,
					process.env.CODE_BASE,
					process.env.CODE_DATABASE,
					recordId,
					{
						fields: {
							Status: "Used",
							"Discord ID": newMember.user.id,
						},
					}
				);
			})
			.catch((error) => console.error(error));

		return;
	}
});

client.on("guildMemberAdd", async (member) => {
	if (member.guild.id == process.env.EVO_CEC_SERVER) {
		let hasCCRole = await checkMemberRole(
			client,
			process.env.EVO_SERVER,
			member.user.id,
			process.env.CC_ROLE
		);
		setTimeout(() => {
			if (hasCCRole) {
				member.roles
					.add([process.env.CEC_MEMBER_ROLE])
					.catch((error) => console.error(error));
			} else {
				member
					.send({
						content:
							"You have been kicked from the server because you don't have access to **Creator Evolution Club**.",
					})
					.then(() => {
						member.kick("No CC Role").catch((error) => console.error(error));
					})
					.catch((error) => {
						console.error(error);
						member.kick("No CC Role").catch((error) => console.error(error));
					});
			}
		}, 5000);
	}
});

client.on("messageReactionAdd", async (reaction, user) => {
	if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.error("Something went wrong when fetching the message:", error);
			return;
		}
	}

	let message = reaction.message;
	let channel = reaction.message.channelId;

	if (user == client.user) return;
	if (
		reaction.emoji.name === "✅" &&
		channel == process.env.SUGGESTION_DECISION_CHANNEL
	) {
		let discord_id = message.embeds[0].description;
		let category = message.embeds[0].title;
		let username = message.embeds[0].author.name.slice(14);
		let details = message.embeds[0].fields[0].value;
		let region = message.embeds[0].fields[1].value;

		let sugs = {
			fields: {
				"Discord ID": discord_id,
				"Feedback details": details,
				"Feedback Type": category,
				"Players Region": region,
			},
		};

		let tenantToken = await feishu.authorize(
			process.env.FEISHU_ID,
			process.env.FEISHU_SECRET
		);

		await feishu.createRecord(
			tenantToken,
			process.env.FEEDBACK_BASE,
			process.env.FEEDBACK,
			sugs
		);

		await message
			.edit({ content: `✅✅ **ACCEPTED BY ${user}** ✅✅` })
			.then(message.reactions.removeAll());

		const suggestionEmbed = new EmbedBuilder()
			.setTitle(category)
			.setAuthor({ name: `Suggestion by ${username}` })
			.addFields({ name: "Feedback details", value: details })
			.setTimestamp();

		await client.channels
			.fetch("973699891186532433")
			.then((channel) => channel.send({ embeds: [suggestionEmbed] }))
			.then((sentMessage) => {
				sentMessage.react("🔼").then(() => sentMessage.react("🔽"));
			});
	} else if (
		reaction.emoji.name === "❌" &&
		channel == process.env.SUGGESTION_DECISION_CHANNEL
	) {
		await message
			.edit({ content: `❌❌ **REJECTED BY ${user}** ❌❌` })
			.then(message.reactions.removeAll());
	} else if (
		reaction.emoji.name === "🔼" &&
		channel == process.env.VOTE_SUGGESTION_CHANNEL
	) {
		const tenantToken = await feishu.authorize(
			process.env.FEISHU_ID,
			process.env.FEISHU_SECRET
		);

		const details = message.embeds[0].fields[0].value.replace(/"/g, '\\"');

		const count = message.reactions.cache.get("🔼").count;

		let response = JSON.parse(
			await feishu.getRecords(
				tenantToken,
				process.env.FEEDBACK_BASE,
				process.env.FEEDBACK,
				`CurrentValue.[Feedback details] = "${details}"`
			)
		);

		if (response.data == undefined) {
			response = JSON.stringify(response);
			return logger.warn(
				`Could not add 🔼\n${details}\nUNDEFINED RESPONSE\n${response}`
			);
		} else if (!response.data.total) {
			return logger.warn(`Could not add 🔼\n${details}`);
		}

		await feishu.updateRecord(
			tenantToken,
			process.env.FEEDBACK_BASE,
			process.env.FEEDBACK,
			response.data.items[0].record_id,
			{ fields: { "🔼": count } }
		);
	} else if (
		reaction.emoji.name === "🔽" &&
		channel == process.env.VOTE_SUGGESTION_CHANNEL
	) {
		const tenantToken = await feishu.authorize(
			process.env.FEISHU_ID,
			process.env.FEISHU_SECRET
		);

		const details = message.embeds[0].fields[0].value.replace(/"/g, '\\"');

		const count = message.reactions.cache.get("🔽").count;

		let response = JSON.parse(
			await feishu.getRecords(
				tenantToken,
				process.env.FEEDBACK_BASE,
				process.env.FEEDBACK,
				`CurrentValue.[Feedback details] = "${details}"`
			)
		);

		if (response.data == undefined) {
			response = JSON.stringify(response);
			return logger.warn(
				`Could not add 🔽\n${details}\nUNDEFINED RESPONSE\n${response}`
			);
		} else if (!response.data.total) {
			return logger.warn(`Could not add 🔽\n${details}`);
		}

		await feishu.updateRecord(
			tenantToken,
			process.env.FEEDBACK_BASE,
			process.env.FEEDBACK,
			response.data.items[0].record_id,
			{ fields: { "🔽": count } }
		);
	}
});

client.on("messageReactionRemove", async (reaction, user) => {
	if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			console.error("Something went wrong when fetching the message:", error);
			return;
		}
	}

	const message = reaction.message;
	const channel = reaction.message.channelId;

	if (user == client.user) return;
	if (
		reaction.emoji.name === "🔼" &&
		channel == process.env.VOTE_SUGGESTION_CHANNEL
	) {
		const tenantToken = await feishu.authorize(
			process.env.FEISHU_ID,
			process.env.FEISHU_SECRET
		);

		const details = message.embeds[0].fields[0].value.replace(/"/g, '\\"');

		const count = message.reactions.cache.get("🔼").count;

		let response = JSON.parse(
			await feishu.getRecords(
				tenantToken,
				process.env.FEEDBACK_BASE,
				process.env.FEEDBACK,
				`CurrentValue.[Feedback details] = "${details}"`
			)
		);

		if (response.data == undefined) {
			return logger.warn(
				`Could not remove 🔼\n${details}\nUNDEFINED RESPONSE\n${response}`
			);
		} else if (!response.data.total) {
			return logger.warn(`Could not remove 🔼\n${details}`);
		}

		await feishu.updateRecord(
			tenantToken,
			process.env.FEEDBACK_BASE,
			process.env.FEEDBACK,
			response.data.items[0].record_id,
			{ fields: { "🔼": count } }
		);
	} else if (
		reaction.emoji.name === "🔽" &&
		channel == process.env.VOTE_SUGGESTION_CHANNEL
	) {
		const tenantToken = await feishu.authorize(
			process.env.FEISHU_ID,
			process.env.FEISHU_SECRET
		);

		const details = message.embeds[0].fields[0].value.replace(/"/g, '\\"');

		const count = message.reactions.cache.get("🔽").count;

		let response = JSON.parse(
			await feishu.getRecords(
				tenantToken,
				process.env.FEEDBACK_BASE,
				process.env.FEEDBACK,
				`CurrentValue.[Feedback details] = "${details}"`
			)
		);

		if (response.data == undefined) {
			response = JSON.stringify(response);
			return logger.warn(
				`Could not remove 🔽\n${details}\nUNDEFINED RESPONSE\n${response}`
			);
		} else if (!response.data.total) {
			return logger.warn(`Could not remove 🔽\n${details}`);
		}

		await feishu.updateRecord(
			tenantToken,
			process.env.FEEDBACK_BASE,
			process.env.FEEDBACK,
			response.data.items[0].record_id,
			{ fields: { "🔽": count } }
		);
	}
});

client.login(process.env.DISCORD_TOKEN);

function interactionRegionRole(interaction) {
	let roles = [],
		regions = "";
	if (interaction.member.roles.cache.has(process.env.CIS_ROLE))
		roles.push("CIS");
	if (interaction.member.roles.cache.has(process.env.PT_ROLE)) roles.push("PT");
	if (interaction.member.roles.cache.has(process.env.ES_ROLE)) roles.push("ES");
	if (interaction.member.roles.cache.has(process.env.TH_ROLE)) roles.push("TH");
	if (interaction.member.roles.cache.has("972375574406385705"))
		roles.push("FR");
	if (interaction.member.roles.cache.has("973040050063417376"))
		roles.push("TR");
	if (interaction.member.roles.cache.has("973040245119524915"))
		roles.push("DE");
	if (interaction.member.roles.cache.has("973042080823783464"))
		roles.push("VN");
	if (interaction.member.roles.cache.has("976940106961272994"))
		roles.push("AR");
	if (interaction.member.roles.cache.has("976940260200169502"))
		roles.push("PH");
	if (interaction.member.roles.cache.has("984111719292993628"))
		roles.push("HI");
	if (interaction.member.roles.cache.has("989240355071348746"))
		roles.push("PL");
	if (interaction.member.roles.cache.has("996876611926364250"))
		roles.push("FA");
	if (interaction.member.roles.cache.has("996882291945111602"))
		roles.push("IN");
	if (interaction.member.roles.cache.has("972350125844336680"))
		roles.push("EN");
	if (interaction.member.roles.cache.has("1017922224776286269"))
		roles.push("Global");

	roles.forEach(function (items) {
		regions = regions.concat(items, " ");
	});

	return regions;
}

async function checkMemberRole(client, guildId, userId, roleId) {
	// logger.debug(`Checking if user ${userId} has role ${roleId} in guild ${guildId}`);
	const guild = client.guilds.cache.get(guildId);
	const member = await guild.members.fetch(userId).catch((error) => {
		logger.error(error);
	});
	if (member == undefined) {
		// logger.debug(`User ${userId} not found in guild ${guildId}`);
		return false;
	}
	if (member.roles.cache.has(roleId)) {
		// logger.debug(`User ${userId} has role ${roleId} in guild ${guildId}`);
		return true;
	} else {
		// logger.debug(`User ${userId} does not have role ${roleId} in guild ${guildId}`);
		return false;
	}
}

async function checkRoles(interaction, userId, rolesToCheck) {
	const member = await interaction.guild.members.fetch(userId);
	let roles = [];

	for (const role of rolesToCheck) {
		if (member.roles.cache.has(role)) {
			roles.push(role);
		}
	}

	return roles;
}

function checkURL(text, log) {
	if (text.includes("www.")) {
		text = text.replace("www.", "");
	}

	if (text.includes("vm.")) {
		text = text.replace("vm.", "");
	}

	const expression =
		/^(https?\:\/\/)?((www\.)?youtube\.com|youtu\.be|tiktok\.com|taptap\.io|twitter\.com|instagram\.com|twitch\.com)\/.+$/;
	const regex = new RegExp(expression);

	if (text.match(regex)) {
		if (log) logger.debug(text + " is a valid URL");
		return true;
	} else return false;
}

function onlyDigits(string) {
	return string.replace(/\D/g, "");
}

async function checkOldFiles() {
	// Use __dirname to get the absolute path of the directory that the script is in
	const rootDir = __dirname;

	// Read all files in the root directory
	fs.readdir(rootDir, (err, files) => {
		if (err) {
			console.error(err);
			return;
		}

		// Iterate through each file
		for (const file of files) {
			// Get the full path of the file
			const filePath = path.join(rootDir, file);

			if (!file.endsWith("-bug.jpg")) {
				continue;
			}

			// Get the timestamp of when the file was last modified
			fs.stat(filePath, (err, stats) => {
				if (err) {
					console.error(err);
					return;
				}

				// Check if the file is older than 1 hour
				const oneHourAgo = new Date(Date.now() - 1000 * 60 * 60);
				if (stats.mtime < oneHourAgo) {
					console.log(`${file} is older than 1 hour.`);
					fs.unlinkSync(file);
				}
			});
		}
	});
}

async function loadWelcomeMessages() {
	try {
		welcomeMessages = new Map(
			JSON.parse(fs.readFileSync("welcomeMessages.json"))
		);
	} catch (err) {
		welcomeMessages = new Map();
	}
}

function checkPlatform(code) {
	let platform = "";
	switch (code) {
		case "YT":
			platform = "YouTube";
			break;
		case "SH":
			platform = "YouTube Shorts";
			break;
		case "TK":
			platform = "TikTok";
			break;
		case "TP":
			platform = "TapTap";
			break;
		case "TW":
			platform = "Twitch";
			break;
		case "TT":
			platform = "Twitter";
			break;
		case "IG":
			platform = "Instagram";
			break;
		default:
			platform = "YouTube";
			break;
	}
	return platform;
}

function checkRegion(code) {
	let region = "";
	switch (code) {
		case "BR":
			region = "Brazil";
			break;
		case "MX":
			region = "Mexico";
			break;
		case "US":
			region = "United States";
			break;
		case "CN":
			region = "Canada";
			break;
		case "PH":
			region = "Philippines";
			break;
		case "TH":
			region = "Thailand";
			break;
		case "SG":
			region = "Singapore";
			break;
		case "RU":
			region = "Russia";
			break;
		case "IN":
			region = "India";
			break;
		case "IQ":
			region = "Iraq";
			break;
		case "IL":
			region = "Israel";
			break;
		case "SA":
			region = "Saudi Arabia";
			break;
		case "AE":
			region = "United Arab Emirates";
			break;
		case "TR":
			region = "Turkey";
			break;
		case "GB":
			region = "United Kingdom";
			break;
		case "UA":
			region = "Ukraine";
			break;
		case "DO":
			region = "Dominican Republic";
			break;
		case "OT":
			region = "Other";
			break;
		default:
			region = "Other";
			break;
	}
	return region;
}

async function showApplyModal(interaction) {
	let rerun = false;
	const selection = interaction.values[0];
	if (interaction.customId.slice(-2) == "Re") rerun = true;
	const platform = checkPlatform(interaction.customId.substring(2, 4));
	let formatSelection;
	if (rerun)
		formatSelection = interaction.customId.substring(0, 4) + selection + "Re";
	else formatSelection = interaction.customId.substring(0, 4) + selection;

	const creatorModal = new ModalBuilder()
		.setCustomId(formatSelection)
		.setTitle(`${platform} Creator Application`);
	const creatorModalChannel = new TextInputBuilder()
		.setCustomId("creatorModalChannel")
		.setLabel(`Your ${platform} Channel Link`)
		.setPlaceholder("http://youtube.com/c/PROJECTEVOGAME")
		.setStyle(TextInputStyle.Short)
		.setRequired(true);
	const creatorModalSubs = new TextInputBuilder()
		.setCustomId("creatorModalSubs")
		.setLabel("How many subscribers do you have?")
		.setPlaceholder("1000+")
		.setStyle(TextInputStyle.Short)
		.setRequired(true);

	let firstQuestion = new ActionRowBuilder().addComponents(creatorModalChannel);
	let secondQuestion = new ActionRowBuilder().addComponents(creatorModalSubs);

	creatorModal.addComponents(firstQuestion, secondQuestion);

	await interaction.showModal(creatorModal);
}

async function showSubmitModal(interaction) {
	await interaction.deferUpdate({ ephemeral: true });
	const selection = interaction.values[0];
	const platform = checkPlatform(selection);
	const formatSelection = "sc" + selection;

	const submitContentSelectMenu = new StringSelectMenuBuilder()
		.setCustomId("submitContentSelectMenu")
		.setPlaceholder("Select a topic")
		.addOptions(
			{
				label: "EVO Guider Team",
				value: formatSelection + "EVO Guider Team",
			},
			{
				label: "Make EVO Shorts Event",
				value: formatSelection + "Make EVO Shorts Event",
			},
			{
				label: "ECC - Gameplay Guide",
				value: formatSelection + "ECC - Gameplay Guide",
			},
			{
				label: "ECC - Storytelling",
				value: formatSelection + "ECC - Storytelling",
			},
			{
				label: "ECC - Entertaining Montages",
				value: formatSelection + "ECC - Entertaining Montages",
			},
			{
				label: "Beta 1.3 Update",
				value: formatSelection + "Beta 1.3 Update",
			},
			{
				label: "Other Topics",
				value: formatSelection + "Other Topics",
			}
		);

	let row = new ActionRowBuilder().addComponents(submitContentSelectMenu);

	await interaction.editReply({
		content: `**What topic your content is about?**\n\n**Platform** ${platform}`,
		components: [row],
	});
}

async function platformMenu(customId) {
	const platformSelectMenu = new StringSelectMenuBuilder()
		.setCustomId(customId)
		.setPlaceholder("Select your platform")
		.addOptions(
			{
				label: "YouTube",
				value: "YT",
			},
			{
				label: "YouTube Shorts",
				value: "SH",
			},
			{
				label: "TikTok",
				value: "TK",
			},
			{
				label: "TapTap",
				value: "TP",
			},
			{
				label: "Twitch",
				value: "TW",
			},
			{
				label: "Twitter",
				value: "TT",
			},
			{
				label: "Instagram",
				value: "IG",
			}
		);

	const row = new ActionRowBuilder().addComponents(platformSelectMenu);
	return row;
}

async function showRegionMenu(customId) {
	const regionSelectMenu = new StringSelectMenuBuilder()
		.setCustomId(customId)
		.setPlaceholder("Select your region")
		.addOptions(
			{
				label: "Brazil",
				value: "BR",
			},
			{
				label: "Mexico",
				value: "MX",
			},
			{
				label: "United States",
				value: "US",
			},
			{
				label: "Canada",
				value: "CN",
			},
			{
				label: "Philippines",
				value: "PH",
			},
			{
				label: "Thailand",
				value: "TH",
			},
			{
				label: "Singapore",
				value: "SG",
			},
			{
				label: "Russia",
				value: "RU",
			},
			{
				label: "India",
				value: "IN",
			},
			{
				label: "Iraq",
				value: "IQ",
			},
			{
				label: "Israel",
				value: "IL",
			},
			{
				label: "Saudi Arabia",
				value: "SA",
			},
			{
				label: "United Arab Emirates",
				value: "AE",
			},
			{
				label: "Turkey",
				value: "TR",
			},
			{
				label: "United Kingdom",
				value: "GB",
			},
			{
				label: "Ukraine",
				value: "UA",
			},
			{
				label: "Dominican Republic",
				value: "DO",
			},
			{
				label: "Other Regions",
				value: "OT",
			}
		);

	const row = new ActionRowBuilder().addComponents(regionSelectMenu);
	return row;
}

async function calculateBP() {
	logger.info("Calculating CLUB Data...");

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

	logger.info("Calculating CLUB Data Completed.");
}

async function download(url, name) {
	await request.head(url, function (err, res, body) {
		request(url).pipe(fs.createWriteStream(name));
	});
}

async function sendResponseToFeishu(interaction) {
	const file = `${interaction.user.id}-bug.jpg`;
	const tenantToken = await feishu.authorize(
		process.env.FEISHU_ID,
		process.env.FEISHU_SECRET
	);
	let response = await feishu.uploadToDrive(
		tenantToken,
		process.env.EA1_BASE,
		file,
		"bitable_image"
	);
	const file_token = JSON.parse(response).data.file_token;

	const substring = interaction.customId.substring(4);
	const bOptions = substring.split("_");

	const bUsername = interaction.fields.getTextInputValue("bugUsername");
	const bPhone = interaction.fields.getTextInputValue("bugPhone");
	const bDetails = interaction.fields.getTextInputValue("bugDetails");
	const bUserId = interaction.user.id;
	const bSession = interaction.fields.getTextInputValue("bugSession");
	const bCategory = bOptions[0];
	const bMode = bOptions[1];

	const bugs = {
		fields: {
			"Discord ID": bUserId,
			"Discord Name": interaction.user.tag,
			Nickname: bUsername,
			"Session ID": bSession,
			"Bug Details": bDetails,
			Channel: "Discord",
			"Phone Model": bPhone,
			"Bug Type": bCategory,
			"Game Mode": bMode,
			Screenshot: [{ file_token: file_token }],
		},
	};

	await feishu.createRecord(
		tenantToken,
		process.env.EA1_BASE,
		process.env.BUGS,
		bugs
	);
	response = await feishu.getFileToken(tenantToken, file);
	const image_key = JSON.parse(response).data.image_key;
	fs.unlinkSync(file);

	let body = {
		msg_type: "interactive",
		card: {
			config: {
				wide_screen_mode: true,
			},
			elements: [
				{
					fields: [
						{
							is_short: true,
							text: {
								content: `**Discord ID**\n${bugs.fields["Discord ID"]}`,
								tag: "lark_md",
							},
						},
						{
							is_short: true,
							text: {
								content: `**Discord Name**\n${interaction.user.tag}`,
								tag: "lark_md",
							},
						},
						// {
						//     is_short: true,
						//     text: {
						//         content: `**Region**\n${bugs.fields["Region"]}`,
						//         tag: "lark_md",
						//     },
						// },
						{
							is_short: false,
							text: {
								content: ``,
								tag: "lark_md",
							},
						},
						{
							is_short: true,
							text: {
								content: `**Nickname**\n${bugs.fields.Nickname}`,
								tag: "lark_md",
							},
						},
						{
							is_short: true,
							text: {
								content: `**Phone**\n${bugs.fields["Phone Model"]}`,
								tag: "lark_md",
							},
						},
						{
							is_short: true,
							text: {
								content: `**Session ID**\n${bugs.fields["Session ID"]}`,
								tag: "lark_md",
							},
						},
						{
							is_short: false,
							text: {
								content: ``,
								tag: "lark_md",
							},
						},
						{
							is_short: true,
							text: {
								content: `**Bug Details**\n${bugs.fields["Bug Details"]}`,
								tag: "lark_md",
							},
						},
					],
					tag: "div",
				},
				{
					tag: "hr",
				},
				{
					alt: {
						content: "",
						tag: "plaint_text",
					},
					img_key: image_key,
					tag: "img",
				},
			],
			header: {
				template: "red",
				title: {
					content: `${bugs.fields["Bug Type"]} - ${bugs.fields["Game Mode"]}`,
					tag: "plain_text",
				},
			},
		},
	};

	await feishu.sendGroupMessage(
		"https://open.larksuite.com/open-apis/bot/v2/hook/bf335c2b-2b3d-46e7-a181-8badecf95c56",
		body
	);
	await interaction.editReply({
		content: "Your submission was received successfully!",
	});
}

async function loadBetaTesterCodes() {
	const tablesToCheck = [
		process.env.BETA_TESTER_ONE,
		process.env.BETA_TESTER_TWO,
		process.env.BETA_TESTER_THREE,
		process.env.BETA_TESTER_FOUR,
		process.env.BETA_TESTER_FIVE,
		process.env.BETA_TESTER_SIX,
		process.env.BETA_TESTER_SEVEN,
		process.env.BETA_TESTER_EIGHT,
		process.env.BETA_TESTER_NINE,
		process.env.BETA_TESTER_TEN,
		process.env.BETA_TESTER_ELEVEN,
		process.env.BETA_TESTER_TWELVE,
		process.env.BETA_TESTER_THIRTEEN,
		process.env.BETA_TESTER_FOURTEEN,
		process.env.BETA_TESTER_FIFTEEN,
		process.env.BETA_TESTER_SIXTEEN,
		process.env.BETA_TESTER_SEVENTEEN,
		process.env.BETA_TESTER_EIGHTEEN,
		process.env.BETA_TESTER_NINETEEN,
		process.env.BETA_TESTER_TWENTY,
		process.env.BETA_TESTER_TWENTYONE,
		process.env.BETA_TESTER_TWENTYTWO,
		process.env.BETA_TESTER_TWENTYTHREE,
		process.env.BETA_TESTER_TWENTYFOUR,
		process.env.BETA_TESTER_TWENTYFIVE,
		process.env.BETA_TESTER_TWENTYSIX,
		process.env.BETA_TESTER_TWENTYSEVEN,
		process.env.BETA_TESTER_TWENTYEIGHT,
		process.env.BETA_TESTER_TWENTYNINE,
		process.env.BETA_TESTER_THIRTY,
	];

	for (const table of tablesToCheck) {
		const tenantToken = await feishu.authorize(
			process.env.FEISHU_ID,
			process.env.FEISHU_SECRET
		);

		let response = JSON.parse(
			await feishu.getRecords(
				tenantToken,
				process.env.CODE_BASE,
				table,
				`NOT(CurrentValue.[Status] = "Binded")`
			)
		);

		if (response.data == undefined) {
			logger.error(table + " " + JSON.stringify(response));
		}

		if (!response.data.items) continue;

		if (response.data.has_more == false) {
			for (const item of response.data.items) {
				let code = item.fields.Codes;
				let recordId = item.record_id;
				let subData = recordId + "," + table;
				betaTesterCodes[code] = subData;
			}
			continue;
		}

		while (response.data.has_more == true) {
			for (const item of response.data.items) {
				let code = item.fields.Codes;
				let recordId = item.record_id;
				let subData = recordId + "," + table;
				betaTesterCodes[code] = subData;
			}

			const pageToken = response.data.page_token;

			// logger.debug(
			// 	`Loading Beta Tester Codes: ${Object.keys(betaTesterCodes).length}`
			// );

			response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CODE_BASE,
					table,
					`NOT(CurrentValue.[Status] = "Binded")`,
					pageToken
				)
			);
		}
	}

	logger.info(`Beta Tester Codes: ${Object.keys(betaTesterCodes).length}`);
	betaTesterCodesLoaded = true;
}

async function shuffleArray(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

async function sendShortsEvent() {
	const enChannel = "951852948038746172";
	const ruChannel = "973279421723209738";
	const ptChannel = "971615587186929685";
	const esChannel = "971614668764377118";

	const enMessage = `**Make-EVO-Shorts Event is Coming! :clapper:**\n\nTake a look at our **Make-EVO-Shorts Event**! If you're good at capturing viewers' attention in a short video, come and prove yourself with your work and win gift cards! @Content Creator @Event News \n\n**WHO CAN PARTICIPATE? **\nEveryone \n\n**WHEN TO START AND END? **\nThe event starts \`from 13 Mar to 26 Ma\`r\nThe Result will be announced on \`28 Mar\`\n\n**HOW TO PARTICIPATE? **\n1. Enter the link, and click the Join Now button below\nhttps://discord.com/channels/951777532003381278/1018235728515321996/1084827706480410624 \n2. Create short videos to post on **Youtube Shorts** or **Tiktok**\n3. Submit content via #submit-content  (a MUST step)\n\n**WHAT CAN YOU GET? **\n\n:gift: **Newbie Award:**(giftcards as rewards)\n- Get 2k+ total views to earn **Beta Lottery Tickets*20! (Lucky draw for Gun Skins)**\n- Get 5k+ total views to earn **$10**\n- Get 20k+ total views to earn **$25**\n- Get 50k+ total views to earn **$50**\n\n:confetti_ball: **Pro Award:**(giftcards as rewards)\n- Rank in top 1-10% of total views to earn **$100**\n- Rank in top 10-20% of total views to earn **$75**\n- Rrank in top 20-30% of total views to earn **$50**\n\nNote: You can upload as many videos as you want. But you cannot receive both the Newbie Award and the Pro Award at the same time. \n\n**GUIDANCE:**\nThere is no limit to the themes/topics you choose to create. Come and pick your preferred direction: Funny moments, Highlight Montage, Gameplay Guide, Game Introduction, Movie, etc. \n\nIf you still don't know how to start, JUST go to our limited time event channel for guidance: \n<#1084823394631024761>: we will send out regular short video creation tips and some creation topics in this channel\n\nHere are the detailed rules of video submission <#1084793563885346836> \n\n<#1086206242642477066>\n<#1086296278582964297> \n<#1086294066599297055>\n\nhttps://i.ibb.co/PttNB85/img-v2-7cc1b2f8-f2c4-4c35-90d3-418e4334026g.jpg`;

	const ruMessage = `**Событие Make-EVO-Shorts приближается! **\n\nЕсли вы можете завоевать внимание зрителей коротким видео, это событие для вас! Покажите себя со своей работой и выиграйте подарочные карты!\n\n**КТО МОЖЕТ ПРИНЯТЬ УЧАСТИЕ?\nВсе\n\n**ВРЕМЯ ПРОВЕДЕНИЯ СОБЫТИЯ**
	Событие пройдет с \`13 по 26 марта\`\nРезультаты будут объявлены \`28 марта\`\n\n**КАК ПРИНЯТЬ УЧАСТИЕ?**\n1. Перейдите по ссылке и нажмите кнопку  "Join Now" ниже\nhttps://discord.com/channels/951777532003381278/1018235728515321996/1084827706480410624\n2. Создайте короткое видео и разместите его на Youtube Shorts или Tiktok.\n3. Отправьте контент через submit-content (обязательное условие).\n\n**ЧТО ВЫ МОЖЕТЕ ПОЛУЧИТЬ?**\n\n:gift: ** Награда для новичков**:\n- Наберите 2к+ просмотров, чтобы **получить лотерейные билеты *20**!\n- Наберите 5k+ просмотров, чтобы **заработать 10$**\n- Наберите 20k+ просмотров, чтобы **заработать 25$**\n- Наберите 50k+ просмотров, чтобы **заработать 50$**\n\n:ember: ** Награда для профессионалов**:\n- Войдите в топ 1-10% от общего числа просмотров, чтобы **заработать 100$**\n- Войти в топ 10-20% от общего числа просмотров, чтобы** заработать 75$**\n- Заняв место в топ-20-30% от общего числа просмотров, вы **заработаете 50$**\n\nПримечание: Вы можете загружать столько видео, сколько хотите. Но вы не сможете одновременно получить награду для новичков и награду для профессионалов.\n\n**РЕКОМЕНДАЦИИ:**\nНет никаких ограничений на темы. Выбирайте направление по своему вкусу: смешные моменты, хайлайты , гайды по игре, введение в игру, фильм и т.д.\n\nЕсли вы все еще не знаете, как начать, просто зайдите на канал <#1084823394631024761>. Там мы будем регулярно выкладывать советы по созданию коротких видео и некоторые возможные темы для создания.\n\nПодробные правила подачи видео <#1086951261988991048>\n\nhttps://i.ibb.co/PttNB85/img-v2-7cc1b2f8-f2c4-4c35-90d3-418e4334026g.jpg`;

	const ptMessage = `**O evento Make-EVO-Shorts está chegando!** :clapper:\n\nDê uma olhada no nosso **Evento Make-EVO-Shorts**!  Se você é bom em capturar a atenção dos espectadores em um vídeo curto, venha provar seu trabalho e ganhe Giftcard!\n\n**QUEM PODE PARTICIPAR?**\nTodos\n\n**QUANDO COMEÇAR E FIM?**\nO evento começa \`de 13 de março a 26 de março\`\nO resultado será divulgado em \`28 de março\`\n\n**COMO PARTICIPAR?**\n1. Entre no link e clique no botão "Join Now" abaixo\nhttps://discord.com/channels/951777532003381278/1018235728515321996/1084827706480410624\n2. Crie vídeos curtos para postar no **Youtube Shorts** ou **Tiktok**\n3. Envie o conteúdo via #submit-content (uma etapa OBRIGATÓRIA)\n\n**O QUE VOCÊ PODE OBTER?**\n\n:gift: **Prêmio Novato**:(giftcard como recompensa)\n- Obtenha mais de 2.000 visualizações no total para ganhar **Bilhetes de Loteria Beta*20! (Sorteio da Sorte para Gun Skins)**\n- Obtenha mais de 5.000 visualizações totais para ganhar **$10**\n- Obtenha mais de 20.000 visualizações totais para ganhar **$25**\n- Obtenha mais de 50.000 visualizações totais para ganhar** $50**\n\n:confetti_ball: **Prêmio Pro**:(giftcard como recompensa)\n- Classifique entre 1-10% do total de visualizações para ganhar **$100**\n- Classifique-se entre os 10-20% melhores do total de visualizações para ganhar **$75**\n- Classifique entre os 20-30% melhores do total de visualizações para ganhar **$50**\n\nObservação: você pode enviar quantos vídeos quiser.  Mas você não pode receber o Prêmio Novato e o Prêmio Pro ao mesmo tempo.\n\n**ORIENTAÇÃO:**\nNão há limite para os temas/tópicos que você escolhe criar.  Venha e escolha sua direção preferida: Momentos engraçados, Montagem de destaques, Guia de jogabilidade, Introdução ao jogo, Filme, etc.\n\nSe você ainda não sabe como começar, APENAS acesse nosso canal de eventos por tempo limitado para obter orientação:\n<#1084823394631024761>: enviaremos dicas regulares de criação de vídeos curtos e alguns tópicos de criação neste canal\n\nAqui estão as regras detalhadas de envio de vídeo <#1086936327800508456>\n\nhttps://i.ibb.co/PttNB85/img-v2-7cc1b2f8-f2c4-4c35-90d3-418e4334026g.jpg`;

	const esMessage = `**Se acerca el evento Make-EVO-Shorts!** :clapper:\n\n¡Echa un vistazo a nuestro Evento Make-EVO-Shorts! Si se te da bien captar la atención de los espectadores en un vídeo corto, ¡ven a demostrarlo con tu trabajo y gana tarjetas regalo!\n\n**¿QUIÉN PUEDE PARTICIPAR? **\nTodo el mundo\n\n**¿CUÁNDO EMPEZAR Y TERMINAR? **\nEl evento comienza del \`13 Mar al 26 Mar\`\nEl resultado se anunciará el \`28 de marzo\`.\n\n**¿CÓMO PARTICIPAR? **\n1.  Introduzca el enlace y luego haga clic en el botón "Join Now" a continuación\nhttps://discord.com/channels/951777532003381278/1018235728515321996/1084827706480410624\n2. Crea vídeos cortos para publicar en **Youtube Shorts **o **Tiktok**\n3. Envía el contenido a través de submit-content (paso IMPRESCINDIBLE)\n\n**¿QUÉ PUEDES CONSEGUIR? **\n\n:gift: **Premio para novatos**:(tarjetas regalo como recompensa).\n- ¡Consigue más de 2k visualizaciones totales para ganar **Billetes de lotería beta*20! **(Sorteo de diseños de armas).\n- Si consigues más de 5k visitas, ganarás **10$**.\n- Si consigues más de 20.000 visitas, ganarás** 25$**.\n- Consigue 50k+ visitas totales para ganar **50$**.\n\n:ember: **Premio profesional:**(tarjetas regalo como recompensa)\n- Clasifícate entre el 1% y el 10% de las visitas totales para ganar** 100$**.\n- Clasifícate entre el 10% y el 20% de las visitas totales para ganar** 75 $**.\n- Clasifícate entre el 20% y el 30% de las visitas totales para ganar **50$**.\n\nNota: Puedes subir tantos vídeos como quieras. Pero no puedes recibir el Premio Novato y el Premio Pro al mismo tiempo.\n\n**GUIDANZA:**\nNo hay límite para los temas que elijas crear. Ven y elige la dirección que prefieras: Momentos divertidos, Montaje de momentos destacados, Guía de juego, Introducción al juego, Película, etc.\n\nSi todavía no sabes cómo empezar, SÓLO tienes que ir a nuestro canal de eventos de tiempo limitado para obtener orientación:\n<#1084823394631024761>: enviaremos regularmente breves consejos para la creación de vídeos y algunos temas de creación en este canal.\n\nEstas son las normas detalladas de presentación de vídeos <#1087018501027405945>\n\nhttps://i.ibb.co/PttNB85/img-v2-7cc1b2f8-f2c4-4c35-90d3-418e4334026g.jpg`;

	const shortsButton = new ButtonBuilder()
		.setCustomId("shortsButton")
		.setLabel("Join Now")
		.setStyle(ButtonStyle.Success)
		.setEmoji("☑️");

	const row = new ActionRowBuilder().addComponents([shortsButton]);

	client.channels.fetch(enChannel).then((channel) =>
		channel.send({
			content: enMessage,
			components: [row],
		})
	);

	client.channels.fetch(ruChannel).then((channel) =>
		channel.send({
			content: ruMessage,
			components: [row],
		})
	);

	client.channels.fetch(ptChannel).then((channel) =>
		channel.send({
			content: ptMessage,
			components: [row],
		})
	);

	client.channels.fetch(esChannel).then((channel) =>
		channel.send({
			content: esMessage,
			components: [row],
		})
	);
}
