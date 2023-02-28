const {
	SlashCommandBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
} = require("discord.js");
require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("buttons")
		.setDescription("Sets up embed and buttons for respective actions.")
		.addSubcommand((subcommand) =>
			subcommand
				.setName("cec-application")
				.setDescription("Setup CEC Application.")
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("Input the channel.")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("apply-for-codes")
				.setDescription("Setup Apply-for-Codes application.")
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("Input the channel.")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("unlock-lfg")
				.setDescription("Setup Unlock LFG application.")
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("Input the channel.")
						.setRequired(true)
				)
		)
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
				.setName("claim-link")
				.setDescription("Setup Claim Link Application.")
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("Input the channel.")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("seven-day")
				.setDescription("Setup 7 Day Challenge Application.")
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("Input the channel.")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("seven-day-2")
				.setDescription("Setup 7 Day Challenge-2 Application.")
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("Input the channel.")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("ecc-application")
				.setDescription("Setup ECC Application.")
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

		if (subCommand === "cec-application") {
			let cecPoster = new EmbedBuilder()
				.setImage("https://i.ibb.co/mJsVYpy/20221201-112525.jpg")
				.setColor(`C04946`);
			let cecEmbed = new EmbedBuilder()
				.setTitle("**CREATOR EVOLUTION CLUB IS LAUNCHED!**")
				.setDescription(
					"**APPLY FOR CLUB MEMBERSHIP NOW!**\n\n**Creator Evolution Club creates an aspirational influencer community for EVO creators who have great potential and passion.**\n\nThe club is found to provide the best support to help you grow as an outstanding EVO content creator.\n\nIt is also the best place for social networking. Meet creators that are just as outstanding as you! Meet new friends who would love to support each other!"
				)
				.addFields(
					{
						name: "\u200B",
						value:
							"Now you might wonder what we have prepared for you guys. Well, audience growth for sure, and **benefits include but are not limited to**:\n<:diamond:993888292498055208> Apply up to __**200 codes**__ for your fans\n<:diamond:993888292498055208> Get access to creator foundation, which provides the opportunity to win __**$800 prize phones**__, to share a __**$2000 budget**__ to boost videos and more.\n<:diamond:993888292498055208> Ask for official support, including Youtube channel overall review & suggestion, content instruction, etc.\nGet prioritized access to EVO Creator Partnership *(coming soon)*\n<:diamond:993888292498055208> Apply for content materials (custom media kit)",
						inline: false,
					},
					{
						name: "\u200B",
						value:
							"**HOW TO APPLY:**\n**Basic Requirement**\n<:ember:993888291218784286> __Minimum 1000 subscribers__ on Youtube or TapTap.\n<:ember:993888291218784286> __At least 3 Project EVO videos__ submitted via <#1020247219028361256>\n<:ember:993888291218784286> __At least 10,000 total views__ for Project EVO videos in history\n<:ember:993888291218784286> Very few exceptions can be made to potential EVO creators beginners",
						inline: false,
					},
					{
						name: "Important: The qualification is not guaranteed to every applicant!",
						value:
							"We will review the overall situation of your Youtube channel, including the channel positioning, activity, content quality (especially for Project EVO videos), video reactions, etc.\n\nIf you have more questions, please check <#1047744860037324851>",
					}
				)
				.setColor(`C04946`)
				.setImage("https://i.ibb.co/ysgy4G3/20221201-112516.jpg");

			let cecButton = new ButtonBuilder()
				.setCustomId("cecButton")
				.setLabel("APPLY")
				.setStyle(ButtonStyle.Success)
				.setEmoji("🗝️");

			const row = new ActionRowBuilder().addComponents([cecButton]);

			client.channels
				.fetch(channel.id)
				.then((channel) =>
					channel.send({ embeds: [cecPoster, cecEmbed], components: [row] })
				);
		} else if (subCommand === "apply-for-codes") {
			let afcEmbed = new EmbedBuilder()
				.setTitle("APPLY FOR CODES")
				.setDescription(
					"- Grab some codes to share with your fans! Make them hooray!\n- The amount of codes you can get depends on your Benefit Level\n- Codes will be delivered within 48 hours, via EVO Bot DM."
				)
				.setColor(`C04946`);

			let afcButton = new ButtonBuilder()
				.setCustomId("afcButton")
				.setLabel("APPLY")
				.setStyle(ButtonStyle.Success)
				.setEmoji("🗝️");

			const row = new ActionRowBuilder().addComponents([afcButton]);

			client.channels
				.fetch(channel.id)
				.then((channel) =>
					channel.send({ embeds: [afcEmbed], components: [row] })
				);
		} else if (subCommand === "unlock-lfg") {
			let lfgEmbed = new EmbedBuilder()
				.setTitle("Unlock LFG")
				.setDescription(
					"Choose the region you are in and unlock Looking For Group(LFG) channel accordingly."
				)
				.setColor(`C04946`);

			let lfgNAButton = new ButtonBuilder()
				.setCustomId("lfgNAButton")
				.setLabel("NA/SA")
				.setStyle(ButtonStyle.Success)
				.setEmoji("🌎");

			let lfgSEAButton = new ButtonBuilder()
				.setCustomId("lfgSEAButton")
				.setLabel("SEA")
				.setStyle(ButtonStyle.Success)
				.setEmoji("🌏");

			let lfgEUButton = new ButtonBuilder()
				.setCustomId("lfgEUButton")
				.setLabel("EU")
				.setStyle(ButtonStyle.Success)
				.setEmoji("🌍");

			const row = new ActionRowBuilder().addComponents([
				lfgNAButton,
				lfgSEAButton,
				lfgEUButton,
			]);

			client.channels
				.fetch(channel.id)
				.then((channel) =>
					channel.send({ embeds: [lfgEmbed], components: [row] })
				);
		} else if (subCommand === "creator-application") {
			let creatorPoster = new EmbedBuilder()
				.setImage("https://i.ibb.co/sJfH3Qj/20221201-114500-1.png")
				.setColor(`C04946`);
			let creatorEmbed = new EmbedBuilder()
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
					`Please enter the beta activation code to unlock <#1018243733373866004> channels and get <@&1032238398829768735> role.`
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
		} else if (subCommand === "claim-link") {
			const linkButton = new ButtonBuilder()
				.setCustomId("linkButton")
				.setLabel("Claim")
				.setStyle(ButtonStyle.Success)
				.setEmoji("📎");

			const linkEmbed = new EmbedBuilder()
				.setTitle(`CLAIM YOUR LINK`)
				.setDescription(
					`Many audiences will be asking for ways to sign-up-for-beta, to download the game.\nThat's why we need you to attach the website link in the video description.\n\nEveryone will have an unique link but all links will direct users to official website.\nIt is used to track data. Please only use your link and do not copy others!`
				)
				.setColor(`C04946`);

			const linkRow = new ActionRowBuilder().addComponents([linkButton]);

			client.channels
				.fetch(channel.id)
				.then((channel) =>
					channel.send({ embeds: [linkEmbed], components: [linkRow] })
				);
		} else if (subCommand === "seven-day") {
			const sdButton = new ButtonBuilder()
				.setCustomId("sdButton")
				.setLabel("Sign Up")
				.setStyle(ButtonStyle.Success)
				.setEmoji("📝");

			const sdEmbed = new EmbedBuilder()
				.setTitle(`7 DAY SURVIVAL CHALLENGE`)
				.setDescription(`**SIGN UP NOW!**`)
				.setImage(
					"https://i.ibb.co/mJgG68c/img-v2-61e4a6a3-ce7f-47fe-b9b2-8084e9c2f7ag.jpg"
				)
				.addFields(
					{
						name: "Brief Intro",
						value:
							"**2000** Gold will be split among **10** Youtubers (200 Gold each). You will try to survive **7** days without dying. If you succeed, the amount of Gold you own will be doubled. Every time you dies, you drop **50** Gold.\n\nPlayers will hunt you. Do everything you can to keep alive! __Each time you die, you lose 50 Gold__.\nSounds impossible? Call your fan for help! Build an army for defense!\nStrong enough? Try the following missions to earn more Gold!",
					},
					{
						name: "\u200B",
						value:
							"Mission 1: Kill Kane.\n<:ember:993888291218784286> Kill **Kane** to earn an extra **50** Gold.\n<:ember:993888291218784286> Use **the shortest time** to kill? Get **100** Gold instead!",
					},
					{
						name: "\u200B",
						value:
							"Mission 2: Raid for embers.\n<:ember:993888291218784286> Among **10** youtubers, whoever gets **the most embers** earns an extra **100** Gold.\n<:ember:993888291218784286> Whoever gets **the most embers in a single raid** earns an extra **50** Gold.",
					},
					{
						name: "\u200B",
						value:
							"Mission 3: Kill The Rest.\n<:ember:993888291218784286> Whenever you meet other Youtuber participants, kill them and you get **100** Gold.",
					},
					{
						name: "\u200B",
						value:
							"**PERKS FOR PARTICIPANTS:**\n<:diamond:993888292498055208> Redeem gift card using Gold! (1 Gold = $1)\n<:diamond:993888292498055208> Get a personal poster made by the official team!\n<:diamond:993888292498055208> Get a video decoration frame made by the official team!\n<:diamond:993888292498055208> During the challenge, get 10 - 20 codes each day for giveaways!",
					},
					{
						name: "\u200B",
						value:
							"**WHEN IT STARTS?**\nFrom 17 Dec 00:00 to 23 Dec 23:59 (UTC+8)\nYoutubers have to open a new session from 17 Dec 00:00 to 18:00 (UTC+8)",
					},
					{
						name: "\u200B",
						value:
							"**SIGN UP REQUIREMENT:**\n1. Have > 1000 subscribers, average video views > 1000.\n2. For Youtuber participants, you have to make **at least 4 videos relevant to the challenge**. Or, **stream at least 90 minutes every day during the challenge** (highly recommended).  (If you meet the requirement, 100 Gold will not be lost no matter how many times you die)",
					},
					{
						name: "\u200B",
						value:
							"**READ RULES CAREFULLY BEFORE THE CHALLENGE STARTS:**\n<#1052206159802683402>",
					}
				)
				.setColor(`C04946`);

			const sdRow = new ActionRowBuilder().addComponents([sdButton]);

			client.channels
				.fetch(channel.id)
				.then((channel) =>
					channel.send({ embeds: [sdEmbed], components: [sdRow] })
				);
		} else if (subCommand === "seven-day-2") {
			const sdButton2 = new ButtonBuilder()
				.setCustomId("sdButton2")
				.setLabel("Submit Info")
				.setStyle(ButtonStyle.Success)
				.setEmoji("📇");

			const sdEmbed2 = new EmbedBuilder()
				.setTitle(`7 DAY SURVIVAL CHALLENGE`)
				.setDescription(
					`**Please enter the relevant info about the challenge**\nYou need to fill in the region, role name, role id, session id carefully and accurately.\nPlease do not fill in the form before 18:00 17 Dec (UTC+8)`
				)
				.setColor(`C04946`);

			const sdRow2 = new ActionRowBuilder().addComponents([sdButton2]);

			client.channels
				.fetch(channel.id)
				.then((channel) =>
					channel.send({ embeds: [sdEmbed2], components: [sdRow2] })
				);
		} else if (subCommand === "ecc-application") {
			const eccEmbed = new EmbedBuilder()
				.setTitle("EVO Creator Competition Starts Now!")
				.setDescription(
					`:loudspeaker: Attention, all EVO creators (and players who want to be creators)! @everyone :video_game:\nAre you ready to showcase your skills and become an outstanding EVO content creator? The EVO Creator Competition is your chance to shine, with a $2000 prize pool up for grabs!\n\n**WHO CAN PARTICIPATE?** :man_tone1:\nEveryone from any region and language is welcome to join!\n\n**WHEN TO START AND END?** :alarm_clock:\nThe competition starts \`from 28 Feb to 8 Mar.\`\nThe Result will be announced on \`10 Mar\`\n\n**HOW TO PARTICIPATE?** :yum:\n1. Click **Join Now** below -> 2. Choose from 3 content directions -> 3. make Youtube videos about the direction you choose -> 4. submit content via #submit-content and choose the relevant direction (a MUST step).\n\n:red1: Gameplay Guides (including Building, Crafting, Collecting, Raiding, Beginner Tutorial)\n:red2: Storytelling (Movie)\n:red3: Entertaining Montages (Funny & highlight moments)\n\n**RULES :question:**\n:red1: The video must be posted on YouTube and includes the *#projectevo* hashtag.\n:red2: The video must be at least 5 minutes long and contain 50% EVO gameplay (which must be your original work)\n:red3: The video must be made and published after 27 Feb.\n\n**WHAT ARE THE REWARDS? $2000 Gift Card Pool!** :gift:\nThe top 3 creators in each content direction will win:\n\n:red1: 1st Place -** $300 + 100 beta codes**\n:red2: 2nd Place - **$200 + 50 beta codes**\n:red3: 3rd Place - **$100 + 25 beta codes**\n\nAs an added bonus, all winners will receive the opportunity to become Sponsored Channel and to have their content promoted by the official EVO channels!:trophy:\n\n**HOW ARE THE WINNERS CHOSEN?**\nThe top 3 scores in each direction will win.\nFinal Score = 30% * video views + 40% * 1000 * official judge's score(out of 10) + 30% * 1000 * player's judge score(out of 10)\n\nLearn more about how judges evaluate the videos #"Criteria" \nAnd more details will be shared on the Next Tuesday.\n\n**:smiley_cat:NEED SOME GUIDANCE?**\nNot sure how to create  high-quality content?  Don't worry, we've got you covered! For this event, we will be creating two exclusive channels on Discord:\n#"Official Youtube Video Making Guide" : learn important video-making skills to help better create!\n#ecc-chat: Players at the event can ask the dev team any questions and receive personalized guidance.\n\n**:smile:JOIN THE PLAYER JUDGING PANEL:**\nWe need 20 players to join the player judging panel! Click the "Join Player Judge" button to apply!`
				)
				.setColor(`C04946`)
				.setImage("https://i.ibb.co/McwqP7g/20230228-185013.jpg");

			const eccJoinButton = new ButtonBuilder()
				.setCustomId("eccJoin")
				.setLabel("Join Now")
				.setStyle(ButtonStyle.Success)
				.setEmoji("📃");

			const eccApplyButton = new ButtonBuilder()
				.setCustomId("eccApply")
				.setLabel("Apply for Players Judge")
				.setStyle(ButtonStyle.Success)
				.setEmoji("🧑🏻‍⚖️");

			const row = new ActionRowBuilder().addComponents([
				eccJoinButton,
				eccApplyButton,
			]);

			client.channels.fetch(channel.id).then((channel) =>
				channel.send({
					embeds: [eccEmbed],
					components: [row],
				})
			);
		}
		await interaction.deleteReply();
	},
};
