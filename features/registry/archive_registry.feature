Feature: Archive a registry
  As a registry owner
  I want to archive a registry I no longer need active
  So that it stops cluttering my active registry list without losing its data

  @registry
  Scenario: Owner archives a registry
    Given I am already signed in
    And I have created a gift registry
    When I archive the registry
    Then I see the registry marked as archived
    And I see it in the archived section of my registries list

  @registry
  Scenario: Owner unarchives a registry
    Given I am already signed in
    And I have an archived gift registry
    When I unarchive the registry
    Then I see the registry in the active section of my registries list
