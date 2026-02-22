# Auto Finance Calculator
Calculate a vehicle's total cost of ownership factoring in maintenance, insurance, fuel, financing, and more over any time horizon.

## Getting Started
🔗 Live Demo: [https://tumblefox.github.io/Auto-Finance-Calculator](https://tumblefox.github.io/Auto-Finance-Calculator/)

📸 Screenshot:

## Features
- Adjustable units (measurement or metric) and currency (dollars, euros, pounds, yen)
- Adjustable ownership horizon (1–15+ years)
- Customizable fuel efficiency, fuel price, fuel type (combustion or electric)
- Loan financing calculation (APR, term, down payment)
- Annual insurance and maintenance inputs
- Total cost breakdown, including cost-per-year

## How it Works

### Tech Stack
- HTML, Nunjucks
- CSS, Tailwind
- JavaScript
- Eleventy

### 🧠 Calculation Logic
The total cost of ownership is computed as:

Total Cost =
  **Total Vehicle Cost**
+ **Fuel Costs**
+ **Insurance**
+ **Maintenance**

**Total Vehicle Cost** can be one of two things:
- the asking price + tax + registration + fees
- finance total + down payment + fees + tags;

finance total = ((principal * loanTerm * r) / (1 - Math.pow(1 + r, -loanTerm))), where r = APR / 12 and principal = asking price + down payment + tax

In either case, the trade-in value subtracts from the asking price. Depreciation loss is not included as it's only realized when the vehicle is sold.

**Fuel Costs** = annual distance driven * cost per mile * ownership duration, where cost per mile = (annual distance driven / distance per fuel unit) * cost per fuel unit

### TODO:
- Install and bundle Tailwind
