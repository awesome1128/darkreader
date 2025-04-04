import {MessageType} from '../../../src/utils/message';
import type {Message} from '../../../src/definitions';

let nativeSendMessage: typeof chrome.runtime.sendMessage;
const bgResponses = new Map<string, string>();

export function stubChromeRuntimeMessage(): void {
    nativeSendMessage = chrome.runtime.sendMessage;
    const listeners: Array<(message: Message) => void> = (chrome.runtime.onMessage as any)['__listeners__'];

    (chrome.runtime as any).sendMessage = (message: Message) => {
        if (message.type === MessageType.CS_FETCH) {
            const {id, data: {url}} = message;
            setTimeout(() => {
                listeners.forEach((listener) => {
                    if (!bgResponses.has(url)) {
                        throw new Error('Response is missing, use `stubBackgroundFetchResponse()`');
                    }
                    const data = bgResponses.get(url);
                    listener({type: MessageType.BG_FETCH_RESPONSE, data, error: null, id});
                });
            });
        }
    };
}

export function resetChromeRuntimeMessageStub(): void {
    chrome.runtime.sendMessage = nativeSendMessage;
    bgResponses.clear();
}

export function stubBackgroundFetchResponse(url: string, content: string): void {
    bgResponses.set(url, content);
}

const urlResponses = new Map<string, string>();
export function stubChromeRuntimeGetURL(path: string, url: string): void {
    urlResponses.set(path, url);
    (chrome.runtime as any).getURL = (path: string) => {
        return urlResponses.get(path);
    };
}
