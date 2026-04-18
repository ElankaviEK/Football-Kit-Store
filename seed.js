const db = require('./config/database');
const bcrypt = require('bcrypt');

async function seed() {
  console.log('Seeding database...');

  // Create admin user
  const adminExists = db.prepare('SELECT id FROM users WHERE email = ?').get('admin@kitstore.com');
  if (!adminExists) {
    const hash = await bcrypt.hash('Admin@123', 12);
    db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('Admin', 'admin@kitstore.com', hash, 'admin');
    console.log('Admin created: admin@kitstore.com / Admin@123');
  }

  // Create demo customer
  const customerExists = db.prepare('SELECT id FROM users WHERE email = ?').get('john@example.com');
  if (!customerExists) {
    const hash = await bcrypt.hash('Customer@123', 12);
    db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)').run('John Doe', 'john@example.com', hash, 'customer');
    console.log('Customer created: john@example.com / Customer@123');
  }

 const products = [
  { name: 'Manchester United Home Jersey 2024', description: 'Official Manchester United home kit. Red and black design.', price: 89.99, stock: 25, category: 'Jersey', image: '/images/mu.jpg' },
  { name: 'Real Madrid Home Jersey 2024', description: 'Official Real Madrid home kit. Classic all-white design.', price: 94.99, stock: 20, category: 'Jersey', image: '/images/rm.jpg' },
  { name: 'Barcelona Home Jersey 2024', description: 'Official FC Barcelona home jersey. Blue and red stripes.', price: 89.99, stock: 18, category: 'Jersey', image: '/images/barca.jpg' },
  { name: 'Liverpool Home Jersey 2024', description: 'Official Liverpool FC home jersey. Iconic all-red design.', price: 84.99, stock: 30, category: 'Jersey', image: '/images/lfc.jpg' },
  { name: 'Manchester City Home Jersey 2024', description: 'Official Manchester City home jersey. Sky blue with white trim.', price: 84.99, stock: 22, category: 'Jersey', image: '/images/mancity.jpg' },
  { name: 'Arsenal Home Jersey 2024', description: 'Official Arsenal home jersey. Classic red and white design.', price: 84.99, stock: 28, category: 'Jersey', image: '/images/arsenal.jpg' },
  { name: 'Brazil National Team Jersey 2024', description: 'Official Brazil national team jersey. Iconic yellow with green.', price: 99.99, stock: 15, category: 'National', image: '/images/brazil.jpg' },
  { name: 'Ireland National Team Jersey 2024', description: 'Official Republic of Ireland home jersey. Classic green.', price: 79.99, stock: 35, category: 'National', image: '/images/ireland.jpg' },
  { name: 'Football Shorts - Black', description: 'Lightweight performance football shorts.', price: 29.99, stock: 50, category: 'Shorts', image: '/images/shorts.jpg' },
  { name: 'Football Training Kit Set', description: 'Complete training kit including jersey, shorts and socks.', price: 59.99, stock: 20, category: 'Kit', image: '/images/kit.jpg' },
  { name: 'Goalkeeper Jersey - Green', description: 'Professional goalkeeper jersey with padded elbows.', price: 74.99, stock: 12, category: 'Goalkeeper', image: '/images/gk.jpg' },
  { name: 'Chelsea Away Jersey 2024', description: 'Official Chelsea FC away jersey. Yellow with blue accents.', price: 84.99, stock: 17, category: 'Jersey', image: '/images/chelsea.jpg' },
];
    const stmt = db.prepare('INSERT INTO products (name, description, price, stock, category, image) VALUES (?, ?, ?, ?, ?, ?)');
    products.forEach(p => stmt.run(p.name, p.description, p.price, p.stock, p.category, p.image));
    console.log(`${products.length} products seeded.`);
  }

  console.log('Seeding complete!');

seed().catch(console.error);
