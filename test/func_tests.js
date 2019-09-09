/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);


    
    describe('GET /api/stock-prices => stockData object', function() {
      
      it('1 stock', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog'})
        .end(function(err, res){
            assert.equal(res.status, 200);
            assert.equal(res.type, "application/json");
            assert.equal(res.body[0].stock, "GOOG");

          
          //complete this one too
          
          done();
        });
      });
      
      it('1 stock with like', function(done) {


        
      });
      
      it('1 stock with like again (ensure likes arent double counted)', function(done) {
        
      });
      
      it('2 stocks', function(done) {
        
      });
      
      it('2 stocks with like', function(done) {
        
      });
      
    });


