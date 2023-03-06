const {
	SlashCommandBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
	ActionRowBuilder,
} = require("discord.js");
const fs = require("fs");
const request = require("request-promise");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("bugreport")
		.setDescription("Submit a bug report to the dev team.")
		.addStringOption((option) =>
			option
				.setName("category")
				.setDescription("Choose bug category.")
				.setRequired(true)
				.addChoices(
					{ name: "Optimization", value: "Optimization" },
					{ name: "Connection", value: "Connection" },
					{ name: "Login", value: "Login" },
					{ name: "Gameplay Abnormal", value: "Gameplay Abnormal" },
					{ name: "Data Loss", value: "Data Loss" },
					{ name: "Others", value: "Others" }
				)
		)
		.addAttachmentOption((option) =>
			option
				.setName("attachment")
				.setDescription("Submit bug screenshot.")
				.setRequired(true)
		),

	async execute(interaction, client) {
		return await interaction.reply({
			content: "This command is currently disabled.",
			ephemeral: true,
		});
		let attachment = interaction.options.getAttachment("attachment", true);
		let tempName = "bug_" + interaction.options.getString("category");

		if (!attachment.url.endsWith("jpg") && !attachment.url.endsWith("png")) {
			return await interaction.reply({
				content:
					"You can only submit images in this. To submit a video, upload it to a public site (Youtube, Google Drive, Dropbox, etc.) and send link in the Bug Details section of the form.",
				ephemeral: true,
			});
		}

		const bugreportModal = new ModalBuilder()
			.setCustomId(tempName)
			.setTitle(interaction.options.getString("category"));
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

		await request.head(attachment.url, function (err, res, body) {
			request(attachment.url).pipe(
				fs.createWriteStream(`${interaction.user.id}-bug.jpg`)
			);
		});
	},
};
