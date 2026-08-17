Feature: Edit account name
  As a signed-in user
  I want to update my first and last name from account settings
  So that other people can see who I am around the app

  @account-settings
  Scenario: User updates their name from account settings
    Given I am already signed in
    When I visit my account settings
    And I update my name
    Then I see my updated name in the account menu
