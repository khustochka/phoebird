const url = "https://ebird.org"

const totalNum = 10000

const allChecklistsUrl = "https://ebird.org/eBirdReports?cmd=SubReport&currentRow=1&rowsPerPage=" + totalNum + "&sortBy=date&order=asc"

const config = require("../config/config.json")

const request = require('request').defaults({
  "jar": true,
  headers: {
    'User-Agent': 'Node.js request'
  }
});

const parser = require('cheerio');

class Client {

  constructor() {

  }

  fetchChecklistsData(callback) {
    this.finalCallback = callback;
    request(url, this.clickSignIn.bind(this));
  }

  clickSignIn(error, response, body) {
    var htmlDoc = parser.load(body);
    var signInLink = htmlDoc("a:contains('Sign in')");
    var signInPath = signInLink.attr("href");
    var signInUrl = this.fullUrl(response.request, signInPath);

    request(signInUrl, this.submitSignInForm.bind(this));
  }

  submitSignInForm(error, response, body) {
    var htmlDoc = parser.load(body);
    var signInForm = htmlDoc("form#credentials");
    var signInPath = signInForm.attr("action");
    var signInUrl = this.fullUrl(response.request, signInPath);

    var ltValue = signInForm.find("input[name=lt]").val(),
      execValue = signInForm.find("input[name=execution]").val();

    var formData = {
      "username": config.username,
      'password': config.password,
      'rememberMe': 'on',
      'lt': ltValue,
      'execution': execValue,
      '_eventId': 'submit'
    }

    request.post(signInUrl, {
      form: formData,
      followAllRedirects: true
    }, this.checkLogin.bind(this));
  }

  checkLogin(error, response, body) {
    var htmlDoc = parser.load(body);
    if (htmlDoc("a.HeaderEbird-link span:contains(" + config.username + ")").length > 0)
      request(allChecklistsUrl, this.loadAllChecklists.bind(this));
    else {
      var alert = htmlDoc("div[role=alert]");
      if (alert.length > 0) {
        console.log(alert.find("p").text());
      } else console.log("Login failure.");
    }
  }

  loadAllChecklists(error, response, body) {
    var htmlDoc = parser.load(body);

    var rows = htmlDoc("div#main div#contentwrapper div#content table tr:nth-child(n+3)")

    var result = rows.map(function(i, row) {
      return {
        "time": parser(row).find("td:nth-child(1)").text(),
        "location": parser(row).find("td:nth-child(2)").text(),
        "county": parser(row).find("td:nth-child(3)").text(),
        "province": parser(row).find("td:nth-child(4)").text(),
        "id": /checklist\/(.*)$/.exec(parser(row).find("td:nth-child(5) a:contains(View or edit)").attr("href"))[1]
      }
    }).get()

    console.log(result)

  }

  fetchChecklists() {
    this.finalCallback({success: true})
  }

  fullUrl(request, path) {
    return request.uri.protocol + "//" + request.host + path;
  }

  // submitSignInForm(error, response, body) {
  // console.log(response.request.uri);
  //   console.log('error:', error); // Print the error if one occurred
  //   console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
  //   console.log('body:', body); // Print the HTML for the Google homepage.
  // }


}

module.exports = Client;
