import { MouseEvent } from 'react';

import { FeedPost, LinkType } from '../../../../api/feedServerApi';
import { GalleryModal } from '../../../../components/galleryModal/galleryModal';
import css from './feedPostItem.module.scss';

interface FeedPostContentProps {
	post: FeedPost;
}

interface FeedPostTextProps {
	post: FeedPost;
	content: string;
}

export function OldPostText({ post, content }: FeedPostTextProps) {
	const onPostTextClick = (e: MouseEvent) => {
		if ((e.target as Element).tagName.toUpperCase() === 'IMG') {
			GalleryModal.show([(e.target as HTMLImageElement).src]);
		}
	};

	return <div className={css.text} dangerouslySetInnerHTML={{ __html: content }} onClick={onPostTextClick} />;
}

export function NewPostText({ post, content }: FeedPostTextProps) {
	const onPostTextClick = (e: MouseEvent) => {
		if ((e.target as Element).tagName.toUpperCase() === 'IMG') {
			GalleryModal.show([(e.target as HTMLImageElement).src]);
		}
	};

	return <div className={css.text} dangerouslySetInnerHTML={{ __html: content }} onClick={onPostTextClick} />;
}

export function FeedPostContent({ post }: FeedPostContentProps) {
	const isNewContent =
		post.content.startsWith('--$#$#new#$#$--') || post.content.startsWith('<p>--$#$#new#$#$--</p>');
	const isP = isNewContent && post.content.startsWith('<p>');
	const oldContent = isNewContent
		? post.content.split(isP ? '<p>--$#$#old#$#$--</p>' : '--$#$#old#$#$--')[1]
		: post.content;

	// const newContent = isNewContent ? post.content.split(isP ? '<p>--$#$#old#$#$--</p>' : '--$#$#old#$#$--')[0].substring(isP ? 22 : 15) : '';

	return (
		<div className={css.content}>
			{!!post.title && <div className={css.title}>{post.title}</div>}

			{!!post.subtitle && <div className={css.subtitle}>{post.subtitle}</div>}

			<OldPostText post={post} content={oldContent} />

			{!!post.picrel &&
				post.sourceType !== LinkType.MIRROR &&
				(post.picrel.endsWith('.mp4') ? (
					<video loop className={css.picture} controls>
						<source src={post.picrel} type="video/mp4" />
					</video>
				) : (
					<div
						style={{ backgroundImage: `url("${post.picrel}")` }}
						className={css.picture}
						onClick={() => GalleryModal.show([post.picrel])}
					/>
				))}

			{!!post.embeds.length && (
				<div className={css.embeds}>
					{post.embeds.map((e, idx) => (
						<a key={idx} className={css.embed} href={e.link} target="_blank" rel="noreferrer">
							{!!e.previewImageUrl && (
								<div
									className={css.embedImage}
									style={{
										backgroundImage: `url("${e.previewImageUrl}")`,
									}}
								/>
							)}

							{!!e.link && (
								<div className={css.embedLink}>
									{e.link.length > 60 ? `${e.link.substring(0, 60)}...` : e.link}
								</div>
							)}
							{e.title ? <div className={css.embedTitle}>{e.title}</div> : null}

							{!!e.text && <div className={css.embedText} dangerouslySetInnerHTML={{ __html: e.text }} />}
						</a>
					))}
				</div>
			)}
		</div>
	);
}
