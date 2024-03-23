// Import required modules
const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const session = require('express-session');
const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Generate a random secret key
const secretKey = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

// Create a MySQL connection pool
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'budgetapp',
});

// Create an Express application
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());
// Use the cors middleware
app.use(cors());
// Use the session middleware
app.use(session({
  secret: secretKey,
  resave: false,
  saveUninitialized: true
}));

// Serve the HTML file
app.use(express.static("./"));

// Create database and tables
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL');

  // Create users table
  connection.query(
    `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL
    )
  `,
    (err) => {
      if (err) {
        console.error('Error creating users table:', err);
        connection.release(); // Release the connection
        return;
      }
      console.log('Users table created successfully.');

      // Create budget_data table
      connection.query(
        `
        CREATE TABLE IF NOT EXISTS budget_data (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          budget DECIMAL(10, 2) NOT NULL,
          expenses DECIMAL(10, 2) NOT NULL DEFAULT 0,
          balance DECIMAL(10, 2) NOT NULL,
          UNIQUE KEY (user_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `,
        (err) => {
          if (err) {
            console.error('Error creating budget_data table:', err);
          } else {
            console.log('Budget_data table created successfully.');
          }

          // Create expenses table
          connection.query(
            `
            CREATE TABLE IF NOT EXISTS expenses (
              id INT AUTO_INCREMENT PRIMARY KEY,
              user_id INT NOT NULL,
              description VARCHAR(255) NOT NULL,
              amount DECIMAL(10, 2) NOT NULL,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
          `,
            (err) => {
              if (err) {
                console.error('Error creating expenses table:', err);
              } else {
                console.log('Expenses table created successfully.');
              }
              connection.release(); // Release the connection
            }
          );
        }
      );
    }
  );
});

// Route to handle user registration
app.post('/api/register', (req, res) => {
  const { username, email, password } = req.body;

  // Insert user data into the database
  pool.query(
    'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
    [username, email, password],
    (error, results, fields) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while registering the user.' });
        return;
      }
      res.status(201).json({ message: 'User registered successfully.' });
    }
  );
});

// Route to handle user login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  // Check if the user credentials exist in the database
  pool.query(
    'SELECT id, username FROM users WHERE email = ? AND password = ?',
    [email, password],
    (error, results, fields) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while logging in.' });
        return;
      }
      if (results.length === 0) {
        res.status(401).json({ error: 'Invalid email or password.' });
      } else {
        const user = results[0];
        // Store user session data
        req.session.userId = user.id;
        res.status(200).json({ message: 'Login successful.', user: user });
      }
    }
  );
});

// Route to handle budget data operations
app.put('/api/budget/:userId', (req, res) => {
  const userId = req.params.userId;
  const { budget, expenses, balance } = req.body;

  // Insert or update budget data in the database
  pool.query(
    'INSERT INTO budget_data (user_id, budget, expenses, balance) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE budget = ?, expenses = ?, balance = ?',
    [userId, budget, expenses, balance, budget, expenses, balance],
    (error, results, fields) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while updating budget data.' });
        return;
      }
      res.status(200).json({ message: 'Budget data updated successfully.' });
    }
  );
});

// Route to retrieve budget data for a user
app.get('/api/budget/:userId', (req, res) => {
  const userId = req.params.userId;

  // Retrieve budget data from the database
  pool.query(
    'SELECT budget, expenses, balance FROM budget_data WHERE user_id = ?',
    [userId],
    (error, results, fields) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while retrieving budget data.' });
        return;
      }
      if (results.length === 0) {
        res.status(404).json({ error: 'No budget data found for the user.' });
      } else {
        res.status(200).json(results[0]);
      }
    }
  );
});

// Route to handle expense creation
app.post('/api/expenses/:userId', (req, res) => {
  const userId = req.params.userId;
  const { description, amount } = req.body;

  // Insert a new expense into the database
  pool.query(
    'INSERT INTO expenses (user_id, description, amount) VALUES (?, ?, ?)',
    [userId, description, amount],
    (error, results, fields) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while creating the expense.' });
        return;
      }
      res.status(201).json({ message: 'Expense created successfully.' });
    }
  );
});





// Route to retrieve expenses data for a user
app.get('/api/expenses/:userId', (req, res) => {
  const userId = req.params.userId;

  // Retrieve expenses data from the database for the specified user ID
  pool.query(
    'SELECT description, amount, id FROM expenses WHERE user_id = ?',
    [userId],
    (error, results, fields) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while retrieving expenses data.' });
        return;
      }
      res.status(200).json(results);
    }
  );
});


// Route to handle expense deletion
app.delete('/api/expenses/:userId/:expenseId', (req, res) => {
  const expenseId = req.params.expenseId;
  const userId = req.params.userId;

  // Delete the expense from the database
  pool.query(
    'DELETE FROM expenses WHERE id = ? AND user_id = ?',
    [expenseId, userId],
    (error, results, fields) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while deleting the expense.' });
        return;
      }
      if (results.affectedRows === 0) {
        res.status(404).json({ error: 'Expense not found.' });
      } else {
        res.status(200).json({ message: 'Expense deleted successfully.' });
      }
    }
  );
});

// Route to handle expense update
app.put('/api/expenses/:userId/:expenseId', (req, res) => {
  const expenseId = req.params.expenseId;
  const userId = req.params.userId;
  const { description, amount } = req.body;

  // Update the expense in the database
  pool.query(
    'UPDATE expenses SET description = ?, amount = ? WHERE id = ? AND user_id = ?',
    [description, amount, expenseId, userId],
    (error, results, fields) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while updating the expense.' });
        return;
      }
      if (results.affectedRows === 0) {
        res.status(404).json({ error: 'Expense not found.' });
      } else {
        res.status(200).json({ message: 'Expense updated successfully.' });
      }
    }
  );
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});