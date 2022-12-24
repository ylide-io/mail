declare module '*.module.scss' {
	const css: { [key: string]: string };
	export = css;
}

declare module '*.mp4' {
	const value: any;
	export default value;
}
