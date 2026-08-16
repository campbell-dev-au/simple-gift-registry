Feature: Edit a gift on a registry
  As a registry owner
  I want to edit a gift on my registry
  So that I can correct its name, notes, or quantity

  @registry
  Scenario: Owner edits a gift's details
    Given I am already signed in
    And I have created a gift registry
    And the registry has a gift
    When I edit the gift's details
    Then I see the updated gift details in the registry's gift list
