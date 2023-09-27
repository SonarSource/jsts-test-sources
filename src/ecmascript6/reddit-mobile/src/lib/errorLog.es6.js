import superagent from 'superagent';

function simpleUA(agent) {
  if (/server/i.test(agent)) { return 'server'; }
  if (/iPhone/i.test(agent)) { return 'ios'; }
  if (/android/i.test(agent)) { return 'android'; }
  
  return 'unknownClient';
}

function formatLog(details) {
  if (!details) { return; }

  let {userAgent, message, url, line, column, requestUrl} = details;
  let errorString = [userAgent || 'UNKNOWN'];

  errorString.push(message || 'NO MESSAGE');
  errorString.push(requestUrl || 'NO REQUEST URL');

  if (url) {
    errorString.push(url);

    if (line && typeof column !== 'undefined') {
      errorString.push(`${line}:${column}`);
    }
  }

  return errorString.join('\t');
}

function errorLog(details, errorEndpoints, config={}) {
  let formattedLog = formatLog(details);
  console.log(formattedLog);

  if (config.debugLevel === 'info') {
    if (details.error && details.error.stack) {
      console.log(details.error.stack);
    }
  }

  // send to statsd
  if (errorEndpoints.hivemind) {
    let ua = simpleUA(details.userAgent || '');
    hivemind(ua, errorEndpoints.hivemind);
  }

  // log to winston, soon
}

function hivemind(ua, endpoint) {
  let data = {
    mwebError: {},
  };

  data.mwebError[ua] = 1;

  superagent
    .post(endpoint)
    .type('json')
    .send(data)
    .timeout(3000)
    .end(function(){ });
}

export default errorLog;
