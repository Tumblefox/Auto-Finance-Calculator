import nunjucks from 'nunjucks';
import * as stepper from "./progress-stepper.js";

(() => {
  const unitOptions = {
    miles: {name: "miles", abbreviation: "mi."},
    kilometers: {name: "kilometers", abbreviation: "km."},
    gallons: {name: "gallons", abbreviation: "gal."},
    litres: {name: "litres", abbreviation: "L"},
    kilowatt_hours: {name: "kilowatt-hours", abbreviation: "kWh"},
    dollars: {symbol: "$", code: "USD"},
    euros: {symbol: "€", code: "EUR"},
    yen: {symbol: "¥", code: "JPY"},
    pounds: {symbol: "£", code: "GBP"}
  }

  var values = {};

  var totalsCache = {
    vehicleTotal: 0,
    loanMonthlyCost: 0,
    loanVehicleTotal: 0,
    monthlyExpenses: 0
  };

  var units = {
    distance: unitOptions.miles,
    volume: unitOptions.gallons,
    currency: unitOptions.dollars,
    energy: unitOptions.kilowatt_hours
  };

  var formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: units.currency.code,
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
      {selector: "#financing-cash", event: "click", function: toggleFinanceOptions},
      {selector: "#financing-loan", event: "click", function: toggleFinanceOptions},
      {selector: "#fuel-type-combustion", event: "click", function: toggleFuelOptions},
      {selector: "#fuel-type-electric", event: "click", function: toggleFuelOptions},
      {selector: "#down-payment-one", event: "keyup", function: downPayments},
      {selector: "#down-payment-two", event: "keyup", function: downPayments},
      {selector: "#electric-efficiency-one", event: "keyup", function: electricEfficiency},
      {selector: "#electric-efficiency-two", event: "keyup", function: electricEfficiency},
      {selector: "#combustion-efficiency-one", event: "keyup", function: combustionEfficiency},
      {selector: "#combustion-efficiency-two", event: "keyup", function: combustionEfficiency},
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
        input.addEventListener("focus", () => input.select());
        return;
      }
    });

    // Set preference inputs
    form.querySelectorAll("select.preference").forEach(select => {
      select.addEventListener("change", () => {
        let key = select.id.replace("preference-", "");
        let value = select.value;
        units[key] = unitOptions[value];

        switch(key) {
          case "distance":
            [
              'label[for="combustion-efficiency-one"] span.distance-value',
              'label[for="combustion-efficiency-two"] span.distance-value',
              'label[for="electric-efficiency-one"] span.distance-value',
              'label[for="electric-efficiency-two"] span.distance-value',
            ].forEach(id => {
              document.querySelector(id).innerText = units.distance.abbreviation;
            });
          case "volume":
            [
              'label[for="combustion-efficiency-one"] span.volume-value',
              'label[for="combustion-efficiency-two"] span.volume-value',
              'label[for="gas-price"] span.volume-value'
            ].forEach(id => {
              document.querySelector(id).innerText = units.volume.abbreviation;
            });
          case "currency":
            formatter = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: units.currency.code,
            });
            [
              'label[for="down-payment-one"]'
            ].forEach(id => {
              document.querySelector(id).innerText = units.currency.symbol;
            });
            break;
        }

        loadResults();
      })
    });

    stepper.initializeStepper();
  }

  function loadResults() {
    try {
      parseValues();
      calculate();
    }
    catch(error) {
      console.log("Results Error");
      console.log(error);
    }
  }

  function formSubmission(ev) {
    ev.preventDefault();
    loadResults();
    stepper.specifyStep("cost-breakdown");
  }

  function toggleFinanceOptions(ev) {
    let container = document.getElementById("financing-options");
    if(ev.target.value === "cash") {
      container.classList.add("hidden");
    }
    else {
      container.classList.remove("hidden");
    }
  }

  function toggleFuelOptions(ev) {
    let combustionContainer = document.getElementById("combustion-options");
    let electricContainer = document.getElementById("electric-options");
    if(ev.target.value === "combustion") {
      electricContainer.classList.add("hidden");
      combustionContainer.classList.remove("hidden");
    }
    else {
      electricContainer.classList.remove("hidden");
      combustionContainer.classList.add("hidden");
    }
  }

  function downPayments(ev) {
    try {
      let price = document.querySelector("#asking-price").value;
      if(Number(price) == 0) {
        return;
      }

      if(ev.target.id === "down-payment-one") {
        let value = document.querySelector("#down-payment-one").value;
        if(Number(value) == 0) {
          return;
        }
        document.querySelector("#down-payment-two").value = Number(((value / price) * 100).toFixed(2));
      }
      else {
        let value = document.querySelector("#down-payment-two").value;
        if(Number(value) == 0) {
          return;
        }

        document.querySelector("#down-payment-one").value = Number(((value / 100) * price).toFixed(2));
      }
    }
    catch(error) {
      console.log(`An error occurred calculating the down payment: ${error}`);
    }
  }

  function electricEfficiency(ev) {
    try {
      if(ev.target.id === "electric-efficiency-one") {
        let unitPerkWh = ev.target.value;
        document.querySelector("#electric-efficiency-two").value = Number(((1 / unitPerkWh) * 100).toFixed(2));
      }
      else {
        let kWhPer100Units = ev.target.value;
        document.querySelector("#electric-efficiency-one").value = Number((100 / kWhPer100Units).toFixed(2));
      }
    }
    catch(error) {
      console.log(`An error occurred calculating EV efficiency: ${error}`);
    }
  }

  function combustionEfficiency(ev) {
    try {
      if(ev.target.id === "combustion-efficiency-one") {
        let unitPerVolume = ev.target.value;
        document.querySelector("#combustion-efficiency-two").value = Number(((1 /  unitPerVolume) * 100).toFixed(2));
      }
      else {
        let volumePer100Units = ev.target.value;
        document.querySelector("#combustion-efficiency-one").value = Number((100 / volumePer100Units).toFixed(2));
      }
    }
    catch(error) {
      console.log(`An error occurred calculating ICE vehicle efficiency: ${error}`);
    }
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
    catch(error) {
      console.log(`An error occurred calculating insurance cost: ${error}`);
    }
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

    values["paying-cash"] = document.getElementById("financing-cash").checked;
    values["combustion-fuel"] = document.getElementById("fuel-type-combustion").checked;
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
    let loanTerm = values["loan-terms-other"]
    ? Number(values["loan-terms-other"])
    : parse(values["loan-terms"]);
    let apr = parse(values["apr"]) / 100;
    let r = apr / 12;

    let cost = askingPrice - tradeIn;
    let cashTax = cost * tax;
    let cashTotal = cost + cashTax + fees + tags;

    let loanCost = cost - downPayment;
    let loanTax = cost * tax;
    let principal = loanCost + loanTax;
    let financeTotal = ((principal * loanTerm * r) / (1 - Math.pow(1 + r, -loanTerm)));
    let loanTotal = financeTotal + downPayment + fees + tags;
    let interest = financeTotal - principal;

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
    let milage = parse(values["annual-mileage"]);
    let maintenance = parse(values["annual-maintenance"]);
    let repairs = parse(values["annual-repair"]);

    let distanceUnit = units.distance;
    let fuelUnit;

    let efficiency;
    let efficiencyUnits;
    let fuelPrice;
    let fuelUsed;
    let fuel;

    let combustionFuelUsed = values["combustion-fuel"];
    if(combustionFuelUsed) {
      efficiency = parse(values["combustion-efficiency-one"]);
      fuelPrice = parse(values["gas-price"]);
      fuelUsed = Math.round(milage / efficiency);
      fuel = fuelUsed * fuelPrice;
      fuelUnit = units.volume;
    }
    else {
      efficiency = parse(values["electric-efficiency-one"]);
      fuelPrice = parse(values["electricity-price"]);
      fuelUsed = Math.round(milage / efficiency);
      fuel = fuelUsed * fuelPrice;
      fuelUnit = units.energy;
    }

    efficiencyUnits = `${distanceUnit.abbreviation}/${fuelUnit.abbreviation}`;

    let annualTotal = insurance + maintenance + repairs + fuel;
    let cashTotal = annualTotal / 12;

    totals.expenses = currencyFormat(annualTotal);
    totals.fuel = currencyFormat(fuel);
    totals.fuelUsed = fuelUsed.toLocaleString();
    totals.annualMilage = milage.toLocaleString();
    totals.efficiency = efficiency;
    totals.fuelPrice = currencyFormat(fuelPrice);
    totals.insurance = currencyFormat(insurance);
    totals.maintenance = currencyFormat(maintenance);
    totals.repairs = currencyFormat(repairs);

    totals.efficiencyUnits = efficiencyUnits;
    totals.distanceUnit = distanceUnit;
    totals.fuelUnit = fuelUnit;


    totalsCache.monthlyExpenses = cashTotal;

    let container = document.getElementById("monthly-expenses-cost-table");
    container.innerHTML = nunjucks.render("additional-annual-expenses/index.html", totals);
  }


  function calculateCostSummary() {
    let totals = {};

    let income = parse(values["annual-income"]);
    let ownershipDuration = parse(values["ownership-time"]);
    let monthlyExpenses = totalsCache.monthlyExpenses;


    if(values["paying-cash"]) {
      // Cash total = total vehicle cost + (monthly expenses * ownership time in years)
      let cashTotalCost = totalsCache.vehicleTotal + (ownershipDuration * monthlyExpenses);
      let cashCostIncomeShare = Math.round(((monthlyExpenses * 12) / income) * 100);
      let cashOwnerDuration = `<small>(after ${ownershipDuration} years)</small>`;

      totals = {
        paymentType: "Paid with Cash",
        cost: `${currencyFormat(cashTotalCost)} ${cashOwnerDuration}`,
        monthlyCost: currencyFormat(monthlyExpenses),
        incomeShare: cashCostIncomeShare
      };
    }
    else {
      // Loan total = total loan cost + (monthly expenses * ownership time in years)
      let loanTerm = values["loan-terms-other"]
      ? Number(values["loan-terms-other"])
      : parse(values["loan-terms"]);

      let monthlyPayment = totalsCache.loanVehicleTotal / loanTerm;
      let loanMonthlyCost = monthlyExpenses + monthlyPayment;
      let loanTotalCost = totalsCache.loanVehicleTotal + (ownershipDuration * monthlyExpenses);
      let loanCostIncomeShare = Math.round(((loanMonthlyCost * 12) / income) * 100);
      let loanOwnerDuration = ((loanTerm / 12) - ownershipDuration) <= 0
      ? `<small>(after ${ownershipDuration} years)</small>`
      : `<small>(after ${ownershipDuration} years; ${(loanTerm / 12) - ownershipDuration} years left on loan)</small>`;

      totals = {
        paymentType: "Paid with a Loan",
        cost: `${currencyFormat(loanTotalCost)} ${loanOwnerDuration}`,
        monthlyCost: currencyFormat(loanMonthlyCost),
        incomeShare: loanCostIncomeShare
      };
    }

    let container = document.getElementById("cost-summary");
    container.innerHTML = nunjucks.render("cost-summary/index.html", totals);
  }
})();
