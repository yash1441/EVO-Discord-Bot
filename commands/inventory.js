const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
const feishu = require("../feishu.js");
require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("inventory")
		.setDescription("Check your inventory in Project EVO server.")
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("The user to check inventory of.")
				.setRequired(false)
		),

	async execute(interaction, client) {
		await interaction.deferReply({ ephemeral: true });
		let discordId, discordName, username;
		// const date = new Date().toLocaleString("en-US", {
		// 	timeZone: "Asia/Singapore",
		// });
		// let currentDay = new Date(date).getDate();

		if (interaction.options.getUser("user")) {
			if (interaction.user.id != process.env.MY_ID) {
				return await interaction.editReply({
					content: "You are not allowed to check other people's inventory!",
				});
			}
			discordId = await interaction.options.getUser("user").id;
			discordName = await interaction.options.getUser("user").tag;
			username = await interaction.options.getUser("user").username;
		} else {
			discordId = await interaction.user.id;
			discordName = await interaction.user.tag;
			username = await interaction.user.username;
		}

		let tenantToken = await feishu.authorize(
			"cli_a3befa8417f9500d",
			"II4y9Nn6d7C6RuZUxdOz2fxt4sSo6Rsu"
		);

		let response = JSON.parse(
			await feishu.getRecords(
				tenantToken,
				"bascnmtfV0mbNf8o2cmZkeHBGjd",
				"tblkFaNcK0MyYXR7",
				`CurrentValue.[Discord ID] = "${discordId}"`
			)
		);

		let inventoryEmbed = new EmbedBuilder()
			.setTitle(`${username}'s Inventory`)
			.setColor("Random");

		if (!response.data.total) {
			inventoryEmbed.setDescription("*Your inventory is currently empty.*");
			return await interaction.editReply({ embeds: [inventoryEmbed] });
		}

		let inventory = [];
		let expired = [];
		//let won = false;
		for (const item of response.data.items) {
			if (item.fields["Valid"]) {
				//if (item.fields["Item"] == "⭐") won = true;
				inventory.push(item.fields["Item"]);
			} else expired.push(item.fields["Item"]);
		}

		if (inventory.length == 0)
			inventoryEmbed.setDescription("*Your inventory is currently empty.*");
		else {
			inventoryEmbed.setDescription(inventory.join(" "));
		}

		await interaction.editReply({
			embeds: [inventoryEmbed],
		});
	},
};

function hasElementOccurringThrice(array) {
	const counts = {};

	for (const element of array) {
		if (element in counts) {
			counts[element]++;
		} else {
			counts[element] = 1;
		}
	}

	for (const element in counts) {
		if (counts[element] === 3) {
			return element;
		}
	}

	return null;
}

function containsAllElements(array, mainArray) {
	const set = new Set(array);

	for (const element of mainArray) {
		if (!set.has(element)) {
			return false;
		}
	}

	return true;
}
