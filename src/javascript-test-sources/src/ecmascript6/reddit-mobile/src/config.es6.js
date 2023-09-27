// This configuration is shared with the client. Any hidden, server-only config
// belongs in ./server instead.
import crypto from 'crypto'

let globalMessage = {
  frontPageOnly: true,
  text: 'We’re [updating our privacy policy](https://www.reddit.com/r/announcements/comments/3tlcil/we_are_updating_our_privacy_policy_effective_jan/), to take effect on January 1, 2016. By continuing to use m.reddit.com, you agree to the [new privacy policy](https://www.reddit.com/help/privacypolicy)',
  expires: 'Jan 01, 2016'
};

if (globalMessage) {
  const sha = crypto.createHash('sha1');
  if (!globalMessage.text) {
    throw 'Global message defined with no text'
  }
  sha.update(globalMessage.text);
  globalMessage.key = sha.digest('hex');
}

function config() {
  return {
    https: process.env.HTTPS === 'true',
    httpsProxy: process.env.HTTPS_PROXY === 'true',

    debugLevel: process.env.DEBUG_LEVEL,

    minifyAssets: process.env.MINIFY_ASSETS === 'true',

    assetPath: process.env.STATIC_BASE || '',

    origin: process.env.ORIGIN || 'http://localhost:4444',
    port: process.env.PORT || 4444,
    env: process.env.NODE_ENV || 'development',

    nonAuthAPIOrigin: process.env.NON_AUTH_API_ORIGIN || 'https://www.reddit.com',
    authAPIOrigin: process.env.AUTH_API_ORIGIN || 'https://oauth.reddit.com',

    reddit: process.env.REDDIT || 'https://www.reddit.com',

    googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID,

    loginPath: process.env.LOGIN_PATH || '/oauth2/login',

    statsDomain: process.env.STATS_DOMAIN || 'https://stats.redditmedia.com/',
    adsPath: process.env.ADS_PATH ||  '/api/request_promo.json',
    manifest: {},

    trackerKey: process.env.TRACKER_KEY,
    trackerEndpoint: process.env.TRACKER_ENDPOINT,
    trackerClientName: process.env.TRACKER_CLIENT_NAME,

    // hack for now for global messages displayed with the infobar component.
    globalMessage: globalMessage,
  };
};

export default config;
