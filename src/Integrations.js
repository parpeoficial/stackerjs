import { Config } from "stackerjs-utils";
import { Http } from "stackerjs-http";

class Slack 
{
    async text(text) 
    {
        return this.send({
            icon_url: Config.get(
                "integrations.slack.icon",
                "https://s3-sa-east-1.amazonaws.com/parpe.prod/StackerJS-icon.png"
            ),
            username: Config.get("integrations.slack.username", "StackerJS"),
            channel: Config.get("integrations.slack.channel", "general"),
            text
        });
    }

    async attach(text, attachments) 
    {
        return this.send({
            icon_url: Config.get(
                "integrations.slack.icon",
                "https://s3-sa-east-1.amazonaws.com/parpe.prod/StackerJS-icon.png"
            ),
            username: Config.get("integrations.slack.username", "StackerJS"),
            channel: Config.get("integrations.slack.channel", "general"),
            text,
            attachments: attachments.map(attachment => 
            {
                if (!attachment.text) attachment.text = text;

                if (!attachment.fallback) attachment.fallback = text;

                return attachment;
            })
        });
    }

    async send(message) 
    {
        if (!this.isAbleToDoIt()) return false;

        return new Http.MakeRequest()
            .setTimeout(4000)
            .post(Config.get("integrations.slack.hook"), {}, message)
            .then(httpResponse => httpResponse.getContent() === "ok");
    }

    isAbleToDoIt() 
    {
        return Config.get("integrations.slack.hook", false);
    }
}

export const Integrations = { Slack };

// interface SlackMessage
// {

//     icon_url:string;

//     username:string;

//     channel:string;

//     text:string;

//     attachments?:Array<SlackMessageAttachment>;

// }

// interface SlackMessageAttachment
// {

//     fallback?:string;

//     pretext?:string;

//     text?:string;

//     color:string;

//     fields:Array<SlackMessageAttachmentField>;

// }

// interface SlackMessageAttachmentField
// {

//     title:string;

//     value:string;

//     short?:boolean;

// }
