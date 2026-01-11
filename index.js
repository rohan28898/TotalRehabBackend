require("dotenv").config();
const fs= require('fs');
const express = require("express")
const app = express();
const mysql = require('mysql')
const cors = require('cors')

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    ca: fs.readFileSync('./certs/isrgrootx1.pem')
  }
});

db.connect((err) => {
  if (err) {
    console.error(" Database connection failed:", err);
    return;
  }
  console.log(" Database connected");
});

app.get("/", (req, res) => {
  res.send("Hello from server");
});

app.post("/invoice", (req, res) => {
  // Destructure the form data from request body
  const {
    invoiceNo,
    date,
    name,
    age,
    sex,
    diagnosis,
    treatmentFrom,
    treatmentTo,
    totalDays,
    visitCharge,
    totalCharge,
    otherCharges,
    totalAmount,
    inWords
  } = req.body;

  const createdDate = new Date();

  // Insert into invoicedata table
  const sql =
    "INSERT INTO invoicedata (invoiceNo, invoicedate, name, age, sex, diagnosis, treatmentFrom, treatmentTo, totalDays, visitCharge, totalCharge, otherCharges, totalAmount, inWords, createdDate,paymentStatus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)";

  const values = [
    invoiceNo,
    date,
    name,
    age,
    sex,
    diagnosis,
    treatmentFrom,
    treatmentTo,
    totalDays,
    visitCharge,
    totalCharge,
    otherCharges,
    totalAmount,
    inWords,
    createdDate,
    "Unpaid"
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error inserting invoice data");
    }

    res.send({ message: "Invoice data inserted successfully", id: result.insertId });
  });
});

app.get("/invoices", (req, res) => {
  const {
    startDate,
    endDate,
    name,
    paymentStatus,
    sortField,
    sortOrder
  } = req.query;

  let sql = "SELECT * FROM invoicedata WHERE 1=1";
  const params = [];

  if (startDate && endDate) {
    sql += " AND invoicedate BETWEEN ? AND ?";
    params.push(startDate, endDate);
  }

  if (name) {
    sql += " AND name LIKE ?";
    params.push(`%${name}%`);
  }

  if (paymentStatus) {
    sql += " AND paymentStatus = ?";
    params.push(paymentStatus);
  }

  if (sortField) {
    const order = sortOrder === "desc" ? "DESC" : "ASC";
    sql += ` ORDER BY ${sortField} ${order}`;
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }
    res.json(results);
  });
});

app.put("/invoice/:id", (req, res) => {
  const { id } = req.params;
  const { paymentStatus, paymentMode } = req.body;

  const sql = `
    UPDATE invoicedata
    SET paymentStatus = ?, paymentMode = ?
    WHERE id = ?
  `;

  db.query(sql, [paymentStatus, paymentMode, id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).send({ message: "Error updating payment details" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({ message: "Invoice not found" });
    }

    res.send({ message: "Payment details updated successfully" });
  });
});


app.listen(3001, () => {
    console.log('server is running on 3001');
})