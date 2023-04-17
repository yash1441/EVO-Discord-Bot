const {
	SlashCommandBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	AttachmentBuilder,
} = require("discord.js");
require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("buttons")
		.setDescription("Sets up embed and buttons for respective actions.")
		.addSubcommand((subcommand) =>
			subcommand
				.setName("creator-application")
				.setDescription("Setup Creator Application.")
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("Input the channel.")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("check-bp")
				.setDescription("Setup Check BP Application.")
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("Input the channel.")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("beta-access")
				.setDescription("Setup Beta Access Application.")
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("Input the channel.")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("submit-content")
				.setDescription("Setup Submit Content Application.")
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("Input the channel.")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("submit-suggestion")
				.setDescription("Setup Submit Content Application.")
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("Input the channel.")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("club-agreement")
				.setDescription("Setup Club Agreement Application.")
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("Input the channel.")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("bug-report")
				.setDescription("Setup Bug Report.")
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("Input the channel.")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("cheater-report")
				.setDescription("Setup Cheater Report.")
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("Input the channel.")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("pop-info")
				.setDescription("Setup Plan of Publisher Info.")
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("Input the channel.")
						.setRequired(true)
				)
		),

	async execute(interaction, client) {
		await interaction.deferReply();
		if (interaction.user.id != process.env.MY_ID) {
			interaction.deleteReply();
			return;
		}
		const subCommand = interaction.options.getSubcommand();
		const channel = interaction.options.getChannel("channel");

		if (subCommand === "creator-application") {
			const creatorPoster = new EmbedBuilder()
				.setImage("https://i.ibb.co/sJfH3Qj/20221201-114500-1.png")
				.setColor(`C04946`);
			const creatorEmbed = new EmbedBuilder()
				.setTitle("BECOME EVO CREATOR NOW!")
				.setDescription(
					"We have launched **Creator Evolution Project(CEP)** to help potentials create better. Welcome to join us. Let's evolve together!"
				)
				.addFields(
					{
						name: "\u200B",
						value:
							"**We Help All EVO Creators Do Their Best:**\n<:diamond:993888292498055208> Sneak Peeks into the latest version\n<:diamond:993888292498055208> Provide beta codes for you & your fans\n<:diamond:993888292498055208> Chances to win mobile phones or more devices\n<:diamond:993888292498055208> Chances to become sponsored channels and more!",
						inline: false,
					},
					{
						name: "\u200B",
						value:
							"**Requirements:**\n<:ember:993888291218784286> Shooter, Survival or Sandbox Games Content Creators\n<:ember:993888291218784286> At least 1 content update per month\n<:ember:993888291218784286> Creators who have made EVO content are preferred\n<:ember:993888291218784286> 1000+ subscribers on Youtube (Shorts included), TikTok, TapTap, Twitch, Twitter, Instagram",
						inline: false,
					},
					{
						name: "\u200B",
						value:
							"**Notes:**\n<:ember:993888291218784286> Feel free to use some high quality art materials from <#1076037107300184125>\n<:ember:993888291218784286> Encountered troubles during application? Please contact <@132784173311197184> or <@1017641241623679076> for help\n<:ember:993888291218784286> Reach out to <@1017641241623679076> if you want to discuss collaboration opportunities\n<:ember:993888291218784286> Don't meet the requirement? No worries. Take your first step by joining content creation events here <#1018235728515321996>. We help winners to grow faster!",
					}
				)
				.setColor(`C04946`);

			const creatorButton = new ButtonBuilder()
				.setCustomId("creatorApply")
				.setLabel("Apply Now")
				.setStyle(ButtonStyle.Success)
				.setEmoji("📺");

			const row = new ActionRowBuilder().addComponents([creatorButton]);

			client.channels.fetch(channel.id).then((channel) =>
				channel.send({
					embeds: [creatorPoster, creatorEmbed],
					components: [row],
				})
			);
		} else if (subCommand === "check-bp") {
			const bpButton = new ButtonBuilder()
				.setCustomId("bpButton")
				.setLabel("ENQUIRE")
				.setStyle(ButtonStyle.Success)
				.setEmoji("❔");

			const bpEmbed = new EmbedBuilder()
				.setTitle(`CHECK YOUR STATUS`)
				.setDescription(
					`The following data can be checked:\n1. Benefit level\n2. Total Views of video you submit\n3. Total number of videos you submit\n4. How many videos submitted are not valid\n5. The amount of BP\n\n*The views of your video will be recorded only once. Every Monday we check all the new videos submitted last week and record their views.*`
				)
				.setColor(`C04946`);

			const bpRow = new ActionRowBuilder().addComponents([bpButton]);

			client.channels
				.fetch(channel.id)
				.then((channel) =>
					channel.send({ embeds: [bpEmbed], components: [bpRow] })
				);
		} else if (subCommand === "beta-access") {
			const submitButton = new ButtonBuilder()
				.setCustomId("betaAccess")
				.setLabel("Unlock Beta Tester Channel")
				.setStyle(ButtonStyle.Success)
				.setEmoji("📱");

			const submitEmbed = new EmbedBuilder()
				.setTitle(`Enter your beta code to unlock beta and LFG channels`)
				.setDescription(
					`Please enter the beta activation code to unlock <#1018243733373866004> channels and get <@&${process.env.BETA_ROLE}> role.`
				)
				.setColor(`C04946`);

			const submitRow = new ActionRowBuilder().addComponents([submitButton]);

			client.channels
				.fetch(channel.id)
				.then((channel) =>
					channel.send({ embeds: [submitEmbed], components: [submitRow] })
				);
		} else if (subCommand === "submit-content") {
			const submitButton = new ButtonBuilder()
				.setCustomId("submitContent")
				.setLabel("Submit Content")
				.setStyle(ButtonStyle.Success)
				.setEmoji("📺");

			const submitEmbed = new EmbedBuilder()
				.setTitle("SUBMIT CONTENT")
				.setDescription(
					`If you wanna join content creation events, let the dev team see your work or win BP as a Creator Evolution Club member, please submit content here.\n\nCheck <#1018235728515321996> often to get updates for content creation events\nCheck <#1018239078094880908> to learn about benefits for EVO Creators\nCheck <#1076037107300184125> if you need some high quality materials`
				)
				.setColor(`C04946`)
				.setImage(
					"https://media.discordapp.net/attachments/360776228199727105/1029388662376497182/CREATOR_EVOLUTION_PROJECT.jpg?width=1080&height=319"
				);

			const submitRow = new ActionRowBuilder().addComponents([submitButton]);

			client.channels
				.fetch(channel.id)
				.then((channel) =>
					channel.send({ embeds: [submitEmbed], components: [submitRow] })
				);
		} else if (subCommand === "submit-suggestion") {
			const submitButton = new ButtonBuilder()
				.setCustomId("suggestionSubmit")
				.setLabel("Submit Suggestion")
				.setStyle(ButtonStyle.Success)
				.setEmoji("📝");

			const submitEmbed = new EmbedBuilder()
				.setTitle(`FEEDBACK HELP US IMPROVE THE GAME!`)
				.setDescription(
					`This is the channel where you submit the suggestions!\nOnce approved, suggestions will be shared in <#973699891186532433> for public voting!`
				)
				.setColor(`C04946`);

			const submitRow = new ActionRowBuilder().addComponents([submitButton]);

			client.channels
				.fetch(channel.id)
				.then((channel) =>
					channel.send({ embeds: [submitEmbed], components: [submitRow] })
				);
		} else if (subCommand === "club-agreement") {
			const clubButton = new ButtonBuilder()
				.setCustomId("clubButton")
				.setLabel("I Agree")
				.setStyle(ButtonStyle.Success)
				.setEmoji("✅");

			const clubRow = new ActionRowBuilder().addComponents([clubButton]);

			client.channels
				.fetch(channel.id)
				.then((channel) => channel.send({ components: [clubRow] }));
		} else if (subCommand === "bug-report") {
			const bugEmbed = new EmbedBuilder()
				.setTitle("YOU REPORT IT AND WE FIX IT")
				.setDescription(
					`**Click the button below** to start the report procedure, which takes you __less than 2 minutes__.\n\n**Please follow the bot instruction and submit the required bug info:**\n1. Select a bug category.\n2. Select a game mode where a bug occurs.\n3. Describe the bug.\n 4. Upload a screenshot that shows the bug (has to be done within 60 seconds)\n\n*Please give us as much bug detail as you can. It is very important for us to locate the issue and get it fixed as soon as possible.*\n*In the end, thanks for helping us improve the game. Your effort really matters!*`
				)
				.setColor(`C04946`);

			const bugButton = new ButtonBuilder()
				.setCustomId("bugButton")
				.setLabel("Report a Bug")
				.setStyle(ButtonStyle.Success)
				.setEmoji("🐛");

			const row = new ActionRowBuilder().addComponents([bugButton]);

			client.channels.fetch(channel.id).then((channel) =>
				channel.send({
					embeds: [bugEmbed],
					components: [row],
				})
			);
		} else if (subCommand === "cheater-report") {
			const cheaterEmbed = new EmbedBuilder()
				.setTitle("Report Violation")
				.setDescription(
					`**Click the button below** to start the report procedure, which takes you __less than 2 minutes__.\n\n**Please follow the bot instruction and submit the required info:**\n1. Select a violation category.\n2. Fill the form.\n3. Upload a screenshot that shows the violation. Make sure it contains the USER ID of the person you are reporting. (this step has to be done in 60 seconds)\n\n*In the end, thanks for helping us improve the game. Your effort really matters!*`
				)
				.setColor(`C04946`);

			const cheaterButton = new ButtonBuilder()
				.setCustomId("cheaterButton")
				.setLabel("Report Violation")
				.setStyle(ButtonStyle.Danger)
				.setEmoji("🥷🏻");

			const appealButton = new ButtonBuilder()
				.setCustomId("appealButton")
				.setLabel("Appeal Ban")
				.setStyle(ButtonStyle.Primary)
				.setEmoji("📃");

			const row = new ActionRowBuilder().addComponents([
				cheaterButton,
				appealButton,
			]);

			client.channels.fetch(channel.id).then((channel) =>
				channel.send({
					embeds: [cheaterEmbed],
					components: [row],
				})
			);
		} else if (subCommand === "pop-info") {
			const popEmbed = new EmbedBuilder()
				.setTitle(
					"Join Plan of Publisher and Win Really Cash! <:tiktok:1072002336836292708>"
				)
				.setDescription(
					`Introducing the Plan of Publisher for TikTok! Everyone can join and win up to **$1500 REAL CASH** 🪙, just by publishing short videos to recommend PROJECT EVO. Join now! <@&1074185209643278448> <@&${process.env.CC_ROLE}>\n\n**How to Participate?**\nClick the button below - Find the campaign of PROJECT EVO - Read the Introduction - Post your video and get rewards!\n\n**How to Make Your Video Go Viral?**\nWe have prepared the [short-video guide](https://docs.google.com/document/d/1Hkr6qe43FBDL35JaPk_30rUs-oVFp3NUIfCfkFYCTdk/edit?usp=sharing) and [media kit](https://drive.google.com/drive/folders/1PrxNCAuDAVuMlAHwegaLDKc24rRAjc3v?usp=share_link) for you, check it out!`
				)
				.setImage(
					"https://i.ibb.co/L9Bjs7y/img-v2-94b274e0-9ad4-449c-864d-9821bcf4f34g.jpg"
				)
				.setColor(`C04946`);

			const joinButton = new ButtonBuilder()
				.setLabel("Join Now")
				.setStyle(ButtonStyle.Link)
				.setURL(
					"https://api.tiktokv.com/game_center/pop/deeplink?target=home-pop"
				);

			const row = new ActionRowBuilder().addComponents([joinButton]);

			client.channels.fetch(channel.id).then((channel) =>
				channel.send({
					embeds: [popEmbed],
					components: [row],
				})
			);
		}
		await interaction.deleteReply();
	},
};
