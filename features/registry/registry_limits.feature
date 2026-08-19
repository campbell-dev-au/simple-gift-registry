Feature: Registry privacy and limits
  As the person running the site
  I want management pages private to their owners and per-account limits enforced
  So that strangers can't read registries and a scripted account can't fill the database

  @registry
  Scenario: Another signed-in user cannot open someone else's management page
    Given I am already signed in
    And someone else owns a gift registry
    When I try to open the other registry's management page
    Then I see that the page does not exist

  @registry
  Scenario: Owner at the registry limit cannot create another
    Given I am already signed in
    And I already own the maximum number of registries
    When I choose to create a gift registry
    And I submit a title for my registry
    Then I see that I have reached the registry limit

  @registry
  Scenario: Owner at the invitation limit cannot invite another co-owner
    Given I am already signed in
    And I have created a gift registry
    And the registry already has the maximum number of invitations
    When I view the registry
    And I invite "one-more-friend@example.com" as a co-owner
    Then I see that the registry cannot have more co-owners
