const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const saleRoutes = require("./routes/saleRoutes");
const saleController = require("./controllers/saleController");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("frontend"));
app.use("/", saleRoutes);

const saveDirectory = path.join(__dirname, "./watched-directory");
fs.watch(saveDirectory, (eventType, filename) => {
  if (filename && eventType === "rename") {
    const filePath = path.join(saveDirectory, filename);

    if (fs.existsSync(filePath) && path.extname(filename) === ".xlsx") {
      console.log(`Novo arquivo XLSX detectado: ${filename}`);
      saleController.processExcelFile(filePath);
    }
  }
});


const port = 3000;
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
