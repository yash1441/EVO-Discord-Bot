const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const feishu = require("../feishu.js");
const logger = require("../logging/logger.js");
require("dotenv").config();

module.exports = {
	data: new SlashCommandBuilder()
		.setName("test")
		.setDescription("This command is for testing purposes only.")
		.addStringOption((option) =>
			option
				.setName("secret-code")
				.setDescription("The secret code for the function to test.")
				.setRequired(true)
				.addChoices(
					{ name: "CCES Data Calculation", value: "CCESDATA" },
					{ name: "CCES Reward Calculation", value: "CCESREWARD" },
					{ name: "CEC Check Review", value: "CECCHECK" },
					{ name: "CEC Check Qualify", value: "CECQUALIFY" },
					{ name: "CCES Weekly Data Calculation", value: "CCESWEEKLYDATA" },
					{ name: "CCES Weekly Reward Calculation", value: "CCESWEEKLYREWARD" },
					{ name: "Test", value: "TEST" },
					{ name: "Member", value: "MEMBER" }
				)
		)
		.addStringOption((option) =>
			option
				.setName("date-start")
				.setDescription("The date for the function to start.")
				.setRequired(false)
		)
		.addStringOption((option) =>
			option
				.setName("date-end")
				.setDescription("The date for the function to end.")
				.setRequired(false)
		)
		.addStringOption((option) =>
			option
				.setName("discord-id")
				.setDescription("The discord id of the user.")
				.setRequired(false)
		),

	async execute(interaction, client) {
		if (interaction.user.id != process.env.MY_ID) {
			return;
		}

		await interaction.deferReply();

		const option = interaction.options.getString("secret-code");
		if (option === "CCESDATA") {
			const tenantToken = await feishu.authorize(
				process.env.FEISHU_ID,
				process.env.FEISHU_SECRET
			);
			let response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					process.env.CEP_BASE,
					process.env.CEP_SUBMISSION,
					'AND(CurrentValue.[Validity] = "VALID")'
				)
			);

			if (!response.data.total) {
				logger.warn("No VALID entries found.");
				return;
			}

			const uniqueRecords = [];
			for (const record of response.data.items) {
				let tempData = {
					"Discord ID": record.fields["Discord ID"],
					"Discord Name": record.fields["Discord Name"],
					"CEC Member": record.fields["CEC Member"],
					"Valid Views": parseInt(record.fields.Views),
					"Valid Videos": 1,
				};

				let existingData = uniqueRecords.find(
					(r) => r["Discord ID"] === tempData["Discord ID"]
				);
				if (existingData) {
					existingData["Valid Views"] += tempData["Valid Views"];
					existingData["Valid Videos"] += tempData["Valid Videos"];
				} else {
					uniqueRecords.push(tempData);
				}
			}

			let finalData = {
				records: [],
			};

			for (const record of uniqueRecords) {
				let response = await feishu.getRecords(
					tenantToken,
					process.env.CEP_BASE,
					process.env.CCES_DATA,
					`CurrentValue.[Discord ID] = "${record["Discord ID"]}"`
				);
				response = JSON.parse(response);
				if (response.data.total) {
					await feishu.updateRecord(
						tenantToken,
						process.env.CEP_BASE,
						process.env.CCES_DATA,
						response.data.items[0].record_id,
						{
							fields: {
								"Discord ID": record["Discord ID"],
								"CEC Member": record["CEC Member"],
								"Valid Views": record["Valid Views"],
								"Valid Videos": record["Valid Videos"],
							},
						}
					);
					record.updated = true;
				} else record.updated = false;
			}

			if (uniqueRecords.length > 0) {
				uniqueRecords.forEach(function (record) {
					if (!record.updated) {
						delete record.updated;
						let tempObject = {
							fields: record,
						};
						finalData.records.push(tempObject);
					}
				});
			} else {
				logger.info(
					"Successfully entered CCES Data. Now calculating CCES Rewards..."
				);
				return;
			}

			if (finalData.records.length == 0) {
				logger.info(
					"Successfully entered CCES Data. Now calculating CCES Rewards..."
				);
				return;
			}

			for (let i = 0; i < finalData.records.length; i++) {
				let userId = finalData.records[i].fields["Discord ID"];

				let hasCCRole = await checkMemberRole(
					client,
					process.env.EVO_SERVER,
					userId,
					process.env.CC_ROLE
				);

				let hasCECRole = await checkMemberRole(
					client,
					process.env.EVO_SERVER,
					userId,
					process.env.CEC_MEMBER_ROLE
				);

				if (hasCCRole) {
					finalData.records[i].fields["Content Creators"] = "Content Creators";
				} else {
					finalData.records[i].fields["Content Creators"] = "NO";
				}

				if (hasCECRole) {
					finalData.records[i].fields["CEC Member"] = "CEC Member";
				} else {
					finalData.records[i].fields["CEC Member"] = "NO";
				}
			}

			let success = await feishu.createRecords(
				tenantToken,
				process.env.CEP_BASE,
				process.env.CCES_DATA,
				finalData
			);
			success
				? logger.info(
						"Successfully entered CCES Data. Now calculating CCES Rewards..."
				  )
				: logger.info(
						"Failed to enter CCES Data. Now calculation CCES Rewards..."
				  );
		} else if (option === "CCESREWARD") {
			let tenantToken = await feishu.authorize(
				"cli_a3befa8417f9500d",
				"II4y9Nn6d7C6RuZUxdOz2fxt4sSo6Rsu"
			);
			let response = await feishu.getRecords(
				tenantToken,
				"bascnxUOz7DdG9mcOUvFlH7BIPg",
				"tblYxVO5nDS8E519"
			);
			response = JSON.parse(response);

			if (!response.data.total)
				return console.log(
					"No entries found in CCES Data Calculation bitable."
				);
			let records = response.data.items;

			let recordsSimplified = [];

			for (const record of records) {
				let discordId = record.fields["Discord ID"];
				let views = parseInt(record.fields["Valid Views"]);
				let videos = parseInt(record.fields["Valid Videos"]);
				let recordId = record.record_id;
				let proReward = 0;
				let newbieReward = [];

				if (views >= 1000 && views < 3000) {
					proReward = 10;
				} else if (views >= 3000 && views < 5000) {
					proReward = 25;
				} else if (views >= 5000 && views < 10000) {
					proReward = 50;
				} else if (views >= 10000 && views < 30000) {
					proReward = 75;
				} else if (views >= 30000) {
					proReward = 200;
				}

				if (videos >= 1 && views >= 500) {
					newbieReward.push("Beginners");
				}

				recordsSimplified.push({
					recordId: recordId,
					"Discord ID": discordId,
					"Pro Reward Value": proReward,
					"Title Reward": newbieReward,
					"Other Reward Value": 0,
					views: views,
					videos: videos,
				});
			}

			recordsSimplified.sort((a, b) => {
				return b.views - a.views;
			});

			if (recordsSimplified[0]) {
				recordsSimplified[0]["Title Reward"].push("Outstanding Creator TOP1");
				recordsSimplified[0]["Other Reward Value"] += 100;
			}
			if (recordsSimplified[1]) {
				recordsSimplified[1]["Title Reward"].push("Outstanding Creator TOP2");
				recordsSimplified[1]["Other Reward Value"] += 50;
			}
			if (recordsSimplified[2]) {
				recordsSimplified[2]["Title Reward"].push("Outstanding Creator TOP3");
				recordsSimplified[2]["Other Reward Value"] += 25;
			}

			recordsSimplified.sort((a, b) => {
				return b.videos - a.videos;
			});

			if (recordsSimplified[0]) {
				recordsSimplified[0]["Title Reward"].push("Amazing Productivity TOP1");
				recordsSimplified[0]["Other Reward Value"] += 100;
			}
			if (recordsSimplified[1]) {
				recordsSimplified[1]["Title Reward"].push("Amazing Productivity TOP2");
				recordsSimplified[1]["Other Reward Value"] += 50;
			}
			if (recordsSimplified[2]) {
				recordsSimplified[2]["Title Reward"].push("Amazing Productivity TOP3");
				recordsSimplified[2]["Other Reward Value"] += 25;
			}

			for (const record of recordsSimplified) {
				let recordId = record.recordId;
				delete record.recordId;
				delete record.views;
				delete record.videos;
				await feishu.updateRecord(
					tenantToken,
					"bascnxUOz7DdG9mcOUvFlH7BIPg",
					"tblYxVO5nDS8E519",
					recordId,
					{ fields: record }
				);
			}

			console.log("Successfully entered CCES Reward Data.");
		} else if (option === "CECCHECK") {
			let tenantToken = await feishu.authorize(
				"cli_a3befa8417f9500d",
				"II4y9Nn6d7C6RuZUxdOz2fxt4sSo6Rsu"
			);
			let response = await feishu.getRecords(
				tenantToken,
				"bascnxUOz7DdG9mcOUvFlH7BIPg",
				"tbl4DLumAWTgjsyf",
				`CurrentValue.[Data Review] = "CHECK"`
			);
			response = JSON.parse(response);

			if (!response.data.total) {
				console.log('No entries set to "CHECK" for review.');
				return;
			}

			let records = response.data.items;
			let recordsSimplified = [];
			records.forEach(function (record) {
				recordsSimplified.push({
					recordId: record.record_id,
					"Discord ID": record.fields["Discord ID"],
					"Total Views": 0,
					"Total Videos": 0,
				});
			});

			for (const record of recordsSimplified) {
				let res = await feishu.getRecords(
					tenantToken,
					"bascnxUOz7DdG9mcOUvFlH7BIPg",
					"tblYxVO5nDS8E519",
					`CurrentValue.[Discord ID] = "${record["Discord ID"]}"`
				);
				res = JSON.parse(res);
				if (res.data.total) {
					record["Total Views"] = parseInt(
						res.data.items[0].fields["Valid Views"]
					);
					record["Total Videos"] = parseInt(
						res.data.items[0].fields["Valid Videos"]
					);
				}
				let recordId = record.recordId;
				delete record.recordId;
				delete record["Discord ID"];
				record["Data Review"] = "DONE";
				console.log(record);
				await feishu.updateRecord(
					tenantToken,
					"bascnxUOz7DdG9mcOUvFlH7BIPg",
					"tbl4DLumAWTgjsyf",
					recordId,
					{ fields: record }
				);
			}
			console.log("Completed CEC Check.");
		} else if (option === "CECQUALIFY") {
			let tenantToken = await feishu.authorize(
				"cli_a3befa8417f9500d",
				"II4y9Nn6d7C6RuZUxdOz2fxt4sSo6Rsu"
			);
			let response = await feishu.getRecords(
				tenantToken,
				"bascnxUOz7DdG9mcOUvFlH7BIPg",
				"tbl4DLumAWTgjsyf",
				`CurrentValue.[Qualification] = "Accepted"`
			);
			response = JSON.parse(response);

			if (!response.data.total) {
				console.log('No entries set to "Accepted" for qualification.');
				return;
			}

			let records = response.data.items;
			for (const record of records) {
				let guild = client.guilds.cache.get("951777532003381278");
				let member = guild.members.cache.get(record.fields["Discord ID"]);
				let cecEmbed = new EmbedBuilder()
					.setTitle("Congrats! You become members of Creator Evolution Club!")
					.setDescription(
						"Now the following exclusive benefits are waiting for you to win!\n- Beta codes for your fans (up to 200 codes/month)\n- Creator foundation (including high-end phones worth $800+)\n- Official support from dev team\n\nStaff from dev team will contact you in private very soon!"
					);

				await member.roles
					.add("1042700294603145257")
					.then(() => {
						console.log(`Added role to ${member.user.tag}`);
						let qualification = "DONE";
						member
							.send({ embeds: [cecEmbed] })
							.then(() => {
								console.log(`Sent message to ${member.user.tag}`);
								qualification = "DONE";
							})
							.catch((error) => {
								console.log(error);
								qualification = "DONE (NO DM)";
							});
						feishu.updateRecord(
							tenantToken,
							"bascnxUOz7DdG9mcOUvFlH7BIPg",
							"tbl4DLumAWTgjsyf",
							record.record_id,
							{ fields: { Qualification: qualification } }
						);
					})
					.catch((error) => {
						console.log(error);
						feishu.updateRecord(
							tenantToken,
							"bascnxUOz7DdG9mcOUvFlH7BIPg",
							"tbl4DLumAWTgjsyf",
							record.record_id,
							{ fields: { Qualification: "Left Server" } }
						);
					});
			}
			console.log("Successfully checked qualification data.");
		} else if (option === "CODEREGION") {
			let tenantToken = await feishu.authorize(
				"cli_a3befa8417f9500d",
				"II4y9Nn6d7C6RuZUxdOz2fxt4sSo6Rsu"
			);
			let response = await feishu.getRecords(
				tenantToken,
				"bascnbWD6jH5XOCtphFiiXxC3Ab",
				"tblE1ARAr7yx7qpL",
				`CurrentValue.[Region] = ""`
			);
			response = JSON.parse(response);
			let records = response.data.items;
			for (const record of records) {
				let userId = record.fields["Discord ID"];
				let region = await memberRegionRole(client, userId);
				await feishu.updateRecord(
					tenantToken,
					"bascnbWD6jH5XOCtphFiiXxC3Ab",
					"tblE1ARAr7yx7qpL",
					record.record_id,
					{ fields: { Region: region } }
				);
			}
		} else if (option === "CCESWEEKLYDATA") {
			let tenantToken = await feishu.authorize(
				"cli_a3befa8417f9500d",
				"II4y9Nn6d7C6RuZUxdOz2fxt4sSo6Rsu"
			);

			let dateStart =
				interaction.options.getString("date-start") ?? "2022,12,15";
			let dateEnd = interaction.options.getString("date-end") ?? "2022,12,22";

			let response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					"bascnxUOz7DdG9mcOUvFlH7BIPg",
					"tbl3pXwSxiOrfj7W",
					`AND(CurrentValue.[Validity] = "VALID", CurrentValue.[Submission Date] >= DATE(${dateStart}), CurrentValue.[Submission Date] < DATE(${dateEnd}), NOT(CurrentValue.[Video Platform] = "TapTap"))`
				)
			);

			if (!response.data.total) {
				console.log("No valid submissions this week.");
				return;
			}

			let recordsSimplified = [];

			for (const record of response.data.items) {
				let wviews = 0;
				if (record.fields.Views != undefined) {
					wviews = parseInt(record.fields.Views);
				}

				recordsSimplified.push({
					"Discord ID": record.fields["Discord ID"],
					"Weekly Valid Views": wviews,
					"Weekly Valid Videos": 1,
				});
			}

			let uniqueRecords = await mergeRecords(recordsSimplified, {
				id: "Discord ID",
				others: ["Weekly Valid Views", "Weekly Valid Videos"],
			});

			for (const record of uniqueRecords) {
				let response = JSON.parse(
					await feishu.getRecords(
						tenantToken,
						"bascnxUOz7DdG9mcOUvFlH7BIPg",
						"tblYxVO5nDS8E519",
						`CurrentValue.[Discord ID] = "${record["Discord ID"]}"`
					)
				);
				if (!response.data.total) {
					continue;
				}
				await feishu.updateRecord(
					tenantToken,
					"bascnxUOz7DdG9mcOUvFlH7BIPg",
					"tblYxVO5nDS8E519",
					response.data.items[0].record_id,
					{
						fields: {
							"Discord ID": record["Discord ID"],
							"Weekly Valid Views": record["Weekly Valid Views"],
							"Weekly Valid Videos": record["Weekly Valid Videos"],
						},
					}
				);
			}

			console.log("Successfully entered CCES Weekly Data.");
		} else if (option === "CCESWEEKLYREWARD") {
			let tenantToken = await feishu.authorize(
				"cli_a3befa8417f9500d",
				"II4y9Nn6d7C6RuZUxdOz2fxt4sSo6Rsu"
			);
			let response = JSON.parse(
				await feishu.getRecords(
					tenantToken,
					"bascnxUOz7DdG9mcOUvFlH7BIPg",
					"tblYxVO5nDS8E519"
				)
			);

			for (const record of response.data.items) {
				let weeklyViews = parseInt(record.fields["Weekly Valid Views"]);
				let weeklyVideos = parseInt(record.fields["Weekly Valid Videos"]);
				let recordId = record.record_id;
				let weeklyProReward = 0;

				if (weeklyViews >= 1000 && weeklyViews < 3000) {
					weeklyProReward = 10;
				} else if (weeklyViews >= 3000 && weeklyViews < 5000) {
					weeklyProReward = 25;
				} else if (weeklyViews >= 5000 && weeklyViews < 10000) {
					weeklyProReward = 50;
				} else if (weeklyViews >= 10000 && weeklyViews < 30000) {
					weeklyProReward = 75;
				} else if (weeklyViews >= 30000) {
					weeklyProReward = 200;
				}

				await feishu.updateRecord(
					tenantToken,
					"bascnxUOz7DdG9mcOUvFlH7BIPg",
					"tblYxVO5nDS8E519",
					recordId,
					{ fields: { "Weekly Pro Reward Value": weeklyProReward } }
				);
			}

			console.log("Successfully entered CCES Weekly Reward Data.");
		} else if (option === "TEST") {
			client.channels.fetch("360776228199727105").then((channel) =>
				channel.send({
					content: "Hi",
				})
			);
		} else if (option === "MEMBER") {
			const discordId = interaction.options.getString("discord-id");
			const guild = client.guilds.cache.get(process.env.EVO_SERVER);
			const member = await guild.members
				.fetch(discordId)
				.then(() => {
					logger.debug("Member found.");
				})
				.catch(() => {
					logger.debug("Member not found.");
				});
		}

		await interaction.editReply({ content: "Testing complete." });
	},
};

