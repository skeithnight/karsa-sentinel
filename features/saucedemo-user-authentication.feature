@automated @karsa-sentinel
Feature: SauceDemo User Authentication

  @automated
  Scenario: Standard User Successful Login
    Given user navigates to "https://www.saucedemo.com/"
    When user enters username "standard_user"
    And user enters password "secret_sauce"
    And user clicks the Login button
    Then user is redirected to "/inventory.html"
    And header title displays "Products"

  @automated
  Scenario: Locked Out User Error Feedback
    Given user navigates to "https://www.saucedemo.com/"
    When user enters username "locked_out_user"
    And user enters password "secret_sauce"
    And user clicks the Login button
    Then error message "Epic sadface: Sorry, this user has been locked out." is displayed

  @automated
  Scenario: Empty Username Validation
    Given user navigates to "https://www.saucedemo.com/"
    When user enters password "secret_sauce" with empty username
    And user clicks the Login button
    Then error message "Epic sadface: Username is required" is displayed
