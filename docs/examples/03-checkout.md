# Feature: SauceDemo Checkout Workflow

## Target URL
`https://www.saucedemo.com/`

## Scenarios

### Scenario 1: Complete Shopping Flow to Checkout Overview
- **Given** user navigates to `https://www.saucedemo.com/`
- **When** user enters username `standard_user`
- **And** user enters password `secret_sauce`
- **And** user clicks the Login button
- **And** user clicks "Add to cart" on Sauce Labs Backpack
- **Then** shopping cart badge count updates to "1"
- **And** user is redirected to `/inventory.html`
