const PocketBase = require('pocketbase/cjs');
const pb = new PocketBase('http://127.0.0.1:8090');
async function run() {
  try {
    await pb.admins.create({ email: 'admin@tmcp.com', password: 'password123', passwordConfirm: 'password123' });
    console.log("Admin created");
  } catch(e) { console.log(e.response); }
}
run();
