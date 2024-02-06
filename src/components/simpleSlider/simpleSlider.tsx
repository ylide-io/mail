import { PureComponent } from 'react';
import React from 'react';

import css from './simpleSlider.module.scss';

interface SimpleSliderProps {
	value: number;
	minLabel: React.ReactNode;
	maxLabel: React.ReactNode;
	label: (v: number) => React.ReactNode;
	onChange: (v: number) => void;
}

export class SimpleSlider extends PureComponent<SimpleSliderProps> {
	isDown = false;
	ref = React.createRef<HTMLDivElement>();

	handleMouseMove = (e: MouseEvent) => {
		if (this.isDown) {
			e.preventDefault();
			e.stopPropagation();

			if (this.ref.current) {
				const rect = this.ref.current.getBoundingClientRect();
				const x = e.clientX - rect.left;
				const w = rect.width;

				this.props.onChange(Math.min(1, Math.max(0, x / w)));
			}
		}
	};

	handleMouseUp = () => {
		this.isDown = false;
	};

	componentDidMount(): void {
		window.addEventListener('mousemove', this.handleMouseMove);
		window.addEventListener('mouseup', this.handleMouseUp);
	}

	componentWillUnmount(): void {
		window.removeEventListener('mousemove', this.handleMouseMove);
		window.removeEventListener('mouseup', this.handleMouseUp);
	}

	render() {
		return (
			<div className={css.simpleSlider} ref={this.ref}>
				<div className={css.minWrap}>
					<div className={css.minLabel}>{this.props.minLabel}</div>
				</div>
				<div
					className={css.sliderBody}
					onMouseDown={e => {
						e.preventDefault();
						e.stopPropagation();

						this.isDown = true;
					}}
					onMouseUp={e => {
						this.isDown = false;
					}}
				>
					<div
						className={css.sliderLine}
						onMouseDown={e => {
							if (this.ref.current) {
								const rect = this.ref.current.getBoundingClientRect();
								const x = e.clientX - rect.left;
								const w = rect.width;

								this.props.onChange(Math.min(1, Math.max(0, x / w)));
							}
						}}
					/>
					<div
						className={css.sliderCaretWrap}
						style={{
							left: `${this.props.value * 100}%`,
						}}
					>
						<div className={css.sliderCaretImg} />
						<div className={css.sliderCaretLabel}>{this.props.label(this.props.value)}</div>
					</div>
				</div>
				<div className={css.maxWrap}>
					<div className={css.maxLabel}>{this.props.maxLabel}</div>
				</div>
			</div>
		);
	}
}
