const { expect } = require('chai');
const { Config, Integrations } = require('./../../lib');


describe.only('IntegrationsTest', () => 
{

    describe('SlackTest', () => 
    {
        it('Should send text without trouble', done => 
        {
            let slack = new Integrations.Slack();            
            slack.text(`Today is ${new Date()} and we're testing SlackJS`)
                .then(response => expect(response).to.be.true)
                .then(() => done());
        });

        it('Should send attachments withoutr trouble', done => 
        {
            new Integrations.Slack()
                .attach('Brand new error tested', [
                    {
                        'fallback': 'Some error here',
                        'pretext': 'Some error',
                        'text': 'Error got even further',
                        'color': "#D00000",
                        'fields': [
                            {
                                'title': 'Error title',
                                'value': 'Error on line 9999',
                                'short': true
                            }
                        ]
                    }
                ])
                .then(response => expect(response).to.be.true)
                .then(() => done());
        });

        it('Should present error when slack information is invalid', done => 
        {
            let slackHooked = Config.get('slack.hook'),
                slack = new Integrations.Slack();

            Config.delete('slack.hook');
            slack.text("It's time... for an error")
                .then(response => expect(response).to.be.false)
                .then(() => Config.set('slack.hook', slackHooked))
                .then(() => done());
        });
    });

});