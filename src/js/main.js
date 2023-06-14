(() => {
  var values = {};

  var totalsCache = {
    vehicleTotal: 0,
    loanMonthlyCost: 0,
    loanVehicleTotal: 0,
    monthlyExpenses: 0
  }

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  window.addEventListener("load", (ev) => {
    initialize();
    loadResults();
  });

  function initialize() {
    nunjucks.configure("templates");

    // initialize special elements
    let elements = [
      {selector: "form", event: "submit", function: formSubmission},
      {selector: "#paying-cash", event: "click", function: toggleFinanceOptions},
      {selector: "#down-payment-one", event: "keyup", function: downPayments},
      {selector: "#down-payment-two", event: "keyup", function: downPayments},
      {selector: "#loan-terms-other", event: "keyup", function: customLoanTerms},
      {selector: "#annual-insurance-one", event: "keyup", function: insuranceCosts},
      {selector: "#annual-insurance-two", event: "keyup", function: insuranceCosts},
    ];
    elements.forEach(element => {
      let selector = element.selector;
      let ev = element.event;
      let fn = element.function;
      document.querySelector(selector).addEventListener(ev, fn);
    });

    // Automatically calculate when input is modified
    let form = document.forms[0];
    form.querySelectorAll("input").forEach(input => {
      let isCheckboxOrRadio = input.type === "radio" || input.type === "checkbox";
      let isNumberOrText = input.type === "number" || input.type === "text";
      if(isCheckboxOrRadio) {
        input.addEventListener("click", loadResults);
        return;
      }
      if (isNumberOrText) {
        input.addEventListener("keyup", loadResults);
        return;
      }
    });
  }

  function loadResults() {
    try {
      parseValues();
      calculate();
    }
    catch(exception) {console.log("Results Error")}
  }

  function formSubmission(ev) {
    ev.preventDefault();
    loadResults();
  }

  function toggleFinanceOptions(ev) {
    let container = document.getElementById("financing-options");
    if(ev.target.checked) {
      container.classList.add("hidden");
    }
    else {
      container.classList.remove("hidden");
    }
  }

  function downPayments(ev) {
    try {
      if(ev.target.id === "down-payment-one") {
        let price = document.querySelector("#asking-price").value;
        let value = document.querySelector("#down-payment-one").value;
        document.querySelector("#down-payment-two").value = Math.round((value / price) * 100);
      }
      else {
        let price = document.querySelector("#asking-price").value;
        let value = document.querySelector("#down-payment-two").value;
        document.querySelector("#down-payment-one").value = Math.round((price * (1 + (value / 100))));
      }
    }
    catch(exception) {}
  }

  function insuranceCosts(ev) {
    try {
      if(ev.target.id === "annual-insurance-one") {
        let value = document.querySelector("#annual-insurance-one").value;
        document.querySelector("#annual-insurance-two").value = Math.round(value / 12);
      }
      else {
        let value = document.querySelector("#annual-insurance-two").value;
        document.querySelector("#annual-insurance-one").value = Math.round(value * 12);
      }
    }
    catch(exception) {}
  }

  function customLoanTerms(ev) {
    document.querySelectorAll('input[name="loan-terms"]').forEach(element => {
      element.checked = false;
    });
  }

  function parseValues() {
    let form = document.forms[0];

    for(let i = 0; i < form.elements.length; i++) {
      let element = form.elements[i];
      if(element.value && element.type !== "radio" && element.type !== "checkbox") {
        values[element.id] = element.value;
      }
      else if(element.name === "loan-terms" && element.checked) {
        values["loan-terms"] = element.value;
      }
    }

    values["paying-cash"] = document.getElementById("paying-cash").checked;
  }

  function parse(value) {
    return value ? Number(value) : 0;
  }

  function parse(value) {
    return value ? Number(value) : 0;
  }

  function currencyFormat(number) {
    return formatter.format(number);
  }

  function notification(message) {
    let notification = document.querySelector("#warning-alert");
    notification.querySelector("p").innerHTML = message;
    notification.classList.remove("hidden");
    setTimeout(() => {
      if(!notification.classList.contains("hidden")) {
        notification.classList.add("hidden");
      }
    }, 10000);
  }

  function calculate() {
    let downPayment = parse(values["down-payment-one"]);
    let askingPrice = parse(values["asking-price"]);
    let tradeIn = parse(values["trade-in"]);

    if(tradeIn >= askingPrice) {
      notification("The trade-in value must be less than the asking price.");
      return;
    }
    if(downPayment >= (askingPrice - tradeIn)) {
      notification("The down payment must be less than the asking price minus the trade-in.");
      return;
    }

    calculateTotalVehicleCost();
    calculateAnnualExpenses();
    calculateCostSummary();
  }

  function calculateTotalVehicleCost() {
    let totals = {
      isPayingCash: values["paying-cash"]
    };

    let askingPrice = parse(values["asking-price"]);
    let fees = parse(values["fees"]);
    let tax = parse(values["sales-tax"]) / 100;
    let tags = parse(values["tags-title"]);
    let tradeIn = parse(values["trade-in"]);
    let downPayment = parse(values["down-payment-one"]);
    let loanTerm = values["loan-terms-other"] ? Number(values["loan-terms-other"]) : parse(values["loan-terms"]);
    let apr = parse(values["apr"]) / 100;
    let r = apr / 12;

    let cost = askingPrice - tradeIn;
    let cashTax = cost * tax;
    let cashTotal = cost + cashTax + fees + tags;

    let loanCost = cost - downPayment;
    let loanTax = cost * tax;
    let principal = loanCost + loanTax;
    let loanTotal = ((principal * loanTerm * r) / (1 - Math.pow(1 + r, -loanTerm))) + downPayment;
    let interest = loanTotal - principal - downPayment;

    totals.cashTotal = currencyFormat(cashTotal);
    totals.fees = currencyFormat(fees);
    totals.tradeIn = `-${currencyFormat(tradeIn)}`;
    totals.cashTax = currencyFormat(cashTax);
    totals.loanTax = currencyFormat(loanTax);
    totals.taxRate = `${(tax * 100).toFixed(1)}%`;
    totals.tags = currencyFormat(tags);

    totals.loanTotal = currencyFormat(loanTotal);
    totals.principal = currencyFormat(principal);
    totals.price = currencyFormat(askingPrice);
    totals.downPayment = `-${currencyFormat(downPayment)}`;
    totals.interest = currencyFormat(interest);
    totals.apr = `${(apr * 100).toFixed(1)}%`;
    totals.terms = `${loanTerm} months`;

    totalsCache.vehicleTotal = cashTotal;
    totalsCache.loanVehicleTotal = loanTotal;

    let container = document.getElementById("total-vehicle-cost-table");
    container.innerHTML = nunjucks.render("total-vehicle-cost/index.html", totals);
  }

  function calculateAnnualExpenses() {
    let totals = {};

    let insurance = parse(values["annual-insurance-one"]);
    let miles = parse(values["annual-mileage"]);
    let mpg = parse(values["mpg"]);
    let gasPrice = parse(values["gas-price"]);
    let fuelUsed = Math.round(miles / mpg);
    let fuel = fuelUsed * gasPrice;
    let maintenance = parse(values["annual-maintenance"]);
    let repairs = parse(values["annual-repair"]);

    let annualTotal = insurance + maintenance + repairs + fuel;
    let cashTotal = annualTotal / 12;

    totals.expenses = currencyFormat(annualTotal);
    totals.fuel = currencyFormat(fuel);
    totals.fuelUsed = `${fuelUsed} gallons`;
    totals.miles = `${miles} miles`;
    totals.mpg = mpg;
    totals.gasPrice = currencyFormat(gasPrice);
    totals.insurance = currencyFormat(insurance);
    totals.maintenance = currencyFormat(maintenance);
    totals.repairs = currencyFormat(repairs);

    totalsCache.monthlyExpenses = cashTotal;

    let container = document.getElementById("monthly-expenses-cost-table");
    container.innerHTML = nunjucks.render("additional-annual-expenses/index.html", totals);
  }


  function calculateCostSummary() {
    let totals = {};

    let income = parse(values["annual-income"]);
    let monthlyExpenses = totalsCache.monthlyExpenses;


    if(values["paying-cash"]) {
      totals = {
        paymentType: "Paid in Full",
        cost: currencyFormat(totalsCache.vehicleTotal),
        monthlyCost: currencyFormat(monthlyExpenses),
        incomeShare: Math.round(((monthlyExpenses * 12) / income) * 100)
      };
    }
    else {
      let loanTerm = values["loan-terms-other"] ? Number(values["loan-terms-other"]) : parse(values["loan-terms"]);
      let monthlyPayment = totalsCache.loanVehicleTotal / loanTerm;
      let loanMonthlyCost = monthlyExpenses + monthlyPayment;
      let loanTotalCost = totalsCache.loanVehicleTotal + (loanTerm * monthlyExpenses);
      totals = {
        paymentType: "Financed",
        cost: `${currencyFormat(loanTotalCost)} <small>(after ${loanTerm / 12} years)</small>`,
        monthlyCost: currencyFormat(loanMonthlyCost),
        incomeShare: Math.round(((loanMonthlyCost * 12) / income) * 100)
      };
    }

    let container = document.getElementById("cost-summary");
    container.innerHTML = nunjucks.render("cost-summary/index.html", totals);
  }
})();
