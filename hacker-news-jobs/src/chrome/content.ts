import { ChromeMessage, MessageType } from "../types";
import HackerNews from './hn-api';
import HackerNewsItem from './hn-api';

const winkNLP = require('wink-nlp');
const model = require('wink-eng-lite-web-model');

async function getKidIdsFromStory(storyId: number): Promise<number[] | null> {
    try {
        return await HackerNews.getItem(storyId)
            .then((item: any) => {
                return item['kids']
            });
    } catch {
        return null
    }
}

async function getComments(storyId: number, truncate: boolean) {
    return getKidIdsFromStory(storyId)
        .then(async (kidIds: number[] | null) => {
            if (!kidIds) {
                return null
            }
            if (truncate) {
                kidIds = kidIds.slice(0, 10);
            }
            const all = kidIds.map(id => HackerNews.getItem(id))
            return await Promise.all(all);
        });
}

const messagesFromReactAppListener = (
    message: ChromeMessage,
    sender: chrome.runtime.MessageSender
) => {
    console.log('[content.js]. Message received', {
        message,
        sender,
    })

    if (message.messageType == MessageType.JobSearch) {
        const storyParams = new URLSearchParams(window.location.search)
        const storyId = storyParams.get('id');
        if (storyId) {
            const truncate = true
            getComments(parseInt(storyId, 10), truncate)
                .then((jobPostings) => {
                    console.log(jobPostings)
                })
        }
        const nlp = winkNLP(model)
        // Acquire "its" and "as" helpers from nlp.
        const its = nlp.its;
        const as = nlp.as;

        const text = `Its quarterly profits jumped 76% to $1.13 billion for the three months to December, from $639million of previous year.`;
        const doc = nlp.readDoc(text);

        doc.entities().each((e: any) => e.markup());
        console.log(doc.out(its.markedUpText));
    }
}

/**
 * Fired when a message is sent from either an extension process or a content script.
 */
chrome.runtime.onMessage.addListener(messagesFromReactAppListener);
