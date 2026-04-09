const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/supplier", (req, res) => {
  const { name, city } = req.body;

  db.run(
    "INSERT INTO suppliers (name, city) VALUES (?, ?)",
    [name, city],
    function (err) {
      if (err) return res.status(500).json(err);
      res.json({ id: this.lastID });
    }
  );
});


app.post("/inventory", (req, res) => {
  const { supplier_id, product_name, quantity, price } = req.body;

  if (quantity < 0) return res.status(400).json({ message: "Invalid quantity" });
  if (price <= 0) return res.status(400).json({ message: "Invalid price" });

  db.get("SELECT * FROM suppliers WHERE id=?", [supplier_id], (err, supplier) => {
    if (!supplier) return res.status(400).json({ message: "Invalid supplier" });

    db.run(
      "INSERT INTO inventory (supplier_id, product_name, quantity, price) VALUES (?, ?, ?, ?)",
      [supplier_id, product_name, quantity, price],
      function (err) {
        if (err) return res.status(500).json(err);
        res.json({ id: this.lastID });
      }
    );
  });
});


app.get("/inventory", (req, res) => {
  db.all(`
    SELECT i.*, s.name as supplier_name
    FROM inventory i
    JOIN suppliers s ON i.supplier_id = s.id
  `, [], (err, rows) => {
    res.json(rows);
  });
});


app.get("/inventory/grouped", (req, res) => {
  db.all(`
    SELECT s.name,
    SUM(i.quantity * i.price) AS total_value
    FROM suppliers s
    JOIN inventory i ON s.id = i.supplier_id
    GROUP BY s.id
    ORDER BY total_value DESC
  `, [], (err, rows) => {
    res.json(rows);
  });
});

app.listen(5001, () => console.log("Server running on 5001"));