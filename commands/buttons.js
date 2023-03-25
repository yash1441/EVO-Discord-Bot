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
				.setName("tiktok-event")
				.setDescription("Setup TikTok Event announcement.")
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("Input the channel.")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("tiktok-announcement")
				.setDescription("Setup TikTok Event announcement.")
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("Input the channel.")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("shorts-announcement")
				.setDescription("Setup TikTok Event announcement.")
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("Input the channel.")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("100k-announcement")
				.setDescription("Setup 100k Event announcement.")
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("Input the channel.")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("ambassador-info")
				.setDescription("Setup Ambassador Event Info announcement.")
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("Input the channel.")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("ambassador-signup")
				.setDescription("Setup Ambassador Event Signup announcement.")
				.addChannelOption((option) =>
					option
						.setName("channel")
						.setDescription("Input the channel.")
						.setRequired(true)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName("ambassador-info-text")
				.setDescription("Setup Ambassador Event Signup announcement in text.")
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
		} else if (subCommand === "ecc-application") {
			const eccEmbed = new EmbedBuilder()
				.setTitle("EVO Creator Competition Starts Now!")
				.setDescription(
					`:loudspeaker: Attention, all EVO creators (and players who want to be creators)! :video_game:\nAre you ready to showcase your skills and become an outstanding EVO content creator? The EVO Creator Competition is your chance to shine, with a $2000 prize pool up for grabs!\n\n**WHO CAN PARTICIPATE?** :man_tone1:\nEveryone from any region and language is welcome to join!\n\n**WHEN TO START AND END?** :alarm_clock:\nThe competition starts \`from 28 Feb to 8 Mar\`.\nThe Result will be announced on \`10 Mar\`\n\n**HOW TO PARTICIPATE?** :yum:\n1. Click **Join Now** below -> 2. Choose from 3 content directions -> 3. make Youtube videos about the direction you choose -> 4. submit content via <#${process.env.SUBMIT_CONTENT_CHANNEL}> and choose the relevant direction (a MUST step).\n\n<:red1:1019550510476431420> Gameplay Guides (including Building, Crafting, Collecting, Raiding, Beginner Tutorial)\n<:red2:1019550532450394164> Storytelling (Movie)\n<:red3:1019550563924463626> Entertaining Montages (Funny & highlight moments)\n\n**RULES :question:**\n<:red1:1019550510476431420> The video must be posted on YouTube and includes the *#projectevo* hashtag.\n<:red2:1019550532450394164> The video must be at least 5 minutes long and contain 50% EVO gameplay (which must be your original work)\n<:red3:1019550563924463626> The video must be made and published after 27 Feb.\n\n**WHAT ARE THE REWARDS? $2000 Gift Card Pool!** :gift:\nThe top 3 creators in each content direction will win:\n\n<:red1:1019550510476431420> 1st Place -** $300 + 100 beta codes**\n<:red2:1019550532450394164> 2nd Place - **$200 + 50 beta codes**\n<:red3:1019550563924463626> 3rd Place - **$100 + 25 beta codes**\n\nAs an added bonus, all winners will receive the opportunity to become Sponsored Channel and to have their content promoted by the official EVO channels!:trophy:\n\n**HOW ARE THE WINNERS CHOSEN?**\nThe top 3 scores in each direction will win.\nFinal Score = 30% x video views + 40% x 1000 x official judge's score(out of 10) + 30% x 1000 x player's judge score(out of 10)\n\nLearn more about how judges evaluate the videos <#1078619571075952670> \nAnd more details will be shared on the Next Tuesday.\n\n**:smiley_cat:NEED SOME GUIDANCE?**\nNot sure how to create  high-quality content?  Don't worry, we've got you covered! For this event, we will be creating two exclusive channels on Discord:\n<#${process.env.VIDEO_GUIDE_CHANNEL}> : learn important video-making skills to help better create!\n<#${process.env.ECC_CHANNEL}>: Players at the event can ask the dev team any questions and receive personalized guidance.\n\n**:smile:JOIN THE PLAYER JUDGING PANEL:**\nWe need 20 players to join the player judging panel! Click the **Apply for Players Judge** button to apply!`
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
		} else if (subCommand === "tiktok-event") {
			const tiktokEmbed = new EmbedBuilder()
				.setTitle("TikTok Creator Event")
				.setDescription(
					`Hi, <@&${process.env.TTC_ROLE}>! Are you going to join the **TikTok Creator Event**?\nWe prepared codes for participants to help them try the game and create better EVO content.\n\nClick **Apply** to apply for a beta code.\n\nIf you don't know what the event is about, learn more about the details [here](https://api.tiktokv.com/game_center/pop/deeplink?target=home-pop)\nYou can also join the event by checking the announcement [here](https://ptb.discord.com/channels/951777532003381278/1018235728515321996/1083714282702766090)`
				)
				.setImage(
					"https://i.ibb.co/mRy5jhL/img-v2-03850b6f-8237-4c92-b71c-cd6e6652395g.jpg"
				)
				.setColor(`C04946`);

			const tiktokButton = new ButtonBuilder()
				.setCustomId("tiktokButton")
				.setLabel("Apply")
				.setStyle(ButtonStyle.Success)
				.setEmoji("🎱");

			const row = new ActionRowBuilder().addComponents([tiktokButton]);

			client.channels.fetch(channel.id).then((channel) =>
				channel.send({
					content: `<@&${process.env.TTC_ROLE}>`,
					embeds: [tiktokEmbed],
					components: [row],
				})
			);
		} else if (subCommand === "tiktok-announcement") {
			const message = `<@&1074185209643278448>\n**Join TikTok Short Video Creator Event and Win up to 1500$**\n\nHi Survivors, We held a short video creator event on TikTok. Up to 1500$ are waiting for you who love Project EVO and has the ability of video creativity.\n\nDon't hesitate to click the link below and earn your rewards!\n\n**Event Link** https://api.tiktokv.com/game_center/pop/deeplink?target=home-pop\n\n*Players from the Philippines and Brazil can participate in this event. We will hold short video events for players in more regions in the future, If you are interested, you can follow our TikTok official account below:*\n**TikTok** https://www.tiktok.com/@projectevo_official`;

			const tiktokButton = new ButtonBuilder()
				.setCustomId("ttcButton")
				.setLabel("Join Now")
				.setStyle(ButtonStyle.Success)
				.setEmoji("☑️");

			const row = new ActionRowBuilder().addComponents([tiktokButton]);

			client.channels.fetch(channel.id).then((channel) =>
				channel.send({
					content: message,
					components: [row],
				})
			);
		} else if (subCommand === "shorts-announcement") {
			const shortsEmbed = new EmbedBuilder()
				.setTitle(`Make-EVO-Shorts Event is Coming! 🎬`)
				.setDescription(
					`Take a look at our **Make-EVO-Shorts Event**! If you're good at capturing viewers' attention in a short video, come and prove yourself with your work and win gift cards!\n\n**WHO CAN PARTICIPATE?**\nEveryone\n\n**WHEN TO START AND END?**\nThe event starts \`from 13 Mar to 26 Mar\`\nThe Result will be announced on \`28 Mar\`\n\n**HOW TO PARTICIPATE?**\n1. Click **Join Now** below\n2. Create short videos to post on **Youtube Shorts** or **Tiktok**\n3. Submit content via #submit-content (a MUST step)\n\n**WHAT CAN YOU GET?**\n\n🎁 **Newbie Award:**(giftcards as rewards)\n- Get 2k+ total views to earn **Beta Lottery Tickets\*20! (Lucky draw for Gun Skins)**\n- Get 5k+ total views to earn **$10**\n- Get 20k+ total views to earn **$25**\n- Get 50k+ total views to earn **$50**\n\n🎊 **Pro Award:**(giftcards as rewards)\n- Rank in top 1-10% of total views to earn **$100**\n- Rank in top 10-20% of total views to earn **$75**\n- Rrank in top 20-30% of total views to earn **$50**\n\nNote: You can upload as many videos as you want. But you cannot receive both the Newbie Award and the Pro Award at the same time.\n\n**GUIDANCE:**\nThere is no limit to the themes/topics you choose to create. Come and pick your preferred direction: Funny moments, Highlight Montage, Gameplay Guide, Game Introduction, Movie, etc.\n\nIf you still don't know how to start, JUST go to our limited time event channel for guidance:\n<#1084823394631024761>: we will send out regular short video creation tips and some creation topics in this channel\n\n	Here are the detailed rules of video submission <#1084793563885346836>`
				)
				.setImage(
					`https://i.ibb.co/PttNB85/img-v2-7cc1b2f8-f2c4-4c35-90d3-418e4334026g.jpg`
				)
				.setColor(`C04946`);

			const shortsButton = new ButtonBuilder()
				.setCustomId("shortsButton")
				.setLabel("Join Now")
				.setStyle(ButtonStyle.Success)
				.setEmoji("☑️");

			const row = new ActionRowBuilder().addComponents([shortsButton]);

			client.channels.fetch(channel.id).then((channel) =>
				channel.send({
					content: "<@&1074185209643278448>",
					embeds: [shortsEmbed],
					components: [row],
				})
			);
		} else if (subCommand === "100k-announcement") {
			const quizEmbed = new EmbedBuilder()
				.setTitle(`100K`)
				.setDescription(
					`Cheers to 100k! We are so excited to see the community, as well as the support for the Project, continue to grow. We are still working hard on delivering the best Survival Mobile game we can, and have prepared some trivia to test how much people have picked up about EVO. Complete the quiz successfully, and you can show off your knowledge with the **LIMITED EDITION** 100k Celebration Badge. You can only earn this badge in the next week, so get it quick!\n\nTo play, click the button below. You will have 3 questions given to you. Get them all correct, and you win!\n\nWinners will receive the <@&1085629746186031225> role/badge and be entered into a Discord Nitro giveaway. We will select __20 winners__ to receive **1 Month of Nitro** at random, and will announce the winners on 3/25.\n\nThanks for being such a dedicated community, we are glad to have you!`
				)
				.setColor(`C04946`);

			const startQuizButton = new ButtonBuilder()
				.setCustomId("startQuiz")
				.setLabel("Start Quiz")
				.setStyle(ButtonStyle.Success)
				.setEmoji("❓");

			const row = new ActionRowBuilder().addComponents([startQuizButton]);

			client.channels.fetch(channel.id).then((channel) =>
				channel.send({
					content: "<@&1074185209643278448>",
					embeds: [quizEmbed],
					components: [row],
				})
			);
		} else if (subCommand === "ambassador-info") {
			const ambassadorEmbed = new EmbedBuilder()
				.setTitle(`EVO Ambassador Event`)
				.setDescription(
					`**Recommend EVO and Share the $5000 Prize Pool** :loudspeaker:\n\nDo you like Project EVO? How about recommending the game to your fans & friends & family? To appreciate your support, we are offering a **$5000 prize pool** for players who make **game recommendation videos** for the game! Let's enlarge the community together. Join events now!\n\nMultiple videos can be submitted, each of which can be used to claim rewards:\n>= 1000 views, **30  lottery tickets** <:beta_lottery_ticket:1088358927672033360>\n>= 3000 views, **$20**\n>= 5,000 views, **$50**\n>= 10,000 views, **$150**\n\nIn addition, we have upgraded rewards for the most popular works: :tada:\nTotal views reach 300k, get an extra **$300**\nTotal views reach 200k, get an extra **$200**\nTotal views reach 100k, get an extra **$100**\n\n<#1088675985907519538>\n<#1088676463257079910>\n<#1088676929999229060>\n<#1088677798769594428>\n\nClick "**Learn More**" below to check details and sign up for the event!`
				)
				.setImage("https://i.ibb.co/SxKqj0g/signup-en.jpg")
				.setColor(`C04946`);

			const LearnMoreButton = new ButtonBuilder()
				.setLabel("Learn More")
				.setStyle(ButtonStyle.Link)
				.setURL(
					"https://discord.com/channels/951777532003381278/1088791299622174801"
				);

			const row = new ActionRowBuilder().addComponents([LearnMoreButton]);

			client.channels.fetch(channel.id).then((channel) =>
				channel.send({
					embeds: [ambassadorEmbed],
					components: [row],
				})
			);
		} else if (subCommand === "ambassador-signup") {
			const ambassadorEmbed = new EmbedBuilder()
				.setTitle(
					`**EVO Ambassador Event: Recommend EVO and Share the $5000 Prize Pool!** :loudspeaker:`
				)
				.setDescription(
					`Do you like Project EVO? How about recommending the game to your fans & friends & family? To appreciate your support, we are offering a **$5000 gift card pool** for players who make game recommendation videos for the game! Let's enlarge the community together. Join events now!\n\n**WHO CAN PARTICIPATE?**\n**Everyone**\nNote: We have also prepared massive beta codes for creators (with 1000+ followers and 1000+ average views). One code per creator. This code can be used up to 1000 times.\n\n**WHEN TO START AND END?**\n<:ember:993888291218784286> The event starts from \`26 Mar\` to \`14 Apr\`.\n<:ember:993888291218784286> The result will be announced on \`17 Apr\`.\n\n**HOW TO PARTICIPATE?**\n<:ember:993888291218784286> Click "**Sign Up**"\n<:ember:993888291218784286> Create and post your EVO videos on **YouTube (Shorts Not Included)**\n<:ember:993888291218784286> Submit your content via <#${process.env.SUBMIT_CONTENT_CHANNEL}> channel, and select the "EVO Ambassador Event" tag (a MUST step)\n\n**WHAT CAN YOU WIN?**\n**Win rewards according to the views of each video (Multiple videos can be submitted)**\n<:ember:993888291218784286> >= 1000 views, 30 lottery tickets <:beta_lottery_ticket:1088358927672033360>\n<:ember:993888291218784286> >= 3000 views, $20\n<:ember:993888291218784286> >= 5,000 views, $50\n<:ember:993888291218784286> >= 10,000 views, $150\n\n**In addition, we have upgraded rewards for the most popular works:**\n<:ember:993888291218784286> Total views reach 300k, get an extra $300\n<:ember:993888291218784286> Total views reach 200k, get an extra $200\n<:ember:993888291218784286> Total views reach 100k, get an extra $100\n\n**TOPIC REQUIREMENT:**\n<:ember:993888291218784286> The video should revolve around the following topics, such as game recommendation, introduction, walkthrough, first impression, etc.\n<:ember:993888291218784286> We have also prepared <#1076037107300184125>, in case you need some high-quality materials!\n\n**Must Read <#1088672298585817128> Before Creation❗❗❗ Your video might risk being invalid if it doesn't follow the rules**\n\n<#1088747569003384873>\n<#1088748018192371775>\n<#1088748403405627392>\n<#1088748878825783307>`
				)
				.setImage("https://i.ibb.co/SxKqj0g/signup-en.jpg")
				.setColor(`C04946`);

			const signUpButton = new ButtonBuilder()
				.setCustomId("signUp")
				.setLabel("Sign Up")
				.setStyle(ButtonStyle.Success)
				.setEmoji("🪧");

			const checkButton = new ButtonBuilder()
				.setCustomId("checkSubmission")
				.setLabel("Check Submission")
				.setStyle(ButtonStyle.Primary)
				.setEmoji("🔍");

			const row = new ActionRowBuilder().addComponents([
				signUpButton,
				checkButton,
			]);

			client.channels.fetch(channel.id).then((channel) =>
				channel.send({
					embeds: [ambassadorEmbed],
					components: [row],
				})
			);
		} else if (subCommand === "ambassador-info-text") {
			const ambassadorMessage = `**EVO Ambassador Event**\n\n**Recommend EVO and Share the $5000 Prize Pool** :loudspeaker:\n\nDo you like Project EVO? How about recommending the game to your fans & friends & family? To appreciate your support, we are offering a **$5000 prize pool** for players who make **game recommendation videos** for the game! Let's enlarge the community together. Join events now!\n\nMultiple videos can be submitted, each of which can be used to claim rewards:\n<:ember:993888291218784286> >= 1000 views, **30  lottery tickets** <:beta_lottery_ticket:1088358927672033360>\n<:ember:993888291218784286> >= 3000 views, **$20**\n<:ember:993888291218784286> >= 5,000 views, **$50**\n<:ember:993888291218784286> >= 10,000 views, **$150**\n\nIn addition, we have upgraded rewards for the most popular works: :tada:\n<:ember:993888291218784286> Total views reach 300k, get an extra **$300**\n<:ember:993888291218784286> Total views reach 200k, get an extra **$200**\n<:ember:993888291218784286> Total views reach 100k, get an extra **$100**\n\n<#1088675985907519538>\n<#1088676463257079910>\n<#1088676929999229060>\n<#1088677798769594428>\n\nClick "**Learn More**" below to check details and sign up for the event!`;

			const attachment = new AttachmentBuilder(
				"https://i.ibb.co/SxKqj0g/signup-en.jpg"
			);

			const LearnMoreButton = new ButtonBuilder()
				.setLabel("Learn More")
				.setStyle(ButtonStyle.Link)
				.setURL(
					"https://discord.com/channels/951777532003381278/1088791299622174801"
				);

			const row = new ActionRowBuilder().addComponents([LearnMoreButton]);

			client.channels.fetch(channel.id).then((channel) =>
				channel.send({
					content: `@everyone\n` + ambassadorMessage,
					files: [attachment],
					components: [row],
				})
			);
		}
		await interaction.deleteReply();
	},
};
