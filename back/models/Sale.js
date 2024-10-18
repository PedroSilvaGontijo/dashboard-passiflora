const knex = require("../db/knex-instance");

const createSalesTable = async () => {
  const exists = await knex.schema.hasTable("sales");
  if (!exists) {
    await knex.schema.createTable("sales", (table) => {
      table.increments("id").primary();
      table.string("timeOfSale").notNullable();
      table.string("dateOfSale").notNullable();
      table.float("saleAmount").notNullable();
      table.float("installmentValue").notNullable();
      table.string("cardFlag");
      table.string("cardNumber");
      table.string("operationType").notNullable();
      table.integer("installments");
      table.string("saleStatus").notNullable();
      table.string("authorizer");
      table.string("ref");
      table.string("saleCode").notNullable();
      table.string("terminalID").notNullable();
    });
    console.log("Tabela criada com sucesso!");
  } else {
    console.log('Tabela "sales" já existe.');
  }
};

module.exports = createSalesTable;
