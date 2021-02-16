import esTree from "@typescript-eslint/typescript-estree";
import svelteCompiler from "svelte/compiler";
import { Markup, Preprocessors, Result, Script, Style } from "./types";

export const preprocess = async (
	src: string,
	filename: string,
	preprocessors: Preprocessors,
): Promise<Result> => {
	let markup: Markup | undefined;
	let module: Script | undefined;
	let instance: Script | undefined;
	let style: Style | undefined;

	const result = await svelteCompiler.preprocess(
		src,
		[
			{
				markup: ({ content }) => {
					markup = {
						original: content,
					};

					return {
						code: content,
					};
				},
				script: ({ content, attributes }) => {
					// Supported scenarios
					// type="text/typescript"
					// lang="typescript"
					// lang="ts"
					if (
						attributes.lang === "ts" ||
						attributes.lang === "typescript" ||
						attributes.type === "text/typescript"
					) {
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
					}

					return {
						code: content,
					};
				},
				style: ({ content }) => {
					style = {
						original: content,
					};

					return {
						code: content,
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

					return {
						code: content,
					};
				},
				script: ({ content, attributes }) => {
					const obj = attributes.context ? module : instance;
					if (obj) {
						obj.result = content;
						obj.diff = obj.original.length - content.length;
					}

					return {
						code: content,
					};
				},
				style: ({ content }) => {
					if (style) {
						style.result = content;
						style.diff = style.original.length - content.length;
					}

					return {
						code: content,
					};
				},
			},
		],
		{ filename: filename || "unknown" },
	);

	return {
		...result,
		instance,
		markup,
		module,
		style,
	};
};
