#!/usr/bin/env node

const https = require('node:https');
const fs = require('node:fs/promises');


const SUBJECTS_LINK = 'https://huggingface.co/spaces/Gustavosta/MagicPrompt-Stable-Diffusion/raw/main/ideas.txt';
const PROMPTS_LINK = 'https://datasets-server.huggingface.co/rows?dataset=Gustavosta%2FStable-Diffusion-Prompts&config=default&split=train';


(async () => {
	https.get(SUBJECTS_LINK, async (response) => {
		const body = [];
		response.on('data', (chunk) => {
			body.push(chunk);
		});
		response.on('end', async () => {
			const subjects = body.join('').split('\n').map(item => item.trim()).sort();
			const json = JSON.stringify(subjects, null, '\t');
			await fs.writeFile('./subjects.json', json);			
		});
	});
	
	const promises = [];
	for (let offset = 0, total = 73718, limit = 100; offset < total; offset += limit) {
		const promise = new Promise((resolve, reject) =>  {
			https.get(`${PROMPTS_LINK}&offset=${offset}&limit=${limit}`, (response) => {
				const body = [];
				response.on('data', (chunk) => {
					body.push(chunk);
				});
				response.on('end', () => {
					const dataset = JSON.parse(body.join(''));
					total = dataset.num_rows_total;
					resolve(dataset);
				});
			});
		});
		promises.push(promise);
	}

	const prompts = [];
	Promise.all(promises).then(async (datasets) => {
		for (const dataset of datasets) {
			for (const record of dataset.rows) {
				prompts.push(record.row.Prompt.replace(/\“|\!/gi, '').trim());
			}
		}
		const json = JSON.stringify(prompts.sort(), null, '\t');
		await fs.writeFile('./prompts.json', json);
	});
})();