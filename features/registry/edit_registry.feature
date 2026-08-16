Feature: Edit a gift registry
  As a registry owner
  I want to edit my registry's title and event date
  So that I can correct or update its details after creating it

  @registry
  Scenario: Owner edits their registry's title
    Given I am already signed in
    And I have created a gift registry
    When I edit the registry's title
    Then I see the updated title on the registry page

  @registry
  Scenario: Non-owner cannot edit someone else's registry
    Given I am already signed in
    And someone else owns a gift registry
    When I visit their registry
    Then I do not see a way to edit the registry
