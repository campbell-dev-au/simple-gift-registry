Feature: Claim a gift from a shared registry
  As a guest with a registry's share link
  I want to claim a gift without creating an account
  So that other guests know it's already covered

  @share
  Scenario: Guest claims a gift
    Given someone has a gift registry
    And the registry has a gift
    When I open the registry's share link
    And I claim the gift with my name
    Then I see the gift marked as claimed by my name

  @share
  Scenario: Guest unclaims a gift
    Given someone has a gift registry
    And the registry has a gift
    And the gift has been claimed
    When I open the registry's share link
    And I unclaim the gift
    Then I see the gift is available to claim again

  @registry
  Scenario: Owner does not see claim status on their own registry page
    Given I am already signed in
    And I have created a gift registry
    And the registry has a gift
    And the gift has been claimed
    When I view the registry
    Then I do not see who claimed the gift
