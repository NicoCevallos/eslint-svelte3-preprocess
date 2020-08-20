import { PreprocessorGroup } from "svelte/types/compiler/preprocess";
import { preprocess } from "svelte/compiler";
import deasyncPromise from "deasync-promise";
import esTree from "@typescript-eslint/typescript-estree";

interface Markup {
	original: string;
	result?: string;
	diff?: number;
}

interface Script {
	ast: unknown;
	original: string;
	ext: string;
	result?: string;
	diff?: number;
}
interface Style {
	original: string;
	result?: string;
	diff?: number;
}

interface Result {
	module: Script;
	instance: Script;
	style: Style;
}

type proprocessFunction = (src: string, filename: string) => Result;

const eslintSveltePreprocess = (
	preprocessors:
		| Readonly<PreprocessorGroup>
		| ReadonlyArray<Readonly<PreprocessorGroup>>,
): proprocessFunction => (src: string, filename: string): Result => {
	let markup: Markup | undefined;
	let module: Script | undefined;
	let instance: Script | undefined;
	let style: Style | undefined;

	const res = deasyncPromise(
		preprocess(
			src,
			[
				{
					markup: ({ content }) => {
						markup = {
							original: content,
						};
					},
					script: ({ content, attributes }) => {
						const ast = esTree.parse(content, { loc: true });

						const obj = {
							ast,
							original: content,
							ext: "ts",
						};

						if (attributes.context) {
							module = obj;
						} else {
							instance = obj;
						}
					},
					style: ({ content }) => {
						style = {
							original: content,
						};
					},
				},
				...(Array.isArray(preprocessors) ? preprocessors : [preprocessors]),
				{
					markup: ({ content }) => {
						if (markup) {
							markup.result = content;
							markup.diff = markup.original.length - content.length;
						}
					},
					script: ({ content, attributes }) => {
						const obj = attributes.context ? module : instance;
						if (obj) {
							obj.result = content;
							obj.diff = obj.original.length - content.length;
						}
					},
					style: ({ content }) => {
						if (style) {
							style.result = content;
							style.diff = style.original.length - content.length;
						}
					},
				},
			],
			{ filename: filename || "unknown" },
		),
	);

	return {
		...res,
		module,
		instance,
		style,
		markup,
	};
};

module.exports = eslintSveltePreprocess;
export default eslintSveltePreprocess;
