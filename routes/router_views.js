
module.exports = function(app) {

  app.get('/', function(req, res){
    res.send('ola')
  })

  app.get('/obter_dividas/:cpf', function(req, res){

    var conn = require('./../libs/connectdb.js')()

    var cpf = req.params.cpf
    var sql  = "select * from tbl_dividas where cpf='" + cpf + "'"
    
    conn.query(sql, function(err, rows, fields){
      
      if(err) throw err

      res.send(rows)
  
    })

  })

  app.get('/carteiras', function(req, res){
    res.render('carteiras')
  })

  app.get('/obter_carteiras/:player_cobranca/:categoria_score', function(req, res){

    var conn = require('./../libs/connectdb.js')()

    var playerCobranca = req.params.player_cobranca
    var categoriaScore = req.params.categoria_score

    var sql = "select sum(tbl_carteiras_dividas.valor) as valor_carteira, percentual_retorno, tbl_carteiras.id_carteira from tbl_carteiras LEFT JOIN tbl_carteiras_dividas ON tbl_carteiras.id_carteira = tbl_carteiras_dividas.id_carteira where categoria_score='"+categoriaScore+"' AND player_cobranca = '"+playerCobranca+"' group by percentual_retorno"
    
    console.log(sql)
    conn.query(sql, function(err, rows, fields){

      if(err) throw err

      res.send(rows)

    })

  })

  app.post('/salva_valor_investimento', function(req, res){

    var idCarteira = req.body.id_carteira
    var valorInvestimento = req.body.valor_investimento

    var conn = require('./../libs/connectdb.js')()

    var sql = "INSERT tbl_carteiras_investidas SET id_carteira=" + idCarteira + ", valor_investimento="+ valorInvestimento
    conn.query(sql, function(err, rows, fields){

      res.send('1')

    })

  })

  app.get('/dashboard', function(req, res){
    res.render('dashboard')
  })

  // Função para verificar a disponibilidade dos items no estoque

  function verificaEstoque(items){

    return new Promise(function(resolve, reject){

      var db = require('./../libs/connectdb.js')()

      var Estoques = db.model('Estoques')

      var newItems = []
      var semEstoque = false

      items.forEach(function(value, index){

        var nomeProduto = value.nome_produto
        var qtdeRequisitada = value.qtde

        Estoques.find({nome_produto : nomeProduto}, (err, docs) => {
          
          var registro = docs[0];

          if(registro == undefined){
            console.log('Produto inexistente no estoque')
            value.semEstoque = true
            semEstoque = true

          }
          else{
            var qtdeEstoque = registro.qtde

            if((qtdeRequisitada + 5) >= qtdeEstoque){
              console.log('Estoque vazio')
              value.semEstoque = true
              semEstoque = true
            }
            else{
              console.log('Quantidade autorizada para reserva no estoque')
              value.semEstoque = false
            }
          }
          
          newItems.push(value)

          if(index == (items.length - 1)){
            resolve({items: newItems, semEstoque: semEstoque})
          }

        })

      })

    })

  }

  function atualizaEstoque(items){

    return new Promise(function(resolve, reject){

      var db = require('./../libs/connectdb.js')()

      var Estoques = db.model('Estoques')

      var newItems = []
      var semEstoque = false

      items.forEach(function(value, index){

        var nomeProduto = value.nome_produto
        var qtdeRequisitada = value.qtde

        Estoques.find({nome_produto : nomeProduto}, (err, docs) => {
          
          var registro = docs[0];
          var qtdeEstoque = registro.qtde

          Estoques.findOneAndUpdate({nome_produto : nomeProduto}, {qtde: (qtdeEstoque - qtdeRequisitada)}, {upsert:true}, function(err, doc){
            
            if (err) throw err
            resolve('1')

          })

        })

      })

    })

  }

}