const https = require('https');
const fs = require('fs');
const os = require('os');

const state = JSON.parse(fs.readFileSync(os.homedir() + '/.expo/state.json', 'utf8'));
const sessionSecret = state.auth.sessionSecret;
const buildId = process.argv[2] || 'b47eaf36-4f1b-4e39-ad40-7fb78d16ae09';

const query = `
query GetBuild($buildId: ID!) {
  builds {
    byId(buildId: $buildId) {
      id
      status
      createdAt
      completedAt
      artifacts { buildUrl }
      error { errorCode message }
    }
  }
}`;

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
  const resp = await httpsPost('https://api.expo.dev/graphql', { query, variables: { buildId } }, {
    'expo-session': sessionSecret,
    'User-Agent': 'expo-cli/1.0'
  });

  const result = JSON.parse(resp.data.toString());
  if (result.errors) { console.error('GraphQL errors:', JSON.stringify(result.errors)); return; }

  const build = result.data.builds.byId;
  if (!build) { console.log('Build not found'); return; }

  console.log(`Build: ${build.id}`);
  console.log(`Status: ${build.status}`);
  console.log(`Created: ${build.createdAt}`);
  if (build.completedAt) console.log(`Completed: ${build.completedAt}`);
  if (build.error) console.log(`Error: ${build.error.errorCode} — ${build.error.message}`);
  if (build.artifacts && build.artifacts.buildUrl) {
    console.log(`\n✅ APK Download URL: ${build.artifacts.buildUrl}`);
  }
}

main().catch(console.error);
