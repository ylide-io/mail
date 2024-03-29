// noinspection JSUnusedGlobalSymbols

declare module '*.module.scss' {
	const css: { [key: string]: string };
	export = css;
}

declare module '*.svg' {
	export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
	const src: string;
	export default src;
}

declare module '*.mp4' {
	const value: any;
	export default value;
}
