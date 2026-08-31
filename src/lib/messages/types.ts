export type MessageFolder = 'inbox' | 'sent' | 'starred';

export interface MessageThread {
	id: string;
	from: string;
	role: string;
	subject: string;
	preview: string;
	body: string;
	time: string;
	unread: boolean;
	starred: boolean;
	folder: MessageFolder;
}
