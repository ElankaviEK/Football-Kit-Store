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

  // Seed products
  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (productCount.count === 0) {
    const products = [
      { name: 'Manchester United Home Jersey 2024', description: 'Official Manchester United home kit with Adidas DriFit technology. Red and black design.', price: 89.99, stock: 25, category: 'Jersey', image: 'mu_home.jpg' },
      { name: 'Real Madrid Home Jersey 2024', description: 'Official Real Madrid home kit by Adidas. Classic all-white design with gold accents.', price: 94.99, stock: 20, category: 'Jersey', image: 'rm_home.jpg' },
      { name: 'Barcelona Home Jersey 2024', description: 'Official FC Barcelona home jersey by Nike. Classic blue and red stripes.', price: 89.99, stock: 18, category: 'Jersey', image: 'barca_home.jpg' },
      { name: 'Liverpool Home Jersey 2024', description: 'Official Liverpool FC home jersey by Nike. Iconic all-red design.', price: 84.99, stock: 30, category: 'Jersey', image: 'lfc_home.jpg' },
      { name: 'Manchester City Home Jersey 2024', description: 'Official Manchester City home jersey by Puma. Sky blue with white trim.', price: 84.99, stock: 22, category: 'Jersey', image: 'mancity_home.jpg' },
      { name: 'Arsenal Home Jersey 2024', description: 'Official Arsenal home jersey by Adidas. Classic red and white cannon design.', price: 84.99, stock: 28, category: 'Jersey', image: 'arsenal_home.jpg' },
      { name: 'Brazil National Team Jersey 2024', description: 'Official Brazil national team jersey. Iconic yellow with green trim.', price: 99.99, stock: 15, category: 'National', image: 'brazil.jpg' },
      { name: 'Ireland National Team Jersey 2024', description: 'Official Republic of Ireland home jersey. Classic green with white trim.', price: 79.99, stock: 35, category: 'National', image: 'ireland.jpg' },
      { name: 'Football Shorts - Black', description: 'Lightweight performance football shorts. Moisture-wicking fabric. Elastic waistband.', price: 29.99, stock: 50, category: 'Shorts', image: 'shorts_black.jpg' },
      { name: 'Football Training Kit Set', description: 'Complete training kit including jersey, shorts, and socks. Available in multiple sizes.', price: 59.99, stock: 20, category: 'Kit', image: 'training_kit.jpg' },
      { name: 'Goalkeeper Jersey - Green', description: 'Professional goalkeeper jersey with padded elbows. High-visibility green color.', price: 74.99, stock: 12, category: 'Goalkeeper', image: 'gk_green.jpg' },
      { name: 'Chelsea Away Jersey 2024', description: 'Official Chelsea FC away jersey by Nike. Yellow design with blue accents.', price: 84.99, stock: 17, category: 'Jersey', image: 'chelsea_away.jpg' },
    ];

    const stmt = db.prepare('INSERT INTO products (name, description, price, stock, category, image) VALUES (?, ?, ?, ?, ?, ?)');
    products.forEach(p => stmt.run(p.name, p.description, p.price, p.stock, p.category, p.image));
    console.log(`${products.length} products seeded.`);
  }

  console.log('Seeding complete!');
}

seed().catch(console.error);
