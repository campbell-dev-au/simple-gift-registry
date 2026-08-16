Feature: Create a gift registry
  As a signed-in user
  I want to create a gift registry
  So that I have a place to list gifts I'd like to receive

  @registry
  Scenario: Signed-in user creates a registry
    Given I am already signed in
    When I choose to create a gift registry
    And I submit a title for my registry
    Then I see my new registry's title

  Scenario: Signed-out visitor cannot create a registry
    Given I have not signed in
    When I try to visit the create-registry page directly
    Then I am redirected to sign in
