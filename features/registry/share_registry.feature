Feature: Share a registry
  As a registry owner
  I want to share my registry with a link
  So that people can view it and claim gifts without needing an account

  @registry
  Scenario: Owner sees their registry's share link
    Given I am already signed in
    And I have created a gift registry
    When I view the registry
    Then I see a link I can share with others

  @registry
  Scenario: Owner regenerates the share link
    Given I am already signed in
    And I have created a gift registry
    When I view the registry
    And I get a new share link
    Then the old share link no longer works