async function memberRegionRole(client, userId) {
	let guild = client.guilds.cache.get("951777532003381278");
	let member = guild.members.cache.get(userId);
	if (!member) return ["None"];
	let roles = [];
	if (member.roles.cache.has("973278649698648135")) roles.push("CIS");
	if (member.roles.cache.has("972350401863122974")) roles.push("PT");
	if (member.roles.cache.has("972350282455453756")) roles.push("ES");
	if (member.roles.cache.has("972375372660346910")) roles.push("TH");
	if (member.roles.cache.has("972375574406385705")) roles.push("FR");
	if (member.roles.cache.has("973040050063417376")) roles.push("TR");
	if (member.roles.cache.has("973040245119524915")) roles.push("DE");
	if (member.roles.cache.has("973042080823783464")) roles.push("VN");
	if (member.roles.cache.has("976940106961272994")) roles.push("AR");
	if (member.roles.cache.has("976940260200169502")) roles.push("PH");
	if (member.roles.cache.has("984111719292993628")) roles.push("HI");
	if (member.roles.cache.has("989240355071348746")) roles.push("PL");
	if (member.roles.cache.has("996876611926364250")) roles.push("FA");
	if (member.roles.cache.has("996882291945111602")) roles.push("IN");
	if (member.roles.cache.has("972350125844336680")) roles.push("EN");
	if (member.roles.cache.has("1017922224776286269")) roles.push("Global");

	if (roles.length === 0) return ["None"];

	return roles;
}

async function mergeRecords(records, keys) {
	// Create an empty array to store the merged data
	const mergedData = [];

	// Iterate through the array of records
	for (const record of records) {
		// Destructure the record object and assign the values to variables with more readable names
		const id = record[keys.id];
		const values = Object.entries(record)
			.filter(([key]) => !keys.id.includes(key))
			.reduce((obj, [key, value]) => {
				obj[key] = value;
				return obj;
			}, {});

		// Check if an entry with the same ID already exists in the array
		const existingRecord = mergedData.find((r) => r[keys.id] === id);
		if (existingRecord) {
			// If it does, add the values of the other keys to the corresponding values in the existing record
			for (const key of keys.others) {
				existingRecord[key] += values[key];
			}
		} else {
			// If it does not, add a new entry to the array with the ID and the object containing the values of the other keys
			mergedData.push({ [keys.id]: id, ...values });
		}
	}

	return mergedData;
}
