export const ReactQueryKey = {
	mailDetails: (id: string, addresses: string[]) => ['mail-details', id, addresses.join(',')],

	communityPost: (postId: string) => ['community', 'post', postId],
	communityNewOfficialPosts: (communityId: string) => ['community', communityId, 'new-posts', 'official'],
	communityNewDiscussionPosts: (communityId: string) => ['community', communityId, 'new-posts', 'official'],
	communityAdmins: (communityId: string) => ['community', communityId, 'admins'],
	communityServiceStatus: () => ['community', 'service-status'],
};
