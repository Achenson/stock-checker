/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

"use strict";

var expect = require("chai").expect;
var MongoClient = require("mongodb");
var dotenv = require("dotenv");
var mongoose = require("mongoose");
const iex = require("iexcloud_api_wrapper");

dotenv.config();

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

//connection to DB
mongoose
  .connect(CONNECTION_STRING, { useNewUrlParser: true })
  .then(() => console.log("connection succesfull"))
  .catch(err => console.log(err));

/* fetch version of the test below
function quote(sym) {
  fetch(iex.quote(sym))
    .then(res => res.json())
    .then(data => console.log(data))
    .catch(err => console.log(err))
}
quote("WDC")
*/

// testing iex_wrapper

const quote = async sym => {
  try {
    const quoteData = await iex.quote(sym);
    // do something with returned quote data
    console.log(quoteData);
  } catch (err) {
    console.log(err);
  }
};

quote("WDC");
//quote("randommm")

module.exports = function(app) {

  
  
  
  
  
  
  const StockSchema = new mongoose.Schema({
    stock: {
      type: String,
      required: true
    },
    price: {
      type: String,
      required: true
    },
    likes: {
      type: Number,
      required: true,
      default: 0
    },
    Ips: {
      type: Array,
      required: true,
      default: []
    }
  });

  const Stock = mongoose.model("Stock", StockSchema);

  app.route("/api/stock-prices").get(function(req, res) {

    //var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
    //console.log('ippppppp')
    //console.log(ip);
    
   var ip = req.header('x-forwarded-for') || req.connection.remoteAddress;


    console.log('ip222222')
    console.log(ip);

    let stock = req.query.stock;
    console.log('stoooooooooooooooooock')
    console.log(stock);

    let likeAll = req.query.like;

    let arrayOfStocks = [];
    typeof stock === "string"
      ? arrayOfStocks.push(stock)
      : (arrayOfStocks = stock);
   // console.log('arrayofStocks')
    //console.log(arrayOfStocks[0]);

    let finalArrayOfResJSON = [];

    // this is a var! so it has to be above a function call

    async function quoteJSON(arrayOfSymbols, el) {
      try {
        const quoteData = await iex.quote(arrayOfSymbols[el]);
        // do something with returned quote data

       // console.log(quoteData);
        //console.log(arrayOfSymbols[el]);

        //////// !!!!!

        let myPromise = new Promise((resolve, reject) => {
          //let exportVar ='kkkjjjjk';

          Stock.countDocuments(
            {
              stock: arrayOfSymbols[el].toUpperCase()
            },
            function(err, count) {
              if (err) console.error(err);
              //console.log(typeof data)
              //console.log(count);

              //if there is a stock in a db
              if (count > 0) {
                //if there were no likes at all, or if there was no "true" in proper position
                if (likeAll !== "true") {
                  Stock.findOne({
                    stock: arrayOfSymbols[el].toUpperCase()
                  }).exec((err, data) => {
                    if (err) console.error(err);
                    //price is get from API, the rest form DB
                    let toAddToFinalArray = {
                      stock: data.stock,
                      price: quoteData.latestPrice.toString(),
                      likes: data.likes
                    };

                   // console.log("toAddToFinalArray");
                  //  console.log(toAddToFinalArray);
                    //finalArrayOfResJSON.push(toAddToFinalArray);

                   // console.log("finalAarray first time");
                   // console.log(finalArrayOfResJSON);

                    resolve(toAddToFinalArray);
                  });
                  // if the like is 'true' where it shoul be
                } else {
                //  console.log(likeAll);

                  Stock.findOneAndUpdate(
                    { stock: arrayOfSymbols[el].toUpperCase() },
                    {
                      $inc: { likes: 1 }
                    },
                    {
                      useFindAndModify: false,
                      new: true
                    }
                  ).exec((err, data) => {
                    //if (err) console.error(err);
                    //console.log(data);
                    //res.json({
                    // random: 'random'
                    //stock: data.stock,
                    //price: quoteData.latestPrice.toString(),
                    //likes: data.likes
                    //});

                    Stock.findOne({
                      stock: arrayOfSymbols[el].toUpperCase()
                    }).exec((err, data) => {
                     // if (err) console.error(err);

                      let toAddToFinalArray = {
                        stock: data.stock,
                        price: quoteData.latestPrice.toString(),
                        likes: data.likes
                      };

                      //finalArrayOfResJSON.push(toAddToFinalArray);
                      resolve(toAddToFinalArray);
                    });
                  });
                  // hack, because findOneandUpdate doesn't return anything, even
                  //though it is updating
                }
              } else {
                // if there is no stock in a db

                //if there are no likes

                if (likeAll !== "true") {
                  let newStock = new Stock({
                    stock: quoteData.symbol,
                    price: quoteData.latestPrice.toString()
                  });

                  newStock.save(err => {
                    if (err) console.error(err);
                  });

                  let toAddToFinalArray = {
                    stock: quoteData.symbol,
                    price: quoteData.latestPrice.toString(),
                    likes: 0
                  };

                  //finalArrayOfResJSON.push(toAddToFinalArray);
                  resolve(toAddToFinalArray);

                  //if there is a like
                } else {
                  let newStock = new Stock({
                    stock: quoteData.symbol,
                    price: quoteData.latestPrice.toString(),
                    likes: 1
                  });

                  newStock.save(err => {
                    if (err) console.error(err);
                  });

                  let toAddToFinalArray = {
                    stock: quoteData.symbol,
                    price: quoteData.latestPrice.toString(),
                    likes: 1
                  };

                  //finalArrayOfResJSON.push(toAddToFinalArray);
                  resolve(toAddToFinalArray);
                }
              }
            }
          );
        });

        let myReturn = await myPromise;
        return myReturn;

        //return testVar;

        //return expVar;
      } catch (err) {
        console.error(err);
      }
    }

    //finalVar()

    async function makeJsonArray() {
      let arrayOfPartials = [];
     // console.log("arrayOfPartials");
      //console.log(arrayOfPartials);

      for (let el of arrayOfStocks) {
        let promise = new Promise((resolve, reject) => {
          resolve(quoteJSON(arrayOfStocks, arrayOfStocks.indexOf(el)));
        });

        //let partialObj = await quoteJSON(arrayOfStocks, arrayOfStocks.indexOf(el));
        let partialObj = await promise;
        //let partialObj = await quoteJSON(arrayOfStocks, arrayOfStocks[0]);
        console.log("partialObj");
        console.log(partialObj);
        arrayOfPartials.push(partialObj);
      }

      console.log(arrayOfPartials);

      if (arrayOfPartials.length !== 2) {
        res.json(arrayOfPartials);
      } else {
        let relativeArray = [...arrayOfPartials];

        let el1 = relativeArray[0];
        let el2 = relativeArray[1];

        el1.rel_likes = el1.likes - el2.likes;
        el2.rel_likes = el2.likes - el1.likes;

        for (let el of relativeArray) {
          delete el.likes;
        }

        res.json(relativeArray);
      }
    }

    makeJsonArray();
  });
};
