export type * from './types';
export { MESSAGE_THREADS, filterThreads } from './data/mock-data';
export {
	loadMessageThreads,
	loadMessageRecipients,
	sendMessage,
	markMessageRead,
	toggleMessageStar,
	type MessageRecipient
} from './services/messages-data';
