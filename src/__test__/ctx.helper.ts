import { Context } from "grammy";
import type { Animation, Chat, Document, PhotoSize, Video } from "grammy/types";

export function createPrivateCTX(
  msgText?: string,
  message_id = 0,
  from_id = 0,
  to_id = 0,
  first_name = "Test",
  animation?: Animation,
  photo?: PhotoSize[],
  video?: Video,
  reply_to_message?: {
    reply_to_message_id: number;
    video?: Video;
    photo?: PhotoSize[];
    animation?: Animation;
    document?: Document;
  }

): Partial<Context> {
  return {
    reply: jest.fn(),
    message: {
      chat: {
        id: to_id,
        first_name: first_name,
        type: "private",
      },
      from: {
        id: from_id,
        first_name: first_name,
        is_bot: false,
      },
      date: Date.now(),
      text: msgText,
      message_id: message_id,
      animation: animation,
      video: video,
      photo: photo,
      reply_to_message: {
        chat: {
            id: to_id,
            first_name: first_name,
            type: "private",
        },
        video: reply_to_message?.video,
        photo: reply_to_message?.photo,
        animation: reply_to_message?.animation,
        document: reply_to_message?.document,
        reply_to_message: undefined,
        date: Date.now(),
        message_id: message_id,
      }
    },
  };
}


export function createSupergroupCTX(
    msgText?: string,
    message_id = 0,
    from_id = 0,
    to_id = 0,
    first_name = "Test",
    animation?: Animation,
    photo?: PhotoSize[],
    video?: Video,
    reply_to_message?: {
      reply_to_message_id: number;
    }
): Partial<Context> {
    return {
        reply: jest.fn(),
        message: {
          chat: {
            id: to_id,
            title: "TestSuperGroup",
            type: "supergroup",
          },
          from: {
            id: from_id,
            first_name: first_name,
            is_bot: false,
          },
          date: Date.now(),
          text: msgText,
          message_id: message_id,
          animation: animation,
          video: video,
          photo: photo,
          reply_to_message: {
            chat: {
                id: to_id,
                title: "TestSuperGroup",
                type: "supergroup",
            },
            reply_to_message: undefined,
            date: Date.now(),
            message_id: message_id,
          }
        },
      };
}


export function createGroupCTX(  
    msgText?: string,
    message_id = 0,
    from_id = 0,
    to_id = 0,
    title = "TestGroup",
    animation?: Animation,
    photo?: PhotoSize[],
    video?: Video,
    reply_to_message?: {
      reply_to_message_id: number;
    }): Partial<Context> {
        return {
            reply: jest.fn(),
            message: {
              chat: {
                id: to_id,
                title: title,
                type: "group",
              },
              from: {
                id: from_id,
                first_name: title,
                is_bot: false,
              },
              date: Date.now(),
              text: msgText,
              message_id: message_id,
              animation: animation,
              video: video,
              photo: photo,
              reply_to_message: {
                chat: {
                    id: to_id,
                    title: title,
                    type: "group",
                },
                reply_to_message: undefined,
                date: Date.now(),
                message_id: message_id,
              }
            },
          };

}


type chatType = "private" | "group" | "supergroup";
