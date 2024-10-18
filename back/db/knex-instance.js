const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: './data.db'
  },
  useNullAsDefault: true,
});

console.log("Conexão com o banco de dados SQLite estabelecida com sucesso!");

module.exports = knex;
