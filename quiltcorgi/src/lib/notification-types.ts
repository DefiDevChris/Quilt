export const NOTIFICATION_TYPES = {
  POST_APPROVED: 'post_approved',
  POST_REJECTED: 'post_rejected',
  COMMENT_ON_POST: 'comment_on_post',
  REPLY_TO_COMMENT: 'reply_to_comment',
  BLOG_APPROVED: 'blog_approved',
  BLOG_REJECTED: 'blog_rejected',
  COMMENT_APPROVED: 'comment_approved',
} as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];
