const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_IFDTsOb6PUB1@ep-floral-dream-aiqni3bk-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=verify-full&channel_binding=require',
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT * FROM app_settings");
    let banners = [];
    
    // Find existing banners
    for (const row of res.rows) {
      if (row.key === 'home_banners') {
        try {
           banners = JSON.parse(row.value) || [];
        } catch(e) {}
      }
    }
    
    // Add default banner at the beginning
    const defaultBanner = {
      heading: "Welcome to Doctivo",
      paragraph: "Your trusted partner for accessible and organized healthcare.",
      ctaText: "Book Now",
      ctaLink: "/doctors",
      bgColor: "bg-gradient-to-r from-blue-500 to-blue-600",
      imageUrl: "/modern_clinic.jpg"
    };
    
    // check if it already exists
    if (!banners.some(b => b.heading === 'Welcome to Doctivo')) {
        banners.unshift(defaultBanner);
        await client.query(
          "INSERT INTO app_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
          ['home_banners', JSON.stringify(banners)]
        );
        console.log("Pushed default banner to DB!");
    } else {
        console.log("Default banner already exists in DB.");
    }
    
  } finally {
    client.release();
    pool.end();
  }
}
main();
