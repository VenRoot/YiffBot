import * as dotenv from "dotenv";

dotenv.config();

interface Group {
  name: string;
  id: number;
}

interface Channels {
  channel: Group;
  group: Group;
}

interface RootObject {
  VenID: number;
  admins: number[];
  channels: Channels;
  betaChannels: Channels;
  devChannels: Channels;
}

const parseArray = (str: string): number[] => str.split(",").map(Number);

const parseGroup = (prefix: string): Group => ({
  name: process.env[`${prefix}_NAME`]!,
  id: parseInt(process.env[`${prefix}_ID`]!, 10),
});

const config: RootObject = {
  VenID: parseInt(process.env.VEN_ID ?? "0", 10),
  admins: parseArray(process.env.ADMINS ?? "0"),
  channels: {
    channel: parseGroup("CHANNELS_CHANNEL"),
    group: parseGroup("CHANNELS_GROUP"),
  },
  betaChannels: {
    // Füge hier die entsprechenden Umgebungsvariablen und die Logik zu deren Parsing hinzu
    channel: parseGroup("BETACHANNELS_CHANNEL"),
    group: parseGroup("BETACHANNELS_GROUP"),
  },
  devChannels: {
    // Füge hier die entsprechenden Umgebungsvariablen und die Logik zu deren Parsing hinzu
    channel: parseGroup("DEVCHANNELS_CHANNEL"),
    group: parseGroup("DEVCHANNELS_GROUP"),
  },
};


function checkENV() {
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
        if (!process.env[env]) {
            throw new Error(`Missing environment variable: ${env}`);
        }
    }
}

checkENV();

export default config;