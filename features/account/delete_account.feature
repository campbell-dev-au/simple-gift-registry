Feature: Delete my data or my account
  As an account holder
  I want to delete everything I've stored, or the whole account
  So that nothing about me is kept when I stop using the site

  @account-deletion
  Scenario: Delete all my data but keep the account
    Given I am already signed in
    And I have created a gift registry
    When I delete all my account data
    Then I see confirmation that my data was deleted
    When I view my registries
    Then I see a message that I have no registries yet

  @account-deletion
  Scenario: Delete my account entirely
    Given I am already signed in
    When I delete my account
    Then I am signed out
