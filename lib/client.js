const url = "https://ebird.org"

const config = require("../config.json");

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

  goToHomePage() {
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
      fetchChecklists();
    else {
      var alert = htmlDoc("div[role=alert]");
      if (alert.length > 0) {
        console.log(alert.find("p").text());
      } else console.log("Login failure.");
    }
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