const axios = require("axios");
const fs = require("fs");
const request = require("request-promise");
const logger = require("./logging/logger.js");

async function authorize(id, secret) {
	let tenantToken;

	await axios
		.post(
			"https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal",
			{
				app_id: id,
				app_secret: secret,
			}
		)
		.then((res) => {
			tenantToken = res.data.tenant_access_token;
		})
		.catch((err) => {
			console.error(err);
		});

	return tenantToken;
}

async function createRecord(token, app, table, record, log) {
	let success = false;

	await axios
		.post(
			`https://open.feishu.cn/open-apis/bitable/v1/apps/${app}/tables/${table}/records`,
			record,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		)
		.then((res) => {
			res.data.msg == "success" ? (success = true) : (success = false);
			if (log) logger.debug(JSON.stringify(res.data));
			return success;
		})
		.catch((error) => {
			if (log) logger.error(JSON.stringify(error));
			return error;
		});

	return success;
}

async function createRecords(token, app, table, records) {
	let success = false;

	await axios
		.post(
			`https://open.feishu.cn/open-apis/bitable/v1/apps/${app}/tables/${table}/records/batch_create`,
			records,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		)
		.then((res) => {
			res.data.msg == "success" ? (success = true) : (success = false);
			return success;
		})
		.catch((err) => {
			return err;
		});

	return success;
}

async function getRecords(token, app, table, filter, page_token) {
	let options = {
		method: "GET",
		url: `https://open.feishu.cn/open-apis/bitable/v1/apps/${app}/tables/${table}/records`,
		qs: {
			filter: filter,
		},
		headers: { Authorization: `Bearer ${token}` },
	};

	if (filter && page_token) {
		options.qs = { filter: filter, page_token: page_token };
	} else if (filter) {
		options.qs = { filter: filter };
	}

	// Make the API call and wait for the response.
	let response = await request(options).catch((error) => console.error(error));

	if (response === undefined) {
		// If the response is undefined, recursively call the function again.
		return await getRecords(token, app, table, filter, page_token);
	} else {
		// If the response is defined, return it.
		return response;
	}
}

async function updateRecord(token, app, table, recordId, record) {
	const options = {
		method: "PUT",
		url: `https://open.feishu.cn/open-apis/bitable/v1/apps/${app}/tables/${table}/records/${recordId}`,
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: record,
		json: true,
	};

	return await request(options);
}

async function getFileToken(token, file) {
	const options = {
		method: "POST",
		url: "https://open.feishu.cn/open-apis/im/v1/images",
		headers: {
			"Content-Type":
				"multipart/form-data; boundary=---011000010111000001101001",
			Authorization: `Bearer ${token}`,
		},
		formData: {
			image: {
				value: fs.createReadStream(file),
				options: {
					filename: file,
					contentType: "image/jpeg",
				},
			},
			image_type: "message",
		},
	};

	return request(options).catch((error) => console.error(error));
}

async function uploadToDrive(token, app, file, type) {
	let fileStats = fs.statSync(file);
	const options = {
		method: "POST",
		url: "https://open.feishu.cn/open-apis/drive/v1/medias/upload_all",
		headers: {
			"Content-Type":
				"multipart/form-data; boundary=---011000010111000001101001",
			Authorization: `Bearer ${token}`,
		},
		formData: {
			file_name: file,
			parent_type: type,
			parent_node: app,
			size: `${fileStats.size}`,
			file: {
				value: fs.createReadStream(file),
				options: {
					filename: file,
					contentType: null,
				},
			},
		},
	};

	return request(options);
}

async function sendGroupMessage(webhookUrl, message) {
	const options = {
		method: "POST",
		url: webhookUrl,
		headers: { "Content-Type": "application/json" },
		body: message,
		json: true,
	};

	return request(options);
}

module.exports = {
	authorize,
	createRecord,
	createRecords,
	getRecords,
	updateRecord,
	getFileToken,
	uploadToDrive,
	sendGroupMessage,
};
