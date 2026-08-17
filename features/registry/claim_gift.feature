Feature: Claim a gift from a shared registry
  As a guest with a registry's share link
  I want to claim a gift using my own account
  So that other guests know it's covered, without anyone seeing who claimed what

  @share
  Scenario: Signed-in guest claims a gift
    Given someone has a gift registry
    And the registry has a gift
    And I am already signed in
    When I open the registry's share link
    And I claim the gift
    Then I see the gift marked as claimed by me

  @share
  Scenario: Other guests see a claim but not who made it, and cannot unclaim it
    Given someone has a gift registry
    And the registry has a gift
    And the gift has been claimed by someone else
    And I am already signed in
    When I open the registry's share link
    Then I see the gift is claimed
    And I do not see who claimed it
    And I do not see a way to unclaim it

  @share
  Scenario: Guest unclaims their own claim
    Given someone has a gift registry
    And the registry has a gift
    And I am already signed in
    And I have claimed the gift
    When I open the registry's share link
    And I unclaim the gift
    Then I see the gift is available to claim again

  @share
  Scenario: Signed-out visitor is prompted to sign in before claiming
    Given someone has a gift registry
    And the registry has a gift
    When I open the registry's share link
    Then I am prompted to sign in to claim the gift

  @registry
  Scenario: Owner does not see claim status on their own registry page
    Given I am already signed in
    And I have created a gift registry
    And the registry has a gift
    And the gift has been claimed by someone else
    When I view the registry
    Then I do not see who claimed the gift

  @share
  Scenario: Guest claims part of a gift's quantity, leaving the rest available
    Given someone has a gift registry
    And the registry has a gift with a quantity of 5
    And I am already signed in
    When I open the registry's share link
    And I claim 2 of the gift
    Then I see the gift marked as claimed by me for 2
    And I see 3 remaining

  @share
  Scenario: Other guests see the remaining quantity after a partial claim, without seeing who claimed it
    Given someone has a gift registry
    And the registry has a gift with a quantity of 5
    And 2 of the gift have been claimed by someone else
    And I am already signed in
    When I open the registry's share link
    Then I see 3 remaining
    And I do not see who claimed it

  @share
  Scenario: Guest cannot claim more than what remains
    Given someone has a gift registry
    And the registry has a gift with a quantity of 5
    And 4 of the gift have been claimed by someone else
    And I am already signed in
    When I open the registry's share link
    Then the most I can claim is 1

  @share
  Scenario: Claiming the last of a gift's quantity marks it fully claimed
    Given someone has a gift registry
    And the registry has a gift with a quantity of 2
    And I am already signed in
    When I open the registry's share link
    And I claim 2 of the gift
    Then I see the gift is claimed
