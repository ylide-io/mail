import { ActionButton, ActionButtonLook, ActionButtonSize } from '../../../../components/ActionButton/ActionButton';
import css from './createPostForm.module.scss';

export interface CreatePostFormProps {}

export function CreatePostForm({}: CreatePostFormProps) {
	return (
		<div className={css.form}>
			<textarea data-dl-input-translation={false} />

			<ActionButton size={ActionButtonSize.XLARGE} look={ActionButtonLook.PRIMARY}>
				Post
			</ActionButton>
		</div>
	);
}
