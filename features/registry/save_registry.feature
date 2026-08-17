Feature: Save a shared registry to my account
  As a guest with a registry's share link
  I want to save it to my account
  So that I can find it again later without needing the link a second time

  @share
  Scenario: Signed-in guest saves a shared registry
    Given someone has a gift registry
    And I am already signed in
    When I open the registry's share link
    And I save the registry
    Then I see the registry marked as saved
    And I see the registry in my saved registries list

  @share
  Scenario: Signed-in guest removes a saved registry from the share link
    Given someone has a gift registry
    And I am already signed in
    And I have saved the registry
    When I open the registry's share link
    And I remove the registry from my saved registries
    Then I do not see the registry in my saved registries list

  @share
  Scenario: Signed-in guest removes a saved registry from their registries list
    Given someone has a gift registry
    And I am already signed in
    And I have saved the registry
    When I view my registries
    And I remove the saved registry
    Then I do not see the registry in my saved registries list

  @share
  Scenario: Signed-out visitor is prompted to sign in before saving
    Given someone has a gift registry
    When I open the registry's share link
    Then I am prompted to sign in to save the registry

  @share
  Scenario: Registry owner does not see a way to save their own registry
    Given I am already signed in
    And I have created a gift registry
    When I open the registry's share link
    Then I do not see a way to save the registry
