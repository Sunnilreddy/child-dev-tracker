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
      builds(limit: 1, offset: 0) {
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
    https.get(url, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data: Buffer.concat(chunks) }));
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
  const resp = await httpsPost('https://api.expo.dev/graphql', { query, variables: { appId: projectId } }, {
    'expo-session': sessionSecret,
    'User-Agent': 'expo-cli/1.0'
  });

  const result = JSON.parse(resp.data.toString());
  if (result.errors) { console.error('GraphQL errors:', JSON.stringify(result.errors)); return; }

  const build = result.data.app.byId.builds[0];
  console.log(`Build: ${build.id}, Status: ${build.status}`);
  if (build.error) console.log(`Error: ${build.error.errorCode} — ${build.error.message}`);

  const logUrl = build.logFiles[0];
  console.log(`Downloading log...`);

  const logResp = await httpsGet(logUrl);
  console.log(`Status: ${logResp.status}, Content-Encoding: ${logResp.headers['content-encoding']}, Size: ${logResp.data.length}`);
  console.log(`First 4 bytes: ${logResp.data.slice(0,4).toString('hex')}`);

  // Save raw binary
  fs.writeFileSync('eas_raw.bin', logResp.data);
  console.log('Saved raw binary to eas_raw.bin');

  // Try decompress
  let text = null;

  // Check magic bytes
  const magic = logResp.data.slice(0, 2);
  if (magic[0] === 0x1f && magic[1] === 0x8b) {
    console.log('Detected GZIP');
    try { text = zlib.gunzipSync(logResp.data).toString('utf8'); console.log('Gunzip OK'); }
    catch(e) { console.log('Gunzip failed:', e.message); }
  }

  if (!text) {
    // Try deflate
    try { text = zlib.inflateSync(logResp.data).toString('utf8'); console.log('Inflate OK'); }
    catch(e) { console.log('Inflate failed:', e.message); }
  }

  if (!text) {
    // Try raw deflate
    try { text = zlib.inflateRawSync(logResp.data).toString('utf8'); console.log('InflateRaw OK'); }
    catch(e) { console.log('InflateRaw failed:', e.message); }
  }

  if (!text) {
    // Maybe it's just text but binary-looking due to encoding
    text = logResp.data.toString('latin1');
    console.log('Using latin1 encoding');
  }

  fs.writeFileSync('eas_log_decoded.txt', text);
  console.log(`Decoded log saved (${text.length} chars)`);

  // Print lines with error keywords
  const lines = text.split('\n');
  console.log(`Total lines: ${lines.length}`);

  // Print all lines that look readable (ASCII printable)
  const readable = lines.filter(l => {
    const printable = l.split('').filter(c => c.charCodeAt(0) >= 32 && c.charCodeAt(0) < 127);
    return printable.length > l.length * 0.7 && l.trim().length > 5;
  });

  console.log(`\n--- Readable lines (${readable.length}) ---`);
  readable.slice(0, 100).forEach(l => console.log(l.trim()));
}

main().catch(console.error);
