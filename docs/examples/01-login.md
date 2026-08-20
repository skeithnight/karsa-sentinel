# Feature: SauceDemo User Authentication

## Target URL
`https://www.saucedemo.com/`

## Scenarios

### Scenario 1: Standard User Successful Login
- **Given** user navigates to `https://www.saucedemo.com/`
- **When** user enters username `standard_user`
- **And** user enters password `secret_sauce`
- **And** user clicks the Login button
- **Then** user is redirected to `/inventory.html`
- **And** header title displays "Products"

### Scenario 2: Locked Out User Error Feedback
- **Given** user navigates to `https://www.saucedemo.com/`
- **When** user enters username `locked_out_user`
- **And** user enters password `secret_sauce`
- **And** user clicks the Login button
- **Then** error message "Epic sadface: Sorry, this user has been locked out." is displayed

### Scenario 3: Empty Username Validation
- **Given** user navigates to `https://www.saucedemo.com/`
- **When** user enters password `secret_sauce` with empty username
- **And** user clicks the Login button
- **Then** error message "Epic sadface: Username is required" is displayed
