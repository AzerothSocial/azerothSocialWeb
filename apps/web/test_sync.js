const fs = require('fs');

function loadEnv() {
  const env = fs.readFileSync('.env.local', 'utf8');
  env.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/['"]/g, '');
    }
  });
}

async function testSync() {
  loadEnv();
  const clientId = process.env.BNET_CLIENT_ID;
  const clientSecret = process.env.BNET_CLIENT_SECRET;

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenRes = await fetch('https://oauth.battle.net/token', {
    method: 'POST',
    headers: { 'Authorization': `Basic ${authHeader}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  const { access_token } = await tokenRes.json();

  const lbRes = await fetch('https://us.api.blizzard.com/data/wow/pvp-season/41/pvp-leaderboard/index?namespace=dynamic-us&locale=en_US', {
    headers: { 'Authorization': `Bearer ${access_token}` }
  });
  console.log(await lbRes.text());
}
testSync();
