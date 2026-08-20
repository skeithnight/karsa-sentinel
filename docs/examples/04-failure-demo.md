# Feature: SauceDemo Failure Screenshot Demonstration

## Target URL
`https://www.saucedemo.com/`

## Scenarios

### Scenario 1: Intentional Failure to Capture Screenshot in Report
- **Given** user navigates to `https://www.saucedemo.com/`
- **When** user enters username `standard_user`
- **And** user enters password `secret_sauce`
- **And** user clicks the Login button
- **Then** error message "NonExistent Welcome Banner 50% Off" is displayed
