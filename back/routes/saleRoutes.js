const express = require("express");
const knex = require("../db/knex-instance");
const { PDFDocument, rgb } = require("pdf-lib");
const router = express.Router();

router.get("/sales/all", async (req, res) => {
  try {
    const sales = await knex("sales");
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar todas as vendas" });
  }
});


router.get("/sales/filter", async (req, res) => {
  const { startDate, endDate, operationType, saleStatus, installments } = req.query;
  const query = knex("sales");

  if (startDate && endDate) {
    query.whereBetween('dateOfSale', [startDate, endDate]);
  } else if (startDate) {
    query.where('dateOfSale', '>=', startDate);
  }

  if (operationType) query.where('operationType', operationType);
  if (saleStatus) query.where('saleStatus', saleStatus);
  if (installments) query.where('installments', installments);

  try {
    const sales = await query;
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: "Erro ao aplicar filtros nas vendas" });
  }
});

router.get("/sales/total-aprovadas", async (req, res) => {
  const { startDate, endDate, operationType, installments } = req.query;
  const query = knex("sales").where('saleStatus', 'Aprovada');

  if (startDate && endDate) {
    query.whereBetween('dateOfSale', [startDate, endDate]);
  } else if (startDate) {
    query.where('dateOfSale', '>=', startDate);
  }

  if (operationType) query.where('operationType', operationType);
  if (installments) query.where('installments', installments);

  try {
    const approvedSales = await query;
    const totalAmount = approvedSales.reduce((acc, sale) => acc + sale.saleAmount, 0);
    res.json({ totalAmount });
  } catch (error) {
    res.status(500).json({ error: "Erro ao calcular o total de vendas aprovadas" });
  }
});

router.get("/sales/total-recusadas", async (req, res) => {
  const { startDate, endDate, operationType, saleStatus, installments } = req.query;
  const filter = {};

  if (startDate && endDate) {
    query.whereBetween('dateOfSale', [startDate, endDate]);
  } else if (startDate) {
    query.where('dateOfSale', '>=', startDate);
  }

  if (operationType) filter.operationType = operationType;
  if (saleStatus === "Recusada") filter.saleStatus = "Recusada";
  if (installments) filter.installments = installments;

  try {
    const declinedSales = await knex("sales").where(filter);
    const totalAmount = declinedSales.reduce((acc, sale) => acc + sale.saleAmount, 0);
    res.json({ totalAmount });
  } catch (error) {
    res.status(500).json({ error: "Erro ao calcular o total de vendas recusadas" });
  }
});

router.get("/sales/total-canceladas", async (req, res) => {
  const { startDate, endDate, operationType, saleStatus, installments } = req.query;
  const filter = {};

  if (startDate && endDate) {
    query.whereBetween('dateOfSale', [startDate, endDate]);
  } else if (startDate) {
    query.where('dateOfSale', '>=', startDate);
  }

  if (operationType) filter.operationType = operationType;
  if (saleStatus === "Cancelada") filter.saleStatus = "Cancelada";
  if (installments) filter.installments = installments;

  try {
    const canceledSales = await knex("sales").where(filter);
    const totalAmount = canceledSales.reduce((acc, sale) => acc + sale.saleAmount, 0);
    res.json({ totalAmount });
  } catch (error) {
    res.status(500).json({ error: "Erro ao calcular o total de vendas canceladas" });
  }
});

router.get("/sales/total-liquido", async (req, res) => {
  const { startDate, endDate, operationType, saleStatus, installments } = req.query;
  const filter = {};

  if (startDate && endDate) {
    query.whereBetween('dateOfSale', [startDate, endDate]);
  } else if (startDate) {
    query.where('dateOfSale', '>=', startDate);
  }

  if (operationType) filter.operationType = operationType;
  if (installments) filter.installments = installments;

  try {
    const approvedSales = await knex("sales")
      .where(filter)
      .andWhere({ saleStatus: "Aprovada" });

    const totalNetAmount = approvedSales.reduce((acc, sale) => acc + sale.saleAmount, 0);
    res.json({ totalNetAmount });
  } catch (error) {
    res.status(500).json({ error: "Erro ao calcular o total líquido" });
  }
});

