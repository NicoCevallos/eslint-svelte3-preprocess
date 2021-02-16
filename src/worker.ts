import debug from "debug";
import { createRequire } from "module";
import { isMainThread, parentPort, workerData } from "worker_threads";
import { preprocess } from "./preprocess";
import { FileData, Result, SvelteConfig } from "./types";

const loadFile = createRequire(__dirname);

const debugWorker = debug("eslint:svelte-preprocess:worker");

if (!isMainThread) {
	parentPort?.on("message", async ({ src, filename }: FileData) => {
		const {
			isDoneView,
			dataView,
			dataLengthView,
			svelteConfigPath,
		} = workerData;

		const svelteConfig: SvelteConfig = loadFile(svelteConfigPath);

		debugWorker(`Preprocessing ${filename}`);

		let result: Result | null = null;

		try {
			result = await preprocess(src, filename, svelteConfig.preprocess);
			debugWorker(`Preprocessed ${filename}`);
		} catch (error) {
			debugWorker("Failed to preprocess:", error);
		}

		const textEncoder = new TextEncoder();
		const encodedResult = textEncoder.encode(result ? JSON.stringify(result) : '') // prettier-ignore
		dataView.set(encodedResult, 0);
		dataLengthView[0] = encodedResult.length;
		Atomics.store(isDoneView, 0, 1);
		Atomics.notify(isDoneView, 0, Infinity);
	});
}

const path = __filename;

export default {
	path,
};
