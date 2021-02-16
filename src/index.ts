import debug from "debug";
import tty from "tty";
import { SHARE_ENV, Worker } from "worker_threads";
import { FileData, proprocessFunction, Result } from "./types";
import workerFile from "./worker";

const debugMain = debug("eslint:svelte-preprocess:main");

function eslintSveltePreprocess(svelteConfigPath?: string): proprocessFunction {
	if (tty.isatty(process.stderr.fd)) {
		process.env.DEBUG_COLORS = "true";
	}

	const isRunningWithinCli = !process.argv.includes("--node-ipc");
	const isDoneBuffer = new SharedArrayBuffer(4);
	const isDoneView = new Int32Array(isDoneBuffer);
	const dataBuffer = new SharedArrayBuffer(50 * 1024 * 1024);
	const dataView = new Uint8Array(dataBuffer);
	const dataLengthBuffer = new SharedArrayBuffer(4);
	const dataLengthView = new Uint32Array(dataLengthBuffer);
	const worker = new Worker(workerFile.path, {
		env: SHARE_ENV,
		workerData: {
			isDoneView,
			dataView,
			dataLengthView,
			svelteConfigPath,
		},
	});

	let lastResult: Result;

	return (src: string, filename: string): Result => {
		debugMain(`Asking worker to preprocess ${filename}`);
		try {
			worker.postMessage({
				src,
				filename,
			} as FileData);

			debugMain("Locking thread to wait for worker");

			const waitResult = Atomics.wait(isDoneView, 0, 0, 5000);
			Atomics.store(isDoneView, 0, 0);
			debugMain(`Unlocked: ${waitResult}`);
		} catch (error) {
			debugMain(`error: ${error as string}`);
		}

		try {
			const textDecoder = new TextDecoder();
			const decoded = textDecoder.decode(
				dataView.subarray(0, dataLengthView[0]),
			);
			const result = JSON.parse(decoded);
			debugMain("Finished");
			lastResult = result;
			return result;
		} catch {
			debugMain("No result obtained; finished with last result");
			return lastResult;
		} finally {
			if (isRunningWithinCli) {
				setTimeout(async () => {
					debugMain("Terminating worker");
					await worker.terminate();
				});
			}
		}
	};
}

module.exports = eslintSveltePreprocess;

export default module.exports;
