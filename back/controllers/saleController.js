const ExcelJS = require("exceljs");
const knex = require("../db/knex-instance");
const createSalesTable = require("../models/Sale");

exports.processExcelFile = async (filePath) => {
  try {
    await createSalesTable();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.worksheets[0]; 

    const data = [];

    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 4) {
        data.push(row.values);
      }
    });

    if (data.length === 0) {
      console.log(`Nenhum dado encontrado na planilha: ${filePath}`);
      return;
    }

    for (const row of data) {
      if (!row.length) continue;

      console.log(`Linha lida: ${JSON.stringify(row)}`);

      const timeOfSaleValue = row[2];
      const dateOfSaleValue = row[3];

      let timeOfSale = "";
      if (typeof timeOfSaleValue === "number") {
        const totalMinutes = Math.round(timeOfSaleValue * 24 * 60);
        const hours = Math.floor(totalMinutes / 60) % 24;
        const minutes = totalMinutes % 60;
        timeOfSale = `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`;
      } else {
        timeOfSale = timeOfSaleValue || "";
      }

      let dateOfSale;
      if (typeof dateOfSaleValue === "number") {
        const excelBaseDate = new Date(Date.UTC(1899, 11, 30));
        dateOfSale = new Date(
          excelBaseDate.getTime() + dateOfSaleValue * 86400000
        );
      } else {
        dateOfSale = new Date(dateOfSaleValue) || new Date();
      }

      dateOfSale.setHours(dateOfSale.getHours() - 3); 

      try {
        await knex("sales").insert({
          timeOfSale,
          dateOfSale: dateOfSale.toISOString(),
          saleAmount: parseFloat(row[4]) || 0,
          installmentValue: parseFloat(row[5]) || 0,
          cardFlag: row[6] || "N/A",
          cardNumber: row[7] || "N/A",
          operationType: row[8] || "",
          installments: parseInt(row[9]) || 0,
          saleStatus: row[10] || "N/A",
          authorizer: row[11] || "N/A",
          ref: row[12] || "N/A",
          saleCode: row[13] || "",
          terminalID: row[14] || "",
        });
      } catch (error) {
        console.error(`Erro ao salvar a venda: ${error.message}`);
      }
    }

    console.log(`Planilha ${filePath} processada com sucesso.`);
  } catch (error) {
    console.error(`Erro ao processar o arquivo ${filePath}: ${error.message}`);
  }
};
