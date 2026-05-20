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
        error { errorCode message }
        logFiles
      }
    }
  }
}`;

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    // Request NO content-encoding so we get raw bytes
    https.get(url, { headers: { 'Accept-Encoding': 'br, gzip, deflate, identity' } }, res => {
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

async function decompressLog(url, label) {
  console.log(`\n=== ${label} ===`);
  const logResp = await httpsGet(url);
  console.log(`Status: ${logResp.status}, Encoding: ${logResp.headers['content-encoding']}, Size: ${logResp.data.length}`);
  console.log(`Magic: ${logResp.data.slice(0,4).toString('hex')}`);

  let text = null;
  const enc = logResp.headers['content-encoding'];

  if (enc === 'br' || (!enc && logResp.data[0] === 0x8b)) {
    try {
      text = zlib.brotliDecompressSync(logResp.data).toString('utf8');
      console.log('Brotli decompressed OK');
    } catch(e) { console.log('Brotli failed:', e.message); }
  }

  if (!text && (enc === 'gzip' || (!enc && logResp.data[0] === 0x1f && logResp.data[1] === 0x8b))) {
    try {
      text = zlib.gunzipSync(logResp.data).toString('utf8');
      console.log('Gzip decompressed OK');
    } catch(e) { console.log('Gzip failed:', e.message); }
  }

  if (!text) {
    // Try brotli anyway
    try {
      text = zlib.brotliDecompressSync(logResp.data).toString('utf8');
      console.log('Brotli decompressed OK (fallback)');
    } catch(e) {
      console.log('Brotli fallback failed:', e.message);
      text = logResp.data.toString('utf8');
      console.log('Using raw utf8');
    }
  }

  const outFile = `eas_readable_${label}.txt`;
  fs.writeFileSync(outFile, text);
  console.log(`Saved to ${outFile} (${text.length} chars)`);

  const lines = text.split('\n');
  console.log(`Total lines: ${lines.length}`);

  // Print all non-empty lines
  console.log('\n--- ALL LOG LINES ---');
  lines.forEach((l, i) => {
    if (l.trim()) console.log(`${i+1}: ${l}`);
  });
}

async function main() {
  const resp = await httpsPost('https://api.expo.dev/graphql', { query, variables: { appId: projectId } }, {
    'expo-session': sessionSecret,
    'User-Agent': 'expo-cli/1.0'
  });

  const result = JSON.parse(resp.data.toString());
  if (result.errors) { console.error('GraphQL errors:', JSON.stringify(result.errors)); return; }

  const builds = result.data.app.byId.builds;

  for (const build of builds.slice(0, 1)) {
    console.log(`Build: ${build.id}, Status: ${build.status}`);
    if (build.error) console.log(`Error: ${build.error.errorCode}`);
    if (build.logFiles && build.logFiles.length > 0) {
      await decompressLog(build.logFiles[0], build.id.substring(0, 8));
    }
  }
}

main().catch(console.error);
