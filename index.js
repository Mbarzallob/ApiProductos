const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const multer = require('multer');
const path = require('path');

// Configuración de almacenamiento en Filestore
const storage = multer.diskStorage({
  destination: '/mnt/filestore', // Directorio montado
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });
const app = express();
app.use(express.json()); // Para leer JSON del body
app.use(cors());

const pool = new Pool({
  user: "camila",
  password: "12345",
  host: "10.194.0.3", // IP pública de tu db-vm
  port: 5432,
  database: "distribuidos",
});

// GET todos los productos
app.get("/productos", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM productos");
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send({message:"Error retrieving productos"});
  }
});

// POST crear producto
app.post("/productos", upload.single("imagen"), async (req, res) => {
  try {
    const { nombre, precio, descripcion } = req.body;
    const imagen = req.file.filename; 

    await pool.query(
      "INSERT INTO productos (nombre, descripcion, precio, imagen) VALUES ($1, $2, $3, $4)",
      [nombre, descripcion, precio, imagen]
    );

    res.status(201).send({ message: "Producto creado" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error creando producto" });
  }
});


// PUT actualizar producto
app.put("/productos/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { nombre, precio, descripcion } = req.body;
    await pool.query(
      "UPDATE productos SET nombre = $1, descripcion = $2, precio = $3  WHERE id = $4",
      [nombre, descripcion, precio, id]
    );
    res.status(200).send({message:"Product updated successfully"});
  } catch (err) {
    console.error(err);
    res.status(500).send({message:"Error updating product"});
  }
});


// DELETE producto
app.delete("/productos/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await pool.query("DELETE FROM productos WHERE id = $1", [id]);
    res.status(200).send({message:"Product deleted successfully"});
  } catch (err) {
    console.error(err);
    res.status(500).send({message:"Error deleting product"});
  }
});

app.get("/imagen/:filename", (req, res) => {
  const filePath = path.join('/mnt/filestore', req.params.filename);
  res.sendFile(filePath);
});
// Escuchar en el puerto 3000
app.listen(3000, () => {
  console.log("Server is running on port 3000");
})
