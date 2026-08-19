Feature: Protect a registry with a password
  As a registry owner
  I want to require a password before guests can open my share link
  So that the registry stays private even if the link is forwarded further than I intended

  @registry
  Scenario: Owner sets a share password
    Given I am already signed in
    And I have created a gift registry
    When I view the registry
    And I set the share password "tulips2026"
    Then I see that guests now need a password

  @registry
  Scenario: Owner reveals the share password
    Given I am already signed in
    And I have created a gift registry
    And the registry is protected with the password "tulips2026"
    When I view the registry
    Then the share password is hidden
    When I choose to show the share password
    Then I see the share password "tulips2026"

  @registry
  Scenario: Owner copies the share password
    Given I am already signed in
    And I have created a gift registry
    And the registry is protected with the password "tulips2026"
    When I view the registry
    And I copy the share password
    Then the share password "tulips2026" is on my clipboard

  @registry
  Scenario: Guest without the password cannot see the gifts
    Given someone has a gift registry
    And the registry has a gift
    And the registry is protected with the password "tulips2026"
    When I open the registry's share link
    Then I am asked for the registry password
    And I do not see the gift

  @registry
  Scenario: Guest with the password sees the registry
    Given someone has a gift registry
    And the registry has a gift
    And the registry is protected with the password "tulips2026"
    When I open the registry's share link
    And I enter the registry password "tulips2026"
    Then I see the gift

  @registry
  Scenario: Guest with the wrong password stays locked out
    Given someone has a gift registry
    And the registry has a gift
    And the registry is protected with the password "tulips2026"
    When I open the registry's share link
    And I enter the registry password "wrong-guess"
    Then I see that the password is not right
    And I do not see the gift

  @registry
  Scenario: Owner is not asked for the password on their own registry
    Given I am already signed in
    And I have created a gift registry
    And the registry is protected with the password "tulips2026"
    When I open the registry's share link
    Then I am not asked for the registry password

  @registry
  Scenario: Owner removes the password
    Given I am already signed in
    And I have created a gift registry
    And the registry is protected with the password "tulips2026"
    When I view the registry
    And I remove the share password
    Then I see that a password can be set again
