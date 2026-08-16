Feature: Create an account
  As a visitor
  I want to create an account using my email address and a password
  So that I can access my own gift registry

  @auth
  Scenario: Visitor signs up with a new email and password
    Given I am on the homepage
    When I choose to create an account
    And I sign up with a new email address and a valid password
    And I enter the emailed verification code
    Then I am signed in
    And I see my email address on the homepage
