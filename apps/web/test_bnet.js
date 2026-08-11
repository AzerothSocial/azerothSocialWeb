require('dotenv').config({ path: '.env.local' });

async function run() {
  const clientId = process.env.BNET_CLIENT_ID;
  const clientSecret = process.env.BNET_CLIENT_SECRET;
  
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenRes = await fetch('https://oauth.battle.net/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const { access_token } = await tokenRes.json();
  
  const equipRes = await fetch(
    `https://us.api.blizzard.com/profile/wow/character/azralon/monjairo/equipment?namespace=profile-us&locale=en_US`,
    {
      headers: { 'Authorization': `Bearer ${access_token}` }
    }
  );
  const equipData = await equipRes.json();
  
  if (equipData.equipped_items && equipData.equipped_items.length > 0) {
    const item = equipData.equipped_items[0];
    console.log("ITEM:", JSON.stringify(item, null, 2));
    
    // Check if item.media exists
    if (item.media) {
       console.log("Media exists:", item.media.id);
       // Test fetch media
       const mediaRes = await fetch(`https://us.api.blizzard.com/data/wow/media/item/${item.media.id}?namespace=static-us&locale=en_US&access_token=${access_token}`);
       const mediaData = await mediaRes.json();
       console.log("MEDIA DATA:", JSON.stringify(mediaData, null, 2));
    } else {
       // Maybe item.item.id is what we need to fetch media?
       console.log("Media does not exist on item directly. Try item.item.id");
       const mediaRes = await fetch(`https://us.api.blizzard.com/data/wow/media/item/${item.item.id}?namespace=static-us&locale=en_US&access_token=${access_token}`);
       const mediaData = await mediaRes.json();
       console.log("MEDIA DATA FROM ITEM ID:", JSON.stringify(mediaData, null, 2));
    }
  }
}

run();
