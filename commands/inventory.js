const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	EmbedBuilder,
} = require("discord.js");
const fs = require("fs");
const feishu = require("../feishu.js");
const luckySymbols = {
	20: ["☃️", "🧦", "🎄"],
	21: ["🍬", "🎅", "🧣"],
	22: ["🧣", "🧦", "☃️"],
	23: ["🧦", "🎅", "☃️"],
	24: ["🎄", "🍬", "🎅"],
	25: ["🧦", "🎄", "🧣"],
	26: ["🧣", "🍬", "☃️"],
};

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
		const date = new Date().toLocaleString("en-US", {
			timeZone: "Asia/Singapore",
		});
		let currentDay = new Date(date).getDate();
		let luckySymbolsToday = luckySymbols[currentDay];

		if (interaction.options.getUser("user")) {
			if (interaction.user.id != "132784173311197184") {
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
		let won = false;
		for (const item of response.data.items) {
			if (item.fields["Valid"]) {
				if (item.fields["Item"] == "⭐") won = true;
				inventory.push(item.fields["Item"]);
			} else expired.push(item.fields["Item"]);
		}

		if (inventory.length == 0)
			inventoryEmbed.setDescription("*Your inventory is currently empty.*");
		else {
			inventoryEmbed.setDescription(inventory.join(" "));
			let thrice = hasElementOccurringThrice(inventory);
			if (thrice && !won) {
				inventoryEmbed.addFields(
					{
						name: "\u200B",
						value: "\u200B",
					},
					{
						name: "⭐⭐⭐ **3 Matching Gifts** ⭐⭐⭐",
						value:
							"<a:arrowanimate:1010745620069372044> " +
							thrice +
							" " +
							thrice +
							" " +
							thrice,
					},
					{
						name: "\u200B",
						value:
							"**❄️ Merry Christmas ❄️**\n*You have received the maximum number of rewards from this event. Thank you for taking part! You will be messaged soon with your prize. Please keep your DMs open.*",
					}
				);
				await feishu.createRecord(
					tenantToken,
					"bascnmtfV0mbNf8o2cmZkeHBGjd",
					"tblkFaNcK0MyYXR7",
					{
						fields: {
							"Discord ID": discordId,
							"Discord Name": discordName,
							Item: "⭐",
							Event: "Christmas 2022",
							Valid: true,
							"Interaction ID": "3 Gifts",
						},
					}
				);
			} else if (containsAllElements(inventory, luckySymbolsToday) && !won) {
				inventoryEmbed.addFields(
					{
						name: "\u200B",
						value: "\u200B",
					},
					{
						name: "⭐⭐⭐ **Lucky Gifts** ⭐⭐⭐",
						value:
							"<a:arrowanimate:1010745620069372044> " +
							luckySymbolsToday.join(" "),
					},
					{
						name: "\u200B",
						value:
							"**❄️ Merry Christmas ❄️**\n*You have received the maximum number of rewards from this event. Thank you for taking part! You will be messaged soon with your prize. Please keep your DMs open.*",
					}
				);
				await feishu.createRecord(
					tenantToken,
					"bascnmtfV0mbNf8o2cmZkeHBGjd",
					"tblkFaNcK0MyYXR7",
					{
						fields: {
							"Discord ID": discordId,
							"Discord Name": discordName,
							Item: "⭐",
							Event: "Christmas 2022",
							Valid: true,
							"Interaction ID": "Lucky Gifts",
						},
					}
				);
			}
		}

		await interaction.editReply({
			embeds: [inventoryEmbed],
		});
	},
};

function hasElementOccurringThrice(arr) {
	const counts = {};

	for (const element of arr) {
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

function containsAllElements(inventory, luckySymbolsToday) {
	const set = new Set(inventory);

	for (const element of luckySymbolsToday) {
		if (!set.has(element)) {
			return false;
		}
	}

	return true;
}
