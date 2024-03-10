process.env.BOT_URL = "http://localhost:9001";

const envs = [
    "VEN_ID",
    "ADMINS",


    "CHANNELS_CHANNEL_NAME",
    "CHANNELS_CHANNEL_ID",

    "CHANNELS_GROUP_NAME",
    "CHANNELS_GROUP_ID",


    "BETACHANNELS_CHANNEL_NAME",
    "BETACHANNELS_CHANNEL_ID",

    "BETACHANNELS_GROUP_NAME",
    "BETACHANNELS_GROUP_ID",


    "DEVCHANNELS_CHANNEL_NAME",
    "DEVCHANNELS_CHANNEL_ID",

    "DEVCHANNELS_GROUP_NAME",
    "DEVCHANNELS_GROUP_ID",
];

for (const env of envs) {
    process.env[env] = "INVALID";
}

process.env["VEN_ID"] = "621";
process.env["ADMINS"] = "2,3";