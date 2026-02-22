const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://127.0.0.1:8090');

async function createMockData() {
    try {
        // Authenticate as a user first or admin (we created admin@tmcp.com earlier)
        await pb.admins.authWithPassword('admin@tmcp.com', 'password123');
        
        // 1. Create a workspace
        const ws = await pb.collection('workspaces').create({
            name: 'Test Workspace',
            owner_id: pb.authStore.model.id,
            members: [pb.authStore.model.id]
        });
        
        // 2. Create a brand identity
        const brand = await pb.collection('brand_identities').create({
            workspace_id: ws.id,
            brand_name: 'TestCorp',
            voice_and_tone: 'Professional and authoritative',
            core_messaging: {
                slogan: 'Building the future',
                mission_statement: 'To provide excellent testing tools.',
                keywords: ['reliability', 'innovation', 'testing']
            },
            visual_assets: {
                color_palette: ['#FF0000', '#00FF00']
            }
        });
        
        console.log('Created Brand ID:', brand.id);
    } catch(err) {
        console.error('Error creating data:', err.response || err);
    }
}
createMockData();
