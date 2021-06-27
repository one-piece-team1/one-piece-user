/*eslint no-useless-escape: "off"*/
import { execSync } from 'child_process';
import dotenv from 'dotenv';

/**
 * @description Get Package Version
 * @private
 * @returns {string}
 */
const packageVersionGetter = (): string => {
  const version_buffer = execSync(
    `echo $(cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[\",]//g' | tr -d '[[:space:]]')`,
  );
  return version_buffer ? version_buffer.toString() : '1.0.1';
};

/**
 * @description Get Package Name
 * @private
 * @returns {string}
 */
const packageNameGetter = (): string => {
  const name_buffer = execSync(
    `echo $(cat package.json | grep name | head -1 | awk -F: '{ print $2 }' | sed 's/[\",]//g' | tr -d '[[:space:]]')`,
  );
  return name_buffer ? name_buffer.toString() : 'one-piece-user';
};

/**
 * @description Get Package Description
 * @private
 * @returns {string}
 */
const packageDescriptionGetter = (): string => {
  const description_buffer = execSync(
    `echo $(cat package.json | grep description | head -1 | awk -F: '{ print $2 }' | sed 's/[\",]//g' | tr -d '[[:space:]]')`,
  );
  return description_buffer
    ? description_buffer.toString()
    : 'service evaluate open api';
};

// load config
dotenv.config();

const env = process.env.NODE_ENV || 'development';
const configs = {
  base: {
    ENV: env,
    DEV: env === 'development',
    // Pkg Base
    NAME: packageNameGetter(),
    DESCRIPTION: packageDescriptionGetter(),
    // API
    PREFIX: process.env.APPAPIPREFIX || '',
    VERSION: packageVersionGetter(),
    API_EXPLORER_PATH: process.env.APPAPIEXPLORERPATH || '',
    // Server Setting
    PROTOCL: process.env.APPPROTOCOL || 'http',
    HOST: process.env.APPHOST || 'localhost',
    PORT: process.env.APPPORT || 7071,
    
    COMPANY_LINK: {
      FB: "http://www.facebook.com/",
      TWITTER: "http://www.twitter.com/",
    },

    JWT: {
      KEY: process.env.JWTKEY || 'lib',
      SECRET: process.env.JWTSECRET || 'lib',
    },

    CLOUDINARY: {
      NAME: process.env.CLOUDINARY_APINAME,
      KEY: process.env.CLOUDINARY_APIKEY,
      SECRET: process.env.CLOUDINARY_APISECRET,
      URL: process.env.CLOUDINARY_APIURL,
    },

    GOOGLE: {
      ID: process.env.GOOGLEAUTHID,
      SECRET: process.env.GOOGLEAUTHSECRET,
      CALLBACKURL: process.env.GOOGLEAUTHCALLBACKURL,
      USER: process.env.GOOGLEMAILSUER,
      PASS: process.env.GOOGLEMAILPASS,
    },

    FB: {
      ID: process.env.FBAUTHID,
      SECRET: process.env.FBAUTHSECRET,
      CALLBACKURL: process.env.FBAUTHCALLBACKURL,
    },

    EVENT_STORE_SETTINGS: {
      protocol: process.env.EVENTSTOREPROTOCOL || 'amqp',
      hostname: process.env.EVENTSTOREHOSTNAME || 'localhost',
      tcpPort: process.env.EVENTSTORETCPPORT || 5672,
      dbHost: process.env.EVENTSTOREHOSTNAME || 'localhost',
      dbPort: process.env.EVENTSTOREDBPORT || 1113,
      username: process.env.EVENTSTOREUSERNAME || 'postgres',
      password: process.env.EVENTSTOREPASSWORD || '123',
      database: process.env.EVENTSTOREDATABASE || 'onepiece',
      schema: process.env.EVENTSTORESCHEMA || 'public',
      credentials: {
        username: process.env.EVENTSTORECREDENTIALSUSERNAME || 'lib-test',
        password: process.env.EVENTSTORECREDENTIALSPASSWORD || '12345678',
      },
      poolOptions: {
        min: process.env.EVENTSTOREPOOLOPTIONSMIN || 1,
        max: process.env.EVENTSTOREPOOLOPTIONSMAX || 10,
      },
      bootstrapServers: process.env.KAFKA_BOOTSTRAP_SERVERS || 'localhost:9094',
      secureProtocol: process.env.KAFKA_SECURITY_PROTOCOL || 'SASL_SSL',
      saslMechanisms: process.env.KAFKA_SASL_MECHANISMS || 'PLAIN',
      user: {
        groupId: process.env.KAFKA_USER_CONSUMER_GROUP || 'onepiece-topic-user-groups',
      },
      trip: {
        groupId: process.env.KAFKA_TRIP_CONSUMER_GROUP || 'onepiece-topic-trip-groups',
      },
      locale: {
        groupId: process.env.KAFKA_LOCALE_CONSUMER_GROUP || 'onepiece-topic-locale-groups',
      },
      chat: {
        groupId: process.env.KAFKA_CHAT_CONSUMER_GROUP || 'onepiece-topic-chat-groups',
      },
      topics: {
        gateWayEvent: process.env.KAFKA_GATEWAY_EVENT_TOPIC || 'onepiece-gateway-event',
        userEvent: process.env.KAFKA_USER_EVENT_TOPIC || 'onepiece-user-event',
        tripEvent: process.env.KAFKA_TRIP_EVENT_TOPIC || 'onepiece-trip-event',
        localeEvent: process.env.KAFKA_LOCALE_EVENT_TOPIC || 'onepiece-locale-event',
        chatEvent: process.env.KAFKA_CHAT_EVENT_TOPIC || 'onepiece-chat-event',
      }
    },

    DB_SETTINGS: {
      host: process.env.DBHOST || 'localhost',
      port: process.env.DBPORT || 5434,
      username: process.env.DBUSERNAME || 'postgres',
      password: process.env.DBPASSWORD || '123',
      database: process.env.DBDATABASE || 'onepiece',
      schema: process.env.DBSCHEMA || 'public',
      userTable: process.env.DBUSERTABLE || 'user',
    },

    REDIS_URL: process.env.REDIS_URL || "redis://127.0.0.1:6382",

    GEO_CONFIGS: {
      key: process.env.GEOKEY,
      secret: process.env.GEOSECRET
    }
  },
  development: {},
  production: {
    PORT: process.env.APPPORT || 7071,
  },
  test: {
    PORT: 7071,
  },
};

const config = { ...configs.base, ...configs[env] };

export { config };
