Feature: Sign in to an existing account
  As a registered user
  I want to sign in with my email address and password
  So that I can access my own gift registry on a return visit

  @sign-in
  Scenario: Registered user signs in with correct credentials
    Given I have an existing account
    And I am on the homepage
    When I choose to sign in
    And I sign in with my email address and password
    And I verify this device with the emailed code
    Then I am signed in
    And I see my email address on the homepage
