Feature: View my registries
  As a signed-in user
  I want to see a list of my gift registries
  So that I can select the one I want to view or add gifts to

  @registry
  Scenario: Owner sees their own registries listed
    Given I am already signed in
    And I have created a gift registry
    And someone else owns a gift registry
    When I view my registries
    Then I see my registry in the list
    And I do not see the other registry in the list

  @registry
  Scenario: Owner with no registries sees an empty state
    Given I am already signed in
    When I view my registries
    Then I see a message that I have no registries yet
