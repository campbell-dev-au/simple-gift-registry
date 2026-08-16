Feature: Remove a gift from a registry
  As a registry owner
  I want to remove a gift from my registry
  So that I can keep my list accurate

  @registry
  Scenario: Owner removes a gift from their registry
    Given I am already signed in
    And I have created a gift registry
    And the registry has a gift
    When I remove the gift
    Then I no longer see the gift in the registry's gift list
