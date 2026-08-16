Feature: Add a gift to a registry
  As a registry owner
  I want to add a gift to my registry
  So that people know what I'd like to receive

  @registry
  Scenario: Owner adds a gift to their registry
    Given I am already signed in
    And I have created a gift registry
    When I add a gift with a name and notes
    Then I see the gift in my registry's gift list

  @registry
  Scenario: Non-owner cannot add a gift to someone else's registry
    Given I am already signed in
    And someone else owns a gift registry
    When I visit their registry
    Then I do not see a way to add a gift
