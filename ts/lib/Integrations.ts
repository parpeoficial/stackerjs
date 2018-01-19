import * as url from 'url';
import { Config, Http } from './';


export namespace Integrations
{

    export class Slack
    {

        public async text(text)
        {
            return this.send({
                'icon_url': Config.get('slack.icon', 'https://s3-sa-east-1.amazonaws.com/parpe.prod/StackerJS-icon.png'),
                'username': Config.get('slack.username', 'StackerJS'),
                'channel': Config.get('slack.channel', 'general'),
                text                 
            });
        }

        public async attach(text:string, attachments:Array<SlackMessageAttachment>)
        {
            return this.send({
                'icon_url': Config.get('slack.icon', 'https://s3-sa-east-1.amazonaws.com/parpe.prod/StackerJS-icon.png'),
                'username': Config.get('slack.username', 'StackerJS'),
                'channel': Config.get('slack.channel', 'general'),
                text,
                'attachments': attachments.map(attachment => {
                    if (!attachment.text)
                        attachment.text = text;

                    if (!attachment.fallback)
                        attachment.fallback = text;

                    return attachment;
                })
            });
        }

        public async send(message:SlackMessage)
        {
            if (!this.isAbleToDoIt())
                return false;

            let {
                host, url, port
            } = this.parseUrlInformations();
            
            return new Http.MakeRequest()
                .setHost(`https://${host}`)
                .post(url, {}, message)
                .then(httpResponse => httpResponse.getContent() === 'ok');
        }

        private isAbleToDoIt()
        {
            return Config.get('slack.hook', false);
        }

        private parseUrlInformations()
        {
            let slackHook = url.parse(Config.get('slack.hook'));
            
            return {
                'host': slackHook.host,
                'url': slackHook.pathname,
                'port': slackHook.port,
                'protocol': slackHook.protocol
            }
        }

    }

    interface SlackMessage
    {

        icon_url:string;

        username:string;

        channel:string;

        text:string;

        attachments?:Array<SlackMessageAttachment>;

    }

    interface SlackMessageAttachment
    {

        fallback?:string;

        pretext?:string;

        text?:string;

        color:string;

        fields:Array<SlackMessageAttachmentField>;

    }

    interface SlackMessageAttachmentField
    {

        title:string;

        value:string;

        shot:boolean;

    }

}