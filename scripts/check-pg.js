const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://admin:password@localhost:5432/requisition_db?schema=public'
  });

  try {
    await client.connect();
    
    // Check organizations
    const orgRes = await client.query('SELECT * FROM organizations LIMIT 1');
    let orgId;
    
    if (orgRes.rows.length === 0) {
      const insertOrg = await client.query(
        "INSERT INTO organizations (name, contactEmail, isActive, subscriptionPlan, createdAt, updatedAt) VALUES ('Default Org', 'org@example.com', true, 'FREE', NOW(), NOW()) RETURNING id"
      );
      orgId = insertOrg.rows[0].id;
      console.log("Created default organization.");
    } else {
      orgId = orgRes.rows[0].id;
    }

    // Check users
    const userRes = await client.query('SELECT * FROM users');
    
    if (userRes.rows.length > 0) {
      console.log("\nFound existing users:");
      for (const u of userRes.rows) {
        console.log(`- ${u.email} (${u.role})`);
      }
      
      // Let's reset the password of the first admin to something known
      const admin = userRes.rows.find(u => u.role === 'ADMIN') || userRes.rows[0];
      const newHash = await bcrypt.hash('password123', 10);
      await client.query('UPDATE users SET passwordHash = $1 WHERE id = $2', [newHash, admin.id]);
      
      console.log(`\nI reset the password for ${admin.email} to: password123`);
    } else {
      const newHash = await bcrypt.hash('password123', 10);
      await client.query(
        "INSERT INTO users (organization_id, email, fullName, role, passwordHash, isActive, createdAt) VALUES ($1, 'admin@example.com', 'Admin User', 'ADMIN', $2, true, NOW())",
        [orgId, newHash]
      );
      console.log("\nCreated new default user:");
      console.log("Email: admin@example.com");
      console.log("Password: password123");
    }

  } catch (err) {
    console.error('Error:', err.message);
    if (err.message.includes('ECONNREFUSED')) {
      console.log("\nLocal database is not running! Make sure to start Docker Compose or PostgreSQL.");
    }
  } finally {
    await client.end();
  }
}

main();
