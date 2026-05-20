const https = require('https');
const zlib = require('zlib');
const fs = require('fs');
const os = require('os');

const state = JSON.parse(fs.readFileSync(os.homedir() + '/.expo/state.json', 'utf8'));
const sessionSecret = state.auth.sessionSecret;
const projectId = 'f06deb5f-7002-42e3-b7b6-051f21addbd4';

const query = `
query GetBuilds($appId: String!) {
  app {
    byId(appId: $appId) {
      builds(limit: 3, offset: 0) {
        id
        status
        createdAt
        error { errorCode message }
        logFiles
      }
    }
  }
}`;

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept-Encoding': 'identity' } }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, data: Buffer.concat(chunks) }));
    }).on('error', reject);
  });
}

function httpsPost(url, body, headers) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const opts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers }
    };
    const req = https.request(url, opts, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, data: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Querying EAS builds...');
  const resp = await httpsPost('https://api.expo.dev/graphql', { query, variables: { appId: projectId } }, {
    'expo-session': sessionSecret,
    'User-Agent': 'expo-cli/1.0'
  });

  const result = JSON.parse(resp.data.toString());
  if (result.errors) {
    console.error('GraphQL errors:', JSON.stringify(result.errors, null, 2));
    return;
  }

  const builds = result.data.app.byId.builds;
  console.log(`Found ${builds.length} builds`);

  for (const b of builds) {
    console.log(`\nBuild: ${b.id}`);
    console.log(`Status: ${b.status}, Created: ${b.createdAt}`);
    if (b.error) console.log(`Error: ${b.error.errorCode} — ${b.error.message}`);

    if (b.logFiles && b.logFiles.length > 0) {
      const logUrl = b.logFiles[0];
      console.log(`Log URL: ${logUrl.substring(0, 80)}...`);

      const logResp = await httpsGet(logUrl);
      console.log(`Log size: ${logResp.data.length} bytes, status: ${logResp.status}`);

      let text;
      try {
        text = zlib.gunzipSync(logResp.data).toString('utf8');
        console.log('Decompressed with gunzip');
      } catch {
        try {
          text = zlib.inflateSync(logResp.data).toString('utf8');
          console.log('Decompressed with inflate');
        } catch {
          text = logResp.data.toString('utf8');
          console.log('Using raw text');
        }
      }

      const outFile = `eas_log_${b.id.substring(0,8)}.txt`;
      fs.writeFileSync(outFile, text);
      console.log(`Saved to ${outFile}`);

      // Print lines with keywords
      const keywords = ['error', 'Error', 'ERROR', 'FAILED', 'Exception', 'GRADLE', 'Build'];
      const lines = text.split('\n');
      console.log(`\n--- Key lines from ${b.id.substring(0,8)} ---`);
      let count = 0;
      for (const line of lines) {
        if (keywords.some(k => line.includes(k)) && count < 60) {
          console.log(line);
          count++;
        }
      }
    }
  }
}

main().catch(console.error);