router.delete("/sales/delete-all", async (req, res) => {
  try {
    await knex("sales").del();
    const directoryPath = path.join(__dirname, '../watched-directory');
    fs.readdir(directoryPath, (err, files) => {
      if (err) {
        return res.status(500).json({ error: "Erro ao ler o diretório" });
      }
      files.forEach(file => {
        const filePath = path.join(directoryPath, file);
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Erro ao deletar o arquivo: ${file}`, err);
          } else {
            console.log(`Arquivo deletado com sucesso: ${file}`);
          }
        });
      });
    });
    res.json({ message: "Todas as vendas foram deletadas com sucesso" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao deletar todas as vendas e arquivos" });
  }
});

router.get("/sales/export", async (req, res) => {
  const { startDate, endDate, operationType, saleStatus, installments } = req.query;
  const query = knex("sales");

  if (startDate && endDate) {
    query.whereBetween('dateOfSale', [startDate, endDate]);
  } else if (startDate) {
    query.where('dateOfSale', '>=', startDate);
  }

  if (operationType) query.where('operationType', operationType);
  if (saleStatus) query.where('saleStatus', saleStatus);
  if (installments) query.where('installments', installments);

  try {
    const sales = await query;
    const totalApproved = sales.filter((sale) => sale.saleStatus === "Aprovada")
      .reduce((acc, sale) => acc + sale.saleAmount, 0);
    const totalDeclined = sales.filter((sale) => sale.saleStatus === "Recusada")
      .reduce((acc, sale) => acc + sale.saleAmount, 0);
    const totalCanceled = sales.filter((sale) => sale.saleStatus === "Cancelada")
      .reduce((acc, sale) => acc + sale.saleAmount, 0);

    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();
    const fontSize = 12;
    const lineHeight = 20;
    let currentY = height - 70;

    const addHeader = (page) => {
      page.drawText("Relatório de Vendas", {
        x: 50,
        y: height - 40,
        size: 20,
        color: rgb(0, 0.53, 0.71),
      });
      page.drawText("Data | Valor | Parcelas | Operação | Status", {
        x: 50,
        y: height - 55,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
    };

    const addTotals = (page, currentY) => {
      page.drawText(`Total Aprovado: R$ ${totalApproved.toFixed(2)}`, {
        x: 50,
        y: currentY - 40,
        size: fontSize,
        color: rgb(0, 0.5, 0),
      });
      page.drawText(`Total Recusado: R$ ${totalDeclined.toFixed(2)}`, {
        x: 50,
        y: currentY - 60,
        size: fontSize,
        color: rgb(0.8, 0, 0),
      });
      page.drawText(`Total Cancelado: R$ ${totalCanceled.toFixed(2)}`, {
        x: 50,
        y: currentY - 80,
        size: fontSize,
        color: rgb(0.5, 0.5, 0.5),
      });
    };

    addHeader(page);

    sales.forEach((sale) => {
      const saleDate = new Date(sale.dateOfSale).toLocaleDateString();
      const saleRow = `${saleDate} | R$ ${sale.saleAmount.toFixed(2)} | ${sale.installments} | ${sale.operationType} | ${sale.saleStatus}`;

      if (currentY < 40) {
        page = pdfDoc.addPage([600, 800]);
        currentY = height - 80;
        addHeader(page);
      }

      page.drawText(saleRow, {
        x: 50,
        y: currentY,
        size: fontSize,
        color: rgb(0, 0, 0),
      });
      currentY -= lineHeight;
    });

    if (currentY < 100) {
      page = pdfDoc.addPage([600, 800]);
      currentY = height - 100;
    }
    addTotals(page, currentY);

    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=Relatorio_de_vendas.pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (error) {
    res.status(500).json({ error: "Erro ao exportar dados" });
  }
});


module.exports = router;
