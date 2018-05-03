const { Config } = require("stackerjs-utils");

module.exports = {
    slack: {
        icon: Config.env(
            "SLACK_ICON",
            "https://s3-sa-east-1.amazonaws.com/parpe.prod/StackerJS-icon.png"
        ),
        hook: Config.env("SLACK_HOOK"),
        channel: Config.env("SLACK_CHANNEL")
    }
};
