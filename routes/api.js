/*

 *       Complete the API routing below

 */

"use strict";

var expect = require("chai").expect;
var MongoClient = require("mongodb");
var dotenv = require("dotenv");
var mongoose = require("mongoose");
const iex = require("iexcloud_api_wrapper");

dotenv.config();

const CONNECTION_STRING = process.env.DB;

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

// testing iex_api_wrapper

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
    var ip = req.header("x-forwarded-for") || req.connection.remoteAddress;

    console.log("ip:");
    console.log(ip);

    let stock = req.query.stock;
    console.log("stock/stocks:");
    console.log(stock);

    let likeAll = req.query.like;

    let arrayOfStocks = [];
    //making sure that req.query.stock is always an array
    // (in case of one item it is normally a single string)
    typeof stock === "string"
      ? arrayOfStocks.push(stock)
      : (arrayOfStocks = stock);

    // quoteData is a var! so it has to be above a function call
    //arguments: 1: array of stocks (with one or more elements), 2: index for the specific stock in an array
    async function quoteJSON(arrayOfSymbols, el) {
      try {
        const quoteData = await iex.quote(arrayOfSymbols[el]);

        let myPromise = new Promise((resolve, reject) => {
          Stock.countDocuments(
            {
              //toUpperCase to make it work with API
              stock: arrayOfSymbols[el].toUpperCase()
            },
            function(err, count) {
              if (err) console.error(err);

              //if there is a stock in a db
              if (count > 0) {
                //if there were no likes, or if there was no "true" in proper position
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

                    // this will be what the function quoteData returns
                    resolve(toAddToFinalArray);
                  });
                  // if the like is 'true'
                } else {
                  Stock.findOne({
                    stock: arrayOfSymbols[el].toUpperCase()
                  }).exec((err, data) => {
                    if (err) console.error(err);
                    //checking if the Ips array includes ip
                    if (data.Ips.includes(ip)) {
                      let toAddToFinalArray = {
                        stock: data.stock,
                        price: quoteData.latestPrice.toString(),
                        likes: data.likes
                      };

                      resolve(toAddToFinalArray);
                      //if there is no ip in Ips array
                    } else {
                      Stock.findOneAndUpdate(
                        { stock: arrayOfSymbols[el].toUpperCase() },
                        {
                          $inc: { likes: 1 },
                          $push: { Ips: ip }
                        },
                        {
                          useFindAndModify: false,
                          new: true
                        }
                      ).exec((err, data) => {
                        //if (err) console.error(err);

                        // !! for some reason findOneandUpdate doesn't return anything, even
                        //though it is updating, so .findOne() is chained to return data !!

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
                    }
                  });
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

                  resolve(toAddToFinalArray);

                  //if there is a like & no stock in db
                } else {
                  let newStock = new Stock({
                    stock: quoteData.symbol,
                    price: quoteData.latestPrice.toString(),
                    likes: 1,
                    ////new line for IP handling
                    Ips: [ip]
                  });

                  newStock.save(err => {
                    if (err) console.error(err);
                  });

                  let toAddToFinalArray = {
                    stock: quoteData.symbol,
                    price: quoteData.latestPrice.toString(),
                    likes: 1
                  };

                  resolve(toAddToFinalArray);
                }
              }
            }
          );
        });

        let myReturn = await myPromise;
        return myReturn;
      } catch (err) {
        console.error(err);
      }
    }

    async function makeJsonArray() {
      let arrayOfPartials = [];
      // console.log("arrayOfPartials:");
      //console.log(arrayOfPartials);

      // for each Stock we run function quoteJson
      for (let el of arrayOfStocks) {
        //this will return toAddToFinalArray var from quoteJSON function
        let promise = new Promise((resolve, reject) => {
          resolve(quoteJSON(arrayOfStocks, arrayOfStocks.indexOf(el)));
        });

        let partialObj = await promise;

        console.log("partialObj:");
        console.log(partialObj);
        arrayOfPartials.push(partialObj);
      }

      console.log(arrayOfPartials);

      if (arrayOfPartials.length !== 2) {
        res.json(arrayOfPartials);

        // if there were exactly 2 stocks passed in req.body
        // relative likes are displayed
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
