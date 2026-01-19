const bcrypt = require('bcryptjs');

async function hashPassword() {
  const password = process.argv[2] || 'password123';
  const hash = await bcrypt.hash(password, 10);
  console.log('\nPassword:', password);
  console.log('Hash:', hash);
  console.log('\nCopy the hash above to use in SQL queries.\n');
}

hashPassword();